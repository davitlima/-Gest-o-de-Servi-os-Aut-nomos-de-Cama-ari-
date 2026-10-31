const assert = require('node:assert/strict');
const chat = require('../src/js/chat-core.js');

const first = { id: 10, body: 'Olá', created_at: '2026-10-31T10:00:00Z' };
const duplicate = { ...first };
const second = { id: 11, body: 'Tudo bem?', created_at: '2026-10-31T10:00:01Z' };

assert.deepEqual(chat.mergeMessages([first], duplicate), [first]);
assert.deepEqual(chat.mergeMessages([first], second), [first, second]);
assert.deepEqual(chat.mergeMessages([second], first), [first, second]);
assert.equal(chat.professionalChatUrl('abc-123'), '/src/pages/painelmensagens.html?provider_id=abc-123');
assert.equal(chat.professionalChatUrl('id com espaço'), '/src/pages/painelmensagens.html?provider_id=id%20com%20espa%C3%A7o');
assert.equal(chat.connectionMode('SUBSCRIBED'), 'realtime');
assert.equal(chat.connectionMode('CHANNEL_ERROR'), 'fallback');
assert.equal(chat.connectionMode('TIMED_OUT'), 'fallback');
assert.equal(chat.connectionMode('CLOSED'), 'fallback');
assert.equal(chat.connectionMode('JOINING'), 'connecting');
assert.equal(chat.belongsToConversation({ conversation_id: 7 }, 7), true);
assert.equal(chat.belongsToConversation({ conversation_id: 8 }, 7), false);
assert.equal(chat.isCurrentOpen(7, 7, 3, 3), true);
assert.equal(chat.isCurrentOpen(7, 8, 3, 3), false);
assert.equal(chat.isCurrentOpen(7, 7, 2, 3), false);

console.log('Comportamentos centrais do chat passaram.');
