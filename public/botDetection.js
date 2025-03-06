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
      'Segoe UI', 'Tahoma', 'Times', 'Times New Roman', 'Trebuchet MS
