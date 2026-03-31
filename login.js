// Simula utilizadores registados (substituir por chamadas à API)
// Formato: { "user#1234": { nome: "Goncalo", password: "hash..." } }
const utilizadoresRegistados = {};

// Tabs 

function mostrarTab(tab) {
    const isLogin = tab === 'login';

    document.getElementById('formLogin').style.display  = isLogin ? 'flex' : 'none';
    document.getElementById('formSignup').style.display = isLogin ? 'none' : 'flex';
    document.getElementById('tabLogin').classList.toggle('active', isLogin);
    document.getElementById('tabSignup').classList.toggle('active', !isLogin);

    esconderMsg();
}

// Mensagens 

function mostrarMsg(texto, tipo) {
    const box = document.getElementById('msgBox');
    box.textContent = texto;
    box.className = 'msg-box ' + tipo;
    box.style.display = 'flex';
}

function esconderMsg() {
    const box = document.getElementById('msgBox');
    box.style.display = 'none';
}

// Mostrar/esconder password 

function togglePass(inputId, btn) {
    const input = document.getElementById(inputId);
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    btn.style.color = isPass ? 'var(--text-dim)' : 'var(--text-faint)';
}

// Força da password 

function avaliarPassword(pass) {
    const fill  = document.getElementById('strengthFill');
    const label = document.getElementById('strengthLabel');

    if (!pass) {
        fill.style.width = '0%';
        label.textContent = '';
        return;
    }

    let score = 0;
    if (pass.length >= 8)               score++;
    if (/[A-Z]/.test(pass))             score++;
    if (/[0-9]/.test(pass))             score++;
    if (/[^A-Za-z0-9]/.test(pass))      score++;

    const niveis = [
        { label: 'Fraca',    cor: '#ef4444', pct: '25%' },
        { label: 'Razoavel', cor: '#eab308', pct: '50%' },
        { label: 'Boa',      cor: '#3b82f6', pct: '75%' },
        { label: 'Forte',    cor: '#22c55e', pct: '100%' },
    ];

    const nivel = niveis[score - 1] || niveis[0];
    fill.style.width      = nivel.pct;
    fill.style.background = nivel.cor;
    label.style.color     = nivel.cor;
    label.textContent     = nivel.label;
}

// Gerar ID único 

function gerarId(nome) {
    const base = nome.toLowerCase().replace(/\s+/g, '').slice(0, 8);
    const num  = Math.floor(1000 + Math.random() * 9000);
    return base + '#' + num;
}

// Login 

function fazerLogin() {
    const id   = document.getElementById('loginId').value.trim();
    const pass = document.getElementById('loginPass').value;

    if (!id || !pass) {
        mostrarMsg('Preenche todos os campos.', 'erro');
        return;
    }

    // Verificar credenciais (frontend apenas — substituir por POST /api/login)
    const user = utilizadoresRegistados[id];
    if (!user || user.password !== pass) {
        mostrarMsg('ID ou palavra-passe incorretos.', 'erro');
        return;
    }

    // Guardar sessão e redirecionar
    localStorage.setItem('userId', id);
    localStorage.setItem('userName', user.nome);
    window.location.href = 'index.html';
}

// Sign Up 

function fazerSignup() {
    const nome      = document.getElementById('signupNome').value.trim();
    const pass      = document.getElementById('signupPass').value;
    const passConf  = document.getElementById('signupPassConf').value;

    if (!nome || !pass || !passConf) {
        mostrarMsg('Preenche todos os campos.', 'erro');
        return;
    }

    if (pass !== passConf) {
        mostrarMsg('As palavras-passe nao coincidem.', 'erro');
        return;
    }

    if (pass.length < 6) {
        mostrarMsg('A palavra-passe deve ter pelo menos 6 caracteres.', 'erro');
        return;
    }

    // Gerar ID único
    let novoId;
    do { novoId = gerarId(nome); }
    while (utilizadoresRegistados[novoId]);

    // Registar utilizador (substituir por POST /api/signup)
    utilizadoresRegistados[novoId] = { nome: nome, password: pass };

    // Mostrar ID gerado ao utilizador
    const formSignup = document.getElementById('formSignup');
    formSignup.innerHTML =
        '<div class="id-badge-label">A tua conta foi criada! O teu ID e:</div>' +
        '<div class="id-badge">' + novoId + '</div>' +
        '<div class="id-badge-label">Guarda este ID — precisas dele para entrar.</div>' +
        '<button class="btn-primary" onclick="irParaLogin(\'' + novoId + '\')">Ir para o login</button>';
}

function irParaLogin(id) {
    mostrarTab('login');
    document.getElementById('loginId').value = id;
    document.getElementById('loginPass').focus();
    mostrarMsg('Conta criada! Introduz a tua palavra-passe para entrar.', 'sucesso');
}

// Enter nos inputs 

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('loginPass').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') fazerLogin();
    });
    document.getElementById('loginId').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') document.getElementById('loginPass').focus();
    });
});