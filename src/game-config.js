// Central configuration for Space Blaster gameplay tuning.
// All main numeric knobs live here so balancing is easy.

export const GAME_CONFIG = {
  // Alien spawning
  spawnIntervalMinSeconds: 1.0,
  spawnIntervalMaxSeconds: 3.0,

  // Alien stats
  alienBaseSpeed: 45, // pixels per second
  alienHealth: 3,

  // Level progression (unlimited levels, 5 sublevels each)
  subLevelsPerLevel: 5,
  killsPerSubLevel: 20,

  // How much extra max health each progression tier adds.
  // Tier is based on (level, sublevel) so later sublevels/levels are tougher.
  alienHealthPerTier: 0.8,

  // How much to shrink spawn intervals per level (multiplicative factor)
  // Example: 0.97 = 3% faster per level.
  levelSpawnIntervalScale: 0.97,
  spawnIntervalMinCapSeconds: 0.5,
  spawnIntervalMaxCapSeconds: 2.0,
};
