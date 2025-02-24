const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

// API Key ve Endpointler
const FINGERPRINT_SECRET_KEY = process.env.FINGERPRINT_SECRET_KEY;
const API_ENDPOINTS = [
  "https://api.fpjs.io/events/",
  "https://eu.api.fpjs.io/events/",
  "https://ap.api.fpjs.io/events/",
];

app.get("/botd-test", async (req, res) => {
  let requestId = null;
  let eventData = null;
  let error = null;

  // Endpointleri sırayla dene
  for (const endpoint of API_ENDPOINTS) {
    try {
      // 1. Request ID Al
      const requestIdResponse = await axios.post(
        endpoint,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${FINGERPRINT_SECRET_KEY}`,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            Accept: "application/json",
          },
        }
      );

      requestId = requestIdResponse.data.requestId;

      // 2. Event Bilgisini Al
      const eventResponse = await axios.get(`${endpoint}${requestId}`, {
        headers: {
          Authorization: `Bearer ${FINGERPRINT_SECRET_KEY}`,
          Accept: "application/json",
        },
      });

      eventData = eventResponse.data;
      break; // Başarılı olursa döngüden çık
    } catch (err) {
      console.error(`Endpoint ${endpoint} hatası:`, err.response ? err.response.data : err.message);
      error = err;
    }
  }

  // Hata kontrolü
  if (!requestId || !eventData) {
    return res.status(500).json({
      error: "BotD API çalıştırılamadı!",
      details: error ? error.response.data : error.message,
    });
  }

  // 3. Bot Kontrolü
  if (eventData.products?.botd?.data?.bot?.result !== "notDetected") {
    return res.status(403).json({
      success: false,
      error: "Bot detected, login is blocked.",
    });
  }

  // Başarılı cevabı istemciye gönder
  res.json(eventData);
});

// Sunucuyu başlat
const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
  console.log(`✅ BotD Test Sunucusu ${PORT} portunda çalışıyor.`);
});
