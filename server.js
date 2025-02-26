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
const ALLOWED_REQUEST_TIMESTAMP_DIFF_MS = 30 * 60 * 1000;
const ALLOWED_ORIGIN = "https://yourwebsite.com";
const NODE_ENV = process.env.NODE_ENV || "development";

console.log("✅ Sunucu başlatıldı, ortam:", NODE_ENV);

function validateFingerprintResult(identificationEvent, request) {
  const identification = identificationEvent.products?.identification?.data;
  if (!identification) {
    return { okay: false, error: "Identification event not found" };
  }

  console.log('Debug - Request Origin:', request.headers.origin);
  console.log('Debug - Identification URL:', identification.url);
  console.log('Debug - Environment:', NODE_ENV);

  if (NODE_ENV !== "production") {
    return { okay: true };
  }

  if (NODE_ENV === "production") {
    const identificationOrigin = new URL(identification.url).origin;
    if (identificationOrigin !== ALLOWED_ORIGIN) {
      return { okay: false, error: "Invalid origin" };
    }
  }

  if (NODE_ENV === "production") {
    if (Date.now() - Number(new Date(identification.time)) > ALLOWED_REQUEST_TIMESTAMP_DIFF_MS) {
      return { okay: false, error: "Expired request" };
    }
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

    const botResult = identificationEvent.products?.botd?.data?.bot?.result;

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
    res.json({ status: "OK", botResult });
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
