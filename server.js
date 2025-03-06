const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow inline scripts for the bot detection system
      connectSrc: ["'self'", "https://api.ipify.org"], // Allow connection to IP API
      imgSrc: ["'self'", "data:"], // Allow data URIs for test images
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));
app.use(compression());
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint for bot detection verification
app.post('/api/bot-detection', (req, res) => {
  // Get data from request
  const { fingerprint, behavioral, network, storage, headers } = req.body;
  
  // Log detection data for debugging
  console.log('Bot detection verification requested:', {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString()
  });
  
  // Implement server-side verification logic
  // This is a simplified example - in production, you would have more sophisticated checks
  
  // Check for obvious bot indicators
  const isBotUserAgent = /bot|crawl|spider|headless|scrape|selenium|puppeteer/i.test(headers.userAgent);
  
  // Check browser fingerprint consistency
  const hasValidFingerprint = fingerprint && fingerprint.canvas && fingerprint.webgl;
  
  // Check behavioral patterns
  const hasNaturalBehavior = behavioral && 
                           behavioral.mouseMovements && 
                           behavioral.mouseMovements.length > 10 &&
                           behavioral.scrollEvents &&
                           behavioral.scrollEvents.length > 5;
  
  // Make determination based on checks
  const isHuman = !isBotUserAgent && hasValidFingerprint && hasNaturalBehavior;
  
  // Send response
  res.json({
    isHuman,
    timestamp: new Date().toISOString(),
    // Include reasons for detection (only in development)
    reasons: process.env.NODE_ENV === 'development' ? {
      userAgent: !isBotUserAgent,
      fingerprint: hasValidFingerprint,
      behavior: hasNaturalBehavior
    } : undefined
  });
});

// Serve main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
