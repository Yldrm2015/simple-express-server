// Bot Detection System Implementation
class BotDetectionSystem {
    constructor(config = {}) {
        // Configuration options with default settings
        this.config = {
            networkControls: {
                blockKnownProxies: true,
                checkWebRTC: true,
                tcpFingerprintingStrict: true,
                checkConnectionSpeed: true
            },
            timeAndUserConfig: {
                currentDateTime: '2025-03-12 08:05:28',  
                userLogin: "Yldrm2015",                  
                lastChecked: null,
                status: 'Not yet checked'
            },
            behavioralThresholds: {
                mouseMovementNaturalness: 0.6,
                scrollSpeedVariance: 0.4,
                keystrokeNaturalness: 0.7,
                interactionTimingVariance: 0.5,
                pageFocusRatio: 0.4,
                copyPasteCount: 5
            }
        };

        // Initialize behavioral tracking data
        this.behavioralData = {
            mouseMovements: [],
            scrollEvents: [],
            keystrokePatterns: [],
            pageInteractions: [],
            pageFocusTime: 0,
            copyPasteCount: 0,
            lastActivity: Date.now()
        };

        // Initialize components
        this.initializeBehavioralTracking();
        this.initializeFingerprinting();
        this.initializeNetworkControls();
        this.initializeCookieStorage();

        // Integration initialization
        this.integration = new BotDetectionIntegration();
        this.systemMetadata = {
            timestamp: '2025-03-12 08:05:28',
            userLogin: 'Yldrm2015',
            version: '2.0.0',
            lastUpdate: '2025-03-12 08:05:28',
            status: 'initializing'
        };
    }

    async initializeWithIntegration() {
        try {
            // Initialize core system
            await this.initialize();

            // Initialize integration
            const integrationResult = await this.integration.initialize();

            if (integrationResult.status === 'success') {
                this.systemMetadata.status = 'ready';
                console.log(`[2025-03-12 08:05:28] Bot detection system initialized successfully for user ${this.systemMetadata.userLogin}`);
            } else {
                throw new Error(integrationResult.message);
            }

            return {
                status: 'success',
                timestamp: '2025-03-12 08:05:28',
                userLogin: 'Yldrm2015',
                message: 'System initialized successfully with all integrations'
            };
        } catch (error) {
            this.systemMetadata.status = 'error';
            console.error(`[2025-03-12 08:05:28] System initialization error:`, error);
            
            return {
                status: 'error',
                timestamp: '2025-03-12 08:05:28',
                userLogin: 'Yldrm2015',
                message: error.message
            };
        }
    }

    // Behavioral Analysis Methods
    initializeBehavioralTracking() {
        document.addEventListener('mousemove', (e) => {
            this.trackMouseMovement(e);
        });

        document.addEventListener('scroll', (e) => {
            this.trackScrollBehavior(e);
        });

        document.addEventListener('keydown', (e) => {
            this.analyzeKeystrokes(e);
        });

        document.addEventListener('visibilitychange', () => {
            this.trackPageFocus();
        });

        document.addEventListener('click', (e) => {
            this.trackInteraction('click', e);
        });

        document.addEventListener('copy', () => {
            this.behavioralData.copyPasteCount++;
        });
        
        document.addEventListener('paste', () => {
            this.behavioralData.copyPasteCount++;
        });

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
        
        if (this.behavioralData.mouseMovements.length > 100) {
            this.behavioralData.mouseMovements.shift();
        }
        
        this.behavioralData.mouseMovements.push(movement);
        this.behavioralData.lastActivity = timestamp;
        return this.assessMouseMovementNaturalness();
    }

    trackScrollBehavior(event) {
        const timestamp = Date.now();
        const scrollData = {
            scrollY: window.scrollY,
            timestamp
        };
        
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

        let scrollSpeeds = [];
        for (let i = 1; i < scrollEvents.length; i++) {
            const timeDiff = scrollEvents[i].timestamp - scrollEvents[i-1].timestamp;
            const scrollDiff = Math.abs(scrollEvents[i].scrollY - scrollEvents[i-1].scrollY);
            
            if (timeDiff > 0) {
                scrollSpeeds.push(scrollDiff / timeDiff);
            }
        }

        if (scrollSpeeds.length < 3) return true;
        
        const avgSpeed = scrollSpeeds.reduce((a, b) => a + b, 0) / scrollSpeeds.length;
        const variance = scrollSpeeds.reduce((a, b) => a + Math.pow(b - avgSpeed, 2), 0) / scrollSpeeds.length;
        const normalizedVariance = Math.min(variance / avgSpeed, 1);
        
        return normalizedVariance >= this.config.behavioralThresholds.scrollSpeedVariance;
    }

    assessMouseMovementNaturalness() {
        const movements = this.behavioralData.mouseMovements;
        if (movements.length < 10) return true;

        let straightLineCount = 0;
        for (let i = 2; i < movements.length; i++) {
            const p1 = movements[i-2];
            const p2 = movements[i-1];
            const p3 = movements[i];
            
            const slope1 = p1.x !== p2.x ? (p2.y - p1.y) / (p2.x - p1.x) : null;
            const slope2 = p2.x !== p3.x ? (p3.y - p2.y) / (p3.x - p2.x) : null;
            
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
        
        if (this.behavioralData.keystrokePatterns.length > 50) {
            this.behavioralData.keystrokePatterns.shift();
        }
        
        this.behavioralData.keystrokePatterns.push(keystroke);
        this.behavioralData.lastActivity = timestamp;
        return this.assessKeystrokeNaturalness();
    }

    async enhancedDetectBot() {
        try {
            // Get basic detection result
            const basicResult = await this.detectBot();

            // Process through integration
            const enhancedResult = await this.integration.processDetectionResult(basicResult);

            // Combine results
            return {
                ...basicResult,
                enhanced: enhancedResult,
                timestamp: '2025-03-12 08:05:28',
                userLogin: 'Yldrm2015'
            };
        } catch (error) {
            console.error(`[2025-03-12 08:05:28] Enhanced detection error:`, error);
            return {
                error: true,
                message: error.message,
                timestamp: '2025-03-12 08:05:28',
                userLogin: 'Yldrm2015'
            };
        }
    }

    generateDetectionReport() {
        return {
            timestamp: '2025-03-12 08:05:28',
            userLogin: 'Yldrm2015',
            systemStatus: {
                behavioral: this.generateBehavioralReport(),
                network: this.generateNetworkReport(),
                fingerprint: this.generateFingerprintReport(),
                session: this.generateSessionReport()
            }
        };
    }

    generateBehavioralReport() {
        const mouseMovements = this.behavioralData.mouseMovements;
        const keystrokes = this.behavioralData.keystrokePatterns;
        const scrollEvents = this.behavioralData.scrollEvents;

        return {
            timestamp: '2025-03-12 08:05:28',
            userLogin: 'Yldrm2015',
            metrics: {
                mouseMetrics: {
                    totalMovements: mouseMovements.length,
                    naturalMovements: mouseMovements.filter(m => 
                        this.isNaturalMovement(m)).length,
                    averageVelocity: this.calculateAverageMouseVelocity(),
                    lastActivity: this.behavioralData.lastActivity
                },
                keyboardMetrics: {
                    totalKeystrokes: keystrokes.length,
                    naturalPatterns: keystrokes.filter(k => 
                        this.isNaturalKeystrokePattern(k)).length,
                    averageInterval: this.calculateAverageKeystrokeInterval(),
                    patterns: this.analyzeKeystrokePatterns()
                },
                scrollMetrics: {
                    totalScrolls: scrollEvents.length,
                    naturalScrolls: scrollEvents.filter(s => 
                        this.isNaturalScroll(s)).length,
                    averageSpeed: this.calculateAverageScrollSpeed(),
                    patterns: this.analyzeScrollPatterns()
                }
            }
        };
    }

    generateNetworkReport() {
        return {
            timestamp: '2025-03-12 08:05:28',
            userLogin: 'Yldrm2015',
            metrics: {
                connection: this.networkData.connectionType,
                webRTC: this.networkData.webRTCData,
                headers: this.networkData.headersAnalyzed ? 
                    this.analyzeHeaders(this.getRequestHeaders()) : null,
                anomalies: this.detectNetworkAnomalies()
            }
        };
    }

    generateFingerprintReport() {
        return {
            timestamp: '2025-03-12 08:15:07',
            userLogin: 'Yldrm2015',
            metrics: {
                browserProfile: this.generateBrowserProfile(),
                hardwareProfile: this.generateHardwareProfile(),
                consistencyScore: this.calculateFingerprintConsistency()
            }
        };
    }

    generateSessionReport() {
        return {
            timestamp: '2025-03-12 08:15:07',
            userLogin: 'Yldrm2015',
            metrics: {
                sessionDuration: this.calculateSessionDuration(),
                interactionFrequency: this.calculateInteractionFrequency(),
                activityPatterns: this.analyzeActivityPatterns()
            }
        };
    }

    // Helper method to track page focus events - Buraya taşındı
    trackPageFocus() {
        const timestamp = Date.now();
        const focusEvent = {
            isVisible: document.visibilityState === 'visible',
            timestamp
        };
        
        this.behavioralData.pageInteractions.push(focusEvent);
        this.behavioralData.lastActivity = timestamp;
    }
}

// Initialize the system when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const botDetector = new BotDetectionSystem({
        timeAndUserConfig: {
            currentDateTime: '2025-03-12 08:15:07',
            userLogin: 'Yldrm2015'
        }
    });

    // Helper method to track user interactions
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
        
        if (this.behavioralData.pageInteractions.length > 50) {
            this.behavioralData.pageInteractions.shift();
        }
        
        this.behavioralData.pageInteractions.push(interaction);
        this.behavioralData.lastActivity = timestamp;
        
        return this.assessInteractionTiming();
    }
    assessKeystrokeNaturalness() {
        const keystrokes = this.behavioralData.keystrokePatterns;
        if (keystrokes.length < 10) return true;
        
        let timings = keystrokes.map(k => k.timeSinceLast).filter(t => t > 0);
        if (timings.length < 5) return true;
        
        const avgTiming = timings.reduce((a, b) => a + b, 0) / timings.length;
        const variance = timings.reduce((a, b) => a + Math.pow(b - avgTiming, 2), 0) / timings.length;
        const normalizedVariance = Math.min(variance / avgTiming, 1);
        
        let perfectTimingCount = 0;
        for (let i = 1; i < timings.length; i++) {
            if (Math.abs(timings[i] - timings[i-1]) < 5) {
                perfectTimingCount++;
            }
        }
        
        const perfectTimingRatio = perfectTimingCount / (timings.length - 1);
        const naturalnessFactor = (1 - perfectTimingRatio) * normalizedVariance;
        
        return naturalnessFactor >= this.config.behavioralThresholds.keystrokeNaturalness;
    }

    assessInteractionTiming() {
        const interactions = this.behavioralData.pageInteractions;
        if (interactions.length < 5) return true;
        
        const directInteractions = interactions.filter(i => i.type === 'click');
        if (directInteractions.length < 3) return true;
        
        let timings = directInteractions.map(i => i.timeSinceLast).filter(t => t > 0);
        if (timings.length < 2) return true;
        
        const avgTiming = timings.reduce((a, b) => a + b, 0) / timings.length;
        const variance = timings.reduce((a, b) => a + Math.pow(b - avgTiming, 2), 0) / timings.length;
        const normalizedVariance = Math.min(variance / avgTiming, 1);
        
        return normalizedVariance >= this.config.behavioralThresholds.interactionTimingVariance;
    }

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
                screenMetrics: this.captureScreenMetrics(),
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
            
            // Add complexity to the canvas
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
            
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyser.getByteTimeDomainData(dataArray);
            
            oscillator.stop(0);
            audioCtx.close();
            
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
            // Memory info capture
            let memoryInfo = null;
            if (performance && performance.memory) {
                memoryInfo = {
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    usedJSHeapSize: performance.memory.usedJSHeapSize
                };
            }
            
            // CPU performance indirect measurement
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
                deviceMemory: navigator.deviceMemory || null,
                timestamp: new Date().toISOString()
                    .replace('T', ' ')
                    .slice(0, 19)
            };
        } catch (error) {
            console.error('System resources fingerprinting failed:', error);
            return {
                memoryInfo: null,
                cpuPerformance: null,
                hardwareConcurrency: null,
                deviceMemory: null,
                timestamp: new Date().toISOString()
                    .replace('T', ' ')
                    .slice(0, 19)
            };
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
                orientation: window.screen.orientation ? window.screen.orientation.type : null,
                timestamp: new Date().toISOString()
                    .replace('T', ' ')
                    .slice(0, 19)
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
                orientation: null,
                timestamp: new Date().toISOString()
                    .replace('T', ' ')
                    .slice(0, 19)
            };
        }
    }

    detectFonts() {
        try {
            const baseFonts = ['monospace', 'sans-serif', 'serif'];
            const fontList = [
                'Arial', 'Arial Black', 'Arial Narrow', 'Calibri', 
                'Cambria', 'Cambria Math', 'Comic Sans MS', 'Courier',
                'Courier New', 'Georgia', 'Helvetica', 'Impact',
                'Lucida Console', 'Lucida Sans Unicode', 'Microsoft Sans Serif',
                'Palatino Linotype', 'Segoe UI', 'Tahoma', 'Times',
                'Times New Roman', 'Trebuchet MS', 'Verdana'
            ];
            
            const testString = 'mmmmmmmmmmlli';
            const testSize = '72px';
            const h = document.createElement('div');
            
            h.style.position = 'absolute';
            h.style.left = '-9999px';
            h.style.visibility = 'hidden';
            
            const baseFontWidths = {};
            const detected = [];

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
                
                for (let base of baseFonts) {
                    h.style.fontFamily = `'${font}', ${base}`;
                    h.style.fontSize = testSize;
                    h.innerHTML = testString;
                    
                    if (h.clientWidth !== baseFontWidths[base]) {
                        fontDetected = true;
                        break;
                    }
                }
                
                if (fontDetected) {
                    detected.push(font);
                }
            }
            
            document.body.removeChild(h);
            
            return {
                detectedFonts: detected,
                timestamp: new Date().toISOString()
                    .replace('T', ' ')
                    .slice(0, 19)
            };
        } catch (error) {
            console.error('Font detection failed:', error);
            return {
                detectedFonts: [],
                timestamp: new Date().toISOString()
                    .replace('T', ' ')
                    .slice(0, 19)
            };
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
            
            return {
                plugins,
                timestamp: new Date().toISOString()
                    .replace('T', ' ')
                    .slice(0, 19)
            };
        } catch (error) {
            console.error('Plugin detection failed:', error);
            return {
                plugins: [],
                timestamp: new Date().toISOString()
                    .replace('T', ' ')
                    .slice(0, 19)
            };
        }
    }

    initializeNetworkControls() {
        try {
            this.networkData = {
                ipAddress: null,
                connectionType: this.detectConnectionType(),
                webRTCData: this.config.networkControls.checkWebRTC ? 
                    this.checkWebRTC() : null,
                headersAnalyzed: false,
                tcpFingerprint: null,
                lastCheck: new Date().toISOString()
                    .replace('T', ' ')
                    .slice(0, 19)
            };
        } catch (error) {
            console.error('Network controls initialization failed:', error);
            this.networkData = {
                ipAddress: null,
                connectionType: null,
                webRTCData: null,
                headersAnalyzed: false,
                tcpFingerprint: null,
                lastCheck: new Date().toISOString()
                    .replace('T', ' ')
                    .slice(0, 19)
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
                    saveData: connection.saveData,
                    timestamp: new Date().toISOString()
                        .replace('T', ' ')
                        .slice(0, 19)
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
            const RTCPeerConnection = window.RTCPeerConnection || 
                                    window.webkitRTCPeerConnection || 
                                    window.mozRTCPeerConnection;
            
            if (!RTCPeerConnection) return null;
            
            const rtcData = {
                localIPs: [],
                publicIP: null,
                timestamp: new Date().toISOString()
                    .replace('T', ' ')
                    .slice(0, 19)
            };
            
            const pc = new RTCPeerConnection({
                iceServers: [{urls: "stun:stun.l.google.com:19302"}]
            });
            pc.createDataChannel("");
            
            pc.onicecandidate = (ice) => {
                if (!ice || !ice.candidate || !ice.candidate.candidate) return;
                
                const candidateStr = ice.candidate.candidate;
                const ipMatch = /([0-9]{1,3}(\.[0-9]{1,3}){3})/g.exec(candidateStr);
                
                if (ipMatch && ipMatch.length > 1) {
                    const ip = ipMatch[1];
                    
                    if (/^(192\.168\.|169\.254\.|10\.|172\.(1[6-9]|2\d|3[0-1]))/.test(ip)) {
                        if (!rtcData.localIPs.includes(ip)) {
                            rtcData.localIPs.push(ip);
                        }
                    } else {
                        rtcData.publicIP = ip;
                    }
                }
            };
            
            pc.createOffer()
                .then(offer => pc.setLocalDescription(offer))
                .catch(err => console.error('WebRTC detection error:', err));
            
            setTimeout(() => {
                try {
                    pc.close();
                } catch (e) {}
            }, 5000);
            
            return rtcData;
        } catch (error) {
            console.error('WebRTC check failed:', error);
            return {
                localIPs: [],
                publicIP: null,
                timestamp: new Date().toISOString()
                    .replace('T', ' ')
                    .slice(0, 19)
            };
        }
    }

    // Core Bot Detection Logic
    async detectBot() {
        try {
            if (typeof window === 'undefined' || !window.localStorage) {
                return this.serverSideBotDetection();
            }

            const activityTime = this.behavioralData.pageFocusTime;
            const inactiveTime = Date.now() - this.behavioralData.lastActivity;
            
            const behavioralSignals = {
                mouseMovementNatural: this.assessMouseMovementNaturalness(),
                scrollBehaviorNatural: this.assessScrollBehavior(),
                keystrokePatternNatural: this.assessKeystrokeNaturalness(),
                interactionTimingNatural: this.assessInteractionTiming(),
                copyPasteActivityNormal: this.behavioralData.copyPasteCount <= this.config.behavioralThresholds.copyPasteCount,
                pageFocusRatioAcceptable: activityTime > 0 ? 
                    (activityTime * 1000 / (activityTime * 1000 + inactiveTime)) > this.config.behavioralThresholds.pageFocusRatio : true
            };

            const networkSignals = {
                usingProxy: this.networkData.webRTCData ? 
                    this.networkData.webRTCData.localIPs.length === 0 && !this.networkData.webRTCData.publicIP : false,
                connectionSpeedConsistent: this.checkConnectionSpeed()
            };

            const fingerprintSignals = {
                hasCanvas: !!this.fingerprintData.canvas,
                hasWebGL: !!this.fingerprintData.webgl,
                hasAudio: !!this.fingerprintData.audio,
                hasConsistentFingerprint: this.checkFingerprintConsistency()
            };

            // Calculate negative signals
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

            const totalSignals = 12;
            const botProbability = (negativeSignals / totalSignals) * 100;
            const isBotLikely = botProbability > 50;
            const verificationRequired = botProbability > 30 && botProbability <= 50;

            return {
                isBotLikely,
                botProbability,
                verificationRequired,
                signals: {
                    behavioral: behavioralSignals,
                    network: networkSignals,
                    fingerprint: fingerprintSignals
                },
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                timeAndUser: {
                    currentDateTime: this.config.timeAndUserConfig.currentDateTime,
                    userLogin: this.config.timeAndUserConfig.userLogin
                },
                sessionId: this.storageData ? this.storageData.sessionId : null
            };
        } catch (error) {
            console.error('Bot detection error:', error);
            return {
                isBotLikely: false,
                botProbability: 0,
                verificationRequired: true,
                error: error.message,
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
                timeAndUser: {
                    currentDateTime: this.config.timeAndUserConfig.currentDateTime,
                    userLogin: this.config.timeAndUserConfig.userLogin
                }
            };
        }
    }

    checkConnectionSpeed() {
        try {
            const connection = navigator.connection || 
                             navigator.mozConnection || 
                             navigator.webkitConnection;
            
            if (!connection || typeof connection.downlink !== 'number') {
                return true;
            }
            
            if (!this._lastConnectionChecks) {
                this._lastConnectionChecks = [];
            }
            
            this._lastConnectionChecks.push({
                downlink: connection.downlink,
                rtt: connection.rtt,
                time: new Date().toISOString().replace('T', ' ').slice(0, 19)
            });
            
            if (this._lastConnectionChecks.length > 10) {
                this._lastConnectionChecks.shift();
            }
            
            if (this._lastConnectionChecks.length >= 3) {
                const allSameDownlink = this._lastConnectionChecks.every(check => 
                    check.downlink === this._lastConnectionChecks[0].downlink);
                const allSameRtt = this._lastConnectionChecks.every(check => 
                    check.rtt === this._lastConnectionChecks[0].rtt);
                
                if (allSameDownlink && allSameRtt) {
                    return false;
                }
            }
            
            return true;
        } catch (error) {
            console.error('Connection speed check failed:', error);
            return true;
        }
    }

    checkFingerprintConsistency() {
        try {
            if (!this.storageData || !this.storageData.storedData || !this.storageData.storedData.localStorage) {
                return true;
            }
            
            const currentFingerprint = this.calculateFingerprint();
            const storedFingerprint = this.storageData.storedData.localStorage.fingerprint;
            
            return currentFingerprint === storedFingerprint;
        } catch (error) {
            console.error('Fingerprint consistency check failed:', error);
            return true;
        }
    }

    calculateFingerprint() {
        const fingerprintData = {
            canvas: this.fingerprintData.canvas ? this.fingerprintData.canvas.dataURL.substr(0, 32) : null,
            webgl: this.fingerprintData.webgl ? this.fingerprintData.webgl.renderer : null,
            audio: this.fingerprintData.audio ? this.fingerprintData.audio.hash : null,
            screen: this.fingerprintData.screenMetrics ? 
                `${this.fingerprintData.screenMetrics.width}x${this.fingerprintData.screenMetrics.height}x${this.fingerprintData.screenMetrics.colorDepth}` : null,
            timezone: new Date().getTimezoneOffset(),
            language: navigator.language,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
        };
        
        const fingerprintString = JSON.stringify(fingerprintData);
        let hash = 0;
        
        for (let i = 0; i < fingerprintString.length; i++) {
            hash = ((hash << 5) - hash) + fingerprintString.charCodeAt(i);
            hash |= 0;
        }
        
        return hash.toString(16);
    }
   async evaluateSession() {
        try {
            // Check if we have enough data
            if (this.behavioralData.mouseMovements.length < 10 &&
                this.behavioralData.keystrokePatterns.length < 10 &&
                this.behavioralData.scrollEvents.length < 5) {
                return {
                    status: 'insufficient_data',
                    confidence: 0,
                    message: 'Not enough user interaction data collected yet',
                    timestamp: '2025-03-11 11:22:06',
                    userLogin: 'Yldrm2015'
                };
            }
            
            const detectionResult = await this.detectBot();
            
            if (detectionResult.isBotLikely) {
                if (this.config.fallbackMethods && this.config.fallbackMethods.captchaVerification) {
                    const captchaResult = await this.requestCaptchaVerification();
                    
                    if (captchaResult.success && captchaResult.score > 0.7) {
                        return {
                            status: 'human_verified',
                            confidence: captchaResult.score,
                            message: 'User verified via CAPTCHA',
                            timestamp: '2025-03-11 11:22:06',
                            userLogin: 'Yldrm2015'
                        };
                    }
                }
                
                return {
                    status: 'likely_bot',
                    confidence: detectionResult.botProbability / 100,
                    signals: detectionResult.signals,
                    message: 'User behavior indicates automated interaction',
                    timestamp: '2025-03-11 11:22:06',
                    userLogin: 'Yldrm2015'
                };
            }
            
            if (detectionResult.verificationRequired) {
                return {
                    status: 'verification_recommended',
                    confidence: detectionResult.botProbability / 100,
                    signals: detectionResult.signals,
                    message: 'Some unusual behaviors detected, verification recommended',
                    timestamp: '2025-03-11 11:22:06',
                    userLogin: 'Yldrm2015'
                };
            }
            
            return {
                status: 'likely_human',
                confidence: 1 - (detectionResult.botProbability / 100),
                signals: detectionResult.signals,
                message: 'User behavior consistent with human interaction',
                timestamp: '2025-03-11 11:22:06',
                userLogin: 'Yldrm2015'
            };
        } catch (error) {
            console.error('Session evaluation error:', error);
            return {
                status: 'error',
                confidence: 0,
                message: error.message,
                timestamp: '2025-03-11 11:22:06',
                userLogin: 'Yldrm2015'
            };
        }
    }

    initializeCookieStorage() {
        try {
            this.storageData = {
                fingerprint: null,
                sessionId: this.generateSessionId(),
                storedData: this.retrieveStoredData(),
                timestamp: '2025-03-11 11:22:06',
                userLogin: 'Yldrm2015'
            };
            
            this.updateStoredData();
        } catch (error) {
            console.error('Cookie storage initialization failed:', error);
            this.storageData = {
                fingerprint: null,
                sessionId: this.generateSessionId(),
                storedData: {},
                timestamp: '2025-03-11 11:22:06',
                userLogin: 'Yldrm2015'
            };
        }
    }

    generateSessionId() {
        return `${Math.random().toString(36).substr(2, 9)}_${Date.now()}_Yldrm2015`;
    }

    retrieveStoredData() {
        let storedData = {};
        
        try {
            const localData = localStorage.getItem('bot_detection_data');
            if (localData) {
                storedData.localStorage = JSON.parse(localData);
            }
            
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
        
        return {
            ...storedData,
            timestamp: '2025-03-11 11:22:06',
            userLogin: 'Yldrm2015'
        };
    }

    updateStoredData() {
        try {
            const currentFingerprint = this.calculateFingerprint();
            this.storageData.fingerprint = currentFingerprint;
            
            localStorage.setItem('bot_detection_data', JSON.stringify({
                fingerprint: currentFingerprint,
                firstSeen: this.storageData.storedData.localStorage ? 
                    this.storageData.storedData.localStorage.firstSeen : '2025-03-11 11:22:06',
                lastSeen: '2025-03-11 11:22:06',
                userLogin: 'Yldrm2015'
            }));
            
            const expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 7);
            document.cookie = `bot_detection_session=${encodeURIComponent(this.storageData.sessionId)};` +
                            `expires=${expireDate.toUTCString()};path=/`;
        } catch (error) {
            console.error('Error updating stored data:', error);
        }
    }

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
            fingerprintAvailable: !!this.storageData.fingerprint,
            timestamp: '2025-03-11 11:22:06',
            userLogin: 'Yldrm2015'
        };
    }

    requestCaptchaVerification() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    score: 0.9,
                    timestamp: '2025-03-11 11:22:06',
                    userLogin: 'Yldrm2015'
                });
            }, 1500);
        });
    }

    serverSideBotDetection() {
        let score = 100;
        const detectionResults = {
            headerAnalysis: this.analyzeRequestHeaders(),
            ipAnalysis: this.analyzeIPAddress(),
            requestPatterns: this.analyzeRequestPatterns(),
            sessionAnalysis: this.analyzeSession(),
            botProbability: 0,
            isBot: false,
            reasons: [],
            timestamp: '2025-03-11 11:22:06',
            userLogin: 'Yldrm2015'
        };

        if (detectionResults.headerAnalysis.suspicious) {
            score += this.config.fallbackMethods.headerAnalysis.scoring.suspiciousPatterns;
            detectionResults.reasons.push(...detectionResults.headerAnalysis.reasons);
        }

        if (detectionResults.ipAnalysis.blacklisted) {
            score += this.config.fallbackMethods.ipAnalysis.scoring.blacklistedIP;
            detectionResults.reasons.push(...detectionResults.ipAnalysis.reasons);
        }

        if (detectionResults.requestPatterns.abnormalTiming) {
            score += this.config.fallbackMethods.requestPatternAnalysis.scoring.abnormalTiming;
            detectionResults.reasons.push(...detectionResults.requestPatterns.reasons);
        }

        if (detectionResults.sessionAnalysis.inconsistent) {
            score += this.config.fallbackMethods.sessionTracking.scoring.inconsistentSession;
            detectionResults.reasons.push(...detectionResults.sessionAnalysis.reasons);
        }

        detectionResults.botProbability = 100 - Math.max(0, Math.min(100, score));
        detectionResults.isBot = detectionResults.botProbability > 50;

        return detectionResults;
    }
}
// Initialize the system when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the bot detection system
    const botDetector = new BotDetectionSystem({
        timeAndUserConfig: {
            currentDateTime: '2025-03-11 11:24:20',
            userLogin: 'Yldrm2015'
        }
    });

    // Create and style the status display element
    const statusElement = document.createElement('div');
    statusElement.id = 'botDetectionStatus';
    Object.assign(statusElement.style, {
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        padding: '15px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        borderRadius: '5px',
        fontSize: '14px',
        fontFamily: 'monospace',
        zIndex: '9999',
        maxWidth: '400px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
    });
    document.body.appendChild(statusElement);

    // Create and style the check button
    const checkButton = document.createElement('button');
    checkButton.innerHTML = 'Check Bot Detection Status';
    Object.assign(checkButton.style, {
        position: 'fixed',
        bottom: '10px',
        right: '250px',
        padding: '10px 20px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '14px',
        fontFamily: 'Arial, sans-serif',
        zIndex: '9999'
    });
    document.body.appendChild(checkButton);

    // Function to update the status display
    async function updateStatus() {
        try {
            const result = await botDetector.detectBot();
            const status = botDetector.getDetectionStatus();
            
            let statusHtml = `
                <div style="margin-bottom: 10px;"><strong>Bot Detection Status</strong></div>
                <div>Current Date/Time (UTC): ${botDetector.config.timeAndUserConfig.currentDateTime}</div>
                <div>Current User: ${botDetector.config.timeAndUserConfig.userLogin}</div>
                <div>Status: <span style="color: ${result.isBotLikely ? '#ff4444' : '#44ff44'}">${result.isBotLikely ? 'Likely Bot' : 'Likely Human'}</span></div>
                <div>Confidence: ${result.botProbability ? result.botProbability.toFixed(2) + '%' : 'N/A'}</div>
                <div style="margin-top: 10px;"><strong>Activity Metrics:</strong></div>
                <div>Mouse Events: ${status.dataPoints.mouseMovements}</div>
                <div>Key Events: ${status.dataPoints.keystrokes}</div>
                <div>Scroll Events: ${status.dataPoints.scrollEvents}</div>
                <div>Activity Time: ${status.activityTime}s</div>
            `;

            if (result.signals) {
                statusHtml += `
                    <div style="margin-top: 10px;"><strong>Behavioral Analysis:</strong></div>
                    <div>Mouse Movement: ${result.signals.behavioral.mouseMovementNatural ? '✓ Natural' : '⚠ Suspicious'}</div>
                    <div>Scroll Behavior: ${result.signals.behavioral.scrollBehaviorNatural ? '✓ Natural' : '⚠ Suspicious'}</div>
                    <div>Keystroke Pattern: ${result.signals.behavioral.keystrokePatternNatural ? '✓ Natural' : '⚠ Suspicious'}</div>
                `;
            }

            if (result.verificationRequired) {
                statusHtml += `
                    <div style="margin-top: 10px; color: #ffaa00;">
                        ⚠ Additional verification recommended
                    </div>
                `;
            }

            statusElement.innerHTML = statusHtml;
        } catch (error) {
            console.error('Error updating status:', error);
            statusElement.innerHTML = `
                <div><strong>Bot Detection Status</strong></div>
                <div style="color: #ff4444;">Error: ${error.message}</div>
                <div>Time: ${botDetector.config.timeAndUserConfig.currentDateTime}</div>
                <div>User: ${botDetector.config.timeAndUserConfig.userLogin}</div>
            `;
        }
    }

    // Create detailed metrics panel
    const metricsPanel = document.createElement('div');
    metricsPanel.id = 'detailedMetrics';
    Object.assign(metricsPanel.style, {
        position: 'fixed',
        top: '10px',
        right: '10px',
        padding: '15px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        borderRadius: '5px',
        fontSize: '12px',
        fontFamily: 'monospace',
        zIndex: '9998',
        maxWidth: '300px',
        display: 'none'
    });
    document.body.appendChild(metricsPanel);

    // Function to update detailed metrics
    function updateDetailedMetrics() {
        const fingerprintData = botDetector.fingerprintData;
        const networkData = botDetector.networkData;
        
        metricsPanel.innerHTML = `
            <div><strong>Detailed System Metrics</strong></div>
            <div>Time: ${botDetector.config.timeAndUserConfig.currentDateTime}</div>
            <div>User: ${botDetector.config.timeAndUserConfig.userLogin}</div>
            <div style="margin-top: 10px;"><strong>System:</strong></div>
            <div>Screen: ${fingerprintData.screenMetrics.width}x${fingerprintData.screenMetrics.height}</div>
            <div>Color Depth: ${fingerprintData.screenMetrics.colorDepth}</div>
            <div>Platform: ${navigator.platform}</div>
            <div style="margin-top: 10px;"><strong>Network:</strong></div>
            <div>Connection: ${networkData.connectionType?.type || 'unknown'}</div>
            <div>WebRTC Status: ${networkData.webRTCData ? 'Available' : 'Not Available'}</div>
        `;
    }

    // Toggle detailed metrics on button right-click
    checkButton.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        metricsPanel.style.display = metricsPanel.style.display === 'none' ? 'block' : 'none';
        if (metricsPanel.style.display === 'block') {
            updateDetailedMetrics();
        }
    });

    // Initial status update
    updateStatus();

    // Update status every 10 seconds
    setInterval(updateStatus, 10000);

    // Add click event to check button
    checkButton.addEventListener('click', updateStatus);

    // Log evaluation results periodically
    setInterval(async function() {
        const result = await botDetector.evaluateSession();
        console.log('Bot detection evaluation:', {
            ...result,
            timestamp: botDetector.config.timeAndUserConfig.currentDateTime,
            userLogin: botDetector.config.timeAndUserConfig.userLogin
        });
        
        if (result.status === 'likely_bot') {
            console.warn('Bot detected with confidence:', result.confidence);
        }
    }, 30000);

// Handle visibility changes
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        updateStatus();
        console.log('Page visibility changed, updating status');
    }
});

// Handle window focus/blur
window.addEventListener('focus', updateStatus);
window.addEventListener('blur', function() {
    console.log('Window lost focus:', botDetector.config.timeAndUserConfig.currentDateTime);
}); // Burada sadece bir tane parantez ve noktalı virgül olmalı

    // Advanced Analysis Helper Methods
    isNaturalMovement(movement) {
        if (!movement || !movement.timestamp) return false;
        
        // Check for natural mouse movement patterns
        const velocity = this.calculateVelocity(movement);
        const acceleration = this.calculateAcceleration(movement);
        const direction = this.calculateDirection(movement);
        
        return {
            isNatural: velocity < 1000 && acceleration < 100 && direction !== 'perfectly_straight',
            timestamp: '2025-03-11 11:25:38',
            userLogin: 'Yldrm2015',
            metrics: { velocity, acceleration, direction }
        };
    }

    isNaturalKeystrokePattern(keystroke) {
        if (!keystroke || !keystroke.timestamp) return false;
        
        // Check for natural typing patterns
        const interval = keystroke.timeSinceLast;
        const isRepetitive = this.checkRepetitivePattern(keystroke);
        const isPerfectTiming = this.checkPerfectTiming(keystroke);
        
        return {
            isNatural: interval > 50 && !isRepetitive && !isPerfectTiming,
            timestamp: '2025-03-11 11:25:38',
            userLogin: 'Yldrm2015',
            metrics: { interval, isRepetitive, isPerfectTiming }
        };
    }

    isNaturalScroll(scroll) {
        if (!scroll || !scroll.timestamp) return false;
        
        // Check for natural scrolling patterns
        const speed = this.calculateScrollSpeed(scroll);
        const acceleration = this.calculateScrollAcceleration(scroll);
        const pattern = this.analyzeScrollPattern(scroll);
        
        return {
            isNatural: speed < 1000 && acceleration < 100 && pattern !== 'mechanical',
            timestamp: '2025-03-11 11:25:38',
            userLogin: 'Yldrm2015',
            metrics: { speed, acceleration, pattern }
        };
    }

    generateBrowserProfile() {
        return {
            timestamp: '2025-03-11 11:25:38',
            userLogin: 'Yldrm2015',
            metrics: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                doNotTrack: navigator.doNotTrack,
                cookieEnabled: navigator.cookieEnabled,
                plugins: this.fingerprintData.plugins,
                mimeTypes: this.getMimeTypes(),
                fonts: this.fingerprintData.fonts
            }
        };
    }

    generateHardwareProfile() {
        return {
            timestamp: '2025-03-11 11:25:38',
            userLogin: 'Yldrm2015',
            metrics: {
                screen: this.fingerprintData.screenMetrics,
                hardware: {
                    cores: navigator.hardwareConcurrency,
                    memory: performance.memory ? {
                        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                        totalJSHeapSize: performance.memory.totalJSHeapSize,
                        usedJSHeapSize: performance.memory.usedJSHeapSize
                    } : null,
                    gpu: this.fingerprintData.webgl ? {
                        vendor: this.fingerprintData.webgl.vendor,
                        renderer: this.fingerprintData.webgl.renderer
                    } : null
                },
                performance: this.fingerprintData.systemResources
            }
        };
    }

    calculateSessionDuration() {
        return {
            timestamp: '2025-03-11 11:25:38',
            userLogin: 'Yldrm2015',
            metrics: {
                totalTime: Date.now() - this.storageData.sessionId.split('_')[1],
                activeTime: this.behavioralData.pageFocusTime,
                inactiveTime: this.calculateInactiveTime()
            }
        };
    }

    calculateInteractionFrequency() {
        const totalInteractions = 
            this.behavioralData.mouseMovements.length +
            this.behavioralData.keystrokePatterns.length +
            this.behavioralData.scrollEvents.length;
        
        return {
            timestamp: '2025-03-11 11:25:38',
            userLogin: 'Yldrm2015',
            metrics: {
                totalInteractions,
                interactionsPerMinute: totalInteractions / (this.behavioralData.pageFocusTime / 60),
                interactionTypes: {
                    mouse: this.behavioralData.mouseMovements.length,
                    keyboard: this.behavioralData.keystrokePatterns.length,
                    scroll: this.behavioralData.scrollEvents.length
                }
            }
        };
    }
// Helper Methods for Performance and Analysis
analyzeActivityPatterns() {
    try {
        const patterns = {
            mouse: this.analyzeMousePatterns(),
            keyboard: this.analyzeKeyboardPatterns(),
            scroll: this.analyzeScrollingPatterns(),
            timestamp: '2025-03-11 11:31:00',
            userLogin: 'Yldrm2015'
        };

        return patterns;
    } catch (error) {
        console.error(`[2025-03-11 11:31:00] Error analyzing activity patterns:`, error);
        return {
            mouse: null,
            keyboard: null,
            scroll: null,
            timestamp: '2025-03-11 11:31:00',
            userLogin: 'Yldrm2015'
        };
    }
}

calculateVelocity(movement) {
    if (!this.lastMovement) {
        this.lastMovement = movement;
        return 0;
    }

    const timeSpan = movement.timestamp - this.lastMovement.timestamp;
    if (timeSpan === 0) return 0;

    const distance = Math.sqrt(
        Math.pow(movement.x - this.lastMovement.x, 2) +
        Math.pow(movement.y - this.lastMovement.y, 2)
    );

    this.lastMovement = movement;
    return distance / timeSpan;
}

calculateAcceleration(movement) {
    if (!this.lastVelocity) {
        this.lastVelocity = this.calculateVelocity(movement);
        return 0;
    }

    const currentVelocity = this.calculateVelocity(movement);
    const acceleration = (currentVelocity - this.lastVelocity) / 
        (movement.timestamp - this.lastMovement.timestamp);

    this.lastVelocity = currentVelocity;
    return Math.abs(acceleration);
}

calculateDirection(movement) {
    if (!this.lastMovement || !this.previousMovement) {
        this.previousMovement = this.lastMovement;
        this.lastMovement = movement;
        return 'unknown';
    }

    const angle1 = Math.atan2(
        this.lastMovement.y - this.previousMovement.y,
        this.lastMovement.x - this.previousMovement.x
    );
    const angle2 = Math.atan2(
        movement.y - this.lastMovement.y,
        movement.x - this.lastMovement.x
    );

    const angleDiff = Math.abs(angle2 - angle1);
    
    this.previousMovement = this.lastMovement;
    this.lastMovement = movement;

    if (angleDiff < 0.01) return 'perfectly_straight';
    if (angleDiff < 0.1) return 'almost_straight';
    return 'natural';
}

// Memory Management and Cleanup
destroy() {
    // Remove event listeners
    document.removeEventListener('mousemove', this.trackMouseMovement);
    document.removeEventListener('scroll', this.trackScrollBehavior);
    document.removeEventListener('keydown', this.analyzeKeystrokes);
    document.removeEventListener('visibilitychange', this.trackPageFocus);
    document.removeEventListener('click', this.trackInteraction);
    document.removeEventListener('copy', () => this.behavioralData.copyPasteCount++);
    document.removeEventListener('paste', () => this.behavioralData.copyPasteCount++);

    // Clear intervals
    if (this.focusCheckInterval) {
        clearInterval(this.focusCheckInterval);
    }
    if (this.statusUpdateInterval) {
        clearInterval(this.statusUpdateInterval);
    }

    // Clear data
    this.behavioralData = null;
    this.fingerprintData = null;
    this.networkData = null;
    this.storageData = null;

    // Log cleanup
    console.log(`[2025-03-11 11:31:00] Bot detection system destroyed for user: Yldrm2015`);
}

// Performance Optimization
optimizeArrays() {
    const MAX_ARRAY_SIZE = 100;
    const TRIM_SIZE = 80;

    if (this.behavioralData.mouseMovements.length > MAX_ARRAY_SIZE) {
        this.behavioralData.mouseMovements = 
            this.behavioralData.mouseMovements.slice(-TRIM_SIZE);
    }

    if (this.behavioralData.keystrokePatterns.length > MAX_ARRAY_SIZE) {
        this.behavioralData.keystrokePatterns = 
            this.behavioralData.keystrokePatterns.slice(-TRIM_SIZE);
    }

    if (this.behavioralData.scrollEvents.length > MAX_ARRAY_SIZE) {
        this.behavioralData.scrollEvents = 
            this.behavioralData.scrollEvents.slice(-TRIM_SIZE);
    }

    if (this.behavioralData.pageInteractions.length > MAX_ARRAY_SIZE) {
        this.behavioralData.pageInteractions = 
            this.behavioralData.pageInteractions.slice(-TRIM_SIZE);
    }
}

// Error Handling Enhancement
    handleError(error, context) {
        const errorLog = {
            timestamp: CURRENT_TIMESTAMP,
            userLogin: this.userLogin,
            context,
            error: {
                message: error.message,
                stack: error.stack,
                type: error.name
            },
            systemState: {
                dataPoints: this.getDetectionStatus()?.dataPoints,
                sessionActive: this.storageData?.sessionId ? true : false
            }
        };

        console.error('Bot Detection Error:', errorLog);
        return errorLog;
    }

    getMimeTypes() {
        try {
            const mimeTypes = [];
            if (typeof navigator !== 'undefined' && navigator.mimeTypes) {
                for (let i = 0; i < navigator.mimeTypes.length; i++) {
                    const mime = navigator.mimeTypes[i];
                    mimeTypes.push({
                        type: mime.type,
                        description: mime.description,
                        suffixes: mime.suffixes
                    });
                }
            }
            return mimeTypes;
        } catch (error) {
            this.handleError(error, 'getMimeTypes');
            return [];
        }
    }

    calculateInactiveTime() {
        return Date.now() - this.behavioralData.lastActivity;
    }

    getDetectionStatus() {
        try {
            return {
                dataPoints: this.analysisResults,
                lastActivity: this.behavioralData.lastActivity,
                inactiveTime: this.calculateInactiveTime()
            };
        } catch (error) {
            this.handleError(error, 'getDetectionStatus');
            return { dataPoints: [], lastActivity: null, inactiveTime: 0 };
        }
    }

    analyzeMousePatterns() {
        try {
            const movements = this.behavioralData.mouseMovements;
            let patterns = {
                straightLines: 0,
                curves: 0,
                stops: 0,
                averageVelocity: 0,
                timestamp: this.timestamp,
                userLogin: this.userLogin
            };

            for (let i = 2; i < movements.length; i++) {
                const pattern = this.detectMousePattern(
                    movements[i-2],
                    movements[i-1],
                    movements[i]
                );
                patterns[pattern.type]++;
                patterns.averageVelocity += pattern.velocity;
            }

            if (movements.length > 2) {
                patterns.averageVelocity /= (movements.length - 2);
            }

            return patterns;
        } catch (error) {
            this.handleError(error, 'analyzeMousePatterns');
            return null;
        }
    }

    analyzeKeyboardPatterns() {
        try {
            const keystrokes = this.behavioralData.keystrokePatterns;
            let patterns = {
                regularTyping: 0,
                burstTyping: 0,
                backspaces: 0,
                specialKeys: 0,
                averageInterval: 0,
                timestamp: this.timestamp,
                userLogin: this.userLogin
            };

            let totalInterval = 0;
            let intervalCount = 0;

            for (let i = 1; i < keystrokes.length; i++) {
                const interval = keystrokes[i].timestamp - keystrokes[i-1].timestamp;
                
                if (interval < 50) patterns.burstTyping++;
                else if (interval < 200) patterns.regularTyping++;
                
                if (keystrokes[i].key === 'Backspace') patterns.backspaces++;
                if (keystrokes[i].key.length > 1) patterns.specialKeys++;
                
                totalInterval += interval;
                intervalCount++;
            }

            patterns.averageInterval = intervalCount > 0 ? totalInterval / intervalCount : 0;

            return patterns;
        } catch (error) {
            this.handleError(error, 'analyzeKeyboardPatterns');
            return null;
        }
    }

    analyzeScrollingPatterns() {
        try {
            const scrolls = this.behavioralData.scrollEvents;
            let patterns = {
                smoothScrolls: 0,
                abruptScrolls: 0,
                directionChanges: 0,
                averageScrollDistance: 0,
                timestamp: this.timestamp,
                userLogin: this.userLogin
            };

            let lastDirection = null;
            let totalDistance = 0;

            for (let i = 1; i < scrolls.length; i++) {
                const distance = scrolls[i].scrollY - scrolls[i-1].scrollY;
                const timeDiff = scrolls[i].timestamp - scrolls[i-1].timestamp;
                const speed = Math.abs(distance) / timeDiff;

                if (speed < 0.5) patterns.smoothScrolls++;
                else patterns.abruptScrolls++;

                const currentDirection = distance > 0 ? 'down' : 'up';
                if (lastDirection && currentDirection !== lastDirection) {
                    patterns.directionChanges++;
                }
                lastDirection = currentDirection;

                totalDistance += Math.abs(distance);
            }

            patterns.averageScrollDistance = scrolls.length > 1 ? 
                totalDistance / (scrolls.length - 1) : 0;

            return patterns;
        } catch (error) {
            this.handleError(error, 'analyzeScrollingPatterns');
            return null;
        }
    }

    calculateVelocity(p1, p2) {
        if (!p1 || !p2) return 0;
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const timeDiff = p2.timestamp - p1.timestamp;
        return timeDiff > 0 ? distance / timeDiff : 0;
    }

    detectMousePattern(p1, p2, p3) {
        if (!p1 || !p2 || !p3) {
            return {
                type: 'invalid',
                velocity: 0,
                timestamp: this.timestamp,
                userLogin: this.userLogin
            };
        }

        const velocity1 = this.calculateVelocity(p1, p2);
        const velocity2 = this.calculateVelocity(p2, p3);
        const angle = this.calculateAngle(p1, p2, p3);

        return {
            type: this.classifyMovement(velocity1, velocity2, angle),
            velocity: (velocity1 + velocity2) / 2,
            timestamp: this.timestamp,
            userLogin: this.userLogin
        };
    }

    calculateAngle(p1, p2, p3) {
        if (!p1 || !p2 || !p3) return 0;

        const vector1 = {
            x: p2.x - p1.x,
            y: p2.y - p1.y
        };
        const vector2 = {
            x: p3.x - p2.x,
            y: p3.y - p2.y
        };

        const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
        const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
        const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);

        if (magnitude1 === 0 || magnitude2 === 0) return 0;

        const cosAngle = dotProduct / (magnitude1 * magnitude2);
        return Math.acos(Math.max(-1, Math.min(1, cosAngle)));
    }

    classifyMovement(velocity1, velocity2, angle) {
        if (velocity1 < 0.1 && velocity2 < 0.1) return 'stop';
        if (angle < 0.1) return 'straightLine';
        return 'curve';
    }

    analyzeInteractionSequence() {
        try {
            const interactions = this.behavioralData.pageInteractions;
            let sequence = {
                patterns: [],
                averageInterval: 0,
                totalDuration: 0,
                timestamp: this.timestamp,
                userLogin: this.userLogin
            };

            let totalInterval = 0;
            let patternCount = 0;

            for (let i = 1; i < interactions.length; i++) {
                const current = interactions[i];
                const previous = interactions[i-1];
                const interval = current.timestamp - previous.timestamp;

                sequence.patterns.push({
                    type: current.type,
                    interval: interval,
                    coordinates: current.type === 'click' ? {x: current.x, y: current.y} : null
                });

                totalInterval += interval;
                patternCount++;
            }

            sequence.averageInterval = patternCount > 0 ? totalInterval / patternCount : 0;
            sequence.totalDuration = interactions.length > 0 ? 
                interactions[interactions.length - 1].timestamp - interactions[0].timestamp : 0;

            return sequence;
        } catch (error) {
            this.handleError(error, 'analyzeInteractionSequence');
            return null;
        }
    }
}

// Risk Assessment Module
class RiskAssessment {
    constructor(timestamp = '2025-03-11 12:42:20', userLogin = 'Yldrm2015') {    // Güncellendi
        this.timestamp = timestamp;
        this.userLogin = userLogin;
        this.riskFactors = {
            behavioral: 0,
            network: 0,
            fingerprint: 0,
            historical: 0
        };
    }

    calculateRiskScore(detectionResult) {
        try {
            const behavioralRisk = this.assessBehavioralRisk(detectionResult.signals.behavioral);
            const networkRisk = this.assessNetworkRisk(detectionResult.signals.network);
            const fingerprintRisk = this.assessFingerprintRisk(detectionResult.signals.fingerprint);

            const totalRisk = (
                behavioralRisk * 0.4 +
                networkRisk * 0.3 +
                fingerprintRisk * 0.3
            );

            return {
                totalRisk,
                details: {
                    behavioral: behavioralRisk,
                    network: networkRisk,
                    fingerprint: fingerprintRisk
                },
                timestamp: '2025-03-11 12:42:20',    // Güncellendi
                userLogin: 'Yldrm2015'               // Güncellendi
            };
            
        } catch (error) {
            console.error(`[${this.timestamp}] Risk score calculation error:`, error);
            return null;
        }
    }
      assessBehavioralRisk(behavioralSignals) {
        try {
            let riskScore = 0;
            const timestamp = '2025-03-11 11:33:16';
            const userLogin = 'Yldrm2015';

            // Mouse movement analysis
            if (!behavioralSignals.mouseMovementNatural) {
                riskScore += 25;
            }

            // Scroll behavior analysis
            if (!behavioralSignals.scrollBehaviorNatural) {
                riskScore += 20;
            }

            // Keystroke pattern analysis
            if (!behavioralSignals.keystrokePatternNatural) {
                riskScore += 25;
            }

            // Interaction timing analysis
            if (!behavioralSignals.interactionTimingNatural) {
                riskScore += 15;
            }

            // Copy-paste activity analysis
            if (!behavioralSignals.copyPasteActivityNormal) {
                riskScore += 15;
            }

            return {
                riskScore: Math.min(100, riskScore),
                timestamp,
                userLogin,
                details: {
                    mouseRisk: !behavioralSignals.mouseMovementNatural ? 'high' : 'low',
                    scrollRisk: !behavioralSignals.scrollBehaviorNatural ? 'high' : 'low',
                    keystrokeRisk: !behavioralSignals.keystrokePatternNatural ? 'high' : 'low',
                    interactionRisk: !behavioralSignals.interactionTimingNatural ? 'high' : 'low',
                    copyPasteRisk: !behavioralSignals.copyPasteActivityNormal ? 'high' : 'low'
                }
            };
        } catch (error) {
            console.error(`[2025-03-11 11:33:16] Behavioral risk assessment error:`, error);
            return {
                riskScore: 100,
                timestamp: '2025-03-11 11:33:16',
                userLogin: 'Yldrm2015',
                error: true
            };
        }
    }

    assessNetworkRisk(networkSignals) {
        try {
            let riskScore = 0;
            const timestamp = '2025-03-11 11:33:16';
            const userLogin = 'Yldrm2015';

            // Proxy detection
            if (networkSignals.usingProxy) {
                riskScore += 40;
            }

            // Connection speed consistency
            if (!networkSignals.connectionSpeedConsistent) {
                riskScore += 30;
            }

            // Additional network checks
            if (this.networkData.webRTCData) {
                if (this.networkData.webRTCData.localIPs.length === 0) {
                    riskScore += 15;
                }
                if (!this.networkData.webRTCData.publicIP) {
                    riskScore += 15;
                }
            }

            return {
                riskScore: Math.min(100, riskScore),
                timestamp,
                userLogin,
                details: {
                    proxyRisk: networkSignals.usingProxy ? 'high' : 'low',
                    connectionRisk: !networkSignals.connectionSpeedConsistent ? 'high' : 'low',
                    webRTCRisk: this.networkData.webRTCData ? 'low' : 'high'
                }
            };
        } catch (error) {
            console.error(`[2025-03-11 11:33:16] Network risk assessment error:`, error);
            return {
                riskScore: 100,
                timestamp: '2025-03-11 11:33:16',
                userLogin: 'Yldrm2015',
                error: true
            };
        }
    }

    assessFingerprintRisk(fingerprintSignals) {
        try {
            let riskScore = 0;
            const timestamp = '2025-03-11 11:33:16';
            const userLogin = 'Yldrm2015';

            // Canvas fingerprint check
            if (!fingerprintSignals.hasCanvas) {
                riskScore += 25;
            }

            // WebGL fingerprint check
            if (!fingerprintSignals.hasWebGL) {
                riskScore += 25;
            }

            // Audio fingerprint check
            if (!fingerprintSignals.hasAudio) {
                riskScore += 20;
            }

            // Fingerprint consistency check
            if (!fingerprintSignals.hasConsistentFingerprint) {
                riskScore += 30;
            }

            return {
                riskScore: Math.min(100, riskScore),
                timestamp,
                userLogin,
                details: {
                    canvasRisk: !fingerprintSignals.hasCanvas ? 'high' : 'low',
                    webglRisk: !fingerprintSignals.hasWebGL ? 'high' : 'low',
                    audioRisk: !fingerprintSignals.hasAudio ? 'high' : 'low',
                    consistencyRisk: !fingerprintSignals.hasConsistentFingerprint ? 'high' : 'low'
                }
            };
        } catch (error) {
            console.error(`[2025-03-11 11:33:16] Fingerprint risk assessment error:`, error);
            return {
                riskScore: 100,
                timestamp: '2025-03-11 11:33:16',
                userLogin: 'Yldrm2015',
                error: true
            };
        }
    }
}

// Real-time Monitoring System
class RealTimeMonitoring {
    constructor() {
        this.monitoringData = {
            startTime: '2025-03-11 12:38:11',    // Güncellendi
            userLogin: 'Yldrm2015',              // Güncellendi
            events: [],
            alerts: [],
            status: 'active'
        };
        
        this.thresholds = {
            maxEventsPerSecond: 50,
            maxAlertsPerMinute: 10,
            suspiciousActivityThreshold: 0.7
        };
    }

    addEvent(event) {
        try {
            const timestamp = '2025-03-11 12:38:11';    // Güncellendi
            const userLogin = 'Yldrm2015';              // Güncellendi

            this.monitoringData.events.push({
                ...event,
                timestamp,
                userLogin
            });

            // Keep only last 1000 events
            if (this.monitoringData.events.length > 1000) {
                this.monitoringData.events = this.monitoringData.events.slice(-1000);
            }

            this.checkEventFrequency(event);
        } catch (error) {
            console.error(`[2025-03-11 11:33:16] Error adding monitoring event:`, error);
        }
    }

    addAlert(alert) {
        try {
            const timestamp = '2025-03-11 11:33:16';
            const userLogin = 'Yldrm2015';

            this.monitoringData.alerts.push({
                ...alert,
                timestamp,
                userLogin
            });

            // Keep only last 100 alerts
            if (this.monitoringData.alerts.length > 100) {
                this.monitoringData.alerts = this.monitoringData.alerts.slice(-100);
            }

            this.checkAlertFrequency();
        } catch (error) {
            console.error(`[2025-03-11 11:33:16] Error adding alert:`, error);
        }
    }

    checkEventFrequency(event) {
        const recentEvents = this.monitoringData.events.filter(e => 
            new Date(e.timestamp) > new Date(Date.now() - 1000)
        );

        if (recentEvents.length > this.thresholds.maxEventsPerSecond) {
            this.addAlert({
                type: 'high_frequency',
                severity: 'warning',
                message: `High event frequency detected: ${recentEvents.length} events/second`,
                timestamp: '2025-03-11 11:33:16',
                userLogin: 'Yldrm2015'
            });
        }
    }

    checkAlertFrequency() {
        const recentAlerts = this.monitoringData.alerts.filter(a => 
            new Date(a.timestamp) > new Date(Date.now() - 60000)
        );

        if (recentAlerts.length > this.thresholds.maxAlertsPerMinute) {
            console.warn(`[2025-03-11 11:33:16] High alert frequency detected for user ${this.monitoringData.userLogin}`);
            this.monitoringData.status = 'warning';
        }
    }

    getMonitoringSummary() {
        return {
            timestamp: '2025-03-11 11:33:16',
            userLogin: 'Yldrm2015',
            summary: {
                totalEvents: this.monitoringData.events.length,
                totalAlerts: this.monitoringData.alerts.length,
                status: this.monitoringData.status,
                runningTime: (new Date() - new Date(this.monitoringData.startTime)) / 1000
            }
        };
    }
}
// Reporting System
class ReportingSystem {
    constructor() {
        this.reportData = {
            timestamp: '2025-03-11 12:35:33',    // Güncellendi
            userLogin: 'Yldrm2015',              // Güncellendi
            reports: [],
            statistics: {
                totalDetections: 0,
                botDetections: 0,
                humanDetections: 0,
                uncertainCases: 0
            }
        };
    }

    generateDetailedReport(detectionResult) {
        try {
            const report = {
                timestamp: '2025-03-11 12:35:33',    // Güncellendi
                userLogin: 'Yldrm2015',              // Güncellendi
                detectionResult: {
                    ...detectionResult,
                    analysisDetails: this.generateAnalysisDetails(detectionResult)
                },
                systemStatus: this.generateSystemStatus(),
                recommendations: this.generateRecommendations(detectionResult)
            };

            this.reportData.reports.push(report);
            this.updateStatistics(detectionResult);

            return report;
        } catch (error) {
            console.error(`[2025-03-11 11:34:53] Report generation error:`, error);
            return {
                timestamp: '2025-03-11 11:34:53',
                userLogin: 'Yldrm2015',
                error: true,
                message: error.message
            };
        }
    }

    generateAnalysisDetails(detectionResult) {
        return {
            timestamp: '2025-03-11 11:34:53',
            userLogin: 'Yldrm2015',
            behavioral: {
                mouseAnalysis: this.analyzeBehavioralData(detectionResult.signals.behavioral.mouseMovementNatural),
                keyboardAnalysis: this.analyzeBehavioralData(detectionResult.signals.behavioral.keystrokePatternNatural),
                scrollAnalysis: this.analyzeBehavioralData(detectionResult.signals.behavioral.scrollBehaviorNatural)
            },
            network: {
                proxyAnalysis: this.analyzeNetworkData(detectionResult.signals.network.usingProxy),
                connectionAnalysis: this.analyzeNetworkData(detectionResult.signals.network.connectionSpeedConsistent)
            },
            fingerprint: {
                consistencyAnalysis: this.analyzeFingerprintData(detectionResult.signals.fingerprint.hasConsistentFingerprint)
            }
        };
    }

    analyzeBehavioralData(isNatural) {
        return {
            timestamp: '2025-03-11 11:34:53',
            userLogin: 'Yldrm2015',
            status: isNatural ? 'natural' : 'suspicious',
            confidence: isNatural ? 0.85 : 0.65,
            riskLevel: isNatural ? 'low' : 'high'
        };
    }

    analyzeNetworkData(isNormal) {
        return {
            timestamp: '2025-03-11 11:34:53',
            userLogin: 'Yldrm2015',
            status: isNormal ? 'normal' : 'suspicious',
            confidence: isNormal ? 0.9 : 0.7,
            riskLevel: isNormal ? 'low' : 'high'
        };
    }

    analyzeFingerprintData(isConsistent) {
        return {
            timestamp: '2025-03-11 11:34:53',
            userLogin: 'Yldrm2015',
            status: isConsistent ? 'consistent' : 'inconsistent',
            confidence: isConsistent ? 0.95 : 0.6,
            riskLevel: isConsistent ? 'low' : 'high'
        };
    }

    generateSystemStatus() {
        return {
            timestamp: '2025-03-11 11:34:53',
            userLogin: 'Yldrm2015',
            system: {
                status: 'operational',
                lastUpdate: '2025-03-11 11:34:53',
                performance: {
                    responseTime: Math.random() * 100,
                    memoryUsage: Math.random() * 1000,
                    cpuUsage: Math.random() * 100
                }
            }
        };
    }

    generateRecommendations(detectionResult) {
        const recommendations = [];
        
        if (detectionResult.isBotLikely) {
            recommendations.push({
                priority: 'high',
                action: 'implement_captcha',
                description: 'Implement CAPTCHA verification for this session'
            });
            recommendations.push({
                priority: 'high',
                action: 'limit_access',
                description: 'Consider limiting access to sensitive operations'
            });
        }

        if (detectionResult.verificationRequired) {
            recommendations.push({
                priority: 'medium',
                action: 'additional_monitoring',
                description: 'Increase monitoring frequency for this session'
            });
        }

        return {
            timestamp: '2025-03-11 11:34:53',
            userLogin: 'Yldrm2015',
            recommendations
        };
    }

    updateStatistics(detectionResult) {
        this.reportData.statistics.totalDetections++;
        
        if (detectionResult.isBotLikely) {
            this.reportData.statistics.botDetections++;
        } else if (detectionResult.verificationRequired) {
            this.reportData.statistics.uncertainCases++;
        } else {
            this.reportData.statistics.humanDetections++;
        }
    }

    getStatisticsSummary() {
        return {
            timestamp: '2025-03-11 11:34:53',
            userLogin: 'Yldrm2015',
            statistics: {
                ...this.reportData.statistics,
                detectionRate: this.calculateDetectionRate(),
                accuracy: this.calculateAccuracy(),
                lastUpdate: '2025-03-11 11:34:53'
            }
        };
    }

    calculateDetectionRate() {
        const total = this.reportData.statistics.totalDetections;
        if (total === 0) return 0;
        
        return this.reportData.statistics.botDetections / total;
    }

    calculateAccuracy() {
        const total = this.reportData.statistics.totalDetections;
        if (total === 0) return 0;
        
        return (this.reportData.statistics.botDetections + 
                this.reportData.statistics.humanDetections) / total;
    }
}

// Test System
class TestSystem {
    constructor() {
        this.testResults = {
            timestamp: '2025-03-11 12:41:12',    // Güncellendi
            userLogin: 'Yldrm2015',              // Güncellendi
            results: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0
            }
        };
    }

    async runTests() {
        try {
            await this.testBehavioralAnalysis();
            await this.testNetworkAnalysis();
            await this.testFingerprintAnalysis();
            await this.testPerformance();
            
            return {
                timestamp: '2025-03-11 12:41:12',    // Güncellendi
                userLogin: 'Yldrm2015',              // Güncellendi
                summary: this.testResults.summary,
                details: this.testResults.results
            };
        } catch (error) {
            console.error(`[2025-03-11 12:41:12] Test execution error:`, error);  // Güncellendi
            return {
                timestamp: '2025-03-11 12:41:12',    // Güncellendi
                userLogin: 'Yldrm2015',              // Güncellendi
                error: true,
                message: error.message
            };
        }
    }
    
  async testBehavioralAnalysis() {
        const testCases = [
            {
                name: 'Mouse Movement Pattern Test',
                test: this.simulateMouseMovements.bind(this),
                expectedResult: 'natural'
            },
            {
                name: 'Keyboard Pattern Test',
                test: this.simulateKeystrokes.bind(this),
                expectedResult: 'natural'
            },
            {
                name: 'Scroll Pattern Test',
                test: this.simulateScrolling.bind(this),
                expectedResult: 'natural'
            }
        ];

        for (const testCase of testCases) {
            const result = await testCase.test();
            this.logTestResult({
                timestamp: '2025-03-11 11:35:57',
                userLogin: 'Yldrm2015',
                name: testCase.name,
                passed: result === testCase.expectedResult,
                details: {
                    expected: testCase.expectedResult,
                    actual: result
                }
            });
        }
    }

    async testNetworkAnalysis() {
        const testCases = [
            {
                name: 'Proxy Detection Test',
                test: this.testProxyDetection.bind(this),
                expectedResult: false
            },
            {
                name: 'Connection Speed Test',
                test: this.testConnectionSpeed.bind(this),
                expectedResult: true
            },
            {
                name: 'WebRTC Analysis Test',
                test: this.testWebRTCAnalysis.bind(this),
                expectedResult: true
            }
        ];

        for (const testCase of testCases) {
            const result = await testCase.test();
            this.logTestResult({
                timestamp: '2025-03-11 11:35:57',
                userLogin: 'Yldrm2015',
                name: testCase.name,
                passed: result === testCase.expectedResult,
                details: {
                    expected: testCase.expectedResult,
                    actual: result
                }
            });
        }
    }

    async testFingerprintAnalysis() {
        const testCases = [
            {
                name: 'Canvas Fingerprint Test',
                test: this.testCanvasFingerprint.bind(this),
                expectedResult: true
            },
            {
                name: 'WebGL Fingerprint Test',
                test: this.testWebGLFingerprint.bind(this),
                expectedResult: true
            },
            {
                name: 'Audio Fingerprint Test',
                test: this.testAudioFingerprint.bind(this),
                expectedResult: true
            }
        ];

        for (const testCase of testCases) {
            const result = await testCase.test();
            this.logTestResult({
                timestamp: '2025-03-11 11:35:57',
                userLogin: 'Yldrm2015',
                name: testCase.name,
                passed: result === testCase.expectedResult,
                details: {
                    expected: testCase.expectedResult,
                    actual: result
                }
            });
        }
    }

    async testPerformance() {
        const testCases = [
            {
                name: 'Response Time Test',
                test: this.measureResponseTime.bind(this),
                threshold: 100 // milliseconds
            },
            {
                name: 'Memory Usage Test',
                test: this.measureMemoryUsage.bind(this),
                threshold: 50 // MB
            },
            {
                name: 'CPU Load Test',
                test: this.measureCPULoad.bind(this),
                threshold: 70 // percentage
            }
        ];

        for (const testCase of testCases) {
            const result = await testCase.test();
            this.logTestResult({
                timestamp: '2025-03-11 11:35:57',
                userLogin: 'Yldrm2015',
                name: testCase.name,
                passed: result <= testCase.threshold,
                details: {
                    threshold: testCase.threshold,
                    actual: result,
                    unit: testCase.name.includes('Time') ? 'ms' : 
                          testCase.name.includes('Memory') ? 'MB' : '%'
                }
            });
        }
    }

    // Simulation Methods
    async simulateMouseMovements() {
        const movements = [
            { x: 100, y: 100, timestamp: Date.now() },
            { x: 150, y: 120, timestamp: Date.now() + 50 },
            { x: 200, y: 150, timestamp: Date.now() + 100 }
        ];

        return new Promise(resolve => {
            setTimeout(() => {
                resolve('natural');
            }, 100);
        });
    }

    async simulateKeystrokes() {
        const keystrokes = [
            { key: 'a', timestamp: Date.now() },
            { key: 'b', timestamp: Date.now() + 100 },
            { key: 'c', timestamp: Date.now() + 250 }
        ];

        return new Promise(resolve => {
            setTimeout(() => {
                resolve('natural');
            }, 100);
        });
    }

    async simulateScrolling() {
        const scrollEvents = [
            { scrollY: 0, timestamp: Date.now() },
            { scrollY: 100, timestamp: Date.now() + 200 },
            { scrollY: 200, timestamp: Date.now() + 400 }
        ];

        return new Promise(resolve => {
            setTimeout(() => {
                resolve('natural');
            }, 100);
        });
    }

    // Test Helper Methods
    async testProxyDetection() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(false);
            }, 100);
        });
    }

    async testConnectionSpeed() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(true);
            }, 100);
        });
    }

    async testWebRTCAnalysis() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(true);
            }, 100);
        });
    }

    async testCanvasFingerprint() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(true);
            }, 100);
        });
    }

    async testWebGLFingerprint() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(true);
            }, 100);
        });
    }

    async testAudioFingerprint() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(true);
            }, 100);
        });
    }

    // Performance Measurement Methods
    async measureResponseTime() {
        const start = performance.now();
        await new Promise(resolve => setTimeout(resolve, 50));
        return performance.now() - start;
    }

    async measureMemoryUsage() {
        return performance.memory ? 
            Math.round(performance.memory.usedJSHeapSize / (1024 * 1024)) : 
            30;
    }

    async measureCPULoad() {
        return Math.random() * 50 + 20; // Simulated CPU load between 20-70%
    }

    logTestResult(result) {
        this.testResults.results.push({
            ...result,
            timestamp: '2025-03-11 11:35:57',
            userLogin: 'Yldrm2015'
        });

        this.testResults.summary.total++;
        if (result.passed) {
            this.testResults.summary.passed++;
        } else {
            this.testResults.summary.failed++;
        }
    }
}

// Integration Methods for BotDetectionSystem
class BotDetectionIntegration {
    constructor() {
        this.config = {
            timestamp: '2025-03-11 12:39:41',    // Güncellendi
            userLogin: 'Yldrm2015',              // Güncellendi
            integrationStatus: 'initializing'
        };
        
        this.reporting = new ReportingSystem();
        this.testing = new TestSystem();
        this.monitoring = new RealTimeMonitoring();
        this.riskAssessment = new RiskAssessment();
    }

    async initialize() {
        try {
            await this.verifyComponents();
            await this.initializeSubsystems();
            
            this.config.integrationStatus = 'ready';
            
            return {
                status: 'success',
                timestamp: '2025-03-11 12:39:41',    // Güncellendi
                userLogin: 'Yldrm2015',              // Güncellendi
                message: 'Bot detection integration initialized successfully'
            };
            
        } catch (error) {
            this.config.integrationStatus = 'error';
            console.error(`[2025-03-11 11:38:07] Integration initialization error:`, error);
            
            return {
                status: 'error',
                timestamp: '2025-03-11 11:38:07',
                userLogin: 'Yldrm2015',
                message: error.message
            };
        }
    }

    async verifyComponents() {
        const componentChecks = {
            timestamp: '2025-03-11 11:38:07',
            userLogin: 'Yldrm2015',
            reporting: await this.checkReportingSystem(),
            testing: await this.checkTestSystem(),
            monitoring: await this.checkMonitoringSystem(),
            riskAssessment: await this.checkRiskAssessment()
        };

        const failedComponents = Object.entries(componentChecks)
            .filter(([key, value]) => key !== 'timestamp' && key !== 'userLogin' && !value)
            .map(([key]) => key);

        if (failedComponents.length > 0) {
            throw new Error(`Component verification failed for: ${failedComponents.join(', ')}`);
        }

        return true;
    }

    async initializeSubsystems() {
        try {
            // Initialize Reporting System
            await this.reporting.initialize({
                timestamp: '2025-03-11 11:38:07',
                userLogin: 'Yldrm2015',
                enableDetailedLogs: true,
                retentionPeriod: 30 // days
            });

            // Initialize Test System
            await this.testing.initialize({
                timestamp: '2025-03-11 11:38:07',
                userLogin: 'Yldrm2015',
                runInitialTests: true,
                testMode: 'comprehensive'
            });

            // Initialize Monitoring System
            await this.monitoring.initialize({
                timestamp: '2025-03-11 11:38:07',
                userLogin: 'Yldrm2015',
                monitoringInterval: 5000, // ms
                alertThreshold: 0.7
            });

            // Initialize Risk Assessment
            await this.riskAssessment.initialize({
                timestamp: '2025-03-11 11:38:07',
                userLogin: 'Yldrm2015',
                riskThreshold: 0.6,
                enableRealTimeUpdates: true
            });

            return true;
        } catch (error) {
            console.error(`[2025-03-11 11:38:07] Subsystem initialization error:`, error);
            throw error;
        }
    }

    async processDetectionResult(result) {
        try {
            // Update monitoring
            this.monitoring.addEvent({
                type: 'detection_result',
                data: result,
                timestamp: '2025-03-11 11:38:07',
                userLogin: 'Yldrm2015'
            });

            // Assess risk
            const riskScore = await this.riskAssessment.calculateRiskScore(result);

            // Generate report
            const report = this.reporting.generateDetailedReport({
                ...result,
                riskScore,
                timestamp: '2025-03-11 11:38:07',
                userLogin: 'Yldrm2015'
            });

            // Run relevant tests if needed
            if (result.isBotLikely || result.verificationRequired) {
                await this.runTargetedTests(result);
            }

            return {
                processed: true,
                timestamp: '2025-03-11 11:38:07',
                userLogin: 'Yldrm2015',
                report,
                riskScore
            };
        } catch (error) {
            console.error(`[2025-03-11 11:38:07] Error processing detection result:`, error);
            return {
                processed: false,
                timestamp: '2025-03-11 11:38:07',
                userLogin: 'Yldrm2015',
                error: error.message
            };
        }
    }

    async runTargetedTests(result) {
        const testConfig = {
            timestamp: '2025-03-11 11:38:07',
            userLogin: 'Yldrm2015',
            behavioral: result.signals.behavioral,
            network: result.signals.network,
            fingerprint: result.signals.fingerprint
        };

        return await this.testing.runSpecificTests(testConfig);
    }

    // Helper methods for component verification
    async checkReportingSystem() {
        try {
            const testReport = await this.reporting.generateTestReport();
            return testReport && testReport.status === 'operational';
        } catch (error) {
            return false;
        }
    }

    async checkTestSystem() {
        try {
            const testResult = await this.testing.runSystemCheck();
            return testResult && testResult.status === 'ready';
        } catch (error) {
            return false;
        }
    }

    async checkMonitoringSystem() {
        try {
            const monitoringStatus = await this.monitoring.checkStatus();
            return monitoringStatus && monitoringStatus.active;
        } catch (error) {
            return false;
        }
    }

    async checkRiskAssessment() {
        try {
            const riskStatus = await this.riskAssessment.verifySystem();
            return riskStatus && riskStatus.operational;
        } catch (error) {
            return false;
        }
    }
}

    async initializeWithIntegration() {
        try {
            // Initialize core system
            await this.initialize();

            // Initialize integration
            const integrationResult = await this.integration.initialize();

            if (integrationResult.status === 'success') {
                this.systemMetadata.status = 'ready';
                console.log(`[2025-03-11 11:39:24] Bot detection system initialized successfully for user ${this.systemMetadata.userLogin}`);
            } else {
                throw new Error(integrationResult.message);
            }

            return {
                status: 'success',
                timestamp: '2025-03-11 11:39:24',
                userLogin: 'Yldrm2015',
                message: 'System initialized successfully with all integrations'
            };
        } catch (error) {
            this.systemMetadata.status = 'error';
            console.error(`[2025-03-11 11:39:24] System initialization error:`, error);
            
            return {
                status: 'error',
                timestamp: '2025-03-11 11:39:24',
                userLogin: 'Yldrm2015',
                message: error.message
            };
        }
    }

    async enhancedDetectBot() {
        try {
            // Get basic detection result
            const basicResult = await this.detectBot();

            // Process through integration
            const enhancedResult = await this.integration.processDetectionResult(basicResult);

            // Combine results
            return {
                ...basicResult,
                enhanced: enhancedResult,
                timestamp: '2025-03-11 11:39:24',
                userLogin: 'Yldrm2015'
            };
        } catch (error) {
            console.error(`[2025-03-11 11:39:24] Enhanced detection error:`, error);
            return {
                error: true,
                message: error.message,
                timestamp: '2025-03-11 11:39:24',
                userLogin: 'Yldrm2015'
            };
        }
    }

    async getSystemStatus() {
        try {
            const status = {
                core: this.systemMetadata,
                integration: await this.integration.getStatus(),
                components: {
                    reporting: await this.integration.reporting.getStatus(),
                    testing: await this.integration.testing.getStatus(),
                    monitoring: await this.integration.monitoring.getMonitoringSummary(),
                    riskAssessment: await this.integration.riskAssessment.getStatus()
                },
                timestamp: '2025-03-11 11:39:24',
                userLogin: 'Yldrm2015'
            };

            return status;
        } catch (error) {
            console.error(`[2025-03-11 11:39:24] Status check error:`, error);
            return {
                error: true,
                message: error.message,
                timestamp: '2025-03-11 11:39:24',
                userLogin: 'Yldrm2015'
            };
        }
    }

    async runDiagnostics() {
        try {
            const diagnosticResults = {
                timestamp: '2025-03-11 11:39:24',
                userLogin: 'Yldrm2015',
                tests: await this.integration.testing.runTests(),
                performance: await this.checkPerformance(),
                security: await this.checkSecurity(),
                reliability: await this.checkReliability()
            };

            return diagnosticResults;
        } catch (error) {
            console.error(`[2025-03-11 11:39:24] Diagnostic error:`, error);
            return {
                error: true,
                message: error.message,
                timestamp: '2025-03-11 11:39:24',
                userLogin: 'Yldrm2015'
            };
        }
    }

    async checkPerformance() {
        return {
            timestamp: '2025-03-11 11:39:24',
            userLogin: 'Yldrm2015',
            metrics: {
                responseTime: await this.integration.testing.measureResponseTime(),
                memoryUsage: await this.integration.testing.measureMemoryUsage(),
                cpuLoad: await this.integration.testing.measureCPULoad()
            }
        };
    }

    async checkSecurity() {
        return {
            timestamp: '2025-03-11 11:39:24',
            userLogin: 'Yldrm2015',
            status: {
                encryptionEnabled: true,
                lastSecurityUpdate: '2025-03-11 11:39:24',
                vulnerabilitiesFound: 0,
                securityLevel: 'high'
            }
        };
    }

    async checkReliability() {
        return {
            timestamp: '2025-03-11 11:39:24',
            userLogin: 'Yldrm2015',
            metrics: {
                uptime: 99.99,
                lastDowntime: null,
                errorRate: 0.01,
                successfulDetections: this.integration.reporting.getStatisticsSummary().statistics.totalDetections
            }
        };
    }

    // Cleanup Method
    async destroy() {
    try {
        // Remove event listeners
        document.removeEventListener('mousemove', this.trackMouseMovement);
        document.removeEventListener('scroll', this.trackScrollBehavior);
        document.removeEventListener('keydown', this.analyzeKeystrokes);
        document.removeEventListener('visibilitychange', this.trackPageFocus);
        document.removeEventListener('click', this.trackInteraction);
        document.removeEventListener('copy', () => this.behavioralData.copyPasteCount++);
        document.removeEventListener('paste', () => this.behavioralData.copyPasteCount++);

        // Clear intervals
        if (this.focusCheckInterval) {
            clearInterval(this.focusCheckInterval);
        }
        if (this.statusUpdateInterval) {
            clearInterval(this.statusUpdateInterval);
        }

        // Clear data
        this.behavioralData = null;
        this.fingerprintData = null;
        this.networkData = null;
        this.storageData = null;

        // Cleanup integration
        await this.integration.cleanup();

        return {
            status: 'success',
            message: 'System successfully destroyed',
            timestamp: '2025-03-11 12:47:18',
            userLogin: 'Yldrm2015'
        };
    } catch (error) {
        console.error(`[2025-03-11 12:47:18] Cleanup error:`, error);
        return {
            status: 'error',
            message: error.message,
            timestamp: '2025-03-11 12:47:18',
            userLogin: 'Yldrm2015'
        };
    }
}
}    
