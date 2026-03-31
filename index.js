let chatSelecionado = null;
let tipoSelecionado = null; // 'chat' ou 'grupo'

const contactos = {
    "Goncalo": { estado: "Online", sobre: "Disponivel" },
    "Lara":    { estado: "Ausente", sobre: "A trabalhar no projeto" },
    "Isaura":  { estado: "Offline", sobre: "..." }
};

const chats = {
    "Goncalo": [],
    "Lara":    [],
    "Isaura":  []
};

const grupos = {};

// Iniciais para avatar
function iniciais(nome) {
    return nome.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

// Mensagens

function sendMessage() {
    if (!chatSelecionado) return;
    const input = document.getElementById('msgInput');
    const text = input.value.trim();
    if (text === '') return;
    chats[chatSelecionado].push({ text: text, sender: 'me', time: horaAtual() });
    renderMessages();
    input.value = '';
}

function horaAtual() {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
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
        const wrap = document.createElement('div');
        wrap.classList.add('message-wrap');
        wrap.classList.add(msg.sender === 'me' ? 'me' : 'other');

        const div = document.createElement('div');
        div.classList.add('message');
        if (msg.sender === 'me') div.classList.add('me');

        if (msg.type === 'file') {
            div.classList.add('file');
            div.innerHTML = '<span class="file-icon">&#128196;</span> <a href="' + msg.url + '" download="' + msg.name + '">' + msg.name + '</a>';
        } else {
            div.textContent = msg.text;
        }

        const time = document.createElement('span');
        time.classList.add('msg-timestamp');
        time.textContent = msg.time || '';

        wrap.appendChild(div);
        wrap.appendChild(time);
        messagesDiv.appendChild(wrap);
    });

    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Header 

function atualizarHeader(nome) {
    document.getElementById('chatHeaderNome').textContent = nome;
    document.getElementById('infoBtn').style.display = 'flex';
}

// Selecionar conversa 

function selecionarConversa(nome, elemento, tipo) {
    chatSelecionado = nome;
    tipoSelecionado = tipo;

    document.querySelectorAll('.conversation').forEach(c => c.classList.remove('active'));
    elemento.classList.add('active');

    atualizarHeader(nome);
    fecharInfoPainel();
    renderMessages();

    document.getElementById('msgInput').disabled = false;
    document.getElementById('sendBtn').disabled = false;
    document.getElementById('attachBtn').disabled = false;
    document.getElementById('msgInput').focus();
}

// Painel de Info

function abrirInfoPainel() {
    if (!chatSelecionado) return;

    if (tipoSelecionado === 'chat') {
        const painel = document.getElementById('infoPainelChat');
        const c = contactos[chatSelecionado] || {};

        document.getElementById('infoAvatar').textContent = iniciais(chatSelecionado);
        document.getElementById('infoNome').textContent = chatSelecionado;
        document.getElementById('infoEstado').textContent = c.estado || '';
        document.getElementById('infoSobre').textContent = c.sobre || '—';

        document.getElementById('infoPainelGrupo').style.display = 'none';
        painel.style.display = 'flex';

    } else if (tipoSelecionado === 'grupo') {
        const painel = document.getElementById('infoPainelGrupo');
        const g = grupos[chatSelecionado] || {};

        document.getElementById('infoGrupoNome').textContent = chatSelecionado;
        document.getElementById('infoGrupoDescricao').value = g.descricao || '';

        // Membros
        const membrosDiv = document.getElementById('infoGrupoMembros');
        const membros = g.membros || [];
        membrosDiv.innerHTML = membros.length > 0
            ? membros.map(m =>
                '<div class="membro-item">' +
                    '<div class="membro-avatar">' + iniciais(m) + '</div>' +
                    '<span>' + m + '</span>' +
                '</div>'
              ).join('')
            : '<span class="info-vazio">Sem membros</span>';

        // Ficheiros
        const ficheirosList = (chats[chatSelecionado] || []).filter(m => m.type === 'file');
        const ficheirosDiv = document.getElementById('infoGrupoFicheiros');
        ficheirosDiv.innerHTML = ficheirosList.length > 0
            ? ficheirosList.map(f =>
                '<div class="ficheiro-item">' +
                    '<span class="file-icon">&#128196;</span>' +
                    '<a href="' + f.url + '" download="' + f.name + '">' + f.name + '</a>' +
                '</div>'
              ).join('')
            : '<span class="info-vazio">Nenhum ficheiro partilhado</span>';

        document.getElementById('infoPainelChat').style.display = 'none';
        painel.style.display = 'flex';
    }
}

function fecharInfoPainel() {
    document.getElementById('infoPainelChat').style.display = 'none';
    document.getElementById('infoPainelGrupo').style.display = 'none';
}

function guardarDescricao() {
    if (!chatSelecionado || !grupos[chatSelecionado]) return;
    grupos[chatSelecionado].descricao = document.getElementById('infoGrupoDescricao').value.trim();
    const btn = document.querySelector('.btn-guardar-desc');
    btn.textContent = 'Guardado!';
    setTimeout(() => btn.textContent = 'Guardar', 1500);
}

function sairDoGrupo() {
    if (!chatSelecionado || !grupos[chatSelecionado]) return;
    if (!confirm('Sair do grupo "' + chatSelecionado + '"?')) return;

    // Remove da sidebar
    const item = document.querySelector('.grupo-item[data-nome="' + chatSelecionado + '"]');
    if (item) item.remove();

    delete grupos[chatSelecionado];
    delete chats[chatSelecionado];

    chatSelecionado = null;
    tipoSelecionado = null;
    document.getElementById('chatHeaderNome').textContent = 'Nenhuma conversa selecionada';
    document.getElementById('infoBtn').style.display = 'none';
    document.getElementById('messages').innerHTML = '<p class="no-chat">Seleciona uma conversa para comecar</p>';
    document.getElementById('msgInput').disabled = true;
    document.getElementById('sendBtn').disabled = true;
    document.getElementById('attachBtn').disabled = true;
    fecharInfoPainel();
}

// Grupos 

function abrirModal() {
    document.getElementById('modalOverlay').style.display = 'flex';
    document.getElementById('nomeGrupo').value = '';
    document.querySelectorAll('#membrosList input[type=checkbox]').forEach(cb => cb.checked = false);
}

function fecharModal() {
    document.getElementById('modalOverlay').style.display = 'none';
}

function criarGrupo() {
    const nome = document.getElementById('nomeGrupo').value.trim();
    if (!nome) { alert('Indica um nome para o grupo.'); return; }
    if (grupos[nome] || chats[nome]) { alert('Ja existe uma conversa com esse nome.'); return; }

    const membros = [];
    document.querySelectorAll('#membrosList input[type=checkbox]:checked').forEach(cb => membros.push(cb.value));

    grupos[nome] = { membros: membros, descricao: '' };
    chats[nome] = [];

    adicionarGrupoSidebar(nome, membros);
    fecharModal();
}

function adicionarGrupoSidebar(nome, membros) {
    const lista = document.getElementById('listaGrupos');
    const item = document.createElement('div');
    item.classList.add('conversation', 'grupo-item');
    item.dataset.nome = nome;

    item.innerHTML =
        '<div class="grupo-info">' +
            '<span class="grupo-nome">' + nome + '</span>' +
            '<span class="grupo-membros">' + (membros.length > 0 ? membros.join(', ') : 'Sem membros') + '</span>' +
        '</div>' +
        '<button class="btn-apagar" title="Apagar grupo">&#x2715;</button>';

    item.querySelector('.grupo-info').addEventListener('click', () => {
        selecionarConversa(nome, item, 'grupo');
    });

    item.querySelector('.btn-apagar').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Apagar o grupo "' + nome + '"?')) {
            delete grupos[nome];
            delete chats[nome];
            if (chatSelecionado === nome) {
                chatSelecionado = null;
                tipoSelecionado = null;
                document.getElementById('chatHeaderNome').textContent = 'Nenhuma conversa selecionada';
                document.getElementById('infoBtn').style.display = 'none';
                document.getElementById('messages').innerHTML = '<p class="no-chat">Seleciona uma conversa para comecar</p>';
                document.getElementById('msgInput').disabled = true;
                document.getElementById('sendBtn').disabled = true;
                document.getElementById('attachBtn').disabled = true;
                fecharInfoPainel();
            }
            item.remove();
        }
    });

    lista.appendChild(item);
}

// Logout 

function fazerLogout() {
    if (!confirm('Tens a certeza que queres sair?')) return;
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    window.location.href = 'login.html';
}

function carregarUtilizador() {
    const id   = localStorage.getItem('userId')   || '';
    const nome = localStorage.getItem('userName') || 'Utilizador';

    document.getElementById('footerNome').textContent = nome;
    document.getElementById('footerId').textContent   = id;
    document.getElementById('footerAvatar').textContent = iniciais(nome);
}

// Init  

document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('msgInput');
    const fileInput = document.getElementById('fileInput');

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') sendMessage();
    });

    fileInput.addEventListener('change', function () {
        if (!chatSelecionado || !fileInput.files[0]) return;
        const file = fileInput.files[0];
        const url = URL.createObjectURL(file);
        chats[chatSelecionado].push({ type: 'file', name: file.name, url: url, sender: 'me', time: horaAtual() });
        renderMessages();
        fileInput.value = '';
    });

    document.querySelectorAll('.conversation[data-nome]').forEach(conv => {
        conv.addEventListener('click', () => {
            selecionarConversa(conv.dataset.nome, conv, 'chat');
        });
    });

    carregarUtilizador();

    document.getElementById('modalOverlay').addEventListener('click', function (e) {
        if (e.target === this) fecharModal();
    });
});