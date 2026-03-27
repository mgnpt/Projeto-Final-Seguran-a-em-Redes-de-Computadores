let chatSelecionado = null;

// Guarda mensagens por nome do chat
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

    // Guardar mensagem no chat atual
    chats[chatSelecionado].push({ text: text, sender: 'me' });

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
        if (msg.sender === 'me') div.classList.add('me');

        if (msg.type === 'file') {
            div.classList.add('file');
            div.innerHTML = `<span class="file-icon">📄</span> <a href="${msg.url}" download="${msg.name}">${msg.name}</a>`;
        } else {
            div.textContent = msg.text;
        }

        messagesDiv.appendChild(div);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('msgInput');
    const sendBtn = document.getElementById('sendBtn');
    const attachBtn = document.getElementById('attachBtn');
    const fileInput = document.getElementById('fileInput');
    const header = document.getElementById('chatHeader');

    // Enviar com Enter
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') sendMessage();
    });

    // Envio de ficheiro
    fileInput.addEventListener('change', function () {
        if (!chatSelecionado || !fileInput.files[0]) return;

        const file = fileInput.files[0];
        const url = URL.createObjectURL(file);

        chats[chatSelecionado].push({ type: 'file', name: file.name, url: url, sender: 'me' });
        renderMessages();

        // Limpar para permitir selecionar o mesmo ficheiro outra vez
        fileInput.value = '';
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
            attachBtn.disabled = false;
            input.focus();
        });
    });
});