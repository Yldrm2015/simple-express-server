const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");
let parseIp;

dotenv.config();

try {
  parseIp = require("./utils").parseIp;
} catch (err) {
  console.warn("⚠️ Warning: utils.js dosyası bulunamadı, parseIp fonksiyonu devre dışı.");
  parseIp = (req) => req.headers["x-forwarded-for"]?.split(",").shift() || req.socket.remoteAddress;
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// API Key ve Environment Kontrolleri
const FINGERPRINT_SECRET_KEY = process.env.FINGERPRINT_SECRET_KEY;
const MIN_CONFIDENCE_SCORE = process.env.MIN_CONFIDENCE_SCORE || 0.5;
const API_ENDPOINT = "https://eu.api.fpjs.io/events/";
const ALLOWED_REQUEST_TIMESTAMP_DIFF_MS = 120000; // 120 saniye
const IPv4_REGEX = /^\d{1,3}(?:\.\d{1,3}){3}$/;
const ALLOWED_ORIGIN = "https://yourwebsite.com";

console.log("✅ Sunucu başlatıldı!");

// Redis bağlantısı KALDIRILDI! Eğer tekrar saldırı koruması istiyorsan Redis'i tekrar eklemelisin.

app.post("/botd-test", async (req, res) => {
  const { requestId } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: "Request ID eksik! Lütfen client-side identification gerçekleştirin." });
  }

  try {
    console.log(`🔍 Request ID alındı: ${requestId}`);

    // API'den event bilgilerini al
    const eventResponse = await axios.get(`${API_ENDPOINT}${requestId}`, {
      headers: {
        "Auth-API-Key": FINGERPRINT_SECRET_KEY,
        Accept: "application/json",
      },
    });

    console.log("✅ API'den event bilgisi alındı!");

    const identificationEvent = eventResponse.data;
    const botResult = identificationEvent.products?.botd?.data?.bot?.result;
    const identificationData = identificationEvent.products?.identification?.data;

    if (!identificationData) {
      console.error("❌ Identification verisi eksik.");
      return res.status(403).json({ error: "Identification verisi eksik." });
    }

    // Zaman Kontrolü (Replay Attack Önleme) - 120 saniye içinde olmalı
    if (Date.now() - Number(new Date(identificationData.time)) > ALLOWED_REQUEST_TIMESTAMP_DIFF_MS) {
      console.error("❌ Eski tanımlama isteği, potansiyel yeniden oynatma saldırısı.");
      return res.status(403).json({ error: "Eski tanımlama isteği, potansiyel yeniden oynatma saldırısı." });
    }

    if (process.env.NODE_ENV === "production") {
      if (identificationData.url && new URL(identificationData.url).origin !== ALLOWED_ORIGIN) {
        console.error("❌ Beklenmeyen origin, potansiyel saldırı.");
        return res.status(403).json({ error: "Beklenmeyen origin, potansiyel saldırı." });
      }
    } else {
      const requestOrigin = req.headers.origin;
      if (identificationData.url && new URL(identificationData.url).origin !== requestOrigin) {
        console.error("❌ Origin mismatch, potansiyel saldırı.");
        return res.status(403).json({ error: "Origin mismatch, potansiyel saldırı." });
      }
    }

    const identificationIp = identificationData.ip;
    const requestIp = parseIp(req);
    if (IPv4_REGEX.test(requestIp) && identificationIp !== requestIp) {
      console.error("❌ Beklenmeyen IP adresi, potansiyel yeniden oynatma saldırısı.");
      return res.status(403).json({ error: "Beklenmeyen IP adresi, potansiyel yeniden oynatma saldırısı." });
    }

    if (identificationData.confidence?.score < MIN_CONFIDENCE_SCORE) {
      console.error("❌ Düşük güven puanı, ek doğrulama gerekiyor.");
      return res.status(403).json({ error: "Low confidence score, actions requires 2FA." });
    }

    if (botResult === "bad") {
      console.error("❌ Kötü bot tespit edildi.");
      return res.status(403).json({ error: "Kötü bot tespit edildi." });
    }

    if (identificationEvent.products?.vpn?.data?.result === true) {
      console.error("❌ VPN ağı tespit edildi.");
      return res.status(403).json({ error: "VPN ağı tespit edildi." });
    }
    if (identificationEvent.products?.tor?.data?.result === true) {
      console.error("❌ Tor ağı tespit edildi.");
      return res.status(403).json({ error: "Tor ağı tespit edildi." });
    }
    if (identificationEvent.products?.tampering?.data?.result === true) {
      console.error("❌ Tarayıcı müdahalesi tespit edildi.");
      return res.status(403).json({ error: "Tarayıcı müdahalesi tespit edildi." });
    }

    console.log("✅ Bot tespit işlemi başarılı!");

    res.json({ status: "OK", botResult, confidenceScore: identificationData.confidence?.score });
  } catch (error) {
    console.error("❌ API Hatası:", error.response ? error.response.data : error.message);

    if (error.response) {
      switch (error.response.status) {
        case 403:
          return res.status(403).json({ error: "Access forbidden - check your API permissions" });
        case 404:
          return res.status(404).json({ error: "Request ID not found" });
        case 429:
          return res.status(429).json({ error: "Too many requests" });
        default:
          return res.status(500).json({
            error: "API error",
            details: error.response.data,
          });
      }
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
  console.log(`✅ BotD Test Sunucusu ${PORT} portunda çalışıyor.`);
});
