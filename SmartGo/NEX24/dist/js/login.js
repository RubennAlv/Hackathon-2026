const form = document.querySelector('#loginForm');
const message = document.querySelector('#loginMessage');
const submit = document.querySelector('#loginSubmit');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  submit.disabled = true;
  submit.textContent = 'Iniciando sesión…';
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
    submit.textContent = 'Entrar a mi negocio';
  }
});

// Accesos de demostración inmediata (Hackathon)
document.querySelector('#demoProviderBtn')?.addEventListener('click', () => {
  document.querySelector('#loginEmail').value = 'proveedor@nex24.com';
  document.querySelector('#loginPassword').value = '123456';
  form.dispatchEvent(new Event('submit'));
});

document.querySelector('#demoStoreBtn')?.addEventListener('click', () => {
  document.querySelector('#loginEmail').value = 'tiendita@nex24.com';
  document.querySelector('#loginPassword').value = '123456';
  form.dispatchEvent(new Event('submit'));
});

document.querySelector('#demoAdminBtn')?.addEventListener('click', () => {
  document.querySelector('#loginEmail').value = 'admin@nex24.com';
  document.querySelector('#loginPassword').value = '123456';
  form.dispatchEvent(new Event('submit'));
});
