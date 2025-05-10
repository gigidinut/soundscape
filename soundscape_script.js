
const soundsConfig = [
    { id: 'forest', name: 'Forest Ambience', file: 'sounds/forest.mp3' },
    { id: 'rain', name: 'Gentle Rain', file: 'sounds/rain.mp3' },
    { id: 'wind', name: 'Howling Wind', file: 'sounds/wind.mp3' },
    { id: 'fire', name: 'Crackling Fire', file: 'sounds/fire.mp3' },
    { id: 'birdsong', name: 'Morning Birdsong', file: 'sounds/birds.mp3' },
    { id: 'waves', name: 'Ocean Waves', file: 'sounds/waves.mp3' }
];

const audioElements = {};

// --- Global App Settings ---
let appSettings = {
    backgroundColor: '#7a2b87',
    particleColor: '#C8C8C8', // NEW: Default particle color (light grey)
    numberOfParticles: 500,
    particleMaxSize: 3,
    particleMaxSpeed: 0.2,
    connectDistance: 100,
};

// --- Helper function to convert HEX to RGBA ---
function hexToRgba(hex, opacity = 1) {
    let r = 0, g = 0, b = 0;
    if (!hex || typeof hex !== 'string') {
        console.warn("Invalid hex color provided to hexToRgba, using default light grey.");
        hex = '#C8C8C8'; // Fallback to a default if hex is totally invalid
    }
    
    hex = hex.startsWith('#') ? hex.slice(1) : hex;

    if (hex.length === 3) {
        r = parseInt(hex[0] + hex[0], 16);
        g = parseInt(hex[1] + hex[1], 16);
        b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    } else {
        console.warn(`Invalid hex color length: ${hex}, using default light grey.`);
        // Fallback for invalid length, re-parse default
        r = parseInt('C8', 16); 
        g = parseInt('C8', 16);
        b = parseInt('C8', 16);
    }
    return `rgba(${r},${g},${b},${opacity})`;
}

// --- Load Settings from localStorage ---
function loadSettingsFromStorage() {
    const storedSettings = localStorage.getItem('soundScapeAppSettings');
    if (storedSettings) {
        try {
            const parsedSettings = JSON.parse(storedSettings);
            for (const key in appSettings) {
                if (parsedSettings.hasOwnProperty(key) && typeof parsedSettings[key] === typeof appSettings[key]) {
                    appSettings[key] = parsedSettings[key];
                }
            }
        } catch (e) {
            console.error("Error parsing stored settings:", e);
            localStorage.removeItem('soundScapeAppSettings');
        }
    }
}
loadSettingsFromStorage();

// --- Particle Animation ---
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let particlesArray = [];
const mouseRepelDistance = 80;
const mouseRepelStrength = 1;

const mouse = {
    x: null,
    y: null,
    radius: 150
};

window.addEventListener('mousemove', (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
});
window.addEventListener('mouseout', () => {
    mouse.x = undefined;
    mouse.y = undefined;
});

class Particle {
    constructor(x, y, size, speedX, speedY) { // Removed color from constructor args
        this.x = x;
        this.y = y;
        this.size = size;
        this.baseSize = size;
        this.speedX = speedX;
        this.speedY = speedY;
        // Use appSettings.particleColor with random opacity
        this.color = hexToRgba(appSettings.particleColor, Math.random() * 0.5 + 0.3);
    }
    update() {
        if (mouse.x !== undefined && mouse.y !== undefined) {
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < mouse.radius + this.size) {
                let forceDirectionX = dx / distance;
                let forceDirectionY = dy / distance;
                let force = (mouse.radius - distance) / mouse.radius;
                this.x -= forceDirectionX * force * mouseRepelStrength * 5;
                this.y -= forceDirectionY * force * mouseRepelStrength * 5;
            }
        }
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x > canvas.width + this.size) this.x = -this.size;
        if (this.x < -this.size) this.x = canvas.width + this.size;
        if (this.y > canvas.height + this.size) this.y = -this.size;
        if (this.y < -this.size) this.y = canvas.height + this.size;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticles() {
    particlesArray = [];
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    for (let i = 0; i < appSettings.numberOfParticles; i++) {
        let size = Math.random() * appSettings.particleMaxSize + 1;
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        let speedX = (Math.random() * appSettings.particleMaxSpeed * 2) - appSettings.particleMaxSpeed;
        let speedY = (Math.random() * appSettings.particleMaxSpeed * 2) - appSettings.particleMaxSpeed;
        particlesArray.push(new Particle(x, y, size, speedX, speedY));
    }
}

function connectParticles() {
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a + 1; b < particlesArray.length; b++) {
            let dx = particlesArray[a].x - particlesArray[b].x;
            let dy = particlesArray[a].y - particlesArray[b].y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < appSettings.connectDistance) {
                const opacity = 1 - (distance / appSettings.connectDistance);
                ctx.strokeStyle = `rgba(180, 180, 180, ${opacity * 0.5})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                ctx.stroke();
            }
        }
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
    }
    connectParticles();
    requestAnimationFrame(animateParticles);
}

window.addEventListener('resize', () => {
    initParticles();
});

// --- Main Logic (Sound Controls & Settings Panel) ---
document.addEventListener('DOMContentLoaded', () => {
    const soundControlsGrid = document.getElementById('soundControlsGrid');

    soundsConfig.forEach(sound => {
        const soundItemDiv = document.createElement('div');
        soundItemDiv.classList.add('sound-item');
        const audio = new Audio(sound.file);
        audio.loop = true;
        audio.volume = 0.5;
        audioElements[sound.id] = { element: audio, isPlaying: false, button: null, slider: null };
        const button = document.createElement('button');
        button.textContent = sound.name;
        button.dataset.soundId = sound.id;
        audioElements[sound.id].button = button;
        const volumeSlider = document.createElement('input');
        volumeSlider.type = 'range';
        volumeSlider.min = '0';
        volumeSlider.max = '1';
        volumeSlider.step = '0.01';
        volumeSlider.value = audio.volume;
        volumeSlider.classList.add('volume-slider');
        audioElements[sound.id].slider = volumeSlider;
        soundItemDiv.appendChild(button);
        soundItemDiv.appendChild(volumeSlider);
        soundControlsGrid.appendChild(soundItemDiv);
        button.addEventListener('click', () => {
            const soundState = audioElements[sound.id];
            if (soundState.isPlaying) {
                soundState.element.pause();
                soundState.button.classList.remove('active');
                soundState.slider.classList.remove('visible');
            } else {
                soundState.element.play().catch(error => console.error(`Error playing ${sound.name}:`, error));
                soundState.button.classList.add('active');
                soundState.slider.classList.add('visible');
            }
            soundState.isPlaying = !soundState.isPlaying;
        });
        volumeSlider.addEventListener('input', (e) => {
            audioElements[sound.id].element.volume = parseFloat(e.target.value);
        });
    });

    // --- Settings Panel Logic ---
    const settingsButton = document.getElementById('settingsButton');
    const settingsPanel = document.getElementById('settingsPanel');
    const closeSettingsButton = document.getElementById('closeSettingsButton');
    const applySettingsButton = document.getElementById('applySettingsButton');

    const bgColorInput = document.getElementById('bgColorInput');
    const particleColorInput = document.getElementById('particleColorInput'); // NEW
    const numParticlesInput = document.getElementById('numParticlesInput');
    const particleSizeInput = document.getElementById('particleSizeInput');
    const particleSizeValueDisplay = document.getElementById('particleSizeValue');
    const particleSpeedInput = document.getElementById('particleSpeedInput');
    const particleSpeedValueDisplay = document.getElementById('particleSpeedValue');
    const connectDistanceInput = document.getElementById('connectDistanceInput');
    const connectDistanceValueDisplay = document.getElementById('connectDistanceValue');

    function updateSettingsUI() {
        bgColorInput.value = appSettings.backgroundColor;
        particleColorInput.value = appSettings.particleColor; // NEW
        numParticlesInput.value = appSettings.numberOfParticles;
        particleSizeInput.value = appSettings.particleMaxSize;
        particleSizeValueDisplay.textContent = appSettings.particleMaxSize;
        particleSpeedInput.value = appSettings.particleMaxSpeed;
        particleSpeedValueDisplay.textContent = appSettings.particleMaxSpeed;
        connectDistanceInput.value = appSettings.connectDistance;
        connectDistanceValueDisplay.textContent = appSettings.connectDistance;
    }

    updateSettingsUI();
    document.body.style.backgroundColor = appSettings.backgroundColor;

    settingsButton.addEventListener('click', () => {
        settingsPanel.classList.toggle('visible');
    });
    closeSettingsButton.addEventListener('click', () => {
        settingsPanel.classList.remove('visible');
    });
    
    bgColorInput.addEventListener('input', () => {
        appSettings.backgroundColor = bgColorInput.value;
        document.body.style.backgroundColor = appSettings.backgroundColor;
    });
    // Optional: Live update for particle color in settings, but particles won't change until 'Apply'
    particleColorInput.addEventListener('input', () => { // NEW
        // appSettings.particleColor = particleColorInput.value; // Can enable if you want live update to appSettings
                                                             // but actual particle color change is on Apply
    });

    particleSizeInput.addEventListener('input', () => particleSizeValueDisplay.textContent = particleSizeInput.value);
    particleSpeedInput.addEventListener('input', () => particleSpeedValueDisplay.textContent = particleSpeedInput.value);
    connectDistanceInput.addEventListener('input', () => connectDistanceValueDisplay.textContent = connectDistanceInput.value);

    applySettingsButton.addEventListener('click', () => {
        appSettings.backgroundColor = bgColorInput.value;
        appSettings.particleColor = particleColorInput.value; // NEW: Get particle color
        appSettings.numberOfParticles = parseInt(numParticlesInput.value, 10);
        appSettings.particleMaxSize = parseFloat(particleSizeInput.value);
        appSettings.particleMaxSpeed = parseFloat(particleSpeedInput.value);
        appSettings.connectDistance = parseInt(connectDistanceInput.value, 10);

        // Basic validation with fallbacks
        appSettings.numberOfParticles = Math.max(10, Math.min(1000, appSettings.numberOfParticles || 500));
        appSettings.particleMaxSize = Math.max(1, Math.min(10, appSettings.particleMaxSize || 3));
        appSettings.particleMaxSpeed = Math.max(0.1, Math.min(2.0, appSettings.particleMaxSpeed || 0.2));
        appSettings.connectDistance = Math.max(20, Math.min(200, appSettings.connectDistance || 100));
        // No specific validation for color, the input[type=color] handles format.
        
        updateSettingsUI(); 

        document.body.style.backgroundColor = appSettings.backgroundColor;
        initParticles(); // Re-initialize particles with new color and other settings

        localStorage.setItem('soundScapeAppSettings', JSON.stringify(appSettings));
    });

    initParticles();
    animateParticles();
});