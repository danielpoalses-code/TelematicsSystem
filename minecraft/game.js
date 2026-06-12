/* Voxel sandbox (Minecraft-style creative mode).
   World/meshing/raycast logic is DOM-free so it can run under Node for tests;
   initGame() at the bottom wires it to Three.js + browser input. */

'use strict';

const CHUNK = 16, HEIGHT = 64, SEA = 12;

const AIR = 0, GRASS = 1, DIRT = 2, STONE = 3, LOG = 4, LEAVES = 5, SAND = 6,
      WATER = 7, PLANK = 8, BRICK = 9, GLASS = 10, COBBLE = 11, BEDROCK = 12,
      SNOW = 13;

// tile atlas indices
const T_GRASS_TOP = 0, T_GRASS_SIDE = 1, T_DIRT = 2, T_STONE = 3, T_COBBLE = 4,
      T_PLANK = 5, T_LOG_SIDE = 6, T_LOG_TOP = 7, T_LEAVES = 8, T_SAND = 9,
      T_GLASS = 10, T_BRICK = 11, T_WATER = 12, T_BEDROCK = 13, T_SNOW = 14;
const NTILES = 15;

// tiles: [top, side, bottom]
const BLOCKS = {
  [GRASS]:   { name: 'Grass',   tiles: [T_GRASS_TOP, T_GRASS_SIDE, T_DIRT] },
  [DIRT]:    { name: 'Dirt',    tiles: [T_DIRT, T_DIRT, T_DIRT] },
  [STONE]:   { name: 'Stone',   tiles: [T_STONE, T_STONE, T_STONE] },
  [LOG]:     { name: 'Wood Log',tiles: [T_LOG_TOP, T_LOG_SIDE, T_LOG_TOP] },
  [LEAVES]:  { name: 'Leaves',  tiles: [T_LEAVES, T_LEAVES, T_LEAVES] },
  [SAND]:    { name: 'Sand',    tiles: [T_SAND, T_SAND, T_SAND] },
  [WATER]:   { name: 'Water',   tiles: [T_WATER, T_WATER, T_WATER] },
  [PLANK]:   { name: 'Planks',  tiles: [T_PLANK, T_PLANK, T_PLANK] },
  [BRICK]:   { name: 'Bricks',  tiles: [T_BRICK, T_BRICK, T_BRICK] },
  [GLASS]:   { name: 'Glass',   tiles: [T_GLASS, T_GLASS, T_GLASS] },
  [COBBLE]:  { name: 'Cobble',  tiles: [T_COBBLE, T_COBBLE, T_COBBLE] },
  [BEDROCK]: { name: 'Bedrock', tiles: [T_BEDROCK, T_BEDROCK, T_BEDROCK] },
  [SNOW]:    { name: 'Snow',    tiles: [T_SNOW, T_SNOW, T_SNOW] },
};

const HOTBAR = [GRASS, DIRT, STONE, PLANK, LOG, LEAVES, GLASS, SAND, BRICK];

function isOpaque(t) { return t !== AIR && t !== WATER && t !== GLASS && t !== LEAVES; }
function isSolid(t) { return t !== AIR && t !== WATER; }

// ---------------- deterministic noise ----------------
function hash2i(x, z, seed) {
  let h = (seed | 0) ^ Math.imul(x | 0, 374761393) ^ Math.imul(z | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function smooth(t) { return t * t * (3 - 2 * t); }
function vnoise(x, z, seed) {
  const xi = Math.floor(x), zi = Math.floor(z);
  const xf = x - xi, zf = z - zi;
  const a = hash2i(xi, zi, seed), b = hash2i(xi + 1, zi, seed);
  const c = hash2i(xi, zi + 1, seed), d = hash2i(xi + 1, zi + 1, seed);
  const u = smooth(xf), v = smooth(zf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, z, seed) {
  let amp = 1, f = 1, sum = 0, norm = 0;
  for (let o = 0; o < 4; o++) {
    sum += vnoise(x * f, z * f, seed + o * 101) * amp;
    norm += amp; amp *= 0.5; f *= 2;
  }
  return sum / norm;
}

// ---------------- world ----------------
class World {
  constructor(seed = 1337, generator = 'terrain') {
    this.seed = seed;
    this.generator = generator;
    this.chunks = new Map();
    this.dirty = new Set();
  }
  key(cx, cz) { return cx + ',' + cz; }

  height(x, z) {
    const n = fbm(x * 0.013, z * 0.013, this.seed);
    const m = fbm(x * 0.07, z * 0.07, this.seed + 777);
    const h = Math.floor(4 + n * 26 + m * 5);
    return Math.max(2, Math.min(HEIGHT - 22, h));
  }
  treeHeight(x, z) {
    const h = this.height(x, z);
    if (h <= SEA + 1) return 0;
    return hash2i(x, z, this.seed + 999) < 0.018
      ? 4 + Math.floor(hash2i(x, z, this.seed + 555) * 3) : 0;
  }

  ensureChunk(cx, cz) {
    const k = this.key(cx, cz);
    let data = this.chunks.get(k);
    if (data) return data;
    data = new Uint8Array(CHUNK * HEIGHT * CHUNK);
    this.chunks.set(k, data);
    if (this.generator === 'empty') return data;

    const idx = (lx, y, lz) => (y * CHUNK + lz) * CHUNK + lx;
    for (let lx = 0; lx < CHUNK; lx++) {
      for (let lz = 0; lz < CHUNK; lz++) {
        const wx = cx * CHUNK + lx, wz = cz * CHUNK + lz;
        const h = this.height(wx, wz);
        for (let y = 0; y <= h; y++) {
          let t;
          if (y === 0) t = BEDROCK;
          else if (y < h - 2) t = STONE;
          else if (y < h) t = DIRT;
          else t = h <= SEA + 1 ? SAND : (h > 34 ? SNOW : GRASS);
          data[idx(lx, y, lz)] = t;
        }
        for (let y = h + 1; y <= SEA; y++) data[idx(lx, y, lz)] = WATER;
      }
    }
    // trees (consider columns slightly outside this chunk so canopies cross borders)
    const put = (wx, y, wz, t, force) => {
      const lx = wx - cx * CHUNK, lz = wz - cz * CHUNK;
      if (lx < 0 || lx >= CHUNK || lz < 0 || lz >= CHUNK || y < 0 || y >= HEIGHT) return;
      const i = idx(lx, y, lz);
      if (force || data[i] === AIR) data[i] = t;
    };
    for (let lx = -2; lx < CHUNK + 2; lx++) {
      for (let lz = -2; lz < CHUNK + 2; lz++) {
        const wx = cx * CHUNK + lx, wz = cz * CHUNK + lz;
        const th = this.treeHeight(wx, wz);
        if (!th) continue;
        const h = this.height(wx, wz);
        for (let y = h + 1; y <= h + th; y++) put(wx, y, wz, LOG, true);
        const top = h + th;
        for (let dy = -1; dy <= 2; dy++) {
          const r = dy <= 0 ? 2 : 1;
          for (let dx = -r; dx <= r; dx++) {
            for (let dz = -r; dz <= r; dz++) {
              if (dx === 0 && dz === 0 && dy <= 0) continue; // trunk
              if (Math.abs(dx) === r && Math.abs(dz) === r && dy > 0) continue; // round the top
              put(wx + dx, top + dy, wz + dz, LEAVES, false);
            }
          }
        }
      }
    }
    return data;
  }

  getBlock(x, y, z) {
    if (y < 0) return BEDROCK;
    if (y >= HEIGHT) return AIR;
    x = Math.floor(x); z = Math.floor(z);
    const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
    const data = this.ensureChunk(cx, cz);
    const lx = x - cx * CHUNK, lz = z - cz * CHUNK;
    return data[(y * CHUNK + lz) * CHUNK + lx];
  }

  setBlock(x, y, z, t) {
    if (y < 0 || y >= HEIGHT) return false;
    x = Math.floor(x); z = Math.floor(z);
    const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
    const data = this.ensureChunk(cx, cz);
    const lx = x - cx * CHUNK, lz = z - cz * CHUNK;
    data[(y * CHUNK + lz) * CHUNK + lx] = t;
    this.dirty.add(this.key(cx, cz));
    if (lx === 0) this.dirty.add(this.key(cx - 1, cz));
    if (lx === CHUNK - 1) this.dirty.add(this.key(cx + 1, cz));
    if (lz === 0) this.dirty.add(this.key(cx, cz - 1));
    if (lz === CHUNK - 1) this.dirty.add(this.key(cx, cz + 1));
    return true;
  }

  groundHeight(x, z) {
    for (let y = HEIGHT - 1; y > 0; y--) {
      if (isSolid(this.getBlock(x, y, z))) return y;
    }
    return 0;
  }
}

// ---------------- voxel raycast (Amanatides & Woo DDA) ----------------
function raycastVoxel(world, ox, oy, oz, dx, dy, dz, maxDist = 8) {
  const len = Math.hypot(dx, dy, dz);
  if (len < 1e-9) return null;
  dx /= len; dy /= len; dz /= len;
  let x = Math.floor(ox), y = Math.floor(oy), z = Math.floor(oz);
  const stepX = dx > 0 ? 1 : -1, stepY = dy > 0 ? 1 : -1, stepZ = dz > 0 ? 1 : -1;
  const tDeltaX = Math.abs(1 / dx), tDeltaY = Math.abs(1 / dy), tDeltaZ = Math.abs(1 / dz);
  let tMaxX = dx !== 0 ? (dx > 0 ? (x + 1 - ox) : (ox - x)) * tDeltaX : Infinity;
  let tMaxY = dy !== 0 ? (dy > 0 ? (y + 1 - oy) : (oy - y)) * tDeltaY : Infinity;
  let tMaxZ = dz !== 0 ? (dz > 0 ? (z + 1 - oz) : (oz - z)) * tDeltaZ : Infinity;
  let nx = 0, ny = 0, nz = 0, t = 0;
  for (let i = 0; i < 256; i++) {
    if (t > maxDist) return null;
    const b = world.getBlock(x, y, z);
    if (b !== AIR && b !== WATER) return { x, y, z, block: b, nx, ny, nz, dist: t };
    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      x += stepX; t = tMaxX; tMaxX += tDeltaX; nx = -stepX; ny = 0; nz = 0;
    } else if (tMaxY < tMaxZ) {
      y += stepY; t = tMaxY; tMaxY += tDeltaY; nx = 0; ny = -stepY; nz = 0;
    } else {
      z += stepZ; t = tMaxZ; tMaxZ += tDeltaZ; nx = 0; ny = 0; nz = -stepZ;
    }
  }
  return null;
}

// ---------------- chunk meshing ----------------
const FACES = [
  { dir: [-1, 0, 0], shade: 0.72, corners: [[0,1,0,0,1],[0,0,0,0,0],[0,1,1,1,1],[0,0,1,1,0]] },
  { dir: [ 1, 0, 0], shade: 0.72, corners: [[1,1,1,0,1],[1,0,1,0,0],[1,1,0,1,1],[1,0,0,1,0]] },
  { dir: [ 0,-1, 0], shade: 0.50, corners: [[1,0,1,1,0],[0,0,1,0,0],[1,0,0,1,1],[0,0,0,0,1]] },
  { dir: [ 0, 1, 0], shade: 1.00, corners: [[0,1,1,1,1],[1,1,1,0,1],[0,1,0,1,0],[1,1,0,0,0]] },
  { dir: [ 0, 0,-1], shade: 0.84, corners: [[1,0,0,0,0],[0,0,0,1,0],[1,1,0,0,1],[0,1,0,1,1]] },
  { dir: [ 0, 0, 1], shade: 0.84, corners: [[0,0,1,0,0],[1,0,1,1,0],[0,1,1,0,1],[1,1,1,1,1]] },
];

function buildChunkGeometry(world, cx, cz) {
  const data = world.ensureChunk(cx, cz);
  const solid = { positions: [], normals: [], colors: [], uvs: [], indices: [] };
  const water = { positions: [], normals: [], colors: [], uvs: [], indices: [] };

  const emit = (out, wx, y, wz, face, tile) => {
    const base = out.positions.length / 3;
    for (const c of face.corners) {
      out.positions.push(wx + c[0], y + c[1], wz + c[2]);
      out.normals.push(face.dir[0], face.dir[1], face.dir[2]);
      out.colors.push(face.shade, face.shade, face.shade);
      out.uvs.push((tile + c[3]) / NTILES, c[4]);
    }
    out.indices.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
  };

  for (let y = 0; y < HEIGHT; y++) {
    for (let lz = 0; lz < CHUNK; lz++) {
      for (let lx = 0; lx < CHUNK; lx++) {
        const t = data[(y * CHUNK + lz) * CHUNK + lx];
        if (t === AIR) continue;
        const wx = cx * CHUNK + lx, wz = cz * CHUNK + lz;
        const def = BLOCKS[t];
        for (const face of FACES) {
          const n = world.getBlock(wx + face.dir[0], y + face.dir[1], wz + face.dir[2]);
          let visible;
          if (t === WATER) visible = n !== WATER && !isOpaque(n);
          else if (t === GLASS) visible = !isOpaque(n) && n !== GLASS;
          else visible = !isOpaque(n);
          if (!visible) continue;
          const tile = face.dir[1] > 0 ? def.tiles[0] : face.dir[1] < 0 ? def.tiles[2] : def.tiles[1];
          emit(t === WATER ? water : solid, wx, y, wz, face, tile);
        }
      }
    }
  }
  return { solid, water };
}

// ---------------- procedural texture atlas (browser only) ----------------
function paintAtlas(canvas) {
  const P = 16;
  canvas.width = P * NTILES; canvas.height = P;
  const g = canvas.getContext('2d');
  let rngState = 12345;
  const rnd = () => {
    rngState |= 0; rngState = rngState + 0x6D2B79F5 | 0;
    let t = Math.imul(rngState ^ rngState >>> 15, 1 | rngState);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const px = (tile, x, y, color) => { g.fillStyle = color; g.fillRect(tile * P + x, y, 1, 1); };
  const fill = (tile, color) => { g.fillStyle = color; g.fillRect(tile * P, 0, P, P); };
  const speckle = (tile, colors, density = 0.35) => {
    for (let x = 0; x < P; x++) for (let y = 0; y < P; y++) {
      if (rnd() < density) px(tile, x, y, colors[Math.floor(rnd() * colors.length)]);
    }
  };

  fill(T_GRASS_TOP, '#5fae3c'); speckle(T_GRASS_TOP, ['#4f9e31', '#6cbb48', '#57a637']);
  fill(T_DIRT, '#8a5a32'); speckle(T_DIRT, ['#7c4f2a', '#96653a', '#6e4525']);
  // grass side: dirt with grass strip on top
  fill(T_GRASS_SIDE, '#8a5a32'); speckle(T_GRASS_SIDE, ['#7c4f2a', '#96653a']);
  g.fillStyle = '#5fae3c'; g.fillRect(T_GRASS_SIDE * P, 0, P, 4);
  for (let x = 0; x < P; x++) if (rnd() < 0.6) px(T_GRASS_SIDE, x, 4, '#5fae3c');
  fill(T_STONE, '#8a8a8a'); speckle(T_STONE, ['#7d7d7d', '#979797', '#858585']);
  fill(T_COBBLE, '#7a7a7a'); speckle(T_COBBLE, ['#6a6a6a', '#8d8d8d'], 0.5);
  for (let i = 0; i < 5; i++) {
    g.strokeStyle = '#5d5d5d';
    g.strokeRect(T_COBBLE * P + rnd() * 10, rnd() * 10, 4 + rnd() * 4, 4 + rnd() * 4);
  }
  fill(T_PLANK, '#b08a4f'); speckle(T_PLANK, ['#a37f48', '#bd965a'], 0.25);
  g.fillStyle = '#8d6d3a';
  for (let y = 3; y < P; y += 4) g.fillRect(T_PLANK * P, y, P, 1);
  fill(T_LOG_SIDE, '#6b4a2a');
  g.fillStyle = '#5a3d20';
  for (let x = 1; x < P; x += 3) g.fillRect(T_LOG_SIDE * P + x, 0, 1, P);
  fill(T_LOG_TOP, '#8d6d3a');
  g.strokeStyle = '#6b4a2a';
  for (let r = 2; r < 8; r += 2) g.strokeRect(T_LOG_TOP * P + 8 - r, 8 - r, r * 2, r * 2);
  fill(T_LEAVES, '#3e7d28'); speckle(T_LEAVES, ['#356d20', '#488f30', '#2e601a'], 0.6);
  fill(T_SAND, '#ddd09a'); speckle(T_SAND, ['#d2c48d', '#e7dba8'], 0.4);
  // glass: transparent with frame
  g.clearRect(T_GLASS * P, 0, P, P);
  g.strokeStyle = 'rgba(220,240,255,0.9)';
  g.strokeRect(T_GLASS * P + 0.5, 0.5, P - 1, P - 1);
  px(T_GLASS, 3, 3, 'rgba(255,255,255,0.7)'); px(T_GLASS, 4, 4, 'rgba(255,255,255,0.7)');
  px(T_GLASS, 11, 10, 'rgba(255,255,255,0.5)'); px(T_GLASS, 12, 11, 'rgba(255,255,255,0.5)');
  fill(T_BRICK, '#9e4a3a');
  g.fillStyle = '#cfc6bd';
  for (let y = 0; y < P; y += 4) g.fillRect(T_BRICK * P, y, P, 1);
  for (let y = 0; y < P; y += 8) { g.fillRect(T_BRICK * P + 8, y, 1, 4); g.fillRect(T_BRICK * P + 0, y + 4, 1, 4); }
  fill(T_WATER, '#3060c8'); speckle(T_WATER, ['#3a6ed4', '#2a55b5'], 0.3);
  fill(T_BEDROCK, '#3a3a3a'); speckle(T_BEDROCK, ['#2c2c2c', '#4a4a4a'], 0.55);
  fill(T_SNOW, '#f2f6f8'); speckle(T_SNOW, ['#e6ecf0', '#ffffff'], 0.3);
  return canvas;
}

// ---------------- browser game ----------------
function initGame() {
  const THREE = window.THREE;
  const world = new World(20260612);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 50, 140);
  const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 400);
  camera.rotation.order = 'YXZ';

  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  document.body.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  const sun = new THREE.DirectionalLight(0xffffff, 0.7);
  sun.position.set(80, 150, 40);
  scene.add(sun);

  const atlasCanvas = paintAtlas(document.createElement('canvas'));
  const atlas = new THREE.CanvasTexture(atlasCanvas);
  atlas.magFilter = THREE.NearestFilter;
  atlas.minFilter = THREE.NearestFilter;
  atlas.generateMipmaps = false;

  const solidMat = new THREE.MeshLambertMaterial({ map: atlas, vertexColors: true, alphaTest: 0.4 });
  const waterMat = new THREE.MeshLambertMaterial({
    map: atlas, vertexColors: true, transparent: true, opacity: 0.72, depthWrite: false, side: THREE.DoubleSide,
  });

  const meshes = new Map(); // key -> {solid, water}
  function toGeometry(part) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(part.positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(part.normals, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(part.colors, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(part.uvs, 2));
    geo.setIndex(part.indices);
    return geo;
  }
  function buildChunkMesh(cx, cz) {
    const k = world.key(cx, cz);
    removeChunkMesh(k);
    const { solid, water } = buildChunkGeometry(world, cx, cz);
    const entry = {};
    if (solid.positions.length) {
      entry.solid = new THREE.Mesh(toGeometry(solid), solidMat);
      scene.add(entry.solid);
    }
    if (water.positions.length) {
      entry.water = new THREE.Mesh(toGeometry(water), waterMat);
      scene.add(entry.water);
    }
    meshes.set(k, entry);
  }
  function removeChunkMesh(k) {
    const e = meshes.get(k);
    if (!e) return;
    for (const m of [e.solid, e.water]) {
      if (!m) continue;
      scene.remove(m);
      m.geometry.dispose();
    }
    meshes.delete(k);
  }

  // selection highlight
  const selBox = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002)),
    new THREE.LineBasicMaterial({ color: 0x000000 }));
  selBox.visible = false;
  scene.add(selBox);

  // ----- player -----
  const player = {
    x: 8.5, z: 8.5, y: 0,
    vx: 0, vy: 0, vz: 0,
    yaw: -Math.PI / 4, pitch: -0.15,
    fly: false, onGround: false,
    sel: 0,
  };
  player.y = world.groundHeight(8, 8) + 1;
  const EYE = 1.62, HALF = 0.3, TALL = 1.8;

  const keys = {};
  let lastSpace = 0;
  document.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space') {
      e.preventDefault();
      const now = performance.now();
      if (now - lastSpace < 280) { player.fly = !player.fly; player.vy = 0; }
      lastSpace = now;
    }
    if (e.code === 'KeyF') { player.fly = !player.fly; player.vy = 0; }
    if (e.code === 'KeyE' && started) doAction(true);   // place (mouse-free building)
    if (e.code === 'KeyQ' && started) doAction(false);  // break
    if (/^Digit[1-9]$/.test(e.code)) selectSlot(Number(e.code[5]) - 1);
  });
  document.addEventListener('keyup', e => { keys[e.code] = false; });
  addEventListener('wheel', e => selectSlot((player.sel + (e.deltaY > 0 ? 1 : 8)) % 9));

  // Pointer lock with Safari/old-WebKit prefixes, plus a drag-to-look
  // fallback for browsers/mice where pointer capture is unavailable.
  const canvas = renderer.domElement;
  const overlayEl = document.getElementById('overlay');
  let started = false;
  const lockedEl = () =>
    document.pointerLockElement || document.webkitPointerLockElement || document.mozPointerLockElement;
  function tryLock() {
    const req = canvas.requestPointerLock || canvas.webkitRequestPointerLock || canvas.mozRequestPointerLock;
    if (!req) return;
    try {
      const r = req.call(canvas);
      if (r && r.catch) r.catch(() => {});
    } catch (err) { /* fall back to drag-look */ }
  }
  function startPlaying() {
    started = true;
    overlayEl.style.display = 'none';
    if (lockedEl() !== canvas) tryLock();
  }
  canvas.addEventListener('click', () => { if (!started || lockedEl() !== canvas) startPlaying(); });
  for (const ev of ['pointerlockchange', 'webkitpointerlockchange', 'mozpointerlockchange']) {
    document.addEventListener(ev, () => {
      if (lockedEl() === canvas) overlayEl.style.display = 'none';
    });
  }
  document.addEventListener('keydown', e => {
    if (e.code === 'Escape' && started && !lockedEl()) {
      overlayEl.style.display = overlayEl.style.display === 'none' ? 'flex' : 'none';
    }
  });

  const applyLook = (dx, dy) => {
    player.yaw -= dx * 0.0024;
    player.pitch = Math.max(-1.55, Math.min(1.55, player.pitch - dy * 0.0024));
  };
  // drag-look state (used only when pointer lock is not engaged)
  let drag = null;
  document.addEventListener('mousemove', e => {
    if (lockedEl() === canvas) {
      applyLook(e.movementX, e.movementY);
    } else if (drag) {
      applyLook(e.clientX - drag.x, e.clientY - drag.y);
      drag.moved += Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y);
      drag.x = e.clientX; drag.y = e.clientY;
    }
  });
  // cooldown so a single physical click can't fire two actions (Magic Mouse
  // can emit both a left and right event for one click)
  let lastActionT = 0;
  const doAction = place => {
    const now = performance.now();
    if (now - lastActionT < 120) return;
    lastActionT = now;
    if (place) placeBlock(); else breakBlock();
  };
  const clickAction = e => {
    // Ctrl+click (or two-finger click sending button 2) places — Apple-mouse friendly
    if (e.button === 2 || e.ctrlKey || e.metaKey) doAction(true);
    else if (e.button === 0) doAction(false);
  };
  document.addEventListener('mousedown', e => {
    if (!started) return;
    if (lockedEl() === canvas) { clickAction(e); return; }
    drag = { x: e.clientX, y: e.clientY, moved: 0, t: performance.now(), btn: e.button, ctrl: e.ctrlKey || e.metaKey };
  });
  document.addEventListener('mouseup', e => {
    if (!drag) return;
    // a short, still click in drag-look mode counts as break/place
    if (drag.moved < 6 && performance.now() - drag.t < 350) {
      clickAction({ button: drag.btn, ctrlKey: drag.ctrl, metaKey: false });
    }
    drag = null;
  });
  document.addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  function viewDir() {
    return {
      x: -Math.sin(player.yaw) * Math.cos(player.pitch),
      y: Math.sin(player.pitch),
      z: -Math.cos(player.yaw) * Math.cos(player.pitch),
    };
  }
  function rayFromEye() {
    const d = viewDir();
    return raycastVoxel(world, player.x, player.y + EYE, player.z, d.x, d.y, d.z, 8);
  }
  function breakBlock() {
    const hit = rayFromEye();
    if (!hit || hit.block === BEDROCK) return;
    world.setBlock(hit.x, hit.y, hit.z, AIR);
  }
  function placeBlock() {
    const hit = rayFromEye();
    if (!hit) return;
    const x = hit.x + hit.nx, y = hit.y + hit.ny, z = hit.z + hit.nz;
    const cur = world.getBlock(x, y, z);
    if (cur !== AIR && cur !== WATER) return;
    // don't place inside the player
    if (x + 1 > player.x - HALF && x < player.x + HALF &&
        z + 1 > player.z - HALF && z < player.z + HALF &&
        y + 1 > player.y && y < player.y + TALL) return;
    world.setBlock(x, y, z, HOTBAR[player.sel]);
  }

  // ----- physics -----
  function boxHitsSolid(x, y, z) {
    const x0 = Math.floor(x - HALF), x1 = Math.floor(x + HALF);
    const z0 = Math.floor(z - HALF), z1 = Math.floor(z + HALF);
    const y0 = Math.floor(y), y1 = Math.floor(y + TALL - 0.001);
    for (let bx = x0; bx <= x1; bx++)
      for (let by = y0; by <= y1; by++)
        for (let bz = z0; bz <= z1; bz++)
          if (isSolid(world.getBlock(bx, by, bz))) return { bx, by, bz };
    return null;
  }
  function inWater() {
    return world.getBlock(player.x, player.y + 0.5, player.z) === WATER;
  }

  function updatePlayer(dt) {
    const sinY = Math.sin(player.yaw), cosY = Math.cos(player.yaw);
    let fwd = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
    let strafe = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
    const mag = Math.hypot(fwd, strafe) || 1;
    fwd /= mag; strafe /= mag;
    const speed = player.fly ? (keys.ControlLeft ? 22 : 11) : (inWater() ? 3 : 5.4);
    const mx = (-sinY * fwd + cosY * strafe) * speed;
    const mz = (-cosY * fwd - sinY * strafe) * speed;

    if (player.fly) {
      player.vy = (keys.Space ? speed : 0) + (keys.ShiftLeft ? -speed : 0);
    } else if (inWater()) {
      player.vy += -10 * dt;
      if (keys.Space) player.vy = 4;
      player.vy = Math.max(-4, Math.min(4, player.vy));
    } else {
      player.vy -= 26 * dt;
      player.vy = Math.max(-50, player.vy);
      if (keys.Space && player.onGround) { player.vy = 8.6; player.onGround = false; }
    }

    // axis-separated movement with collision
    const move = (axis, delta) => {
      if (!delta) return;
      const prev = player[axis];
      player[axis] += delta;
      const hit = boxHitsSolid(player.x, player.y, player.z);
      if (!hit) return;
      if (axis === 'y') {
        if (delta < 0) {
          player.y = hit.by + 1;
          player.onGround = true;
        } else {
          player.y = hit.by - TALL - 0.001;
        }
        player.vy = 0;
      } else {
        player[axis] = prev;
      }
    };
    player.onGround = false;
    move('y', player.vy * dt);
    move('x', mx * dt);
    move('z', mz * dt);
    if (player.y < -10) { player.y = world.groundHeight(player.x, player.z) + 1; player.vy = 0; }

    camera.position.set(player.x, player.y + EYE, player.z);
    camera.rotation.y = player.yaw;
    camera.rotation.x = player.pitch;
  }

  // ----- chunk streaming -----
  const VIEW = 3;
  function updateChunks() {
    const pcx = Math.floor(player.x / CHUNK), pcz = Math.floor(player.z / CHUNK);
    for (let dx = -VIEW; dx <= VIEW; dx++) {
      for (let dz = -VIEW; dz <= VIEW; dz++) {
        const k = world.key(pcx + dx, pcz + dz);
        if (!meshes.has(k)) { buildChunkMesh(pcx + dx, pcz + dz); return; } // one per frame
      }
    }
    for (const k of meshes.keys()) {
      const [cx, cz] = k.split(',').map(Number);
      if (Math.abs(cx - pcx) > VIEW + 1 || Math.abs(cz - pcz) > VIEW + 1) { removeChunkMesh(k); break; }
    }
    let n = 0;
    for (const k of world.dirty) {
      world.dirty.delete(k);
      const [cx, cz] = k.split(',').map(Number);
      if (meshes.has(k)) buildChunkMesh(cx, cz);
      if (++n >= 2) break;
    }
  }

  // ----- hotbar UI -----
  function selectSlot(i) {
    player.sel = i;
    document.querySelectorAll('#hotbar .slot').forEach((el, j) =>
      el.classList.toggle('active', j === i));
    document.getElementById('blockname').textContent = BLOCKS[HOTBAR[i]].name;
  }
  const hotbarEl = document.getElementById('hotbar');
  HOTBAR.forEach((bt, i) => {
    const slot = document.createElement('div');
    slot.className = 'slot';
    const cv = document.createElement('canvas');
    cv.width = cv.height = 32;
    const c2 = cv.getContext('2d');
    c2.imageSmoothingEnabled = false;
    c2.fillStyle = '#777';
    c2.fillRect(0, 0, 32, 32);
    c2.drawImage(atlasCanvas, BLOCKS[bt].tiles[1] * 16, 0, 16, 16, 0, 0, 32, 32);
    const num = document.createElement('span');
    num.textContent = i + 1;
    slot.appendChild(cv); slot.appendChild(num);
    slot.addEventListener('click', () => selectSlot(i));
    hotbarEl.appendChild(slot);
  });
  selectSlot(0);

  // ----- main loop -----
  const coordsEl = document.getElementById('coords');
  let last = performance.now(), frames = 0, fps = 0, fpsT = 0;
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    updatePlayer(dt);
    updateChunks();
    const hit = rayFromEye();
    selBox.visible = !!hit;
    if (hit) selBox.position.set(hit.x + 0.5, hit.y + 0.5, hit.z + 0.5);
    frames++; fpsT += dt;
    if (fpsT > 0.5) { fps = Math.round(frames / fpsT); frames = 0; fpsT = 0; }
    coordsEl.textContent =
      `XYZ ${player.x.toFixed(1)} ${player.y.toFixed(1)} ${player.z.toFixed(1)}` +
      `  ·  ${player.fly ? 'FLYING' : 'WALKING'}  ·  ${fps} FPS`;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // API for automated tests
  window.game = {
    world, player, camera,
    breakBlock, placeBlock, rayFromEye, selectSlot, startPlaying,
    setView: (yaw, pitch) => { player.yaw = yaw; player.pitch = pitch; },
    renderOnce: () => renderer.render(scene, camera),
    renderer,
    chunkCount: () => meshes.size,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    World, BLOCKS, HOTBAR, raycastVoxel, buildChunkGeometry,
    CHUNK, HEIGHT, SEA, NTILES,
    AIR, GRASS, DIRT, STONE, LOG, LEAVES, SAND, WATER, PLANK, BRICK, GLASS, COBBLE, BEDROCK, SNOW,
    isOpaque, isSolid, hash2i, fbm,
  };
}
