const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");
let parseIp;

try {
  // Eğer utils.js dosyası varsa içe aktar, yoksa hata mesajı ver
  parseIp = require("./utils").parseIp;
} catch (err) {
  console.warn("⚠️ Warning: utils.js dosyası bulunamadı, parseIp fonksiyonu devre dışı.");
  parseIp = (req) => req.headers["x-forwarded-for"]?.split(",").shift() || req.socket.remoteAddress;
}

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// API Key ve Endpoint
const FINGERPRINT_SECRET_KEY = process.env.FINGERPRINT_SECRET_KEY;
const API_ENDPOINT = "https://eu.api.fpjs.io/events/";
const ALLOWED_REQUEST_TIMESTAMP_DIFF_MS = 3000;
const IPv4_REGEX = /^\d{1,3}(?:\.\d{1,3}){3}$/;
const ALLOWED_ORIGIN = "https://yourwebsite.com";

app.post("/botd-test", async (req, res) => {
  const { requestId } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: "Request ID eksik! Lütfen client-side identification gerçekleştirin." });
  }

  try {
    // 1. Event Bilgisini Al
    const eventResponse = await axios.get(`${API_ENDPOINT}${requestId}`, {
      headers: {
        "Auth-API-Key": FINGERPRINT_SECRET_KEY,
        Accept: "application/json",
      },
    });

    const identificationEvent = eventResponse.data;
    const botResult = identificationEvent.products?.botd?.data?.bot?.result;
    const identificationData = identificationEvent.products?.identification?.data;

    // 2. Güvenlik Kontrolleri
    if (!identificationData) {
      return res.status(403).json({ error: "Identification verisi eksik." });
    }

    // Zaman Kontrolü (Replay Attack Önleme)
    if (Date.now() - Number(new Date(identificationData.time)) > ALLOWED_REQUEST_TIMESTAMP_DIFF_MS) {
      return res.status(403).json({ error: "Eski tanımlama isteği, potansiyel yeniden oynatma saldırısı." });
    }

    // IP Kontrolü (Replay Attack Önleme)
    const identificationIp = identificationData.ip;
    const requestIp = parseIp(req);
    if (IPv4_REGEX.test(requestIp) && identificationIp !== requestIp) {
      return res.status(403).json({ error: "Beklenmeyen IP adresi, potansiyel yeniden oynatma saldırısı." });
    }

    // Origin Kontrolü (Güvenlik Önlemi)
    const identificationOrigin = new URL(identificationData.url).origin;
    const requestOrigin = req.headers.origin;
    if (
      identificationOrigin !== requestOrigin ||
      identificationOrigin !== ALLOWED_ORIGIN ||
      requestOrigin !== ALLOWED_ORIGIN
    ) {
      return res.status(403).json({ error: "Beklenmeyen origin, potansiyel saldırı." });
    }

    // Bot Detection Kontrolü
    if (botResult === "bad") {
      return res.status(403).json({ error: "Kötü bot tespit edildi." });
    }

    // Ek Güvenlik Kontrolleri
    if (identificationEvent.products?.vpn?.data?.result === true) {
      return res.status(403).json({ error: "VPN ağı tespit edildi." });
    }
    if (identificationEvent.products?.tor?.data?.result === true) {
      return res.status(403).json({ error: "Tor ağı tespit edildi." });
    }
    if (identificationEvent.products?.tampering?.data?.result === true) {
      return res.status(403).json({ error: "Tarayıcı müdahalesi tespit edildi." });
    }

    // Normal işleme devam et
    res.json({ status: "OK", botResult });
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

const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
  console.log(`✅ BotD Test Sunucusu ${PORT} portunda çalışıyor.`);
});
