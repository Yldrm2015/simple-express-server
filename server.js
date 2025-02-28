const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const requestIp = require("request-ip");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const FINGERPRINT_SECRET_KEY = process.env.FINGERPRINT_SECRET_KEY;
const API_ENDPOINT = "https://eu.api.fpjs.io/events/";
const NODE_ENV = process.env.NODE_ENV || "development";

const BOT_USER_AGENTS = [
    "curl", "wget", "bot", "crawler", "spider", "httpclient",
    "python-requests", "java", "scrapy", "selenium", "headless"
];

// Fake veya Proxy IP'leri kara listeye alalım
const BLOCKED_IPS = new Set([
    "192.168.1.100",   // Fake test IP
    "127.0.0.1",       // Localhost
    "88.248.190.36",   // Test amaçlı bir IP
]);

console.log("✅ Server started in", NODE_ENV, "mode");

// **🛡️ Sunucu Tarafından Bot Tespiti**
app.get("/", async (req, res) => {
    const ip = requestIp.getClientIp(req) || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"] || "Unknown";

    console.log("🔍 [SERVER-SIDE DETECTION] Request received:");
    console.log("   - IP:", ip);
    console.log("   - User-Agent:", userAgent);

    let isBot = false;
    let reason = "✅ Not a bot.";

    // **IP Kara Liste Kontrolü**
    if (BLOCKED_IPS.has(ip)) {
        isBot = true;
        reason = "🚨 BOT DETECTED: Blacklisted IP!";
    }

    // **User-Agent bazlı bot tespiti**
    if (BOT_USER_AGENTS.some(botStr => userAgent.toLowerCase().includes(botStr))) {
        isBot = true;
        reason = "🚨 BOT DETECTED: Suspicious User-Agent!";
    }

    // **Şüpheli IP için BotD API'yi Kullan**
    let botdDetection = "Unknown";
    try {
        const response = await axios.get(`https://ipinfo.io/${ip}/json`);
        if (response.data.org && response.data.org.includes("Hosting")) {
            isBot = true;
            botdDetection = "🚨 BOT DETECTED: Data Center / VPN!";
        }
    } catch (error) {
        console.warn("⚠️ IP Kontrolü yapılamadı:", error.message);
    }

    if (isBot) {
        console.warn("🚨 BOT ALGILANDI:", { ip, userAgent, reason, botdDetection });
    }

    console.log("✅ [SERVER-SIDE DETECTION RESULT]:", reason);

    // **HTML Yanıtı (Headless Tarayıcıyı Tespit Etmek İçin JavaScript İçerir)**
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

            <p><strong>Sunucu Tespiti:</strong> ${reason}</p>
            <p id="js-detection">JavaScript Detection: Waiting...</p>

            <script>
                function detectHeadless() {
                    const isHeadless = navigator.webdriver || !navigator.languages || !window.chrome;
                    return isHeadless ? "🚨 BOT DETECTED: Headless Chrome!" : "✅ Not a bot.";
                }

                document.getElementById("js-detection").innerText = "JavaScript Detection: " + detectHeadless();
            </script>
        </body>
        </html>
    `);
});

// **BotD API ile Tarayıcı Üzerinden Tespit**
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
