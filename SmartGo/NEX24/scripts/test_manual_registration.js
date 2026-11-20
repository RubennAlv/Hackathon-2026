import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');
const PORT = 3288;
const BASE_URL = `http://localhost:${PORT}`;

const serverProcess = fork(path.join(ROOT, 'server.js'), [], {
  env: { ...process.env, PORT, MOCK: 'true' },
  stdio: 'pipe'
});

// Esperar servidor
let ready = false;
for (let i = 0; i < 25; i++) {
  try {
    const r = await fetch(`${BASE_URL}/api/catalogo`);
    if (r.ok) { ready = true; break; }
  } catch {
    await new Promise(r => setTimeout(r, 200));
  }
}
if (!ready) {
  serverProcess.kill();
  throw new Error('Servidor no disponible en puerto ' + PORT);
}

const TEST_EMAIL = `test_${Date.now()}@durangocomercios.com`;
const TEST_PASSWORD = 'passwordReal123';

console.log('\n--- 1. Probando Registro Manual desde Cero ---');

const resReg = await fetch(`${BASE_URL}/api/registros`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tipo: 'proveedor',
    nombre: 'Quesos y Cremería Los Pinos',
    responsable: 'Mateo Enns',
    email: TEST_EMAIL,
    telefono: '6189988776',
    direccion: 'Nuevo Ideal Km 45, Durango',
    horario: 'Lunes a Viernes 7:00 AM - 4:00 PM',
    zona: 'Nuevo Ideal',
    categoria: 'queso',
    productos: 'Queso menonita fresco, Mantequilla de rancho',
    capacidad: '200 kg/semana',
    password: TEST_PASSWORD
  })
});

const jsonReg = await resReg.json();
console.log('Respuesta Registro:', resReg.status, jsonReg);
assert.equal(resReg.status, 201);
assert.equal(jsonReg.ok, true);
assert.equal(jsonReg.registro.business_name, 'Quesos y Cremería Los Pinos');
assert.equal(jsonReg.registro.email, TEST_EMAIL);

console.log('\n--- 2. Probando Inicio de Sesión Manual con Credenciales Reales ---');

const resLogin = await fetch(`${BASE_URL}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  })
});

const jsonLogin = await resLogin.json();
console.log('Respuesta Login:', resLogin.status, jsonLogin);
assert.equal(resLogin.status, 200);
assert.equal(jsonLogin.ok, true);
assert.ok(jsonLogin.session && jsonLogin.session.access_token);
assert.equal(jsonLogin.profile.email, TEST_EMAIL);
assert.equal(jsonLogin.profile.role, 'proveedor');

const token = jsonLogin.session.access_token;
const resMe = await fetch(`${BASE_URL}/api/auth/me`, {
  headers: { Authorization: `Bearer ${token}` }
});
const jsonMe = await resMe.json();
console.log('Respuesta Auth Me:', resMe.status, jsonMe);
assert.equal(resMe.status, 200);
assert.equal(jsonMe.ok, true);
assert.equal(jsonMe.profile.business_name, 'Quesos y Cremería Los Pinos');

console.log('\n--- 3. Verificando Rechazo de Contraseña Incorrecta ---');
const resBad = await fetch(`${BASE_URL}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: TEST_EMAIL,
    password: 'passwordEquivocada'
  })
});
assert.equal(resBad.status, 401);
console.log('✓ Contraseña errónea rechazada correctamente con HTTP 401');

serverProcess.kill();
console.log('\n🎉 ¡Flujo de Registro y Login Manual 100% verificado y funcionando desde 0!\n');
process.exit(0);
