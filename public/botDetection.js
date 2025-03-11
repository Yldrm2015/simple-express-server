// Bot Detection System Implementation
class BotDetectionSystem {
  constructor(config = {}) {
    // Configuration options with default settings
    this.config = {
      // Network and connection controls
      networkControls: {
        blockKnownProxies: true,
        checkWebRTC: true,
        tcpFingerprintingStrict: true,
        checkConnectionSpeed: true
      },
  
     // Time and User Configuration
timeAndUserConfig: {
    currentDateTime: new Date().toISOString()
        .replace('T', ' ')
        .slice(0, 19),
    userLogin: "Yldrm2015",
    lastChecked: null,
    status: 'Not yet checked'
},
      
      // Behavioral thresholds for human-like interaction
      behavioralThresholds: {
        mouseMovementNaturalness: 0.6,
        scrollSpeedVariance: 0.4,
        keystrokeNaturalness: 0.7,
        interactionTimingVariance: 0.5,
        pageFocusRatio: 0.4,
        copyPasteCount: 5
      },
      
      // Fallback mechanisms for when JavaScript is disabled
fallbackMethods: {
  headerAnalysis: {
    enabled: true,
    strictMode: true,
    patterns: {
      knownBots: [
        'bot', 'crawler', 'spider', 'wget', 'curl',
        'postman', 'python-requests', 'ruby'
      ],
      suspiciousHeaders: [
        'x-requested-with', 'x-forwarded-for',
        'via', 'forwarded', 'true-client-ip'
      ],
      browserFingerprints: {
        accept: ['text/html', 'application/xhtml+xml'],
        acceptLanguage: true,
        acceptEncoding: true,
        connectionType: ['keep-alive', 'close']
      }
    },
    scoring: {
      inconsistentHeaders: -20,
      missingHeaders: -15,
      suspiciousPatterns: -25,
      knownBotSignature: -100
    }
  },
  ipAnalysis: {
    enabled: true,
    checkReputation: true,
    rateLimiting: {
      windowMs: 900000, // 15 minutes
      maxRequests: 100,
      blockDuration: 3600000 // 1 hour
    },
    geolocation: {
      enabled: true,
      suspiciousCountries: [''], // Add suspicious country codes
      vpnDetection: true
    },
    scoring: {
      blacklistedIP: -100,
      suspiciousCountry: -30,
      vpnDetected: -40,
      rateLimitExceeded: -50
    }
  },
  requestPatternAnalysis: {
    enabled: true,
    patterns: {
      timingAnalysis: true,
      requestOrder: true,
      resourceAccess: true
    },
    thresholds: {
      minRequestInterval: 100, // milliseconds
      maxConcurrent: 10,
      maxSessionRequests: 1000
    },
    scoring: {
      abnormalTiming: -20,
      suspiciousOrder: -25,
      resourceAbuse: -30
    }
  },
  sessionTracking: {
    enabled: true,
    secureCookie: true,
    httpOnly: true,
    sameSite: 'strict',
    sessionFeatures: {
      fingerprint: true,
      ipBinding: true,
      geoConsistency: true,
      deviceConsistency: true
    },
    scoring: {
      inconsistentSession: -40,
      invalidFingerprint: -30,
      locationMismatch: -35
    }
  }
},
    };

    // Server-side fallback detection methods
serverSideBotDetection() {
  let score = 100;
  const detectionResults = {
    headerAnalysis: this.analyzeRequestHeaders(),
    ipAnalysis: this.analyzeIPAddress(),
    requestPatterns: this.analyzeRequestPatterns(),
    sessionAnalysis: this.analyzeSession(),
    finalScore: 0,
    isBot: false,
    reasons: []
  };

  // Process header analysis results
  if (detectionResults.headerAnalysis.suspicious) {
    score += this.config.fallbackMethods.headerAnalysis.scoring.suspiciousPatterns;
    detectionResults.reasons.push('Suspicious headers detected');
  }

  // Process IP analysis results
  if (detectionResults.ipAnalysis.blacklisted) {
    score += this.config.fallbackMethods.ipAnalysis.scoring.blacklistedIP;
    detectionResults.reasons.push('IP blacklisted');
  }

  if (detectionResults.ipAnalysis.vpnDetected) {
    score += this.config.fallbackMethods.ipAnalysis.scoring.vpnDetected;
    detectionResults.reasons.push('VPN usage detected');
  }

  // Process request pattern results
  if (detectionResults.requestPatterns.abnormalTiming) {
    score += this.config.fallbackMethods.requestPatternAnalysis.scoring.abnormalTiming;
    detectionResults.reasons.push('Abnormal request timing');
  }

  // Process session analysis results
  if (detectionResults.sessionAnalysis.inconsistent) {
    score += this.config.fallbackMethods.sessionTracking.scoring.inconsistentSession;
    detectionResults.reasons.push('Inconsistent session detected');
  }

  detectionResults.finalScore = Math.max(0, Math.min(100, score));
  detectionResults.isBot = detectionResults.finalScore < 60;

  return detectionResults;
}

analyzeRequestHeaders() {
  const headers = this.getRequestHeaders();
  let suspicious = false;
  let reasons = [];

  // Check for known bot signatures
  if (this.config.fallbackMethods.headerAnalysis.patterns.knownBots.some(
    bot => headers['user-agent']?.toLowerCase().includes(bot)
  )) {
    suspicious = true;
    reasons.push('Known bot signature detected');
  }

  // Check for suspicious headers
  const suspiciousHeadersPresent = this.config.fallbackMethods.headerAnalysis.patterns.suspiciousHeaders
    .filter(header => headers[header]);
  
  if (suspiciousHeadersPresent.length > 0) {
    suspicious = true;
    reasons.push(`Suspicious headers present: ${suspiciousHeadersPresent.join(', ')}`);
  }

  return { suspicious, reasons };
}

analyzeIPAddress() {
  const ipData = {
    blacklisted: false,
    vpnDetected: false,
    reasons: []
  };

  // IP reputation check implementation
  if (this.config.fallbackMethods.ipAnalysis.checkReputation) {
    // Add your IP reputation check logic here
    // This should interface with your IP reputation database or service
  }

  // Rate limiting check
  const rateLimitData = this.checkRateLimit();
  if (rateLimitData.limited) {
    ipData.blacklisted = true;
    ipData.reasons.push('Rate limit exceeded');
  }

  return ipData;
}

analyzeRequestPatterns() {
  const patterns = {
    abnormalTiming: false,
    suspiciousOrder: false,
    reasons: []
  };

  if (this.config.fallbackMethods.requestPatternAnalysis.patterns.timingAnalysis) {
    // Implement request timing analysis
    const timingData = this.checkRequestTiming();
    patterns.abnormalTiming = timingData.abnormal;
    if (timingData.abnormal) {
      patterns.reasons.push('Abnormal request timing detected');
    }
  }

  return patterns;
}

analyzeSession() {
  const session = {
    inconsistent: false,
    reasons: []
  };

  if (this.config.fallbackMethods.sessionTracking.enabled) {
    // Implement session consistency checks
    const sessionData = this.validateSession();
    session.inconsistent = !sessionData.valid;
    if (!sessionData.valid) {
      session.reasons.push('Session validation failed');
    }
  }

  return session;
}

checkRateLimit() {
  const config = this.config.fallbackMethods.ipAnalysis.rateLimiting;
  const now = Date.now();
  const ipKey = this.getClientIP();
  
  if (!this._rateLimitData) {
    this._rateLimitData = new Map();
  }

  const userData = this._rateLimitData.get(ipKey) || {
    requests: [],
    blocked: false,
    blockExpires: 0
  };

  // Check if currently blocked
  if (userData.blocked && now < userData.blockExpires) {
    return { limited: true, remaining: 0, reset: userData.blockExpires };
  }

  // Clear expired block
  if (userData.blocked && now >= userData.blockExpires) {
    userData.blocked = false;
    userData.requests = [];
  }

  // Clean old requests
  userData.requests = userData.requests.filter(time => 
    now - time < config.windowMs
  );

  // Check rate limit
  if (userData.requests.length >= config.maxRequests) {
    userData.blocked = true;
    userData.blockExpires = now + config.blockDuration;
    this._rateLimitData.set(ipKey, userData);
    return { limited: true, remaining: 0, reset: userData.blockExpires };
  }

  // Add new request
  userData.requests.push(now);
  this._rateLimitData.set(ipKey, userData);

  return {
    limited: false,
    remaining: config.maxRequests - userData.requests.length,
    reset: now + config.windowMs
  };
}

    // Initialize detection mechanisms
    this.initializeBehavioralTracking();
    this.initializeFingerprinting();
    this.initializeNetworkControls();
    this.initializeCookieStorage();
  }

  // Behavioral Analysis Mechanisms
  initializeBehavioralTracking() {
    this.behavioralData = {
      mouseMovements: [],
      scrollEvents: [],
      keystrokePatterns: [],
      pageInteractions: [],
      pageFocusTime: 0,
      copyPasteCount: 0,
      lastActivity: Date.now()
    };

    // Mouse movement tracking
    document.addEventListener('mousemove', (e) => {
      this.trackMouseMovement(e);
    });

    // Scroll behavior tracking
    document.addEventListener('scroll', (e) => {
      this.trackScrollBehavior(e);
    });

    // Keystroke analysis
    document.addEventListener('keydown', (e) => {
      this.analyzeKeystrokes(e);
    });

    // Page focus and interaction tracking
    document.addEventListener('visibilitychange', () => {
      this.trackPageFocus();
    });

    // Click tracking
    document.addEventListener('click', (e) => {
      this.trackInteraction('click', e);
    });

    // Copy paste detection
    document.addEventListener('copy', () => {
      this.behavioralData.copyPasteCount++;
    });
    
    document.addEventListener('paste', () => {
      this.behavioralData.copyPasteCount++;
    });

    // Track page activity time
    setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.behavioralData.pageFocusTime += 1;
      }
    }, 1000);
  }

  trackMouseMovement(event) {
    const timestamp = Date.now();
    const movement = {
      x: event.clientX,
      y: event.clientY,
      timestamp
    };
    
    // Limit array size to prevent memory issues
    if (this.behavioralData.mouseMovements.length > 100) {
      this.behavioralData.mouseMovements.shift();
    }
    
    this.behavioralData.mouseMovements.push(movement);
    this.behavioralData.lastActivity = timestamp;

    // Analyze mouse movement naturalness
    return this.assessMouseMovementNaturalness();
  }

  trackScrollBehavior(event) {
    const timestamp = Date.now();
    const scrollData = {
      scrollY: window.scrollY,
      timestamp
    };
    
    // Limit array size
    if (this.behavioralData.scrollEvents.length > 50) {
      this.behavioralData.scrollEvents.shift();
    }
    
    this.behavioralData.scrollEvents.push(scrollData);
    this.behavioralData.lastActivity = timestamp;
    
    return this.assessScrollBehavior();
  }

  assessScrollBehavior() {
    const scrollEvents = this.behavioralData.scrollEvents;
    if (scrollEvents.length < 5) return true;

    // Calculate variance in scroll speeds
    let scrollSpeeds = [];
    for (let i = 1; i < scrollEvents.length; i++) {
      const timeDiff = scrollEvents[i].timestamp - scrollEvents[i-1].timestamp;
      const scrollDiff = Math.abs(scrollEvents[i].scrollY - scrollEvents[i-1].scrollY);
      
      if (timeDiff > 0) {
        scrollSpeeds.push(scrollDiff / timeDiff);
      }
    }

    if (scrollSpeeds.length < 3) return true;
    
    // Calculate variance
    const avgSpeed = scrollSpeeds.reduce((a, b) => a + b, 0) / scrollSpeeds.length;
    const variance = scrollSpeeds.reduce((a, b) => a + Math.pow(b - avgSpeed, 2), 0) / scrollSpeeds.length;
    const normalizedVariance = Math.min(variance / avgSpeed, 1);
    
    return normalizedVariance >= this.config.behavioralThresholds.scrollSpeedVariance;
  }

  assessMouseMovementNaturalness() {
    const movements = this.behavioralData.mouseMovements;
    if (movements.length < 10) return true; // Changed from returning movements.length / 10 to true for better initial user experience

    // Check for completely straight lines (bot indicator)
    let straightLineCount = 0;
    for (let i = 2; i < movements.length; i++) {
      const p1 = movements[i-2];
      const p2 = movements[i-1];
      const p3 = movements[i];
      
      // Calculate if three points form a straight line
      const slope1 = p1.x !== p2.x ? (p2.y - p1.y) / (p2.x - p1.x) : null;
      const slope2 = p2.x !== p3.x ? (p3.y - p2.y) / (p3.x - p2.x) : null;
      
      // If both slopes are null (vertical lines) or they're equal
      if ((slope1 === null && slope2 === null) || 
          (slope1 !== null && slope2 !== null && Math.abs(slope1 - slope2) < 0.01)) {
        straightLineCount++;
      }
    }
    
    const straightLineRatio = straightLineCount / (movements.length - 2);
    const naturalnessFactor = 1 - straightLineRatio;
    
    return naturalnessFactor >= this.config.behavioralThresholds.mouseMovementNaturalness;
  }

  analyzeKeystrokes(event) {
    const timestamp = Date.now();
    const keystroke = {
      key: event.key,
      keyCode: event.keyCode,
      timestamp,
      timeSinceLast: this.behavioralData.keystrokePatterns.length > 0 ? 
        timestamp - this.behavioralData.keystrokePatterns[this.behavioralData.keystrokePatterns.length - 1].timestamp : 0
    };
    
    // Limit array size
    if (this.behavioralData.keystrokePatterns.length > 50) {
      this.behavioralData.keystrokePatterns.shift();
    }
    
    this.behavioralData.keystrokePatterns.push(keystroke);
    this.behavioralData.lastActivity = timestamp;
    
    return this.assessKeystrokeNaturalness();
  }

  assessKeystrokeNaturalness() {
    const keystrokes = this.behavioralData.keystrokePatterns;
    if (keystrokes.length < 10) return true;
    
    // Check timing patterns of keystrokes
    let timings = keystrokes.map(k => k.timeSinceLast).filter(t => t > 0);
    if (timings.length < 5) return true;
    
    // Calculate variance in timing (humans have more variance)
    const avgTiming = timings.reduce((a, b) => a + b, 0) / timings.length;
    const variance = timings.reduce((a, b) => a + Math.pow(b - avgTiming, 2), 0) / timings.length;
    const normalizedVariance = Math.min(variance / avgTiming, 1);
    
    // Check for perfectly timed keystrokes (bot indicator)
    let perfectTimingCount = 0;
    for (let i = 1; i < timings.length; i++) {
      if (Math.abs(timings[i] - timings[i-1]) < 5) { // 5ms tolerance
        perfectTimingCount++;
      }
    }
    
    const perfectTimingRatio = perfectTimingCount / (timings.length - 1);
    const naturalnessFactor = (1 - perfectTimingRatio) * normalizedVariance;
    
    return naturalnessFactor >= this.config.behavioralThresholds.keystrokeNaturalness;
  }

  trackPageFocus() {
    const timestamp = Date.now();
    const focusEvent = {
      isVisible: document.visibilityState === 'visible',
      timestamp
    };
    
    this.behavioralData.pageInteractions.push(focusEvent);
    this.behavioralData.lastActivity = timestamp;
  }

  trackInteraction(type, event) {
    const timestamp = Date.now();
    const interaction = {
      type,
      x: event.clientX,
      y: event.clientY,
      timestamp,
      timeSinceLast: this.behavioralData.pageInteractions.length > 0 ? 
        timestamp - this.behavioralData.pageInteractions[this.behavioralData.pageInteractions.length - 1].timestamp : 0
    };
    
    // Limit array size
    if (this.behavioralData.pageInteractions.length > 50) {
      this.behavioralData.pageInteractions.shift();
    }
    
    this.behavioralData.pageInteractions.push(interaction);
    this.behavioralData.lastActivity = timestamp;
    
    return this.assessInteractionTiming();
  }

  assessInteractionTiming() {
    const interactions = this.behavioralData.pageInteractions;
    if (interactions.length < 5) return true;
    
    // Filter to only include clicks and other direct interactions
    const directInteractions = interactions.filter(i => i.type === 'click');
    if (directInteractions.length < 3) return true;
    
    // Calculate variance in timing between interactions
    let timings = directInteractions.map(i => i.timeSinceLast).filter(t => t > 0);
    if (timings.length < 2) return true; // Added to prevent division by zero
    
    const avgTiming = timings.reduce((a, b) => a + b, 0) / timings.length;
    const variance = timings.reduce((a, b) => a + Math.pow(b - avgTiming, 2), 0) / timings.length;
    const normalizedVariance = Math.min(variance / avgTiming, 1);
    
    return normalizedVariance >= this.config.behavioralThresholds.interactionTimingVariance;
  }

  assessCopyPasteActivity() {
    return this.behavioralData.copyPasteCount <= this.config.behavioralThresholds.copyPasteCount;
  }

  // Fingerprinting Mechanisms
  initializeFingerprinting() {
    try {
      this.fingerprintData = {
        webgl: this.captureWebGLFingerprint(),
        canvas: this.captureCanvasFingerprint(),
        audio: this.captureAudioFingerprint(),
        systemResources: this.captureSystemResources(),
        screenMetrics: this.captureScreenMetrics(),
        fonts: this.detectFonts(),
        plugins: this.detectPlugins()
      };
    } catch (error) {
      console.error('Error initializing fingerprinting:', error);
      this.fingerprintData = {
        webgl: null,
        canvas: null,
        audio: null,
        systemResources: null,
        screenMetrics: this.captureScreenMetrics(), // This should work in most cases
        fonts: [],
        plugins: []
      };
    }
  }

  captureWebGLFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return null;
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) return null;
      
      // Gather more detailed WebGL data
      return {
        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
        version: gl.getParameter(gl.VERSION),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        antialiasing: gl.getContextAttributes().antialias,
        extensions: gl.getSupportedExtensions(),
        maxAnisotropy: this.getMaxAnisotropy(gl)
      };
    } catch (error) {
      console.error('WebGL fingerprinting failed:', error);
      return null;
    }
  }

  getMaxAnisotropy(gl) {
    try {
      const ext = gl.getExtension('EXT_texture_filter_anisotropic') || 
                gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') || 
                gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
      return ext ? gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 0;
    } catch (e) {
      return 0;
    }
  }

  captureCanvasFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 240;
      canvas.height = 140;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      // Text with different characteristics
      const txt = 'BotDetection,Canvas.Fingerprint';
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      
      // Add some complexity to the canvas
      ctx.fillStyle = "#069";
      ctx.font = "15px Arial";
      ctx.fillText(txt, 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.font = "16px Georgia";
      ctx.fillText(txt, 4, 45);
      
      // Draw shapes
      ctx.fillRect(125, 50, 50, 30);
      ctx.beginPath();
      ctx.arc(50, 70, 25, 0, Math.PI * 2, true);
      ctx.fill();
      
      // Get the base64 representation
      return {
        dataURL: canvas.toDataURL(),
        pngDataURL: canvas.toDataURL('image/png'),
        webpDataURL: canvas.toDataURL('image/webp')
      };
    } catch (error) {
      console.error('Canvas fingerprinting failed:', error);
      return null;
    }
  }

  captureAudioFingerprint() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      const oscillator = audioCtx.createOscillator();
      const dynamicsCompressor = audioCtx.createDynamicsCompressor();
      
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(10000, audioCtx.currentTime);
      
      dynamicsCompressor.threshold.setValueAtTime(-50, audioCtx.currentTime);
      dynamicsCompressor.knee.setValueAtTime(40, audioCtx.currentTime);
      dynamicsCompressor.ratio.setValueAtTime(12, audioCtx.currentTime);
      dynamicsCompressor.attack.setValueAtTime(0, audioCtx.currentTime);
      dynamicsCompressor.release.setValueAtTime(0.25, audioCtx.currentTime);
      
      oscillator.connect(dynamicsCompressor);
      dynamicsCompressor.connect(analyser);
      analyser.connect(audioCtx.destination);
      
      oscillator.start(0);
      
      // Sample the audio buffer
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);
      
      // Do cleanup
      oscillator.stop(0);
      audioCtx.close();
      
      // Get a summary hash from the data
      const sum = dataArray.reduce((a, b) => a + b, 0);
      return {
        hash: sum.toString(16),
        sampleRate: audioCtx.sampleRate
      };
    } catch (error) {
      console.error('Audio fingerprinting failed:', error);
      return null;
    }
  }

  captureSystemResources() {
    try {
      // Memory info
      let memoryInfo = null;
      if (performance && performance.memory) {
        memoryInfo = {
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          usedJSHeapSize: performance.memory.usedJSHeapSize
        };
      }
      
      // CPU info - indirect
      const start = performance.now();
      let result = 0;
      for (let i = 0; i < 1000000; i++) {
        result += Math.sqrt(i);
      }
      const end = performance.now();
      const cpuPerformance = end - start;
      
      return {
        memoryInfo,
        cpuPerformance,
        hardwareConcurrency: navigator.hardwareConcurrency || null,
        deviceMemory: navigator.deviceMemory || null
      };
    } catch (error) {
      console.error('System resources fingerprinting failed:', error);
      return null;
    }
  }

  captureScreenMetrics() {
    try {
      return {
        width: window.screen.width,
        height: window.screen.height,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight,
        colorDepth: window.screen.colorDepth,
        pixelDepth: window.screen.pixelDepth,
        devicePixelRatio: window.devicePixelRatio || 1,
        orientation: window.screen.orientation ? window.screen.orientation.type : null
      };
    } catch (error) {
      console.error('Screen metrics capture failed:', error);
      return {
        width: 0,
        height: 0,
        availWidth: 0,
        availHeight: 0,
        colorDepth: 0,
        pixelDepth: 0,
        devicePixelRatio: 1,
        orientation: null
      };
    }
  }

  detectFonts() {
    try {
      // A simple font detection mechanism
      const baseFonts = ['monospace', 'sans-serif', 'serif'];
      const fontList = [
        'Arial', 'Arial Black', 'Arial Narrow', 'Calibri', 'Cambria', 'Cambria Math',
        'Comic Sans MS', 'Courier', 'Courier New', 'Georgia', 'Helvetica', 'Impact',
        'Lucida Console', 'Lucida Sans Unicode', 'Microsoft Sans Serif', 'Palatino Linotype',
        'Segoe UI', 'Tahoma', 'Times', 'Times New Roman', 'Trebuchet MS', 'Verdana'
      ];
      
      const testString = 'mmmmmmmmmmlli';
      const testSize = '72px';
      const h = document.createElement('div');
      
      h.style.position = 'absolute';
      h.style.left = '-9999px';
      h.style.visibility = 'hidden';
      
      const baseFontWidths = {};
      const detected = [];

      // Add the test div to the DOM
      document.body.appendChild(h);
      
      // Get width with base fonts
      for (let base of baseFonts) {
        h.style.fontFamily = base;
        h.style.fontSize = testSize;
        h.innerHTML = testString;
        baseFontWidths[base] = h.clientWidth;
      }
      
      // Check for each font
      for (let font of fontList) {
        let fontDetected = false;
        
        // Try with each base font
        for (let base of baseFonts) {
          h.style.fontFamily = `'${font}', ${base}`;
          h.style.fontSize = testSize;
          h.innerHTML = testString;
          
          // If width is different than base font, the font is available
          if (h.clientWidth !== baseFontWidths[base]) {
            fontDetected = true;
            break;
          }
        }
        
        if (fontDetected) {
          detected.push(font);
        }
      }
      
      // Cleanup
      document.body.removeChild(h);
      
      return detected;
    } catch (error) {
      console.error('Font detection failed:', error);
      return [];
    }
  }

  detectPlugins() {
    try {
      const plugins = [];
      
      if (navigator.plugins) {
        for (let i = 0; i < navigator.plugins.length; i++) {
          const plugin = navigator.plugins[i];
          const pluginInfo = {
            name: plugin.name,
            description: plugin.description,
            filename: plugin.filename,
            mimeTypes: []
          };
          
          // Get mime types
          for (let j = 0; j < plugin.length; j++) {
            const mime = plugin[j];
            pluginInfo.mimeTypes.push({
              type: mime.type,
              description: mime.description,
              suffixes: mime.suffixes
            });
          }
          
          plugins.push(pluginInfo);
        }
      }
      
      return plugins;
    } catch (error) {
      console.error('Plugin detection failed:', error);
      return [];
    }
  }

  // Network Controls
  initializeNetworkControls() {
    try {
      this.networkData = {
        ipAddress: null,
        connectionType: this.detectConnectionType(),
        webRTCData: this.config.networkControls.checkWebRTC ? this.checkWebRTC() : null,
        headersAnalyzed: false,
        tcpFingerprint: null
      };
    } catch (error) {
      console.error('Network controls initialization failed:', error);
      this.networkData = {
        ipAddress: null,
        connectionType: null,
        webRTCData: null,
        headersAnalyzed: false,
        tcpFingerprint: null
      };
    }
  }

  detectConnectionType() {
    try {
      const connection = navigator.connection || 
                      navigator.mozConnection || 
                      navigator.webkitConnection;
      
      if (connection) {
        return {
          type: connection.type,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        };
      }
      
      return null;
    } catch (error) {
      console.error('Connection type detection failed:', error);
      return null;
    }
  }

  checkWebRTC() {
    try {
      // WebRTC leak check - will only work in supported browsers
      const RTCPeerConnection = window.RTCPeerConnection || 
                              window.webkitRTCPeerConnection || 
                              window.mozRTCPeerConnection;
      
      if (!RTCPeerConnection) return null;
      
      const rtcData = {
        localIPs: [],
        publicIP: null
      };
      
      // Create dummy data channel
      const pc = new RTCPeerConnection({
        iceServers: [{urls: "stun:stun.l.google.com:19302"}]
      });
      pc.createDataChannel("");
      
      // Event handler for ICE candidate
      pc.onicecandidate = (ice) => {
        if (!ice || !ice.candidate || !ice.candidate.candidate) return;
        
        const candidateStr = ice.candidate.candidate;
        const ipMatch = /([0-9]{1,3}(\.[0-9]{1,3}){3})/g.exec(candidateStr);
        
        if (ipMatch && ipMatch.length > 1) {
          const ip = ipMatch[1];
          
          // Check if it's a local IP
          if (/^(192\.168\.|169\.254\.|10\.|172\.(1[6-9]|2\d|3[0-1]))/.test(ip)) {
            if (!rtcData.localIPs.includes(ip)) {
              rtcData.localIPs.push(ip);
            }
          } else {
            rtcData.publicIP = ip;
          }
        }
      };
      
      // Create offer and set local description
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch(err => console.error('WebRTC detection error:', err));
      
      // Set a timeout to clean up
      setTimeout(() => {
        try {
          pc.close();
        } catch (e) {}
      }, 5000);
      
      return rtcData;
    } catch (error) {
      console.error('WebRTC check failed:', error);
      return null;
    }
  }

  analyzeHeaders(headers) {
    // This would be called from server-side logic
    // Placeholder for header analysis (would work with backend)
    this.networkData.headersAnalyzed = true;
    return {
      userAgent: headers['user-agent'],
      acceptLanguage: headers['accept-language'],
      dnt: headers['dnt'],
      via: headers['via'],
      forwarded: headers['forwarded'],
      xForwardedFor: headers['x-forwarded-for'],
      cfConnectingIp: headers['cf-connecting-ip'],
      xRealIp: headers['x-real-ip'],
      hasProxyHeaders: !!(headers['via'] || headers['x-forwarded-for'] || headers['forwarded'])
    };
  }

  // Cookie and Storage Management
  initializeCookieStorage() {
    try {
      this.storageData = {
        fingerprint: null,
        sessionId: this.generateSessionId(),
        storedData: this.retrieveStoredData()
      };
      
      // Set or update cookies
      this.updateStoredData();
    } catch (error) {
      console.error('Cookie storage initialization failed:', error);
      this.storageData = {
        fingerprint: null,
        sessionId: this.generateSessionId(),
        storedData: {}
      };
    }
  }

  generateSessionId() {
    // Generate a random session ID
    return Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  retrieveStoredData() {
    // Try to retrieve data from localStorage and cookies
    let storedData = {};
    
    try {
      // Check localStorage for fingerprint data
      const localData = localStorage.getItem('bot_detection_data');
      if (localData) {
        storedData.localStorage = JSON.parse(localData);
      }
      
      // Check cookies
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'bot_detection_session') {
          storedData.cookie = decodeURIComponent(value);
        }
      }
    } catch (error) {
      console.error('Error retrieving stored data:', error);
    }
    
    return storedData;
  }

  updateStoredData() {
    try {
      // Create a fingerprint from our collected data
      const fingerprintData = {
        canvas: this.fingerprintData.canvas ? this.fingerprintData.canvas.dataURL.substr(0, 32) : null,
        webgl: this.fingerprintData.webgl ? this.fingerprintData.webgl.renderer : null,
        audio: this.fingerprintData.audio ? this.fingerprintData.audio.hash : null,
        screen: `${this.fingerprintData.screenMetrics.width}x${this.fingerprintData.screenMetrics.height}x${this.fingerprintData.screenMetrics.colorDepth}`,
        timezone: new Date().getTimezoneOffset(),
        language: navigator.language
      };
      
      // Create a hash from the data
      let fingerprintString = JSON.stringify(fingerprintData);
      let hash = 0;
      for (let i = 0; i < fingerprintString.length; i++) {
        hash = ((hash << 5) - hash) + fingerprintString.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }
      
      this.storageData.fingerprint = hash.toString(16);
      
      // Store in localStorage
      localStorage.setItem('bot_detection_data', JSON.stringify({
        fingerprint: this.storageData.fingerprint,
        firstSeen: this.storageData.storedData.localStorage ? 
          this.storageData.storedData.localStorage.firstSeen : Date.now(),
        lastSeen: Date.now()
      }));
      
      // Set cookies
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + 7); // 7 day expiry
      document.cookie = `bot_detection_session=${encodeURIComponent(this.storageData.sessionId)};expires=${expireDate.toUTCString()};path=/`;
    } catch (error) {
      console.error('Error storing data:', error);
    }
  }

  // Main Detection Method
  async detectBot() {
    try {
      // Check if JavaScript is enabled
      if (typeof window === 'undefined' || !window.localStorage) {
        // JavaScript is disabled, use server-side detection
        return this.serverSideBotDetection();
      }

      // Collect all detection signals (mevcut kodunuz devam ediyor)
      const activityTime = this.behavioralData.pageFocusTime;
      const inactiveTime = Date.now() - this.behavioralData.lastActivity;
      
    // Check for behavior anomalies
const behavioralSignals = {
  mouseMovementNatural: this.assessMouseMovementNaturalness(),
  scrollBehaviorNatural: this.assessScrollBehavior(),
  keystrokePatternNatural: this.assessKeystrokeNaturalness(),
  interactionTimingNatural: this.assessInteractionTiming(),
  copyPasteActivityNormal: this.assessCopyPasteActivity(),
  pageFocusRatioAcceptable: activityTime > 0 ? 
    (activityTime * 1000 / (activityTime * 1000 + inactiveTime)) > this.config.behavioralThresholds.pageFocusRatio : true
};

// Network anomalies
const networkSignals = {
  usingProxy: this.networkData.webRTCData ? 
    this.networkData.webRTCData.localIPs.length === 0 && !this.networkData.webRTCData.publicIP : false,
  connectionSpeedConsistent: this.config.networkControls.checkConnectionSpeed ? 
    this.checkConnectionSpeed() : true
};

// Fingerprinting anomalies
const fingerprintSignals = {
  hasCanvas: !!this.fingerprintData.canvas,
  hasWebGL: !!this.fingerprintData.webgl,
  hasAudio: !!this.fingerprintData.audio,
  hasConsistentFingerprint: this.storageData.storedData.localStorage ? 
    this.storageData.fingerprint === this.storageData.storedData.localStorage.fingerprint : true
};

// Calculate bot probability based on signals
const negativeSignals = [
  !behavioralSignals.mouseMovementNatural,
  !behavioralSignals.scrollBehaviorNatural,
  !behavioralSignals.keystrokePatternNatural,
  !behavioralSignals.interactionTimingNatural,
  !behavioralSignals.copyPasteActivityNormal,
  !behavioralSignals.pageFocusRatioAcceptable,
  networkSignals.usingProxy,
  !networkSignals.connectionSpeedConsistent,
  !fingerprintSignals.hasCanvas,
  !fingerprintSignals.hasWebGL,
  !fingerprintSignals.hasAudio,
  !fingerprintSignals.hasConsistentFingerprint
].filter(signal => signal).length;

// Calculate percentage chance that this is a bot
const totalSignals = 12; // Total number of signals we're checking
const botProbability = (negativeSignals / totalSignals) * 100;

// Determine if this is a bot based on threshold
const isBotLikely = botProbability > 50; // You can adjust this threshold

// Additional verification if needed
let verificationRequired = false;
if (botProbability > 30 && botProbability <= 50) {
  verificationRequired = true;
}

return {
  isBotLikely,
  botProbability,
  verificationRequired,
  signals: {
    behavioral: behavioralSignals,
    network: networkSignals,
    fingerprint: fingerprintSignals
  },
  timestamp: Date.now(),
  sessionId: this.storageData.sessionId
};
} catch (error) {
  console.error('Bot detection error:', error);
  return {
    isBotLikely: false,
    botProbability: 0,
    verificationRequired: true,
    error: error.message,
    timestamp: Date.now()
  };
}
}

checkConnectionSpeed() {
  // Simple check based on reported connection data
  const connection = navigator.connection || 
                    navigator.mozConnection || 
                    navigator.webkitConnection;
  
  if (!connection || typeof connection.downlink !== 'number') {
    return true; // Can't determine, assume it's okay
  }
  
  // Check if connection speed is suspiciously consistent over time
  if (!this._lastConnectionChecks) {
    this._lastConnectionChecks = [];
  }
  
  this._lastConnectionChecks.push({
    downlink: connection.downlink,
    rtt: connection.rtt,
    time: Date.now()
  });
  
  // Limit array size
  if (this._lastConnectionChecks.length > 10) {
    this._lastConnectionChecks.shift();
  }
  
  // Check for consistent values (which might indicate spoofing)
  if (this._lastConnectionChecks.length >= 3) {
    const allSameDownlink = this._lastConnectionChecks.every(check => 
      check.downlink === this._lastConnectionChecks[0].downlink);
    const allSameRtt = this._lastConnectionChecks.every(check => 
      check.rtt === this._lastConnectionChecks[0].rtt);
    
    // If both metrics are suspiciously consistent across checks
    if (allSameDownlink && allSameRtt) {
      return false;
    }
  }
  
  return true;
}

// Verification Methods
requestCaptchaVerification() {
  // Implementation depends on your CAPTCHA provider
  // This is a placeholder
  console.log('CAPTCHA verification would be triggered here');
  return new Promise((resolve) => {
    // Simulate CAPTCHA verification
    setTimeout(() => {
      resolve({
        success: true,
        score: 0.9
      });
    }, 1500);
  });
}

// Integration Methods
async evaluateSession() {
  // First, check if we have enough data to make a decision
  if (this.behavioralData.mouseMovements.length < 10 &&
      this.behavioralData.keystrokePatterns.length < 10 &&
      this.behavioralData.scrollEvents.length < 5) {
    return {
      status: 'insufficient_data',
      confidence: 0,
      message: 'Not enough user interaction data collected yet'
    };
  }
  
  // Get full bot detection results
  const detectionResult = await this.detectBot();
  
  // If high confidence this is a bot
  if (detectionResult.isBotLikely) {
    // You could trigger additional verification here
    if (this.config.fallbackMethods.captchaVerification) {
      const captchaResult = await this.requestCaptchaVerification();
      
      // If CAPTCHA was solved successfully and with high score, override the bot detection
      if (captchaResult.success && captchaResult.score > 0.7) {
        return {
          status: 'human_verified',
          confidence: captchaResult.score,
          message: 'User verified via CAPTCHA'
        };
      }
    }
    
    return {
      status: 'likely_bot',
      confidence: detectionResult.botProbability / 100,
      signals: detectionResult.signals,
      message: 'User behavior indicates automated interaction'
    };
  }
  
  // If verification is recommended but not certain it's a bot
  if (detectionResult.verificationRequired) {
    return {
      status: 'verification_recommended',
      confidence: detectionResult.botProbability / 100,
      signals: detectionResult.signals,
      message: 'Some unusual behaviors detected, verification recommended'
    };
  }
  
  // Otherwise, likely a human
  return {
    status: 'likely_human',
    confidence: 1 - (detectionResult.botProbability / 100),
    signals: detectionResult.signals,
    message: 'User behavior consistent with human interaction'
  };
}

// Method for external systems to get current status
getDetectionStatus() {
  return {
    sessionActive: !!this.storageData.sessionId,
    dataPoints: {
      mouseMovements: this.behavioralData.mouseMovements.length,
      keystrokes: this.behavioralData.keystrokePatterns.length,
      scrollEvents: this.behavioralData.scrollEvents.length,
      interactions: this.behavioralData.pageInteractions.length
    },
    activityTime: this.behavioralData.pageFocusTime,
    fingerprintAvailable: !!this.storageData.fingerprint
  };
}
}

// Example initialization for index.html
document.addEventListener('DOMContentLoaded', function() {
  // Initialize the bot detection system
  const botDetector = new BotDetectionSystem({
    // Custom configuration if needed
    behavioralThresholds: {
      mouseMovementNaturalness: 0.5, // More lenient
      pageFocusRatio: 0.3 // More lenient
    }
  });
  
  // Periodically evaluate session
  setInterval(async function() {
    const result = await botDetector.evaluateSession();
    console.log('Bot detection status:', result);
    
    // If it's likely a bot, you might want to take action
    if (result.status === 'likely_bot') {
      console.warn('Bot detected with confidence:', result.confidence);
      // Implement your action here (log event, show CAPTCHA, etc.)
    }
  }, 10000); // Check every 10 seconds
  
  // Add status display element if desired
  const statusElement = document.createElement('div');
  statusElement.style.position = 'fixed';
  statusElement.style.bottom = '10px';
  statusElement.style.right = '10px';
  statusElement.style.padding = '10px';
  statusElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  statusElement.style.color = 'white';
  statusElement.style.borderRadius = '5px';
  statusElement.style.fontSize = '12px';
  statusElement.style.fontFamily = 'monospace';
  statusElement.style.zIndex = '9999';
  document.body.appendChild(statusElement);
  
  // Update status display
  setInterval(function() {
    const status = botDetector.getDetectionStatus();
    statusElement.innerHTML = `
      <div>Bot Detection Status:</div>
      <div>Mouse events: ${status.dataPoints.mouseMovements}</div>
      <div>Key events: ${status.dataPoints.keystrokes}</div>
      <div>Scroll events: ${status.dataPoints.scrollEvents}</div>
      <div>Activity time: ${status.activityTime}s</div>
    `;
  }, 2000); // Update every 2 seconds
});
