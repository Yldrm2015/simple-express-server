const express = require('express');
const axios = require('axios');
const fetch = require('node-fetch');
const { parseIp } = require('./utils');
const { FINGERPRINT_SECRET_KEY, ALLOWED_REQUEST_TIMESTAMP_DIFF_MS } = require('./config');

const app = express();
app.use(express.json());

function validateFingerprintResult(identificationEvent, request) {
  const identification = identificationEvent.products?.identification?.data;

  if (!identification) {
    return { okay: false, error: 'Identification event not found, potential spoofing attack.' };
  }

  if (Date.now() - Number(new Date(identification.time)) > ALLOWED_REQUEST_TIMESTAMP_DIFF_MS) {
    return { okay: false, error: 'Old identification request, potential replay attack.' };
  }

  return { okay: true };
}

app.post("/api/survey", async (req, res) => {
  const { requestId } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: "Request ID missing" });
  }

  try {
    const identificationEvent = await (
      await fetch(`https://eu.api.fpjs.io/events/${requestId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Auth-API-Key': FINGERPRINT_SECRET_KEY,
        },
      })
    ).json();

    const { okay, error } = validateFingerprintResult(identificationEvent, req);
    if (!okay) {
      return res.status(403).json({ error });
    }

    if (identificationEvent.products?.botd?.data?.bot?.result === 'bad') {
      return res.status(403).json({ error: 'Malicious bot detected.' });
    }

    if (identificationEvent.products?.vpn?.data?.result === true) {
      return res.status(403).json({ error: 'VPN network detected.' });
    }

    res.json({ status: 'OK' });
  } catch (error) {
    console.error("❌ API Hatası:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
