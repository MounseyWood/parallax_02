// Get reference to Canvas
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

// Get reference to loading screen
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

function drawCanvas() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Calculate how much the canvas should rotate
  const rotateX = pointer.y * -0.15 + motion.y * -1.2;
  const rotateY = pointer.x * 0.15 + motion.x * 1.2;

  const transformString = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  canvas.style.transform = transformString;

  // Loop through each layer and draw it to the canvas
  layerList.forEach((layer) => {
    layer.position = getOffset(layer);

    context.globalCompositeOperation = layer.blend || 'normal';
    context.globalAlpha = layer.opacity;

    context.drawImage(layer.image, layer.position.x, layer.position.y);
  });
  requestAnimationFrame(drawCanvas);
}

function getOffset(layer) {
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

//// TOUCH AND MOUSE CONTROLS ////
let moving = false;
const pointerInitial = { x: 0, y: 0 };
const pointer = { x: 0, y: 0 };

canvas.addEventListener('touchstart', pointerStart);
canvas.addEventListener('mousedown', pointerStart);

function pointerStart(event) {
  moving = true;
  if (event.type === 'touchstart') {
    pointerInitial.x = event.touches[0].clientX;
    pointerInitial.y = event.touches[0].clientY;
  } else if (event.type === 'mousedown') {
    pointerInitial.x = event.clientX;
    pointerInitial.y = event.clientY;
  }
}

window.addEventListener('touchmove', pointerMove);
window.addEventListener('mousemove', pointerMove);

function pointerMove(event) {
  event.preventDefault();
  if (moving) {
    let currentX = 0;
    let currentY = 0;
    if (event.type === 'touchmove') {
      currentX = event.touches[0].clientX;
      currentY = event.touches[0].clientY;
    } else if (event.type === 'mousemove') {
      currentX = event.clientX;
      currentY = event.clientY;
    }
    pointer.x = currentX - pointerInitial.x;
    pointer.y = currentY - pointerInitial.y;
  }
}

window.addEventListener('touchend', endGesture);
window.addEventListener('mouseup', endGesture);

function endGesture() {
  moving = false;
  pointer.x = 0;
  pointer.y = 0;
}

//// MOTION CONTROLS ////
const motionInitial = { x: null, y: null };
const motion = { x: 0, y: 0 };

// Request motion access for iOS
function requestMotionAccess() {
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission()
      .then((permissionState) => {
        if (permissionState === 'granted') {
          console.log('Motion access granted');
          window.addEventListener('deviceorientation', handleDeviceOrientation);
        } else {
          console.warn('Motion access denied.');
        }
      })
      .catch((err) => console.error('Permission error:', err));
  } else {
    // Motion permission not needed
    console.log('Motion permission not required on this device');
    window.addEventListener('deviceorientation', handleDeviceOrientation);
  }
}

requestMotionAccess();

function handleDeviceOrientation(event) {
  console.log(`Orientation Data: Beta ${event.beta}, Gamma ${event.gamma}`);

  if (motionInitial.x === null && motionInitial.y === null) {
    motionInitial.x = event.beta;
    motionInitial.y = event.gamma;
  }

  const orientation = window.orientation || 0;

  switch (orientation) {
    case 0: // Portrait
      motion.x = event.gamma - motionInitial.y;
      motion.y = event.beta - motionInitial.x;
      break;
    case 90: // Landscape (left)
      motion.x = event.beta - motionInitial.x;
      motion.y = -event.gamma + motionInitial.y;
      break;
    case -90: // Landscape (right)
      motion.x = -event.beta + motionInitial.x;
      motion.y = event.gamma - motionInitial.y;
      break;
    case 180: // Upside down
      motion.x = -event.gamma + motionInitial.y;
      motion.y = -event.beta + motionInitial.x;
      break;
    default:
      motion.x = 0;
      motion.y = 0;
  }

  console.log(`Motion X: ${motion.x}, Motion Y: ${motion.y}`);
}

window.addEventListener('orientationchange', () => {
  console.log('Orientation changed, resetting motion initial values.');
  motionInitial.x = null;
  motionInitial.y = null;
});
