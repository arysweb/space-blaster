// Navigation helpers that work with the hash-based router.
// This keeps view code decoupled from how routing is implemented.

export function navigateTo(path) {
  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  const current = (window.location.hash || '#/').replace(/^#/, '') || '/';

  // If navigating to the same path, force a hash change so listeners re-run
  // (used by the gameplay "Try Again" button to restart the /play view).
  if (current === path) {
    const suffix = (path.includes('?') ? '&' : '?') + 't=' + Date.now();
    window.location.hash = path + suffix;
    return;
  }

  window.location.hash = path;
}
