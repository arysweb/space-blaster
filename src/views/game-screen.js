// Gameplay screen for Space Blaster.
// Renders a black playfield with moving background elements and the player in the center.

import { setupBackgroundClouds } from './game-background.js';
import { setupPlayerControls } from './player-controller.js';

export function renderGameScreen(container) {
  const root = document.createElement('div');
  root.className = 'sb-view sb-view--gameplay';

  const playfield = document.createElement('div');
  playfield.className = 'sb-gameplay';

  const bgLayer = document.createElement('div');
  bgLayer.className = 'sb-gameplay-bg';

  const player = document.createElement('img');
  player.className = 'sb-player';
  player.src = './assets/img/player/player.png';
  player.alt = 'Player ship';

  playfield.appendChild(bgLayer);
  playfield.appendChild(player);
  root.appendChild(playfield);
  container.appendChild(root);

  // Set up the animated background clouds.
  setupBackgroundClouds(playfield, bgLayer, root);

  // Set up player controls so the ship aims at the mouse.
  setupPlayerControls(playfield, player);

  // Ensure double-clicks in the gameplay area do not trigger browser selection behavior.
  playfield.addEventListener('dblclick', (event) => {
    event.preventDefault();
  });
}
