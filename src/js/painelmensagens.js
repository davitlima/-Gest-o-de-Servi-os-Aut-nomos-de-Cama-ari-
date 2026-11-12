const messagesPanel = document.getElementById('messagesPanel');
const chatArea = document.getElementById('chatArea');
const emptyState = document.getElementById('emptyState');
const chatView = document.getElementById('chatView');
const chatMessages = document.getElementById('chatMessages');
const conversationList = document.getElementById('conversationList');
const chatHeaderName = document.getElementById('chatHeaderName');
const chatHeaderAvatar = document.getElementById('chatHeaderAvatar');
const connectionStatus = document.getElementById('connectionStatus');
const chatInput = document.getElementById('chatInput');
const attachmentInput = document.getElementById('attachmentInput');
const attachBtn = document.getElementById('attachBtn');
const recordBtn = document.getElementById('recordBtn');
const recordingStatus = document.getElementById('recordingStatus');
const searchInput = document.getElementById('searchInput');
const proposalDialog = document.getElementById('proposalDialog');
const proposalForm = document.getElementById('proposalForm');
const proposalDescription = document.getElementById('proposalDescription');
const proposalAmount = document.getElementById('proposalAmount');
const proposalError = document.getElementById('proposalError');
const proposalSubmit = document.getElementById('proposalSubmit');
const proposeBtn = document.getElementById('proposeBtn');

let api, me, activeConversation, realtimeChannel, realtimeGeneration = 0, openGeneration = 0;
let conversations = [], activeContracts = [], messageCache = [], fallbackTimer = null, fallbackActive = false;
let mediaRecorder = null, mediaStream = null, audioChunks = [], uploadInProgress = false;

const MAX_ATTACHMENT_SIZE = 15 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip', 'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav',
]);
const EXTENSION_BY_TYPE = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
  'application/pdf': 'pdf', 'text/plain': 'txt', 'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/zip': 'zip', 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a', 'audio/wav': 'wav',
};

const initials = name => name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
const otherPerson = conversation => conversation.client_id === me.id ? conversation.provider : conversation.client;
const formatTime = value => new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

function appendAttachment(bubble, message) {
  if (!message.attachment_url) {
    const waiting = document.createElement('span'); waiting.className = 'attachment-waiting'; waiting.textContent = message.attachment_error ? 'Anexo indisponível.' : 'Carregando anexo…';
    bubble.appendChild(waiting); return;
  }
  const url = message.attachment_url;
  const type = (message.attachment_mime || '').toLowerCase();
  if (type.startsWith('audio/')) {
    const audio = document.createElement('audio'); audio.className = 'chat-audio'; audio.controls = true; audio.preload = 'metadata'; audio.src = url;
    audio.setAttribute('aria-label', `Áudio: ${message.attachment_name || 'arquivo de áudio'}`);
    bubble.appendChild(audio);
  } else if (type.startsWith('image/')) {
    const link = document.createElement('a'); link.className = 'chat-image-link'; link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', `Abrir imagem ${message.attachment_name || ''}`);
    const image = document.createElement('img'); image.className = 'chat-image'; image.src = url; image.alt = message.attachment_name || 'Imagem anexada';
    link.appendChild(image); bubble.appendChild(link);
  }
  const file = document.createElement('a'); file.className = 'chat-file-link'; file.href = url; file.target = '_blank'; file.rel = 'noopener noreferrer';
  file.download = message.attachment_name || ''; file.textContent = message.attachment_name || 'Baixar arquivo';
  bubble.appendChild(file);
}

function showChatFeedback(message = '', isError = false) {
  const feedback = document.getElementById('chatFeedback');
  feedback.textContent = message; feedback.hidden = !message; feedback.classList.toggle('is-error', isError);
}

function renderTimeline() {
  chatMessages.innerHTML = '';
  let displayedDate = '';
  const activity = [
    ...messageCache.map(item => ({ ...item, kind: 'message' })),
    ...activeContracts.map(item => ({ ...item, kind: 'contract' })),
  ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  activity.forEach(item => {
    const sentDate = new Date(item.created_at);
    const dateKey = sentDate.toLocaleDateString('pt-BR');
    if (dateKey !== displayedDate) {
      const divider = document.createElement('div'); divider.className = 'chat-date-divider';
      divider.textContent = sentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
      chatMessages.appendChild(divider); displayedDate = dateKey;
    }
    if (item.kind === 'message') {
      const sent = item.sender_id === me.id;
      const bubble = document.createElement('div'); bubble.className = `msg-bubble ${sent ? 'sent' : 'received'}`;
      if (item.body) { const content = document.createElement('span'); content.className = 'msg-content'; content.textContent = item.body; bubble.appendChild(content); }
      if (item.attachment_path) appendAttachment(bubble, item);
      const time = document.createElement('span'); time.className = 'msg-time'; time.textContent = formatTime(item.created_at); bubble.appendChild(time);
      chatMessages.appendChild(bubble);
    } else {
      const value = Number(item.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      addProposalCard(item, value);
    }
  });
  const latest = activeContracts[0];
  proposeBtn.hidden = activeConversation.provider_id !== me.id;
  proposeBtn.textContent = latest?.status === 'pago' ? 'Iniciar serviço'
    : latest?.status === 'em_andamento' ? 'Marcar como concluído' : 'Propor serviço';
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
function addProposalCard(contract, value) {
  const sent = contract.provider_id === me.id;
  const card = document.createElement('article');
  card.className = `proposal-card ${sent ? 'proposal-card-sent' : 'proposal-card-received'}`;
  const heading = document.createElement('strong'); heading.textContent = sent ? 'Proposta enviada' : 'Proposta recebida';
  const description = document.createElement('p'); description.textContent = contract.description;
  const amount = document.createElement('div'); amount.className = 'proposal-card-amount'; amount.textContent = value;
  const status = document.createElement('span'); status.className = 'proposal-card-status';
  const labels = { proposta: 'Aguardando resposta', aguardando_pagamento: 'Aguardando pagamento', pago: 'Pagamento confirmado', em_andamento: 'Serviço em andamento', concluido: 'Serviço concluído' };
  status.textContent = labels[contract.status] || contract.status.replaceAll('_', ' ');
  const time = document.createElement('time'); time.className = 'msg-time'; time.textContent = formatTime(contract.created_at);
  card.append(heading, description, amount, status);
if (!sent && ['proposta', 'aguardando_pagamento'].includes(contract.status)) {
    card.classList.add('proposal-card-actionable'); card.tabIndex = 0; card.setAttribute('role', 'button');
card.setAttribute('aria-label', `${contract.status === 'proposta' ? 'Contratar' : 'Continuar pagamento de'} ${contract.description} por ${value}`);
const action = document.createElement('span'); action.className = 'proposal-card-action'; action.textContent = contract.status === 'proposta' ? 'Toque para contratar' : 'Toque para continuar o pagamento';
const arrow = document.createElement('span'); arrow.className = 'proposal-card-arrow'; arrow.setAttribute('aria-hidden', 'true');
arrow.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    card.append(action, arrow);
    card.addEventListener('click', () => startCheckout(contract, card));
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); startCheckout(contract, card); }
    });
  }
  card.appendChild(time); chatMessages.appendChild(card);
}

function renderConversationList(filter = '') {
  conversationList.innerHTML = '';
  const visible = conversations.filter(item => otherPerson(item)?.full_name.toLowerCase().includes(filter.toLowerCase()));
  if (!visible.length) {
    const empty = document.createElement('li'); empty.className = 'conversation-empty';
    empty.textContent = filter ? 'Nenhuma conversa encontrada.' : 'Você ainda não possui conversas.';
    conversationList.appendChild(empty); return;
  }
  visible.forEach(item => {
    const person = otherPerson(item);
    const li = document.createElement('li'); li.className = 'conversation-item'; li.dataset.id = item.id; li.tabIndex = 0;
    const avatar = document.createElement('div'); avatar.className = 'avatar avatar-purple'; avatar.textContent = initials(person.full_name);
    const info = document.createElement('div'); info.className = 'conv-info';
    const top = document.createElement('div'); top.className = 'conv-top';
    const name = document.createElement('span'); name.className = 'conv-name'; name.textContent = person.full_name;
    const date = document.createElement('span'); date.className = 'conv-date'; date.textContent = new Date(item.updated_at).toLocaleDateString('pt-BR');
    const bottom = document.createElement('div'); bottom.className = 'conv-bottom';
    const preview = document.createElement('span'); preview.className = 'conv-preview'; preview.textContent = 'Abrir conversa';
    top.append(name, date); bottom.append(preview); info.append(top, bottom); li.append(avatar, info);
    const open = () => openConversation(item);
    li.addEventListener('click', open);
    li.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
    conversationList.appendChild(li);
  });
}

async function loadMessages() {
  if (!activeConversation) return;
  const conversationId = activeConversation.id;
  const [messages, contracts] = await Promise.all([
    api.request(`messages&conversation_id=${conversationId}`),
    api.request(`contracts&conversation_id=${conversationId}`),
  ]);
  if (!activeConversation || activeConversation.id !== conversationId) return;
  messageCache = messages.reduce((cache, message) => window.NexlarChat.mergeMessages(cache, message), []);
  activeContracts = contracts; renderTimeline();
}

function stopFallback() {
  fallbackActive = false;
  clearTimeout(fallbackTimer);
  fallbackTimer = null;
}

function startFallback() {
  if (fallbackActive) return;
  fallbackActive = true;
  connectionStatus.textContent = 'Reconectando…';
  const poll = async () => {
    if (!fallbackActive) return;
    try { await loadMessages(); }
    catch (_) { /* A próxima tentativa mantém a conversa recuperável. */ }
    finally { if (fallbackActive) fallbackTimer = setTimeout(poll, 5000); }
  };
  fallbackTimer = setTimeout(poll, 0);
}

async function unsubscribeRealtime() {
  realtimeGeneration += 1;
  stopFallback();
  const channel = realtimeChannel;
  realtimeChannel = null;
  if (channel && api?.supabase) await api.supabase.removeChannel(channel);
}

async function subscribeRealtime(conversationId) {
  await unsubscribeRealtime();
  const generation = realtimeGeneration;
  connectionStatus.textContent = 'Conectando…';
  realtimeChannel = api.supabase.channel(`conversation:${conversationId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, payload => {
      if (generation !== realtimeGeneration || !window.NexlarChat.belongsToConversation(payload.new, conversationId)) return;
      if (payload.new.attachment_path) { loadMessages().catch(() => startFallback()); return; }
      messageCache = window.NexlarChat.mergeMessages(messageCache, payload.new); renderTimeline();
    })
    .subscribe(status => {
      if (generation !== realtimeGeneration) return;
      const mode = window.NexlarChat.connectionMode(status);
      if (mode === 'realtime') {
        connectionStatus.textContent = 'Em tempo real'; stopFallback();
        loadMessages().catch(() => startFallback());
      }
      else if (mode === 'fallback') startFallback();
    });
}

async function openConversation(conversation) {
  const generation = ++openGeneration;
  activeConversation = conversation; messageCache = []; activeContracts = [];
  const person = otherPerson(conversation);
  chatHeaderName.textContent = person.full_name; chatHeaderAvatar.textContent = initials(person.full_name);
  emptyState.style.display = 'none'; chatView.style.display = 'flex'; chatView.style.flexDirection = 'column';
  if (innerWidth <= 600) { messagesPanel.classList.add('hidden'); chatArea.classList.add('visible'); }
  await subscribeRealtime(conversation.id);
  if (!window.NexlarChat.isCurrentOpen(conversation.id, activeConversation?.id, generation, openGeneration)) return;
  await loadMessages();
  if (!window.NexlarChat.isCurrentOpen(conversation.id, activeConversation?.id, generation, openGeneration)) return;
  chatInput.focus();
}

async function sendMessage() {
  const body = chatInput.value.trim(); if (!body || !activeConversation) return;
  chatInput.value = '';
  try {
    const created = await api.request('messages', { method: 'POST', body: JSON.stringify({ conversation_id: activeConversation.id, body }) });
    messageCache = window.NexlarChat.mergeMessages(messageCache, created); renderTimeline();
  } catch (error) { alert(error.message); chatInput.value = body; chatInput.focus(); }
}

function attachmentMime(file) {
  const declared = (file.type || '').toLowerCase().split(';')[0];
  if (ALLOWED_ATTACHMENT_TYPES.has(declared)) return declared;
  const extension = file.name.split('.').pop().toLowerCase();
  return Object.entries(EXTENSION_BY_TYPE).find(([, ext]) => ext === extension)?.[0] || '';
}

async function sendAttachment(file) {
  if (!file || !activeConversation || uploadInProgress) return;
  const conversationId = activeConversation.id;
  const mime = attachmentMime(file);
  if (file.size > MAX_ATTACHMENT_SIZE) return showChatFeedback('O arquivo excede o limite de 15 MB.', true);
  if (!mime) return showChatFeedback('Este formato não é aceito. Envie imagem, áudio, PDF, documento ou planilha.', true);
  uploadInProgress = true; attachBtn.disabled = true; recordBtn.disabled = true;
  showChatFeedback(`Enviando ${file.name}…`);
  let path = '';
  try {
    const extension = EXTENSION_BY_TYPE[mime];
    const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    path = `${conversationId}/${id}.${extension}`;
    const { error } = await api.supabase.storage.from('chat-attachments').upload(path, file, { contentType: mime, upsert: false });
    if (error) throw error;
    const created = await api.request('messages', { method: 'POST', body: JSON.stringify({
      conversation_id: conversationId, body: '', attachment_path: path, attachment_name: file.name.slice(0, 180), attachment_mime: mime,
    }) });
    if (activeConversation?.id === conversationId) {
      messageCache = window.NexlarChat.mergeMessages(messageCache, created);
      await loadMessages();
      showChatFeedback('Arquivo enviado.');
      setTimeout(() => showChatFeedback(), 2400);
    }
  } catch (error) {
    showChatFeedback(error.message || 'Não foi possível enviar o anexo. Tente novamente.', true);
  } finally {
    uploadInProgress = false; attachBtn.disabled = false; recordBtn.disabled = false;
  }
}

async function toggleAudioRecording() {
  if (mediaRecorder?.state === 'recording') { mediaRecorder.stop(); return; }
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    showChatFeedback('A gravação de áudio não está disponível neste navegador.', true); return;
  }
  if (!activeConversation || uploadInProgress) return;
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
    mediaRecorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined);
    audioChunks = [];
    mediaRecorder.ondataavailable = event => { if (event.data.size) audioChunks.push(event.data); };
    mediaRecorder.onstop = async () => {
      const type = (mediaRecorder.mimeType || 'audio/webm').split(';')[0];
      const blob = new Blob(audioChunks, { type });
      mediaStream?.getTracks().forEach(track => track.stop()); mediaStream = null;
      recordBtn.classList.remove('is-recording'); recordBtn.setAttribute('aria-pressed', 'false');
      recordBtn.setAttribute('aria-label', 'Gravar áudio'); recordBtn.title = 'Gravar áudio';
      mediaRecorder = null; audioChunks = [];
      if (blob.size) await sendAttachment(new File([blob], `audio-${Date.now()}.${EXTENSION_BY_TYPE[type] || 'webm'}`, { type }));
      else showChatFeedback('A gravação ficou vazia. Tente novamente.', true);
      recordingStatus.hidden = true;
    };
    mediaRecorder.start();
    recordBtn.classList.add('is-recording'); recordBtn.setAttribute('aria-pressed', 'true');
    recordBtn.setAttribute('aria-label', 'Finalizar gravação de áudio'); recordBtn.title = 'Finalizar gravação';
    recordingStatus.hidden = false; showChatFeedback();
  } catch (error) {
    mediaStream?.getTracks().forEach(track => track.stop()); mediaStream = null;
    showChatFeedback(error.name === 'NotAllowedError' ? 'Permita o uso do microfone para gravar áudio.' : 'Não foi possível iniciar a gravação de áudio.', true);
  }
}

function attachDroppedFiles(event) {
  event.preventDefault(); chatMessages.classList.remove('is-drop-target');
  const file = event.dataTransfer?.files?.[0];
  if (file) sendAttachment(file);
}

async function handleContract() {
  if (!activeConversation) return;
  if (activeConversation.provider_id === me.id) {
    const latest = activeContracts[0];
    if (latest?.status === 'pago' || latest?.status === 'em_andamento') {
      const status = latest.status === 'pago' ? 'em_andamento' : 'concluido';
      await api.request(`contracts/${latest.id}/status`, { method: 'POST', body: JSON.stringify({ status }) }); return loadMessages();
    }
    proposalError.textContent = '';
    proposalForm.reset(); updateProposalBreakdown(); proposalDialog.showModal(); proposalDescription.focus(); return;
  }
  const proposal = activeContracts.find(contract => contract.status === 'proposta');
  if (!proposal) return alert('O prestador ainda não enviou uma proposta disponível.');
  return startCheckout(proposal);
}
function updateProposalBreakdown() {
  const amount = Math.max(0, Number(proposalAmount.value) || 0);
  const brl = value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  document.getElementById('proposalGross').textContent = brl(amount);
  document.getElementById('proposalFee').textContent = brl(amount * .15);
  document.getElementById('proposalNet').textContent = brl(amount * .85);
}
async function startCheckout(proposal, card = null) {
  if (card?.getAttribute('aria-disabled') === 'true') return;
  const target = card;
  if (target) { target.setAttribute('aria-disabled', 'true'); target.classList.add('is-processing'); const action = target.querySelector('.proposal-card-action'); if (action) action.textContent = 'Preparando pagamento…'; }
  try {
    const result = await api.request('payments/checkout', { method: 'POST', body: JSON.stringify({ contract_id: proposal.id }) });
    if (!result.checkout_url) throw new Error('O checkout não retornou um link de pagamento.');
    location.href = result.checkout_url;
  } catch (error) {
    if (target) { target.removeAttribute('aria-disabled'); target.classList.remove('is-processing'); const action = target.querySelector('.proposal-card-action'); if (action) action.textContent = 'Tentar contratar novamente'; }
    alert(error.message);
  }
}
proposalAmount.addEventListener('input', updateProposalBreakdown);
proposalForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!activeConversation || !(Number(proposalAmount.value) > 0)) return;
  proposalSubmit.disabled = true; proposalSubmit.textContent = 'Enviando…'; proposalError.textContent = '';
  try {
    await api.request('contracts', { method: 'POST', body: JSON.stringify({ conversation_id: activeConversation.id, description: proposalDescription.value.trim(), amount: Number(proposalAmount.value) }) });
    proposalDialog.close(); await loadMessages();
  } catch (error) { proposalError.textContent = error.message; }
  finally { proposalSubmit.disabled = false; proposalSubmit.textContent = 'Enviar proposta'; }
});

document.getElementById('backBtn').addEventListener('click', () => { openGeneration += 1; messagesPanel.classList.remove('hidden'); chatArea.classList.remove('visible'); unsubscribeRealtime(); });
document.getElementById('sendBtn').addEventListener('click', sendMessage);
attachBtn.addEventListener('click', () => attachmentInput.click());
attachmentInput.addEventListener('change', () => { sendAttachment(attachmentInput.files?.[0]); attachmentInput.value = ''; });
recordBtn.addEventListener('click', toggleAudioRecording);
chatMessages.addEventListener('dragover', event => { event.preventDefault(); chatMessages.classList.add('is-drop-target'); });
chatMessages.addEventListener('dragenter', event => { if (event.dataTransfer?.types.includes('Files')) { event.preventDefault(); chatMessages.classList.add('is-drop-target'); } });
chatMessages.addEventListener('dragleave', event => { if (!chatMessages.contains(event.relatedTarget)) chatMessages.classList.remove('is-drop-target'); });
chatMessages.addEventListener('drop', attachDroppedFiles);
chatInput.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendMessage(); } });
proposeBtn.addEventListener('click', () => handleContract().catch(error => alert(error.message)));
searchInput.addEventListener('input', () => renderConversationList(searchInput.value.trim()));
window.addEventListener('beforeunload', () => {
  if (realtimeChannel) api.supabase.removeChannel(realtimeChannel);
  if (mediaRecorder?.state === 'recording') mediaRecorder.stop();
  mediaStream?.getTracks().forEach(track => track.stop());
});

(async () => {
  api = await window.nexlarReady; await api.requireSession(); me = await api.request('me');
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
})().catch(error => {
  emptyState.querySelector('.empty-title').textContent = 'Não foi possível carregar';
  emptyState.querySelector('.empty-sub').textContent = error.message;
});

