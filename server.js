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
const ALLOWED_REQUEST_TIMESTAMP_DIFF_MS = 300000; // 300 saniye (5 dakika)
const IPv4_REGEX = /^\d{1,3}(?:\.\d{1,3}){3}$/;
const ALLOWED_ORIGIN = "https://yourwebsite.com";

if (!FINGERPRINT_SECRET_KEY) {
  console.error("❌ ERROR: FINGERPRINT_SECRET_KEY environment variable is not set");
  process.exit(1);
}

// İşlenen Request ID'leri süreli olarak saklamak için Map()
const requestIdDatabase = new Map();

// İşlenen requestId'yi belirli bir süre sonra sil
function storeRequestId(requestId, ttl = 300000) { // 300 saniye (5 dakika)
  requestIdDatabase.set(requestId, Date.now());
  setTimeout(() => requestIdDatabase.delete(requestId), ttl);
}

app.post("/botd-test", async (req, res) => {
  const { requestId } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: "Request ID eksik! Lütfen client-side identification gerçekleştirin." });
  }

  try {
    // 1. Get the identification event from Server API
    const eventResponse = await axios.get(`${API_ENDPOINT}${requestId}`, {
      headers: {
        "Auth-API-Key": FINGERPRINT_SECRET_KEY,
        Accept: "application/json",
      },
    });
    
    const identificationEvent = eventResponse.data;

    // 2. Check if request ID was already processed
    if (requestIdDatabase.has(requestId)) {
      return res.status(403).json({ error: "Bu request ID zaten işlendi, potansiyel tekrar saldırısı." });
    }
    
    // requestId'yi işlenmiş olarak işaretle
    storeRequestId(requestId);
    
    // 3. Then do timestamp and other security validations
    const identificationData = identificationEvent.products?.identification?.data;
    if (!identificationData) {
      return res.status(403).json({ error: "Identification verisi eksik." });
    }

    if (Date.now() - Number(new Date(identificationData.time)) > ALLOWED_REQUEST_TIMESTAMP_DIFF_MS) {
      return res.status(403).json({ error: "Eski tanımlama isteği, potansiyel yeniden oynatma saldırısı." });
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

    const identificationIp = identificationData.ip;
    const requestIp = parseIp(req);
    if (IPv4_REGEX.test(requestIp) && identificationIp !== requestIp) {
      return res.status(403).json({ error: "Beklenmeyen IP adresi, potansiyel yeniden oynatma saldırısı." });
    }

    if (identificationData.confidence?.score < MIN_CONFIDENCE_SCORE) {
      return res.status(403).json({ error: "Low confidence score, actions requires 2FA." });
    }

    res.json({ status: "OK", botResult: identificationEvent.products?.botd?.data?.bot?.result, confidenceScore: identificationData.confidence?.score });
  } catch (error) {
    console.error("FingerprintJS API Hatası:", error.response ? error.response.data : error.message);
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
