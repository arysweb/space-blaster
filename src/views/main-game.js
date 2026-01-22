// Main game view for Space Blaster.
// Responsible for rendering the logo, game options, and the game canvas shell.

import { navigateTo } from '../utils/navigation.js';

function registerPlayer(name) {
  // Fire-and-forget request to backend to register/update this player.
  // Uses a path relative to the project root so it works under /2026/space-blaster/.
  try {
    fetch('backend/public/api.php?path=player/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    }).catch(() => {
      // Ignore network errors for now; game can still run offline.
    });
  } catch (e) {
    // Swallow errors; stats are optional.
  }
}

function showPlayerNameModal(onSubmit) {
  const existingName = '';

  const backdrop = document.createElement('div');
  backdrop.className = 'sb-modal-backdrop';

  const modal = document.createElement('div');
  modal.className = 'sb-modal';

  const title = document.createElement('h2');
  title.className = 'sb-modal-title';
  title.textContent = 'Identify Yourself, Pilot';

  const text = document.createElement('p');
  text.className = 'sb-modal-text';
  text.textContent = 'Type your callsign for the mission. If you leave this blank, Command will assign you an anonymous Anon_XXXX identity.';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'sb-modal-input';
  input.placeholder = 'Player name';
  input.maxLength = 16;
  input.value = existingName;

  const actions = document.createElement('div');
  actions.className = 'sb-modal-actions';

  const confirm = document.createElement('button');
  confirm.type = 'button';
  confirm.className = 'sb-button sb-button--primary';
  confirm.textContent = 'Confirm';

  function closeWithName() {
    let name = input.value.trim();
    if (!name) {
      // Generate an anonymous name like Anon_1234
      const suffix = Math.floor(1000 + Math.random() * 9000);
      name = `Anon_${suffix}`;
    }
    registerPlayer(name);
    if (typeof onSubmit === 'function') {
      onSubmit(name);
    }
    backdrop.remove();
  }

  confirm.addEventListener('click', closeWithName);

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      closeWithName();
    }
  });

  modal.appendChild(title);
  modal.appendChild(text);
  modal.appendChild(input);
  actions.appendChild(confirm);
  modal.appendChild(actions);
  backdrop.appendChild(modal);

  document.body.appendChild(backdrop);

  // Focus input when modal appears.
  setTimeout(() => {
    input.focus();
    input.select();
  }, 0);
}

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
    {
      label: 'Start Game',
      onClick: () => {
        // Always ask for player name, then navigate to the gameplay screen.
        showPlayerNameModal(() => {
          navigateTo('/play');
        });
      },
    },
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
