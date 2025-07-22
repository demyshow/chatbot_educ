// ===== CONFIGURAÇÕES E VARIÁVEIS GLOBAIS =====
const CONFIG = {
    API_BASE_URL: 'http://localhost:5000/api',
    MAX_MESSAGE_LENGTH: 500,
    TYPING_DELAY: 1000,
    AUTO_SCROLL_DELAY: 100,
    TOAST_DURATION: 5000
};

// Estado da aplicação
let chatState = {
    sessionId: null,
    isTyping: false,
    isConnected: false,
    messageHistory: []
};

// Elementos DOM
const elements = {
    chatMessages: document.getElementById('chatMessages'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    typingIndicator: document.getElementById('typingIndicator'),
    quickReplies: document.getElementById('quickReplies'),
    emojiBtn: document.getElementById('emojiBtn'),
    emojiPanel: document.getElementById('emojiPanel'),
    charCount: document.getElementById('charCount'),
    clearBtn: document.getElementById('clearBtn'),
    minimizeBtn: document.getElementById('minimizeBtn'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    toastContainer: document.getElementById('toastContainer'),
    welcomeTime: document.getElementById('welcomeTime')
};

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', function() {
    initializeChat();
    setupEventListeners();
    setWelcomeTime();
    generateSessionId();
    testConnection();
});

function initializeChat() {
    console.log('🤖 Atendimento Bot inicializando...');
    showLoadingOverlay('Inicializando chat...');
    
    // Simular carregamento inicial
    setTimeout(() => {
        hideLoadingOverlay();
        showToast('success', 'Chat conectado!', 'Pronto para atendimento');
        chatState.isConnected = true;
    }, 1500);
}

function generateSessionId() {
    chatState.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    console.log('📱 Session ID gerado:', chatState.sessionId);
}

function setWelcomeTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    elements.welcomeTime.textContent = timeString;
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Input de mensagem
    elements.messageInput.addEventListener('keypress', handleKeyPress);
    elements.messageInput.addEventListener('input', updateCharCounter);
    
    // Botões
    elements.sendBtn.addEventListener('click', sendMessage);
    elements.clearBtn.addEventListener('click', clearChat);
    elements.minimizeBtn.addEventListener('click', minimizeChat);
    elements.emojiBtn.addEventListener('click', toggleEmojiPanel);
    
    // Quick replies
    elements.quickReplies.addEventListener('click', handleQuickReply);
    
    // Emojis
    elements.emojiPanel.addEventListener('click', handleEmojiSelect);
    
    // Clique fora do painel de emoji
    document.addEventListener('click', handleOutsideClick);
    
    // Redimensionamento da janela
    window.addEventListener('resize', adjustChatLayout);
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function updateCharCounter() {
    const currentLength = elements.messageInput.value.length;
    elements.charCount.textContent = currentLength;
    
    // Alterar cor baseado no limite
    if (currentLength > CONFIG.MAX_MESSAGE_LENGTH * 0.9) {
        elements.charCount.style.color = 'var(--error-color)';
    } else if (currentLength > CONFIG.MAX_MESSAGE_LENGTH * 0.7) {
        elements.charCount.style.color = 'var(--warning-color)';
    } else {
        elements.charCount.style.color = 'var(--text-muted)';
    }
    
    // Desabilitar envio se exceder limite
    elements.sendBtn.disabled = currentLength > CONFIG.MAX_MESSAGE_LENGTH || currentLength === 0;
}

function handleQuickReply(event) {
    if (event.target.classList.contains('quick-reply-btn')) {
        const message = event.target.getAttribute('data-message');
        elements.messageInput.value = message;
        sendMessage();
    }
}

function handleEmojiSelect(event) {
    if (event.target.classList.contains('emoji')) {
        const emoji = event.target.getAttribute('data-emoji');
        const currentValue = elements.messageInput.value;
        const cursorPos = elements.messageInput.selectionStart;
        
        const newValue = currentValue.slice(0, cursorPos) + emoji + currentValue.slice(cursorPos);
        elements.messageInput.value = newValue;
        elements.messageInput.focus();
        elements.messageInput.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
        
        updateCharCounter();
        hideEmojiPanel();
    }
}

function handleOutsideClick(event) {
    if (!elements.emojiPanel.contains(event.target) && !elements.emojiBtn.contains(event.target)) {
        hideEmojiPanel();
    }
}

// ===== FUNÇÕES DE MENSAGEM =====
async function sendMessage() {
    const message = elements.messageInput.value.trim();
    
    if (!message || message.length > CONFIG.MAX_MESSAGE_LENGTH) {
        return;
    }
    
    if (!chatState.isConnected) {
        showToast('error', 'Erro de conexão', 'Tentando reconectar...');
        await testConnection();
        return;
    }
    
    // Adicionar mensagem do usuário
    addMessage(message, true);
    
    // Limpar input
    elements.messageInput.value = '';
    updateCharCounter();
    
    // Mostrar indicador de digitação
    showTypingIndicator();
    
    try {
        // Enviar para API
        const response = await fetch(`${CONFIG.API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                session_id: chatState.sessionId
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Simular delay de digitação
        setTimeout(() => {
            hideTypingIndicator();
            addMessage(data.response, false);
            
            // Atualizar session_id se fornecido
            if (data.session_id) {
                chatState.sessionId = data.session_id;
            }
        }, CONFIG.TYPING_DELAY);
        
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        hideTypingIndicator();
        
        // Mensagem de erro amigável
        setTimeout(() => {
            addMessage(
                'Desculpe, ocorreu um erro de conexão. Por favor, tente novamente em alguns instantes. Se o problema persistir, entre em contato com nosso suporte.',
                false,
                'error'
            );
        }, 500);
        
        showToast('error', 'Erro de conexão', 'Verifique sua internet e tente novamente');
    }
}

function addMessage(text, isUser, type = 'normal') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = isUser ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    
    if (type === 'error') {
        bubble.style.background = 'var(--gradient-secondary)';
        bubble.style.color = 'white';
    }
    
    // Processar texto para links e formatação
    bubble.innerHTML = processMessageText(text);
    
    const time = document.createElement('div');
    time.className = 'message-time';
    time.textContent = new Date().toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    content.appendChild(bubble);
    content.appendChild(time);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    // Inserir antes do indicador de digitação
    elements.chatMessages.insertBefore(messageDiv, elements.typingIndicator);
    
    // Salvar no histórico
    chatState.messageHistory.push({
        text: text,
        isUser: isUser,
        timestamp: new Date().toISOString()
    });
    
    // Auto scroll
    setTimeout(() => {
        scrollToBottom();
    }, CONFIG.AUTO_SCROLL_DELAY);
}

function processMessageText(text) {
    // Converter quebras de linha
    let processed = text.replace(/\n/g, '<br>');
    
    // Converter URLs em links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    processed = processed.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Converter emails em links
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    processed = processed.replace(emailRegex, '<a href="mailto:$1">$1</a>');
    
    // Converter telefones em links
    const phoneRegex = /(\(\d{2}\)\s?\d{4,5}-?\d{4})/g;
    processed = processed.replace(phoneRegex, '<a href="tel:$1">$1</a>');
    
    return processed;
}

// ===== FUNÇÕES DE UI =====
function showTypingIndicator() {
    chatState.isTyping = true;
    elements.typingIndicator.style.display = 'block';
    scrollToBottom();
}

function hideTypingIndicator() {
    chatState.isTyping = false;
    elements.typingIndicator.style.display = 'none';
}

function scrollToBottom() {
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function toggleEmojiPanel() {
    const isVisible = elements.emojiPanel.style.display === 'block';
    elements.emojiPanel.style.display = isVisible ? 'none' : 'block';
}

function hideEmojiPanel() {
    elements.emojiPanel.style.display = 'none';
}

function clearChat() {
    if (confirm('Tem certeza que deseja limpar toda a conversa?')) {
        // Manter apenas a mensagem de boas-vindas
        const messages = elements.chatMessages.querySelectorAll('.message:not(.welcome-message)');
        messages.forEach(message => message.remove());
        
        // Limpar histórico
        chatState.messageHistory = [];
        
        // Gerar novo session ID
        generateSessionId();
        
        showToast('info', 'Conversa limpa', 'Nova sessão iniciada');
    }
}

function minimizeChat() {
    const container = document.querySelector('.chat-container');
    container.style.transform = 'scale(0.8)';
    container.style.opacity = '0.7';
    
    setTimeout(() => {
        container.style.transform = 'scale(1)';
        container.style.opacity = '1';
    }, 300);
    
    showToast('info', 'Chat minimizado', 'Clique para restaurar');
}

function adjustChatLayout() {
    // Ajustar layout para diferentes tamanhos de tela
    const container = document.querySelector('.chat-container');
    const isMobile = window.innerWidth <= 480;
    
    if (isMobile) {
        container.style.height = '100vh';
        container.style.borderRadius = '0';
    } else {
        container.style.height = '600px';
        container.style.borderRadius = 'var(--border-radius-xl)';
    }
}

// ===== FUNÇÕES DE LOADING E TOAST =====
function showLoadingOverlay(message = 'Carregando...') {
    elements.loadingOverlay.style.display = 'flex';
    const loadingText = elements.loadingOverlay.querySelector('p');
    if (loadingText) {
        loadingText.textContent = message;
    }
}

function hideLoadingOverlay() {
    elements.loadingOverlay.style.display = 'none';
}

function showToast(type, title, message, duration = CONFIG.TOAST_DURATION) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="${iconMap[type]}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Event listener para fechar
    toast.querySelector('.toast-close').addEventListener('click', () => {
        removeToast(toast);
    });
    
    elements.toastContainer.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
        removeToast(toast);
    }, duration);
}

function removeToast(toast) {
    toast.style.animation = 'toastSlide 0.3s ease-out reverse';
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

// ===== FUNÇÕES DE CONEXÃO =====
async function testConnection() {
    try {
        showLoadingOverlay('Testando conexão...');
        
        const response = await fetch(`${CONFIG.API_BASE_URL}/`, {
            method: 'GET',
            timeout: 5000
        });
        
        if (response.ok) {
            chatState.isConnected = true;
            hideLoadingOverlay();
            console.log('✅ Conexão com API estabelecida');
        } else {
            throw new Error('API não disponível');
        }
    } catch (error) {
        console.error('❌ Erro de conexão:', error);
        chatState.isConnected = false;
        hideLoadingOverlay();
        
        // Modo offline
        showToast('warning', 'Modo offline', 'Algumas funcionalidades podem estar limitadas');
        
        // Simular resposta offline
        setTimeout(() => {
            addMessage(
                'Olá! No momento estou funcionando em modo offline. Algumas funcionalidades podem estar limitadas, mas ainda posso ajudá-lo com informações básicas. Como posso ajudar?',
                false
            );
        }, 1000);
    }
}

// ===== FUNÇÕES UTILITÁRIAS =====
function formatTime(date) {
    return date.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== FUNÇÕES DE HISTÓRICO =====
async function loadChatHistory() {
    if (!chatState.sessionId || !chatState.isConnected) return;
    
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/history/${chatState.sessionId}`);
        
        if (response.ok) {
            const data = await response.json();
            
            // Limpar mensagens existentes (exceto boas-vindas)
            const messages = elements.chatMessages.querySelectorAll('.message:not(.welcome-message)');
            messages.forEach(message => message.remove());
            
            // Adicionar mensagens do histórico
            data.messages.forEach(msg => {
                addMessage(msg.message, msg.is_user);
            });
            
            console.log('📚 Histórico carregado:', data.messages.length, 'mensagens');
        }
    } catch (error) {
        console.error('❌ Erro ao carregar histórico:', error);
    }
}

// ===== EXPORTAR FUNÇÕES PARA DEBUG =====
window.chatDebug = {
    state: chatState,
    config: CONFIG,
    elements: elements,
    testConnection: testConnection,
    clearChat: clearChat,
    loadHistory: loadChatHistory
};

// ===== LOG DE INICIALIZAÇÃO =====
console.log('🚀 Atendimento Bot carregado com sucesso!');
console.log('🔧 Para debug, use: window.chatDebug');

