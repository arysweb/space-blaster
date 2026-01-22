// Skill tree view for Space Blaster.
// Placeholder screen where players will upgrade their ship.

import { navigateTo } from '../utils/navigation.js';

export function renderSkillTree(container) {
  const root = document.createElement('div');
  root.className = 'sb-view sb-view--updates';

  const header = document.createElement('header');
  header.className = 'sb-header';

  const logo = document.createElement('h1');
  logo.className = 'sb-logo';
  logo.textContent = 'SPACE BLASTER';

  const nav = document.createElement('nav');
  nav.className = 'sb-nav';

  const backButton = document.createElement('button');
  backButton.className = 'sb-button sb-button--ghost';
  backButton.textContent = 'Back to Game';
  backButton.addEventListener('click', () => navigateTo('/'));

  nav.appendChild(backButton);
  header.appendChild(logo);
  header.appendChild(nav);

  const main = document.createElement('main');
  main.className = 'sb-content';

  const panel = document.createElement('section');
  panel.className = 'sb-panel';

  const title = document.createElement('h2');
  title.className = 'sb-heading';
  title.textContent = 'Ship Upgrades (Coming Soon)';

  const text = document.createElement('p');
  text.className = 'sb-modal-text';
  text.textContent = 'Here you will unlock new weapons, shields, and abilities for your ship in future versions of Space Blaster.';

  panel.appendChild(title);
  panel.appendChild(text);
  main.appendChild(panel);

  root.appendChild(header);
  root.appendChild(main);

  container.appendChild(root);
}
