// @module login.js - Lógica de autenticação

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        if (!username || !password) {
            alert('Por favor, preenche todos os campos.');
            return;
        }
        
        // TODO: Quando tiveres backend, fazer request real
        // const response = await fetch(CONFIG.API_BASE_URL + '/auth/login', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ username, password })
        // });
        // const data = await response.json();
        
        // Por agora, modo DEMO - aceita qualquer login
        console.log('Login (DEMO):', { username, password });
        
        // Simular resposta do backend
        const mockUser = {
            id: 1,
            uuid: '550e8400-e29b-41d4-a716-446655440000',
            username: username.includes('@') ? username.split('@')[0] : username,
            email: username.includes('@') ? username : `${username}@example.com`,
            display_name: username.charAt(0).toUpperCase() + username.slice(1),
            access_token: 'mock_jwt_token_' + Date.now(),
            refresh_token: 'mock_refresh_token_' + Date.now()
        };
        
        // Guardar no localStorage (temporário até ter backend)
        localStorage.setItem('userId', `${username}#${mockUser.id.toString().padStart(4, '0')}`);
        localStorage.setItem('userName', mockUser.display_name);
        localStorage.setItem('userUsername', mockUser.username);
        localStorage.setItem('access_token', mockUser.access_token);
        
        console.log('✅ Login bem-sucedido! Redirecionando...');
        
        // Redirecionar para o chat
        window.location.href = 'index.html';
    });
    
    // Verificar se já está logado
    const existingToken = localStorage.getItem('access_token');
    if (existingToken) {
        console.log('Utilizador já está logado. Redirecionando...');
        window.location.href = 'index.html';
    }
});