(function (root) {
  async function startEmailStep({ api, supabase, email, redirectTo }) {
    const started = await api.request('auth/email-step/start', { method: 'POST' });
    const separator = redirectTo.includes('?') ? '&' : '?';
    const result = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: `${redirectTo}${separator}challenge=${encodeURIComponent(started.challenge)}` },
    });
    if (result.error) throw result.error;
  }

  async function completeEmailStep({ api, challenge }) {
    return api.request('auth/email-step/complete', {
      method: 'POST',
      body: JSON.stringify({ challenge }),
    });
  }

  const api = { startEmailStep, completeEmailStep };
  root.NexlarEmailStep = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

