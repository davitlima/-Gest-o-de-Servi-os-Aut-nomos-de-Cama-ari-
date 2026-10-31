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
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
        return show('A senha deve ter 8 caracteres, maiúscula, minúscula, número e símbolo.');
      }
      if (password !== value('confirmarSenha')) return show('As senhas precisam ser iguais.');
      const role = signupForm.dataset.role;
      const documentValue = value(role === 'empresa' ? 'cnpj' : 'cpf').replace(/\\D/g, '');
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
  const mfaSetup = document.getElementById('mfaSetup');
  let factorId = null;

  async function finishLogin() {
    const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance.data?.nextLevel === 'aal2' && assurance.data.currentLevel !== 'aal2') {
      const factors = await supabase.auth.mfa.listFactors();
      const verified = factors.data?.totp?.find(item => item.status === 'verified');
      if (verified) {
        factorId = verified.id;
        mfaSetup.hidden = false;
        document.getElementById('mfaQr').hidden = true;
        return;
      }
    }
    if (assurance.data?.currentLevel === 'aal2') {
      location.href = '/src/pages/inicio.html';
      return;
    }
    const factors = await supabase.auth.mfa.listFactors();
    for (const pending of factors.data?.totp?.filter(item => item.status !== 'verified') || []) {
      await supabase.auth.mfa.unenroll({ factorId: pending.id });
    }
    const enrolled = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Nexlar' });
    if (enrolled.error) return show(enrolled.error.message);
    factorId = enrolled.data.id;
    document.getElementById('mfaQr').src = enrolled.data.totp.qr_code;
    mfaSetup.hidden = false;
  }

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    const button = loginForm.querySelector('button');
    button.disabled = true;
    const { error } = await supabase.auth.signInWithPassword({ email: value('email'), password: value('password') });
    button.disabled = false;
    if (error) return show(error.message);
    await finishLogin();
  });

  document.getElementById('verifyMfa').addEventListener('click', async () => {
    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error) return show(challenge.error.message);
    const result = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code: value('mfaCode'),
    });
    if (result.error) return show(result.error.message);
    location.href = '/src/pages/inicio.html';
  });
});

