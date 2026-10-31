const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const messagesPanel = document.getElementById('messagesPanel');
const chatArea = document.getElementById('chatArea');
const emptyState = document.getElementById('emptyState');
const chatView = document.getElementById('chatView');
const chatMessages = document.getElementById('chatMessages');
const conversationList = document.getElementById('conversationList');
const chatHeaderName = document.getElementById('chatHeaderName');
const chatHeaderAvatar = document.getElementById('chatHeaderAvatar');
const chatInput = document.getElementById('chatInput');
const searchInput = document.getElementById('searchInput');
const contratarBtn = document.getElementById('contratarBtn');

let api, me, activeConversation;
let conversations = [], activeContracts = [], pollTimer = null;

const initials = name => name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
const otherPerson = conversation => conversation.client_id === me.id ? conversation.provider : conversation.client;
const formatTime = value => new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

function addBubble(text, sent, time, className = '') {
  const bubble = document.createElement('div');
  bubble.className = `msg-bubble ${sent ? 'sent' : 'received'} ${className}`;
  const content = document.createElement('span'); content.textContent = text;
  const date = document.createElement('span'); date.className = 'msg-time'; date.textContent = time;
  bubble.append(content, date); chatMessages.appendChild(bubble);
}

function renderConversationList(filter = '') {
  conversationList.innerHTML = '';
  const visible = conversations.filter(item => otherPerson(item)?.full_name.toLowerCase().includes(filter.toLowerCase()));
  if (!visible.length) {
    const empty = document.createElement('li'); empty.className = 'conversation-empty';
    empty.textContent = filter ? 'Nenhuma conversa encontrada.' : 'Você ainda não possui conversas.';
    conversationList.appendChild(empty);
    return;
  }
  visible.forEach(item => {
    const person = otherPerson(item);
    const li = document.createElement('li'); li.className = 'conversation-item'; li.dataset.id = item.id;
    const avatar = document.createElement('div'); avatar.className = 'avatar avatar-purple'; avatar.textContent = initials(person.full_name);
    const info = document.createElement('div'); info.className = 'conv-info';
    const top = document.createElement('div'); top.className = 'conv-top';
    const name = document.createElement('span'); name.className = 'conv-name'; name.textContent = person.full_name;
    const date = document.createElement('span'); date.className = 'conv-date'; date.textContent = new Date(item.updated_at).toLocaleDateString('pt-BR');
    const bottom = document.createElement('div'); bottom.className = 'conv-bottom';
    const preview = document.createElement('span'); preview.className = 'conv-preview'; preview.textContent = 'Abrir conversa';
    top.append(name, date); bottom.append(preview); info.append(top, bottom); li.append(avatar, info);
    li.addEventListener('click', () => openConversation(item)); conversationList.appendChild(li);
  });
}

async function loadMessages() {
  if (!activeConversation) return;
  const [messages, contracts] = await Promise.all([
    api.request(`messages&conversation_id=${activeConversation.id}`),
    api.request(`contracts&conversation_id=${activeConversation.id}`),
  ]);
  activeContracts = contracts; chatMessages.innerHTML = '';
  messages.forEach(message => addBubble(message.body, message.sender_id === me.id, formatTime(message.created_at)));
  contracts.slice().reverse().forEach(contract => {
    const value = Number(contract.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    addBubble(`Proposta: ${contract.description} — ${value} (${contract.status.replaceAll('_', ' ')})`, contract.provider_id === me.id, formatTime(contract.created_at), 'proposal-bubble');
  });
  const latest = contracts[0];
  contratarBtn.textContent = activeConversation.provider_id !== me.id ? 'Contratar serviço'
    : latest?.status === 'pago' ? 'Iniciar serviço'
    : latest?.status === 'em_andamento' ? 'Concluir serviço'
    : 'Enviar proposta';
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function openConversation(conversation) {
  activeConversation = conversation; const person = otherPerson(conversation);
  chatHeaderName.textContent = person.full_name; chatHeaderAvatar.textContent = initials(person.full_name);
  emptyState.style.display = 'none'; chatView.style.display = 'flex'; chatView.style.flexDirection = 'column';
  if (innerWidth <= 600) { messagesPanel.classList.add('hidden'); chatArea.classList.add('visible'); }
  await loadMessages(); chatInput.focus(); clearInterval(pollTimer);
  pollTimer = setInterval(() => loadMessages().catch(() => {}), 4000);
}

async function sendMessage() {
  const body = chatInput.value.trim(); if (!body || !activeConversation) return;
  chatInput.value = '';
  try { await api.request('messages', { method: 'POST', body: JSON.stringify({ conversation_id: activeConversation.id, body }) }); await loadMessages(); }
  catch (error) { alert(error.message); chatInput.value = body; }
}

async function handleContract() {
  if (!activeConversation) return;
  if (activeConversation.provider_id === me.id) {
    const latest = activeContracts[0];
    if (latest?.status === 'pago' || latest?.status === 'em_andamento') {
      const status = latest.status === 'pago' ? 'em_andamento' : 'concluido';
      await api.request(`contracts/${latest.id}/status`, { method: 'POST', body: JSON.stringify({ status }) });
      return loadMessages();
    }
    const description = prompt('Descreva o serviço da proposta:'); if (!description) return;
    const amount = Number(prompt('Informe o valor do serviço em reais:')?.replace(',', '.')); if (!(amount > 0)) return alert('Informe um valor válido.');
    await api.request('contracts', { method: 'POST', body: JSON.stringify({ conversation_id: activeConversation.id, description, amount }) });
    return loadMessages();
  }
  const proposal = activeContracts.find(contract => contract.status === 'proposta');
  if (!proposal) return alert('O prestador ainda não enviou uma proposta disponível.');
  const result = await api.request('payments/checkout', { method: 'POST', body: JSON.stringify({ contract_id: proposal.id }) });
  if (result.checkout_url) location.href = result.checkout_url;
}

document.getElementById('hamburger').addEventListener('click', () => { sidebar.classList.add('open'); overlay.classList.add('visible'); });
document.getElementById('sidebarClose').addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('visible'); });
overlay.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('visible'); });
document.getElementById('backBtn').addEventListener('click', () => { messagesPanel.classList.remove('hidden'); chatArea.classList.remove('visible'); });
document.getElementById('sendBtn').addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } });
contratarBtn.addEventListener('click', () => handleContract().catch(error => alert(error.message)));
searchInput.addEventListener('input', () => renderConversationList(searchInput.value.trim()));

(async () => {
  api = await window.nexlarReady; await api.requireSession(); me = await api.request('me');
  if (me.role === 'cliente') document.querySelector('[data-page="financeiro"]')?.remove();
  conversations = await api.request('conversations'); renderConversationList();
  const providerId = new URLSearchParams(location.search).get('provider_id');
  if (providerId) {
    let conversation = conversations.find(item => item.provider_id === providerId && item.client_id === me.id);
    if (!conversation) {
      await api.request('conversations', { method: 'POST', body: JSON.stringify({ provider_id: providerId }) });
      conversations = await api.request('conversations'); renderConversationList();
      conversation = conversations.find(item => item.provider_id === providerId && item.client_id === me.id);
    }
    if (conversation) await openConversation(conversation);
  }
})().catch(error => { emptyState.querySelector('.empty-title').textContent = 'Não foi possível carregar'; emptyState.querySelector('.empty-sub').textContent = error.message; });


