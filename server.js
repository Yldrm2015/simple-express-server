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
const requestIdDatabase = new NodeCache({ stdTTL: 300 }); // Cache to prevent replay attacks
app.use(cors({
  origin: process.env.NODE_ENV === "production" ? "https://yourwebsite.com" : true,
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const FINGERPRINT_SECRET_KEY = process.env.FINGERPRINT_SECRET_KEY;
const API_ENDPOINT = "https://eu.api.fpjs.io/events/";
const ALLOWED_REQUEST_TIMESTAMP_DIFF_MS = 10000; // Timeout süresini artırdık
const ALLOWED_ORIGIN = "https://yourwebsite.com";
const NODE_ENV = process.env.NODE_ENV || "development";
const MIN_CONFIDENCE_SCORE = 0.6;

console.log("✅ Sunucu başlatıldı, ortam:", NODE_ENV);

// IP + Fingerprint Hash hesaplama
function hashFingerprint(visitorId, ip) {
    return crypto.createHash('sha256').update(visitorId + ip).digest('hex');
}

// FingerprintJS doğrulama
async function validateFingerprintResult(requestId, request) {
    console.log("🔍 Gelen Request ID:", requestId);

    if (!FINGERPRINT_SECRET_KEY) {
        console.error("❌ Hata: FingerprintJS API Key eksik!");
        return { success: false, error: "FingerprintJS API Key missing!" };
    }

    if (requestIdDatabase.has(requestId)) {
        console.warn("⚠️ Tekrar Kullanılan Request ID:", requestId);
        return { success: false, error: "Already processed this request ID, potential replay attack." };
    }

    let attempts = 3;
    while (attempts > 0) {
        try {
            console.log("🔄 API'ye istek gönderiliyor, deneme:", 4 - attempts);
            await new Promise(resolve => setTimeout(resolve, 3000)); // Bekleme süresi eklendi
            const response = await axios.get(`${API_ENDPOINT}${requestId}`, {
                headers: { "Auth-API-Key": FINGERPRINT_SECRET_KEY, Accept: "application/json" },
            });

            const identificationEvent = response.data;
            console.log("🔎 API Yanıtı Alındı:", identificationEvent);
            const identification = identificationEvent.products?.identification?.data;

            if (!identification) {
                return { success: false, error: "Identification event not found, potential spoofing attack." };
            }

            if (Date.now() - Number(new Date(identification.time)) > ALLOWED_REQUEST_TIMESTAMP_DIFF_MS) {
                return { success: false, error: "Old identification request, potential replay attack." };
            }

            requestIdDatabase.set(requestId, true);
            return { success: true, identificationEvent };
        } catch (error) {
            console.error("❌ API Hatası:", error.response ? error.response.data : error.message);
            if (error.response && error.response.data?.code === "StateNotReady") {
                console.warn("⚠️ StateNotReady hatası alındı, tekrar deneniyor...");
                await new Promise(resolve => setTimeout(resolve, 3000));
                attempts--;
            } else {
                return { success: false, error: "API request failed" };
            }
        }
    }
    return { success: false, error: "StateNotReady retries exceeded, request failed." };
}

// Bot Tespit Endpointi
app.post("/botd-test", async (req, res) => {
    const { requestId, visitorId } = req.body;
    const clientIp = parseIp(req);
    console.log("🔍 Yeni İstek Alındı! Request ID:", requestId, "Visitor ID:", visitorId, "IP:", clientIp);

    if (!requestId || !visitorId) {
        console.warn("❌ Hata: Request ID veya Visitor ID eksik!");
        return res.status(400).json({ error: "Request ID veya Visitor ID eksik!" });
    }

    const fingerprintHash = hashFingerprint(visitorId, clientIp);

    // Eğer daha önce bot olarak işaretlenmişse
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
        requestIdDatabase.set(fingerprintHash, true); // Botları kaydet
        return res.status(403).json({ error: "Malicious bot detected." });
    }

    res.json({ status: "OK" });
});

// Ana Sayfa Endpointi
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Sunucu Başlatma
const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`✅ BotD Test Sunucusu ${PORT} portunda çalışıyor.`);
});
