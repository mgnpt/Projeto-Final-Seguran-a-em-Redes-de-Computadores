let chatSelecionado = null;

// guarda mensagens por nome do chat
const chats = {
    "Gonçalo": [],
    "Lara": [],
    "Isaura": [],
    "Grupo Projeto": [],
    "Carlos": []
};

function sendMessage() {
    if (!chatSelecionado) return;

    const input = document.getElementById('msgInput');
    const text = input.value.trim();

    if (text === '') return;

    const messagesDiv = document.getElementById('messages');

    // guardar mensagem
    chats[chatSelecionado].push({
        text: text,
        sender: "me"
    });

    renderMessages();

    input.value = '';
}

function renderMessages() {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = '';

    const mensagens = chats[chatSelecionado];

    if (mensagens.length === 0) {
        messagesDiv.innerHTML = '<p class="no-chat">Sem mensagens ainda</p>';
        return;
    }

    mensagens.forEach(msg => {
        const div = document.createElement('div');
        div.classList.add('message');

        if (msg.sender === "me") {
            div.classList.add('me');
        }

        div.textContent = msg.text;
        messagesDiv.appendChild(div);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('msgInput');
    const sendBtn = document.getElementById('sendBtn');
    const header = document.getElementById('chatHeader');
    const messages = document.getElementById('messages');

    // Enviar com Enter
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') sendMessage();
    });

    // Carregar nas conversas
    const conversations = document.querySelectorAll('.conversation');

    conversations.forEach(conv => {
        conv.addEventListener('click', () => {
            chatSelecionado = conv.textContent;

            // Remove active de todos e aplica ao clicado
            conversations.forEach(c => c.classList.remove('active'));
            conv.classList.add('active');

            header.textContent = conv.textContent;
            renderMessages();

            input.disabled = false;
            sendBtn.disabled = false;
            input.focus();
        });
    });
});