const form = document.querySelector('#loginForm');
const message = document.querySelector('#loginMessage');
const submit = document.querySelector('#loginSubmit');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  submit.disabled = true;
  submit.innerHTML = '<span><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock" style="margin-right:6px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Iniciando sesión…</span>';
  window.nexLoader?.show('Iniciando sesión');
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.querySelector('#loginEmail').value,
        password: document.querySelector('#loginPassword').value,
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'No se pudo iniciar sesión');

    localStorage.setItem('nex24-supabase-session', JSON.stringify(result.session));
    localStorage.setItem('nex24-current-account', JSON.stringify(result.profile));
    window.nexToast?.success('Sesión iniciada con éxito. Redirigiendo...', 'Bienvenido');
    setTimeout(() => {
      window.location.href = '/emprendedores';
    }, 400);
  } catch (error) {
    message.textContent = error.message;
    message.className = 'form-message visible error';
    window.nexToast?.error(error.message, 'Inicio de Sesión');
    window.nexLoader?.hide(120);
  } finally {
    submit.disabled = false;
    submit.innerHTML = '<span><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-log-in" style="margin-right:6px;"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>Ingresar al Panel Comercial</span> <span class="btn-arrow" aria-hidden="true">→</span>';
  }
});

// Alternar visibilidad de contraseña
const togglePwd = document.querySelector('#togglePasswordBtn');
const pwdInput = document.querySelector('#loginPassword');
if (togglePwd && pwdInput) {
  togglePwd.addEventListener('click', () => {
    const isPassword = pwdInput.type === 'password';
    pwdInput.type = isPassword ? 'text' : 'password';
    togglePwd.innerHTML = isPassword ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye-off"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
    togglePwd.setAttribute('aria-label', isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
  });
}

// Ayuda contextual para contraseña olvidada
const forgotBtn = document.querySelector('#forgotPasswordLink');
if (forgotBtn) {
  forgotBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (window.nexToast) {
      window.nexToast.info('Si olvidaste tu contraseña o deseas crear un nuevo negocio de prueba, regístrate en /registro.', 'Acceso Comercial');
    } else {
      alert('Si olvidaste tu contraseña, crea una nueva cuenta de prueba en /registro.');
    }
  });
}
