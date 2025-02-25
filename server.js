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
const ALLOWED_REQUEST_TIMESTAMP_DIFF_MS = 3000;
const IPv4_REGEX = /^\d{1,3}(?:\.\d{1,3}){3}$/;
const ALLOWED_ORIGIN = "https://yourwebsite.com";

console.log("✅ Sunucu Başlatılıyor...");
console.log("🌍 API Endpoint:", API_ENDPOINT);
console.log("🔑 API Key Tanımlı mı?:", !!FINGERPRINT_SECRET_KEY);

if (!FINGERPRINT_SECRET_KEY) {
  console.error("❌ ERROR: FINGERPRINT_SECRET_KEY environment variable is not set");
  process.exit(1);
}

app.post("/botd-test", async (req, res) => {
  console.log("🟢 Yeni botd-test isteği alındı:", req.body);
  const { requestId } = req.body;
  if (!requestId) {
    console.error("⚠️ Request ID eksik!");
    return res.status(400).json({ error: "Request ID eksik! Lütfen client-side identification gerçekleştirin." });
  }

  try {
    const eventResponse = await axios.get(`${API_ENDPOINT}${requestId}`, {
      headers: {
        "Auth-API-Key": FINGERPRINT_SECRET_KEY,
        Accept: "application/json",
      },
    });

    const identificationEvent = eventResponse.data;
    console.log("📩 FingerprintJS API Yanıtı:", JSON.stringify(identificationEvent, null, 2));

    const botResult = identificationEvent.products?.botd?.data?.bot?.result;
    const identificationData = identificationEvent.products?.identification?.data;

    if (!identificationData) {
      return res.status(403).json({ error: "Identification verisi eksik." });
    }

    if (process.env.NODE_ENV === "production") {
      if (identificationData.url && new URL(identificationData.url).origin !== ALLOWED_ORIGIN) {
        return res.status(403).json({ error: "Beklenmeyen origin, potansiyel saldırı." });
      }
    } else {
      const requestOrigin = req.headers.origin;
      if (identificationData.url && new URL(identificationData.url).origin !== requestOrigin) {
        return res.status(403).json({ error: "Origin mismatch, potansiyel saldırı." });
      }
    }

    if (Date.now() - Number(new Date(identificationData.time)) > ALLOWED_REQUEST_TIMESTAMP_DIFF_MS) {
      return res.status(403).json({ error: "Eski tanımlama isteği, potansiyel yeniden oynatma saldırısı." });
    }

    const identificationIp = identificationData.ip;
    const requestIp = parseIp(req);
    if (IPv4_REGEX.test(requestIp) && identificationIp !== requestIp) {
      return res.status(403).json({ error: "Beklenmeyen IP adresi, potansiyel yeniden oynatma saldırısı." });
    }

    if (identificationData.confidence?.score < MIN_CONFIDENCE_SCORE) {
      return res.status(403).json({ error: "Low confidence score, actions requires 2FA." });
    }

    if (botResult === "bad") {
      return res.status(403).json({ error: "Kötü bot tespit edildi." });
    }

    res.json({ status: "OK", botResult, confidenceScore: identificationData.confidence?.score });

  } catch (error) {
    console.error("❌ FingerprintJS API Hatası:", JSON.stringify(error, null, 2));
    console.error("🔎 Yanıt Durumu:", error.response?.status);
    console.error("📩 Yanıt İçeriği:", error.response?.data);

    if (error.response && error.response.status === 401) {
      return res.status(500).json({ error: "Authentication failed - check your API key" });
    }

    res.status(500).json({
      error: "BotD API çalıştırılamadı!",
      details: error.response ? error.response.data : error.message,
    });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
  console.log(`✅ BotD Test Sunucusu ${PORT} portunda çalışıyor.`);
});
