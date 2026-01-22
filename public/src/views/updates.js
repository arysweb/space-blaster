// Updates & stats view for Space Blaster.
// Displays recent game updates and basic aggregated stats.

import { navigateTo } from '../utils/navigation.js';

export function renderUpdates(container) {
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

  const updatesSection = document.createElement('section');
  updatesSection.className = 'sb-panel';

  const updatesTitle = document.createElement('h2');
  updatesTitle.className = 'sb-heading';
  updatesTitle.textContent = 'Game Updates';

  const updatesList = document.createElement('ul');
  updatesList.className = 'sb-list sb-list--updates';

  // Static placeholder content for now.
  const sampleUpdates = [
    '[v0.1.0] Core engine scaffolding and basic skill tree layout.',
    '[v0.0.3] Visual polish pass on pixel UI and navigation.',
    '[v0.0.2] Added stats endpoint stub in backend.',
  ];

  sampleUpdates.forEach((text) => {
    const li = document.createElement('li');
    li.textContent = text;
    updatesList.appendChild(li);
  });

  updatesSection.appendChild(updatesTitle);
  updatesSection.appendChild(updatesList);

  const statsSection = document.createElement('section');
  statsSection.className = 'sb-panel';

  const statsTitle = document.createElement('h2');
  statsTitle.className = 'sb-heading';
  statsTitle.textContent = 'Global Stats (Stub)';

  const statsBody = document.createElement('div');
  statsBody.className = 'sb-stats-grid';

  const statItems = [
    { label: 'Total Players', value: '--' },
    { label: 'Total Games Played', value: '--' },
    { label: 'Top Score', value: '--' },
  ];

  statItems.forEach(({ label, value }) => {
    const box = document.createElement('div');
    box.className = 'sb-stat-box';

    const l = document.createElement('div');
    l.className = 'sb-stat-label';
    l.textContent = label;

    const v = document.createElement('div');
    v.className = 'sb-stat-value';
    v.textContent = value;

    box.appendChild(l);
    box.appendChild(v);
    statsBody.appendChild(box);
  });

  statsSection.appendChild(statsTitle);
  statsSection.appendChild(statsBody);

  main.appendChild(updatesSection);
  main.appendChild(statsSection);

  root.appendChild(header);
  root.appendChild(main);

  container.appendChild(root);
}
