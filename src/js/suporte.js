(() => {
  const form = document.getElementById('reportForm');
  if (!form) return;

  form.addEventListener('submit', event => {
    event.preventDefault();
    const note = document.getElementById('formNote');
    if (!form.reportValidity()) {
      note.textContent = 'Revise os campos destacados antes de continuar.';
      return;
    }

    const type = document.getElementById('reportType').value;
    const details = document.getElementById('reportDetails').value.trim();
    const subject = `Denúncia na plataforma Nexlar: ${type}`;
    const body = `Tipo de situação: ${type}\n\nRelato:\n${details}`;
    note.textContent = 'Seu aplicativo de e-mail será aberto com a denúncia. Revise e envie a mensagem por lá.';
    window.location.href = `mailto:suportenexlar@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
})();
