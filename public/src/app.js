// Root application renderer. Decides which view to display based on the current route.

import { renderMainGame } from './views/main-game.js';
import { renderUpdates } from './views/updates.js';

/**
 * Render the root application into a given container.
 * @param {HTMLElement} container
 * @param {string} route
 */
export function renderApp(container, route) {
  container.innerHTML = '';

  if (route === '/' || route === '') {
    renderMainGame(container);
  } else if (route.startsWith('/updates')) {
    renderUpdates(container);
  } else {
    const notFound = document.createElement('div');
    notFound.className = 'sb-view sb-view--centered';
    notFound.textContent = 'Page not found';
    container.appendChild(notFound);
  }
}
