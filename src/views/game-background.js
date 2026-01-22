// Background cloud animation for the gameplay screen.

const BG_IMAGES = [
  './assets/img/bg_elements/bg_cloud_1.png',
  './assets/img/bg_elements/bg_cloud_2.png',
  './assets/img/bg_elements/bg_cloud_3.png',
];

// Fixed vertical lane positions as a fraction of playfield height.
const LANE_FACTORS = [0.2, 0.4, 0.6, 0.8];

// Allow multiple clouds per lane so the stream feels continuous.
// We will aim for a random count between 1 and 2 per lane on each spawn cycle.
const MAX_CLOUDS_PER_LANE = 2;

// Minimum horizontal distance between clouds to reduce visual overlap/clumping.
const MIN_CLOUD_DISTANCE_X = 200; // pixels

/**
 * Simple background element instance.
 * Each element is assigned to a vertical lane so they never overlap vertically.
 */
function createBgElement(containerWidth, containerHeight, laneIndex) {
  const img = document.createElement('img');
  img.className = 'sb-bg-elem';

  const spriteIndex = Math.floor(Math.random() * BG_IMAGES.length);
  const sprite = BG_IMAGES[spriteIndex];
  img.src = sprite;
  img.alt = '';

  const laneCount = LANE_FACTORS.length;
  const depth = (laneIndex + 1) / laneCount; // 0..1 (far -> near)

  // Depth-based size and opacity: far = smaller + more faded, near = larger + slightly stronger.
  const sizeTier = Math.floor(Math.random() * 3); // 0 = small, 1 = medium, 2 = large
  const tierBase = sizeTier === 0 ? 0.4 : sizeTier === 1 ? 0.7 : 1.0; // overall smaller
  const randomJitter = 0.85 + Math.random() * 0.3; // 0.85x - 1.15x per element
  const sizeScale = (0.25 + depth * 0.6) * tierBase * randomJitter; // reduce base scaling
  const opacity = 0.1 + depth * 0.3;   // ~0.1 (far) -> ~0.4 (near)

  // All clouds move at roughly the same horizontal speed with slight variation per cloud.
  const baseSpeed = 40; // pixels per second
  const speedJitter = 0.85 + Math.random() * 0.3; // 0.85x - 1.15x

  const factor = LANE_FACTORS[laneIndex % laneCount];
  const y = containerHeight * factor;
  // Start clouds so some are immediately visible and some are just off-screen to the right.
  // Range: from just left of the screen to 1.0x screen width.
  const startX = -containerWidth * 0.2 + Math.random() * containerWidth * 1.2;

  const state = {
    x: startX,
    y,
    laneIndex,
    speed: baseSpeed * speedJitter,
    scale: sizeScale,
    spriteIndex,
    sizeTier,
    depth,
    opacity,
  };

  img.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
  img.style.opacity = opacity;

  return { img, state };
}

/**
 * Set up animated background clouds for a given playfield and background layer.
 * The animation runs as long as the provided root element stays in the DOM.
 *
 * @param {HTMLElement} playfield - The main gameplay area element.
 * @param {HTMLElement} bgLayer - The container for background cloud elements.
 * @param {HTMLElement} root - The root element for this view (used for cleanup).
 */
export function setupBackgroundClouds(playfield, bgLayer, root) {
  const bgElements = [];

  let lastTime = performance.now();
  let running = true;

  function spawnIfNeeded() {
    const rect = playfield.getBoundingClientRect();

    // For each lane, aim for a random number of clouds between 1 and MAX_CLOUDS_PER_LANE.
    for (let laneIndex = 0; laneIndex < LANE_FACTORS.length; laneIndex += 1) {
      const inLane = bgElements.filter(
        (elem) => elem.state.laneIndex === laneIndex,
      );

      const targetCount = 1 + Math.floor(Math.random() * MAX_CLOUDS_PER_LANE); // 1..3
      const missing = targetCount - inLane.length;
      for (let i = 0; i < missing; i += 1) {
        const elem = createBgElement(rect.width, rect.height, laneIndex);

        // Give newly spawned clouds a bit of extra spacing from existing ones.
        let attempts = 0;
        while (
          attempts < 10 &&
          bgElements.some(
            (other) =>
              other.state.laneIndex === laneIndex &&
              Math.abs(other.state.x - elem.state.x) < MIN_CLOUD_DISTANCE_X,
          )
        ) {
          elem.state.x += MIN_CLOUD_DISTANCE_X;
          attempts += 1;
        }

        elem.img.style.transform = `translate(${elem.state.x}px, ${elem.state.y}px) scale(${elem.state.scale})`;

        bgLayer.appendChild(elem.img);
        bgElements.push(elem);
      }
    }
  }

  function update(timestamp) {
    if (!running) return;

    const dt = (timestamp - lastTime) / 1000; // seconds
    lastTime = timestamp;

    const rect = playfield.getBoundingClientRect();

    bgElements.forEach((elem) => {
      elem.state.x -= elem.state.speed * dt;

      if (elem.state.x < -rect.width * 0.3) {
        // Move back to the right edge, keep the same lane (y) so clouds never overlap vertically.
        // Also ensure a minimum horizontal distance from other clouds to avoid clumping.
        let attempts = 0;
        let newX;
        do {
          // Respawn just to the right of the screen with some spacing,
          // so new clouds appear sooner but don't overlap and don't take too long to enter.
          newX = rect.width + MIN_CLOUD_DISTANCE_X * 0.3 + Math.random() * rect.width * 0.5;
          attempts += 1;
        } while (
          attempts < 10 &&
          bgElements.some((other) =>
            other !== elem && Math.abs(other.state.x - newX) < MIN_CLOUD_DISTANCE_X,
          )
        );
        elem.state.x = newX;

        // On wrap, pick a new sprite and size tier so it feels like a new cloud.
        elem.state.spriteIndex = Math.floor(Math.random() * BG_IMAGES.length);
        const newSprite = BG_IMAGES[elem.state.spriteIndex];
        elem.img.src = newSprite;

        // Recompute size using the same logic as in createBgElement.
        elem.state.sizeTier = Math.floor(Math.random() * 3);
        const tierBase = elem.state.sizeTier === 0 ? 0.4 : elem.state.sizeTier === 1 ? 0.7 : 1.0;
        const randomJitter = 0.85 + Math.random() * 0.3;
        elem.state.scale = (0.25 + elem.state.depth * 0.6) * tierBase * randomJitter;

        // Slightly refresh speed variation as well (use same base speed as creation).
        const baseSpeed = 40;
        const speedJitter = 0.85 + Math.random() * 0.3;
        elem.state.speed = baseSpeed * speedJitter;
      }

      elem.img.style.transform = `translate(${elem.state.x}px, ${elem.state.y}px) scale(${elem.state.scale})`;
    });

    spawnIfNeeded();
    requestAnimationFrame(update);
  }

  spawnIfNeeded();
  requestAnimationFrame(update);

  // Cleanup on unmount: stop animation when root is removed from the DOM.
  const observer = new MutationObserver(() => {
    if (!document.body.contains(root)) {
      running = false;
      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
