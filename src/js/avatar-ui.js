(function () {
  const initials = name => String(name || '?').trim().split(/\s+/).slice(0, 2)
    .map(part => part[0] || '').join('').toUpperCase() || '?';

  window.NexlarAvatar = {
    render(element, name, url) {
      if (!element) return;
      element.replaceChildren();
      element.classList.remove('has-photo');
      element.setAttribute('aria-label', `Foto de ${name || 'usuário'}`);
      const fallback = document.createElement('span');
      fallback.className = 'avatar-fallback';
      fallback.textContent = initials(name);
      element.appendChild(fallback);
      if (!url) return;
      const image = document.createElement('img');
      image.className = 'avatar-image';
      image.alt = '';
      image.decoding = 'async';
      image.onload = () => { element.classList.add('has-photo'); fallback.hidden = true; };
      image.onerror = () => { image.remove(); element.classList.remove('has-photo'); fallback.hidden = false; };
      image.src = url;
      element.appendChild(image);
    },
  };
})();
