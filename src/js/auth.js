document.addEventListener('DOMContentLoaded', async () => {
  const { supabase } = await window.nexlarReady;
  const message = document.getElementById('message');
  const show = (text, success = false) => { message.textContent = text; message.classList.toggle('success', success); };

  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    const companyFields = document.getElementById('companyFields');
    signupForm.elements.role.forEach?.(input => input.addEventListener('change', () => {
      companyFields.hidden = signupForm.elements.role.value !== 'empresa';
    }));
    signupForm.addEventListener('submit', async event => {
      event.preventDefault();
      const password = document.getElementById('password').value;
      if (password !== document.getElementById('confirmPassword').value) return show('As senhas precisam ser iguais.');
      const button = signupForm.querySelector('button'); button.disabled = true;
      const { error } = await supabase.auth.signUp({
        email: document.getElementById('email').value.trim(), password,
        options: { emailRedirectTo: `${location.origin}/src/pages/login.html`, data: {
          role: signupForm.elements.role.value, full_name: document.getElementById('fullName').value.trim(), phone: document.getElementById('phone').value.trim(),
          document: document.getElementById('document').value.trim() || null, company_name: document.getElementById('companyName').value.trim() || null,
        } },
      });
      button.disabled = false;
      if (error) return show(error.message);
      signupForm.reset(); companyFields.hidden = true;
      show('Cadastro criado. Confirme o link enviado ao seu e-mail antes de entrar.', true);
    });
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    const mfaSetup = document.getElementById('mfaSetup');
    let factorId = null;
    async function finishLogin() {
      const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (data?.nextLevel === 'aal2' && data.currentLevel !== 'aal2') {
        const factors = await supabase.auth.mfa.listFactors();
        const factor = factors.data?.totp?.find(item => item.status === 'verified');
        if (factor) { factorId = factor.id; mfaSetup.hidden = false; document.getElementById('mfaQr').hidden = true; return; }
      }
      if (data?.currentLevel === 'aal2') return location.href = '/src/pages/inicio.html';
      const pendingFactors = await supabase.auth.mfa.listFactors();
      for (const pending of pendingFactors.data?.totp?.filter(item => item.status !== 'verified') || []) {
        await supabase.auth.mfa.unenroll({ factorId: pending.id });
      }
      const enrolled = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Nexlar' });
      if (enrolled.error) return show(enrolled.error.message);
      factorId = enrolled.data.id; document.getElementById('mfaQr').src = enrolled.data.totp.qr_code; mfaSetup.hidden = false;
    }
    loginForm.addEventListener('submit', async event => {
      event.preventDefault(); const button = loginForm.querySelector('button'); button.disabled = true;
      const { error } = await supabase.auth.signInWithPassword({ email: document.getElementById('email').value.trim(), password: document.getElementById('password').value });
      button.disabled = false; if (error) return show(error.message); await finishLogin();
    });
    document.getElementById('verifyMfa').addEventListener('click', async () => {
      const code = document.getElementById('mfaCode').value.trim();
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) return show(challenge.error.message);
      const result = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.data.id, code });
      if (result.error) return show(result.error.message);
      location.href = '/src/pages/inicio.html';
    });
  }
});
