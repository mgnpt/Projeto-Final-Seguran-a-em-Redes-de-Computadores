// @module chat.js — Lógica da página principal de chat

let currentUser = {
    id: null,
    uuid: null,
    username: null,
    email: null,
    display_name: null,
    avatar_url: null,
    public_key: null,
    key_algorithm: 'ECDH-P384',
    is_active: true,
    created_at: null,
    updated_at: null,
    last_seen_at: null
};

let authTokens = {
    access_token: null,
    refresh_token: null,
    expires_at: null
};

let chatSelecionado = null;

const conversas = new Map();
const mensagensPorConversa = new Map();

function initMockUser() {
    currentUser = {
        id: 1,
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        username: 'tomas',
        email: 'tomas@example.com',
        display_name: 'Tomás Silva',
        avatar_url: null,
        public_key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...',
        key_algorithm: 'ECDH-P384',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString()
    };
    updateCurrentUserUI();
    loadMockConversations();
}

function loadMockConversations() {
    const mockConversations = [
        {
            uuid: 'conv-001',
            type: 'direct',
            name: null,
            avatar_url: null,
            created_by: currentUser.uuid,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date(Date.now() - 3600000).toISOString(),
            other_user: {
                uuid: 'user-002',
                username: 'goncalo',
                display_name: 'Gonçalo',
                avatar_url: null,
                is_online: true,
                last_seen_at: new Date().toISOString()
            },
            last_message: {
                text: 'Vemos isso amanhã!',
                sender_uuid: 'user-002',
                created_at: new Date(Date.now() - 3600000).toISOString()
            },
            unread_count: 2
        },
        {
            uuid: 'conv-002',
            type: 'direct',
            name: null,
            avatar_url: null,
            created_by: 'user-003',
            created_at: new Date(Date.now() - 172800000).toISOString(),
            updated_at: new Date(Date.now() - 7200000).toISOString(),
            other_user: {
                uuid: 'user-003',
                username: 'lara',
                display_name: 'Lara',
                avatar_url: null,
                is_online: false,
                last_seen_at: new Date(Date.now() - 7200000).toISOString()
            },
            last_message: {
                text: 'Perfeito!',
                sender_uuid: currentUser.uuid,
                created_at: new Date(Date.now() - 7200000).toISOString()
            },
            unread_count: 0
        },
        {
            uuid: 'conv-003',
            type: 'group',
            name: 'Grupo Projeto',
            avatar_url: null,
            created_by: currentUser.uuid,
            created_at: new Date(Date.now() - 259200000).toISOString(),
            updated_at: new Date(Date.now() - 1800000).toISOString(),
            members_count: 4,
            last_message: {
                text: 'Já acabei a minha parte',
                sender_uuid: 'user-004',
                sender_name: 'Carlos',
                created_at: new Date(Date.now() - 1800000).toISOString()
            },
            unread_count: 5
        }
    ];

    mockConversations.forEach(conv => {
        conversas.set(conv.uuid, conv);
        mensagensPorConversa.set(conv.uuid, []);
    });

    renderConversationsList();
}

function updateCurrentUserUI() {
    const userNameEl    = document.getElementById('userName');
    const userIdEl      = document.getElementById('userId');
    const userInitialsEl = document.getElementById('userInitials');

    if (currentUser.display_name) {
        userNameEl.textContent = currentUser.display_name;
    } else if (currentUser.username) {
        userNameEl.textContent = currentUser.username;
    }

    if (currentUser.username) {
        const userId = currentUser.id ? currentUser.id.toString().padStart(4, '0') : '0000';
        userIdEl.textContent = `${currentUser.username}#${userId}`;
        const initials = currentUser.display_name
            ? currentUser.display_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            : currentUser.username[0].toUpperCase();
        userInitialsEl.textContent = initials;
    }
}

function renderConversationsList() {
    const listEl = document.getElementById('conversationsList');
    listEl.innerHTML = '';
    const sortedConversations = Array.from(conversas.values())
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    sortedConversations.forEach(conv => {
        listEl.appendChild(createConversationElement(conv));
    });
}

function createConversationElement(conv) {
    const div = document.createElement('div');
    div.className = 'conversation';
    div.dataset.uuid = conv.uuid;

    let displayName, initials;
    if (conv.type === 'direct') {
        displayName = conv.other_user.display_name || conv.other_user.username;
        initials = displayName[0].toUpperCase();
    } else {
        displayName = conv.name;
        initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

    const lastMessageTime = conv.last_message
        ? formatRelativeTime(new Date(conv.last_message.created_at))
        : '';

    let previewText = 'Sem mensagens';
    if (conv.last_message) {
        const prefix = conv.last_message.sender_uuid === currentUser.uuid ? 'Tu: ' :
                      (conv.type === 'group' && conv.last_message.sender_name ? `${conv.last_message.sender_name}: ` : '');
        previewText = prefix + conv.last_message.text;
    }

    div.innerHTML = `
        <div class="conversation-avatar">${initials}</div>
        <div class="conversation-info">
            <div class="conversation-name">${displayName}</div>
            <div class="conversation-preview">${previewText}</div>
        </div>
        <div class="conversation-meta">
            <div class="conversation-time">${lastMessageTime}</div>
            ${conv.unread_count > 0 ? `<span class="conversation-unread">${conv.unread_count}</span>` : ''}
        </div>
    `;

    div.addEventListener('click', () => selectConversation(conv.uuid));
    return div;
}

function selectConversation(uuid) {
    const conv = conversas.get(uuid);
    if (!conv) return;

    chatSelecionado = uuid;

    document.querySelectorAll('.conversation').forEach(el => el.classList.remove('active'));
    document.querySelector(`[data-uuid="${uuid}"]`)?.classList.add('active');

    updateChatHeader(conv);
    renderMessages();

    const input = document.getElementById('msgInput');
    const sendBtn = document.getElementById('sendBtn');
    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
}

function updateChatHeader(conv) {
    const headerEl = document.querySelector('.header-info');
    let displayName, status;

    if (conv.type === 'direct') {
        displayName = conv.other_user.display_name || conv.other_user.username;
        status = conv.other_user.is_online ? 'online' :
                 `visto ${formatRelativeTime(new Date(conv.other_user.last_seen_at))}`;
    } else {
        displayName = conv.name;
        status = `${conv.members_count} membros`;
    }

    headerEl.innerHTML = `
        <div class="chat-name">${displayName}</div>
        <div class="chat-status ${conv.type === 'direct' && conv.other_user.is_online ? 'online' : ''}">${status}</div>
    `;
}

function sendMessage() {
    if (!chatSelecionado) return;
    const input = document.getElementById('msgInput');
    const text = input.value.trim();
    if (text === '') return;

    const message = {
        uuid: generateUUID(),
        conversation_id: chatSelecionado,
        sender_id: currentUser.uuid,
        ciphertext: null,
        iv: null,
        signature: null,
        content_hash: null,
        message_type: 'text',
        reply_to_message_id: null,
        created_at: new Date().toISOString(),
        edited_at: null,
        deleted_at: null,
        text: text,
        sender: currentUser
    };

    const messages = mensagensPorConversa.get(chatSelecionado) || [];
    messages.push(message);
    mensagensPorConversa.set(chatSelecionado, messages);

    const conv = conversas.get(chatSelecionado);
    if (conv) {
        conv.last_message = {
            text: text,
            sender_uuid: currentUser.uuid,
            created_at: message.created_at
        };
        conv.updated_at = message.created_at;
    }

    renderMessages();
    renderConversationsList();
    input.value = '';
}

function renderMessages() {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = '';
    const messages = mensagensPorConversa.get(chatSelecionado) || [];

    if (messages.length === 0) {
        messagesDiv.innerHTML = '<p class="no-chat">Sem mensagens ainda</p>';
        return;
    }

    let currentGroup = null;

    messages.forEach(msg => {
        const isMe = msg.sender_id === currentUser.uuid;

        if (!currentGroup || currentGroup.sender !== msg.sender_id) {
            if (currentGroup) messagesDiv.appendChild(currentGroup.element);
            currentGroup = { sender: msg.sender_id, element: document.createElement('div') };
            currentGroup.element.className = `message-group ${isMe ? 'message-me-group' : ''}`;

            if (!isMe) {
                const header = document.createElement('div');
                header.className = 'message-header';
                const senderName = msg.sender?.display_name || msg.sender?.username || 'Desconhecido';
                header.innerHTML = `
                    <span class="message-sender">${senderName}</span>
                    <span class="message-time">${formatMessageTime(new Date(msg.created_at))}</span>
                `;
                currentGroup.element.appendChild(header);
            }
        }

        const bubble = document.createElement('div');
        bubble.className = `message ${isMe ? 'me' : ''}`;
        bubble.textContent = msg.text;
        if (isMe) bubble.title = formatMessageTime(new Date(msg.created_at));
        currentGroup.element.appendChild(bubble);
    });

    if (currentGroup) messagesDiv.appendChild(currentGroup.element);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function formatMessageTime(date) {
    return date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

function formatRelativeTime(date) {
    const diff    = new Date() - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours   = Math.floor(minutes / 60);
    const days    = Math.floor(hours / 24);
    if (seconds < 60) return 'agora';
    if (minutes < 60) return `há ${minutes}m`;
    if (hours   < 24) return `há ${hours}h`;
    if (days    <  7) return `há ${days}d`;
    return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
}

document.addEventListener('DOMContentLoaded', function () {
    initMockUser();

    const input = document.getElementById('msgInput');
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        // TODO: POST /api/v1/auth/logout
        window.location.href = 'login.html';
    });

    document.getElementById('newChatBtn').addEventListener('click', () => {
        // TODO: Abrir modal de pesquisa de utilizadores
        alert('Pesquisa de utilizadores (a implementar)');
    });
});