(function () {
  const start = () => {
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
  if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 2500 });
  else window.setTimeout(start, 1800);
})();
