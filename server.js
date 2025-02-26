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
app.use(cors({
  origin: process.env.NODE_ENV === "production" ? "https://yourwebsite.com" : true,
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const FINGERPRINT_SECRET_KEY = process.env.FINGERPRINT_SECRET_KEY;
const API_ENDPOINT = "https://eu.api.fpjs.io/events/";
const ALLOWED_REQUEST_TIMESTAMP_DIFF_MS = 3000; // Shorter timeout to avoid StateNotReady error
const ALLOWED_ORIGIN = "https://yourwebsite.com";
const NODE_ENV = process.env.NODE_ENV || "development";

console.log("✅ Sunucu başlatıldı, ortam:", NODE_ENV);

function validateFingerprintResult(identificationEvent, request) {
  const identification = identificationEvent.products?.identification?.data;
  if (!identification) {
    return { okay: false, error: "Identification event not found, potential spoofing attack." };
  }

  if (Date.now() - Number(new Date(identification.time)) > ALLOWED_REQUEST_TIMESTAMP_DIFF_MS) {
    return { okay: false, error: "Old identification request, potential replay attack." };
  }

  const identificationOrigin = new URL(identification.url).origin;
  const requestOrigin = request.headers.origin;
  if (
    identificationOrigin !== requestOrigin ||
    identificationOrigin !== ALLOWED_ORIGIN ||
    requestOrigin !== ALLOWED_ORIGIN
  ) {
    return { okay: false, error: "Unexpected origin, potential replay attack." };
  }

  return { okay: true };
}

app.post("/botd-test", async (req, res) => {
  const { requestId } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: "Request ID eksik! Lütfen client-side identification gerçekleştirin." });
  }

  try {
    console.log(`🔍 Request ID alındı: ${requestId}`);

    await new Promise(resolve => setTimeout(resolve, 2000)); // Delay to avoid StateNotReady error
    
    const eventResponse = await axios.get(`${API_ENDPOINT}${requestId}`, {
      headers: {
        "Auth-API-Key": FINGERPRINT_SECRET_KEY,
        Accept: "application/json",
      },
    });

    console.log("✅ API'den event bilgisi alındı!");

    const identificationEvent = eventResponse.data;
    const { okay, error } = validateFingerprintResult(identificationEvent, req);
    if (!okay) {
      console.error(`❌ Doğrulama başarısız: ${error}`);
      return res.status(403).json({ error });
    }

    if (identificationEvent.products?.botd?.data?.bot?.result === "bad") {
      return res.status(403).json({ error: "Malicious bot detected" });
    }

    if (identificationEvent.products?.vpn?.data?.result === true) {
      return res.status(403).json({ error: "VPN network detected" });
    }

    res.json({ status: "OK" });
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
        case 400:
          return res.status(400).json({ error: "StateNotReady - Request is not yet ready, try again later." });
        default:
          return res.status(500).json({ error: "API error", details: error.response.data });
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
