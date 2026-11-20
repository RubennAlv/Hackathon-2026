const roleButtons = document.querySelectorAll('.role-option');
const roleInput = document.querySelector('#tipo');
const formTitle = document.querySelector('#formTitle');
const submitButton = document.querySelector('#submitRegistration');
const form = document.querySelector('#registrationForm');
const message = document.querySelector('#registrationMessage');

function showMessage(text, type) {
  message.textContent = text;
  message.className = `form-message visible ${type}`;
}

roleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const role = button.dataset.role;
    roleButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-checked', String(active));
    });

    roleInput.value = role;
    formTitle.textContent = role === 'tiendita' ? 'Datos de tu tiendita' : 'Datos de tu proveedor';
    submitButton.textContent = role === 'tiendita' ? 'Crear cuenta de tiendita' : 'Crear cuenta de proveedor';
    document.querySelectorAll('.tiendita-fields').forEach((field) => field.classList.toggle('visible', role === 'tiendita'));
    document.querySelectorAll('.proveedor-fields').forEach((field) => field.classList.toggle('visible', role === 'proveedor'));
  });
});

const locationButton = document.querySelector('#usarUbicacion');
const locationStatus = document.querySelector('#ubicacionEstado');
const latInput = document.querySelector('#lat');
const lngInput = document.querySelector('#lng');

function setLocationStatus(texto, ok) {
  if (!locationStatus) return;
  locationStatus.textContent = texto;
  locationStatus.style.color = ok ? 'var(--nex-emerald)' : 'var(--nex-text-secondary)';
}

locationButton?.addEventListener('click', () => {
  if (!navigator.geolocation) {
    setLocationStatus('Tu navegador no soporta ubicación; usaremos la dirección.', false);
    return;
  }
  locationButton.disabled = true;
  setLocationStatus('Obteniendo tu ubicación…', false);
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      latInput.value = coords.latitude.toFixed(6);
      lngInput.value = coords.longitude.toFixed(6);
      setLocationStatus('✓ Ubicación capturada. Tu local aparecerá en el mapa.', true);
      locationButton.disabled = false;
    },
    (error) => {
      setLocationStatus(
        error.code === 1
          ? 'Permiso denegado. Usaremos la dirección para ubicarte.'
          : 'No pudimos obtener tu ubicación. Usaremos la dirección.',
        false
      );
      locationButton.disabled = false;
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
  );
});

form.addEventListener('submit', async (event) => {
  event.preventEvent?.();
  event.preventDefault();

  const data = Object.fromEntries(new FormData(form).entries());
  const confirm = document.querySelector('#passwordConfirm').value;

  if (data.password !== confirm) {
    showMessage('Las contraseñas no coinciden.', 'error');
    window.nexToast?.error('Las contraseñas no coinciden.', 'Verificación');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Creando cuenta…';
  window.nexLoader?.show('Creando tu cuenta');

  try {
    const response = await fetch('/api/registros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();

    if (!response.ok) throw new Error(result.error || 'No se pudo crear la cuenta');

    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email, password: data.password }),
    });
    const loginResult = await loginResponse.json();

    if (loginResponse.ok) {
      localStorage.setItem('nex24-supabase-session', JSON.stringify(loginResult.session));
      localStorage.setItem('nex24-current-account', JSON.stringify(loginResult.profile));
    }

    showMessage(`Cuenta creada correctamente. Tu registro está ${result.registro.status}.`, 'success');
    window.nexToast?.success('Cuenta comercial creada con éxito. Redirigiendo...', 'Registro Completado');
    form.reset();
    roleInput.value = 'tiendita';

    setTimeout(() => {
      window.location.href = '/emprendedores';
    }, 900);
  } catch (error) {
    showMessage(error.message, 'error');
    window.nexToast?.error(error.message, 'Error de Registro');
    window.nexLoader?.hide(120);
  } finally {
    submitButton.disabled = false;
    if (roleInput.value === 'proveedor') submitButton.textContent = 'Crear cuenta de proveedor';
    else submitButton.textContent = 'Crear cuenta de tiendita';
  }
});
