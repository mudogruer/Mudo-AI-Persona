// Configuration
const BACKEND_URL = "http://localhost:5000";

// UI Text Definitions
const UI_TEXT = {
    en: {
        title: "MuDo — Talk with Mustafa’s AI persona",
        subtitle: "A conversational AI trained on my real experience, projects and background.",
        chatHeader: "Chat with MuDo",
        inputPlaceholder: "Type your message...",
        initialGreeting: "Hello! I am MuDo. How can I help you today?",
        errorMessage: "Something went wrong. Please try again."
    },
    de: {
        title: "MuDo – Sprich mit Mustafas AI-Persona",
        subtitle: "Eine Konversations-KI, trainiert auf meinem echten Werdegang, Projekten und Profil.",
        chatHeader: "Chat mit MuDo",
        inputPlaceholder: "Schreib deine Nachricht...",
        initialGreeting: "Hallo! Ich bin MuDo. Wie kann ich dir heute helfen?",
        errorMessage: "Etwas ist schiefgelaufen. Bitte versuch es noch einmal."
    },
    tr: {
        title: "MuDo — Mustafa’nın AI personasıyla konuş",
        subtitle: "Gerçek deneyimlerim, projelerim ve özgeçmişimle eğitilmiş kişisel yapay zekâ asistanım.",
        chatHeader: "MuDo ile Sohbet",
        inputPlaceholder: "Mesajını yaz...",
        initialGreeting: "Merhaba! Ben MuDo. Bugün sana nasıl yardımcı olabilirim?",
        errorMessage: "Bir şeyler ters gitti. Lütfen tekrar dene."
    }
};



// State
let currentLang = 'en';
let isTyping = false;
const SESSION_KEY = 'mudo_session';
const SESSION_DURATION = 3600 * 1000; // 1 hour

// DOM Elements
const elements = {
    heroTitle: document.getElementById('hero-title'),
    heroSubtitle: document.getElementById('hero-subtitle'),
    chatHeader: document.getElementById('chat-header-text'),
    chatMessages: document.getElementById('chat-messages'),
    chatInput: document.getElementById('chat-input'),
    chatSendBtn: document.getElementById('chat-send'),
    langBtns: document.querySelectorAll('.lang-btn'),
    initialGreeting: document.getElementById('initial-greeting'),
    themeToggle: document.getElementById('theme-toggle'),
    loaderOverlay: document.getElementById('loader-overlay')
};

// Initialize
function init() {
    loadTheme();
    setupEventListeners();
    initParticleLoader(); // Start the canvas animation
}

// ---------------------------------------------------------
// CANVAS PARTICLE LOADER LOGIC (CodePen Style)
// ---------------------------------------------------------
let canvas, ctx;
let particles = [];
let animationId;
let width, height;
let mouse = { x: -1000, y: -1000 }; // Initialize off-screen

async function initParticleLoader() {
    canvas = document.getElementById('neuro-canvas');
    if (!canvas) return; 
    
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Mouse Interaction
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
    });

    try {
        const response = await fetch('face_points.json');
        if (!response.ok) throw new Error("Failed to load points");
        const points = await response.json();

        // Create the "Face" data points
        createParticlesFromProfile(points);

        // Start Animation Loop
        animateParticles();

        // End loader after 5 seconds
        setTimeout(() => {
            elements.loaderOverlay.classList.add('hidden');
            setTimeout(() => {
                elements.loaderOverlay.style.display = 'none';
                cancelAnimationFrame(animationId);
            }, 1000);
        }, 5000);

    } catch (e) {
        console.warn("Loader error:", e);
        elements.loaderOverlay.style.display = 'none';
    }
}

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

function createParticlesFromProfile(points) {
    particles = [];
    const cx = width / 2;
    const cy = height * 0.4; // Shift up to 40% height to clear text
    // Scale based on screen size
    const scaleFactor = Math.min(width, height) * 0.75; // Reduce scale to 75% 

    if (points) {
        points.forEach(pos => {
            const targetX = cx + pos[0] * scaleFactor;
            const targetY = cy + pos[1] * scaleFactor;
            particles.push(new Particle(targetX, targetY));
        });
    }
}

class Particle {
    constructor(targetX, targetY) {
        this.targetX = targetX;
        this.targetY = targetY;
        // Start from random positions (Explosion effect)
        // Start further out for a bigger implosion feel
        this.x = Math.random() * width * 1.5 - width * 0.25;
        this.y = Math.random() * height * 1.5 - height * 0.25;
        
        // Easing factor (randomized for natural feel)
        // Higher easing = faster snap
        this.easing = Math.random() * 0.02 + 0.02;
        
        this.size = Math.random() * 1.5 + 0.5;
        
        // Color variation (Cyan to Purple)
        const colors = ['#38bdf8', '#818cf8', '#c084fc', '#22d3ee'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        // Initial velocity for organic swirl before settling
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
    }

    update() {
        // Mouse Interaction Physics
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 120;
        
        if (dist < maxDistance) {
            const force = (maxDistance - dist) / maxDistance;
            const angle = Math.atan2(dy, dx);
            const forceX = Math.cos(angle) * force * 8;
            const forceY = Math.sin(angle) * force * 8;
            
            this.vx -= forceX;
            this.vy -= forceY;
        }

        // Homing Physics (Spring/Elasticity)
        const tx = this.targetX - this.x;
        const ty = this.targetY - this.y;
        
        // Apply force towards target
        this.vx += tx * this.easing * 0.1;
        this.vy += ty * this.easing * 0.1;
        
        // Friction (Damping) to stop infinite oscillation
        this.vx *= 0.92;
        this.vy *= 0.92;
        
        // Apply velocity
        this.x += this.vx;
        this.y += this.vy;
    }

    draw() {
        // Synaptic firing effect (random neuron flash)
        if (Math.random() > 0.99) {
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#ffffff';
        } else {
            ctx.fillStyle = this.color;
            ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset
    }
}

function animateParticles() {
    animationId = requestAnimationFrame(animateParticles);
    
    // Fade effect for trails
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);

    // Draw Particles
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    // Draw Connections (The Neural Network)
    // Connecting neighbors
    connectParticles();
}

function connectParticles() {
    // Only connect a subset to save performance
    // We can just connect particles that are close
    const maxDist = 32; // Slightly increased for better mesh
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i < particles.length; i+=2) { // Optimization: check every 2nd
        const p1 = particles[i];
        // Only verify against some neighbors to optimize
        // Check next 20 particles
        for (let j = i + 1; j < Math.min(i + 20, particles.length); j++) {
            const p2 = particles[j];
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < maxDist) {
                ctx.strokeStyle = `rgba(56, 189, 248, ${1 - dist/maxDist})`;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    }
}

function getSessionId() {
    const now = Date.now();
    let session = localStorage.getItem(SESSION_KEY);
    
    if (session) {
        try {
            session = JSON.parse(session);
            // Check if expired
            if (now < session.expiresAt) {
                return session.id;
            }
        } catch (e) {
            console.error("Invalid session data", e);
        }
    }
    
    // Generate new session
    const newSession = {
        id: 'user-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        expiresAt: now + SESSION_DURATION
    };
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    return newSession.id;
}

function setupEventListeners() {
    // Language Selection
    elements.langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            setLanguage(lang);
        });
    });

    // Theme Toggle
    elements.themeToggle.addEventListener('click', toggleTheme);

    // Chat Interaction
    elements.chatSendBtn.addEventListener('click', sendMessage);
    elements.chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark'; // Default to dark
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

function setLanguage(lang) {
    if (!UI_TEXT[lang]) return;
    
    currentLang = lang;
    
    // Update Active Button
    elements.langBtns.forEach(btn => {
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update Text Content
    const texts = UI_TEXT[lang];
    elements.heroTitle.textContent = texts.title;
    elements.heroSubtitle.textContent = texts.subtitle;
    elements.chatHeader.textContent = texts.chatHeader;
    elements.chatInput.placeholder = texts.inputPlaceholder;
    
    // Only update initial greeting if it's still visible and user hasn't chatted yet
    if (elements.chatMessages.children.length === 1 && elements.initialGreeting) {
        elements.initialGreeting.textContent = texts.initialGreeting;
    }
}

async function sendMessage() {
    const text = elements.chatInput.value.trim();
    if (!text || isTyping) return;

    // Clear input
    elements.chatInput.value = '';

    // Add User Message
    addMessage(text, 'user');

    // Show Typing Indicator
    const typingId = showTyping();
    isTyping = true;

    try {
        const sessionId = getSessionId();

        const response = await fetch(`${BACKEND_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: text,
                lang: currentLang,
                sessionId: sessionId
            })
        });

        const data = await response.json();
        
        // Remove typing indicator
        removeMessage(typingId);

        if (response.ok && data.output) {
            addMessage(data.output, 'bot');
        } else {
            // Handle specific error from backend or generic
            console.error('Backend error:', data);
            addMessage(UI_TEXT[currentLang].errorMessage, 'bot');
        }

    } catch (error) {
        console.error('Network error:', error);
        removeMessage(typingId);
        addMessage(UI_TEXT[currentLang].errorMessage, 'bot');
    } finally {
        isTyping = false;
        scrollToBottom();
    }
}

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    
    // Use innerHTML for bot messages to support rich text/HTML from AI
    // Use textContent for user messages to prevent XSS
    if (sender === 'bot') {
        contentDiv.innerHTML = text;
    } else {
        contentDiv.textContent = text;
    }

    messageDiv.appendChild(contentDiv);
    elements.chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function showTyping() {
    const id = 'typing-' + Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', 'bot-message');
    messageDiv.id = id;

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('typing-indicator');
    
    // 3 dots
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.classList.add('typing-dot');
        typingDiv.appendChild(dot);
    }

    contentDiv.appendChild(typingDiv);
    messageDiv.appendChild(contentDiv);
    elements.chatMessages.appendChild(messageDiv);
    scrollToBottom();
    
    return id;
}

function removeMessage(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
}

function scrollToBottom() {
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

// Start
init();
