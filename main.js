// iOS Safari motion/orientation permission handler
async function requestIosPermission() {
    if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
        try {
            const permission = await DeviceOrientationEvent.requestPermission();
            return permission === 'granted';
        } catch (error) {
            console.warn('iOS permission error:', error);
            return false;
        }
    }
    return true; // Return true for non-iOS or older iOS that doesn't need permission
}

// Motion Controller with improved Safari support
class MotionController {
    constructor() {
        this.motion = { x: 0, y: 0 };
        this.initialMotion = { x: null, y: null };
        this.isActive = false;
        this.smoothingFactor = 0.2;
        this.hasPermission = false;
        this.initialize();
    }

    async initialize() {
        // For iOS Safari
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
                background: black;
                color: white;
                border: none;
                border-radius: 8px;
                font-family: sans-serif;
                font-size: 16px;
            `;
            
            document.body.appendChild(button);

            button.addEventListener('click', async () => {
                button.remove();
                this.hasPermission = await requestIosPermission();
                if (this.hasPermission) {
                    this.setupListeners();
                }
            });
        } else {
            this.hasPermission = true;
            this.setupListeners();
        }
    }

    setupListeners() {
        window.addEventListener('deviceorientation', this.handleDeviceOrientation.bind(this), true);
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.initialMotion = { x: null, y: null };
                this.resetMotion();
            }, 100);
        });
        this.isActive = true;
    }

    handleDeviceOrientation(event) {
        if (!this.hasPermission || !event.beta || !event.gamma) return;

        if (this.initialMotion.x === null) {
            this.initialMotion = {
                x: event.gamma,
                y: event.beta
            };
            return;
        }

        let x = event.gamma - this.initialMotion.x;
        let y = event.beta - this.initialMotion.y;

        // Handle screen orientation
        const orientation = window.orientation || 0;
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
        if (!this.isActive || !this.hasPermission) return { x: 0, y: 0 };
        return {
            x: this.motion.x * 1.5,
            y: this.motion.y * 1.5
        };
    }
}

[Rest of your existing code remains the same, including PointerHandler class, layerList, and drawing functions]

// Prevent all touch movement except for intended interactions
document.addEventListener('touchmove', (e) => {
    if (e.target !== canvas) {
        e.preventDefault();
    }
}, { passive: false });

// Force reorientation check on Safari
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        window.scrollTo(0, 0);
        if (motionController) {
            motionController.resetMotion();
        }
    }, 50);
});

// For Safari, add specific touch handling
if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('gesturechange', (e) => e.preventDefault());
    document.addEventListener('gestureend', (e) => e.preventDefault());
}
