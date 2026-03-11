/**
 * Done-it AI Chatbot Widget
 *
 * SETUP: Set CHATBOT_API_URL to the URL where your Python chatbot is deployed.
 * Example: 'https://your-app.fly.dev'  or  'http://localhost:8000' for local testing.
 *
 * Your FastAPI backend must also have CORS enabled. Add this to main.py:
 *
 *   from fastapi.middleware.cors import CORSMiddleware
 *   app.add_middleware(
 *       CORSMiddleware,
 *       allow_origins=["*"],   # Replace with your domain in production
 *       allow_methods=["*"],
 *       allow_headers=["*"],
 *   )
 */
const CHATBOT_API_URL = 'http://localhost:8000'; // <-- change this after deployment

(function () {
    // Detect page language from i18n preference, falling back to <html lang>
    function getCurrentLang() {
        return localStorage.getItem('done-it-lang') || document.documentElement.lang || 'nl';
    }
    const i18n = {
        nl: {
            title: 'Done-it Assistent',
            status: 'Online',
            welcome: 'Hallo! Ik ben de Done-it AI-assistent. Stel gerust je vraag over onze app of functionaliteiten.',
            placeholder: 'Typ je vraag...',
            closeLabel: 'Sluit chat',
            toggleTitle: 'Stel een vraag aan onze AI-assistent',
            toggleLabel: 'Open chatbot',
            error: 'Er is iets misgegaan. Probeer het later opnieuw of neem contact op via info@done-it.app.'
        },
        fr: {
            title: 'Assistant Done-it',
            status: 'En ligne',
            welcome: "Bonjour\u00a0! Je suis l'assistant IA Done-it. N'h\u00e9sitez pas \u00e0 poser vos questions sur notre app ou nos fonctionnalit\u00e9s.",
            placeholder: 'Tapez votre question\u00a0...',
            closeLabel: 'Fermer le chat',
            toggleTitle: '\u00c0 votre service — posez une question \u00e0 notre assistant IA',
            toggleLabel: 'Ouvrir le chatbot',
            error: 'Une erreur est survenue. R\u00e9essayez plus tard ou contactez-nous via info@done-it.app.'
        },
        en: {
            title: 'Done-it Assistant',
            status: 'Online',
            welcome: "Hello! I'm the Done-it AI assistant. Feel free to ask any question about our app or features.",
            placeholder: 'Type your question...',
            closeLabel: 'Close chat',
            toggleTitle: 'Ask our AI assistant a question',
            toggleLabel: 'Open chatbot',
            error: 'Something went wrong. Please try again later or contact us at info@done-it.app.'
        },
        es: {
            title: 'Asistente Done-it',
            status: 'En l\u00ednea',
            welcome: '\u00a1Hola! Soy el asistente IA de Done-it. No dudes en hacerme cualquier pregunta sobre nuestra app o funcionalidades.',
            placeholder: 'Escribe tu pregunta...',
            closeLabel: 'Cerrar chat',
            toggleTitle: 'Haz una pregunta a nuestro asistente IA',
            toggleLabel: 'Abrir chatbot',
            error: 'Algo sali\u00f3 mal. Int\u00e9ntalo de nuevo m\u00e1s tarde o cont\u00e1ctanos en info@done-it.app.'
        }
    };
    function t() { return i18n[getCurrentLang()] || i18n['nl']; }

    // Reuse conversation ID across page navigations within the same browser session
    let conversationId = sessionStorage.getItem('doneit_conv_id');
    if (!conversationId) {
        conversationId = 'web-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
        sessionStorage.setItem('doneit_conv_id', conversationId);
    }

    // Inject widget HTML into the page
    const wrapper = document.createElement('div');
    wrapper.id = 'chat-widget';
    var _t = t();
    wrapper.innerHTML = `
        <div id="chat-panel">
            <div id="chat-header">
                <div id="chat-header-info">
                    <div id="chat-avatar"><i class="bi bi-robot"></i></div>
                    <div>
                        <div id="chat-title">${_t.title}</div>
                        <div id="chat-status">${_t.status}</div>
                    </div>
                </div>
                <button id="chat-close-btn" aria-label="${_t.closeLabel}"><i class="bi bi-x-lg"></i></button>
            </div>
            <div id="chat-messages">
                <div class="chat-msg bot">
                    <span>${_t.welcome}</span>
                </div>
            </div>
            <div id="chat-input-area">
                <input type="text" id="chat-input" placeholder="${_t.placeholder}" maxlength="500" autocomplete="off" />
                <button id="chat-send" aria-label="Verstuur bericht"><i class="bi bi-send-fill"></i></button>
            </div>
        </div>
        <button id="chat-toggle" title="${_t.toggleTitle}" aria-label="${_t.toggleLabel}">
            <i class="bi bi-chat-dots-fill" id="chat-icon-open"></i>
            <i class="bi bi-x-lg" id="chat-icon-close" style="display:none"></i>
        </button>
    `;
    document.body.appendChild(wrapper);

    const panel     = document.getElementById('chat-panel');
    const toggle    = document.getElementById('chat-toggle');
    const closeBtn  = document.getElementById('chat-close-btn');
    const messages  = document.getElementById('chat-messages');
    const input     = document.getElementById('chat-input');
    const sendBtn   = document.getElementById('chat-send');
    const iconOpen  = document.getElementById('chat-icon-open');
    const iconClose = document.getElementById('chat-icon-close');

    let isOpen = false;

    function openChat() {
        isOpen = true;
        panel.style.display = 'flex';
        iconOpen.style.display = 'none';
        iconClose.style.display = 'block';
        input.focus();
        messages.scrollTop = messages.scrollHeight;
    }

    function closeChat() {
        isOpen = false;
        panel.style.display = 'none';
        iconOpen.style.display = 'block';
        iconClose.style.display = 'none';
    }

    toggle.addEventListener('click', () => isOpen ? closeChat() : openChat());
    closeBtn.addEventListener('click', closeChat);

    // Allow i18n.js to refresh chatbot UI when language is switched
    window._chatbotRefreshLang = function () {
        var s = t();
        document.getElementById('chat-title').textContent = s.title;
        document.getElementById('chat-status').textContent = s.status;
        input.placeholder = s.placeholder;
        closeBtn.setAttribute('aria-label', s.closeLabel);
        toggle.title = s.toggleTitle;
        toggle.setAttribute('aria-label', s.toggleLabel);
    };

    input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    sendBtn.addEventListener('click', sendMessage);

    function appendMessage(text, role) {
        const div = document.createElement('div');
        div.className = 'chat-msg ' + role;
        const span = document.createElement('span');
        span.textContent = text;
        div.appendChild(span);
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    function showTyping() {
        const div = document.createElement('div');
        div.className = 'chat-msg bot typing-indicator';
        div.id = 'chat-typing';
        div.innerHTML = '<span><span></span><span></span><span></span></span>';
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    function removeTyping() {
        const el = document.getElementById('chat-typing');
        if (el) el.remove();
    }

    async function sendMessage() {
        const text = input.value.trim();
        if (!text || input.disabled) return;

        input.value = '';
        input.disabled = true;
        sendBtn.disabled = true;

        appendMessage(text, 'user');
        showTyping();

        try {
            const resp = await fetch(`${CHATBOT_API_URL}/chat/${conversationId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: text, lang: getCurrentLang() })
            });
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const data = await resp.json();
            removeTyping();
            appendMessage(data.response, 'bot');
        } catch {
            removeTyping();
            appendMessage(t().error, 'bot');
        } finally {
            input.disabled = false;
            sendBtn.disabled = false;
            input.focus();
        }
    }
})();
