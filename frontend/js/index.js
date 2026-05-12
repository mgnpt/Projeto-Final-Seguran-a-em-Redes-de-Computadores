// @module index.js - Lógica principal do chat com estrutura preparada para backend

// ESTADO GLOBAL DA APLICAÇÃO

// Utilizador atual (virá do backend após login)
let currentUser = {
    id: null,              // BIGINT do backend
    uuid: null,            // UUID público
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

// JWT e tokens de autenticação
let authTokens = {
    access_token: null,    // JWT para autorizar pedidos
    refresh_token: null,   // Para renovar o access_token
    expires_at: null
};

// Chat atualmente selecionado
let chatSelecionado = null;
let tipoSelecionado = null; // 'chat' ou 'grupo'

// Estrutura de conversas (virá do backend)
const conversas = new Map(); // Map<uuid, Conversation>

// Estrutura de mensagens por conversa
const mensagensPorConversa = new Map(); // Map<conversationUuid, Message[]>

// Dados de contactos (temporário - virá do backend)
const contactos = {
    "Goncalo": { estado: "Online", sobre: "Disponivel" },
    "Lara":    { estado: "Ausente", sobre: "A trabalhar no projeto" },
    "Isaura":  { estado: "Offline", sobre: "..." }
};

// Grupos (temporário - virá do backend)
const grupos = {};

// UTILITÁRIOS

function iniciais(nome) {
    if (!nome) return '?';
    return nome.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function horaAtual() {
    const now = new Date();
    return now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
}

function formatMessageTime(date) {
    return date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

function formatRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'agora';
    if (minutes < 60) return `há ${minutes}m`;
    if (hours < 24) return `há ${hours}h`;
    if (days < 7) return `há ${days}d`;
    
    return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
}

// DADOS MOCK (Simula resposta do backend)

function initMockUser() {
    // Carregar do localStorage se existir
    const savedId = localStorage.getItem('userId');
    const savedName = localStorage.getItem('userName');
    
    currentUser = {
        id: 1,
        uuid: '550e8400-e29b-41d4-a716-446655440000',
        username: savedName || 'tomas',
        email: 'tomas@example.com',
        display_name: savedName || 'Tomás Ribeiro',
        avatar_url: null,
        public_key: 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...',
        key_algorithm: 'ECDH-P384',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString()
    };
    
    // Atualizar UI com dados do user
    updateCurrentUserUI();
    
    // Carregar conversas mock
    loadMockConversations();
}

function loadMockConversations() {
    const mockConversations = [
        {
            uuid: 'conv-goncalo',
            type: 'direct',
            name: 'Goncalo',
            avatar_url: null,
            created_by: currentUser.uuid,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date(Date.now() - 3600000).toISOString(),
            other_user: {
                uuid: 'user-goncalo',
                username: 'goncalo',
                display_name: 'Gonçalo',
                avatar_url: null,
                is_online: true,
                last_seen_at: new Date().toISOString()
            },
            unread_count: 0
        },
        {
            uuid: 'conv-lara',
            type: 'direct',
            name: 'Lara',
            avatar_url: null,
            created_by: 'user-lara',
            created_at: new Date(Date.now() - 172800000).toISOString(),
            updated_at: new Date(Date.now() - 7200000).toISOString(),
            other_user: {
                uuid: 'user-lara',
                username: 'lara',
                display_name: 'Lara',
                avatar_url: null,
                is_online: false,
                last_seen_at: new Date(Date.now() - 7200000).toISOString()
            },
            unread_count: 0
        },
        {
            uuid: 'conv-isaura',
            type: 'direct',
            name: 'Isaura',
            avatar_url: null,
            created_by: currentUser.uuid,
            created_at: new Date(Date.now() - 259200000).toISOString(),
            updated_at: new Date(Date.now() - 10800000).toISOString(),
            other_user: {
                uuid: 'user-isaura',
                username: 'isaura',
                display_name: 'Isaura',
                avatar_url: null,
                is_online: false,
                last_seen_at: new Date(Date.now() - 10800000).toISOString()
            },
            unread_count: 0
        }
    ];
    
    // Guardar conversas no Map
    mockConversations.forEach(conv => {
        conversas.set(conv.uuid, conv);
        mensagensPorConversa.set(conv.uuid, []);
    });
    
    // Renderizar lista de conversas
    renderConversationsList();
}

// UI - ATUALIZAÇÃO DO UTILIZADOR ATUAL

function updateCurrentUserUI() {
    const userNameEl = document.getElementById('footerNome');
    const userIdEl = document.getElementById('footerId');
    const userInitialsEl = document.getElementById('footerAvatar');
    
    if (!userNameEl) return;
    
    if (currentUser.display_name) {
        userNameEl.textContent = currentUser.display_name;
    } else if (currentUser.username) {
        userNameEl.textContent = currentUser.username;
    }
    
    if (currentUser.username) {
        // Gerar ID formatado (nome#1234)
        const userId = localStorage.getItem('userId') || 
                      (currentUser.id ? currentUser.id.toString().padStart(4, '0') : '0000');
        userIdEl.textContent = userId;
        
        // Iniciais para avatar
        const initials = currentUser.display_name 
            ? iniciais(currentUser.display_name)
            : currentUser.username[0].toUpperCase();
        userInitialsEl.textContent = initials;
    }
}

// UI - LISTA DE CONVERSAS

function renderConversationsList() {
    // Renderizar conversas diretas
    const directConvs = Array.from(conversas.values()).filter(c => c.type === 'direct');
    
    directConvs.forEach(conv => {
        const existing = document.querySelector(`.conversation[data-uuid="${conv.uuid}"]`);
        if (!existing) {
            // Criar se não existe
            const convEl = document.createElement('div');
            convEl.className = 'conversation';
            convEl.dataset.uuid = conv.uuid;
            convEl.dataset.nome = conv.name;
            
            const displayName = conv.other_user?.display_name || conv.name;
            
            convEl.innerHTML = `
                <div class="conversation-avatar">${iniciais(displayName)}</div>
                <div class="conversation-info">
                    <div class="conversation-name">${displayName}</div>
                </div>
            `;
            
            convEl.addEventListener('click', () => {
                selecionarConversa(conv.name, convEl, 'chat', conv.uuid);
            });
            
            const lista = document.getElementById('listaConversas');
            if (lista) lista.appendChild(convEl);
        }
    });
    
    // Renderizar grupos
    Object.keys(grupos).forEach(nomeGrupo => {
        const existing = document.querySelector(`.grupo-item[data-nome="${nomeGrupo}"]`);
        if (!existing) {
            adicionarGrupoSidebar(nomeGrupo, grupos[nomeGrupo].membros);
        }
    });
}

// SELEÇÃO DE CONVERSA

function selecionarConversa(nome, elemento, tipo, uuid) {
    chatSelecionado = nome;
    tipoSelecionado = tipo;
    
    // Atualizar estado ativo na sidebar
    document.querySelectorAll('.conversation, .grupo-item').forEach(el => {
        el.classList.remove('active');
    });
    elemento.classList.add('active');
    
    // Atualizar header
    atualizarHeader(nome);
    
    // Fechar painel de info se estiver aberto
    fecharInfoPainel();
    
    // Renderizar mensagens
    renderMessages();
    
    // Ativar input
    const msgInput = document.getElementById('msgInput');
    const sendBtn = document.getElementById('sendBtn');
    const attachBtn = document.getElementById('attachBtn');
    
    if (msgInput) msgInput.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    if (attachBtn) attachBtn.disabled = false;
    if (msgInput) msgInput.focus();
}

function atualizarHeader(nome) {
    const headerNome = document.getElementById('chatHeaderNome');
    const infoBtn = document.getElementById('infoBtn');
    
    if (headerNome) headerNome.textContent = nome;
    if (infoBtn) infoBtn.style.display = 'flex';
}

// ENVIO DE MENSAGEM

function sendMessage() {
    if (!chatSelecionado) return;
    
    const input = document.getElementById('msgInput');
    const text = input.value.trim();
    
    if (text === '') return;
    
    // Encontrar UUID da conversa
    let conversationUuid = null;
    conversas.forEach((conv, uuid) => {
        if (conv.name === chatSelecionado) {
            conversationUuid = uuid;
        }
    });
    
    // Se não encontrou (é grupo), usar o nome como chave
    if (!conversationUuid) {
        conversationUuid = 'grupo-' + chatSelecionado;
        if (!mensagensPorConversa.has(conversationUuid)) {
            mensagensPorConversa.set(conversationUuid, []);
        }
    }
    
    // Criar objeto de mensagem (formato backend)
    const message = {
        uuid: generateUUID(),
        conversation_id: conversationUuid,
        sender_id: currentUser.uuid,
        // Quando tiveres crypto, estes campos serão preenchidos:
        ciphertext: null,
        iv: null,
        signature: null,
        content_hash: null,
        message_type: 'text',
        reply_to_message_id: null,
        created_at: new Date().toISOString(),
        edited_at: null,
        deleted_at: null,
        // Dados locais
        text: text,
        sender: 'me',
        time: horaAtual()
    };
    
    // Guardar mensagem
    const messages = mensagensPorConversa.get(conversationUuid) || [];
    messages.push(message);
    mensagensPorConversa.set(conversationUuid, messages);
    
    // Atualizar conversa
    const conv = conversas.get(conversationUuid);
    if (conv) {
        conv.updated_at = message.created_at;
    }
    
    // Re-renderizar
    renderMessages();
    
    // Limpar input
    input.value = '';
    
    // TODO: Quando tiveres backend, enviar para API
    console.log('Mensagem a enviar para o backend:', {
        conversation_uuid: conversationUuid,
        message_type: 'text',
        ciphertext: '[texto cifrado aqui]',
        iv: '[IV aqui]',
        signature: '[assinatura aqui]',
        content_hash: '[hash aqui]'
    });
}

// RENDERIZAÇÃO DE MENSAGENS

function renderMessages() {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = '';
    
    // Encontrar UUID da conversa
    let conversationUuid = null;
    conversas.forEach((conv, uuid) => {
        if (conv.name === chatSelecionado) {
            conversationUuid = uuid;
        }
    });
    
    if (!conversationUuid) {
        conversationUuid = 'grupo-' + chatSelecionado;
    }
    
    const mensagens = mensagensPorConversa.get(conversationUuid) || [];
    
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
            div.innerHTML = '<span class="file-icon">📄</span> <a href="' + msg.url + '" download="' + msg.name + '">' + msg.name + '</a>';
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

// PAINEL DE INFO

function abrirInfoPainel() {
    if (!chatSelecionado) return;
    
    if (tipoSelecionado === 'chat') {
        const painel = document.getElementById('infoPainelChat');
        if (!painel) return;
        
        const c = contactos[chatSelecionado] || {};

        const infoAvatar = document.getElementById('infoAvatar');
        const infoNome = document.getElementById('infoNome');
        const infoEstado = document.getElementById('infoEstado');
        const infoSobre = document.getElementById('infoSobre');

        if (infoAvatar) infoAvatar.textContent = iniciais(chatSelecionado);
        if (infoNome) infoNome.textContent = chatSelecionado;
        if (infoEstado) infoEstado.textContent = c.estado || '';
        if (infoSobre) infoSobre.textContent = c.sobre || '—';

        // Ficheiros do chat direto
        let convUuid = null;
        conversas.forEach((conv, uuid) => {
            if (conv.name === chatSelecionado) convUuid = uuid;
        });
        const ficheirosChatList = convUuid
            ? (mensagensPorConversa.get(convUuid) || []).filter(m => m.type === 'file')
            : [];
        const ficheirosDiv = document.getElementById('infoChatFicheirosList');
        if (ficheirosDiv) {
            ficheirosDiv.innerHTML = ficheirosChatList.length > 0
                ? ficheirosChatList.map(f =>
                    '<div class="ficheiro-item">' +
                        '<span class="file-icon">📄</span>' +
                        '<a href="' + f.url + '" download="' + f.name + '">' + f.name + '</a>' +
                    '</div>'
                  ).join('')
                : '<span class="info-vazio">Nenhum ficheiro partilhado</span>';
        }

        const painelGrupo = document.getElementById('infoPainelGrupo');
        if (painelGrupo) painelGrupo.style.display = 'none';
        painel.style.display = 'flex';
        
    } else if (tipoSelecionado === 'grupo') {
        const painel = document.getElementById('infoPainelGrupo');
        if (!painel) return;
        
        const g = grupos[chatSelecionado] || {};
        
        const infoGrupoNome = document.getElementById('infoGrupoNome');
        const infoGrupoDescricao = document.getElementById('infoGrupoDescricao');
        
        if (infoGrupoNome) infoGrupoNome.textContent = chatSelecionado;
        if (infoGrupoDescricao) infoGrupoDescricao.value = g.descricao || '';
        
        // Membros
        const membrosDiv = document.getElementById('infoGrupoMembros');
        if (membrosDiv) {
            const membros = g.membros || [];
            if (membros.length > 0) {
                membrosDiv.innerHTML = '';
                membros.forEach(m => {
                    const item = document.createElement('div');
                    item.classList.add('membro-item', 'membro-clicavel');
                    item.innerHTML =
                        '<div class="membro-avatar">' + iniciais(m) + '</div>' +
                        '<span>' + m + '</span>' +
                        '<svg class="membro-seta" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
                    item.addEventListener('click', () => abrirPerfilMembro(m));
                    membrosDiv.appendChild(item);
                });
            } else {
                membrosDiv.innerHTML = '<span class="info-vazio">Sem membros</span>';
            }
        }
        
        // Ficheiros
        const conversationUuid = 'grupo-' + chatSelecionado;
        const ficheirosList = (mensagensPorConversa.get(conversationUuid) || []).filter(m => m.type === 'file');
        const ficheirosDiv = document.getElementById('infoGrupoFicheiros');
        if (ficheirosDiv) {
            ficheirosDiv.innerHTML = ficheirosList.length > 0
                ? ficheirosList.map(f =>
                    '<div class="ficheiro-item">' +
                        '<span class="file-icon">📄</span>' +
                        '<a href="' + f.url + '" download="' + f.name + '">' + f.name + '</a>' +
                    '</div>'
                  ).join('')
                : '<span class="info-vazio">Nenhum ficheiro partilhado</span>';
        }
        
        const painelChat = document.getElementById('infoPainelChat');
        if (painelChat) painelChat.style.display = 'none';
        painel.style.display = 'flex';
    }
}

function fecharInfoPainel() {
    const painelChat = document.getElementById('infoPainelChat');
    const painelGrupo = document.getElementById('infoPainelGrupo');
    
    if (painelChat) painelChat.style.display = 'none';
    if (painelGrupo) painelGrupo.style.display = 'none';
}

function abrirPerfilMembro(nome) {
    const c = contactos[nome] || {};
    
    const infoAvatar = document.getElementById('infoAvatar');
    const infoNome = document.getElementById('infoNome');
    const infoEstado = document.getElementById('infoEstado');
    const infoSobre = document.getElementById('infoSobre');
    
    if (infoAvatar) infoAvatar.textContent = iniciais(nome);
    if (infoNome) infoNome.textContent = nome;
    if (infoEstado) infoEstado.textContent = c.estado || 'Desconhecido';
    if (infoSobre) infoSobre.textContent = c.sobre || '—';
    
    // Botão de voltar ao grupo
    const painel = document.getElementById('infoPainelChat');
    if (!painel) return;
    
    let btnVoltar = painel.querySelector('.btn-voltar-grupo');
    if (!btnVoltar) {
        btnVoltar = document.createElement('button');
        btnVoltar.className = 'btn-voltar-grupo';
        btnVoltar.innerHTML = '&#8592; Voltar ao grupo';
        btnVoltar.addEventListener('click', () => {
            btnVoltar.remove();
            abrirInfoPainel();
        });
        const innerPanel = painel.querySelector('.info-painel-inner');
        const infoAvatarEl = painel.querySelector('.info-avatar');
        if (innerPanel && infoAvatarEl) {
            innerPanel.insertBefore(btnVoltar, infoAvatarEl);
        }
    }
    
    const painelGrupo = document.getElementById('infoPainelGrupo');
    if (painelGrupo) painelGrupo.style.display = 'none';
    painel.style.display = 'flex';
}

function guardarDescricao() {
    if (!chatSelecionado || !grupos[chatSelecionado]) return;
    
    const descricaoInput = document.getElementById('infoGrupoDescricao');
    if (descricaoInput) {
        grupos[chatSelecionado].descricao = descricaoInput.value.trim();
    }
    
    const btn = document.querySelector('.btn-guardar-desc');
    if (btn) {
        btn.textContent = 'Guardado!';
        setTimeout(() => btn.textContent = 'Guardar', 1500);
    }
}

function sairDoGrupo() {
    if (!chatSelecionado || !grupos[chatSelecionado]) return;
    if (!confirm('Sair do grupo "' + chatSelecionado + '"?')) return;
    
    // Remove da sidebar
    const item = document.querySelector('.grupo-item[data-nome="' + chatSelecionado + '"]');
    if (item) item.remove();
    
    delete grupos[chatSelecionado];
    const conversationUuid = 'grupo-' + chatSelecionado;
    mensagensPorConversa.delete(conversationUuid);
    
    limparChat();
}

// GRUPOS

function abrirModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    const nomeGrupo = document.getElementById('nomeGrupo');
    
    if (modalOverlay) modalOverlay.style.display = 'flex';
    if (nomeGrupo) nomeGrupo.value = '';
    
    document.querySelectorAll('#membrosList input[type=checkbox]').forEach(cb => cb.checked = false);
}

function fecharModal() {
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) modalOverlay.style.display = 'none';
}

function criarGrupo() {
    const nomeInput = document.getElementById('nomeGrupo');
    if (!nomeInput) return;
    
    const nome = nomeInput.value.trim();
    if (!nome) { alert('Indica um nome para o grupo.'); return; }
    if (grupos[nome]) { alert('Ja existe um grupo com esse nome.'); return; }
    
    const membros = [];
    document.querySelectorAll('#membrosList input[type=checkbox]:checked').forEach(cb => membros.push(cb.value));
    
    grupos[nome] = { membros: membros, descricao: '' };
    const conversationUuid = 'grupo-' + nome;
    mensagensPorConversa.set(conversationUuid, []);
    
    adicionarGrupoSidebar(nome, membros);
    fecharModal();
    
    // TODO: Quando tiveres backend, chamar POST /api/v1/groups
    console.log('Criar grupo no backend:', {
        name: nome,
        members: membros.map(m => ({ uuid: 'user-' + m, encrypted_session_key: '[chave cifrada]' }))
    });
}

function adicionarGrupoSidebar(nome, membros) {
    const lista = document.getElementById('listaGrupos');
    if (!lista) return;
    
    const item = document.createElement('div');
    item.classList.add('conversation', 'grupo-item');
    item.dataset.nome = nome;
    
    item.innerHTML =
        '<div class="grupo-info">' +
            '<span class="grupo-nome">' + nome + '</span>' +
            '<span class="grupo-membros">' + (membros.length > 0 ? membros.join(', ') : 'Sem membros') + '</span>' +
        '</div>' +
        '<button class="btn-apagar" title="Apagar grupo">&#x2715;</button>';
    
    const grupoInfo = item.querySelector('.grupo-info');
    if (grupoInfo) {
        grupoInfo.addEventListener('click', () => {
            selecionarConversa(nome, item, 'grupo', 'grupo-' + nome);
        });
    }
    
    const btnApagar = item.querySelector('.btn-apagar');
    if (btnApagar) {
        btnApagar.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm('Apagar o grupo "' + nome + '"?')) {
                delete grupos[nome];
                const conversationUuid = 'grupo-' + nome;
                mensagensPorConversa.delete(conversationUuid);
                
                if (chatSelecionado === nome) {
                    limparChat();
                }
                item.remove();
            }
        });
    }
    
    lista.appendChild(item);
}

// PESQUISA

function pesquisar(query) {
    const q = query.toLowerCase().trim();
    const clearBtn = document.getElementById('searchClear');
    if (clearBtn) clearBtn.style.display = q ? 'flex' : 'none';
    
    // Filtrar conversas diretas
    document.querySelectorAll('.conversation[data-nome]').forEach(conv => {
        const nome = conv.dataset.nome.toLowerCase();
        conv.style.display = nome.includes(q) ? '' : 'none';
    });
    
    // Filtrar grupos
    document.querySelectorAll('.grupo-item').forEach(item => {
        const nome = (item.dataset.nome || '').toLowerCase();
        item.style.display = nome.includes(q) ? '' : 'none';
    });
    
    // Mostrar/esconder label "Grupos" se não houver resultados
    const gruposVisiveis = [...document.querySelectorAll('.grupo-item')]
        .some(i => i.style.display !== 'none');
    const sectionGrupos = document.querySelector('.sidebar-section');
    if (sectionGrupos) sectionGrupos.style.display = (!q || gruposVisiveis) ? '' : 'none';
}

function limparPesquisa() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    
    input.value = '';
    pesquisar('');
    input.focus();
}

// FICHEIROS

function handleFileUpload(file) {
    if (!chatSelecionado || !file) return;
    
    // Encontrar UUID da conversa
    let conversationUuid = null;
    conversas.forEach((conv, uuid) => {
        if (conv.name === chatSelecionado) {
            conversationUuid = uuid;
        }
    });
    
    if (!conversationUuid) {
        conversationUuid = 'grupo-' + chatSelecionado;
    }
    
    const url = URL.createObjectURL(file);
    
    const message = {
        uuid: generateUUID(),
        conversation_id: conversationUuid,
        sender_id: currentUser.uuid,
        message_type: 'file',
        type: 'file',
        name: file.name,
        url: url,
        sender: 'me',
        time: horaAtual(),
        created_at: new Date().toISOString()
    };
    
    const messages = mensagensPorConversa.get(conversationUuid) || [];
    messages.push(message);
    mensagensPorConversa.set(conversationUuid, messages);
    
    renderMessages();

    // Atualizar painel de info se estiver aberto
    const painelChatAberto = document.getElementById('infoPainelChat');
    const painelGrupoAberto = document.getElementById('infoPainelGrupo');
    if ((painelChatAberto && painelChatAberto.style.display !== 'none') ||
        (painelGrupoAberto && painelGrupoAberto.style.display !== 'none')) {
        abrirInfoPainel();
    }

    // TODO: Quando tiveres backend:
    // 1. Cifrar o ficheiro com AES-256-GCM
    // 2. Enviar para POST /api/v1/files/upload
    // 3. Guardar o file_uuid retornado
    console.log('Ficheiro a enviar para o backend:', {
        filename: file.name,
        size: file.size,
        conversation_uuid: conversationUuid
    });
}

// PERFIL PRÓPRIO

function abrirPerfilProprio() {
    // TODO: Quando tiveres página de settings, redirecionar para lá
    // window.location.href = 'settings.html';
    
    alert('Perfil do utilizador\n\n' +
          'Nome: ' + currentUser.display_name + '\n' +
          'Username: ' + currentUser.username + '\n' +
          'Email: ' + currentUser.email + '\n' +
          'UUID: ' + currentUser.uuid + '\n\n' +
          '(A página de definições será implementada)');
}

// LOGOUT

function fazerLogout() {
    if (!confirm('Tens a certeza que queres sair?')) return;
    
    // TODO: Quando tiveres backend, chamar POST /api/v1/auth/logout
    console.log('Logout - revogar tokens no backend');
    
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userUsername');
    localStorage.removeItem('access_token');
    window.location.href = 'login.html';
}

// UTILITÁRIOS DE UI

function limparChat() {
    chatSelecionado = null;
    tipoSelecionado = null;
    
    document.querySelectorAll('.conversation, .grupo-item').forEach(c => c.classList.remove('active'));
    
    const headerNome = document.getElementById('chatHeaderNome');
    const infoBtn = document.getElementById('infoBtn');
    const messages = document.getElementById('messages');
    const msgInput = document.getElementById('msgInput');
    const sendBtn = document.getElementById('sendBtn');
    const attachBtn = document.getElementById('attachBtn');
    
    if (headerNome) headerNome.textContent = 'Nenhuma conversa selecionada';
    if (infoBtn) infoBtn.style.display = 'none';
    if (messages) messages.innerHTML = '<p class="no-chat">Seleciona uma conversa para comecar</p>';
    if (msgInput) msgInput.disabled = true;
    if (sendBtn) sendBtn.disabled = true;
    if (attachBtn) attachBtn.disabled = false;
    
    fecharInfoPainel();
}

// INICIALIZAÇÃO

document.addEventListener('DOMContentLoaded', function () {
    // Inicializar dados mock
    initMockUser();
    
    const input = document.getElementById('msgInput');
    const fileInput = document.getElementById('fileInput');
    
    // Enviar com Enter
    if (input) {
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    // Upload de ficheiros
    if (fileInput) {
        fileInput.addEventListener('change', function () {
            if (fileInput.files[0]) {
                handleFileUpload(fileInput.files[0]);
                fileInput.value = '';
            }
        });
    }
    
    // Click no overlay do modal fecha o modal
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function (e) {
            if (e.target === this) fecharModal();
        });
    }
    
    // ESC: fecha painel de info → sai da conversa
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        
        const painelChat = document.getElementById('infoPainelChat');
        const painelGrupo = document.getElementById('infoPainelGrupo');
        
        const painelChatAberto  = painelChat && painelChat.style.display  !== 'none';
        const painelGrupoAberto = painelGrupo && painelGrupo.style.display !== 'none';
        
        if (painelChatAberto || painelGrupoAberto) {
            // 1º ESC: fecha o painel de info
            fecharInfoPainel();
        } else if (chatSelecionado) {
            // 2º ESC: sai da conversa
            limparChat();
            if (input) input.blur();
        }
    });
});

// EXPORTAR FUNÇÕES GLOBAIS

// Funções que precisam ser acessíveis globalmente (chamadas inline no HTML)
window.sendMessage = sendMessage;
window.abrirInfoPainel = abrirInfoPainel;
window.fecharInfoPainel = fecharInfoPainel;
window.guardarDescricao = guardarDescricao;
window.sairDoGrupo = sairDoGrupo;
window.abrirModal = abrirModal;
window.fecharModal = fecharModal;
window.criarGrupo = criarGrupo;
window.pesquisar = pesquisar;
window.limparPesquisa = limparPesquisa;
window.fazerLogout = fazerLogout;
window.abrirPerfilProprio = abrirPerfilProprio;

// Debug (acessível na consola)
window.debugApp = {
    currentUser,
    conversas,
    mensagensPorConversa,
    grupos,
    chatSelecionado,
    tipoSelecionado
};