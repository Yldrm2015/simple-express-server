const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

// API Key ve Endpoint
const FINGERPRINT_SECRET_KEY = process.env.FINGERPRINT_SECRET_KEY;
const BOTD_API_URL = "https://api.fpjs.io/events/"; // Doğru endpoint

app.get("/botd-test", async (req, res) => {
  try {
    // 1. Request ID Al
    const requestIdResponse = await axios.post(
      BOTD_API_URL,
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

    const requestId = requestIdResponse.data.requestId;

    // 2. Event Bilgisini Al
    const eventResponse = await axios.get(`${BOTD_API_URL}${requestId}`, {
      headers: {
        Authorization: `Bearer ${FINGERPRINT_SECRET_KEY}`,
        Accept: "application/json",
      },
    });

    const eventData = eventResponse.data;

    // 3. Bot Kontrolü
    if (eventData.products?.botd?.data?.bot?.result !== "notDetected") {
      return res.status(403).json({
        success: false,
        error: "Bot detected, login is blocked.",
      });
    }

    // Başarılı cevabı istemciye gönder
    res.json(eventData);
  } catch (error) {
    console.error("BotD API Hatası:", error.response ? error.response.data : error.message);
    res.status(error.response?.status || 500).json({
      error: "BotD API çalıştırılamadı!",
      status: error.response?.status || 500,
      details: error.response ? error.response.data : error.message,
      headers: error.response?.headers || {},
    });
  }
});

// Sunucuyu başlat
const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
  console.log(`✅ BotD Test Sunucusu ${PORT} portunda çalışıyor.`);
});
