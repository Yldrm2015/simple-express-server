const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");
const requestIp = require("request-ip");
const fs = require("fs");

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

// **🛡️ Sunucu Tarafında Bot Tespiti (JS Kapalıyken de Çalışır)**
app.get("/", async (req, res) => {
    try {
        const ip = requestIp.getClientIp(req) || req.socket.remoteAddress;
        const userAgent = req.headers["user-agent"] || "Unknown";

        console.log("🔍 [SERVER-SIDE DETECTION] Request received:");
        console.log("   - IP:", ip);
        console.log("   - User-Agent:", userAgent);

        let isBot = false;
        let reason = "✅ Not a bot.";

        if (BOT_USER_AGENTS.some(botStr => userAgent.toLowerCase().includes(botStr))) {
            isBot = true;
            reason = "🚨 BOT DETECTED: Suspicious User-Agent!";
            console.warn("🚨 [BOT DETECTED] IP:", ip, "User-Agent:", userAgent);
        }

        console.log("✅ [SERVER-SIDE DETECTION RESULT]:", reason);

        // **index.html dosyasını oku ve içine tespit sonucunu ekle**
        let html = fs.readFileSync(path.join(__dirname, "public", "index.html"), "utf8");
        html = html.replace("{{SERVER_RESULT}}", reason);

        res.send(html);
    } catch (error) {
        console.error("❌ [SERVER-SIDE ERROR]:", error);
        res.status(500).json({ error: "Server error in bot detection!", details: error.message });
    }
});

// **🛡️ BotD API ile Tarayıcı Üzerinden Tespit (JSON Formatında Çalışır)**
app.post("/botd-test", async (req, res) => {
    try {
        const { requestId, visitorId } = req.body;

        if (!requestId || !visitorId) {
            return res.status(400).json({ error: "Request ID veya Visitor ID eksik!" });
        }

        const response = await axios.get(`${API_ENDPOINT}${requestId}`, {
            headers: { "Auth-API-Key": FINGERPRINT_SECRET_KEY, Accept: "application/json" },
        });

        const identificationEvent = response.data;

        if (identificationEvent.products?.botd?.data?.bot?.result === "bad") {
            return res.status(403).json({ error: "🚨 Malicious bot detected (BotD)." });
        }

        return res.json({ status: "✅ Not a bot (BotD OK)", requestId, visitorId });

    } catch (error) {
        console.error("❌ [BOTD API ERROR]:", error.response ? error.response.data : error.message);
        return res.status(500).json({ error: "BotD API request failed." });
    }
});

const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
