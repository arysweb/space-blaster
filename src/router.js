// Simple hash-based router for a 100% SPA experience.
// Routes:
//   #/          -> main game screen
//   #/updates   -> updates and stats screen

export function createRouter() {
  const listeners = new Set();

  function getCurrentRoute() {
    const hash = window.location.hash || '#/';
    return hash.replace(/^#/, '') || '/';
  }

  function notify() {
    const route = getCurrentRoute();
    listeners.forEach((listener) => listener(route));
  }

  function onRouteChange(listener) {
    listeners.add(listener);
    // Call immediately so the app can render the current route.
    listener(getCurrentRoute());
  }

  function start() {
    window.addEventListener('hashchange', notify);
    notify();
  }

  function navigateTo(path) {
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    window.location.hash = path;
  }

  return {
    start,
    onRouteChange,
    navigateTo,
  };
}
