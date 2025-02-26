const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const path = require("path");
const NodeCache = require("node-cache");
let parseIp;

dotenv.config();

try {
  parseIp = require("./utils").parseIp;
} catch (err) {
  console.warn("⚠️ Warning: utils.js dosyası bulunamadı, parseIp fonksiyonu devre dışı.");
  parseIp = (req) => req.headers["x-forwarded-for"]?.split(",").shift() || req.socket.remoteAddress;
}

const app = express();
const requestIdDatabase = new NodeCache({ stdTTL: 300 }); // Request ID caching to prevent replay attacks
app.use(cors({
  origin: process.env.NODE_ENV === "production" ? "https://yourwebsite.com" : true,
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const FINGERPRINT_SECRET_KEY = process.env.FINGERPRINT_SECRET_KEY;
const API_ENDPOINT = "https://eu.api.fpjs.io/events/";
const ALLOWED_REQUEST_TIMESTAMP_DIFF_MS = 3000;
const ALLOWED_ORIGIN = "https://yourwebsite.com";
const NODE_ENV = process.env.NODE_ENV || "development";
const MIN_CONFIDENCE_SCORE = 0.6;

console.log("✅ Sunucu başlatıldı, ortam:", NODE_ENV);

async function validateFingerprintResult(requestId, request) {
  if (requestIdDatabase.has(requestId)) {
    return { success: false, error: "Already processed this request ID, potential replay attack" };
  }
  
  let attempts = 3;
  while (attempts > 0) {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const response = await axios.get(`${API_ENDPOINT}${requestId}`, {
        headers: {
          "Auth-API-Key": FINGERPRINT_SECRET_KEY,
          Accept: "application/json",
        },
      });

      const identificationEvent = response.data;
      const identification = identificationEvent.products?.identification?.data;
      if (!identification) {
        return { success: false, error: "Identification event not found, potential spoofing attack." };
      }

      if (Date.now() - Number(new Date(identification.time)) > ALLOWED_REQUEST_TIMESTAMP_DIFF_MS) {
        return { success: false, error: "Old identification request, potential replay attack." };
      }

      const identificationOrigin = new URL(identification.url).origin;
      const requestOrigin = request.headers.origin;
      if (
        identificationOrigin !== requestOrigin ||
        identificationOrigin !== ALLOWED_ORIGIN ||
        requestOrigin !== ALLOWED_ORIGIN
      ) {
        return { success: false, error: "Unexpected origin, potential replay attack." };
      }

      const identificationIp = identification.ip;
      const requestIp = parseIp(request);
      if (identificationIp !== requestIp) {
        return { success: false, error: "Unexpected IP address, potential replay attack." };
      }

      if (identification.confidence.score < MIN_CONFIDENCE_SCORE) {
        return { success: false, error: "Low confidence score, action requires 2FA." };
      }

      requestIdDatabase.set(requestId, true);
      return { success: true, identificationEvent };
    } catch (error) {
      if (error.response?.status === 400 && error.response.data?.code === "StateNotReady") {
        console.warn("StateNotReady detected, retrying...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts--;
      } else {
        switch (error.response?.status) {
          case 403:
            return { success: false, error: "Access forbidden - check your API permissions" };
          case 404:
            return { success: false, error: "Request ID not found" };
          case 429:
            return { success: false, error: "Too many requests" };
          case 400:
            return { success: false, error: "Bad request" };
          default:
            return { success: false, error: "API error", details: error.response?.data || error.message };
        }
      }
    }
  }
  return { success: false, error: "StateNotReady retries exceeded, request failed." };
}

app.post("/botd-test", async (req, res) => {
  const { requestId } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: "Request ID eksik! Lütfen client-side identification gerçekleştirin." });
  }

  const validationResult = await validateFingerprintResult(requestId, req);
  if (!validationResult.success) {
    return res.status(403).json({ error: validationResult.error });
  }

  const identificationEvent = validationResult.identificationEvent;

  if (identificationEvent.products?.botd?.data?.bot?.result === "bad") {
    return res.status(403).json({ error: "Malicious bot detected." });
  }
  if (identificationEvent.products?.vpn?.data?.result === true) {
    return res.status(403).json({ error: "VPN network detected." });
  }
  if (identificationEvent.products?.tor?.data?.result === true) {
    return res.status(403).json({ error: "Tor network detected." });
  }
  if (identificationEvent.products?.tampering?.data?.result === true) {
    return res.status(403).json({ error: "Browser tampering detected." });
  }

  res.json({ status: "OK" });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
  console.log(`✅ BotD Test Sunucusu ${PORT} portunda çalışıyor.`);
});
