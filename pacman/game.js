/* Pac-Man — core game logic + canvas renderer.
   Logic is DOM-free so it can also run under Node for automated tests. */

'use strict';

const COLS = 28, ROWS = 31;

// '#' wall, '.' dot, 'o' power pellet, '-' ghost house door, ' ' open path
const MAZE = [
  "############################",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#o####.#####.##.#####.####o#",
  "#.####.#####.##.#####.####.#",
  "#..........................#",
  "#.####.##.########.##.####.#",
  "#.####.##.########.##.####.#",
  "#......##....##....##......#",
  "######.##### ## #####.######",
  "     #.##### ## #####.#     ",
  "     #.##          ##.#     ",
  "     #.## ###--### ##.#     ",
  "######.## #      # ##.######",
  "      .   #      #   .      ",
  "######.## #      # ##.######",
  "     #.## ######## ##.#     ",
  "     #.##          ##.#     ",
  "     #.## ######## ##.#     ",
  "######.## ######## ##.######",
  "#............##............#",
  "#.####.#####.##.#####.####.#",
  "#.####.#####.##.#####.####.#",
  "#o..##.......  .......##..o#",
  "###.##.##.########.##.##.###",
  "###.##.##.########.##.##.###",
  "#......##....##....##......#",
  "#.##########.##.##########.#",
  "#.##########.##.##########.#",
  "#..........................#",
  "############################",
];

const DIRS = {
  up:    { x: 0, y: -1 },
  left:  { x: -1, y: 0 },
  down:  { x: 0, y: 1 },
  right: { x: 1, y: 0 },
};
// Classic tie-break priority: up, left, down, right
const DIR_ORDER = [DIRS.up, DIRS.left, DIRS.down, DIRS.right];

const BASE = 9.47; // full speed in tiles/sec (~75.76 px/s at 8 px/tile)
const HOUSE_EXIT = { x: 13, y: 11 };  // tile just above the door
const HOUSE_CENTER_Y = 14;
const PAC_SPAWN = { x: 14, y: 23 };

const MODE_SCHEDULE = [
  ['scatter', 7], ['chase', 20],
  ['scatter', 7], ['chase', 20],
  ['scatter', 5], ['chase', 20],
  ['scatter', 5], ['chase', Infinity],
];

function opp(d) { return { x: -d.x, y: -d.y }; }
function sameDir(a, b) { return a && b && a.x === b.x && a.y === b.y; }
function wrapCol(c) { return ((c % COLS) + COLS) % COLS; }

class Game {
  constructor() {
    this.highScore = 0;
    this.onEvent = null;   // optional callback(name) for sounds
    this.time = 0;
    this.state = 'attract';
    this.paused = false;
    this.newGame();
    this.state = 'attract';
  }

  emit(name) { if (this.onEvent) try { this.onEvent(name); } catch (e) { /* sound is optional */ } }

  newGame() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.extraLifeGiven = false;
    this.startLevel();
    this.state = 'ready';
    this.readyTimer = 2.0;
  }

  startLevel() {
    this.dots = MAZE.map(row => row.split('').map(ch => ch === '.' ? 1 : ch === 'o' ? 2 : 0));
    this.dotsLeft = 0;
    for (const row of this.dots) for (const v of row) if (v) this.dotsLeft++;
    this.resetPositions();
  }

  resetPositions() {
    this.pac = {
      x: PAC_SPAWN.x, y: PAC_SPAWN.y,
      dir: DIRS.left, nextDir: null, moving: true,
    };
    const mk = (name, color, scatterT, start, state, release) => ({
      name, color, scatterT,
      x: start.x, y: start.y,
      dir: DIRS.left, moving: true,
      state,                      // home | leaving | normal | eyes | entering
      frightened: false,
      releaseTimer: release,
      bob: 1,
    });
    this.ghosts = [
      mk('blinky', '#ff0000', { x: 26, y: 1 },  { x: 13, y: 11 }, 'normal', 0),
      mk('pinky',  '#ffb8ff', { x: 1,  y: 1 },  { x: 13, y: 14 }, 'home',   0.7),
      mk('inky',   '#00ffff', { x: 26, y: 29 }, { x: 11, y: 14 }, 'home',   4),
      mk('clyde',  '#ffb852', { x: 1,  y: 29 }, { x: 16, y: 14 }, 'home',   7),
    ];
    this.modeIndex = 0;
    this.modeTimer = MODE_SCHEDULE[0][1];
    this.mode = MODE_SCHEDULE[0][0];
    this.frightTimer = 0;
    this.combo = 0;
    this.freezeTimer = 0;
    this.popups = [];
    this.wakaToggle = false;
  }

  // ---- speeds / tuning ----
  speedScale() { return Math.min(1.15, 1 + (this.level - 1) * 0.04); }
  pacSpeed() { return BASE * (this.frightTimer > 0 ? 0.9 : 0.8) * this.speedScale(); }
  ghostSpeed(g) {
    if (g.state === 'eyes' || g.state === 'entering') return BASE * 1.5;
    if (g.state === 'home' || g.state === 'leaving') return 3;
    if (g.frightened) return BASE * 0.5;
    return BASE * 0.75 * this.speedScale();
  }
  frightDuration() { return Math.max(1.5, 7 - (this.level - 1)); }

  // ---- grid helpers ----
  canMove(c, r) {
    if (r < 0 || r >= ROWS) return false;
    const ch = MAZE[r][wrapCol(Math.round(c))];
    return ch !== '#' && ch !== '-';
  }

  // ---- input ----
  setDir(name) {
    const d = DIRS[name];
    if (!d) return;
    if (this.state === 'attract') { this.newGame(); return; }
    if (this.state === 'gameover') return;
    const p = this.pac;
    if (p.moving && sameDir(d, opp(p.dir))) { p.dir = d; p.nextDir = null; }
    else p.nextDir = d;
  }

  start() { // Enter / Space / tap
    if (this.state === 'attract') this.newGame();
    else if (this.state === 'gameover') this.newGame();
  }

  togglePause() {
    if (this.state === 'playing' || this.state === 'ready') this.paused = !this.paused;
  }

  // ---- main update ----
  update(dt) {
    dt = Math.min(dt, 0.05);
    if (this.paused) return;
    this.time += dt;
    switch (this.state) {
      case 'attract':
      case 'gameover':
        return;
      case 'ready':
        this.readyTimer -= dt;
        if (this.readyTimer <= 0) this.state = 'playing';
        return;
      case 'dying':
        this.dyingTimer -= dt;
        if (this.dyingTimer <= 0) {
          this.lives--;
          if (this.lives > 0) {
            this.resetPositions();
            this.state = 'ready';
            this.readyTimer = 1.5;
          } else {
            this.state = 'gameover';
          }
        }
        return;
      case 'levelclear':
        this.clearTimer -= dt;
        if (this.clearTimer <= 0) {
          this.level++;
          this.startLevel();
          this.state = 'ready';
          this.readyTimer = 2.0;
        }
        return;
      case 'playing':
        this.updatePlaying(dt);
        return;
    }
  }

  updatePlaying(dt) {
    if (this.freezeTimer > 0) { this.freezeTimer -= dt; return; }

    for (const pop of this.popups) pop.t -= dt;
    this.popups = this.popups.filter(p => p.t > 0);

    // fright / scatter-chase wave timers (wave pauses while frightened)
    if (this.frightTimer > 0) {
      this.frightTimer -= dt;
      if (this.frightTimer <= 0) {
        this.frightTimer = 0;
        for (const g of this.ghosts) g.frightened = false;
      }
    } else if (this.modeTimer !== Infinity) {
      this.modeTimer -= dt;
      if (this.modeTimer <= 0) {
        this.modeIndex = Math.min(this.modeIndex + 1, MODE_SCHEDULE.length - 1);
        this.mode = MODE_SCHEDULE[this.modeIndex][0];
        this.modeTimer = MODE_SCHEDULE[this.modeIndex][1];
        for (const g of this.ghosts) {
          if (g.state === 'normal') g.dir = opp(g.dir);
        }
      }
    }

    // pacman
    this.moveActor(this.pac, this.pacSpeed() * dt, a => this.decidePac(a));
    this.eatAtTile();

    // ghosts
    for (const g of this.ghosts) this.updateGhost(g, dt);

    // collisions
    for (const g of this.ghosts) {
      if (g.state !== 'normal' && g.state !== 'leaving') continue;
      if (Math.abs(g.x - this.pac.x) < 0.7 && Math.abs(g.y - this.pac.y) < 0.7) {
        if (g.frightened) {
          const pts = 200 << this.combo;
          this.combo = Math.min(this.combo + 1, 3);
          this.addScore(pts);
          this.popups.push({ x: g.x, y: g.y, text: String(pts), t: 1.2 });
          g.state = 'eyes';
          g.frightened = false;
          this.freezeTimer = 0.4;
          this.emit('eatghost');
        } else {
          this.state = 'dying';
          this.dyingTimer = 1.8;
          this.emit('death');
          return;
        }
      }
    }

    if (this.dotsLeft <= 0) {
      this.state = 'levelclear';
      this.clearTimer = 2.2;
      this.emit('levelclear');
    }
  }

  addScore(pts) {
    this.score += pts;
    if (!this.extraLifeGiven && this.score >= 10000) {
      this.extraLifeGiven = true;
      this.lives++;
      this.emit('extralife');
    }
    if (this.score > this.highScore) this.highScore = this.score;
  }

  eatAtTile() {
    const c = wrapCol(Math.round(this.pac.x));
    const r = Math.round(this.pac.y);
    if (r < 0 || r >= ROWS) return;
    const v = this.dots[r][c];
    if (!v) return;
    this.dots[r][c] = 0;
    this.dotsLeft--;
    if (v === 1) {
      this.addScore(10);
      this.wakaToggle = !this.wakaToggle;
      this.emit(this.wakaToggle ? 'waka1' : 'waka2');
    } else {
      this.addScore(50);
      this.frightTimer = this.frightDuration();
      this.combo = 0;
      for (const g of this.ghosts) {
        if (g.state === 'eyes' || g.state === 'entering') continue;
        g.frightened = true;
        if (g.state === 'normal') g.dir = opp(g.dir);
      }
      this.emit('power');
    }
  }

  // ---- movement: advance `dist` tiles along axis, deciding at tile centers ----
  moveActor(a, dist, decideFn) {
    let guard = 0;
    while (dist > 1e-9 && guard++ < 200) {
      const atCx = Math.abs(a.x - Math.round(a.x)) < 1e-6;
      const atCy = Math.abs(a.y - Math.round(a.y)) < 1e-6;
      if (atCx && atCy) {
        a.x = Math.round(a.x);
        a.y = Math.round(a.y);
        decideFn(a);
        if (!a.moving) return;
      }
      let step;
      if (a.dir.x !== 0) {
        const target = a.dir.x > 0 ? Math.floor(a.x + 1e-6) + 1 : Math.ceil(a.x - 1e-6) - 1;
        step = Math.min(Math.abs(target - a.x), dist);
        a.x += a.dir.x * step;
        if (Math.abs(a.x - target) < 1e-9) a.x = target;
      } else {
        const target = a.dir.y > 0 ? Math.floor(a.y + 1e-6) + 1 : Math.ceil(a.y - 1e-6) - 1;
        step = Math.min(Math.abs(target - a.y), dist);
        a.y += a.dir.y * step;
        if (Math.abs(a.y - target) < 1e-9) a.y = target;
      }
      dist -= step;
      if (a.x < -0.5) a.x += COLS;
      if (a.x > COLS - 0.5) a.x -= COLS;
    }
  }

  decidePac(a) {
    const cx = Math.round(a.x), cy = Math.round(a.y);
    if (a.nextDir && this.canMove(cx + a.nextDir.x, cy + a.nextDir.y)) {
      a.dir = a.nextDir;
      a.nextDir = null;
    }
    a.moving = this.canMove(cx + a.dir.x, cy + a.dir.y);
  }

  // ---- ghosts ----
  updateGhost(g, dt) {
    const sp = this.ghostSpeed(g);
    switch (g.state) {
      case 'home': {
        g.y += g.bob * 1.6 * dt;
        if (g.y > HOUSE_CENTER_Y + 0.4) { g.y = HOUSE_CENTER_Y + 0.4; g.bob = -1; }
        if (g.y < HOUSE_CENTER_Y - 0.4) { g.y = HOUSE_CENTER_Y - 0.4; g.bob = 1; }
        g.releaseTimer -= dt;
        if (g.releaseTimer <= 0) g.state = 'leaving';
        return;
      }
      case 'leaving': {
        if (Math.abs(g.x - HOUSE_EXIT.x) > 0.05) {
          g.x += Math.sign(HOUSE_EXIT.x - g.x) * sp * dt;
          if (Math.abs(g.x - HOUSE_EXIT.x) <= 0.05) g.x = HOUSE_EXIT.x;
        } else if (Math.abs(g.y - HOUSE_CENTER_Y) > 0.05 && g.y > HOUSE_EXIT.y) {
          g.x = HOUSE_EXIT.x;
          g.y -= sp * dt;
          if (g.y <= HOUSE_EXIT.y) { g.y = HOUSE_EXIT.y; g.state = 'normal'; g.dir = DIRS.left; }
        } else {
          g.y -= sp * dt;
          if (g.y <= HOUSE_EXIT.y) { g.y = HOUSE_EXIT.y; g.state = 'normal'; g.dir = DIRS.left; }
        }
        return;
      }
      case 'entering': {
        g.x = HOUSE_EXIT.x;
        g.y += sp * dt;
        if (g.y >= HOUSE_CENTER_Y) {
          g.y = HOUSE_CENTER_Y;
          g.state = 'leaving';
        }
        return;
      }
      case 'eyes': {
        this.moveActor(g, sp * dt, a => this.decideGhost(a));
        if (Math.abs(g.x - HOUSE_EXIT.x) < 0.1 && Math.abs(g.y - HOUSE_EXIT.y) < 0.1) {
          g.x = HOUSE_EXIT.x; g.y = HOUSE_EXIT.y;
          g.state = 'entering';
        }
        return;
      }
      case 'normal': {
        this.moveActor(g, sp * dt, a => this.decideGhost(a));
        return;
      }
    }
  }

  decideGhost(g) {
    g.moving = true;
    const cx = Math.round(g.x), cy = Math.round(g.y);
    const rev = opp(g.dir);
    const cands = [];
    for (const d of DIR_ORDER) {
      if (sameDir(d, rev)) continue;
      if (this.canMove(cx + d.x, cy + d.y)) cands.push(d);
    }
    if (cands.length === 0) { g.dir = rev; return; }
    if (g.state === 'normal' && g.frightened) {
      g.dir = cands[Math.floor(Math.random() * cands.length)];
      return;
    }
    const t = this.ghostTarget(g);
    let best = cands[0], bestD = Infinity;
    for (const d of cands) {
      const nx = cx + d.x, ny = cy + d.y;
      const dd = (nx - t.x) * (nx - t.x) + (ny - t.y) * (ny - t.y);
      if (dd < bestD) { bestD = dd; best = d; }
    }
    g.dir = best;
  }

  ghostTarget(g) {
    if (g.state === 'eyes') return HOUSE_EXIT;
    if (this.mode === 'scatter') return g.scatterT;
    const p = this.pac;
    switch (g.name) {
      case 'blinky':
        return { x: p.x, y: p.y };
      case 'pinky':
        return { x: p.x + p.dir.x * 4, y: p.y + p.dir.y * 4 };
      case 'inky': {
        const b = this.ghosts[0];
        const ax = p.x + p.dir.x * 2, ay = p.y + p.dir.y * 2;
        return { x: 2 * ax - b.x, y: 2 * ay - b.y };
      }
      case 'clyde': {
        const d2 = (g.x - p.x) ** 2 + (g.y - p.y) ** 2;
        return d2 > 64 ? { x: p.x, y: p.y } : g.scatterT;
      }
    }
    return g.scatterT;
  }
}

// ======================= RENDERER (browser only) =======================

function draw(ctx, game, T, offY) {
  const W = COLS * T, H = ROWS * T + offY * 2;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  const px = x => (x + 0.5) * T;
  const py = y => (y + 0.5) * T + offY;

  // walls
  ctx.strokeStyle = '#2121ff';
  ctx.lineWidth = Math.max(2, T * 0.16);
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (MAZE[r][c] !== '#') continue;
      let connected = false;
      if (c + 1 < COLS && MAZE[r][c + 1] === '#') {
        ctx.moveTo(px(c), py(r)); ctx.lineTo(px(c + 1), py(r)); connected = true;
      }
      if (r + 1 < ROWS && MAZE[r + 1][c] === '#') {
        ctx.moveTo(px(c), py(r)); ctx.lineTo(px(c), py(r + 1)); connected = true;
      }
      if (!connected &&
          !(c > 0 && MAZE[r][c - 1] === '#') &&
          !(r > 0 && MAZE[r - 1][c] === '#')) {
        ctx.moveTo(px(c) - T * 0.2, py(r)); ctx.lineTo(px(c) + T * 0.2, py(r));
      }
    }
  }
  ctx.stroke();

  // ghost house door
  ctx.strokeStyle = '#ffb8de';
  ctx.lineWidth = Math.max(2, T * 0.12);
  ctx.beginPath();
  ctx.moveTo(px(13) - T * 0.5, py(12));
  ctx.lineTo(px(14) + T * 0.5, py(12));
  ctx.stroke();

  // dots
  if (game.dots) {
    ctx.fillStyle = '#ffb897';
    const blinkOn = (game.time * 3) % 1 < 0.6;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = game.dots[r][c];
        if (!v) continue;
        if (v === 1) {
          ctx.fillRect(px(c) - T * 0.1, py(r) - T * 0.1, T * 0.2, T * 0.2);
        } else if (blinkOn || game.state !== 'playing') {
          ctx.beginPath();
          ctx.arc(px(c), py(r), T * 0.32, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  // attract screen
  if (game.state === 'attract') {
    drawCenterText(ctx, 'PAC-MAN', W / 2, py(11), T * 1.6, '#ffe000');
    drawCenterText(ctx, 'PRESS ARROW KEY OR SWIPE', W / 2, py(17), T * 0.75, '#fff');
    drawCenterText(ctx, 'TO START', W / 2, py(18.3), T * 0.75, '#fff');
    const names = ['#ff0000', '#ffb8ff', '#00ffff', '#ffb852'];
    names.forEach((col, i) => drawGhostShape(ctx, px(11 + i * 2), py(14), T, col, DIRS.left, false, false, game.time));
    drawHud(ctx, game, T, offY, W, H);
    return;
  }

  // pacman
  if (game.state !== 'levelclear' || (game.time * 4) % 1 < 0.5) {
    drawPac(ctx, game, px(game.pac.x), py(game.pac.y), T);
  }

  // ghosts
  if (game.state !== 'dying' || game.dyingTimer > 1.5) {
    for (const g of game.ghosts) {
      const flash = game.frightTimer > 0 && game.frightTimer < 2 && (game.time * 5) % 1 < 0.5;
      if (g.state === 'eyes' || g.state === 'entering') {
        drawEyes(ctx, px(g.x), py(g.y), T, g.dir);
      } else {
        drawGhostShape(ctx, px(g.x), py(g.y), T, g.frightened ? (flash ? '#fff' : '#2121de') : g.color,
          g.dir, g.frightened, flash, game.time);
      }
    }
  }

  // score popups
  ctx.fillStyle = '#00ffff';
  ctx.font = `bold ${Math.round(T * 0.6)}px monospace`;
  ctx.textAlign = 'center';
  for (const pop of game.popups) ctx.fillText(pop.text, px(pop.x), py(pop.y - (1.2 - pop.t) * 0.8));

  // overlays
  if (game.state === 'ready') drawCenterText(ctx, 'READY!', px(13.5), py(17), T * 0.9, '#ffe000');
  if (game.state === 'gameover') drawCenterText(ctx, 'GAME OVER', px(13.5), py(17), T * 0.9, '#ff0000');
  if (game.paused) drawCenterText(ctx, 'PAUSED', px(13.5), py(17), T * 0.9, '#fff');

  drawHud(ctx, game, T, offY, W, H);
}

function drawHud(ctx, game, T, offY, W, H) {
  ctx.textAlign = 'left';
  ctx.font = `bold ${Math.round(T * 0.65)}px monospace`;
  ctx.fillStyle = '#fff';
  ctx.fillText('SCORE', T * 0.5, offY * 0.45);
  ctx.fillText(String(game.score), T * 0.5, offY * 0.85);
  ctx.textAlign = 'center';
  ctx.fillText('HIGH SCORE', W / 2, offY * 0.45);
  ctx.fillText(String(game.highScore), W / 2, offY * 0.85);
  ctx.textAlign = 'right';
  ctx.fillText('LEVEL', W - T * 0.5, offY * 0.45);
  ctx.fillText(String(game.level), W - T * 0.5, offY * 0.85);
  // spare lives
  for (let i = 0; i < Math.max(0, game.lives - 1); i++) {
    const cx = T * (1 + i * 1.4), cy = H - offY * 0.5;
    ctx.fillStyle = '#ffe000';
    ctx.beginPath();
    ctx.arc(cx, cy, T * 0.42, 0.25 * Math.PI, 1.75 * Math.PI);
    ctx.lineTo(cx, cy);
    ctx.fill();
  }
  if (game.state === 'gameover') {
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.font = `bold ${Math.round(T * 0.55)}px monospace`;
    ctx.fillText('ENTER TO RESTART', W - T * 0.5, H - offY * 0.4);
  }
}

function drawCenterText(ctx, text, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.font = `bold ${Math.round(size)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y + size * 0.35);
}

function drawPac(ctx, game, cx, cy, T) {
  const p = game.pac;
  const r = T * 0.55;
  let mouth;
  if (game.state === 'dying') {
    mouth = Math.min(1, (1.8 - game.dyingTimer) / 1.3) * Math.PI;
  } else {
    mouth = (p.moving && game.state === 'playing')
      ? (0.12 + 0.23 * Math.abs(Math.sin(game.time * 12))) * Math.PI
      : 0.2 * Math.PI;
  }
  let ang = 0;
  if (p.dir === DIRS.left) ang = Math.PI;
  else if (p.dir === DIRS.up) ang = -Math.PI / 2;
  else if (p.dir === DIRS.down) ang = Math.PI / 2;
  ctx.fillStyle = '#ffe000';
  ctx.beginPath();
  ctx.arc(cx, cy, r, ang + mouth, ang - mouth + Math.PI * 2);
  ctx.lineTo(cx, cy);
  ctx.fill();
}

function drawGhostShape(ctx, cx, cy, T, color, dir, frightened, flash, time) {
  const r = T * 0.52;
  const bottom = cy + r * 0.95;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.1, r, Math.PI, 0);
  ctx.lineTo(cx + r, bottom);
  const bumps = 3, w = (2 * r) / (bumps * 2);
  const wob = Math.sin(time * 10) > 0 ? 1 : 0;
  for (let i = 0; i < bumps; i++) {
    const x0 = cx + r - (i * 2 + wob) * w;
    ctx.lineTo(x0 - w, bottom - r * 0.25);
    ctx.lineTo(x0 - 2 * w, bottom);
  }
  ctx.closePath();
  ctx.fill();

  if (frightened) {
    ctx.fillStyle = flash ? '#ff0000' : '#ffb8de';
    // eyes
    ctx.fillRect(cx - r * 0.45, cy - r * 0.3, r * 0.22, r * 0.22);
    ctx.fillRect(cx + r * 0.23, cy - r * 0.3, r * 0.22, r * 0.22);
    // wavy mouth
    ctx.beginPath();
    ctx.lineWidth = Math.max(1, T * 0.07);
    ctx.strokeStyle = flash ? '#ff0000' : '#ffb8de';
    const my = cy + r * 0.35;
    ctx.moveTo(cx - r * 0.55, my);
    for (let i = 0; i < 4; i++) {
      ctx.lineTo(cx - r * 0.55 + (i + 0.5) * r * 0.28, my - r * 0.15);
      ctx.lineTo(cx - r * 0.55 + (i + 1) * r * 0.28, my);
    }
    ctx.stroke();
  } else {
    drawEyes(ctx, cx, cy, T, dir);
  }
}

function drawEyes(ctx, cx, cy, T, dir) {
  const r = T * 0.52;
  const ex = dir.x * r * 0.16, ey = dir.y * r * 0.16;
  for (const side of [-1, 1]) {
    const ox = cx + side * r * 0.36 + ex * 0.5;
    const oy = cy - r * 0.18 + ey * 0.5;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(ox, oy, r * 0.26, r * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2121de';
    ctx.beginPath();
    ctx.arc(ox + ex, oy + ey, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Game, MAZE, DIRS, COLS, ROWS, PAC_SPAWN, HOUSE_EXIT };
}
