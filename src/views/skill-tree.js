// Skill tree view for Space Blaster.
// For now this page only shows coins (top-left) and a back button (top-right).

import { navigateTo } from '../utils/navigation.js';

export function renderSkillTree(container, options = {}) {
  const { onClose } = options;
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
      coreSkill.classList.add('sb-skill-node--locked-available');
    }
  }

  let coreLevel = 0;
  let coreMaxLevel = 1;
  let coreDef = null;

  // Fetch player coins and current level of the core skill, plus core skill definition.
  Promise.all([
    fetch('backend/public/api.php?path=player/skills').then((r) => r.json()),
    fetch('backend/public/api.php?path=skills/tree').then((r) => r.json()),
  ])
    .then(([playerState, skills]) => {
      // Prefer spendable coins if provided by backend; fallback to lifetime coins.
      const coinsRaw =
        typeof playerState.availableCoins === 'number'
          ? playerState.availableCoins
          : playerState.coins;
      const coins = Number(coinsRaw || 0);
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
        const core = playerState.skills.find((s) => s.skillKey === 'core_center');
        if (core) {
          coreLevel = Number(core.current_level || 0);
        }
      }

      applyCoreSkillState(coreLevel, coreMaxLevel);
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
        const newCoins = Number(res.availableCoins || 0);
        coinsEl.textContent = `Coins: ${newCoins}`;
        // Also update gameplay HUD coins to reflect spent amount.
        const hudCoinsEl = document.querySelector('.sb-gameplay-coins');
        if (hudCoinsEl) {
          hudCoinsEl.textContent = String(newCoins);
        }
        applyCoreSkillState(coreLevel, coreMaxLevel);
      })
      .catch(() => {
        // Ignore network errors for now.
      });
  });

  coreSkill.addEventListener('mouseenter', () => {
    if (!coreDef) {
      tooltip.innerHTML = '';
      return;
    }

    const name = coreDef.name || 'Core Skill';
    const desc = coreDef.description || '';
    const baseCost = Number(coreDef.base_cost || 0);

    const levelText = `${coreLevel}/${coreMaxLevel}`;
    const costText = baseCost > 0 && coreLevel === 0
      ? `Cost: ${baseCost} coins`
      : '';

    // Top row: name (left) and level (right). Description below.
    tooltip.innerHTML = `
      <div class="sb-skill-tooltip__header">
        <span class="sb-skill-tooltip__name">${name}</span>
        <span class="sb-skill-tooltip__level">Lv ${levelText}</span>
      </div>
      <div class="sb-skill-tooltip__cost">${costText}</div>
      <div class="sb-skill-tooltip__desc">${desc}</div>
    `;
    tooltip.classList.remove('sb-skill-tooltip--hidden');
    tooltip.classList.add('sb-skill-tooltip--visible');
  });

  coreSkill.addEventListener('mouseleave', () => {
    tooltip.innerHTML = '';
    tooltip.classList.remove('sb-skill-tooltip--visible');
    tooltip.classList.add('sb-skill-tooltip--hidden');
  });
}
