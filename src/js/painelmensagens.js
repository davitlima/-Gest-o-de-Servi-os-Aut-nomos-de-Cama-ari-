// ===========================
// DATA
// ===========================
const contacts = {
  1: {
    name: 'Maria Santos',
    initials: 'MS',
    avatarClass: 'avatar-purple',
    messages: [
      { from: 'them', text: 'Olhoo pode vir amanhã às 14h?' },
      { from: 'me',   text: 'Claro! Estarei lá.' },
      { from: 'them', text: 'Ótimo, obrigada!' },
    ]
  },
  2: {
    name: 'Carlos Fabrício',
    initials: 'CF',
    avatarClass: 'avatar-blue',
    messages: [
      { from: 'them', text: 'Quanto ficaria o serviço?' },
      { from: 'me',   text: 'Preciso verificar os detalhes, te retorno em breve.' },
    ]
  },
  3: {
    name: 'Ana Paula',
    initials: 'AP',
    avatarClass: 'avatar-indigo',
    messages: [
      { from: 'them', text: 'Preciso de um orçamento urgente!' },
      { from: 'me',   text: 'Pode deixar, estou preparando agora.' },
      { from: 'them', text: 'Muito obrigada!' },
    ]
  }
};

// ===========================
// ELEMENTS
// ===========================
const sidebar        = document.getElementById('sidebar');
const overlay        = document.getElementById('overlay');
const hamburger      = document.getElementById('hamburger');
const sidebarClose   = document.getElementById('sidebarClose');
const searchInput    = document.getElementById('searchInput');
const convItems      = document.querySelectorAll('.conversation-item');
const messagesPanel  = document.getElementById('messagesPanel');
const chatArea       = document.getElementById('chatArea');
const emptyState     = document.getElementById('emptyState');
const chatView       = document.getElementById('chatView');
const chatMessages   = document.getElementById('chatMessages');
const chatHeaderName = document.getElementById('chatHeaderName');
const chatHeaderAvatar = document.getElementById('chatHeaderAvatar');
const chatInput      = document.getElementById('chatInput');
const sendBtn        = document.getElementById('sendBtn');
const backBtn        = document.getElementById('backBtn');
const navItems       = document.querySelectorAll('.nav-item');

let activeContactId = null;

// ===========================
// SIDEBAR TOGGLE (mobile)
// ===========================
function openSidebar() {
  sidebar.classList.add('open');
  overlay.classList.add('visible');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('visible');
}

hamburger.addEventListener('click', openSidebar);
sidebarClose.addEventListener('click', closeSidebar);
overlay.addEventListener('click', closeSidebar);

// ===========================
// NAV ITEMS
// ===========================
navItems.forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    navItems.forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    closeSidebar();
  });
});

// ===========================
// OPEN CONVERSATION
// ===========================
function openConversation(id) {
  const contact = contacts[id];
  if (!contact) return;

  activeContactId = id;

  // Mark selected
  convItems.forEach(item => item.classList.remove('selected'));
  const selectedItem = document.querySelector(`.conversation-item[data-id="${id}"]`);
  if (selectedItem) {
    selectedItem.classList.add('selected');
    // Remove unread dot
    selectedItem.classList.remove('unread');
    const dot = selectedItem.querySelector('.unread-dot');
    if (dot) dot.remove();
  }

  // Set header
  chatHeaderName.textContent = contact.name;
  chatHeaderAvatar.className = `chat-header-avatar ${contact.avatarClass}`;
  chatHeaderAvatar.textContent = contact.initials;

  // Render messages
  chatMessages.innerHTML = '';
  contact.messages.forEach(msg => addBubble(msg.text, msg.from));

  // Show chat view
  emptyState.style.display = 'none';
  chatView.style.display = 'flex';
  chatView.style.flexDirection = 'column';

  // Mobile: switch panels
  if (window.innerWidth <= 600) {
    messagesPanel.classList.add('hidden');
    chatArea.classList.add('visible');
  }

  chatMessages.scrollTop = chatMessages.scrollHeight;
  chatInput.focus();
}

convItems.forEach(item => {
  item.addEventListener('click', () => {
    const id = parseInt(item.dataset.id);
    openConversation(id);
  });
});

// ===========================
// BACK BUTTON (mobile)
// ===========================
backBtn.addEventListener('click', () => {
  messagesPanel.classList.remove('hidden');
  chatArea.classList.remove('visible');
  activeContactId = null;
});

// ===========================
// SEND MESSAGE
// ===========================
function addBubble(text, from) {
  const bubble = document.createElement('div');
  bubble.classList.add('msg-bubble', from === 'me' ? 'sent' : 'received');
  bubble.textContent = text;
  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || !activeContactId) return;

  addBubble(text, 'me');

  // Update preview in list
  const item = document.querySelector(`.conversation-item[data-id="${activeContactId}"]`);
  if (item) {
    const preview = item.querySelector('.conv-preview');
    if (preview) preview.textContent = text.length > 30 ? text.slice(0, 30) + '...' : text;
    const dateEl = item.querySelector('.conv-date');
    if (dateEl) dateEl.textContent = 'Agora';
  }

  // Save to data
  if (contacts[activeContactId]) {
    contacts[activeContactId].messages.push({ from: 'me', text });
  }

  chatInput.value = '';
  chatInput.focus();
}

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// ===========================
// SEARCH / FILTER
// ===========================
searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase().trim();
  convItems.forEach(item => {
    const name = item.querySelector('.conv-name').textContent.toLowerCase();
    const preview = item.querySelector('.conv-preview').textContent.toLowerCase();
    const match = name.includes(query) || preview.includes(query);
    item.style.display = match ? 'flex' : 'none';
  });
});

// ===========================
// RESPONSIVE: reset on resize
// ===========================
window.addEventListener('resize', () => {
  if (window.innerWidth > 600) {
    messagesPanel.classList.remove('hidden');
    chatArea.classList.remove('visible');
  }
});