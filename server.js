const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");
const NodeCache = require("node-cache");

dotenv.config();

const parseIp = (req) => req.headers["x-forwarded-for"]?.split(",").shift() || req.socket.remoteAddress;

const app = express();
const requestCache = new NodeCache({ stdTTL: 60 }); // Davranışsal analiz için
const knownBotIps = new Set(["45.83.64.1", "104.244.42.65"]); // Örnek bot IP'leri

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const FINGERPRINT_SECRET_KEY = process.env.FINGERPRINT_SECRET_KEY;
const API_ENDPOINT = "https://eu.api.fpjs.io/events/";

const PORT = process.env.PORT || 8080;
console.log(`✅ Sunucu başlatıldı, Port: ${PORT}`);

// 📌 **JS Açıkken FingerprintJS (BotD) Kullanarak Botları Tespit Et**
async function validateFingerprintResult(requestId, request) {
    console.log("🔍 Gelen Request ID:", requestId);

    if (!FINGERPRINT_SECRET_KEY) {
        console.error("❌ Hata: FingerprintJS API Key eksik!");
        return { success: false, error: "FingerprintJS API Key missing!" };
    }

    try {
        console.log("🔄 API'ye istek gönderiliyor...");
        const response = await axios.get(`${API_ENDPOINT}${requestId}`, {
            headers: { "Auth-API-Key": FINGERPRINT_SECRET_KEY, Accept: "application/json" },
        });

        const identificationEvent = response.data;
        console.log("🔎 API Yanıtı Alındı:", identificationEvent);
        const identification = identificationEvent.products?.identification?.data;

        if (!identification) {
            return { success: false, error: "Identification event not found, potential spoofing attack." };
        }

        return { success: true, identificationEvent };
    } catch (error) {
        console.error("❌ API Hatası:", error.response ? error.response.data : error.message);
        return { success: false, error: "API request failed" };
    }
}

// 📌 **JS Kapalıyken Sunucu Tarafında Botları Tespit Et**
async function detectBotByIpAndBehavior(req) {
    const clientIp = parseIp(req);
    const userAgent = req.headers["user-agent"] || "Unknown";

    console.log("🔍 Gelen IP:", clientIp, "User-Agent:", userAgent);

    // 📌 Bilinen bot IP'lerini kontrol et
    if (knownBotIps.has(clientIp)) {
        console.warn("🚨 Bot IP Kara Listeye Girdi:", clientIp);
        return { success: false, error: "Bot detected based on IP." };
    }

    // 📌 Kullanıcı davranış analizi: Çok hızlı istek yapıyorsa bot olabilir
    const requestCount = requestCache.get(clientIp) || 0;
    requestCache.set(clientIp, requestCount + 1);

    if (requestCount > 10) { // 10 isteği geçenler şüpheli
        console.warn("🚨 Hızlı İstek Tespit Edildi! IP:", clientIp);
        return { success: false, error: "Bot detected based on behavior." };
    }

    // 📌 User-Agent Analizi: Bot tarayıcılarını tespit et
    const botUserAgents = ["Scrapy", "curl", "python-requests", "wget"];
    if (botUserAgents.some(bot => userAgent.toLowerCase().includes(bot))) {
        console.warn("🚨 Şüpheli User-Agent Tespit Edildi:", userAgent);
        return { success: false, error: "Bot detected based on User-Agent." };
    }

    return { success: true };
}

// 📌 **Tarayıcı Açıkken BotD Kullanarak Kontrol Et**
app.post("/botd-test", async (req, res) => {
    const { requestId } = req.body;
    console.log("🔍 Yeni İstek Alındı! Request ID:", requestId);

    if (!requestId) {
        console.warn("❌ Hata: Request ID eksik!");
        return res.status(400).json({ error: "Request ID eksik! Lütfen client-side identification gerçekleştirin." });
    }

    const validationResult = await validateFingerprintResult(requestId, req);
    console.log("🔎 Validation Sonucu:", validationResult);

    if (!validationResult.success) {
        console.warn("❌ Doğrulama Başarısız:", validationResult.error);
        return res.status(403).json({ error: validationResult.error });
    }

    res.json({ status: "OK", message: "User is not a bot." });
});

// 📌 **JS Kapalıyken Sunucu Tarafında Bot Kontrolü**
app.get("/server-side-bot-detection", async (req, res) => {
    console.log("🔍 Sunucu Taraflı Bot Kontrolü Çalıştırılıyor...");
    
    const detectionResult = await detectBotByIpAndBehavior(req);

    if (!detectionResult.success) {
        console.warn("❌ Sunucu Taraflı Bot Tespit Edildi!", detectionResult.error);
        return res.status(403).json({ error: detectionResult.error });
    }

    res.json({ status: "OK", message: "User is not a bot." });
});

// 📌 **Ana Sayfa Endpointi**
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 📌 **Sunucu Dinleme**
app.listen(PORT, () => {
    console.log(`✅ Bot Tespit Sunucusu ${PORT} portunda çalışıyor.`);
});
