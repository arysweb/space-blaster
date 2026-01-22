// Gameplay screen for Space Blaster.
// Renders a black playfield with moving background elements and the player in the center.

import { setupBackgroundClouds } from './game-background.js';
import { setupPlayerControls } from './player-controller.js';
import { setupAliens } from './alien-manager.js';
import { GAME_CONFIG } from '../game-config.js';

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

    // Evenly distribute from 0% to 100% across the bar.
    const t = subLevelsPerLevel > 1 ? i / (subLevelsPerLevel - 1) : 0.5;
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

  const playfield = document.createElement('div');
  playfield.className = 'sb-gameplay';

  const bgLayer = document.createElement('div');
  bgLayer.className = 'sb-gameplay-bg';

  const player = document.createElement('img');
  player.className = 'sb-player';
  player.src = './assets/img/player/player.png';
  player.alt = 'Player ship';

  // Place HUD inside the gameplay area.
  playfield.appendChild(hud);
  playfield.appendChild(bgLayer);
  playfield.appendChild(player);

  root.appendChild(playfield);
  container.appendChild(root);

  // Set up the animated background clouds.
  setupBackgroundClouds(playfield, bgLayer, root);

  // Set up player controls so the ship aims at the mouse.
  setupPlayerControls(playfield, player);

  // Set up aliens that spawn outside and move toward the player.
  setupAliens(playfield, player, {
    onStatsChange: ({ killCount }) => {
      if (scoreValue) scoreValue.textContent = String(killCount);
      if (coinsValue) coinsValue.textContent = String(killCount);
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

      // Each circle fills (becomes active) exactly when the bar's
      // fill reaches its position along the track.
      if (Array.isArray(subLevelDots)) {
        const clampedProgress = Math.max(0, Math.min(1, progress));
        for (let i = 0; i < subLevelDots.length; i += 1) {
          const dot = subLevelDots[i];
          if (!dot) continue;

          const baseThreshold = parseFloat(dot.dataset.progressThreshold || '0');
          // Nudge the threshold a little to the right so visually the
          // bar has to pass the circle's center before it flips white.
          const threshold = Math.min(1, baseThreshold + 0.03);

          if (clampedProgress >= threshold) {
            dot.classList.add('sb-level-dot--active');
          } else {
            dot.classList.remove('sb-level-dot--active');
          }
        }
      }
    },
  });

  // Ensure double-clicks in the gameplay area do not trigger browser selection behavior.
  playfield.addEventListener('dblclick', (event) => {
    event.preventDefault();
  });
}
