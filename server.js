const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");
const NodeCache = require("node-cache");

dotenv.config();

const parseIp = (req) => req.headers["x-forwarded-for"]?.split(",").shift() || req.socket.remoteAddress;

const app = express();
const requestIdDatabase = new NodeCache({ stdTTL: 300 }); // Cache to prevent replay attacks
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const FINGERPRINT_SECRET_KEY = process.env.FINGERPRINT_SECRET_KEY;
const API_ENDPOINT = "https://eu.api.fpjs.io/events/";
const ALLOWED_REQUEST_TIMESTAMP_DIFF_MS = 10000;
const NODE_ENV = process.env.NODE_ENV || "development";
const BOT_IP_LIST = new Set();
const BOT_USER_AGENTS = [
    "curl", "wget", "bot", "crawler", "spider", "httpclient",
    "python-requests", "java", "scrapy", "selenium", "headless"
];

console.log("✅ Sunucu başlatıldı, ortam:", NODE_ENV);

// 🌟 **Global Middleware: Tüm İsteklerde Bot Tespiti Yap**
app.use((req, res, next) => {
    const ip = parseIp(req);
    const userAgent = req.headers["user-agent"] || "Unknown";

    console.log("🔍 Yeni İstek:", { ip, userAgent });

    let isBot = false;
    let reason = "Legitimate user.";

    // **IP geçmişine göre bot tespiti**
    if (BOT_IP_LIST.has(ip)) {
        isBot = true;
        reason = "Suspicious IP detected (Previously flagged as bot).";
    }

    // **User-Agent bazlı tespit**
    if (BOT_USER_AGENTS.some(botStr => userAgent.toLowerCase().includes(botStr))) {
        isBot = true;
        reason = "Suspicious User-Agent detected.";
    }

    // **Özel header'lar ile bot kontrolü (Gelişmiş tespit)**
    const suspiciousHeaders = ["sec-fetch-mode", "sec-fetch-dest", "sec-fetch-site"];
    if (!req.headers["accept-language"] || suspiciousHeaders.some(h => req.headers[h])) {
        isBot = true;
        reason = "Suspicious browser headers detected.";
    }

    if (isBot) {
        console.warn("🚨 BOT ALGILANDI:", { ip, userAgent, reason });
        BOT_IP_LIST.add(ip); // Bot IP'yi kaydet
        return res.status(403).json({ error: "Bot detected.", reason });
    }

    next();
});

// **🛡️ Sunucu Tarafından Bot Algılama (JS Kapalı Olsa Bile Çalışır)**
app.get("/server-side-bot-detection", (req, res) => {
    res.json({ status: "OK", message: "Sunucu tarafında tespit çalışıyor." });
});

// **🛡️ BotD API ile Tarayıcı Üzerinden Tespit (JS Açıkken Ekstra Kontrol)**
app.post("/botd-test", async (req, res) => {
    const { requestId, visitorId } = req.body;
    const ip = parseIp(req);

    console.log("🔍 Yeni İstek Alındı! Request ID:", requestId, "Visitor ID:", visitorId, "IP:", ip);

    if (!requestId || !visitorId) {
        console.warn("❌ Hata: Request ID veya Visitor ID eksik!");
        return res.status(400).json({ error: "Request ID veya Visitor ID eksik!" });
    }

    try {
        const response = await axios.get(`${API_ENDPOINT}${requestId}`, {
            headers: { "Auth-API-Key": FINGERPRINT_SECRET_KEY, Accept: "application/json" },
        });

        const identificationEvent = response.data;
        console.log("🔎 API Yanıtı Alındı:", identificationEvent);

        // **BOTD'nin botları tespit edip etmediğini kontrol et**
        if (identificationEvent.products?.botd?.data?.bot?.result === "bad") {
            console.warn("🚨 Kötü Bot Tespit Edildi!");
            return res.status(403).json({ error: "Malicious bot detected (BotD)." });
        }

        return res.json({ status: "OK", requestId, visitorId });
    } catch (error) {
        console.error("❌ API Hatası:", error.response ? error.response.data : error.message);
        return res.status(500).json({ error: "BotD API request failed." });
    }
});

// **🛡️ Ana Sayfa Servisi**
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`✅ Sunucu ${PORT} portunda çalışıyor...`);
});
