const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

// API Key ve Endpoint
const FINGERPRINT_SECRET_KEY = process.env.FINGERPRINT_SECRET_KEY;
const API_ENDPOINT = "https://eu.api.fpjs.io/events/";

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

    // 2. Güvenlik Kontrolleri
    const ALLOWED_REQUEST_TIMESTAMP_DIFF_MS = 3000;
    if (Date.now() - Number(new Date(identificationEvent.time)) > ALLOWED_REQUEST_TIMESTAMP_DIFF_MS) {
      return res.status(403).json({ error: "Eski tanımlama isteği, potansiyel yeniden oynatma saldırısı." });
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
