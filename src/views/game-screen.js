// Gameplay screen for Space Blaster.
// Renders a black playfield with moving background elements and the player in the center.

import { setupBackgroundClouds } from './game-background.js';
import { setupPlayerControls } from './player-controller.js';
import { setupAliens } from './alien-manager.js';

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
    scoreEl: scoreValue,
    coinsEl: coinsValue,
  });

  // Ensure double-clicks in the gameplay area do not trigger browser selection behavior.
  playfield.addEventListener('dblclick', (event) => {
    event.preventDefault();
  });
}
