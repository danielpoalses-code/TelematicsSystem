/* Automated logic tests for the voxel sandbox. Run: node minecraft/test.js */
'use strict';

const M = require('./game.js');
const {
  World, raycastVoxel, buildChunkGeometry, HOTBAR, BLOCKS,
  CHUNK, HEIGHT, SEA,
  AIR, GRASS, DIRT, STONE, LOG, LEAVES, SAND, WATER, GLASS, BEDROCK, SNOW,
  isSolid,
} = M;

let passed = 0, failed = 0;
function check(name, cond, extra) {
  if (cond) { passed++; console.log(`  ok  ${name}`); }
  else { failed++; console.error(`FAIL  ${name}${extra ? ' — ' + extra : ''}`); }
}

// ---------- 1. terrain generation ----------
{
  const w1 = new World(42), w2 = new World(42), w3 = new World(43);
  let same = true, diff = false;
  for (let x = -20; x < 20; x += 3) for (let z = -20; z < 20; z += 3) {
    if (w1.height(x, z) !== w2.height(x, z)) same = false;
    if (w1.height(x, z) !== w3.height(x, z)) diff = true;
  }
  check('terrain deterministic for same seed', same);
  check('different seeds give different terrain', diff);

  let inRange = true;
  for (let x = -50; x < 50; x += 7) for (let z = -50; z < 50; z += 7) {
    const h = w1.height(x, z);
    if (h < 2 || h > HEIGHT - 22) inRange = false;
  }
  check('heights within bounds', inRange);
}

// ---------- 2. chunk contents ----------
{
  const w = new World(7);
  let ok = true, why = '';
  for (let cx = -2; cx <= 2 && ok; cx++) for (let cz = -2; cz <= 2 && ok; cz++) {
    for (let lx = 0; lx < CHUNK; lx += 5) for (let lz = 0; lz < CHUNK; lz += 5) {
      const x = cx * CHUNK + lx, z = cz * CHUNK + lz;
      if (w.getBlock(x, 0, z) !== BEDROCK) { ok = false; why = `no bedrock at ${x},0,${z}`; break; }
      const h = w.height(x, z);
      const surf = w.getBlock(x, h, z);
      if (![GRASS, SAND, SNOW, LOG].includes(surf)) { ok = false; why = `surface ${surf} at ${x},${h},${z}`; break; }
      if (w.getBlock(x, 2, z) !== STONE && h > 5) { ok = false; why = `no stone at ${x},2,${z}`; break; }
      if (w.getBlock(x, HEIGHT - 1, z) !== AIR) { ok = false; why = `sky not air at ${x}`; break; }
    }
  }
  check('bedrock floor, sensible surface, stone core, air sky', ok, why);

  // water fills low areas up to sea level
  let foundWater = false;
  for (let x = -100; x < 100 && !foundWater; x += 2) {
    for (let z = -100; z < 100 && !foundWater; z += 2) {
      if (w.height(x, z) < SEA && w.getBlock(x, SEA, z) === WATER) foundWater = true;
    }
  }
  check('water exists at sea level in low areas', foundWater);

  // trees exist somewhere
  let logs = 0, leaves = 0;
  for (let x = -64; x < 64; x++) for (let z = -64; z < 64; z++) {
    const h = w.height(x, z);
    for (let y = h + 1; y < h + 8; y++) {
      const b = w.getBlock(x, y, z);
      if (b === LOG) logs++;
      if (b === LEAVES) leaves++;
    }
  }
  check('trees generated (logs + leaves)', logs > 20 && leaves > 100, `logs=${logs} leaves=${leaves}`);
}

// ---------- 3. get/set across chunk borders, dirty tracking ----------
{
  const w = new World(7);
  w.setBlock(15, 40, 7, GLASS);
  check('setBlock/getBlock roundtrip', w.getBlock(15, 40, 7) === GLASS);
  check('border edit marks neighbor chunk dirty',
    w.dirty.has('0,0') && w.dirty.has('-1,0') === false && w.dirty.has('1,0'),
    [...w.dirty].join(' '));
  w.dirty.clear();
  w.setBlock(-1, 40, -1, STONE);
  check('negative coords work', w.getBlock(-1, 40, -1) === STONE);
  check('negative border dirties correct chunks', w.dirty.has('-1,-1'), [...w.dirty].join(' '));
  check('out-of-world get is safe', w.getBlock(5, 200, 5) === AIR && w.getBlock(5, -5, 5) === BEDROCK);
}

// ---------- 4. raycast ----------
{
  const w = new World(7);
  const h = w.groundHeight(8, 8);
  const hit = raycastVoxel(w, 8.5, h + 5, 8.5, 0, -1, 0, 10);
  check('downward ray hits ground', !!hit && hit.y === h, hit && `y=${hit.y} h=${h}`);
  check('hit normal points up', hit && hit.ny === 1);
  const miss = raycastVoxel(w, 8.5, HEIGHT - 2, 8.5, 0, 1, 0, 10);
  check('upward ray into sky misses', miss === null);

  // place a block in the air and hit it sideways
  w.setBlock(8, 50, 20, BLOCKS && GLASS);
  const side = raycastVoxel(w, 4.5, 50.5, 20.5, 1, 0, 0, 10);
  check('sideways ray hits placed glass', !!side && side.x === 8 && side.block === GLASS,
    side && JSON.stringify(side));
  check('side hit normal faces ray origin', side && side.nx === -1);
  w.setBlock(8, 50, 20, AIR);
  const after = raycastVoxel(w, 4.5, 50.5, 20.5, 1, 0, 0, 10);
  check('ray passes after block removed', !after || after.x !== 8);
}

// ---------- 5. meshing ----------
{
  const w = new World(1, 'empty');
  w.setBlock(8, 30, 8, STONE);
  let { solid, water } = buildChunkGeometry(w, 0, 0);
  check('single block => 6 faces (24 verts, 36 indices)',
    solid.positions.length === 24 * 3 && solid.indices.length === 36,
    `verts=${solid.positions.length / 3} idx=${solid.indices.length}`);
  check('no water mesh in empty world', water.positions.length === 0);

  // bury it: no exposed faces from the center block (3x3x3 cube => 54 exposed faces total)
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++)
    w.setBlock(8 + dx, 30 + dy, 8 + dz, STONE);
  ({ solid } = buildChunkGeometry(w, 0, 0));
  check('3x3x3 cube => 54 exposed faces', solid.indices.length === 54 * 6, String(solid.indices.length / 6));

  // water faces: two adjacent water blocks share a hidden face
  const w2 = new World(1, 'empty');
  w2.setBlock(4, 10, 4, WATER);
  let g2 = buildChunkGeometry(w2, 0, 0);
  const oneWaterFaces = g2.water.indices.length / 6;
  w2.setBlock(5, 10, 4, WATER);
  g2 = buildChunkGeometry(w2, 0, 0);
  check('single water block has 6 faces', oneWaterFaces === 6, String(oneWaterFaces));
  check('adjacent water hides shared faces', g2.water.indices.length / 6 === 10, String(g2.water.indices.length / 6));

  // chunk border faces use neighbor chunk data (no face between touching blocks across border)
  const w3 = new World(1, 'empty');
  w3.setBlock(15, 30, 8, STONE);
  w3.setBlock(16, 30, 8, STONE);
  const gA = buildChunkGeometry(w3, 0, 0);
  check('cross-chunk neighbor culls shared face', gA.solid.indices.length === 5 * 6, String(gA.solid.indices.length / 6));

  // glass next to glass: shared faces culled
  const w4 = new World(1, 'empty');
  w4.setBlock(4, 10, 4, GLASS);
  w4.setBlock(5, 10, 4, GLASS);
  const g4 = buildChunkGeometry(w4, 0, 0);
  check('adjacent glass culls shared faces', g4.solid.indices.length / 6 === 10, String(g4.solid.indices.length / 6));
}

// ---------- 6. real-terrain mesh sanity ----------
{
  const w = new World(99);
  const { solid } = buildChunkGeometry(w, 0, 0);
  const quads = solid.indices.length / 6;
  check('terrain chunk produces a real mesh', quads > 256, String(quads));
  check('vertex/uv/color/normal counts consistent',
    solid.positions.length === solid.normals.length &&
    solid.positions.length === solid.colors.length &&
    (solid.positions.length / 3) * 2 === solid.uvs.length);
  let finite = true;
  for (const v of solid.positions) if (!Number.isFinite(v)) { finite = false; break; }
  check('no NaN in mesh', finite);
}

// ---------- 7. hotbar/blocks config ----------
{
  check('9 hotbar slots', HOTBAR.length === 9);
  check('all hotbar blocks defined', HOTBAR.every(b => BLOCKS[b] && BLOCKS[b].tiles.length === 3));
  check('water is not solid, glass is', !isSolid(WATER) && isSolid(GLASS));
}

// ---------- 8. soak: thousands of random edits stay consistent ----------
{
  const w = new World(5);
  let ok = true, why = '';
  let r = 1;
  const rnd = () => (r = (r * 48271) % 2147483647) / 2147483647;
  for (let i = 0; i < 5000; i++) {
    const x = Math.floor(rnd() * 200 - 100);
    const y = Math.floor(rnd() * HEIGHT);
    const z = Math.floor(rnd() * 200 - 100);
    const t = HOTBAR[Math.floor(rnd() * HOTBAR.length)];
    w.setBlock(x, y, z, t);
    if (w.getBlock(x, y, z) !== t) { ok = false; why = `mismatch at ${x},${y},${z}`; break; }
  }
  check('5000 random edits readback OK', ok, why);
  // rebuild every dirty chunk without throwing
  let built = 0;
  try {
    for (const k of w.dirty) {
      const [cx, cz] = k.split(',').map(Number);
      buildChunkGeometry(w, cx, cz);
      if (++built > 40) break;
    }
    check(`rebuilt ${built} dirty chunks without errors`, true);
  } catch (e) {
    check('rebuilt dirty chunks without errors', false, e.message);
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
