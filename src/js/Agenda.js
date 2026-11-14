const list = document.getElementById('agendaList');
const agendaDate = value => value ? new Date(value).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' }) : 'Data a combinar';
(async () => {
  const { request, requireSession } = await window.nexlarReady; await requireSession();
  const me = await request('me');
  if (!['autonomo', 'empresa'].includes(me.role)) { location.replace('inicio.html'); return; }
  const events = await request('agenda'); list.replaceChildren();
  if (!events.length) { const empty = document.createElement('p'); empty.textContent = 'Nenhum serviço pago na agenda ainda.'; list.append(empty); return; }
  const labels = { a_combinar: 'A combinar', agendado: 'Agendado', em_andamento: 'Em andamento', concluido: 'Concluído', cancelado: 'Cancelado' };
  events.forEach(event => {
    const card = document.createElement('article'); card.className = 'agenda-card';
    const date = document.createElement('time'); date.textContent = agendaDate(event.starts_at);
    const title = document.createElement('h2'); title.textContent = event.title;
    const status = document.createElement('span'); status.className = 'agenda-status'; status.textContent = labels[event.status] || event.status;
    const detail = document.createElement('p'); detail.textContent = [event.duration_minutes ? `${event.duration_minutes} min` : '', event.location || ''].filter(Boolean).join(' · ') || 'Sem detalhes adicionais';
    card.append(date, title, status, detail); list.append(card);
  });
})().catch(error => { list.textContent = error.message; });
