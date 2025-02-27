const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");
const NodeCache = require("node-cache");
const crypto = require("crypto");

dotenv.config();

const parseIp = (req) => req.headers["x-forwarded-for"]?.split(",").shift() || req.socket.remoteAddress;

const app = express();
const requestIdDatabase = new NodeCache({ stdTTL: 300 });
const botRequestCache = new NodeCache({ stdTTL: 10, checkperiod: 10 }); // IP bazlı rate limiting

app.use(cors({
  origin: process.env.NODE_ENV === "production" ? "https://yourwebsite.com" : true,
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const FINGERPRINT_SECRET_KEY = process.env.FINGERPRINT_SECRET_KEY;
const API_ENDPOINT = "https://eu.api.fpjs.io/events/";
const ALLOWED_REQUEST_TIMESTAMP_DIFF_MS = 10000;
const NODE_ENV = process.env.NODE_ENV || "development";

console.log("✅ Sunucu başlatıldı, ortam:", NODE_ENV);

// **📌 Bilinen bot User-Agent listesi**
const BOT_USER_AGENTS = [
    "Googlebot", "Bingbot", "Slurp", "DuckDuckBot", "Baiduspider",
    "YandexBot", "Sogou", "facebot", "facebookexternalhit", "ia_archiver",
    "HeadlessChrome", "PhantomJS", "curl", "wget", "Python-urllib", "scrapy"
];

// **📌 IP + User-Agent Hash hesaplama**
function hashFingerprint(visitorId, ip, userAgent) {
    return crypto.createHash('sha256').update((visitorId || "unknown") + ip + userAgent).digest('hex');
}

// **📌 Rate Limiting Fonksiyonu (Spam botları yakalamak için)**
function isRateLimited(ip) {
    const requestCount = botRequestCache.get(ip) || 0;
    botRequestCache.set(ip, requestCount + 1);

    if (requestCount > 5) { // 10 saniyede 5'ten fazla istek atıyorsa bot olabilir
        return true;
    }
    return false;
}

// **📌 User-Agent ve IP tabanlı bot kontrolü**
function isBot(req) {
    const userAgent = req.headers["user-agent"] || "";
    if (BOT_USER_AGENTS.some(bot => userAgent.includes(bot))) {
        return true;
    }
    return false;
}

// **📌 Bot Tespit Endpointi**
app.post("/botd-test", async (req, res) => {
    const { requestId, visitorId } = req.body;
    const clientIp = parseIp(req);
    const userAgent = req.headers["user-agent"];

    console.log("🔍 Yeni İstek Alındı! Request ID:", requestId, "Visitor ID:", visitorId || "Eksik!", "IP:", clientIp, "User-Agent:", userAgent);

    // **📌 Eğer User-Agent bilinen botlardan biriyse, hemen engelle**
    if (isBot(req)) {
        console.warn("🚨 Bilinen Bot Tespit Edildi!", userAgent);
        return res.status(403).json({ error: "Malicious bot detected (User-Agent)" });
    }

    // **📌 Eğer IP çok fazla istek yapıyorsa, rate limit uygula**
    if (isRateLimited(clientIp)) {
        console.warn("🚨 Şüpheli Aktivite: Çok fazla istek atan IP tespit edildi!", clientIp);
        return res.status(403).json({ error: "Too many requests, potential bot activity." });
    }

    if (!requestId) {
        console.warn("❌ Hata: Request ID eksik!");
        return res.status(400).json({ error: "Request ID eksik!" });
    }

    if (!visitorId) {
        console.warn("⚠️ Uyarı: Visitor ID eksik! Sunucu tarafında tespit yapılacak...");
    }

    const fingerprintHash = hashFingerprint(visitorId, clientIp, userAgent);

    if (requestIdDatabase.has(fingerprintHash)) {
        console.warn("🚨 Daha önce bot olarak işaretlenen fingerprint tespit edildi!", fingerprintHash);
        return res.status(403).json({ error: "Bot tespit edildi!" });
    }

    const validationResult = await validateFingerprintResult(requestId, req);
    console.log("🔎 Validation Sonucu:", validationResult);

    if (!validationResult.success) {
        return res.status(403).json({ error: validationResult.error });
    }

    const identificationEvent = validationResult.identificationEvent;

    if (identificationEvent.products?.botd?.data?.bot?.result === "bad") {
        console.warn("🚨 Kötü Bot Tespit Edildi!");
        requestIdDatabase.set(fingerprintHash, true);
        return res.status(403).json({ error: "Malicious bot detected." });
    }

    res.json({ status: "OK" });
});

// **📌 Ana Sayfa Endpointi**
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// **📌 Sunucu Başlatma**
const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`✅ BotD Test Sunucusu ${PORT} portunda çalışıyor.`);
});
