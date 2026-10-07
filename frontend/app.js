/**
 * HOMIE - FRONTEND CORE LOGIC
 * Features: Natural Human Voice TTS Selector, Web Speech API Mic Input,
 * Emotion State Machine, 3D Parallax, Web Audio API Synthesizer, Dynamic Colors.
 */

document.addEventListener("DOMContentLoaded", () => {
    // DOM Element References
    const botHead = document.getElementById("bot-head");
    const headStage = document.getElementById("head-stage");
    const leftEyelid = document.getElementById("left-eyelid");
    const rightEyelid = document.getElementById("right-eyelid");
    const leftEyeball = document.getElementById("left-eyeball");
    const rightEyeball = document.getElementById("right-eyeball");
    const emotionBadge = document.getElementById("emotion-badge");
    const typingIndicator = document.getElementById("typing-indicator");
    const particleCanvas = document.getElementById("particle-canvas");
    
    // Chat UI Elements
    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("chat-input");
    const chatMessages = document.getElementById("chat-messages");
    const micBtn = document.getElementById("mic-btn");
    const micStatusLabel = document.getElementById("mic-status-label");
    const ttsToggleBtn = document.getElementById("tts-toggle-btn");
    const ttsIcon = document.getElementById("tts-icon");
    const voiceSelect = document.getElementById("voice-select");
    const soundToggleBtn = document.getElementById("sound-toggle-btn");
    const soundIcon = document.getElementById("sound-icon");
    const statusText = document.getElementById("status-text");

    // Color Customization Elements
    const drawerToggleBtn = document.getElementById("drawer-toggle-btn");
    const drawerCloseBtn = document.getElementById("drawer-close-btn");
    const colorDrawer = document.getElementById("color-drawer");
    const bgPresets = document.querySelectorAll("#bg-palette-presets .palette-chip");
    const bgCustomPicker = document.getElementById("bg-custom-picker");
    const botPresets = document.querySelectorAll("#bot-palette-presets .palette-chip");
    const botCustomPicker = document.getElementById("bot-custom-picker");

    // Core State Variables
    let currentEmotion = "idle";
    let isSleeping = false;
    let inactivityTimer = null;
    let zzzInterval = null;
    let soundEnabled = true;
    let ttsEnabled = true;
    let isListening = false;
    let recognition = null;
    let conversationHistory = [];
    let availableVoices = [];

    // ==========================================================================
    // 1. NATURAL HUMAN VOICE TTS ENGINE
    // ==========================================================================

    function loadHumanVoices() {
        if (!('speechSynthesis' in window)) return;

        availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices.length === 0) return;

        voiceSelect.innerHTML = "";

        // Sort & prioritize natural human-sounding voices (e.g. Natural, Neural, Google, Online)
        availableVoices.forEach((voice, index) => {
            const option = document.createElement("option");
            option.value = index;
            let displayName = voice.name.replace("Microsoft ", "").replace("Desktop ", "");
            
            if (voice.name.includes("Natural") || voice.name.includes("Neural") || voice.name.includes("Google") || voice.name.includes("Online")) {
                displayName = "🌟 " + displayName;
            }
            option.textContent = `${displayName} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });

        // Auto-select best natural human voice by default
        const bestVoiceIndex = availableVoices.findIndex(v => 
            v.lang.startsWith("en") && 
            (v.name.includes("Natural") || v.name.includes("Neural") || v.name.includes("Google") || v.name.includes("Guy") || v.name.includes("Ana") || v.name.includes("Aria") || v.name.includes("Jenny") || v.name.includes("Samantha"))
        );

        if (bestVoiceIndex !== -1) {
            voiceSelect.value = bestVoiceIndex;
        }
    }

    if ('speechSynthesis' in window) {
        loadHumanVoices();
        window.speechSynthesis.onvoiceschanged = loadHumanVoices;
    }

    function speakReply(text, emotion = "speaking") {
        if (!ttsEnabled || !('speechSynthesis' in window)) return;

        window.speechSynthesis.cancel();

        const cleanText = text.replace(/\*[^*]*\*/g, '').replace(/[^\w\s,\.!\?']/gi, '');

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.0;  // Standard natural human rate
        utterance.pitch = 1.0; // Standard natural human pitch (non-robotic!)

        const selectedIndex = voiceSelect.value;
        if (availableVoices[selectedIndex]) {
            utterance.voice = availableVoices[selectedIndex];
        }

        utterance.onstart = () => {
            setEmotion("speaking");
        };

        utterance.onend = () => {
            if (currentEmotion !== "sleeping") {
                setEmotion("idle");
            }
        };

        utterance.onerror = () => {
            if (currentEmotion !== "sleeping") {
                setEmotion("idle");
            }
        };

        window.speechSynthesis.speak(utterance);
    }

    ttsToggleBtn.addEventListener("click", () => {
        ttsEnabled = !ttsEnabled;
        if (ttsEnabled) {
            ttsToggleBtn.classList.add("active");
            ttsIcon.textContent = "🗣️";
            ttsToggleBtn.querySelector(".btn-label").textContent = "VOICE ON";
            playBlip(600, "square", 0.08);
            speakReply("Voice enabled! Homie is speaking in a natural voice!");
        } else {
            ttsToggleBtn.classList.remove("active");
            ttsIcon.textContent = "🔇";
            ttsToggleBtn.querySelector(".btn-label").textContent = "VOICE OFF";
            window.speechSynthesis.cancel();
            playBlip(300, "square", 0.08);
        }
    });

    voiceSelect.addEventListener("change", () => {
        playBlip(520, "sine", 0.06);
        speakReply("Hey homie! How does my new voice sound?");
    });

    // ==========================================================================
    // 2. WEB AUDIO API SYNTHESIZER
    // ==========================================================================

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new AudioContext();
        }
        if (audioCtx.state === "suspended") {
            audioCtx.resume();
        }
    }

    function playBlip(freq = 440, type = "square", duration = 0.06) {
        if (!soundEnabled) return;
        try {
            initAudio();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.4, audioCtx.currentTime + duration);
            
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {}
    }

    function playSpeechBleep() {
        if (!soundEnabled) return;
        const freqs = [350, 420, 480, 540, 620];
        const randomFreq = freqs[Math.floor(Math.random() * freqs.length)];
        playBlip(randomFreq, "triangle", 0.05);
    }

    function playTick() {
        if (!soundEnabled) return;
        playBlip(200, "sine", 0.03);
    }

    soundToggleBtn.addEventListener("click", () => {
        soundEnabled = !soundEnabled;
        soundIcon.textContent = soundEnabled ? "🔊" : "🔇";
        playBlip(soundEnabled ? 600 : 200, "square", 0.08);
    });

    document.querySelectorAll(".mc-btn, .palette-chip").forEach(btn => {
        btn.addEventListener("mouseenter", () => playBlip(540, "square", 0.04));
        btn.addEventListener("click", () => playBlip(460, "square", 0.06));
    });

    // ==========================================================================
    // 3. BOT EMOTION STATE MACHINE & ANIMATIONS
    // ==========================================================================

    function setEmotion(newEmotion) {
        currentEmotion = newEmotion;
        botHead.className = "bot-head-container";
        botHead.classList.add(`state-${newEmotion}`);
        emotionBadge.textContent = `STATE: ${newEmotion.toUpperCase()}`;

        if (newEmotion === "sleeping") {
            isSleeping = true;
            startZzzParticles();
            playBlip(200, "sine", 0.2);
        } else {
            isSleeping = false;
            stopZzzParticles();
            leftEyelid.style.height = "0%";
            rightEyelid.style.height = "0%";
        }

        if (newEmotion === "speaking" && !ttsEnabled) {
            playSpeechBleep();
        }
    }

    function triggerBlink() {
        if (isSleeping || currentEmotion === "sleeping") return;
        
        leftEyelid.style.height = "100%";
        rightEyelid.style.height = "100%";
        playTick();

        setTimeout(() => {
            leftEyelid.style.height = "0%";
            rightEyelid.style.height = "0%";
        }, 120);

        if (Math.random() > 0.7) {
            setTimeout(() => {
                leftEyelid.style.height = "100%";
                rightEyelid.style.height = "100%";
                setTimeout(() => {
                    leftEyelid.style.height = "0%";
                    rightEyelid.style.height = "0%";
                }, 120);
            }, 240);
        }
    }
    setInterval(triggerBlink, 3800);

    function resetInactivityTimer() {
        if (isSleeping) {
            wakeUpBot();
        }
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            setEmotion("sleeping");
        }, 30000);
    }

    function wakeUpBot() {
        isSleeping = false;
        stopZzzParticles();
        setEmotion("surprised");
        playBlip(680, "square", 0.15);
        speakReply("Yo homie! I'm awake!");
        
        setTimeout(() => {
            setEmotion("idle");
        }, 1400);
    }

    function startZzzParticles() {
        stopZzzParticles();
        zzzInterval = setInterval(() => {
            if (!isSleeping) return;
            const zzz = document.createElement("div");
            zzz.className = "zzz-particle";
            zzz.textContent = "Zzz";
            particleCanvas.appendChild(zzz);
            setTimeout(() => zzz.remove(), 2500);
        }, 1000);
    }

    function stopZzzParticles() {
        clearInterval(zzzInterval);
        particleCanvas.innerHTML = "";
    }

    headStage.addEventListener("click", () => {
        resetInactivityTimer();
        if (isSleeping) wakeUpBot();
        else setEmotion("happy");
    });
    headStage.addEventListener("mouseenter", () => {
        if (isSleeping) wakeUpBot();
    });

    // ==========================================================================
    // 4. 3D MOUSE PARALLAX & EYE TRACKING
    // ==========================================================================

    document.addEventListener("mousemove", (e) => {
        resetInactivityTimer();
        if (isSleeping) return;

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const centerX = windowWidth / 2;
        const centerY = windowHeight / 2;

        const tiltY = ((e.clientX - centerX) / centerX) * 5;
        const tiltX = -((e.clientY - centerY) / centerY) * 5;

        botHead.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
        botHead.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);

        const eyeShiftX = ((e.clientX - centerX) / centerX) * 10;
        const eyeShiftY = ((e.clientY - centerY) / centerY) * 10;

        leftEyeball.style.transform = `translate(${eyeShiftX}px, ${eyeShiftY}px)`;
        rightEyeball.style.transform = `translate(${eyeShiftX}px, ${eyeShiftY}px)`;
    });

    // ==========================================================================
    // 5. WEB SPEECH API MIC INPUT
    // ==========================================================================

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
            isListening = true;
            micBtn.classList.add("active");
            micStatusLabel.textContent = "LISTENING...";
            playBlip(640, "sine", 0.1);
        };

        recognition.onresult = (event) => {
            let transcript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            chatInput.value = transcript;
        };

        recognition.onend = () => {
            isListening = false;
            micBtn.classList.remove("active");
            micStatusLabel.textContent = "MIC OFF";
            playBlip(320, "sine", 0.1);
            if (chatInput.value.trim().length > 0) {
                sendMessage(chatInput.value.trim());
            }
        };

        recognition.onerror = () => {
            isListening = false;
            micBtn.classList.remove("active");
            micStatusLabel.textContent = "MIC OFF";
        };
    }

    micBtn.addEventListener("click", () => {
        resetInactivityTimer();
        if (!recognition) {
            appendMessage("SYSTEM", "Web Speech API is not supported in this browser.", "sys-msg");
            return;
        }
        if (isListening) {
            recognition.stop();
        } else {
            chatInput.value = "";
            recognition.start();
        }
    });

    // ==========================================================================
    // 6. CHAT MESSAGING & API CONNECTOR
    // ==========================================================================

    function appendMessage(speaker, text, className = "bot-msg") {
        const msgDiv = document.createElement("div");
        msgDiv.className = `chat-msg ${className}`;
        msgDiv.innerHTML = `<span class="msg-speaker">${speaker}:</span><span class="msg-content">${escapeHTML(text)}</span>`;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    async function sendMessage(userText) {
        if (!userText) return;

        appendMessage("YOU", userText, "user-msg");
        chatInput.value = "";

        typingIndicator.classList.remove("hidden");
        setEmotion("thinking");

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userText, history: conversationHistory })
            });

            typingIndicator.classList.add("hidden");

            if (response.ok) {
                const data = await response.json();
                appendMessage("HOMIE", data.reply, "bot-msg");

                conversationHistory.push({ role: "user", content: userText });
                conversationHistory.push({ role: "assistant", content: data.reply });

                speakReply(data.reply, data.emotion || "speaking");
            } else {
                throw new Error("Backend server response error");
            }
        } catch (error) {
            typingIndicator.classList.add("hidden");
            
            const fallback = generateLocalFallback(userText);
            appendMessage("HOMIE", fallback.reply, "bot-msg");
            speakReply(fallback.reply, fallback.emotion);
        }
    }

    chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        resetInactivityTimer();
        sendMessage(chatInput.value.trim());
    });

    function generateLocalFallback(text) {
        const lower = text.toLowerCase();
        if (lower.includes("hello") || lower.includes("hi")) {
            return { reply: "Hey homie! Great to see you! What are we working on today?", emotion: "happy" };
        }
        if (lower.includes("time")) {
            return { reply: `Right now, the time is ${new Date().toLocaleTimeString()}!`, emotion: "happy" };
        }
        return { reply: `I hear you, homie! Regarding '${text}': That sounds awesome!`, emotion: "speaking" };
    }

    fetch("/api/status")
        .then(res => res.json())
        .then(data => {
            statusText.textContent = `HOMIE ONLINE (${data.provider})`;
        })
        .catch(() => {
            statusText.textContent = "HOMIE LOCAL MODE";
        });

    // ==========================================================================
    // 7. COLOR CUSTOMIZATION ENGINE
    // ==========================================================================

    drawerToggleBtn.addEventListener("click", () => {
        colorDrawer.classList.toggle("hidden");
        playBlip(580, "square", 0.08);
    });

    drawerCloseBtn.addEventListener("click", () => {
        colorDrawer.classList.add("hidden");
        playBlip(320, "square", 0.06);
    });

    function updateBackgroundColor(colorHex) {
        document.documentElement.style.setProperty("--bg-color", colorHex);
        bgCustomPicker.value = colorHex;
        playBlip(480, "sine", 0.06);
    }

    bgPresets.forEach(chip => {
        chip.addEventListener("click", () => {
            bgPresets.forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            updateBackgroundColor(chip.getAttribute("data-color"));
        });
    });

    bgCustomPicker.addEventListener("input", (e) => {
        bgPresets.forEach(c => c.classList.remove("active"));
        updateBackgroundColor(e.target.value);
    });

    function updateBotSkinColor(hexColor) {
        const rgb = hexToRgb(hexColor);
        if (!rgb) return;
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

        const baseHex = hexColor;
        const darkHex = hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l - 18));
        const lightHex = hslToHex(hsl.h, hsl.s, Math.min(100, hsl.l + 18));
        const accentHex = hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l - 10));

        document.documentElement.style.setProperty("--bot-color", baseHex);
        document.documentElement.style.setProperty("--bot-dark", darkHex);
        document.documentElement.style.setProperty("--bot-light", lightHex);
        document.documentElement.style.setProperty("--bot-accent", accentHex);
        document.documentElement.style.setProperty("--bot-glow", `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6)`);

        botCustomPicker.value = hexColor;
        playBlip(540, "square", 0.08);
    }

    botPresets.forEach(chip => {
        chip.addEventListener("click", () => {
            botPresets.forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            updateBotSkinColor(chip.getAttribute("data-color"));
        });
    });

    botCustomPicker.addEventListener("input", (e) => {
        botPresets.forEach(c => c.classList.remove("active"));
        updateBotSkinColor(e.target.value);
    });

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    }

    function hslToHex(h, s, l) {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    resetInactivityTimer();
});
