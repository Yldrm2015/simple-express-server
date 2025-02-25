const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

// API Key ve Endpoint
const FINGERPRINT_SECRET_KEY = process.env.FINGERPRINT_SECRET_KEY;
const API_ENDPOINT = "https://eu.api.fpjs.io/events/";

app.get("/botd-test", async (req, res) => {
  const requestId = req.query.requestId; // Client-side identification sonrası alınan requestId
  if (!requestId) {
    return res.status(400).json({ error: "Request ID eksik! Lütfen client-side identification gerçekleştirin." });
  }

  let eventData = null;
  let error = null;

  try {
    // 1. Event Bilgisini Al
    const eventResponse = await axios.get(`${API_ENDPOINT}${requestId}`, {
      headers: {
        "Auth-API-Key": FINGERPRINT_SECRET_KEY,
        Accept: "application/json",
      },
    });

    eventData = eventResponse.data;
  } catch (err) {
    console.error(`Endpoint ${API_ENDPOINT} hatası:`, err.response ? err.response.data : err.message);
    error = err;
  }

  if (!eventData) {
    return res.status(500).json({
      error: "BotD API çalıştırılamadı!",
      details: error ? error.response.data : error.message,
    });
  }

  // 2. Bot Kontrolü
  if (eventData.products?.botd?.data?.bot?.result === "bad") {
    return res.status(403).json({
      success: false,
      error: "Malicious bot detected, login is blocked.",
    });
  }

  res.json(eventData);
});

const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
  console.log(`✅ BotD Test Sunucusu ${PORT} portunda çalışıyor.`);
});

