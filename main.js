// Initialize canvas and context
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const loadingScreen = document.getElementById('loading');

// Loading state
let loadCounter = 0;

// Layer images
const background = new Image();
const didot = new Image();
const shadow = new Image();
const man = new Image();
const headlines = new Image();
const title = new Image();
const frame = new Image();
const gloss = new Image();

// Layer configuration
const layerList = [
    { image: background, src: './images/layer_1_1.png', zIndex: -5, position: { x: 0, y: 0 }, blend: 0, opacity: 1 },
    { image: didot, src: './images/layer_2_1.png', zIndex: -4, position: { x: 0, y: 0 }, blend: 0, opacity: 1 },
    { image: shadow, src: './images/layer_3_1.png', zIndex: -3, position: { x: 0, y: 0 }, blend: 'multiply', opacity: 0.5 },
    { image: man, src: './images/layer_4_1.png', zIndex: -2, position: { x: 0, y: 0 }, blend: 0, opacity: 1 },
    { image: headlines, src: './images/layer_5_1.png', zIndex: -0.5, position: { x: 0, y: 0 }, blend: 0, opacity: 1 },
    { image: title, src: './images/layer_6_1.png', zIndex: -0.5, position: { x: 0, y: 0 }, blend: 0, opacity: 1 },
    { image: frame, src: './images/layer_7_1.png', zIndex: 0, position: { x: 0, y: 0 }, blend: 0, opacity: 1 },
    { image: gloss, src: './images/layer_8_1.png', zIndex: 0.5, position: { x: 0, y: 0 }, blend: 0, opacity: 1 }
];

// Motion Controller Class
class MotionController {
    constructor() {
        this.motion = { x: 0, y: 0 };
        this.initialMotion = { x: null, y: null };
        this.isActive = false;
        this.smoothingFactor = 0.2;
        this.safariPermissionGranted = false;
        this.initialize();
    }

    async initialize() {
        if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
            const button = document.createElement('button');
            button.innerHTML = 'Enable Motion';
            button.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 1000;
                padding: 15px 30px;
                background: #000;
                color: #fff;
                border: none;
                border-radius: 5px;
                font-size: 16px;
            `;
            
            document.body.appendChild(button);

            button.addEventListener('click', async () => {
                try {
                    const permission = await DeviceOrientationEvent.requestPermission();
                    if (permission === 'granted') {
                        this.safariPermissionGranted = true;
                        this.setupListeners();
                        button.remove();
                    }
                } catch (error) {
                    console.warn('Motion permission error:', error);
                }
            });
        } else {
            this.setupListeners();
        }
    }

    setupListeners() {
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', this.handleDeviceOrientation.bind(this));
        }
        
        window.addEventListener('orientationchange', () => {
            this.initialMotion = { x: null, y: null };
            setTimeout(() => this.resetMotion(), 100);
        });

        this.isActive = true;
    }

    handleDeviceOrientation(event) {
        if (!event.beta || !event.gamma) return;

        // Initialize reference point if needed
        if (this.initialMotion.x === null) {
            this.initialMotion = {
                x: event.gamma,
                y: event.beta
            };
            return;
        }

        // Get the current orientation
        const orientation = window.orientation || 0;
        let x = event.gamma - this.initialMotion.x;
        let y = event.beta - this.initialMotion.y;

        // Adjust for device orientation
        switch (orientation) {
            case 90:
                [x, y] = [y, -x];
                break;
            case -90:
                [x, y] = [-y, x];
                break;
            case 180:
                [x, y] = [-x, -y];
                break;
        }

        // Apply smoothing
        this.motion.x = this.smoothValue(this.motion.x, x);
        this.motion.y = this.smoothValue(this.motion.y, y);
    }

    smoothValue(current, next) {
        return current * (1 - this.smoothingFactor) + next * this.smoothingFactor;
    }

    resetMotion() {
        this.motion = { x: 0, y: 0 };
    }

    getMotion() {
        if (!this.isActive) return { x: 0, y: 0 };
        
        return {
            x: this.motion.x * 2,
            y: this.motion.y * 2
        };
    }
}

// Touch/Mouse Handler Class
class PointerHandler {
    constructor() {
        this.moving = false;
        this.pointer = { x: 0, y: 0 };
        this.pointerInitial = { x: 0, y: 0 };
        this.lastTouch = null;
        this.setupListeners();
    }

    setupListeners() {
        canvas.addEventListener('touchstart', this.pointerStart.bind(this), { passive: false });
        canvas.addEventListener('mousedown', this.pointerStart.bind(this));
        window.addEventListener('touchmove', this.pointerMove.bind(this), { passive: false });
        window.addEventListener('mousemove', this.pointerMove.bind(this));
        window.addEventListener('touchend', this.endGesture.bind(this));
        window.addEventListener('mouseup', this.endGesture.bind(this));
    }

    pointerStart(event) {
        this.moving = true;
        if (event.type === 'touchstart') {
            this.pointerInitial.x = event.touches[0].clientX;
            this.pointerInitial.y = event.touches[0].clientY;
        } else {
            this.pointerInitial.x = event.clientX;
            this.pointerInitial.y = event.clientY;
        }
    }

    pointerMove(event) {
        if (!this.moving) return;
        
        event.preventDefault();
        
        let currentX, currentY;
        if (event.type === 'touchmove') {
            const touch = event.touches[0];
            currentX = touch.clientX;
            currentY = touch.clientY;
            this.lastTouch = { x: currentX, y: currentY };
        } else {
            currentX = event.clientX;
            currentY = event.clientY;
        }

        this.pointer.x = (currentX - this.pointerInitial.x) * 0.5;
        this.pointer.y = (currentY - this.pointerInitial.y) * 0.5;
    }

    endGesture() {
        this.moving = false;
        const resetPointer = () => {
            this.pointer.x *= 0.85;
            this.pointer.y *= 0.85;
            if (Math.abs(this.pointer.x) > 0.1 || Math.abs(this.pointer.y) > 0.1) {
                requestAnimationFrame(resetPointer);
            } else {
                this.pointer.x = 0;
                this.pointer.y = 0;
            }
        };
        requestAnimationFrame(resetPointer);
    }

    getPointer() {
        return this.pointer;
    }
}

// Initialize controllers
const motionController = new MotionController();
const pointerHandler = new PointerHandler();

// Setup canvas sizing and centering
function setupCanvas() {
    const container = document.body;
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const image = layerList[0].image;
        const scale = Math.min(
            canvas.width / image.width,
            canvas.height / image.height
        );
        
        const centerX = (canvas.width - image.width * scale) / 2;
        const centerY = (canvas.height - image.height * scale) / 2;
        
        canvas.centerOffset = {
            x: centerX,
            y: centerY,
            scale: scale
        };
    }

    window.addEventListener('resize', resizeCanvas);
    layerList[0].image.onload = () => {
        resizeCanvas();
    };
}

// Calculate layer offsets
function getOffset(layer) {
    const pointer = pointerHandler.getPointer();
    const motion = motionController.getMotion();

    const touchMultiplier = 0.15;
    const motionMultiplier = 2.5;

    return {
        x: (pointer.x * layer.zIndex * touchMultiplier) + (motion.x * layer.zIndex * motionMultiplier),
        y: (pointer.y * layer.zIndex * touchMultiplier) + (motion.y * layer.zIndex * motionMultiplier)
    };
}

// Main render function
function drawCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    const motion = motionController.getMotion();
    const pointer = pointerHandler.getPointer();

    const rotateX = pointer.y * -0.15 + motion.y * -2;
    const rotateY = pointer.x * 0.15 + motion.x * 2;

    canvas.style.transform = `perspective(1000px) translate3d(0,0,0) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    canvas.style.webkitTransform = canvas.style.transform;

    layerList.forEach(layer => {
        layer.position = getOffset(layer);
        context.globalCompositeOperation = layer.blend || 'normal';
        context.globalAlpha = layer.opacity;
        
        const x = (canvas.centerOffset?.x || 0) + layer.position.x;
        const y = (canvas.centerOffset?.y || 0) + layer.position.y;
        const width = layer.image.width * (canvas.centerOffset?.scale || 1);
        const height = layer.image.height * (canvas.centerOffset?.scale || 1);
        
        context.drawImage(layer.image, x, y, width, height);
    });

    requestAnimationFrame(drawCanvas);
}

// Prevent default touch behavior
document.addEventListener('touchmove', function(event) {
    event.preventDefault();
}, { passive: false });

// Image loading
layerList.forEach(layer => {
    layer.image.onload = () => {
        loadCounter++;
        if (loadCounter >= layerList.length) {
            loadingScreen.classList.add('hidden');
            setupCanvas();
            requestAnimationFrame(drawCanvas);
        }
    };
    layer.image.src = layer.src;
});

// Handle visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        motionController.resetMotion();
    }
});

// Initial canvas setup
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
