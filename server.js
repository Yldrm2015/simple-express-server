const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");
const { createClient } = require("redis");
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

if (!FINGERPRINT_SECRET_KEY) {
  console.error("❌ ERROR: FINGERPRINT_SECRET_KEY environment variable is not set");
  process.exit(1);
}

// Redis ile işlenen Request ID'leri depolamak
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379"
});

redisClient.on("error", (err) => console.error("❌ Redis Bağlantı Hatası:", err));

redisClient.connect()
  .then(() => console.log("✅ Redis'e başarıyla bağlandı!"))
  .catch(err => console.error("❌ Redis bağlantı hatası:", err));

/**
 * 🔹 validateFingerprintResult: Fingerprint doğrulama işlemi
 */
function validateFingerprintResult(identificationEvent, request) {
  const identification = identificationEvent.products?.identification?.data;

  if (!identification) {
    return { okay: false, error: "Identification event not found, potential spoofing attack." };
  }

  // Zaman damgası doğrulaması (5 dakikadan eski istekler reddedilir)
  if (Date.now() - Number(new Date(identification.time)) > ALLOWED_REQUEST_TIMESTAMP_DIFF_MS) {
    return { okay: false, error: "Old identification request, potential replay attack." };
  }

  // Origin doğrulaması
  const identificationOrigin = new URL(identification.url).origin;
  const requestOrigin = request.headers.origin;
  if (identificationOrigin !== requestOrigin) {
    return { okay: false, error: "Unexpected origin, potential replay attack." };
  }

  // IP doğrulaması
  const identificationIp = identification.ip;
  const requestIp = parseIp(request);
  if (IPv4_REGEX.test(requestIp) && identificationIp !== requestIp) {
    return { okay: false, error: "Unexpected IP address, potential replay attack." };
  }

  return { okay: true };
}

app.post("/botd-test", async (req, res) => {
  const { requestId } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: "Request ID eksik! Lütfen client-side identification gerçekleştirin." });
  }

  try {
    // 1️⃣ İlk olarak FingerprintJS API'sinden kimlik doğrulama verisini al
    const eventResponse = await axios.get(`${API_ENDPOINT}${requestId}`, {
      headers: {
        "Auth-API-Key": FINGERPRINT_SECRET_KEY,
        Accept: "application/json",
      },
    });

    if (!eventResponse.data) {
      return res.status(500).json({ error: "Invalid response from Fingerprint API" });
    }

    const identificationEvent = eventResponse.data;

    // 2️⃣ Kimlik doğrulama sonucunu doğrula
    const { okay, error } = validateFingerprintResult(identificationEvent, req);
    if (!okay) {
      return res.status(403).json({ error });
    }

    // 3️⃣ Daha önce işlenmiş mi? (Replay attack kontrolü)
    const isProcessed = await redisClient.get(requestId);
    if (isProcessed) {
      return res.status(403).json({ error: "Bu request ID zaten işlendi, potansiyel tekrar saldırısı." });
    }

    // 4️⃣ Bot, VPN, Tor veya manipülasyon tespiti
    const botResult = identificationEvent.products?.botd?.data?.bot?.result;
    if (botResult === "bad") {
      return res.status(403).json({ error: "Kötü bot tespit edildi." });
    }
    if (identificationEvent.products?.vpn?.data?.result === true) {
      return res.status(403).json({ error: "VPN ağı tespit edildi." });
    }
    if (identificationEvent.products?.tor?.data?.result === true) {
      return res.status(403).json({ error: "Tor ağı tespit edildi." });
    }
    if (identificationEvent.products?.tampering?.data?.result === true) {
      return res.status(403).json({ error: "Tarayıcı müdahalesi tespit edildi." });
    }

    // 5️⃣ Geçerli ise request ID'yi Redis'e kaydet (30 dakika sonra otomatik silinir)
    await redisClient.setEx(requestId, 1800, "processed");

    // 6️⃣ Sunucu başarılı yanıt döndür
    res.json({ status: "OK", botResult });

  } catch (error) {
    console.error("FingerprintJS API Hatası:", error.response ? error.response.data : error.message);

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
