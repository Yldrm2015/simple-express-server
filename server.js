const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");
const requestIp = require("request-ip");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const FINGERPRINT_SECRET_KEY = process.env.FINGERPRINT_SECRET_KEY;
const API_ENDPOINT = "https://eu.api.fpjs.io/events/";
const NODE_ENV = process.env.NODE_ENV || "development";

const BOT_USER_AGENTS = [
    "curl", "wget", "bot", "crawler", "spider", "httpclient",
    "python-requests", "java", "scrapy", "selenium", "headless"
];

console.log("✅ Server started in", NODE_ENV, "mode");

// **🛡️ Sunucu Tarafından Bot Tespiti (JavaScript Kapalı Olsa Bile Çalışır)**
app.get("/", (req, res) => {
    const ip = requestIp.getClientIp(req);
    const userAgent = req.headers["user-agent"] || "Unknown";

    let isBot = false;
    let reason = "✅ Not a bot.";

    // **User-Agent bazlı bot tespiti**
    if (BOT_USER_AGENTS.some(botStr => userAgent.toLowerCase().includes(botStr))) {
        isBot = true;
        reason = "🚨 BOT DETECTED: Suspicious User-Agent!";
    }

    // **HTML Sayfasını Server-Side Render Ederek Gönder**
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bot Detection Test</title>
        </head>
        <body>
            <h1>Bot Detection Test</h1>
            <p><strong>IP:</strong> ${ip}</p>
            <p><strong>User-Agent:</strong> ${userAgent}</p>
            <p><strong>Server-Side Bot Detection:</strong> ${reason}</p>
            
            <script>
                // **JS Açıkken BotD'yi Çalıştır**
                fetch('/botd-test', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ requestId: "waiting", visitorId: "waiting" })
                })
                .then(response => response.json())
                .then(data => {
                    document.body.innerHTML += '<p><strong>BotD Status:</strong> ' + JSON.stringify(data, null, 2) + '</p>';
                })
                .catch(error => {
                    document.body.innerHTML += '<p><strong>BotD Error:</strong> ' + error.message + '</p>';
                });
            </script>
        </body>
        </html>
    `);
});

// **🛡️ BotD API ile Tarayıcı Üzerinden Tespit (JS Açıkken Ekstra Kontrol)**
app.post("/botd-test", async (req, res) => {
    const { requestId, visitorId } = req.body;

    if (!requestId || !visitorId) {
        return res.status(400).json({ error: "Request ID veya Visitor ID eksik!" });
    }

    try {
        const response = await axios.get(`${API_ENDPOINT}${requestId}`, {
            headers: { "Auth-API-Key": FINGERPRINT_SECRET_KEY, Accept: "application/json" },
        });

        const identificationEvent = response.data;
        console.log("🔎 API Yanıtı Alındı:", identificationEvent);

        // **BotD tespiti yaptıysa bot olarak işaretle**
        if (identificationEvent.products?.botd?.data?.bot?.result === "bad") {
            return res.status(403).json({ error: "🚨 Malicious bot detected (BotD)." });
        }

        return res.json({ status: "✅ Not a bot (BotD OK)", requestId, visitorId });
    } catch (error) {
        console.error("❌ API Hatası:", error.response ? error.response.data : error.message);
        return res.status(500).json({ error: "BotD API request failed." });
    }
});

// **Sunucu Başlat**
const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
