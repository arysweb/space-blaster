// Player controller for the gameplay screen.
// Keeps the player ship in the center and rotates it to face the mouse.

/**
 * Set up mouse-controlled aiming for the player ship.
 *
 * @param {HTMLElement} playfield - The main gameplay area element.
 * @param {HTMLImageElement} player - The player ship image element.
 */
export function setupPlayerControls(playfield, player) {
  // Ensure player is visually centered by default (matches CSS).
  player.style.left = '50%';
  player.style.top = '50%';
  player.style.transform = 'translate(-50%, -50%)';

  function spawnProjectile(targetClientX, targetClientY) {
    const rect = playfield.getBoundingClientRect();
    const playerRect = player.getBoundingClientRect();

    // Start at the exact visual center of the player sprite.
    const startX = playerRect.left + playerRect.width / 2 - rect.left;
    const startY = playerRect.top + playerRect.height / 2 - rect.top;

    // Direction from player center to click position (all in viewport coords).
    const dirX = targetClientX - (playerRect.left + playerRect.width / 2);
    const dirY = targetClientY - (playerRect.top + playerRect.height / 2);

    const length = Math.hypot(dirX, dirY) || 1;
    const normX = dirX / length;
    const normY = dirY / length;

    const speed = 450; // pixels per second

    const projectile = document.createElement('img');
    projectile.src = './assets/img/player_projectile.png';
    projectile.className = 'sb-projectile';

    playfield.appendChild(projectile);

    const state = {
      x: startX,
      y: startY,
      vx: normX * speed,
      vy: normY * speed,
    };

    projectile.style.transform = `translate(${state.x}px, ${state.y}px)`;

    let lastTime = performance.now();

    function update(now) {
      // Stop updating if projectile or playfield is no longer in the DOM.
      if (!document.body.contains(playfield) || !projectile.isConnected) return;

      const dt = (now - lastTime) / 1000;
      lastTime = now;

      state.x += state.vx * dt;
      state.y += state.vy * dt;

      // Remove projectile if it goes far outside the playfield.
      if (
        state.x < -50 ||
        state.y < -50 ||
        state.x > rect.width + 50 ||
        state.y > rect.height + 50
      ) {
        projectile.remove();
        return;
      }

      projectile.style.transform = `translate(${state.x}px, ${state.y}px)`;
      requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  function handleMouseMove(event) {
    const rect = playfield.getBoundingClientRect();

    // Center of the playfield in viewport coordinates
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;

    // Compute angle from player (center) to mouse.
    // Math.atan2 returns radians; convert to degrees.
    let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

    // The sprite is drawn pointing up by default, but our angle assumes pointing right.
    // Rotate by +90 degrees so the nose points toward the cursor (not away from it).
    angleDeg += 90;

    player.style.transform = `translate(-50%, -50%) rotate(${angleDeg}deg)`;
  }

  // Listen for mouse movement over the whole window so aiming works
  // even if the cursor goes slightly outside the playfield.
  window.addEventListener('mousemove', handleMouseMove);

  // Fire a projectile from the player toward the mouse pointer on click.
  playfield.addEventListener('click', (event) => {
    spawnProjectile(event.clientX, event.clientY);
  });
}
