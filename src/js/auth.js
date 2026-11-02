document.addEventListener('DOMContentLoaded', async () => {
  const { supabase } = await window.nexlarReady;
  const message = document.getElementById('message') || document.getElementById('toast');
  const show = (text, success = false) => {
    if (!message) return;
    message.textContent = text;
    message.classList.toggle('success', success);
    message.classList.add('show');
  };
  document.querySelector('.btn-help')?.addEventListener('click', () => {
    show('Preencha todos os campos para criar sua conta Nexlar.');
  });
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
          data: {
            role,
            full_name: value('nome'),
            phone: value('contato'),
            document: documentValue,
            company_name: role === 'empresa' ? value('nome') : null,
            service_category: role === 'cliente' ? null : value('serviceCategory'),
            neighborhood: role === 'cliente' ? null : value('providerNeighborhood'),
          },
        },
      });
      button.disabled = false;
      if (error) return show(error.message);
      await supabase.auth.signOut();
      signupForm.reset();
      show('Cadastro criado. Você já pode entrar com seu e-mail e senha.', true);
    });
  }

  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;
  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    const button = loginForm.querySelector('button');
    button.disabled = true;
    const { error } = await supabase.auth.signInWithPassword({ email: value('email'), password: value('password') });
    button.disabled = false;
    if (error) return show(error.message === 'Invalid login credentials'
      ? 'E-mail ou senha inválidos.'
      : error.message);
    location.href = '/src/pages/inicio.html';
  });

  const { data: { session } } = await supabase.auth.getSession();
  if (session) location.href = '/src/pages/inicio.html';
});


