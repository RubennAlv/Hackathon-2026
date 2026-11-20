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
