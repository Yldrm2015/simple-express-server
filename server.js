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

// **🛡️ Sunucu Tarafında Bot Tespiti (JavaScript Kapalı Olsa Bile Çalışır)**
app.get("/", (req, res) => {
    try {
        const ip = requestIp.getClientIp(req) || req.socket.remoteAddress;
        const userAgent = req.headers["user-agent"] || "Unknown";

        console.log("🔍 [SERVER-SIDE DETECTION] Request received:");
        console.log("   - IP:", ip);
        console.log("   - User-Agent:", userAgent);

        let isBot = false;
        let reason = "✅ Not a bot.";

        // **User-Agent bazlı bot tespiti**
        if (BOT_USER_AGENTS.some(botStr => userAgent.toLowerCase().includes(botStr))) {
            isBot = true;
            reason = "🚨 BOT DETECTED: Suspicious User-Agent!";
            console.warn("🚨 [BOT DETECTED] IP:", ip, "User-Agent:", userAgent);
        }

        console.log("✅ [SERVER-SIDE DETECTION RESULT]:", reason);

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
    } catch (error) {
        console.error("❌ [SERVER-SIDE ERROR]:", error);
        res.status(500).json({ error: "Server error in bot detection!", details: error.message });
    }
});

// **🛡️ ÖZEL ENDPOINT: Sunucu Tarafı Bot Tespiti (JavaScript KAPALI OLSA BİLE ÇALIŞIR)**
app.get("/server-side-bot-detection", (req, res) => {
    try {
        const ip = requestIp.getClientIp(req) || req.socket.remoteAddress;
        const userAgent = req.headers["user-agent"] || "Unknown";

        console.log("🔍 [SERVER-SIDE BOT CHECK] IP:", ip, "User-Agent:", userAgent);

        let isBot = false;
        let reason = "✅ Not a bot.";

        if (BOT_USER_AGENTS.some(botStr => userAgent.toLowerCase().includes(botStr))) {
            isBot = true;
            reason = "🚨 BOT DETECTED: Suspicious User-Agent!";
            console.warn("🚨 [BOT DETECTED] IP:", ip, "User-Agent:", userAgent);
        }

        console.log("✅ [SERVER-SIDE DETECTION RESULT]:", reason);
        res.json({ status: isBot ? "❌ Bot Detected" : "✅ Not a bot", reason });

    } catch (error) {
        console.error("❌ [SERVER-SIDE DETECTION ERROR]:", error);
        res.status(500).json({ error: "Server error in bot detection!", details: error.message });
    }
});

// **🛡️ BotD API ile Tarayıcı Üzerinden Tespit (JS Açıkken Ekstra Kontrol)**
app.post("/botd-test", async (req, res) => {
    try {
        const { requestId, visitorId } = req.body;

        console.log("🔍 [BOTD DETECTION] Request received:");
        console.log("   - Request ID:", requestId);
        console.log("   - Visitor ID:", visitorId);

        if (!requestId || !visitorId) {
            console.warn("❌ [BOTD DETECTION ERROR]: Missing Request ID or Visitor ID!");
            return res.status(400).json({ error: "Request ID veya Visitor ID eksik!" });
        }

        console.log("📡 [BOTD API CALL] Fetching data from BotD API...");
        const response = await axios.get(`${API_ENDPOINT}${requestId}`, {
            headers: { "Auth-API-Key": FINGERPRINT_SECRET_KEY, Accept: "application/json" },
        });

        const identificationEvent = response.data;
        console.log("🔎 [BOTD API RESPONSE]:", JSON.stringify(identificationEvent, null, 2));

        if (identificationEvent.products?.botd?.data?.bot?.result === "bad") {
            console.warn("🚨 [BOTD ALERT]: Malicious bot detected!");
            return res.status(403).json({ error: "🚨 Malicious bot detected (BotD)." });
        }

        console.log("✅ [BOTD RESULT]: Not a bot.");
        return res.json({ status: "✅ Not a bot (BotD OK)", requestId, visitorId });

    } catch (error) {
        console.error("❌ [BOTD API ERROR]:", error.response ? error.response.data : error.message);
        return res.status(500).json({ error: "BotD API request failed." });
    }
});

// **Sunucu Başlat**
const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
