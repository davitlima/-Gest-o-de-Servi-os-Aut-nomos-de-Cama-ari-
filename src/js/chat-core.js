(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NexlarChat = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  function mergeMessages(messages, incoming) {
    const byId = new Map(messages.map(message => [String(message.id), message]));
    if (incoming?.id !== undefined) byId.set(String(incoming.id), incoming);
    return [...byId.values()].sort((a, b) => {
      const dateOrder = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return dateOrder || Number(a.id) - Number(b.id);
    });
  }

  function professionalChatUrl(providerId) {
    return `/src/pages/painelmensagens.html?provider_id=${encodeURIComponent(providerId)}`;
  }

  function connectionMode(status) {
    if (status === 'SUBSCRIBED') return 'realtime';
    if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) return 'fallback';
    return 'connecting';
  }

  function belongsToConversation(message, conversationId) {
    return Number(message?.conversation_id) === Number(conversationId);
  }

  function isCurrentOpen(expectedId, activeId, expectedGeneration, currentGeneration) {
    return Number(expectedId) === Number(activeId) && expectedGeneration === currentGeneration;
  }

  return { mergeMessages, professionalChatUrl, connectionMode, belongsToConversation, isCurrentOpen };
});
