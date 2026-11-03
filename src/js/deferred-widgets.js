(function () {
  let started = false;
  const interactionEvents = ['pointerdown', 'keydown', 'touchstart'];
  const start = () => {
    if (started) return;
    started = true;
    interactionEvents.forEach(event => window.removeEventListener(event, activateWhenIdle));

    const vlibras = document.createElement('script');
    vlibras.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
    vlibras.async = true;
    vlibras.onload = () => {
      if (window.VLibras?.Widget) new window.VLibras.Widget({ rootPath: 'https://vlibras.gov.br/app', position: 'R' });
    };
    document.head.appendChild(vlibras);

    const userway = document.createElement('script');
    userway.src = 'https://cdn.userway.org/widget.js';
    userway.async = true;
    userway.dataset.account = 'S9u6Q9zXrg';
    userway.dataset.size = 'small';
    userway.dataset.position = '6';
    document.body.appendChild(userway);
  };

  const activateWhenIdle = () => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 3000 });
    else window.setTimeout(start, 1200);
  };
  interactionEvents.forEach(event => window.addEventListener(event, activateWhenIdle, { once: true, passive: true }));

  const schedule = () => window.setTimeout(activateWhenIdle, 3500);
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
})();
