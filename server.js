const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

// 📌 API Key ve Bölgesel Endpoint
const FINGERPRINT_SECRET_KEY = process.env.FINGERPRINT_SECRET_KEY;
const BOTD_API_URL = "https://api.fpjs.io/v1/botd";  // Amerika (US) bölgesi API

app.get("/botd-test", async (req, res) => {
    try {
        if (!FINGERPRINT_SECRET_KEY) {
            throw new Error("API Key bulunamadı! Lütfen Render Environment Variables içinde 'FINGERPRINT_SECRET_KEY' değişkenini tanımlayın.");
        }

        console.log("API Key:", FINGERPRINT_SECRET_KEY);
        console.log("API URL:", BOTD_API_URL);

        const response = await axios.post(BOTD_API_URL, {}, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${FINGERPRINT_SECRET_KEY}`,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Accept": "application/json"
            }
        });

        console.log("API Response:", response.data);
        res.json(response.data);
    } catch (error) {
        console.error("🚨 BotD API Hatası:", error.response ? error.response.data : error.message);
        console.log("API Request Headers:", {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${FINGERPRINT_SECRET_KEY}`,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Accept": "application/json"
        });
        console.log("API Response Status:", error.response?.status);
        console.log("API Response Data:", error.response?.data);
        console.log("API Response Headers:", error.response?.headers);

        res.status(error.response?.status || 500).json({
            error: "BotD API çalıştırılamadı!",
            status: error.response?.status || 500,
            details: error.response ? error.response.data : error.message,
            headers: error.response?.headers || {}
        });
    }
});

const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
    console.log(`✅ BotD Test Sunucusu ${PORT} portunda çalışıyor.`);
});
