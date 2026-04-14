global.crypto = require("crypto");
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('MASTER TESTING BOT IS ALIVE 🚀'));
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));

// 🔑 Render Variables
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const HF_TOKEN = process.env.HF_TOKEN;

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './sessions' }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    }
});

// ================= 1. GROQ TEXT AI (DeepSeek & Llama) =================
async function askGroq(text, modelName) {
    try {
        const res = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: modelName,
            messages: [{ role: "user", content: text }]
        }, {
            headers: { Authorization: `Bearer ${GROQ_API_KEY}` }
        });
        return res.data?.choices?.[0]?.message?.content;
    } catch (e) { return "Groq Error: " + e.message; }
}

// ================= 2. HF VISION AI (DeepSeek-VL2) =================
async function askDeepSeekVision(base64Data, caption) {
    try {
        const res = await axios.post(
            "https://api-inference.huggingface.co/models/deepseek-ai/deepseek-vl2-small",
            { inputs: { image: base64Data, text: caption || "What is in this image?" } },
            { headers: { Authorization: `Bearer ${HF_TOKEN}` } }
        );
        return res.data[0]?.generated_text || "DeepSeek Vision: No response";
    } catch (e) { return "HF Vision Error: " + e.message; }
}

// ================= MESSAGE LOGIC =================
client.on('message', async msg => {
    if (msg.fromMe) return;
    const text = msg.body.toLowerCase();

    // LIVE LOGGING
    console.log(`📩 New Msg: ${text}`);

    // TEST 1: VISION (Agar Photo Aaye)
    if (msg.hasMedia && msg.type === 'image') {
        const media = await msg.downloadMedia();
        const reply = await askDeepSeekVision(media.data, msg.body);
        return msg.reply("*[HF DEEPSEEK-VL2]* 👁️\n\n" + reply);
    }

    // TEST 2: DEEPSEEK CHAT (Via Groq)
    if (text.startsWith('!ds ')) {
        const reply = await askGroq(text.replace('!ds ', ''), "deepseek-r1-distill-llama-70b");
        return msg.reply("*[GROQ DEEPSEEK-R1]* 🧠\n\n" + reply);
    }

    // TEST 3: LLAMA CHAT (Via Groq)
    if (text.startsWith('!llama ')) {
        const reply = await askGroq(text.replace('!llama ', ''), "llama-3.3-70b-versatile");
        return msg.reply("*[GROQ LLAMA-3.3]* 🦙\n\n" + reply);
    }
    
    // Default Help
    if (text === 'test') {
        msg.reply("Send Photo for DeepSeek-VL2\nType '!ds [sawal]' for DeepSeek Chat\nType '!llama [sawal]' for Llama Chat");
    }
});

client.on('qr', qr => {
    console.log("🔄 NEW QR GENERATED:");
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => console.log("🚀 MASTER BOT READY ON RENDER!"));
client.initialize();
