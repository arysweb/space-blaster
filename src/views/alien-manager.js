// Alien manager for gameplay screen.
// Spawns aliens outside the playfield and moves them toward the player.

import { navigateTo } from '../utils/navigation.js';
import { GAME_CONFIG } from '../game-config.js';

const ALIEN_IMAGES = [
  './assets/img/aliens/slug_1.png',
];

let SPAWN_INTERVAL_MIN = GAME_CONFIG.spawnIntervalMinSeconds;
let SPAWN_INTERVAL_MAX = GAME_CONFIG.spawnIntervalMaxSeconds;

const ALIEN_BASE_SPEED = GAME_CONFIG.alienBaseSpeed; // pixels per second
const ALIEN_BASE_HEALTH = GAME_CONFIG.alienHealth;

function createAlien(playfield, maxHealth) {
  const rect = playfield.getBoundingClientRect();

  const img = document.createElement('img');
  img.className = 'sb-alien';
  img.src = ALIEN_IMAGES[0];
  img.alt = 'Alien';

  // Spawn just outside one of the four sides at a random position.
  const side = Math.floor(Math.random() * 4); // 0 = left, 1 = right, 2 = top, 3 = bottom
  let x;
  let y;

  const margin = 40;

  if (side === 0) {
    // left
    x = -margin;
    y = Math.random() * rect.height;
  } else if (side === 1) {
    // right
    x = rect.width + margin;
    y = Math.random() * rect.height;
  } else if (side === 2) {
    // top
    x = Math.random() * rect.width;
    y = -margin;
  } else {
    // bottom
    x = Math.random() * rect.width;
    y = rect.height + margin;
  }

  const state = {
    x,
    y,
    speed: ALIEN_BASE_SPEED * (0.8 + Math.random() * 0.4),
    maxHealth: maxHealth || ALIEN_BASE_HEALTH,
    health: maxHealth || ALIEN_BASE_HEALTH,
  };

  img.style.transform = `translate(${state.x}px, ${state.y}px)`;

  return { img, state, healthBar: null, healthFill: null };
}

function rectsOverlap(a, b) {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

/**
 * Set up alien spawning and movement.
 *
 * @param {HTMLElement} playfield
 * @param {HTMLImageElement} player
 * @param {{
 *   onStatsChange?: (stats: { killCount: number }) => void,
 *   onLevelProgress?: (state: {
 *     level: number,
 *     subLevelIndex: number,
 *     subLevelsPerLevel: number,
 *     progress: number,
 *   }) => void,
 * }} [callbacks]
 */
export function setupAliens(playfield, player, callbacks = {}) {
  const aliens = [];
  let running = true;

  let lastTime = performance.now();
  let nextSpawnIn = SPAWN_INTERVAL_MIN + Math.random() * (SPAWN_INTERVAL_MAX - SPAWN_INTERVAL_MIN);
  const sessionStart = Date.now();
  let killCount = 0;

  // Level progression state.
  let currentLevel = 1;
  let killsThisLevel = 0;

  const SUB_LEVELS_PER_LEVEL = GAME_CONFIG.subLevelsPerLevel;
  const KILLS_PER_SUB_LEVEL = GAME_CONFIG.killsPerSubLevel;
  const KILLS_PER_LEVEL = SUB_LEVELS_PER_LEVEL * KILLS_PER_SUB_LEVEL;

  let requiredKillsThisLevel = KILLS_PER_LEVEL;

  // When a sublevel (wave) is completed, we pause spawning for a short
  // time so the player gets a brief breather between waves.
  let waveCooldownRemaining = 0;

  function notifyLevelProgress() {
    const clampedKills = Math.max(0, Math.min(killsThisLevel, requiredKillsThisLevel));
    const progress = requiredKillsThisLevel > 0 ? clampedKills / requiredKillsThisLevel : 0;

    // Determine sublevel by kills, 20 kills per sublevel.
    let subLevelIndex = Math.floor(clampedKills / KILLS_PER_SUB_LEVEL); // 0-based
    if (subLevelIndex >= SUB_LEVELS_PER_LEVEL) subLevelIndex = SUB_LEVELS_PER_LEVEL - 1;

    if (callbacks.onLevelProgress) {
      callbacks.onLevelProgress({
        level: currentLevel,
        subLevelIndex,
        subLevelsPerLevel: SUB_LEVELS_PER_LEVEL,
        progress,
      });
    }
  }

  function advanceLevelIfNeeded() {
    if (killsThisLevel < requiredKillsThisLevel) {
      return;
    }

    currentLevel += 1;
    killsThisLevel = 0;
    requiredKillsThisLevel = KILLS_PER_LEVEL;

    // Slightly increase difficulty by reducing spawn interval, but keep a floor.
    const minCap = GAME_CONFIG.spawnIntervalMinCapSeconds;
    const maxCap = GAME_CONFIG.spawnIntervalMaxCapSeconds;
    const scale = GAME_CONFIG.levelSpawnIntervalScale;
    SPAWN_INTERVAL_MIN = Math.max(minCap, SPAWN_INTERVAL_MIN * scale);
    SPAWN_INTERVAL_MAX = Math.max(maxCap, SPAWN_INTERVAL_MAX * scale);

    notifyLevelProgress();
  }

  function clearAllAliens() {
    for (let i = aliens.length - 1; i >= 0; i -= 1) {
      const alien = aliens[i];
      if (alien.healthBar) {
        alien.healthBar.remove();
      }
      if (alien.img) {
        alien.img.remove();
      }
    }
    aliens.length = 0;
  }

  const gameOverOverlay = document.createElement('div');
  gameOverOverlay.className = 'sb-gameover-overlay';
  gameOverOverlay.innerHTML = `
    <div class="sb-gameover-box">
      <h2 class="sb-gameover-title">Game Over</h2>
      <p class="sb-gameover-text">An alien breached your defenses and your ship is lost.</p>
      <div class="sb-gameover-actions">
        <button type="button" class="sb-button sb-button--primary sb-gameover-try">Try Again</button>
        <button type="button" class="sb-button sb-button--ghost sb-gameover-upgrade">Upgrade Ship</button>
      </div>
    </div>
  `;

  function triggerGameOver() {
    if (!running) return;
    running = false;

    // Fire-and-forget stats update to backend.
    try {
      const elapsedMs = Date.now() - sessionStart;
      const minutesPlayed = Math.max(0, Math.round(elapsedMs / 60000));

      fetch('backend/public/api.php?path=player/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          minutesPlayed,
          kills: killCount,
          deaths: 1,
          score: killCount,
          coins: killCount,
        }),
      }).catch(() => {
        // Stats are best-effort only.
      });
    } catch (e) {
      // Ignore stats errors entirely for gameplay.
    }

    playfield.appendChild(gameOverOverlay);

    const tryBtn = gameOverOverlay.querySelector('.sb-gameover-try');
    const upgradeBtn = gameOverOverlay.querySelector('.sb-gameover-upgrade');

    if (tryBtn) {
      tryBtn.addEventListener('click', () => {
        navigateTo('/play');
      });
    }

    if (upgradeBtn) {
      upgradeBtn.addEventListener('click', () => {
        navigateTo('/skills');
      });
    }
  }

  function updateAliens(dt) {
    const rect = playfield.getBoundingClientRect();
    const playerRect = player.getBoundingClientRect();

    // Check collisions with player-projectile elements.
    const projectiles = Array.from(playfield.querySelectorAll('.sb-projectile'));

    for (let i = aliens.length - 1; i >= 0; i -= 1) {
      const alien = aliens[i];

      // Move toward player center.
      const centerX = playerRect.left + playerRect.width / 2 - rect.left;
      const centerY = playerRect.top + playerRect.height / 2 - rect.top;

      const dx = centerX - alien.state.x;
      const dy = centerY - alien.state.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = dx / len;
      const ny = dy / len;

      alien.state.x += nx * alien.state.speed * dt;
      alien.state.y += ny * alien.state.speed * dt;

      alien.img.style.transform = `translate(${alien.state.x}px, ${alien.state.y}px)`;

      // Position health bar (if it exists) just above the alien.
      if (alien.healthBar && alien.healthFill) {
        const barOffsetY = -6; // pixels above alien origin
        alien.healthBar.style.transform = `translate(${alien.state.x}px, ${alien.state.y + barOffsetY}px)`;

        const maxHealth = alien.state.maxHealth || ALIEN_BASE_HEALTH;
        const ratio = Math.max(0, Math.min(1, alien.state.health / maxHealth));
        alien.healthFill.style.width = `${ratio * 100}%`;
      }

      const alienRect = alien.img.getBoundingClientRect();

      // Collision with player => game over.
      if (rectsOverlap(alienRect, playerRect)) {
        triggerGameOver();
        return;
      }

      // Collisions with projectiles => damage aliens.
      for (let j = projectiles.length - 1; j >= 0; j -= 1) {
        const proj = projectiles[j];
        if (!proj.isConnected) continue;

        const projRect = proj.getBoundingClientRect();
        if (rectsOverlap(alienRect, projRect)) {
          alien.state.health -= 1;

          // Create health bar on first hit.
          if (!alien.healthBar) {
            const bar = document.createElement('div');
            bar.className = 'sb-alien-health';

            const fill = document.createElement('div');
            fill.className = 'sb-alien-health-fill';
            bar.appendChild(fill);

            playfield.appendChild(bar);

            alien.healthBar = bar;
            alien.healthFill = fill;

            // Initial position and full width.
            const barOffsetY = -6;
            bar.style.transform = `translate(${alien.state.x}px, ${alien.state.y + barOffsetY}px)`;
            fill.style.width = '100%';
          }

          proj.remove();
          projectiles.splice(j, 1);

          if (alien.state.health <= 0) {
            // Show a short enemy defeated effect at the alien's position.
            const deathEffect = document.createElement('img');
            deathEffect.src = './assets/img/enemy_defeted.png';
            deathEffect.className = 'sb-alien-death';

            const deathX = alien.state.x;
            const deathY = alien.state.y;
            deathEffect.style.transform = `translate(${deathX}px, ${deathY}px)`;

            playfield.appendChild(deathEffect);

            // Clean up health bar and alien sprite.
            if (alien.healthBar) {
              alien.healthBar.remove();
            }
            alien.img.remove();
            aliens.splice(i, 1);

            // Count kills for basic stats and level progression.
            killCount += 1;
            killsThisLevel += 1;

            // If we've just hit an exact wave kill-count (e.g. 20, 40, ...)
            // start a short cooldown where no new aliens spawn. Existing
            // aliens on screen remain; we only pause spawning.
            if (
              killsThisLevel > 0 &&
              killsThisLevel % KILLS_PER_SUB_LEVEL === 0 &&
              waveCooldownRemaining <= 0
            ) {
              waveCooldownRemaining = GAME_CONFIG.wavePauseSeconds || 0;
              // Between sublevels we want a clean field: remove all aliens
              // immediately and reset spawn timer so the next wave starts
              // right after the cooldown.
              clearAllAliens();
              nextSpawnIn = 0;
            }

            if (callbacks.onStatsChange) {
              callbacks.onStatsChange({ killCount });
            }

            // Update level progression and advance level when thresholds are hit.
            notifyLevelProgress();
            advanceLevelIfNeeded();

            // Remove the death effect after a short delay.
            setTimeout(() => {
              if (deathEffect.isConnected) {
                deathEffect.remove();
              }
            }, 400);
          }
          break;
        }
      }
    }
  }

  function spawnIfNeeded(dt) {
    // If we're in a wave cooldown, do not spawn new aliens yet.
    if (waveCooldownRemaining > 0) {
      waveCooldownRemaining -= dt;
      return;
    }

    nextSpawnIn -= dt;
    if (nextSpawnIn <= 0) {
      // Determine current sublevel index based on kills this level (0-based).
      let subLevelIndex = Math.floor(killsThisLevel / KILLS_PER_SUB_LEVEL);
      if (subLevelIndex >= SUB_LEVELS_PER_LEVEL) subLevelIndex = SUB_LEVELS_PER_LEVEL - 1;

      // Global progression tier; later levels/sublevels are tougher.
      const tier = (currentLevel - 1) * SUB_LEVELS_PER_LEVEL + subLevelIndex;
      const bonusHealth = tier * GAME_CONFIG.alienHealthPerTier;
      const maxHealth = ALIEN_BASE_HEALTH + bonusHealth;

      const alien = createAlien(playfield, maxHealth);
      playfield.appendChild(alien.img);
      aliens.push(alien);
      nextSpawnIn = SPAWN_INTERVAL_MIN + Math.random() * (SPAWN_INTERVAL_MAX - SPAWN_INTERVAL_MIN);
    }
  }

  function loop(now) {
    if (!running) return;
    if (!document.body.contains(playfield)) return;

    const dt = (now - lastTime) / 1000;
    lastTime = now;

    // First update existing aliens and resolve kills/progression so
    // waveCooldownRemaining is up-to-date, then decide whether new
    // aliens are allowed to spawn this frame.
    updateAliens(dt);
    spawnIfNeeded(dt);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}
