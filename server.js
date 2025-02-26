const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const FINGERPRINT_SECRET_KEY = process.env.FINGERPRINT_SECRET_KEY;
const ALLOWED_REQUEST_TIMESTAMP_DIFF_MS = 30 * 60 * 1000; // 30 minutes

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

app.post("/botd-test", async (req, res) => {
  const { requestId } = req.body;
  
  try {
    const eventResponse = await axios.get(`https://eu.api.fpjs.io/events/${requestId}`, {
      headers: {
        "Auth-API-Key": FINGERPRINT_SECRET_KEY,
        "Content-Type": "application/json"
      }
    });

    const { okay, error } = validateFingerprintResult(eventResponse.data, req);
    if (!okay) {
      return res.status(403).json({ error });
    }

    if (eventResponse.data.products?.botd?.data?.bot?.result === 'bad') {
      return res.status(403).json({ error: 'Malicious bot detected' });
    }

    res.json({ status: 'OK' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 6069;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
