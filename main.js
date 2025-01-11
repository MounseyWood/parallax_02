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

// Device detection
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// Motion Controller
class MotionController {
    constructor() {
        this.motion = { x: 0, y: 0 };
        this.initialMotion = { x: null, y: null };
        this.isActive = false;
        this.smoothingFactor = 0.2;
        this.permissionGranted = false;
        this.initialize();
    }

    async initialize() {
        if (isIOS) {
            // Create permission button for iOS
            const button = document.createElement('button');
            button.innerText = 'Enable Motion';
            button.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 1001;
                padding: 16px 24px;
                background: black;
                color: white;
                border: none;
                border-radius: 8px;
                font-family: sans-serif;
            `;

            // Only show button if permission is needed
            if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
                document.body.appendChild(button);
                button.addEventListener('click', async () => {
                    button.remove();
                    try {
                        const permission = await DeviceOrientationEvent.requestPermission();
                        if (permission === 'granted') {
                            this.permissionGranted = true;
                            this.setupListeners();
                        }
                    } catch (error) {
                        console.warn('Permission denied for motion detection');
                    }
                });
            } else {
                // iOS device but doesn't need permission (older version)
                this.setupListeners();
            }
        } else {
            // Non-iOS device
            this.setupListeners();
        }
    }

    setupListeners() {
        if ('DeviceOrientationEvent' in window) {
            window.addEventListener('deviceorientation', this.handleDeviceOrientation.bind(this));
            this.isActive = true;
        }

        window.addEventListener('orientationchange', () => {
            this.initialMotion = { x: null, y: null };
            setTimeout(() => this.resetMotion(), 100);
        });
    }

    handleDeviceOrientation(event) {
        if (!event.beta || !event.gamma) return;

        // Initialize reference point
        if (this.initialMotion.x === null) {
            this.initialMotion = {
                x: event.gamma,
                y: event.beta
            };
            return;
        }

        // Get screen orientation
        const orientation = window.orientation || 0;
        let x = event.gamma - this.initialMotion.x;
        let y = event.beta - this.initialMotion.y;

        // Adjust for screen orientation
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
            x: this.motion.x * 1.5,
            y: this.motion.y * 1.5
        };
    }
}

// Touch/Mouse Handler
class PointerHandler {
    constructor() {
        this.moving = false;
        this.pointer = { x: 0, y: 0 };
        this.pointerInitial = { x: 0, y: 0 };
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
        event.preventDefault();
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
            currentX = event.touches[0].clientX;
            currentY = event.touches[0].clientY;
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

// Set up canvas sizing
function setupCanvas() {
    const baseImage = layerList[0].image;
    
    // Set canvas size based on image and viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const imageAspect = baseImage.width / baseImage.height;
    const viewportAspect = viewportWidth / viewportHeight;
    
    let width, height;
    if (viewportAspect > imageAspect) {
        height = viewportHeight;
        width = height * imageAspect;
    } else {
        width = viewportWidth;
        height = width / imageAspect;
    }
    
    canvas.width = width;
    canvas.height = height;
}

function getOffset(layer) {
    const pointer = pointerHandler.getPointer();
    const motion = motionController.getMotion();

    const touchMultiplier = 0.15;
    const motionMultiplier = 2;

    return {
        x: (pointer.x * layer.zIndex * touchMultiplier) + (motion.x * layer.zIndex * motionMultiplier),
        y: (pointer.y * layer.zIndex * touchMultiplier) + (motion.y * layer.zIndex * motionMultiplier)
    };
}

function drawCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    const motion = motionController.getMotion();
    const pointer = pointerHandler.getPointer();

    const rotateX = pointer.y * -0.15 + motion.y * -1.5;
    const rotateY = pointer.x * 0.15 + motion.x * 1.5;

    // Apply transform
    const transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    canvas.style.transform = transform;
    canvas.style.webkitTransform = transform;

    // Draw layers
    layerList.forEach(layer => {
        layer.position = getOffset(layer);
        context.globalCompositeOperation = layer.blend || 'normal';
        context.globalAlpha = layer.opacity;
        context.drawImage(
            layer.image,
            layer.position.x,
            layer.position.y,
            canvas.width,
            canvas.height
        );
    });

    requestAnimationFrame(drawCanvas);
}

// Prevent Safari bouncing
document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

// Image loading
layerList.forEach(layer => {
    layer.image.onload = () => {
        loadCounter++;
        if (loadCounter >= layerList.length) {
            setupCanvas();
            loadingScreen.classList.add('hidden');
            requestAnimationFrame(drawCanvas);
        }
    };
    layer.image.src = layer.src;
});

// Handle window resize
window.addEventListener('resize', () => {
    setupCanvas();
});

// Handle visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        motionController.resetMotion();
    }
});
