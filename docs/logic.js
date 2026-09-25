const hitAudio = new Audio('./assets/hit.mp3');

function playHitSound() {
    hitAudio.currentTime = 0;
    hitAudio.play().catch(e => console.log("Audio play blocked by browser."));
}

playHitSound()

// Canvas & Layout Configuration
const canvas = document.getElementById('hit-canvas');
const ctx = canvas.getContext('2d');
const appBox = document.getElementById('app-box');
const timeDisplay = document.getElementById('time-display');
const statusBadge = document.getElementById('status-badge');
const subMessage = document.getElementById('sub-message');

// 16 small square segments (25px wide each for 400px total width)
const NUM_BLOCKS = 7;
const BLOCK_WIDTH = 400 / NUM_BLOCKS; // 25px
const BLOCK_HEIGHT = 50; // 50px height for squares bar

// Alternating distinct color palette for blocks (Orange, Green, Blue sequence)
const blockColors = [
    "#3b82f6",
    "#3b82f6",
    "#3b82f6",
    "#22c55e",
    "#ef4444",
    "#ef4444",
    "#ef4444"
];

// State Variables
let clicked = false;
let startTime = Date.now() / 1000;
let busy = false;
let circles = [];
let animationFrame = null;

// Formula mappings: time = (x / 800) + 0.4
// Reverse: x = Math.round((time - 0.4) * 800)
function timeToX(tVal) {
    return Math.round((tVal - 0.35) * 1142.857143);
}

function xToTime(xVal) {
    return (xVal / 1142.857143) + 0.35;
}

function drawCanvas() {
    ctx.clearRect(0,
        0, canvas.width, canvas.height);

    // 1. Draw 16 small square block segments (50px height)
    for (let i = 0; i < NUM_BLOCKS; i++) {
        const x1 = i * BLOCK_WIDTH;

        // Fill color block
        ctx.fillStyle = blockColors[i
        ];
        ctx.fillRect(x1,
            0, BLOCK_WIDTH, BLOCK_HEIGHT);

        // Block borders
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#0f172a'; // slate-900
        ctx.strokeRect(x1,
            0, BLOCK_WIDTH, BLOCK_HEIGHT);
    }
    // 2. Draw Timestamps & Ticks Below Squares (Height 50px to 85px)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, BLOCK_HEIGHT,
        400,
        35); // dark label strip background

    ctx.fillStyle = '#94a3b8'; // slate-400 label color
    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';

    // Draw ticks at specific key x positions (every 50px / 2 blocks)
    for (let i = 0; i <= NUM_BLOCKS; i += 1) {
        const x = i * BLOCK_WIDTH;
        const timeAtX = xToTime(x).toFixed(2);

        // Tick line
        ctx.beginPath();
        ctx.moveTo(x, BLOCK_HEIGHT);
        ctx.lineTo(x, BLOCK_HEIGHT + 6);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Timestamp Text label
        const displayX = Math.max(12, Math.min(388, x)); // clip to canvas padding
        ctx.fillText(`${timeAtX
            }s`, displayX, BLOCK_HEIGHT + 18);
    }
    // 3. Draw Plot Circles for Hit Marks
    for (const x of circles) {
        ctx.beginPath();
        ctx.arc(x, BLOCK_HEIGHT / 2,
            7,
            0,
            2 * Math.PI);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#090d16";
        ctx.stroke();

        // Inner glowing dot
        ctx.beginPath();
        ctx.arc(x, BLOCK_HEIGHT / 2,
            2.5,
            0,
            2 * Math.PI);
        ctx.fillStyle = "#0f172a";
        ctx.fill();
    }
}

function createCircle(x) {
    circles.push(x);
    drawCanvas();
}

function removeAllCircles() {
    circles = [];
    drawCanvas();
}

function changeColour(colorName) {
    if (colorName === "yellow") {
        appBox.style.backgroundColor = "#facc15"; // Tailwind amber-400
        statusBadge.innerText = "Ready";
        statusBadge.className = "px-3 py-1 bg-amber-900/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-2 text-amber-950 border border-amber-900/20";
        subMessage.innerText = "Click when?";
    } else if (colorName === "green") {
        appBox.style.backgroundColor = "#22c55e"; // Tailwind green-500
        statusBadge.innerText = "Perfect";
        statusBadge.className = "px-3 py-1 bg-emerald-950/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-2 text-emerald-950 border border-emerald-950/20";
        subMessage.innerText = "Good hit. Click to reset.";
    } else if (colorName === "red") {
        appBox.style.backgroundColor = "#ef4444"; // Tailwind red-500
        statusBadge.innerText = "Too Slow";
        statusBadge.className = "px-3 py-1 bg-rose-950/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-2 text-rose-950 border border-rose-950/20";
        subMessage.innerText = "Bad Hit. Click to reset.";
    } else {
        appBox.style.backgroundColor = "#ffffff";
        statusBadge.innerText = "Click Anywhere to Start";
        statusBadge.className = "px-3 py-1 bg-slate-900/10 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-2 text-slate-800 border border-slate-900/10";
        subMessage.innerText = "Second click between 0.5 and 0.55 sec";
    }
}

function notBusy() {
    busy = false;
}

function updateCounter() {
    if (clicked && !busy) {
        const currentT = (Date.now() / 1000) - startTime;
        timeDisplay.innerHTML = `${currentT.toFixed(3)
            }<span class="text-xl font-medium">s</span>`;
    }
    animationFrame = requestAnimationFrame(updateCounter);
}

appBox.addEventListener('mousedown', (e) => {
    const currentTime = Date.now() / 1000;
    const time = currentTime - startTime;
    const xPos = timeToX(time);

    // Record circle position if within 0..400px canvas bounds
    if (xPos > 0 && xPos < 400) {
        createCircle(xPos);
    }

    if (busy) return;

    playHitSound();
    busy = true;

    if (!clicked || time > 10) {
        clicked = true;
        startTime = Date.now() / 1000;
        changeColour("yellow");
        removeAllCircles();
        timeDisplay.innerHTML = `0.000<span class="text-xl font-medium">s</span>`;
        setTimeout(notBusy,
            500);
    } else {
        clicked = false;
        timeDisplay.innerHTML = `${time.toFixed(3)
            }<span class="text-xl font-medium">s</span>`;
        if (time > 0.55) {
            changeColour("red");
        } else {
            changeColour("green");
        }
        setTimeout(notBusy,
            500);
    }
});

// Touch support mapping to mousedown
appBox.addEventListener('touchstart', (e) => {
    e.preventDefault();
    appBox.dispatchEvent(new MouseEvent('mousedown'));
},
    {
        passive: false
    });

// Initial render call
drawCanvas();
updateCounter();
