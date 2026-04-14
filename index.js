global.crypto = require("crypto");
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('DEEPSEEK VISION BOT IS ALIVE 👁️🚀'));
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './sessions' }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process']
    }
});

// ================= DEEPSEEK VISION AI FUNCTION =================
async function analyzeWithDeepSeek(base64Data, caption) {
    try {
        // Hum yahan Groq ka Vision model use kar rahe hain kyunke wo free aur fast hai
        // DeepSeek-VL2 ka kaam bhi Llama-3.2-Vision behtareen karta hai
        const res = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.2-11b-vision-preview", 
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: caption || "Is tasweer ko ghaur se dekho aur batao is mein kya hai?" },
                            {
                                type: "image_url",
                                image_url: { url: `data:image/jpeg;base64,${base64Data}` }
                            }
                        ]
                    }
                ]
            },
            {
                headers: {
                    Authorization: `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );
        return res.data?.choices?.[0]?.message?.content || "Maafi chahti hoon, samajh nahi saki 😅";
    } catch (e) {
        console.log("AI Error:", e.message);
        return "System busy hai ya photo heavy hai! ❌";
    }
}

// ================= MESSAGE HANDLING =================
client.on('message', async msg => {
    if (msg.fromMe) return;

    const contact = await msg.getContact();
    console.log(`📩 [${contact.pushname || 'User'}] -> ${msg.hasMedia ? '[Photo]' : msg.body}`);

    if (msg.hasMedia) {
        try {
            const media = await msg.downloadMedia();
            if (media.mimetype.includes('image')) {
                const reply = await analyzeWithDeepSeek(media.data, msg.body);
                await client.sendMessage(msg.from, "*[DEEPSEEK VISION]* 👁️\n\n" + reply);
            }
        } catch (e) {
            console.log("Download Error:", e.message);
        }
    } else if (msg.body.toLowerCase() === 'ping') {
        msg.reply('DeepSeek Vision Bot is Online! 🚀');
    }
});

client.on('qr', qr => {
    console.log("🔄 NEW QR CODE:");
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => console.log("🚀 DEEPSEEK VISION BOT READY!"));
client.initialize();
