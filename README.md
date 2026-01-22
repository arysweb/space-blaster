# Space Blaster

Single Page Application (SPA) browser game with a PHP/MySQL backend.

## Structure

- **`public/`**
  - **`index.html`**
    - HTML entry point for the SPA.
    - Mounts the app into the `#app` element and loads `main.js`.
  - **`main.js`**
    - JavaScript entry point.
    - Creates the router and renders the app when the route changes.
  - **`src/`**
    - **`router.js`**
      - Simple hash-based router for SPA routes:
        - `#/` → main game screen.
        - `#/updates` → updates & stats screen.
    - **`app.js`**
      - Decides which view to render based on the current route.
    - **`views/`**
      - **`main-game.js`**
        - Main game screen: logo, game options, and stubbed basic skill tree.
      - **`updates.js`**
        - One-page "updates & stats" view.
    - **`utils/`**
      - **`navigation.js`**
        - Helper to perform navigation from views without hard-coding router details.
  - **`assets/css/`**
    - **`reset.css`**
      - Minimal CSS reset.
    - **`theme.css`**
      - Black/white/gray pixel-style theme tokens and base component styles.
    - **`layout.css`**
      - Layout for views, panels, buttons, skill tree grid, and stats grid.

- **`backend/`**
  - **`config/database.php`**
    - PDO-based MySQL connection helper (`sb_get_pdo`).
    - Currently uses placeholder credentials; adjust for your environment.
  - **`public/api.php`**
    - Basic JSON API entrypoint.
    - Stubbed endpoints:
      - `GET ?path=stats` → returns placeholder stats.
      - `GET ?path=health` → simple health check.

## Running locally (XAMPP)

- Place the project under your XAMPP `htdocs` directory (already done here as `2026/space-blaster`).
- Frontend SPA entry: `http://localhost/2026/space-blaster/public/index.html`.
- Backend API entry: `http://localhost/2026/space-blaster/backend/public/api.php?path=health`.

## Next steps

- Implement real game loop and rendering on the main game screen.
- Flesh out the basic skill tree logic (unlocking, persistence via backend).
- Connect updates & stats view to live data from the MySQL database.
