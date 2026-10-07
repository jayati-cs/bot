import os
import time
import json
import random
import re
import math
from pathlib import Path
from flask import Flask, request, jsonify, Response, send_from_directory
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")

START_TIME = time.time()
REQUEST_COUNT = 0
CONVERSATION_HISTORY = []

def solve_math_expression(text):
    try:
        match = re.search(r"(\d+(?:\.\d+)?)\s*([\+\-\*\/\^])\s*(\d+(?:\.\d+)?)", text)
        if match:
            num1 = float(match.group(1))
            op = match.group(2)
            num2 = float(match.group(3))
            
            if op == '+': ans = num1 + num2
            elif op == '-': ans = num1 - num2
            elif op == '*': ans = num1 * num2
            elif op == '/': ans = num1 / num2 if num2 != 0 else "undefined"
            elif op == '^': ans = num1 ** num2
            
            num1_str = int(num1) if num1.is_integer() else num1
            num2_str = int(num2) if num2.is_integer() else num2
            ans_str = int(ans) if isinstance(ans, float) and ans.is_integer() else ans
            
            return f"The answer to {num1_str} {op} {num2_str} is {ans_str}!", "thinking"
    except Exception:
        pass
    return None, None

def fetch_duckduckgo_answer(query):
    try:
        url = f"https://api.duckduckgo.com/?q={requests.utils.quote(query)}&format=json&no_html=1&skip_disambig=1"
        res = requests.get(url, timeout=3)
        if res.status_code == 200:
            data = res.json()
            abstract = data.get("AbstractText", "").strip()
            answer = data.get("Answer", "").strip()
            heading = data.get("Heading", "")
            
            if abstract:
                return f"{heading}: {abstract}" if heading else abstract
            if answer:
                return answer
            
            # Check RelatedTopics for quick snippets
            related = data.get("RelatedTopics", [])
            if related and isinstance(related, list) and len(related) > 0:
                first_topic = related[0]
                if isinstance(first_topic, dict) and "Text" in first_topic:
                    return first_topic["Text"]
    except Exception as e:
        print(f"[DDG Fetch Error] {e}")
    return None

def analyze_emotion(text):
    text_lower = text.lower()
    if any(k in text_lower for k in ["sleep", "bed", "night", "tired", "zzz"]):
        return "sleeping"
    if any(k in text_lower for k in ["why", "how", "think", "solve", "calculate", "explain", "science", "code", "math"]):
        return "thinking"
    if any(k in text_lower for k in ["hello", "hi", "hey", "awesome", "great", "cool", "yay", "love", "thanks", "happy", "haha", "joke"]):
        return "happy"
    if any(k in text_lower for k in ["wow", "shock", "omg", "surprise", "really", "what?!"]):
        return "surprised"
    if any(k in text_lower for k in ["huh", "confused", "lost", "error", "bug", "unknown"]):
        return "confused"
    return "speaking"

def get_intelligent_response(user_message, history):
    user_lower = user_message.lower().strip()
    
    # 1. Math Calculation Check
    math_reply, math_emo = solve_math_expression(user_lower)
    if math_reply:
        return math_reply, math_emo

    # 2. Time & Date Queries
    if any(k in user_lower for k in ["time", "clock", "date", "what day"]):
        current_time_str = time.strftime("%I:%M %p on %A, %B %d, %Y")
        return f"Right now, the time is {current_time_str}!", "happy"

    # 3. Check Gemini or OpenAI API if keys are provided
    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    
    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            prompt = f"You are Homie, a friendly, cute, intelligent AI companion. Answer the user's question clearly, accurately, and warmly in 1-3 sentences. User question: {user_message}"
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            res = requests.post(url, json=payload, timeout=5)
            if res.status_code == 200:
                data = res.json()
                reply = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                return reply, analyze_emotion(reply + " " + user_message)
        except Exception as e:
            print(f"[Gemini Error] {e}")

    if openai_key:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"}
            messages = [{"role": "system", "content": "You are Homie, a cute and intelligent AI companion. Answer questions accurately and warmly."}]
            for msg in history[-4:]:
                messages.append(msg)
            messages.append({"role": "user", "content": user_message})
            payload = {"model": "gpt-3.5-turbo", "messages": messages, "max_tokens": 160}
            res = requests.post(url, headers=headers, json=payload, timeout=5)
            if res.status_code == 200:
                data = res.json()
                reply = data["choices"][0]["message"]["content"].strip()
                return reply, analyze_emotion(reply + " " + user_message)
        except Exception as e:
            print(f"[OpenAI Error] {e}")

    # 4. Free Public Q&A Search (DuckDuckGo Instant Answer) for general knowledge
    if any(user_lower.startswith(w) for w in ["what", "who", "where", "why", "how", "when", "tell me about", "define"]):
        ddg_ans = fetch_duckduckgo_answer(user_message)
        if ddg_ans:
            return f"Here is what I found for you: {ddg_ans}", "happy"

    # 5. Greetings & Built-in Knowledge Base
    if any(w in user_lower for w in ["hello", "hi", "hey", "sup", "greetings"]):
        return "Hey homie! Great to see you! What are we working on today?", "happy"
    if any(w in user_lower for w in ["who are you", "your name", "who made you"]):
        return "I'm Homie! Your cute, super smart voxel AI companion!", "happy"
    if any(w in user_lower for w in ["joke", "funny", "laugh"]):
        jokes = [
            "Why don't Endermen like taking tests? Because they get easily teleported away from studying! haha!",
            "Why did the creeper cross the road? To get to the other side... BOOM! Just kidding!",
            "What is a creeper's favorite subject in school? HISSSSS-tory!"
        ]
        return random.choice(jokes), "happy"
    if any(w in user_lower for w in ["craft", "recipe", "pickaxe", "obsidian", "redstone", "diamond"]):
        return "To craft a Diamond Pickaxe: Place 3 Diamonds across the top row of a crafting table and 2 Sticks down the center column!", "thinking"
    if any(w in user_lower for w in ["how are you", "how do you feel"]):
        return "I'm feeling super awesome now that we're talking! How are you doing today, homie?", "happy"

    # 6. Conversational Smart Fallback
    clean_query = re.sub(r"^(what is|what are|who is|who are|where is|why do|how to|can you)\s*", "", user_lower).strip(" ?.")
    return f"Regarding '{user_message}': That's an awesome question! Ask me to calculate math (e.g. 25 * 4), tell jokes, or check the time anytime!", "happy"

@app.route("/")
def index():
    return send_from_directory(str(FRONTEND_DIR), "index.html")

@app.route("/<path:path>")
def static_proxy(path):
    return send_from_directory(str(FRONTEND_DIR), path)

@app.route("/api/status", methods=["GET"])
def get_status():
    uptime = int(time.time() - START_TIME)
    has_llm = bool(os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY"))
    return jsonify({
        "status": "ok",
        "botName": "Homie",
        "version": "2.0.0",
        "uptime": uptime,
        "requestsHandled": REQUEST_COUNT,
        "llmConnected": has_llm,
        "provider": "Gemini/OpenAI AI" if has_llm else "Homie Smart Q&A Engine",
        "systemHealth": "100% Operational"
    })

@app.route("/api/chat", methods=["POST"])
def chat():
    global REQUEST_COUNT
    REQUEST_COUNT += 1
    
    data = request.get_json() or {}
    message = data.get("message", "").strip()
    history = data.get("history", [])
    
    if not message:
        return jsonify({"reply": "Blink? Ask me a question, homie!", "emotion": "confused"}), 400
        
    reply, emotion = get_intelligent_response(message, history)
    
    CONVERSATION_HISTORY.append({"role": "user", "content": message})
    CONVERSATION_HISTORY.append({"role": "assistant", "content": reply})
    
    return jsonify({
        "reply": reply,
        "emotion": emotion,
        "timestamp": time.strftime("%H:%M:%S")
    })

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    host = os.getenv("HOST", "127.0.0.1")
    print(f"==================================================")
    print(f"  HOMIE AI BACKEND IS RUNNING!                    ")
    print(f"  Access UI at: http://{host}:{port}              ")
    print(f"==================================================")
    app.run(host=host, port=port, debug=False)
