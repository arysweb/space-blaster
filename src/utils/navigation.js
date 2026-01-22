// Navigation helpers that wrap the router's navigateTo function.
// This keeps view code decoupled from how routing is implemented.

import { createRouter } from '../router.js';

// Singleton router instance for navigation from any view.
const router = createRouter();

export function navigateTo(path) {
  router.navigateTo(path);
}
