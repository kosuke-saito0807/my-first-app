const canvas = document.querySelector('#game-canvas');
const ctx = canvas.getContext('2d');
const coinCount = document.querySelector('#coin-count');
const bestScore = document.querySelector('#best-score');
const message = document.querySelector('#message');
const messageTitle = document.querySelector('#message-title');
const restartButton = document.querySelector('#restart-button');

const keys = {};
let world, player, camera, score, gameOver, lastTime;
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
  ctx.fillStyle = '#171b3c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save(); ctx.translate(-camera.x, 0);
  ctx.fillStyle = '#242b59'; for (let x = -100; x < world.width; x += 180) { ctx.beginPath(); ctx.moveTo(x, 470); ctx.lineTo(x + 100, 300); ctx.lineTo(x + 220, 470); ctx.fill(); }
  for (const platform of world.platforms) { ctx.fillStyle = '#4d65a8'; ctx.fillRect(platform.x, platform.y, platform.w, platform.h); ctx.fillStyle = '#77d5b3'; ctx.fillRect(platform.x, platform.y, platform.w, 10); }
  for (const coin of world.coins) if (!coin.taken) { ctx.fillStyle = '#ffcf55'; ctx.beginPath(); ctx.arc(coin.x, coin.y, 11, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff1a7'; ctx.fillRect(coin.x - 2, coin.y - 7, 4, 14); }
  for (const enemy of world.enemies) if (enemy.x > -100) { ctx.fillStyle = '#ed5578'; ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h); ctx.fillStyle = '#17152d'; ctx.fillRect(enemy.x + 7, enemy.y + 10, 6, 7); ctx.fillRect(enemy.x + 22, enemy.y + 10, 6, 7); }
  ctx.fillStyle = '#67d9ff'; ctx.fillRect(player.x, player.y, player.w, player.h); ctx.fillStyle = '#fff'; ctx.fillRect(player.x + 18, player.y + 12, 7, 7);
  ctx.restore();
}

function loop(now) { const dt = Math.min(.033, (now - lastTime) / 1000); lastTime = now; update(dt); draw(); if (!gameOver) requestAnimationFrame(loop); }
window.addEventListener('keydown', e => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' '].includes(e.key)) e.preventDefault(); keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });
restartButton.addEventListener('click', reset);
reset();
