(function () {
  const ready = (async () => {
    const response = await fetch('/api/index.php?route=config');
    if (!response.ok) throw new Error('Não foi possível carregar a configuração.');
    const config = await response.json();
    const supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseKey);

    async function request(route, options = {}) {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
      const ampersand = route.indexOf('&');
      const routeName = ampersand === -1 ? route : route.slice(0, ampersand);
      const extraQuery = ampersand === -1 ? '' : `&${route.slice(ampersand + 1)}`;
      const result = await fetch(`/api/index.php?route=${encodeURIComponent(routeName)}${extraQuery}`, { ...options, headers });
      const payload = await result.json().catch(() => ({}));
      if (!result.ok) throw new Error(payload.error || 'Não foi possível concluir a operação.');
      return payload;
    }

    async function requireSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        location.href = '/src/pages/login.html';
        throw new Error('Sessão necessária.');
      }
      return session;
    }

    window.nexlar = { supabase, request, requireSession };
    return window.nexlar;
  })();

  window.nexlarReady = ready;
})();
