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
        headerAnalysis: true,
        ipBlacklist: true,
        captchaVerification: true,
        sessionTracking: true
      },
      ...config
    };

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
    if (movements.length < 10) return movements.length / 10;

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
    this.fingerprintData = {
      webgl: this.captureWebGLFingerprint(),
      canvas: this.captureCanvasFingerprint(),
      audio: this.captureAudioFingerprint(),
      systemResources: this.captureSystemResources(),
      screenMetrics: this.captureScreenMetrics(),
      fonts: this.detectFonts(),
      plugins: this.detectPlugins()
    };
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
      const memoryInfo = performance && performance.memory ? {
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        usedJSHeapSize: performance.memory.usedJSHeapSize
      } : null;
      
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
  }

  detectFonts() {
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
    
  // cleanup
document.body.removeChild(h);

return detected;
}

detectPlugins() {
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
}

// Network Controls
initializeNetworkControls() {
  this.networkData = {
    ipAddress: null,
    connectionType: this.detectConnectionType(),
    webRTCData: this.config.networkControls.checkWebRTC ? this.checkWebRTC() : null,
    headersAnalyzed: false,
    tcpFingerprint: null
  };
}

detectConnectionType() {
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
}

checkWebRTC() {
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
  this.storageData = {
    fingerprint: null,
    sessionId: this.generateSessionId(),
    storedData: this.retrieveStoredData()
  };
  
  // Set or update cookies
  this.updateStoredData();
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
  try {
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
  // Collect all detection signals
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
      (activityTime * 1000 / (activityTime * 1000 + inactiveTime)) > this.config.behavioralThresholds.pageFocusRatio : false
  };
  
  // Calculate behavioral score
  const behavioralScore = Object.values(behavioralSignals)
    .reduce((score, signal) => score + (signal ? 1 : 0), 0) / Object.keys(behavioralSignals).length;
  
  // Check for fingerprinting anomalies
  const fingerprintSignals = {
    webglDataConsistent: !!this.fingerprintData.webgl,
    canvasDataConsistent: !!this.fingerprintData.canvas,
    audioDataConsistent: !!this.fingerprintData.audio,
    systemResourcesConsistent: !!this.fingerprintData.systemResources,
    foundExpectedFonts: this.fingerprintData.fonts.length > 5,
    screenMetricsNormal: this.fingerprintData.screenMetrics.width > 0 && this.fingerprintData.screenMetrics.height > 0
  };
  
  // Calculate fingerprint score
  const fingerprintScore = Object.values(fingerprintSignals)
    .reduce((score, signal) => score + (signal ? 1 : 0), 0) / Object.keys(fingerprintSignals).length;
  
  // Network-related checks
  const networkSignals = {
    notUsingProxy: this.config.networkControls.blockKnownProxies ? 
      !(this.networkData.webRTCData && this.networkData.webRTCData.localIPs.length === 0) : true,
    connectionTypeNormal: this.networkData.connectionType ? 
      (this.networkData.connectionType.type !== 'none' && this.networkData.connectionType.effectiveType !== 'slow-2g') : true
  };
  
  // Calculate network score
  const networkScore = Object.values(networkSignals)
    .reduce((score, signal) => score + (signal ? 1 : 0), 0) / Object.keys(networkSignals).length;
  
  // Weight the different scores
  const weightedScore = (behavioralScore * 0.6) + (fingerprintScore * 0.3) + (networkScore * 0.1);
  
  // Determine if it's a bot
  const isHuman = weightedScore >= 0.7;
  
  // Return detailed results
  return {
    isHuman,
    score: weightedScore,
    details: {
      behavioralScore: behavioralScore.toFixed(2),
      fingerprintScore: fingerprintScore.toFixed(2),
      networkScore: networkScore.toFixed(2),
      mouseMovements: this.behavioralData.mouseMovements.length,
      keystrokes: this.behavioralData.keystrokePatterns.length,
      interactionCount: this.behavioralData.pageInteractions.length,
      activityTime: activityTime + 's',
      lastActivity: new Date(this.behavioralData.lastActivity).toLocaleTimeString()
    },
    raw: {
      behavioral: behavioralSignals,
      fingerprint: fingerprintSignals,
      network: networkSignals
    }
  };
}

// Utility methods for challenge-response mechanisms
generateChallenge() {
  // Generate a complex challenge that's hard for bots to solve
  const challenge = {
    type: Math.random() > 0.5 ? 'captcha' : 'puzzle',
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now()
  };

  if (challenge.type === 'captcha') {
    // Generate a simple text-based CAPTCHA
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let captchaText = '';
    for (let i = 0; i < 6; i++) {
      captchaText += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    challenge.captchaText = captchaText;
    challenge.distortionLevel = Math.random() * 0.5 + 0.25; // 0.25 to 0.75
  } else {
    // Generate a simple puzzle
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    const operation = Math.random() > 0.5 ? '+' : '-';
    challenge.puzzle = `${a} ${operation} ${b}`;
    challenge.answer = operation === '+' ? a + b : a - b;
  }

  return challenge;
}

verifyChallenge(challenge, response) {
  if (!challenge || !response) return false;

  // Verify the challenge response
  if (challenge.type === 'captcha') {
    return response.toLowerCase() === challenge.captchaText.toLowerCase();
  } else if (challenge.type === 'puzzle') {
    return parseInt(response) === challenge.answer;
  }

  return false;
}

// Method to export detection data for logging/analytics
exportDetectionData() {
  return {
    timestamp: Date.now(),
    sessionId: this.storageData.sessionId,
    fingerprint: this.storageData.fingerprint,
    behavioral: {
      mouseMovements: this.behavioralData.mouseMovements.length,
      scrollEvents: this.behavioralData.scrollEvents.length,
      keystrokes: this.behavioralData.keystrokePatterns.length,
      interactions: this.behavioralData.pageInteractions.length,
      activityTime: this.behavioralData.pageFocusTime,
      copyPaste: this.behavioralData.copyPasteCount
    },
    fingerprinting: {
      webgl: this.fingerprintData.webgl ? true : false,
      canvas: this.fingerprintData.canvas ? true : false,
      audio: this.fingerprintData.audio ? true : false,
      fonts: this.fingerprintData.fonts.length,
      screenWidth: this.fingerprintData.screenMetrics.width,
      screenHeight: this.fingerprintData.screenMetrics.height
    },
    network: {
      connectionType: this.networkData.connectionType ? this.networkData.connectionType.type : null,
      webRTC: this.networkData.webRTCData ? true : false
    }
  };
}

// Initialize bot detection system
function initBotDetection(config = {}) {
  return new BotDetectionSystem(config);
}
