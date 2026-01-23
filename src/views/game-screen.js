// Gameplay screen for Space Blaster.
// Renders a black playfield with moving background elements and the player in the center.

import { setupBackgroundClouds } from './game-background.js';
import { setupPlayerControls } from './player-controller.js';
import { setupAliens } from './alien-manager.js';
import { renderSkillTree } from './skill-tree.js';
import { GAME_CONFIG } from '../game-config.js';
import { BASE_PLAYER_STATS, applySkills } from '../utils/skills.js';

export function renderGameScreen(container) {
  const root = document.createElement('div');
  root.className = 'sb-view sb-view--gameplay';

  // Top HUD bar with three columns: score (left), coins (middle), empty (right).
  const hud = document.createElement('div');
  hud.className = 'sb-gameplay-hud';

  const hudColLeft = document.createElement('div');
  hudColLeft.className = 'sb-gameplay-hud-col sb-gameplay-hud-col--left';
  const scoreLabel = document.createElement('span');
  scoreLabel.textContent = 'Score: ';
  const scoreValue = document.createElement('span');
  scoreValue.className = 'sb-gameplay-score';
  scoreValue.textContent = '0';
  hudColLeft.appendChild(scoreLabel);
  hudColLeft.appendChild(scoreValue);

  const hudColCenter = document.createElement('div');
  hudColCenter.className = 'sb-gameplay-hud-col sb-gameplay-hud-col--center';
  const coinsLabel = document.createElement('span');
  coinsLabel.textContent = 'Coins: ';
  const coinsValue = document.createElement('span');
  coinsValue.className = 'sb-gameplay-coins';
  coinsValue.textContent = '0';
  hudColCenter.appendChild(coinsLabel);
  hudColCenter.appendChild(coinsValue);

  const hudColRight = document.createElement('div');
  hudColRight.className = 'sb-gameplay-hud-col sb-gameplay-hud-col--right';
  const levelIndicator = document.createElement('div');
  levelIndicator.className = 'sb-level-indicator';
  const levelLabel = document.createElement('span');
  levelLabel.className = 'sb-level-label';
  levelLabel.textContent = 'Lvl 1';
  const levelProgress = document.createElement('div');
  levelProgress.className = 'sb-level-progress';
  const levelProgressTrack = document.createElement('div');
  levelProgressTrack.className = 'sb-level-progress-track';
  const levelProgressFill = document.createElement('div');
  levelProgressFill.className = 'sb-level-progress-fill';
  levelProgressTrack.appendChild(levelProgressFill);
  levelProgress.appendChild(levelProgressTrack);

  // Create sublevel dots along the bar (5 sublevels).
  const subLevelDots = [];
  const subLevelsPerLevel = GAME_CONFIG.subLevelsPerLevel || 5;
  for (let i = 0; i < subLevelsPerLevel; i += 1) {
    const dot = document.createElement('div');
    dot.className = 'sb-level-dot';

    // Position dots so they line up with the 5 equal sublevels
    // (20 kills each out of 100 total): 0.2, 0.4, 0.6, 0.8, 1.0.
    const t = subLevelsPerLevel > 0 ? (i + 1) / subLevelsPerLevel : 0.5;
    dot.style.left = `${t * 100}%`;

    // Remember this normalized position so we can compare it against
    // the continuous progress value later and fill the circle at the
    // exact moment the bar reaches it.
    dot.dataset.progressThreshold = String(t);

    levelProgress.appendChild(dot);
    subLevelDots.push(dot);
  }
  levelIndicator.appendChild(levelLabel);
  levelIndicator.appendChild(levelProgress);
  hudColRight.appendChild(levelIndicator);

  hud.appendChild(hudColLeft);
  hud.appendChild(hudColCenter);
  hud.appendChild(hudColRight);

  // Small toast message that appears when a new sublevel (wave) starts.
  const waveToast = document.createElement('div');
  waveToast.className = 'sb-level-toast';
  waveToast.textContent = 'New wave!';
  let waveToastHideTimeout = null;

  const playfield = document.createElement('div');
  playfield.className = 'sb-gameplay';

  const bgLayer = document.createElement('div');
  bgLayer.className = 'sb-gameplay-bg';

  const player = document.createElement('img');
  player.className = 'sb-player';
  player.src = './assets/img/player/player.png';
  player.alt = 'Player ship';

  // Skill tree overlay container, initially hidden.
  const skillOverlay = document.createElement('div');
  skillOverlay.className = 'sb-skill-overlay sb-skill-overlay--hidden';

  // Place HUD and toast inside the gameplay area.
  playfield.appendChild(hud);
  playfield.appendChild(waveToast);
  playfield.appendChild(bgLayer);
  playfield.appendChild(player);
  playfield.appendChild(skillOverlay);

  root.appendChild(playfield);
  container.appendChild(root);

  // Set up the animated background clouds.
  setupBackgroundClouds(playfield, bgLayer, root);

  // Player stats after applying skills (fire rate, coin gain, health, crit...).
  let playerStats = { ...BASE_PLAYER_STATS };

  // Player input controller so we can update fire rate mid-run.
  let playerControls = null;

  // Track last known sublevel so we can announce when a new wave starts.
  let lastSubLevelIndex = 0;

  // Base spendable coins loaded from backend at the start of the run.
  let baseAvailableCoins = 0;

  let cachedSkillDefs = [];
  let cachedPlayerSkills = [];

  function recomputePlayerStats() {
    playerStats = applySkills(BASE_PLAYER_STATS, cachedPlayerSkills, cachedSkillDefs);

    const baseShotsPerSecond = GAME_CONFIG.baseShotsPerSecond || 4;
    const effectiveShotsPerSecond = baseShotsPerSecond * (playerStats.fireRate || 1);
    if (playerControls && typeof playerControls.setShotsPerSecond === 'function') {
      playerControls.setShotsPerSecond(effectiveShotsPerSecond);
    }
  }

  // Set up aliens that spawn outside and move toward the player.
  function openSkillOverlay() {
    skillOverlay.classList.remove('sb-skill-overlay--hidden');
    renderSkillTree(skillOverlay, {
      onClose: () => {
        skillOverlay.classList.add('sb-skill-overlay--hidden');
      },
      onSkillsChanged: () => {
        Promise.all([
          fetch('backend/public/api.php?path=player/skills').then((r) => r.json()),
          fetch('backend/public/api.php?path=skills/tree').then((r) => r.json()),
        ])
          .then(([playerState, skillDefs]) => {
            const coinsRaw =
              typeof playerState.availableCoins === 'number'
                ? playerState.availableCoins
                : playerState.coins;
            const coins = Number(coinsRaw || 0);
            baseAvailableCoins = coins;
            if (coinsValue) coinsValue.textContent = String(coins);

            cachedPlayerSkills = Array.isArray(playerState.skills) ? playerState.skills : [];
            cachedSkillDefs = Array.isArray(skillDefs) ? skillDefs : [];

            recomputePlayerStats();
          })
          .catch(() => {
            // Ignore failures; gameplay continues with current stats.
          });
      },
    });
  }

  function startAliens() {
    setupAliens(playfield, player, {
      // coins here are "coins earned this run" (runCoins).
      onStatsChange: ({ killCount, coins }) => {
        if (scoreValue) scoreValue.textContent = String(killCount);
        if (coinsValue) coinsValue.textContent = String(baseAvailableCoins + coins);
      },
    onLevelProgress: ({ level, subLevelIndex, subLevelsPerLevel, progress }) => {
      if (levelLabel) {
        levelLabel.textContent = `Lvl ${level}`;
      }

      if (levelProgressFill) {
        const clampedProgress = Math.max(0, Math.min(1, progress));
        const pct = clampedProgress * 100;
        levelProgressFill.style.width = `${pct}%`;
      }

      // Each circle fills (becomes active) once the bar's
      // fill has clearly passed its stored position along the track.
      if (Array.isArray(subLevelDots)) {
        const clampedProgress = Math.max(0, Math.min(1, progress));
        for (let i = 0; i < subLevelDots.length; i += 1) {
          const dot = subLevelDots[i];
          if (!dot) continue;

          const threshold = parseFloat(dot.dataset.progressThreshold || '0');

          if (clampedProgress >= threshold) {
            dot.classList.add('sb-level-dot--active');
          } else {
            dot.classList.remove('sb-level-dot--active');
          }
        }
      }

      // When sublevel index increases, show a short 'New wave!' message.
      if (typeof subLevelIndex === 'number' && subLevelIndex > lastSubLevelIndex) {
        lastSubLevelIndex = subLevelIndex;

        if (waveToastHideTimeout !== null) {
          clearTimeout(waveToastHideTimeout);
        }

        waveToast.classList.add('sb-level-toast--visible');
        waveToastHideTimeout = setTimeout(() => {
          waveToast.classList.remove('sb-level-toast--visible');
          waveToastHideTimeout = null;
        }, 1300);
      }
    },
    onUpgradeRequest: openSkillOverlay,
    });
  }

  // Load spendable coins and skills so HUD and mechanics start from the
  // same state as the skill tree.
  Promise.all([
    fetch('backend/public/api.php?path=player/skills').then((r) => r.json()),
    fetch('backend/public/api.php?path=skills/tree').then((r) => r.json()),
  ])
    .then(([playerState, skillDefs]) => {
      const coinsRaw =
        typeof playerState.availableCoins === 'number'
          ? playerState.availableCoins
          : playerState.coins;
      const coins = Number(coinsRaw || 0);
      baseAvailableCoins = coins;
      if (coinsValue) coinsValue.textContent = String(coins);

      // Compute final player stats from base + skills.
      cachedPlayerSkills = Array.isArray(playerState.skills) ? playerState.skills : [];
      cachedSkillDefs = Array.isArray(skillDefs) ? skillDefs : [];
      recomputePlayerStats();
    })
    .catch(() => {
      // If backend is unavailable, keep base stats and starting coins.
      playerStats = { ...BASE_PLAYER_STATS };
    })
    .finally(() => {
      const baseShotsPerSecond = GAME_CONFIG.baseShotsPerSecond || 4;
      const effectiveShotsPerSecond = baseShotsPerSecond * (playerStats.fireRate || 1);

      // Set up player controls after we know the effective fire rate from skills.
      playerControls = setupPlayerControls(playfield, player, {
        shotsPerSecond: effectiveShotsPerSecond,
      });

      // Start aliens after we’ve attempted to sync HUD coins and skill effects.
      setupAliens(playfield, player, {
        // coins here are "coins earned this run" (runCoins).
        onStatsChange: ({ killCount, coins }) => {
          if (scoreValue) scoreValue.textContent = String(killCount);
          if (coinsValue) coinsValue.textContent = String(baseAvailableCoins + coins);
        },
        onLevelProgress: ({ level, subLevelIndex, subLevelsPerLevel, progress }) => {
          if (levelLabel) {
            levelLabel.textContent = `Lvl ${level}`;
          }

          if (levelProgressFill) {
            const clampedProgress = Math.max(0, Math.min(1, progress));
            const pct = clampedProgress * 100;
            levelProgressFill.style.width = `${pct}%`;
          }

          if (Array.isArray(subLevelDots)) {
            const clampedProgress = Math.max(0, Math.min(1, progress));
            for (let i = 0; i < subLevelDots.length; i += 1) {
              const dot = subLevelDots[i];
              if (!dot) continue;

              const threshold = parseFloat(dot.dataset.progressThreshold || '0');

              if (clampedProgress >= threshold) {
                dot.classList.add('sb-level-dot--active');
              } else {
                dot.classList.remove('sb-level-dot--active');
              }
            }
          }

          if (typeof subLevelIndex === 'number' && subLevelIndex > lastSubLevelIndex) {
            lastSubLevelIndex = subLevelIndex;

            if (waveToastHideTimeout !== null) {
              clearTimeout(waveToastHideTimeout);
            }

            waveToast.classList.add('sb-level-toast--visible');
            waveToastHideTimeout = setTimeout(() => {
              waveToast.classList.remove('sb-level-toast--visible');
              waveToastHideTimeout = null;
            }, 1300);
          }
        },
        onUpgradeRequest: openSkillOverlay,
        // Pass final stats so alien-manager can apply mechanics.
        getPlayerStats: () => playerStats,
      });
    });

  // Ensure double-clicks in the gameplay area do not trigger browser selection behavior.
  playfield.addEventListener('dblclick', (event) => {
    event.preventDefault();
  });
}
