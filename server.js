const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");
const NodeCache = require("node-cache");
const tls = require("tls");
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

function getJA3Hash(socket) {
    if (!socket || !socket.getPeerCertificate) {
        console.warn("❌ JA3 Fingerprint alınamadı: socket veya getPeerCertificate eksik!");
        return null;
    }
    
    const cert = socket.getPeerCertificate();
    if (!cert || !cert.fingerprint) {
        console.warn("❌ JA3 Fingerprint alınamadı: Sertifika bilgisi eksik!");
        return null;
    }

    const fingerprintData = [
        socket.getProtocol(),
        socket.getCipher() ? socket.getCipher().name : "unknown",
        cert.fingerprint,
    ].join(',');

    console.log("🔍 JA3 Fingerprint Hesaplandı:", fingerprintData);
    return crypto.createHash('md5').update(fingerprintData).digest('hex');
}

app.use((req, res, next) => {
    const fingerprint = getJA3Hash(req.socket);
    console.log("🔍 JA3 Fingerprint:", fingerprint);

    const knownBotFingerprints = [
        "d4e05f8ff88d63b3ff3c68b1d24f92bd",
        "921f7b291ff8b1871f1ad88e78263546"
    ];

    if (fingerprint && knownBotFingerprints.includes(fingerprint)) {
        console.warn("🚨 Bot JA3 Fingerprint Tespit Edildi:", fingerprint);
        return res.status(403).json({ error: "Malicious bot detected (JA3 Fingerprint)" });
    }

    req.ja3Fingerprint = fingerprint;
    next();
});

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
        console.warn("⚠️ API'den gelen kimlik doğrulama isteği çok eski! Tekrar dene.");
        await new Promise(resolve => setTimeout(resolve, 3000));
        attempts--;
        continue;
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

  const identificationEvent = validationResult.identificationEvent;

  if (identificationEvent.products?.botd?.data?.bot?.result === "bad") {
    console.warn("🚨 Kötü Bot Tespit Edildi!");
    return res.status(403).json({ error: "Malicious bot detected." });
  }

  res.json({ status: "OK", ja3: req.ja3Fingerprint });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
  console.log(`✅ BotD Test Sunucusu ${PORT} portunda çalışıyor.`);
});
