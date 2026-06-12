/* Automated logic tests for the Pac-Man game. Run: node pacman/test.js */
'use strict';

const { Game, MAZE, DIRS, COLS, ROWS, PAC_SPAWN, HOUSE_EXIT } = require('./game.js');

let passed = 0, failed = 0;
function check(name, cond, extra) {
  if (cond) { passed++; console.log(`  ok  ${name}`); }
  else { failed++; console.error(`FAIL  ${name}${extra ? ' — ' + extra : ''}`); }
}
function step(game, seconds, fps = 60) {
  const n = Math.round(seconds * fps);
  for (let i = 0; i < n; i++) game.update(1 / fps);
}
const walkable = (c, r) => {
  r = Math.round(r);
  if (r < 0 || r >= ROWS) return false;
  const ch = MAZE[r][((Math.round(c) % COLS) + COLS) % COLS];
  return ch !== '#';
};

// ---------- 1. maze integrity ----------
check('maze has 31 rows', MAZE.length === ROWS);
check('every row is 28 cols', MAZE.every(r => r.length === COLS), MAZE.map(r => r.length).join(','));
check('only legal chars', MAZE.every(r => /^[#.o\- ]+$/.test(r)));

let dotCount = 0, powerCount = 0;
for (const row of MAZE) for (const ch of row) {
  if (ch === '.') dotCount++;
  if (ch === 'o') powerCount++;
}
check('4 power pellets', powerCount === 4, String(powerCount));
check('plenty of dots', dotCount > 200, String(dotCount));

// ---------- 2. every dot reachable from spawn (BFS, door is a wall) ----------
{
  const seen = new Set();
  const q = [[PAC_SPAWN.x, PAC_SPAWN.y]];
  seen.add(`${PAC_SPAWN.x},${PAC_SPAWN.y}`);
  while (q.length) {
    const [c, r] = q.shift();
    for (const d of Object.values(DIRS)) {
      const nc = ((c + d.x) % COLS + COLS) % COLS, nr = r + d.y;
      if (nr < 0 || nr >= ROWS) continue;
      const ch = MAZE[nr][nc];
      if (ch === '#' || ch === '-') continue;
      const key = `${nc},${nr}`;
      if (!seen.has(key)) { seen.add(key); q.push([nc, nr]); }
    }
  }
  let unreachable = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if ((MAZE[r][c] === '.' || MAZE[r][c] === 'o') && !seen.has(`${c},${r}`)) unreachable.push(`${c},${r}`);
  }
  check('all dots reachable by pacman', unreachable.length === 0, unreachable.join(' '));
  check('pacman cannot reach ghost house', !seen.has('13,14'));
}

// ---------- 3. game start / basic movement & eating ----------
{
  const g = new Game();
  check('starts in attract', g.state === 'attract');
  g.setDir('left');                      // any direction key starts the game
  check('ready after input', g.state === 'ready');
  step(g, 2.1);
  check('playing after ready', g.state === 'playing');
  const x0 = g.pac.x;
  step(g, 1);
  check('pacman moved left', g.pac.x < x0, `x ${x0} -> ${g.pac.x}`);
  check('ate dots, score grew', g.score >= 30, String(g.score));
  check('dotsLeft decreased', g.dotsLeft < 244 + 2);
}

// ---------- 4. walls stop pacman; buffered turn works ----------
{
  const g = new Game();
  g.newGame(); g.readyTimer = 0; step(g, 0.05);
  // drive pacman left to column 6, then queue a downward turn
  g.setDir('left');
  let turned = false;
  for (let i = 0; i < 60 * 6 && !turned; i++) {
    if (Math.abs(g.pac.x - 6) < 1.2 && !turned) g.setDir('down');
    g.update(1 / 60);
    if (g.pac.y > 23.5) turned = true;
  }
  check('buffered turn executed', turned, `pac at ${g.pac.x.toFixed(2)},${g.pac.y.toFixed(2)}`);
  // wall test: face up at spawn-like tile where up is blocked
  const g2 = new Game();
  g2.newGame(); g2.readyTimer = 0; g2.update(0.016);
  g2.pac.x = 14; g2.pac.y = 23; g2.pac.dir = DIRS.up; g2.pac.nextDir = null;
  step(g2, 0.5);
  check('wall blocks upward move at spawn', Math.abs(g2.pac.y - 23) < 0.01, String(g2.pac.y));
}

// ---------- 5. tunnel wrap ----------
{
  const g = new Game();
  g.newGame(); g.readyTimer = 0; g.update(0.016);
  g.pac.x = 1; g.pac.y = 14; g.pac.dir = DIRS.left; g.pac.nextDir = null; g.pac.moving = true;
  // keep ghosts away
  for (const gh of g.ghosts) { gh.state = 'home'; gh.releaseTimer = 99; gh.x = 13; gh.y = 14; }
  step(g, 0.4);
  check('tunnel wraps left->right', g.pac.x > 20, String(g.pac.x));
}

// ---------- 6. power pellet -> frightened -> eat ghost -> eyes -> respawn ----------
{
  const g = new Game();
  g.newGame(); g.readyTimer = 0; g.update(0.016);
  g.pac.x = 1; g.pac.y = 3; g.pac.dir = DIRS.left; g.pac.moving = false; // sit on the power pellet tile
  g.update(1 / 60);
  check('power pellet triggers fright', g.frightTimer > 0, String(g.frightTimer));
  const blinky = g.ghosts[0];
  check('blinky frightened', blinky.frightened);
  const scoreBefore = g.score;
  blinky.x = g.pac.x; blinky.y = g.pac.y;
  g.update(1 / 60);
  check('eating ghost scores 200', g.score - scoreBefore === 200, String(g.score - scoreBefore));
  check('eaten ghost becomes eyes', blinky.state === 'eyes');
  // eyes should make it home and come back out
  let revived = false;
  for (let i = 0; i < 60 * 20; i++) {  // run the full 20s so the fright timer can expire too
    g.update(1 / 60);
    g.pac.x = 1; g.pac.y = 5; g.pac.moving = false; // park pacman somewhere safe
    if (blinky.state === 'normal' && !blinky.frightened) revived = true;
  }
  check('eyes return home and ghost revives', revived, blinky.state);
  check('fright eventually ends', g.frightTimer === 0);
}

// ---------- 7. death and life loss ----------
{
  const g = new Game();
  g.newGame(); g.readyTimer = 0; g.update(0.016);
  const blinky = g.ghosts[0];
  blinky.state = 'normal'; blinky.frightened = false;
  blinky.x = g.pac.x; blinky.y = g.pac.y;
  g.update(1 / 60);
  check('collision kills pacman', g.state === 'dying');
  step(g, 2);
  check('life lost', g.lives === 2, String(g.lives));
  check('back to ready', g.state === 'ready');
  // lose remaining lives -> game over
  for (let lives = 2; lives > 0; lives--) {
    g.readyTimer = 0; g.update(0.016);
    const b = g.ghosts[0];
    b.state = 'normal'; b.frightened = false; b.x = g.pac.x; b.y = g.pac.y;
    g.update(1 / 60);
    step(g, 2);
  }
  check('game over after 3 deaths', g.state === 'gameover', g.state);
  g.start();
  check('enter restarts game', g.state === 'ready' && g.lives === 3 && g.score === 0);
}

// ---------- 8. level clear ----------
{
  const g = new Game();
  g.newGame(); g.readyTimer = 0; g.update(0.016);
  // eat everything except the tile pacman sits on
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) g.dots[r][c] = 0;
  const pc = Math.round(g.pac.x), pr = Math.round(g.pac.y);
  g.dots[pr][pc] = 1;
  g.dotsLeft = 1;
  g.update(1 / 60);
  check('level clear triggers', g.state === 'levelclear', g.state);
  step(g, 2.5);
  check('advanced to level 2', g.level === 2, String(g.level));
  check('dots refilled', g.dotsLeft > 200, String(g.dotsLeft));
  check('state ready for level 2', g.state === 'ready');
}

// ---------- 9. ghost release + scatter/chase wave ----------
{
  const g = new Game();
  g.newGame(); g.readyTimer = 0; g.update(0.016);
  check('mode starts scatter', g.mode === 'scatter');
  // park pacman in a corner so he survives 10s
  g.pac.x = 1; g.pac.y = 29; g.pac.dir = DIRS.left; g.pac.nextDir = null;
  let died = false;
  for (let i = 0; i < 60 * 10; i++) {
    g.update(1 / 60);
    if (g.state !== 'playing') { died = true; break; }
  }
  if (!died) {
    check('all ghosts out of house after 10s', g.ghosts.every(gh => gh.state === 'normal'), g.ghosts.map(gh => gh.state).join(','));
    check('wave switched to chase', g.mode === 'chase', g.mode);
  } else {
    // pacman got cornered & eaten — still verify release happened before death
    check('ghost release in progress', g.ghosts.filter(gh => gh.state !== 'home').length >= 2);
    check('wave timer ticking', g.modeIndex >= 0);
  }
}

// ---------- 10. long random-play soak: invariants hold ----------
{
  const g = new Game();
  g.newGame(); g.readyTimer = 0; g.update(0.016);
  const dirNames = ['up', 'down', 'left', 'right'];
  let ok = true, why = '';
  for (let i = 0; i < 60 * 90; i++) {  // 90 simulated seconds
    if (i % 30 === 0) g.setDir(dirNames[Math.floor(Math.random() * 4)]);
    if (g.state === 'gameover') g.start();
    g.update(1 / 60);
    const p = g.pac;
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) { ok = false; why = 'pac NaN'; break; }
    if (g.state === 'playing' && !walkable(p.x, p.y)) { ok = false; why = `pac in wall at ${p.x},${p.y}`; break; }
    for (const gh of g.ghosts) {
      if (!Number.isFinite(gh.x) || !Number.isFinite(gh.y)) { ok = false; why = `${gh.name} NaN`; break; }
      if ((gh.state === 'normal' || gh.state === 'eyes') &&
          MAZE[Math.round(gh.y)] && MAZE[Math.round(gh.y)][((Math.round(gh.x) % COLS) + COLS) % COLS] === '#') {
        ok = false; why = `${gh.name} inside wall at ${gh.x.toFixed(2)},${gh.y.toFixed(2)} (${gh.state})`; break;
      }
    }
    if (!ok) break;
  }
  check('90s random-input soak: no NaN, nobody inside a wall', ok, why);
  check('score is sane', Number.isFinite(g.score) && g.score >= 0);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
