const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const STATE = { MENU: 'menu', PLAY: 'play', GAMEOVER: 'gameover' };
let gameState = STATE.MENU;
let lastTime = 0;
let score = 0;
let survivalTime = 0;
let highScore = localStorage.getItem('canvas_apocalypse_highscore') || 0;
let shakeTime = 0;

const difficultySettings = {
    '1': { name: 'Easy', enemySpeed: 120, spawnRate: 3.0 },
    '2': { name: 'Medium', enemySpeed: 180, spawnRate: 2.0 },
    '3': { name: 'Hard', enemySpeed: 250, spawnRate: 1.0 }
};
let currentDiff = difficultySettings['2'];

let player = { x: 400, y: 300, size: 24, speed: 320 };
let enemies = [];
let particles = [];
let spawnTimer = 0;
let keys = {};

// --- Управление ---
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (gameState === STATE.MENU && difficultySettings[e.key]) {
        currentDiff = difficultySettings[e.key];
        resetGame();
        gameState = STATE.PLAY;
    }
    if (gameState === STATE.GAMEOVER && e.code === 'KeyR') gameState = STATE.MENU;
});
window.addEventListener('keyup', (e) => keys[e.code] = false);

function resetGame() {
    player.x = CANVAS_WIDTH / 2; player.y = CANVAS_HEIGHT / 2;
    enemies = []; particles = []; score = 0; survivalTime = 0; spawnTimer = 0;
}

function spawnEnemy() {
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    if (edge === 0) { x = Math.random() * CANVAS_WIDTH; y = -50; }
    else if (edge === 1) { x = Math.random() * CANVAS_WIDTH; y = CANVAS_HEIGHT + 50; }
    else if (edge === 2) { x = -50; y = Math.random() * CANVAS_HEIGHT; }
    else { x = CANVAS_WIDTH + 50; y = Math.random() * CANVAS_HEIGHT; }
    enemies.push({ x, y, radius: 12 });
}

function update(dt) {
    if (gameState !== STATE.PLAY) return;

    if (keys['ArrowUp'] || keys['KeyW']) player.y -= player.speed * dt;
    if (keys['ArrowDown'] || keys['KeyS']) player.y += player.speed * dt;
    if (keys['ArrowLeft'] || keys['KeyA']) player.x -= player.speed * dt;
    if (keys['ArrowRight'] || keys['KeyD']) player.x += player.speed * dt;

    player.x = Math.max(0, Math.min(CANVAS_WIDTH - player.size, player.x));
    player.y = Math.max(0, Math.min(CANVAS_HEIGHT - player.size, player.y));

    survivalTime += dt;
    score += dt * 10;
    spawnTimer += dt;
    if (spawnTimer >= Math.max(0.4, currentDiff.spawnRate - survivalTime * 0.03)) {
        spawnEnemy(); spawnTimer = 0;
    }

    enemies.forEach((e, i) => {
        const dx = (player.x + player.size/2) - e.x;
        const dy = (player.y + player.size/2) - e.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const moveSpeed = (currentDiff.enemySpeed + survivalTime * 6) * dt;
        e.x += (dx / dist) * moveSpeed;
        e.y += (dy / dist) * moveSpeed;

        if (dist < e.radius + player.size/2) {
            gameState = STATE.GAMEOVER; shakeTime = 0.2;
            if (score > highScore) { highScore = Math.floor(score); localStorage.setItem('canvas_apocalypse_highscore', highScore); }
        }
    });
    if (shakeTime > 0) shakeTime -= dt;
}

function drawRocket(x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    // Корпус
    ctx.fillStyle = '#ff4d4d';
    ctx.beginPath(); ctx.moveTo(20,0); ctx.lineTo(-10,-10); ctx.lineTo(-5,0); ctx.lineTo(-10,10); ctx.closePath(); ctx.fill();
    // Огонь
    ctx.fillStyle = '#ff9900';
    ctx.beginPath(); ctx.moveTo(-10, -5); ctx.lineTo(-25, 0); ctx.lineTo(-10, 5); ctx.fill();
    ctx.restore();
}

function draw() {
    ctx.save();
    if (shakeTime > 0) ctx.translate(Math.random()*20 - 10, Math.random()*20 - 10);
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Сетка фона
    ctx.strokeStyle = '#222';
    for(let i=0; i<CANVAS_WIDTH; i+=50) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke(); }
    for(let i=0; i<CANVAS_HEIGHT; i+=50) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(CANVAS_WIDTH, i); ctx.stroke(); }

    if (gameState === STATE.MENU) {
        ctx.fillStyle = 'white'; ctx.textAlign = 'center';
        ctx.font = '40px Arial'; ctx.fillText('CANVAS APOCALYPSE', CANVAS_WIDTH/2, 250);
        ctx.font = '20px Arial'; ctx.fillText('1: Easy | 2: Medium | 3: Hard', CANVAS_WIDTH/2, 320);
    } else {
        // Игрок-флаг
        const s = player.size / 3;
        ctx.fillStyle = '#0072CE'; ctx.fillRect(player.x, player.y, player.size, s);
        ctx.fillStyle = '#000000'; ctx.fillRect(player.x, player.y + s, player.size, s);
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(player.x, player.y + 2*s, player.size, s);

        enemies.forEach(e => {
            const angle = Math.atan2((player.y+12)-e.y, (player.x+12)-e.x);
            drawRocket(e.x, e.y, angle);
        });

        ctx.fillStyle = 'white'; ctx.font = '18px monospace';
        ctx.fillText(`Score: ${Math.floor(score)} | High: ${highScore}`, 20, 30);
    }
    ctx.restore();
}

function gameLoop(t) {
    update((t - (lastTime || t)) / 1000);
    lastTime = t;
    draw();
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);