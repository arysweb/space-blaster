// Entry point for the Space Blaster SPA
// This file bootstraps the single-page application and mounts views.

import { createRouter } from './src/router.js';
import { renderApp } from './src/app.js';

const appElement = document.getElementById('app');
const router = createRouter();

router.onRouteChange((route) => {
  renderApp(appElement, route);
});

// Initial render
router.start();
