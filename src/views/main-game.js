// Main game view for Space Blaster.
// Responsible for rendering the logo, game options, and the game canvas shell.

import { navigateTo } from '../utils/navigation.js';

export function renderMainGame(container) {
  const root = document.createElement('div');
  root.className = 'sb-view sb-view--game';

  const main = document.createElement('main');
  main.className = 'sb-main-hero';

  const left = document.createElement('section');
  left.className = 'sb-main-hero-left';

  const title = document.createElement('h1');
  title.className = 'sb-main-title';
  title.textContent = 'SPACE BLASTER';

  const subtitle = document.createElement('p');
  subtitle.className = 'sb-main-subtitle';
  subtitle.textContent = 'Defend Earth. Destroy Aliens. Survive.';

  const navRow = document.createElement('nav');
  navRow.className = 'sb-nav-row';

  const list = document.createElement('ul');
  list.className = 'sb-nav-row-list';

  const items = [
    { label: 'Start Game', onClick: () => navigateTo('/play') },
    { label: 'Updates & Stats', onClick: () => navigateTo('/updates') },
    { label: 'Settings', onClick: () => {/* settings logic later */} },
  ];

  items.forEach(({ label, onClick }) => {
    const li = document.createElement('li');
    li.className = 'sb-nav-item';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sb-nav-link';
    btn.textContent = label;
    btn.addEventListener('click', onClick);

    li.appendChild(btn);
    list.appendChild(li);
  });

  navRow.appendChild(list);

  left.appendChild(title);
  left.appendChild(subtitle);
  left.appendChild(navRow);

  const infoBox = document.createElement('section');
  infoBox.className = 'sb-info-box';

  const infoText = document.createElement('p');
  infoText.innerHTML = [
    'Use your mouse to control the ship.',
    '',
    'Destroy aliens to earn coins and upgrade your ship.',
    '',
    'How long can you survive?',
  ].join('<br>');

  infoBox.appendChild(infoText);
  left.appendChild(infoBox);

  const right = document.createElement('section');
  right.className = 'sb-main-hero-right';

  const heroImage = document.createElement('img');
  heroImage.className = 'sb-hero-image';
  heroImage.src = './assets/img/main-screen.png';
  heroImage.alt = 'Space Blaster main screen preview';

  right.appendChild(heroImage);

  main.appendChild(left);
  main.appendChild(right);

  root.appendChild(main);

  container.appendChild(root);
}
