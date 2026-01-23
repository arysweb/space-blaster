// Central skill engine: turns skill levels + definitions into concrete player stats.

export const BASE_PLAYER_STATS = {
  // Multiplier on base shots-per-second from GAME_CONFIG.
  fireRate: 1.0,
  // Flat extra coins per kill (0 means no bonus).
  coinGain: 0,
  // Number of hits the player can take before game over.
  maxHealth: 1,
  // Flat crit chance (0.0 - 1.0).
  critChance: 0.0,
  // Global damage multiplier.
  globalPower: 1.0,
};

function clamp(value, min, max) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Central skill engine (scales to 30+ skills without touching gameplay code).
 * Consumes DB skill definitions + player-owned levels, outputs finalized
 * gameplay-ready stats.
 */
export function computePlayerDerivedStats(options = {}) {
  const baseShotsPerSecond = Number(options.baseShotsPerSecond || 0);
  const playerSkills = Array.isArray(options.playerSkills) ? options.playerSkills : [];
  const skillDefs = Array.isArray(options.skillDefs) ? options.skillDefs : [];

  const EFFECT_SCALARS = {
    fire_rate: 2,
    coin_gain: 3,
    crit_chance: 2,
  };

  let fireRateMultiplier = 1.0;
  let maxHealth = 1;
  let critChance = 0.0;
  let coinsPerKillBonus = 0;
  let damageMultiplier = 1.0;

  for (const skill of playerSkills) {
    if (!skill) continue;

    const key = skill.skillKey;
    const level = Number(skill.current_level || 0);
    if (!key || level <= 0) continue;

    // Unlock-only.
    if (key === 'core_center') continue;

    const def = skillDefs.find((d) => d && d.key === key);
    if (!def) continue;

    const effectType = def.effect_type;
    const perLevel = Number(def.effect_value_per_level || 0);
    const scalar = typeof EFFECT_SCALARS[effectType] === 'number' ? EFFECT_SCALARS[effectType] : 1;
    const value = level * perLevel * scalar;

    switch (effectType) {
      case 'fire_rate':
        fireRateMultiplier += value;
        break;
      case 'coin_gain':
        coinsPerKillBonus += value;
        break;
      case 'max_health':
        maxHealth += value;
        break;
      case 'crit_chance':
        critChance += value;
        break;
      case 'global_power':
        damageMultiplier += value;
        break;
      default:
        break;
    }
  }

  const finalizedMaxHealth = Math.max(1, Math.round(maxHealth || 1));

  const finalizedCritChance = clamp(critChance, 0, 0.8);
  const finalizedFireRateMultiplier = Math.max(0.1, fireRateMultiplier || 1);
  const finalizedShotsPerSecond = Math.max(
    1,
    (baseShotsPerSecond > 0 ? baseShotsPerSecond : 4) * finalizedFireRateMultiplier,
  );

  const coinsRaw = Number(coinsPerKillBonus || 0);
  const finalizedCoinsPerKillBonus =
    coinsRaw > 0 ? Math.max(1, Math.round(coinsRaw)) : 0;
  const finalizedDamageMultiplier = Math.max(0.1, Number(damageMultiplier || 1));

  return {
    shotsPerSecond: finalizedShotsPerSecond,
    maxHealth: finalizedMaxHealth,
    critChance: finalizedCritChance,
    coinsPerKillBonus: finalizedCoinsPerKillBonus,
    damageMultiplier: finalizedDamageMultiplier,
  };
}

/**
 * Apply all owned skills to the base stats using effect_type and
 * effect_value_per_level from the skills table.
 */
export function applySkills(baseStats, playerSkills, skillDefs) {
  const stats = { ...baseStats };

  if (!Array.isArray(playerSkills) || !Array.isArray(skillDefs)) {
    return stats;
  }

  for (const skill of playerSkills) {
    if (!skill) continue;

    const key = skill.skillKey;
    const level = Number(skill.current_level || 0);
    if (!key || level <= 0) continue;

    // The main core skill only unlocks the tree; it should not modify stats.
    if (key === 'core_center') continue;

    const def = skillDefs.find((d) => d && d.key === key);
    if (!def) continue;

    const effectType = def.effect_type;
    const perLevel = Number(def.effect_value_per_level || 0);

    // Base value from DB, then tuned per effect so its clearly felt.
    let value = level * perLevel;

    switch (effectType) {
      case 'fire_rate':
        // Make each level noticeably faster.
        value *= 2; // e.g. 0.2 -> 0.4 per level
        break;
      case 'coin_gain':
        // Stronger coin gains so progression is visible.
        value *= 3; // e.g. 0.15 -> 0.45 per level
        break;
      case 'crit_chance':
        // Slightly boost crit scaling.
        value *= 2; // e.g. 0.05 -> 0.10 per level
        break;
      default:
        break;
    }

    switch (effectType) {
      case 'fire_rate':
        stats.fireRate += value;
        break;
      case 'coin_gain':
        stats.coinGain += value;
        break;
      case 'max_health':
        stats.maxHealth += value;
        break;
      case 'crit_chance':
        stats.critChance += value;
        break;
      case 'global_power':
        stats.globalPower += value;
        break;
      default:
        break;
    }
  }

  return stats;
}
