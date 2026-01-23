// Skill tree view for Space Blaster.
// For now this page only shows coins (top-left) and a back button (top-right).

import { navigateTo } from '../utils/navigation.js';

export function renderSkillTree(container, options = {}) {
  const { onClose, onSkillsChanged } = options;
  const root = document.createElement('div');
  // Plain view without the updates-style border.
  root.className = 'sb-view';

  const header = document.createElement('header');
  header.className = 'sb-header sb-header--skilltree';

  const coinsEl = document.createElement('div');
  coinsEl.className = 'sb-modal-text';
  coinsEl.textContent = 'Coins: …';

  const nav = document.createElement('nav');
  nav.className = 'sb-nav';

  const backButton = document.createElement('button');
  backButton.className = 'sb-button sb-button--ghost';
  backButton.textContent = 'Back to Game';
  // In overlay mode, call the provided close callback. Fallback to gameplay route
  // for any legacy direct navigation usage.
  backButton.addEventListener('click', () => {
    if (typeof onClose === 'function') {
      onClose();
      return;
    }
    navigateTo('/play');
  });

  nav.appendChild(backButton);

  header.appendChild(coinsEl);
  header.appendChild(nav);

  const main = document.createElement('main');
  main.className = 'sb-content sb-skilltree';

  // Center a wrapper that contains the main skill and its tooltip.
  const skillWrapper = document.createElement('div');
  skillWrapper.className = 'sb-skill-wrapper';

  const coreSkill = document.createElement('div');
  coreSkill.className = 'sb-skill-node';

  const coreIcon = document.createElement('img');
  coreIcon.alt = 'Main Skill';
  coreIcon.className = 'sb-skill-icon';
  // Default icon until we load from backend.
  coreIcon.src = './assets/img/player_projectile.png';

  coreSkill.appendChild(coreIcon);

  skillWrapper.appendChild(coreSkill);

  main.appendChild(skillWrapper);

  root.appendChild(header);
  root.appendChild(main);

  container.innerHTML = '';
  container.appendChild(root);

  // Tooltip for the core skill.
  const tooltip = document.createElement('div');
  tooltip.className = 'sb-skill-tooltip sb-skill-tooltip--hidden';
  tooltip.innerHTML = '';

  skillWrapper.appendChild(tooltip);

  function showTooltipFor(def, level, maxLevel, anchorEl) {
    if (!def) {
      tooltip.innerHTML = '';
      return;
    }

    const name = def.name || 'Skill';
    const desc = def.description || '';
    const baseCost = Number(def.base_cost || 0);
    const costPerLevel = Number(def.cost_per_level || 0);

    const currentLevel = Number(level || 0);
    const max = Number(maxLevel || 1);
    const levelText = `${currentLevel}/${max}`;

    // Simple next-level cost preview.
    let costText = '';
    if (currentLevel < max) {
      const nextLevelIndex = currentLevel; // 0-based for formula
      const nextCost = baseCost + costPerLevel * nextLevelIndex;
      if (nextCost > 0) {
        costText = `Next level cost: ${nextCost} coins`;
      }
    }

    tooltip.innerHTML = `
      <div class="sb-skill-tooltip__header">
        <span class="sb-skill-tooltip__name">${name}</span>
        <span class="sb-skill-tooltip__level">Lv ${levelText}</span>
      </div>
      <div class="sb-skill-tooltip__cost">${costText}</div>
      <div class="sb-skill-tooltip__desc">${desc}</div>
    `;
    // Position tooltip next to the hovered skill node if provided.
    if (anchorEl && typeof anchorEl.getBoundingClientRect === 'function') {
      const wrapperRect = skillWrapper.getBoundingClientRect();
      const nodeRect = anchorEl.getBoundingClientRect();

      const centerY = nodeRect.top + nodeRect.height / 2;
      const offsetX = nodeRect.right - wrapperRect.left + 10; // 10px gap to the right

      tooltip.style.left = `${offsetX}px`;
      tooltip.style.top = `${centerY - wrapperRect.top}px`;
      tooltip.style.transform = 'translateY(-50%)';
    }
    tooltip.classList.remove('sb-skill-tooltip--hidden');
    tooltip.classList.add('sb-skill-tooltip--visible');
  }

  function hideTooltip() {
    tooltip.innerHTML = '';
    tooltip.classList.remove('sb-skill-tooltip--visible');
    tooltip.classList.add('sb-skill-tooltip--hidden');
  }

  function applyCoreSkillState(level, maxLevel) {
    coreSkill.classList.remove(
      'sb-skill-node--locked-unavailable',
      'sb-skill-node--locked-available',
      'sb-skill-node--unlocked',
      'sb-skill-node--max',
    );

    if (level >= maxLevel && maxLevel > 0) {
      coreSkill.classList.add('sb-skill-node--max');
    } else if (level > 0) {
      coreSkill.classList.add('sb-skill-node--unlocked');
    } else {
      // Level 0: available only if we can afford the first level.
      const baseCost = coreDef ? Number(coreDef.base_cost || 0) : 0;
      if (baseCost > 0 && availableCoins >= baseCost) {
        coreSkill.classList.add('sb-skill-node--locked-available');
      } else {
        coreSkill.classList.add('sb-skill-node--locked-unavailable');
      }
    }
  }

  function applySkillNodeState(node, skillDef) {
    if (!node || !skillDef) return;

    node.classList.remove(
      'sb-skill-node--locked-unavailable',
      'sb-skill-node--locked-available',
      'sb-skill-node--unlocked',
      'sb-skill-node--max',
    );

    const key = skillDef.key;
    const level = Number(playerSkillLevels[key] || 0);
    const max = typeof skillDef.max_level === 'number' ? skillDef.max_level : 1;

    if (level >= max && max > 0) {
      node.classList.add('sb-skill-node--max');
      return;
    }

    if (level > 0) {
      node.classList.add('sb-skill-node--unlocked');
      return;
    }

    // Level 0: decide if we can afford level 1.
    const baseCost = Number(skillDef.base_cost || 0);
    if (baseCost > 0 && availableCoins >= baseCost) {
      node.classList.add('sb-skill-node--locked-available');
    } else {
      node.classList.add('sb-skill-node--locked-unavailable');
    }
  }

  let coreLevel = 0;
  let coreMaxLevel = 1;
  let coreDef = null;
  let branchesRendered = false;
  let allSkills = [];
  let playerSkillLevels = {};
  let availableCoins = 0;

  function createDirectionalNode(skillDef, positionClass) {
    if (!skillDef) return null;

    const node = document.createElement('div');
    node.className = `sb-skill-node ${positionClass}`;

    const icon = document.createElement('img');
    icon.className = 'sb-skill-icon';
    icon.alt = skillDef.name || 'Skill';
    icon.src = skillDef.icon || './assets/img/player_projectile.png';

    node.appendChild(icon);

    // Attach tooltip handlers for this skill.
    node.addEventListener('mouseenter', () => {
      const level = playerSkillLevels[skillDef.key] || 0;
      const max = typeof skillDef.max_level === 'number' ? skillDef.max_level : 1;
      showTooltipFor(skillDef, level, max, node);
    });

    node.addEventListener('mouseleave', () => {
      hideTooltip();
    });

    // Clicking a directional node attempts to buy/level it up.
    node.addEventListener('click', () => {
      const key = skillDef.key;
      const currentLevel = Number(playerSkillLevels[key] || 0);
      const max = typeof skillDef.max_level === 'number' ? skillDef.max_level : 1;
      if (currentLevel >= max) return;

      fetch('backend/public/api.php?path=player/skills/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skillKey: key }),
      })
        .then((r) => r.json())
        .then((res) => {
          if (!res || res.error) {
            return;
          }

          const newLevel = Number(res.current_level || 0);
          playerSkillLevels[key] = newLevel;
          availableCoins = Number(res.availableCoins || availableCoins);
          coinsEl.textContent = `Coins: ${availableCoins}`;

          const hudCoinsEl = document.querySelector('.sb-gameplay-coins');
          if (hudCoinsEl) {
            hudCoinsEl.textContent = String(availableCoins);
          }

          applySkillNodeState(node, skillDef);
          // Re-evaluate core availability in case coins dropped below its cost.
          applyCoreSkillState(coreLevel, coreMaxLevel);

          if (typeof onSkillsChanged === 'function') {
            onSkillsChanged();
          }
        })
        .catch(() => {
          // Ignore network errors for now.
        });
    });

    applySkillNodeState(node, skillDef);
    return node;
  }

  function renderBranches() {
    // Once the core is unlocked at least to level 1, show the four
    // directional skills (top/bottom/left/right) around it.
    if (coreLevel <= 0 || !Array.isArray(allSkills) || branchesRendered) return;

    const fireRate = allSkills.find((s) => s.key === 'fire_rate_top');
    const coinGain = allSkills.find((s) => s.key === 'coin_gain_bottom');
    const maxHealth = allSkills.find((s) => s.key === 'max_health_left');
    const crit = allSkills.find((s) => s.key === 'crit_right');

    const topNode = createDirectionalNode(fireRate, 'sb-skill-node--top');
    const bottomNode = createDirectionalNode(coinGain, 'sb-skill-node--bottom');
    const leftNode = createDirectionalNode(maxHealth, 'sb-skill-node--left');
    const rightNode = createDirectionalNode(crit, 'sb-skill-node--right');

    if (topNode) skillWrapper.appendChild(topNode);
    if (bottomNode) skillWrapper.appendChild(bottomNode);
    if (leftNode) skillWrapper.appendChild(leftNode);
    if (rightNode) skillWrapper.appendChild(rightNode);

    branchesRendered = true;
    skillWrapper.classList.add('sb-skill-wrapper--branches');
  }

  // Fetch player coins and current level of the core skill, plus core skill definition.
  Promise.all([
    fetch('backend/public/api.php?path=player/skills').then((r) => r.json()),
    fetch('backend/public/api.php?path=skills/tree').then((r) => r.json()),
  ])
    .then(([playerState, skills]) => {
      // Cache skills for later branch rendering.
      allSkills = Array.isArray(skills) ? skills : [];

      // Prefer spendable coins if provided by backend; fallback to lifetime coins.
      const coinsRaw =
        typeof playerState.availableCoins === 'number'
          ? playerState.availableCoins
          : playerState.coins;
      const coins = Number(coinsRaw || 0);
      availableCoins = coins;
      coinsEl.textContent = `Coins: ${coins}`;

      // Keep main gameplay HUD (if present) in sync with spendable coins.
      const hudCoinsEl = document.querySelector('.sb-gameplay-coins');
      if (hudCoinsEl) {
        hudCoinsEl.textContent = String(coins);
      }

      // Find core skill definition from database.
      coreDef = Array.isArray(skills)
        ? skills.find((s) => s.key === 'core_center')
        : null;

      if (coreDef) {
        if (typeof coreDef.max_level === 'number') {
          coreMaxLevel = coreDef.max_level || 1;
        }

        if (coreDef.icon) {
          coreIcon.src = coreDef.icon;
        }

        if (coreDef.name) {
          coreIcon.alt = coreDef.name;
        }
      }

      if (Array.isArray(playerState.skills)) {
        playerSkillLevels = {};
        playerState.skills.forEach((s) => {
          playerSkillLevels[s.skillKey] = Number(s.current_level || 0);
        });

        const core = playerState.skills.find((s) => s.skillKey === 'core_center');
        if (core) {
          coreLevel = Number(core.current_level || 0);
        }
      }

      applyCoreSkillState(coreLevel, coreMaxLevel);
      renderBranches();
    })
    .catch(() => {
      coinsEl.textContent = 'Coins: ?';
      applyCoreSkillState(coreLevel, coreMaxLevel);
    });

  coreSkill.addEventListener('click', () => {
    // If already at max level, nothing to do.
    if (coreLevel >= coreMaxLevel) return;

    fetch('backend/public/api.php?path=player/skills/unlock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ skillKey: 'core_center' }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (!res || res.error) {
          return;
        }

        coreLevel = Number(res.current_level || 0);
        availableCoins = Number(res.availableCoins || availableCoins);
        coinsEl.textContent = `Coins: ${availableCoins}`;
        // Also update gameplay HUD coins to reflect spent amount.
        const hudCoinsEl = document.querySelector('.sb-gameplay-coins');
        if (hudCoinsEl) {
          hudCoinsEl.textContent = String(availableCoins);
        }
        applyCoreSkillState(coreLevel, coreMaxLevel);
        // Core just leveled up; attempt to render directional branches now.
        renderBranches();

        if (typeof onSkillsChanged === 'function') {
          onSkillsChanged();
        }
      })
      .catch(() => {
        // Ignore network errors for now.
      });
  });

  coreSkill.addEventListener('mouseenter', () => {
    showTooltipFor(coreDef, coreLevel, coreMaxLevel, coreSkill);
  });

  coreSkill.addEventListener('mouseleave', () => {
    hideTooltip();
  });
}
