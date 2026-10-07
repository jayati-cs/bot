# 🤖 HOMIE AI - Voxel AI Companion Software for Robots & Web

HOMIE is a full-stack, interactive AI companion designed for web browsers, desktop displays, and small physical robot screens (e.g. Raspberry Pi, Mini PCs, or smart robot displays).

It features a cute pixel-art animated face, 3D mouse/head tilt tracking, real-time emotion state transitions, natural human voice speech synthesis (TTS), voice speech input via microphone, custom background/skin color palettes, and a lightweight Python Flask backend API.

---

## 🌟 Features for Robot Software & Display

- **Animated Voxel Robot Face**: Cute, expressive face with 7 dynamic emotions (`HAPPY`, `THINKING`, `SPEAKING`, `SLEEPING`, `SURPRISED`, `CONFUSED`, `IDLE`).
- **Interactive Speech Output (Text-to-Speech)**: Homie speaks all replies out loud in a natural, smooth human voice.
- **Microphone Voice Input**: Speak directly to Homie using your microphone.
- **Automatic Sleep & Wake Up**: 30 seconds of inactivity triggers sleeping state with floating pixel "Zzz" particles; touching or hovering over the display wakes Homie up!
- **Color Customization**: Easily change world background color and Homie skin color via the bottom-right palette drawer.
- **Smart Q&A Engine**: Built-in math calculator, DuckDuckGo instant Q&A, time & date info, jokes, and optional Google Gemini / OpenAI API integration.

---

## 📁 Directory Structure

```
minecraft-purple-bot/
├── backend/
│   ├── app.py           # Flask backend server & REST API
│   ├── requirements.txt # Python dependencies
│   └── .env.example     # Configuration template for API keys
├── frontend/
│   ├── index.html       # Pixel-art UI & SVG face layout
│   ├── styles.css       # 8-Bit CSS tokens & cute animations
│   └── app.js           # Voice TTS engine, mic input, 3D tilt, & emotion state machine
├── .gitignore           # Git ignore settings
└── README.md            # Installation & setup guide
```

---

## 🚀 How Your Friend Can Run HOMIE on Their Computer or Robot

Whether running on a **Windows PC, Mac, Linux, or Raspberry Pi robot**, follow these simple steps:

### Prerequisites
- Python 3.8+ (Already built-in on Windows/Mac/Linux/Raspberry Pi OS)
- Git (optional, for cloning)

### Step 1: Clone or Download the Repository

Using Git in terminal:
```bash
git clone <YOUR_GITHUB_REPO_URL_HERE>
cd minecraft-purple-bot
```
*(Or download the ZIP from GitHub and extract it into a folder)*

### Step 2: Run the Application Server

#### On Windows:
```cmd
python backend/app.py
```

#### On Linux / Raspberry Pi / Mac:
```bash
python3 backend/app.py
```

### Step 3: Open HOMIE in Browser or Kiosk Mode

Open your web browser (Chrome, Edge, or Chromium on Raspberry Pi) and navigate to:
```
http://127.0.0.1:5000
```

> 💡 **Robot Kiosk Tip**: On a physical robot screen (like a 5-inch or 7-inch Raspberry Pi display), launch Chromium in Fullscreen Kiosk Mode:
> ```bash
> chromium-browser --kiosk http://127.0.0.1:5000
> ```

---

## 🔑 Optional AI API Key Setup

If you want Homie to have advanced Gemini or OpenAI intelligence:
1. Create a file named `.env` inside the `backend/` directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
2. Restart the server!

---

## 🛠️ Customization & Commands

- **Voice Selector**: Select any human voice from the top dropdown menu.
- **Voice Mic**: Click the `🎙️ MIC` button to toggle microphone voice typing.
- **Color Palettes**: Click `🎨 COLOR PALETTES` at the bottom-right to customize background and skin colors.
