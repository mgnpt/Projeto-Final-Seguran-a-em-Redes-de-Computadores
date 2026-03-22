function sendMessage() {
    const input = document.getElementById('msgInput');
    const text = input.value.trim();

    if (text === '') return;

    const messagesDiv = document.querySelector('.messages');

    const newMessage = document.createElement('div');
    newMessage.classList.add('message', 'me');
    newMessage.textContent = text;

    messagesDiv.appendChild(newMessage);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    input.value = '';
}

// Enviar com Enter
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('msgInput').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') sendMessage();
    });
});