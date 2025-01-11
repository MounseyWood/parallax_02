// Get reference to Canvas
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const loadingScreen = document.getElementById('loading');

// Initialize loading variables
let loaded = false;
let loadCounter = 0;

// Initialize images for layers
const background = new Image();
const didot = new Image();
const shadow = new Image();
const man = new Image();
const headlines = new Image();
const title = new Image();
const frame = new Image();
const gloss = new Image();

// Create a list of layer objects
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

// Motion and orientation controller
class MotionController {
  constructor() {
    this.motion = { x: 0, y: 0 };
    this.calibrationOffset = { x: 0, y: 0 };
    this.lastMotion = { x: 0, y: 0 };
    this.smoothingFactor = 0.15;
    this.isCalibrated = false;
    this.initialize();
  }

  async initialize() {
    if (typeof DeviceOrientationEvent !== 'undefined') {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission === 'granted') {
            this.setupEventListeners();
          }
        } catch (error) {
          console.warn('Motion access denied or error:', error);
        }
      } else {
        this.setupEventListeners();
      }
    }
  }

  setupEventListeners() {
    window.addEventListener('deviceorientation', this.handleDeviceOrientation.bind(this));
    window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
  }

  handleDeviceOrientation(event) {
    if (!this.isCalibrated) {
      this.calibrate(event);
      return;
    }

    const orientation = window.orientation || 0;
    let motionX = 0;
    let motionY = 0;

    switch (orientation) {
      case 0: // Portrait
        motionX = event.gamma - this.calibrationOffset.x;
        motionY = event.beta - this.calibrationOffset.y;
        break;
      case 90: // Landscape left
        motionX = event.beta - this.calibrationOffset.y;
        motionY = -event.gamma + this.calibrationOffset.x;
        break;
      case -90: // Landscape right
        motionX = -event.beta + this.calibrationOffset.y;
        motionY = event.gamma - this.calibrationOffset.x;
        break;
      case 180: // Upside down
        motionX = -event.gamma + this.calibrationOffset.x;
        motionY = -event.beta + this.calibrationOffset.y;
        break;
    }

    // Apply smoothing
    this.motion.x = this.smoothValue(this.lastMotion.x, motionX);
    this.motion.y = this.smoothValue(this.lastMotion.y, motionY);

    // Update last motion values
    this.lastMotion.x = this.motion.x;
    this.lastMotion.y = this.motion.y;
  }

  smoothValue(currentValue, newValue) {
    return currentValue * (1 - this.smoothingFactor) + newValue * this.smoothingFactor;
  }

  calibrate(event) {
    if (!event.beta || !event.gamma) return;
    
    this.calibrationOffset = {
      x: event.gamma,
      y: event.beta
    };
    this.isCalibrated = true;
  }

  handleOrientationChange() {
    this.isCalibrated = false;
  }

  getMotion() {
    return {
      x: this.motion.x * 1.2, // Adjust sensitivity
      y: this.motion.y * 1.2
    };
  }
}

// Initialize motion controller
const motionController = new MotionController();

// Touch and pointer handling
class PointerHandler {
  constructor() {
    this.moving = false;
    this.pointer = { x: 0, y: 0 };
    this.pointerInitial = { x: 0, y: 0 };
    this.setupEventListeners();
  }

  setupEventListeners() {
    canvas.addEventListener('touchstart', this.pointerStart.bind(this));
    canvas.addEventListener('mousedown', this.pointerStart.bind(this));
    window.addEventListener('touchmove', this.pointerMove.bind(this));
    window.addEventListener('mousemove', this.pointerMove.bind(this));
    window.addEventListener('touchend', this.endGesture.bind(this));
    window.addEventListener('mouseup', this.endGesture.bind(this));
  }

  pointerStart(event) {
    this.moving = true;
    if (event.type === 'touchstart') {
      this.pointerInitial.x = event.touches[0].clientX;
      this.pointerInitial.y = event.touches[0].clientY;
    } else if (event.type === 'mousedown') {
      this.pointerInitial.x = event.clientX;
      this.pointerInitial.y = event.clientY;
    }
  }

  pointerMove(event) {
    event.preventDefault();
    if (this.moving) {
      let currentX = 0;
      let currentY = 0;
      if (event.type === 'touchmove') {
        currentX = event.touches[0].clientX;
        currentY = event.touches[0].clientY;
      } else if (event.type === 'mousemove') {
        currentX = event.clientX;
        currentY = event.clientY;
      }
      this.pointer.x = currentX - this.pointerInitial.x;
      this.pointer.y = currentY - this.pointerInitial.y;
    }
  }

  endGesture() {
    this.moving = false;
    this.pointer.x = 0;
    this.pointer.y = 0;
  }

  getPointer() {
    return this.pointer;
  }
}

// Initialize pointer handler
const pointerHandler = new PointerHandler();

// Image loading
layerList.forEach((layer) => {
  layer.image.onload = function () {
    loadCounter++;
    if (loadCounter >= layerList.length) {
      hideLoading();
      requestAnimationFrame(drawCanvas);
    }
  };
  layer.image.src = layer.src;
});

function hideLoading() {
  loadingScreen.classList.add('hidden');
}

function getOffset(layer) {
  const pointer = pointerHandler.getPointer();
  const motion = motionController.getMotion();

  const touchMultiplier = 0.1;
  const touchOffsetX = pointer.x * layer.zIndex * touchMultiplier;
  const touchOffsetY = pointer.y * layer.zIndex * touchMultiplier;

  const motionMultiplier = 1;
  const motionOffsetX = motion.x * layer.zIndex * motionMultiplier;
  const motionOffsetY = motion.y * layer.zIndex * motionMultiplier;

  return {
    x: touchOffsetX + motionOffsetX,
    y: touchOffsetY + motionOffsetY
  };
}

function drawCanvas() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  const pointer = pointerHandler.getPointer();
  const motion = motionController.getMotion();

  // Calculate canvas rotation
  const rotateX = pointer.y * -0.15 + motion.y * -1.2;
  const rotateY = pointer.x * 0.15 + motion.x * 1.2;

  // Apply transform with hardware acceleration
  canvas.style.transform = `translate3d(0,0,0) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

  // Draw layers
  layerList.forEach((layer) => {
    layer.position = getOffset(layer);
    context.globalCompositeOperation = layer.blend || 'normal';
    context.globalAlpha = layer.opacity;
    context.drawImage(layer.image, layer.position.x, layer.position.y);
  });

  requestAnimationFrame(drawCanvas);
}
