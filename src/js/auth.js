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
  const mfaSetup = document.getElementById('mfaSetup');
  const mfaQr = document.getElementById('mfaQr');
  const resendButton = document.getElementById('resendConfirmation');
  let factorId = null;

  function resetMfa() {
    factorId = null;
    mfaSetup.hidden = true;
    mfaQr.hidden = true;
    mfaQr.removeAttribute('src');
    document.getElementById('mfaCode').value = '';
  }

  resetMfa();

  const callbackError = new URLSearchParams(location.search).get('error_code');
  if (callbackError === 'otp_expired') show('Este link de confirmação expirou ou já foi usado. Informe seu e-mail abaixo e solicite um novo.');

  async function finishLogin() {
    const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance.data?.nextLevel === 'aal2' && assurance.data.currentLevel !== 'aal2') {
      const factors = await supabase.auth.mfa.listFactors();
      const verified = factors.data?.totp?.find(item => item.status === 'verified');
      if (verified) {
        factorId = verified.id;
        mfaSetup.hidden = false;
        mfaQr.hidden = true;
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
    mfaQr.src = enrolled.data.totp.qr_code;
    mfaQr.hidden = false;
    mfaSetup.hidden = false;
  }

  resendButton.addEventListener('click', async () => {
    resetMfa();
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
    resetMfa();
    const button = loginForm.querySelector('button');
    button.disabled = true;
    const { error } = await supabase.auth.signInWithPassword({ email: value('email'), password: value('password') });
    button.disabled = false;
    if (error) return show(error.message === 'Invalid login credentials'
      ? 'E-mail ou senha inválidos. Se acabou de se cadastrar, confirme o e-mail ou solicite um novo link.'
      : error.message);
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

  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    show('E-mail confirmado. Configure ou informe seu segundo fator para continuar.', true);
    await finishLogin();
  }
});


