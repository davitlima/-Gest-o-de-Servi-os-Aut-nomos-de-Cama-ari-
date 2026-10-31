document.addEventListener('DOMContentLoaded', async () => {
  const { supabase } = await window.nexlarReady;
  const message = document.getElementById('message') || document.getElementById('toast');
  const show = (text, success = false) => {
    if (!message) return;
    message.textContent = text;
    message.classList.toggle('success', success);
    message.classList.add('show');
  };
  const value = id => document.getElementById(id)?.value.trim() || '';

  const signupForm = document.querySelector('form[data-role]');
  if (signupForm) {
    signupForm.addEventListener('submit', async event => {
      event.preventDefault();
      const password = value('senha');
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
        return show('A senha deve ter 8 caracteres, maiúscula, minúscula, número e símbolo.');
      }
      if (password !== value('confirmarSenha')) return show('As senhas precisam ser iguais.');
      const role = signupForm.dataset.role;
      const documentValue = value(role === 'empresa' ? 'cnpj' : 'cpf').replace(/\D/g, '');
      const birthDate = value('nascimento');
      const phoneValue = value('contato').replace(/\D/g, '');
      if (!window.NexlarMasks.validDate(birthDate)) return show('Informe uma data válida no formato DD/MM/AAAA.');
      if (documentValue.length !== (role === 'empresa' ? 14 : 11)) return show(`Informe um ${role === 'empresa' ? 'CNPJ' : 'CPF'} completo.`);
      if (![10, 11].includes(phoneValue.length)) return show('Informe um telefone com DDD.');
      const button = signupForm.querySelector('button[type="submit"]');
      button.disabled = true;
      const { error } = await supabase.auth.signUp({
        email: value('email'),
        password,
        options: {
          emailRedirectTo: `${location.origin}/src/pages/login.html`,
          data: {
            role,
            full_name: value('nome'),
            phone: value('contato'),
            document: documentValue,
            company_name: role === 'empresa' ? value('nome') : null,
          },
        },
      });
      button.disabled = false;
      if (error) return show(error.message);
      signupForm.reset();
      show('Cadastro criado. Confirme o link enviado ao seu e-mail antes de entrar.', true);
    });
  }

  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;
  const resendButton = document.getElementById('resendConfirmation');

  const callbackError = new URLSearchParams(location.search).get('error_code');
  if (callbackError === 'otp_expired') show('Este link de confirmação expirou ou já foi usado. Informe seu e-mail abaixo e solicite um novo.');

  resendButton.addEventListener('click', async () => {
    const email = value('email');
    if (!email) return show('Informe seu e-mail para receber um novo link.');
    resendButton.disabled = true;
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${location.origin}/src/pages/login.html` },
    });
    resendButton.disabled = false;
    if (error) return show(error.message);
    show('Novo e-mail enviado. Use apenas o link mais recente.', true);
  });

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    const button = loginForm.querySelector('button');
    button.disabled = true;
    const { error } = await supabase.auth.signInWithPassword({ email: value('email'), password: value('password') });
    button.disabled = false;
    if (error) return show(error.message === 'Invalid login credentials'
      ? 'E-mail ou senha inválidos. Se acabou de se cadastrar, confirme o e-mail ou solicite um novo link.'
      : error.message);
    location.href = '/src/pages/inicio.html';
  });

  const { data: { session } } = await supabase.auth.getSession();
  if (session) location.href = '/src/pages/inicio.html';
});


