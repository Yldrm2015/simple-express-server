class BotDetectionSystem {
  constructor(config = {}) {
    // Configuration options with default settings
    this.config = {
      // Behavioral analysis thresholds
      behavioralThresholds: {
        mouseMovementNaturalness: 0.7,
        scrollSpeedVariance: 0.5,
        keystrokeNaturalness: 0.8,
        interactionTimingVariance: 0.6,
        pageFocusRatio: 0.5,
        copyPasteCount: 3 // Max allowed copy-paste actions
      },
      
      // Network and connection controls
      networkControls: {
        blockKnownProxies: true,
        checkWebRTC: true,
        tcpFingerprintingStrict: true,
        checkConnectionSpeed: true
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
    if (movements.length < 10) return true;

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
    const h = document.getElementsByTagName('body')[0];
    
    const s = document.createElement('span');
    s.style.fontSize = testSize;
    s.innerHTML = testString;
    const defaultWidth = {};
    const defaultHeight = {};
    
    for (const font of baseFonts) {
      s.style.fontFamily = font;
      h.appendChild(s);
      defaultWidth[font] = s.offsetWidth;
      defaultHeight[font] = s.offsetHeight;
      h.removeChild(s);
    }
    
    const result = [];
    for (const font of fontList) {
      let detected = false;
      for (const baseFont of baseFonts) {
        s.style.fontFamily = font + ', ' + baseFont;
        h.appendChild(s);
        const matched = (s.offsetWidth !== defaultWidth[baseFont] || 
                         s.offsetHeight !== defaultHeight[baseFont]);
        h.removeChild(s);
        if (matched) {
          detected = true;
          break;
        }
      }
      if (detected) {
        result.push(font);
      }
    }
    
    return result;
  }

  detectPlugins() {
    if (!navigator.plugins) return [];
    
    const pluginArray = [];
    for (let i = 0; i < navigator.plugins.length; i++) {
      const plugin = navigator.plugins[i];
      const pluginInfo = {
        name: plugin.name,
        description: plugin.description,
        filename: plugin.filename
      };
      pluginArray.push(pluginInfo);
    }
    
    return pluginArray;
  }

  // Network and Connection Controls
  initializeNetworkControls() {
    this.networkData = {
      ipAddress: null,
      connectionType: this.detectConnectionType(),
      webRTCLeaks: [],
      tcpInfo: null
    };

    this.detectIPAddress();
    if (this.config.networkControls.checkWebRTC) {
      this.checkWebRTCLeaks();
    }
    this.checkConnectionSpeed();
  }

  detectConnectionType() {
    const connection = navigator.connection || 
                      navigator.mozConnection || 
                      navigator.webkitConnection;
    
    if (connection) {
      return {
        type: connection.type,
        effectiveType: connection.effectiveType,
        downlinkMax: connection.downlinkMax,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
    
    return null;
  }

  detectIPAddress() {
    // In a real implementation, this would use a proper service
    fetch('https://api.ipify.org?format=json')
      .then(response => response.json())
      .then(data => {
        this.networkData.ipAddress = data.ip;
        this.checkIPBlacklist(data.ip);
      })
      .catch(error => {
        console.error('IP detection failed:', error);
      });
  }

  checkIPBlacklist(ip) {
    if (!ip) return true;
    
    // Implement IP blacklist checking logic
    const blacklistedIPs = [
      // List of known bot/spam IPs would go here
      '123.456.78.90', // Example: Not a real IP
    ];
    
    // Check against VPN/Proxy ranges (this would be more comprehensive in production)
    const knownProxyRanges = [
      // Examples, not real ranges
      {start: '101.0.0.0', end: '101.255.255.255'},
    ];
    
    // Direct match check
    if (blacklistedIPs.includes(ip)) {
      return false;
    }
    
    // Range check (simplified)
    if (this.config.networkControls.blockKnownProxies) {
      const ipNum = this.ipToNumber(ip);
      for (const range of knownProxyRanges) {
        const startNum = this.ipToNumber(range.start);
        const endNum = this.ipToNumber(range.end);
        if (ipNum >= startNum && ipNum <= endNum) {
          return false;
        }
      }
    }
    
    return true;
  }

  ipToNumber(ip) {
    return ip.split('.')
      .map((octet, index, array) => parseInt(octet) * Math.pow(256, array.length - index - 1))
      .reduce((sum, num) => sum + num, 0);
  }

  checkWebRTCLeaks() {
    // This is a simplified version - full implementation would be more complex
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      });
      
      pc.createDataChannel("");
      
      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        
        const candidate = event.candidate.candidate;
        if (candidate && candidate.includes('typ host')) {
          const matches = candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/g);
          if (matches) {
            this.networkData.webRTCLeaks = [...this.networkData.webRTCLeaks, ...matches];
          }
        }
        
        // Close connection after getting candidates
        pc.close();
      };
      
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch(err => console.error('WebRTC check failed:', err));
    } catch (error) {
      console.error('WebRTC leak detection failed:', error);
    }
  }

  checkConnectionSpeed() {
    if (!this.config.networkControls.checkConnectionSpeed) return;
    
    const start = Date.now();
    const testImage = new Image();
    testImage.onload = () => {
      const end = Date.now();
      const duration = end - start;
      this.networkData.connectionSpeed = {
        duration,
        kbps: (125 / duration) * 1000 // Rough approximation (5kb test image)
      };
    };
    
    // Use a small test image (can be replaced with a proper one for production)
    testImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  }

  // Cookie and Storage Controls
  initializeCookieStorage() {
    this.storageData = {
      cookieEnabled: navigator.cookieEnabled,
      localStorage: this.checkLocalStorage(),
      sessionStorage: this.checkSessionStorage(),
      firstVisit: this.checkFirstVisit()
    };
  }

  checkLocalStorage() {
    try {
      const testKey = '_bot_detection_test';
      localStorage.setItem(testKey, '1');
      const value = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      return value === '1';
    } catch (e) {
      return false;
    }
  }

  checkSessionStorage() {
    try {
      const testKey = '_bot_detection_test';
      sessionStorage.setItem(testKey, '1');
      const value = sessionStorage.getItem(testKey);
      sessionStorage.removeItem(testKey);
      return value === '1';
    } catch (e) {
      return false;
    }
  }

  checkFirstVisit() {
    try {
      const visitKey = '_bot_detection_visited';
      const previousVisit = localStorage.getItem(visitKey);
      
      if (!previousVisit) {
        // First visit - set a timestamp
        localStorage.setItem(visitKey, Date.now().toString());
        return true;
      }
      
      // Not first visit - update timestamp
      localStorage.setItem(visitKey, Date.now().toString());
      return false;
    } catch (e) {
      return true; // If localStorage fails, treat as first visit
    }
  }
  
  // Header analysis for JavaScript-disabled fallback
  getHeaderAnalysis() {
    // This would typically be done server-side, but we include the logic here
    // for completeness
    return {
      userAgent: navigator.userAgent,
      acceptLanguage: navigator.languages && navigator.languages.join(','),
      platform: navigator.platform,
      vendor: navigator.vendor,
      doNotTrack: navigator.doNotTrack,
      cookieEnabled: navigator.cookieEnabled
    };
  }

  // Server-side verification method
  async performServerSideVerification() {
    try {
      const response = await fetch('/api/bot-detection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fingerprint: this.fingerprintData,
          behavioral: this.behavioralData,
          network: this.networkData,
          storage: this.storageData,
          headers: this.getHeaderAnalysis()
        })
      });
      
      const result = await response.json();
      return result.isHuman;
    } catch (error) {
      console.error('Server verification failed', error);
      // Fail open or closed based on security requirements
      return false; // Fail closed: assume bot on server verification failure
    }
  }

  // Evaluation methods for fallback scenarios (JavaScript disabled)
  evaluateFallbackMethods() {
    const fallbackResults = {};
    
    if (this.config.fallbackMethods.headerAnalysis) {
      fallbackResults.headerAnalysis = this.evaluateHeaders();
    }
    
    if (this.config.fallbackMethods.ipBlacklist && this.networkData.ipAddress) {
      fallbackResults.ipCheck = this.checkIPBlacklist(this.networkData.ipAddress);
    }
    
    if (this.config.fallbackMethods.sessionTracking) {
      fallbackResults.sessionCheck = this.evaluateSession();
    }
    
    // Return overall assessment and details
    const allChecks = Object.values(fallbackResults);
    const overallResult = allChecks.every(check => check === true);
    
    return {
      isHuman: overallResult,
      details: fallbackResults
    };
  }

  evaluateHeaders() {
    const headers = this.getHeaderAnalysis();
    
    // Check for common bot user agents
    const botPatterns = [
      'bot', 'crawl', 'spider', 'headless', 'scrape',
      'phantomjs', 'selenium', 'puppeteer'
    ];
    
    const userAgentLower = headers.userAgent.toLowerCase();
    const containsBotPattern = botPatterns.some(pattern => userAgentLower.includes(pattern));
    
    // Check for missing or suspicious accept-language
    const hasValidLanguage = headers.acceptLanguage && headers.acceptLanguage.length > 0;
    
    // Platform consistency checks would be more thorough in production
    return !containsBotPattern && hasValidLanguage;
  }

  evaluateSession() {
    // Check if this is a new session but with bot-like behavior
    if (this.storageData.firstVisit) {
      // New visitors with unusual behavior patterns might be bots
      // This would be more sophisticated in production
      const suspiciousNewVisitor = !this.storageData.cookieEnabled || 
                                  !this.storageData.localStorage || 
                                  !this.storageData.sessionStorage;
      
      return !suspiciousNewVisitor;
    }
    
    return true;
  }

  // Main detection method
  async detectBot() {
    // Check if JavaScript is enabled (this will only run if it is)
    const jsEnabled = true;
    
    if (jsEnabled) {
      // Conduct behavioral and fingerprint analysis
      const behavioralChecks = [
        this.assessMouseMovementNaturalness(),
        this.assessScrollBehavior(),
        this.assessKeystrokeNaturalness(),
        this.assessInteractionTiming(),
        this.assessCopyPasteActivity()
      ];
      
      // Network checks
      const networkChecks = [
        this.checkIPBlacklist(this.networkData.ipAddress)
      ];
      
      // Check the presence and consistency of fingerprints
      const fingerprintChecks = [
        !!this.fingerprintData.canvas,
        !!this.fingerprintData.audio
      ];
      
      // Check for signs of bot behavior
      const behavioralResult = behavioralChecks.every(check => check === true);
      const networkResult = networkChecks.every(check => check === true);
      const fingerprintResult = fingerprintChecks.some(check => check === true); // Need at least one fingerprint
      
      // Server-side verification for critical scenarios
      const serverVerification = await this.performServerSideVerification();
      
      return {
        isHuman: behavioralResult && networkResult && fingerprintResult && serverVerification,
        details: {
          behavioral: behavioralResult,
          network: networkResult,
          fingerprint: fingerprintResult,
          server: serverVerification
        }
      };
    } else {
      // JavaScript disabled fallback
      return this.evaluateFallbackMethods();
    }
  }
  
  // Main public method to perform detection and take action
  async performDetection() {
    const result = await this.detectBot();
    
    if (!result.isHuman) {
      // Bot detected - implement your handling logic here
      this.handleBotDetection(result.details);
      return false;
    }
    
    return true;
  }
  
  handleBotDetection(details) {
    // Log detection for analysis
    console.log('Bot detected:', details);
    
    // Implement countermeasures based on detection confidence
    // For example:
    // - Show CAPTCHA
    // - Block access
    // - Rate limit
    // - Log for review
    
    // Example implementation:
    if (this.config.fallbackMethods.captchaVerification) {
      this.showCaptcha();
    } else {
      this.blockAccess();
    }
  }
  
  showCaptcha() {
    // Implementation would create and insert a CAPTCHA challenge
    const captchaContainer = document.createElement('div');
    captchaContainer.id = 'bot-detection-captcha';
    captchaContainer.style.position = 'fixed';
    captchaContainer.style.top = '0';
    captchaContainer.style.left = '0';
    captchaContainer.style.width = '100%';
    captchaContainer.style.height = '100%';
    captchaContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    captchaContainer.style.zIndex = '9999';
    captchaContainer.style.display = 'flex';
    captchaContainer.style.alignItems = 'center';
    captchaContainer.style.justifyContent = 'center';
    
    // CAPTCHA content would go here
    captchaContainer.innerHTML = `
      <div style="background-color: white; padding: 20px; border-radius: 5px; max-width: 400px;">
        <h2>Verify you're human</h2>
        <p>Please complete the security check below to continue:</p>
        <!-- CAPTCHA challenge would be inserted here -->
        <div id="captcha-challenge">
          <!-- Challenge content -->
        </div>
        <button id="captcha-submit">Submit</button>
      </div>
    `;
    
    document.body.appendChild(captchaContainer);
    
    // Set up verification logic
    document.getElementById('captcha-submit').addEventListener('click', () => {
      // Verification logic would go here
      document.body.removeChild(captchaContainer);
    });
  }
  
  blockAccess() {
    // Implementation would block access to the page
    const blockContainer = document.createElement('div');
    blockContainer.style.position = 'fixed';
    blockContainer.style.top = '0';
    blockContainer.style.left = '0';
    blockContainer.style.width = '100%';
    blockContainer.style.height = '100%';
    blockContainer.style.backgroundColor = 'white';
    blockContainer.style.zIndex = '9999';
    blockContainer.style.display = 'flex';
    blockContainer.style.alignItems = 'center';
    blockContainer.style.justifyContent = 'center';
    
    blockContainer.innerHTML = `
      <div style="text-align: center; max-width: 600px;">
        <h1>Access Denied</h1>
        <p>Our systems have detected unusual activity from your browser.</p>
        <p>If you believe this is an error, please contact support.</p>
      </div>
    `;
    
    // Replace the entire page content
    document.body.innerHTML = '';
    document.body.appendChild(blockContainer);
  }
  
  // Additional detection methods that could be useful
  
  // Challenge-based bot detection
  implementChallengeBasedDetection() {
    // Create hidden challenges that bots often fall for
    
    // Honeypot fields in forms
    this.createHoneypotFields();
    
    // Invisible buttons/links that bots might click
    this.createDecoyElements();
    
    // Time-based challenges
    this.createTimingChallenges();
  }
  
  createHoneypotFields() {
    // Implement on forms to catch bots
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      // Create a hidden field that should not be filled out
      const honeypot = document.createElement('input');
      honeypot.type = 'text';
      honeypot.name = 'website'; // Name that suggests it should be filled
      honeypot.id = `hp-${Math.random().toString(36).substring(2, 10)}`;
      honeypot.autocomplete = 'off';
      
      // Hide it with CSS
      honeypot.style.position = 'absolute';
      honeypot.style.left = '-9999px';
      honeypot.style.top = '-9999px';
      
      form.appendChild(honeypot);
      
      // Add submission handler
      form.addEventListener('submit', (e) => {
        if (honeypot.value) {
          // Honeypot field was filled - likely a bot
          e.preventDefault();
          this.handleBotDetection({ type: 'honeypot_filled' });
        }
      });
    });
  }
  
  createDecoyElements() {
    // Create invisible links that no human would click
    const decoyLink = document.createElement('a');
    decoyLink.href = '#bot-trap';
    decoyLink.style.opacity = '0';
    decoyLink.style.position = 'absolute';
    decoyLink.style.left = '-9999px';
    decoyLink.style.top = '-9999px';
    decoyLink.textContent = 'Click here for admin access';
    
    decoyLink.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleBotDetection({ type: 'decoy_clicked' });
    });
    
    document.body.appendChild(decoyLink);
  }
  
  createTimingChallenges() {
    // Track time spent on page and form filling speed
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      const startTime = Date.now();
      
      form.addEventListener('submit', (e) => {
        const completionTime = Date.now() - startTime;
        
        // If form is completed too quickly (e.g., < 3 seconds)
        if (completionTime < 3000) {
          e.preventDefault();
          this.handleBotDetection({ type: 'form_too_fast', time: completionTime });
        }
      });
    });
  }
  
  // Advanced browser feature detection
  implementAdvancedBrowserChecks() {
    this.checkTouchSupport();
    this.checkAutomationFlags();
    this.checkBrowserConsistency();
  }
  
  checkTouchSupport() {
    // Real mobile devices have consistent touch capabilities
    const touchPoints = navigator.maxTouchPoints || 0;
    const hasTouchScreen = ('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0);
    const touchEvent = !!window.TouchEvent;
    
    // Detect inconsistencies (e.g., claims to be mobile but no touch support)
    const isMobileUserAgent = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent);
    const touchInconsistency = isMobileUserAgent && !hasTouchScreen && touchPoints === 0;
    
    return !touchInconsistency;
  }
  
  checkAutomationFlags() {
    // Check for automation indicators
    const automationFlags = [
      !!window.document.documentElement.webdriver,
      !!window.navigator.webdriver,
      !!window._phantom,
      !!window.callPhantom,
      !!window.__nightmare,
      !!window.domAutomation,
      !!window.domAutomationController
    ];
    
    return !automationFlags.some(flag => flag === true);
  }
  
  checkBrowserConsistency() {
    // Look for inconsistencies in the browser environment
    const consistencyChecks = [
      // Check if navigator properties match what they should be
      typeof navigator.plugins === 'object',
      typeof navigator.languages === 'object',
      
      // Verify browser API behavior is consistent
      typeof window.chrome === 'object' === /Chrome/.test(navigator.userAgent),
      typeof document.body.addBehavior === 'function' === /MSIE|Trident/.test(navigator.userAgent),
      
      // Graphics rendering consistency
      this.checkWebGLConsistency()
    ];
    
    return consistencyChecks.every(check => check === true);
  }
  
  checkWebGLConsistency() {
    if (!this.fingerprintData.webgl) return true;
    
    const renderer = this.fingerprintData.webgl.renderer || '';
    const vendor = this.fingerprintData.webgl.vendor || '';
    
    // Check for known virtualized GPU strings
    const virtualizedGPU = [
      'SwiftShader', 'ANGLE', 'Microsoft Basic Render', 
      'Virtual Box', 'VMware', 'llvmpipe'
    ];
    
    // Return true if no virtualized GPU is detected
    return !virtualizedGPU.some(gpu => 
      renderer.includes(gpu) || vendor.includes(gpu)
    );
  }
  
  // Rate limiting implementation
  implementRateLimiting() {
    // Track user actions to detect abnormal patterns
    let actionCount = 0;
    let lastActionTime = Date.now();
    const actionThreshold = 100; // Maximum actions per minute
    
    // Set up event listeners for common actions
    const trackAction = () => {
      const now = Date.now();
      const timeDiff = now - lastActionTime;
      lastActionTime = now;
      
      // If actions are happening too quickly
      if (timeDiff < 50) { // Less than 50ms between actions
        actionCount++;
      } else {
        actionCount = Math.max(0, actionCount - 1); // Decrease count slowly
      }
      
      // If too many actions are detected, it might be a bot
      if (actionCount > actionThreshold) {
        this.handleBotDetection({ type: 'rate_limit_exceeded' });
        return false;
      }
      
      return true;
    };
    
    // Monitor various interaction events
    ['click', 'mousemove', 'keydown', 'scroll'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        trackAction();
      }, { passive: true });
    });
  }
}

// Helper function to initialize the bot detection system
function initBotDetection(config = {}) {
  const botDetection = new BotDetectionSystem(config);
  
  // Perform detection immediately on page load
  window.addEventListener('DOMContentLoaded', () => {
    botDetection.performDetection();
  });
  
  // Set up additional detection mechanisms
  botDetection.implementChallengeBasedDetection();
  botDetection.implementAdvancedBrowserChecks();
  botDetection.implementRateLimiting();
  
  return botDetection;
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BotDetectionSystem,
    initBotDetection
  };
}
