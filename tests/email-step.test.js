const assert = require('node:assert/strict');
const { startEmailStep, completeEmailStep } = require('../src/js/email-step.js');

(async () => {
  const calls = [];
  const api = { request: async (route, options) => {
    calls.push(options ? [route, options] : route);
    return route.endsWith('/start') ? { challenge: 'challenge-token' } : { verified: true };
  } };
  const supabase = { auth: {
    signInWithOtp: async options => { calls.push(options); return { error: null }; },
    verifyOtp: async options => { calls.push(options); return { error: null }; },
  } };

  await startEmailStep({ api, supabase, email: 'pessoa@example.com', redirectTo: 'https://app.example.com/login' });
  assert.deepEqual(calls.slice(0, 2), [
    ['auth/email-step/start', { method: 'POST' }],
    { email: 'pessoa@example.com', options: { shouldCreateUser: false, emailRedirectTo: 'https://app.example.com/login?challenge=challenge-token' } },
  ]);

  await completeEmailStep({ api, challenge: 'challenge-token' });
  assert.deepEqual(calls.slice(2), [[
    'auth/email-step/complete',
    { method: 'POST', body: JSON.stringify({ challenge: 'challenge-token' }) },
  ]]);
  console.log('Fluxo de link por e-mail passou.');
})().catch(error => { console.error(error); process.exitCode = 1; });

