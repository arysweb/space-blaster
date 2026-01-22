// Main game view for Space Blaster.
// Responsible for rendering the logo, game options, and the game canvas shell.

import { navigateTo } from '../utils/navigation.js';

export function renderMainGame(container) {
  const root = document.createElement('div');
  root.className = 'sb-view sb-view--game';

  const header = document.createElement('header');
  header.className = 'sb-header';

  const logo = document.createElement('h1');
  logo.className = 'sb-logo';
  logo.textContent = 'SPACE BLASTER';

  const nav = document.createElement('nav');
  nav.className = 'sb-nav';

  const updatesLink = document.createElement('button');
  updatesLink.className = 'sb-button sb-button--ghost';
  updatesLink.textContent = 'Updates & Stats';
  updatesLink.addEventListener('click', () => navigateTo('/updates'));

  nav.appendChild(updatesLink);

  header.appendChild(logo);
  header.appendChild(nav);

  const content = document.createElement('main');
  content.className = 'sb-content sb-content--split';

  const leftPanel = document.createElement('section');
  leftPanel.className = 'sb-panel';

  const title = document.createElement('h2');
  title.className = 'sb-heading';
  title.textContent = 'Game Options';

  const startButton = document.createElement('button');
  startButton.className = 'sb-button sb-button--primary';
  startButton.textContent = 'Start Game';

  const settingsButton = document.createElement('button');
  settingsButton.className = 'sb-button';
  settingsButton.textContent = 'Settings';

  leftPanel.appendChild(title);
  leftPanel.appendChild(startButton);
  leftPanel.appendChild(settingsButton);

  const rightPanel = document.createElement('section');
  rightPanel.className = 'sb-panel';

  const skillTreeTitle = document.createElement('h2');
  skillTreeTitle.className = 'sb-heading';
  skillTreeTitle.textContent = 'Skill Tree (Basic Stub)';

  const skillGrid = document.createElement('div');
  skillGrid.className = 'sb-skill-tree';

  const skills = [
    { id: 'atk', label: 'Attack +' },
    { id: 'spd', label: 'Speed +' },
    { id: 'hp', label: 'Hull +' },
    { id: 'rng', label: 'Range +' },
    { id: 'crt', label: 'Critical +' },
    { id: 'shd', label: 'Shield +' },
  ];

  skills.forEach((skill) => {
    const node = document.createElement('button');
    node.className = 'sb-skill-node';
    node.textContent = skill.label;
    node.dataset.skillId = skill.id;
    // Logic will be implemented later.
    skillGrid.appendChild(node);
  });

  rightPanel.appendChild(skillTreeTitle);
  rightPanel.appendChild(skillGrid);

  content.appendChild(leftPanel);
  content.appendChild(rightPanel);

  root.appendChild(header);
  root.appendChild(content);

  container.appendChild(root);
}
