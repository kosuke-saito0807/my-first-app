const canvas = document.querySelector('#game-canvas');
const ctx = canvas.getContext('2d');
const coinCount = document.querySelector('#coin-count');
const bestScore = document.querySelector('#best-score');
const message = document.querySelector('#message');
const messageTitle = document.querySelector('#message-title');
const restartButton = document.querySelector('#restart-button');
const musicButton = document.querySelector('#music-button');

const keys = {};
let world, player, camera, score, gameOver, lastTime, musicContext, musicTimer, musicOn = false;
const best = Number(localStorage.getItem('star-runner-best') || 0);
bestScore.textContent = best;

function reset() {
  world = {
    width: 5200, gravity: 1700, platforms: [
      { x: 0, y: 470, w: 900, h: 70 }, { x: 1040, y: 405, w: 330, h: 30 },
      { x: 1490, y: 470, w: 700, h: 70 }, { x: 2320, y: 370, w: 300, h: 30 },
      { x: 2720, y: 445, w: 580, h: 95 }, { x: 3450, y: 390, w: 350, h: 30 },
      { x: 3930, y: 470, w: 1270, h: 70 }
    ],
    coins: [220, 430, 660, 1130, 1250, 1640, 1860, 2050, 2420, 2850, 3020, 3560, 3710, 4160, 4430, 4760].map((x, i) => ({ x, y: [405, 405, 405, 340, 340, 405, 405, 405, 305, 380, 380, 325, 325, 405, 405, 405][i], taken: false })),
    enemies: [{ x: 570, y: 430, w: 34, h: 40, vx: 55, min: 450, max: 820 }, { x: 1740, y: 430, w: 34, h: 40, vx: 65, min: 1540, max: 2100 }, { x: 2930, y: 405, w: 34, h: 40, vx: 50, min: 2760, max: 3200 }, { x: 4350, y: 430, w: 34, h: 40, vx: 75, min: 4050, max: 4900 }]
  };
  player = { x: 90, y: 400, w: 30, h: 55, vx: 0, vy: 0, grounded: false };
  camera = { x: 0 }; score = 0; gameOver = false; lastTime = performance.now();
  message.hidden = true; updateScore(); requestAnimationFrame(loop);
}

function updateScore() { coinCount.textContent = score; }
function overlaps(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

function playTone(frequency, duration, offset = 0) {
  if (!musicContext || !musicOn) return;
  const oscillator = musicContext.createOscillator();
  const gain = musicContext.createGain();
  oscillator.type = 'square';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, musicContext.currentTime + offset);
  gain.gain.exponentialRampToValueAtTime(0.035, musicContext.currentTime + offset + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, musicContext.currentTime + offset + duration);
  oscillator.connect(gain).connect(musicContext.destination);
  oscillator.start(musicContext.currentTime + offset);
  oscillator.stop(musicContext.currentTime + offset + duration + 0.02);
}

function toggleMusic() {
  if (!musicContext) musicContext = new (window.AudioContext || window.webkitAudioContext)();
  if (musicOn) {
    musicOn = false;
    clearInterval(musicTimer);
    musicButton.textContent = '♪ BGM OFF';
    musicButton.setAttribute('aria-pressed', 'false');
    return;
  }
  musicOn = true;
  musicContext.resume();
  const melody = [261.63, 329.63, 392, 523.25, 392, 329.63, 293.66, 392];
  let step = 0;
  const playBar = () => {
    playTone(melody[step % melody.length], 0.18);
    playTone(melody[(step + 2) % melody.length] / 2, 0.3, 0.02);
    step++;
  };
  playBar();
  musicTimer = setInterval(playBar, 260);
  musicButton.textContent = '♪ BGM ON';
  musicButton.setAttribute('aria-pressed', 'true');
}

function update(dt) {
  if (gameOver) return;
  const left = keys.ArrowLeft || keys.a, right = keys.ArrowRight || keys.d;
  player.vx = (right ? 280 : 0) - (left ? 280 : 0);
  if ((keys[' '] || keys.ArrowUp || keys.w) && player.grounded) { player.vy = -650; player.grounded = false; }
  player.vy += world.gravity * dt; player.x += player.vx * dt; player.y += player.vy * dt;
  player.x = Math.max(0, Math.min(world.width - player.w, player.x));
  player.grounded = false;
  for (const platform of world.platforms) {
    if (player.vy >= 0 && player.x + player.w > platform.x && player.x < platform.x + platform.w &&
      player.y + player.h >= platform.y && player.y + player.h - player.vy * dt <= platform.y) {
      player.y = platform.y - player.h; player.vy = 0; player.grounded = true;
    }
  }
  for (const coin of world.coins) {
    if (!coin.taken && Math.hypot(player.x + player.w / 2 - coin.x, player.y + player.h / 2 - coin.y) < 28) { coin.taken = true; score++; updateScore(); }
  }
  for (const enemy of world.enemies) {
    enemy.x += enemy.vx * dt;
    if (enemy.x < enemy.min || enemy.x > enemy.max) enemy.vx *= -1;
    if (overlaps(player, enemy)) {
      if (player.vy > 0 && player.y + player.h - enemy.y < 20) { player.vy = -520; enemy.x = -100; score += 2; updateScore(); }
      else return endGame('GAME OVER');
    }
  }
  if (player.y > canvas.height + 100) return endGame('TRY AGAIN');
  camera.x += (player.x - canvas.width * .35 - camera.x) * Math.min(1, dt * 5);
  camera.x = Math.max(0, Math.min(world.width - canvas.width, camera.x));
}

function endGame(title) {
  gameOver = true; messageTitle.textContent = title;
  if (score > Number(localStorage.getItem('star-runner-best') || 0)) { localStorage.setItem('star-runner-best', score); bestScore.textContent = score; }
  message.hidden = false;
}

function draw() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#090d2b'); sky.addColorStop(0.58, '#18245a'); sky.addColorStop(1, '#34215b');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffe8a3'; ctx.shadowColor = '#ffcf55'; ctx.shadowBlur = 25;
  ctx.beginPath(); ctx.arc(790, 105, 42, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  for (let i = 0; i < 55; i++) {
    const x = (i * 173 + 47) % canvas.width, y = (i * 71 + 23) % 280;
    ctx.fillStyle = i % 4 === 0 ? '#ffcf55' : '#a9d9ff';
    ctx.globalAlpha = 0.45 + (i % 3) * 0.2; ctx.fillRect(x, y, i % 5 === 0 ? 3 : 2, i % 5 === 0 ? 3 : 2);
  }
  ctx.globalAlpha = 1;
  ctx.save(); ctx.translate(-camera.x, 0);
  ctx.fillStyle = '#10183d';
  for (let x = -100; x < world.width; x += 180) { ctx.beginPath(); ctx.moveTo(x, 470); ctx.lineTo(x + 100, 300); ctx.lineTo(x + 220, 470); ctx.fill(); }
  for (let x = -80; x < world.width; x += 115) {
    const h = 35 + ((x * 7) % 75); ctx.fillStyle = '#111536'; ctx.fillRect(x, 470 - h, 74, h);
    ctx.fillStyle = '#ffcf55'; for (let y = 485 - h; y < 465; y += 18) ctx.fillRect(x + 12, y, 5, 5);
  }
  for (const platform of world.platforms) {
    const platformGradient = ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.h);
    platformGradient.addColorStop(0, '#536fd1'); platformGradient.addColorStop(1, '#283675');
    ctx.fillStyle = platformGradient; ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
    ctx.fillStyle = '#5ff0c2'; ctx.fillRect(platform.x, platform.y, platform.w, 9);
    ctx.fillStyle = '#b6fff0'; ctx.fillRect(platform.x, platform.y, platform.w, 2);
  }
  for (const coin of world.coins) if (!coin.taken) {
    ctx.fillStyle = '#ffcf55'; ctx.shadowColor = '#ffcf55'; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(coin.x, coin.y, 11, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff1a7'; ctx.fillRect(coin.x - 2, coin.y - 7, 4, 14);
  }
  for (const enemy of world.enemies) if (enemy.x > -100) {
    ctx.fillStyle = '#ff477e'; ctx.shadowColor = '#ff477e'; ctx.shadowBlur = 12;
    ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h); ctx.shadowBlur = 0;
    ctx.fillStyle = '#17152d'; ctx.fillRect(enemy.x + 7, enemy.y + 10, 6, 7); ctx.fillRect(enemy.x + 22, enemy.y + 10, 6, 7);
    ctx.fillStyle = '#ff9ab5'; ctx.fillRect(enemy.x + 5, enemy.y + 32, 24, 4);
  }
  ctx.fillStyle = '#67d9ff'; ctx.shadowColor = '#38cfff'; ctx.shadowBlur = 18;
  ctx.fillRect(player.x + 3, player.y + 10, player.w - 6, player.h - 10);
  ctx.fillStyle = '#24316f'; ctx.fillRect(player.x + 5, player.y, player.w - 10, 17);
  ctx.fillStyle = '#fff'; ctx.fillRect(player.x + 18, player.y + 5, 7, 7);
  ctx.fillStyle = '#ffcf55'; ctx.fillRect(player.x - 4, player.y + player.h - 7, 12, 7); ctx.fillRect(player.x + 22, player.y + player.h - 7, 12, 7);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function loop(now) { const dt = Math.min(.033, (now - lastTime) / 1000); lastTime = now; update(dt); draw(); if (!gameOver) requestAnimationFrame(loop); }
window.addEventListener('keydown', e => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' '].includes(e.key)) e.preventDefault(); keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });
restartButton.addEventListener('click', reset);
musicButton.addEventListener('click', toggleMusic);
window.addEventListener('keydown', () => {
  if (!musicOn && musicContext) toggleMusic();
}, { once: true });
reset();
