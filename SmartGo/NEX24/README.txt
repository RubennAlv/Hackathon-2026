NEX24 - Plantilla inicial para Visual Studio Code

ABRIR:
1. Clona el repositorio (o descarga el ZIP y extráelo).
2. Abre VS Code y selecciona Archivo > Abrir carpeta.
3. Selecciona la carpeta NEX24.
4. Abre index.html.
5. Usa Live Server (clic derecho > Open with Live Server).

ARCHIVOS:
- index.html: página principal.
- pages/lens.html: Lens IA (foto → productor local).
- pages/tienda.html: vista inicial de autoservicio.
- pages/emprendedores.html: panel administrativo de demostración.
- css/: estilos (lens.css es solo para Lens IA).
- js/app.js: catálogo ilustrativo.
- js/lens.js: conexión con la API de Lens.
- assets/images/: no incluida; créala si vas a usar imágenes propias.

BACKEND (Lens Local):
- HANDOFF.md: contexto y estado del backend.
- README.md: cómo levantar la API y ejemplo de uso desde el frontend.
- vision.js: Gemini, modo mock y fallback.
- server.js: API Express (escaneo, health y catálogo).
- matcher.js: lógica de matching entre detecciones y productores.
- productores.json: catálogo ficticio de 14 productores.
- scripts/: pruebas y prueba manual de Gemini.
- package.json y env.example: dependencias y variables de entorno del servidor.

FUNCIONALIDAD DEL PROTOTIPO:
- La tienda permite agregar productos empaquetados o productos a granel por peso.
- El peso puede registrarse como báscula digital simulada o captura manual.
- El precio se calcula por peso y precio por kilogramo.
- El pago es una simulación y descuenta existencias automáticamente.
- El panel de emprendedores refleja ventas, alertas e inventario actualizado.

IMPORTANTE:
Los datos se guardan en localStorage del navegador para la demostración.
No incluye base de datos, autenticación real, pagos, báscula física ni control de acceso.
