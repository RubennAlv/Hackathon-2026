/**
 * Script de reinicio y preparación del entorno de pruebas limpio desde 0.
 * Restaura la base de datos local y limpia sesiones anteriores.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA_DIR, 'local_db.json');

const INITIAL_DB = {
  users: [
    {
      id: "admin_01",
      email: "admin@nex24.com",
      password: "demo",
      role: "admin",
      business_name: "Supervisión y Verificación Durango",
      responsible_name: "Coordinador Comercial NEX24",
      phone: "6181234500",
      address: "Palacio de Gobierno / Centro, Durango",
      schedule: "Lunes a Viernes 8:00 AM - 5:00 PM",
      zone: "Centro",
      category: "Administración",
      products: "Sellos de Verificación Oficial",
      capacity: "Auditoría regional",
      status: "approved",
      created_at: new Date().toISOString()
    },
    {
      id: "biz_01",
      email: "proveedor@nex24.com",
      password: "demo",
      role: "proveedor",
      business_name: "Café Sierra Madre Tostadores",
      responsible_name: "Martín Soto",
      phone: "5216180000001",
      address: "Av. 20 de Noviembre #805, Zona Centro, Durango",
      schedule: "Lunes a Sábado 8:00 AM - 6:00 PM",
      zone: "Centro",
      category: "cafe",
      products: "Café tostado en grano 500g, Café molido 250g",
      capacity: "120 kg/semana",
      status: "approved",
      created_at: new Date().toISOString()
    },
    {
      id: "biz_02",
      email: "tiendita@nex24.com",
      password: "demo",
      role: "tiendita",
      business_name: "Abarrotes y Tiendita El Centro",
      responsible_name: "Guadalupe Hernández",
      phone: "5216180000002",
      address: "Calle 5 de Febrero #402, Zona Centro, Durango",
      schedule: "24 Horas",
      zone: "Centro",
      category: "Abarrotes",
      products: "Insumos y abasto regional",
      capacity: "Consumo semanal frecuente",
      status: "approved",
      created_at: new Date().toISOString()
    }
  ]
};

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
console.log('✓ [ENTORNO LISTO] Base de datos local restablecida correctamente.');
console.log('✓ Se han preparado cuentas limpias para pruebas manuales:');
console.log('  - Tiendita: tiendita@nex24.com (password: 123456 o demo)');
console.log('  - Proveedor: proveedor@nex24.com (password: 123456 o demo)');
console.log('  - Admin: admin@nex24.com (password: demo)');
console.log('✓ Puedes registrar nuevas cuentas reales en http://localhost:3001/registro');
