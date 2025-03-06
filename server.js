const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint for bot detection verification
app.post('/api/bot-detection', (req, res) => {
  console.log('Bot detection data received:');
  console.log(JSON.stringify(req.body, null, 2));
  
  // In a real implementation, you would analyze the data here
  // For this demo, we'll just return a simple result based on some basic checks
  
  const data = req.body;
  let isHuman = true;
  const reasons = [];
  
  // Check for automation flags
  if (data.fingerprint && data.fingerprint.webgl) {
    const renderer = data.fingerprint.webgl.renderer || '';
    if (renderer.includes('SwiftShader') || renderer.includes('ANGLE') || 
        renderer.includes('VMware') || renderer.includes('llvmpipe')) {
      isHuman = false;
      reasons.push('Virtualized GPU detected');
    }
  }
  
  // Check for behavioral anomalies
  if (data.behavioral) {
    if (data.behavioral.mouseMovements && data.behavioral.mouseMovements.length < 5) {
      isHuman = false;
      reasons.push('Insufficient mouse movement');
    }
    
    if (data.behavioral.copyPasteCount > 3) {
      isHuman = false;
      reasons.push('Excessive copy-paste operations');
    }
  }
  
  // Return the result
  res.json({
    isHuman,
    reasons,
    timestamp: new Date().toISOString()
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Bot Detection test page available at http://localhost:${PORT}`);
});
