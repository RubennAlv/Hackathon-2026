import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

const TEST_PORT = 3199;
const BASE_URL = `http://localhost:${TEST_PORT}`;

console.log('====================================================');
console.log('   NEX24 — SUITE DE VALIDACIÓN FINAL Y QA (FASE 12)  ');
console.log('====================================================\n');

let totalChecks = 0;
let passedChecks = 0;

function check(title, condition, details = '') {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✓ [QA PASS] ${title}`);
  } else {
    console.error(`  ✗ [QA FAIL] ${title}: ${details}`);
  }
}

// Iniciar servidor en subproceso con puerto aislado
const serverProcess = fork(path.join(ROOT, 'server.js'), [], {
  env: { ...process.env, PORT: TEST_PORT, MOCK: 'true' },
  stdio: 'pipe'
});

// Esperar a que el servidor esté listo
let serverReady = false;
for (let i = 0; i < 25; i++) {
  try {
    const res = await fetch(`${BASE_URL}/api/catalogo`);
    if (res.ok) {
      serverReady = true;
      break;
    }
  } catch {
    await new Promise((r) => setTimeout(r, 200));
  }
}
if (!serverReady) {
  await new Promise((resolve) => setTimeout(resolve, 1500));
}

try {
  // 1. Verificación de Rutas Públicas Web
  console.log('\n1. Verificación de Vistas HTML y Servidor Web');
  const paginas = [
    { ruta: '/', titulo: 'NEX24 — Plataforma de Comercio Inteligente' },
    { ruta: '/tienda', titulo: 'Mercado Inteligente | NEX24' },
    { ruta: '/lens', titulo: 'Lens IA' },
    { ruta: '/emprendedores', titulo: 'Panel Comercial | NEX24' },
    { ruta: '/login', titulo: 'Iniciar sesión | NEX24' },
    { ruta: '/registro', titulo: 'Registro de negocio | NEX24' }
  ];

  for (const pag of paginas) {
    const res = await fetch(`${BASE_URL}${pag.ruta}`);
    const html = await res.text();
    check(`Página ${pag.ruta} responde HTTP 200`, res.status === 200, `Status: ${res.status}`);
    check(`Página ${pag.ruta} contiene título esperado`, html.includes(pag.titulo), 'Título no coincide');
    check(`Página ${pag.ruta} contiene navegación data-nex-navigation`, html.includes('data-nex-navigation'), 'Falta header unificado');
    check(`Página ${pag.ruta} contiene preconnect de fuentes`, html.includes('fonts.googleapis.com'), 'Falta preconnect');
  }

  // 2. Verificación de Seguridad y Cabeceras HTTP
  console.log('\n2. Verificación de Cabeceras de Seguridad y Políticas');
  const resSec = await fetch(`${BASE_URL}/`);
  check('X-Powered-By está deshabilitado', resSec.headers.get('x-powered-by') === null);
  check('X-Content-Type-Options: nosniff activo', resSec.headers.get('x-content-type-options') === 'nosniff');
  check('X-Frame-Options: SAMEORIGIN activo', resSec.headers.get('x-frame-options') === 'SAMEORIGIN');
  check('Referrer-Policy activo', resSec.headers.get('referrer-policy') === 'strict-origin-when-cross-origin');
  check('Content-Security-Policy presente', resSec.headers.has('content-security-policy'));
  check('Permissions-Policy presente', resSec.headers.has('permissions-policy'));

  // 3. Verificación de Bloqueo de Rutas Sensibles
  console.log('\n3. Verificación de Bloqueo de Archivos Sensibles');
  const resEnv = await fetch(`${BASE_URL}/.env`);
  check('Acceso a /.env bloqueado con 403', resEnv.status === 403);
  const resPkg = await fetch(`${BASE_URL}/package.json`);
  check('Acceso a /package.json bloqueado con 403', resPkg.status === 403);
  const resSql = await fetch(`${BASE_URL}/supabase.sql`);
  check('Acceso a /supabase.sql bloqueado con 403', resSql.status === 403);

  // 4. Verificación de Endpoint 404
  console.log('\n4. Verificación de Manejo Centralizado de Errores 404');
  const resApi404 = await fetch(`${BASE_URL}/api/endpoint-inexistente`);
  const json404 = await resApi404.json();
  check('API 404 devuelve status 404', resApi404.status === 404);
  check('API 404 devuelve estructura JSON { ok: false, error: ... }', json404.ok === false && json404.error === 'Endpoint no encontrado');

  // 5. Verificación del Catálogo Inteligente B2B + B2C
  console.log('\n5. Verificación de API Catálogo (/api/catalogo)');
  const resCat = await fetch(`${BASE_URL}/api/catalogo`);
  const catData = await resCat.json();
  check('Catálogo responde ok: true', catData.ok === true);
  check('Catálogo contiene los 34 productores de Durango', catData.productores && catData.productores.length >= 34);
  
  const sampleProd = catData.productores[0];
  check('Productor tiene productos listados', Array.isArray(sampleProd.productos) && sampleProd.productos.length > 0);
  check('Productor tiene precio menudeo numérico', typeof sampleProd.precio_menudeo === 'number');
  check('Productor tiene precio mayoreo numérico', typeof sampleProd.precio_mayoreo === 'number');
  check('Productor especifica unidad de medida', typeof sampleProd.unidad === 'string');
  check('Productor especifica capacidad semanal', typeof sampleProd.capacidad_semanal === 'string');

  // 6. Verificación de Lens IA (Visión y Matching)
  console.log('\n6. Verificación de Lens IA (/api/lens/scan)');
  const demos = ['cafe', 'miel', 'queso', 'pan', 'mezcal'];
  for (const demo of demos) {
    const resLens = await fetch(`${BASE_URL}/api/lens/scan?demo=${demo}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=' })
    });
    const lensJson = await resLens.json();
    check(`Lens escaneo demo=${demo} responde exitosamente`, lensJson.ok === true && Array.isArray(lensJson.resultados));
    check(`Lens demo=${demo} incluye resultados de productores locales`, lensJson.resultados && lensJson.resultados.length > 0);
    check(`Lens demo=${demo} incluye capacidad semanal y rutas`, lensJson.resultados && !!lensJson.resultados[0].capacidad_semanal);
  }

  // 7. Verificación de Autenticación y Perfiles Demo
  console.log('\n7. Verificación de Autenticación (/api/auth/login y /api/auth/me)');
  // 7.1 Proveedor
  const resLoginProv = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'proveedor@nex24.com', password: 'demo' })
  });
  const dataLoginProv = await resLoginProv.json();
  const tokenProv = dataLoginProv.session?.access_token;
  check('Login proveedor responde token válido', dataLoginProv.ok === true && !!tokenProv);
  
  const resMeProv = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${tokenProv}` }
  });
  const dataMeProv = await resMeProv.json();
  check('Sesión proveedor devuelve rol proveedor', dataMeProv.ok === true && dataMeProv.profile.role === 'proveedor');

  // 7.2 Tiendita
  const resLoginTienda = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'tiendita@nex24.com', password: 'demo' })
  });
  const dataLoginTienda = await resLoginTienda.json();
  const tokenTienda = dataLoginTienda.session?.access_token;
  check('Login tiendita responde token válido', dataLoginTienda.ok === true && !!tokenTienda);

  const resMeTienda = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${tokenTienda}` }
  });
  const dataMeTienda = await resMeTienda.json();
  check('Sesión tiendita devuelve rol tiendita', dataMeTienda.ok === true && dataMeTienda.profile.role === 'tiendita');

  // 7.3 Admin / Moderador
  const resLoginAdmin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@nex24.com', password: 'demo' })
  });
  const dataLoginAdmin = await resLoginAdmin.json();
  const tokenAdmin = dataLoginAdmin.session?.access_token;
  check('Login admin responde token válido', dataLoginAdmin.ok === true && !!tokenAdmin);

  const resMeAdmin = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${tokenAdmin}` }
  });
  const dataMeAdmin = await resMeAdmin.json();
  check('Sesión admin devuelve rol admin', dataMeAdmin.ok === true && dataMeAdmin.profile.role === 'admin');

  // 8. Verificación de Suite Administrativa (/api/admin/negocios)
  console.log('\n8. Verificación de Moderación Comercial de Durango');
  const resAdminNegocios = await fetch(`${BASE_URL}/api/admin/negocios`, {
    headers: { Authorization: `Bearer ${tokenAdmin}` }
  });
  const dataAdminNegocios = await resAdminNegocios.json();
  check('Admin consulta lista de comercios registrados', dataAdminNegocios.ok === true && Array.isArray(dataAdminNegocios.negocios));
  check('Lista de comercios contiene proveedores de Durango', dataAdminNegocios.negocios && dataAdminNegocios.negocios.length >= 1);

  // Actualizar estado de negocio
  const primerNegocio = dataAdminNegocios.negocios[0];
  const resUpdateStatus = await fetch(`${BASE_URL}/api/admin/negocios/${primerNegocio.id}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${tokenAdmin}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: 'approved' })
  });
  const dataUpdate = await resUpdateStatus.json();
  check('Admin puede actualizar estado de verificación a approved', dataUpdate.ok === true && dataUpdate.negocio.status === 'approved');

} catch (err) {
  console.error('\nError inesperado en ejecución de QA:', err);
} finally {
  serverProcess.kill('SIGTERM');
}

console.log('\n====================================================');
console.log(`   RESUMEN FINAL DE QA: ${passedChecks} / ${totalChecks} VALIDACIONES EXITOSAS`);
console.log('====================================================\n');

if (passedChecks === totalChecks) {
  console.log('🎉 TODAS LAS PRUEBAS DE ACEPTACIÓN PASARON SATISFACTORIAMENTE.');
  process.exit(0);
} else {
  console.error('⚠️ ALGUNAS PRUEBAS FALLARON.');
  process.exit(1);
}
