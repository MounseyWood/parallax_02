// Initialize canvas and context
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const loadingScreen = document.getElementById('loading');
const container = document.querySelector('.image-container');

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

// Motion Controller with Safari fixes
class MotionController {
    constructor() {
        this.motion = { x: 0, y: 0 };
        this.initialMotion = { x: null, y: null };
        this.isActive = false;
        this.smoothingFactor = 0.2;
        this.initialize();
    }

    async initialize() {
        // Check if it's Safari on iOS
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

        if (isSafari && isiOS) {
            // iOS Safari needs permission
            if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
                const button = document.createElement('button');
                button.innerHTML = 'Enable Motion';
                button.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 1001;
                    padding: 16px 24px;
                    background: #000;
                    color: #fff;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                `;
                
                document.body.appendChild(button);

                button.addEventListener('click', async () => {
                    try {
                        const permission = await DeviceOrientationEvent.requestPermission();
                        if (permission === 'granted') {
                            this.setupListeners();
                            button.remove();
                        }
                    } catch (error) {
                        console.warn('Motion permission error:', error);
                        button.remove();
                    }
                });
            } else {
                this.setupListeners();
            }
        } else {
            // Non-Safari browsers
            this.setupListeners();
        }
    }

    setupListeners() {
        window.addEventListener('deviceorientation', this.handleDeviceOrientation.bind(this), true);
        window.addEventListener('orientationchange', () => {
            this.initialMotion = { x: null, y: null };
            setTimeout(() => this.resetMotion(), 100);
        });

        this.isActive = true;
    }

    handleDeviceOrientation(event) {
        if (!event.beta || !event.gamma) return;

        if (this.initialMotion.x === null) {
            this.initialMotion = {
                x: event.gamma,
                y: event.beta
            };
            return;
        }

        const orientation = window.orientation || 0;
        let x = event.gamma - this.initialMotion.x;
        let y = event.beta - this.initialMotion.y;

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

        this.motion.x = this.smoothValue(this.motion.x, x);
        this.motion.y = this.smoothValue(this.motion.y, y);
    }

    smoothValue(current, next) {
        return current * (1 - this.smoothingFactor) + next * this.smoothingFactor;
    }

    resetMotion() {
        this.motion = { x: 0, y: 0 };
        this.initialMotion = { x: null, y: null };
    }

    getMotion() {
        if (!this.isActive) return { x: 0, y: 0 };
        return {
            x: this.motion.x * 1.5,
            y: this.motion.y * 1.5
        };
    }
}

// Updated Touch/Mouse Handler
class PointerHandler {
    constructor() {
        this.moving = false;
        this.pointer = { x: 0, y: 0 };
        this.pointerInitial = { x: 0, y: 0 };
        this.setupListeners();
    }

    setupListeners() {
        // Use passive: false for Safari
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.pointerStart(e);
        }, { passive: false });
        
        canvas.addEventListener('mousedown', this.pointerStart.bind(this));
        
        window.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.pointerMove(e);
        }, { passive: false });
        
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
        // Smooth reset
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

// Centering and scaling function
function updateCanvasSize() {
    const containerRect = container.getBoundingClientRect();
    const baseImage = layerList[0].image;
    
    // Calculate scaling to fit container while maintaining aspect ratio
    const scale = Math.min(
        containerRect.width / baseImage.width,
        containerRect.height / baseImage.height
    );

    const scaledWidth = baseImage.width * scale;
    const scaledHeight = baseImage.height * scale;

    // Set canvas dimensions
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;

    // Store scaling factor for drawing
    canvas.scale = scale;

    // Center the canvas
    canvas.style.left = '50%';
    canvas.style.top = '50%';
    canvas.style.transform = 'translate(-50%, -50%)';
}

function drawCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    const motion = motionController.getMotion();
    const pointer = pointerHandler.getPointer();

    const rotateX = pointer.y * -0.15 + motion.y * -1.5;
    const rotateY = pointer.x * 0.15 + motion.x * 1.5;

    // Apply transforms for Safari compatibility
    canvas.style.transform = `translate(-50%, -50%) 
        perspective(1000px) 
        rotateX(${rotateX}deg) 
        rotateY(${rotateY}deg)`;

    layerList.forEach(layer => {
        layer.position = getOffset(layer);
        context.globalCompositeOperation = layer.blend || 'normal';
        context.globalAlpha = layer.opacity;

        const x = layer.position.x;
        const y = layer.position.y;
        const width = layer.image.width * canvas.scale;
        const height = layer.image.height * canvas.scale;

        context.drawImage(layer.image, x, y, width, height);
    });

    requestAnimationFrame(drawCanvas);
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

// Prevent Safari bouncing
document.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

// Image loading
layerList.forEach(layer => {
    layer.image.onload = () => {
        loadCounter++;
        if (loadCounter >= layerList.length) {
            updateCanvasSize();
            loadingScreen.classList.add('hidden');
            requestAnimationFrame(drawCanvas);
        }
    };
    layer.image.src = layer.src;
});

// Handle window resize
window.addEventListener('resize', () => {
    updateCanvasSize();
});

// Handle visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        motionController.resetMotion();
    }
});
