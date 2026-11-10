(function (global) {
  const destinations = [
    { key: 'inicio', href: 'inicio.html', label: 'Início', icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>' },
    { key: 'perfil', href: 'Meuperfil.html', label: 'Meu Perfil', icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
    { key: 'financeiro', href: 'Painelfinanceiro.html', label: 'Financeiro', icon: '<path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' },
    { key: 'mensagens', href: 'painelmensagens.html', label: 'Mensagens', icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' },
    { key: 'suporte', href: 'suporte.html', label: 'Suporte', icon: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>' }
  ];

  function renderNavigation(active, canUseFinance = false) {
    const links = destinations.filter(item => canUseFinance || item.key !== 'financeiro').map(item => {
      const current = item.key === active ? ' aria-current="page"' : '';
      return `<a class="panel-nav__link" href="${item.href}"${current}><svg viewBox="0 0 24 24" aria-hidden="true">${item.icon}</svg><span>${item.label}</span></a>`;
    }).join('');
    return `<button class="panel-nav__trigger" type="button" aria-controls="panel-nav-sidebar" aria-expanded="false" aria-label="Abrir menu"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button><button class="panel-nav__overlay" type="button" aria-label="Fechar menu" tabindex="-1"></button><aside class="panel-nav__sidebar" id="panel-nav-sidebar" aria-label="Navegação principal"><button class="panel-nav__close" type="button" aria-label="Fechar menu"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button><div class="panel-nav__logo"><img src="/src/images/logobranca.png" alt="Nexlar" /></div><nav>${links}</nav></aside>`;
  }

  function createDrawerController({ sidebar, overlay, trigger, close, body, media, windowTarget, links = [] }) {
    const backgroundState = new Map();
    function isolateBackground(open) {
      if (open && backgroundState.size === 0) {
        for (let ancestor = sidebar.parentElement; ancestor && ancestor !== body; ancestor = ancestor.parentElement) {
          for (const sibling of ancestor.parentElement.children) {
            if (sibling !== ancestor) {
              backgroundState.set(sibling, sibling.inert);
              sibling.inert = true;
            }
          }
        }
      } else if (!open) {
        backgroundState.forEach((inert, element) => { element.inert = inert; });
        backgroundState.clear();
      }
    }
    function setOpen(open, returnFocus = false) {
      open = open && !media.matches;
      sidebar.classList.toggle('open', open);
      overlay.classList.toggle('visible', open);
      trigger.setAttribute('aria-expanded', String(open));
      trigger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      body.classList.toggle('drawer-open', open);
      const hidden = !media.matches && !open;
      sidebar.inert = hidden;
      sidebar.setAttribute('aria-hidden', String(hidden));
      overlay.inert = !open;
      overlay.setAttribute('aria-hidden', String(!open));
      isolateBackground(open);
      if (open) close.focus();
      else if (returnFocus) trigger.focus();
    }
    const onKeydown = event => {
      if (!sidebar.classList.contains('open') || media.matches) return;
      if (event.key === 'Escape') setOpen(false, true);
      if (event.key === 'Tab') {
        const active = sidebar.ownerDocument.activeElement;
        const currentLinks = sidebar.querySelectorAll ? [...sidebar.querySelectorAll('nav a')] : [...links];
        const focusable = [close, ...currentLinks];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!focusable.includes(active) || (event.shiftKey ? active === first : active === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }
    };
    const onBreakpointChange = () => setOpen(false);
    trigger.addEventListener('click', () => setOpen(!sidebar.classList.contains('open')));
    close.addEventListener('click', () => setOpen(false, true));
    overlay.addEventListener('click', () => setOpen(false, true));
    sidebar.addEventListener('click', event => {
      if (event.target.closest('nav a')) setOpen(false);
    });
    windowTarget.addEventListener('keydown', onKeydown);
    media.addEventListener('change', onBreakpointChange);
    setOpen(false);
    function cleanup() {
      setOpen(false);
      windowTarget.removeEventListener('keydown', onKeydown);
      media.removeEventListener('change', onBreakpointChange);
    }
    return { setOpen, cleanup, windowTarget };
  }

  if (global && global.HTMLElement && global.customElements && !global.customElements.get('nexlar-panel-nav')) {
    class NexlarPanelNav extends global.HTMLElement {
      connectedCallback() {
        this.innerHTML = renderNavigation(this.getAttribute('active'), false);
        const setupController = () => {
          this.controller?.cleanup();
          this.controller = createDrawerController({
            sidebar: this.querySelector('.panel-nav__sidebar'),
            overlay: this.querySelector('.panel-nav__overlay'),
            trigger: this.querySelector('.panel-nav__trigger'),
            close: this.querySelector('.panel-nav__close'),
            body: global.document.body,
            media: global.matchMedia('(min-width: 761px)'),
            windowTarget: global,
            links: this.querySelectorAll('nav a')
          });
        };
        setupController();
        const waitForApi = global.nexlarReady
          ? Promise.resolve(global.nexlarReady)
          : new Promise(resolve => global.addEventListener('nexlar:ready', () => resolve(global.nexlarReady), { once: true }));
        waitForApi.then(api => api?.request('me')).then(me => {
          if (me && ['autonomo', 'empresa'].includes(me.role)) {
            const current = this.querySelector('.panel-nav__sidebar nav');
            current.innerHTML = renderNavigation(this.getAttribute('active'), true).match(/<nav>([\s\S]*)<\/nav>/)[1];
          }
        }).catch(() => {});
      }
      disconnectedCallback() { this.controller?.cleanup(); this.controller = null; }
      setOpen(open, returnFocus) { this.controller?.setOpen(open, returnFocus); }
    }
    global.customElements.define('nexlar-panel-nav', NexlarPanelNav);
  }
  if (typeof module !== 'undefined') module.exports = { renderNavigation, createDrawerController };
})(typeof window !== 'undefined' ? window : null);

