// DriveZone 3D - Luxury Showroom, Garage & Customization Manager
class GarageManager {
  constructor(game) {
    this.game = game;
    this.currentCarIndex = 0;
    this.selectedCarId = 'pulse_sport';
    this.categoryFilter = 'All';

    // Player Virtual Economy & Persistence
    this.playerData = this.loadPlayerData();

    // Showroom 3D Scene setup
    this.turntableAngle = 0;
    this.isDragging = false;
    this.lastPointerX = 0;
    this.currentCar3D = null;

    this.initUI();
  }

  loadPlayerData() {
    const defaultData = {
      coins: 3500, // starting bonus coins
      unlockedCars: ['pulse_sport'],
      equippedCar: 'pulse_sport',
      customizations: {
        pulse_sport: {
          paintColor: '#0284c7',
          finish: 'metallic',
          underglow: 'off',
          spoiler: 'sport',
          rimColor: '#e2e8f0',
          upgrades: { engine: 0, turbo: 0, suspension: 0, brakes: 0, nitro: 0 }
        }
      }
    };

    try {
      const saved = localStorage.getItem('drivezone_player_save');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Object.assign(defaultData, parsed);
      }
    } catch (e) {
      console.warn("Storage load error:", e);
    }
    return defaultData;
  }

  savePlayerData() {
    try {
      localStorage.setItem('drivezone_player_save', JSON.stringify(this.playerData));
    } catch (e) {
      console.warn("Storage save error:", e);
    }
  }

  addCoins(amount, reason = '') {
    this.playerData.coins += amount;
    this.savePlayerData();
    this.updateCoinsDisplay();
    if (window.audioManager) window.audioManager.playCoinSound();
    if (reason && this.game) {
      this.game.showNotification(`+${amount} Coins: ${reason}`);
    }
  }

  updateCoinsDisplay() {
    const el = document.getElementById('player-coins-val');
    if (el) {
      el.textContent = this.playerData.coins.toLocaleString();
    }
  }

  getFilteredCars() {
    if (this.categoryFilter === 'All') return window.VEHICLE_CATALOG;
    return window.VEHICLE_CATALOG.filter(c => c.category === this.categoryFilter);
  }

  getCurrentCarSpec() {
    const cars = this.getFilteredCars();
    return cars[this.currentCarIndex] || window.VEHICLE_CATALOG[0];
  }

  initUI() {
    this.updateCoinsDisplay();

    // Category Tabs
    const tabs = document.querySelectorAll('.category-tabs .tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.categoryFilter = e.target.dataset.cat;
        this.currentCarIndex = 0;
        this.updateShowroom();
      });
    });

    // Carousel Navigation Arrows
    const prevBtn = document.getElementById('prev-car-btn');
    const nextBtn = document.getElementById('next-car-btn');
    if (prevBtn) prevBtn.addEventListener('click', () => this.navigateCar(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => this.navigateCar(1));

    // Showroom Action Buttons
    const driveBtn = document.getElementById('showroom-drive-btn');
    const buyBtn = document.getElementById('showroom-buy-btn');
    const custBtn = document.getElementById('showroom-cust-btn');

    if (driveBtn) {
      driveBtn.addEventListener('click', () => {
        const spec = this.getCurrentCarSpec();
        this.playerData.equippedCar = spec.id;
        this.savePlayerData();
        this.game.startDriving(spec.id);
      });
    }

    if (buyBtn) {
      buyBtn.addEventListener('click', () => this.buyCurrentCar());
    }

    if (custBtn) {
      custBtn.addEventListener('click', () => this.openCustomizer());
    }

    // Customizer Close
    const custClose = document.getElementById('cust-close-btn');
    if (custClose) {
      custClose.addEventListener('click', () => {
        document.getElementById('customizer-panel').style.display = 'none';
      });
    }

    this.initCustomizerEvents();
    this.initShowroomTouchOrbit();
  }

  navigateCar(direction) {
    if (window.audioManager) window.audioManager.playClick();
    const cars = this.getFilteredCars();
    this.currentCarIndex = (this.currentCarIndex + direction + cars.length) % cars.length;
    this.updateShowroom();
  }

  updateShowroom() {
    const spec = this.getCurrentCarSpec();
    const isUnlocked = this.playerData.unlockedCars.includes(spec.id);

    // Update UI Stats & Title
    document.getElementById('car-title').textContent = spec.name;
    document.getElementById('car-brand').textContent = `${spec.brand} • ${spec.category}`;
    document.getElementById('stat-speed-val').textContent = `${spec.stats.speed} km/h`;
    document.getElementById('stat-accel-val').textContent = `${spec.stats.accel}s (0-100)`;
    document.getElementById('stat-handling-val').textContent = `${spec.stats.handling}/100`;
    document.getElementById('stat-power-val').textContent = `${spec.stats.power} HP (${spec.stats.drive})`;

    document.getElementById('stat-speed-bar').style.width = `${Math.min((spec.stats.speed / 485) * 100, 100)}%`;
    document.getElementById('stat-accel-bar').style.width = `${Math.min((4.5 / spec.stats.accel) * 100, 100)}%`;
    document.getElementById('stat-handling-bar').style.width = `${spec.stats.handling}%`;

    // Action Buttons State
    const driveBtn = document.getElementById('showroom-drive-btn');
    const buyBtn = document.getElementById('showroom-buy-btn');
    const custBtn = document.getElementById('showroom-cust-btn');

    if (isUnlocked) {
      driveBtn.style.display = 'flex';
      buyBtn.style.display = 'none';
      custBtn.style.display = 'flex';
    } else {
      driveBtn.style.display = 'none';
      buyBtn.style.display = 'flex';
      custBtn.style.display = 'none';
      document.getElementById('buy-price-val').textContent = spec.price.toLocaleString();
    }

    // Update Indicator Dots
    this.renderCarIndicatorDots();

    // Rebuild 3D Showroom Car
    this.renderShowroomCar(spec);
  }

  renderCarIndicatorDots() {
    const container = document.getElementById('car-indicator-pills');
    if (!container) return;
    container.innerHTML = '';
    const cars = this.getFilteredCars();
    cars.forEach((c, idx) => {
      const dot = document.createElement('div');
      dot.className = `car-dot ${idx === this.currentCarIndex ? 'active' : ''}`;
      container.appendChild(dot);
    });
  }

  renderShowroomCar(spec) {
    if (this.currentCar3D) {
      this.game.showroomScene.remove(this.currentCar3D);
      this.currentCar3D = null;
    }

    const customization = this.playerData.customizations[spec.id] || {
      paintColor: spec.defaultColor,
      finish: 'metallic',
      underglow: 'off',
      spoiler: 'sport'
    };

    this.currentCar3D = window.VehicleBuilder.createCar(spec, customization);
    this.currentCar3D.position.set(0, 0, 0);
    this.game.showroomScene.add(this.currentCar3D);
  }

  buyCurrentCar() {
    const spec = this.getCurrentCarSpec();
    if (this.playerData.coins >= spec.price) {
      this.playerData.coins -= spec.price;
      this.playerData.unlockedCars.push(spec.id);
      if (!this.playerData.customizations[spec.id]) {
        this.playerData.customizations[spec.id] = {
          paintColor: spec.defaultColor,
          finish: 'metallic',
          underglow: 'off',
          spoiler: 'sport',
          upgrades: { engine: 0, turbo: 0, suspension: 0, brakes: 0, nitro: 0 }
        };
      }
      this.savePlayerData();
      this.updateCoinsDisplay();
      this.updateShowroom();
      if (window.audioManager) window.audioManager.playCoinSound();
      this.game.showNotification(`Unlocked ${spec.name}! Ready to drive.`);
    } else {
      const needed = spec.price - this.playerData.coins;
      this.game.showNotification(`Insufficient Coins! Need ${needed.toLocaleString()} more coins.`);
      if (window.audioManager) window.audioManager.playCrash(0.5);
    }
  }

  openCustomizer() {
    const panel = document.getElementById('customizer-panel');
    if (panel) {
      panel.style.display = 'flex';
      this.renderCustomizerUpgrades();
    }
  }

  initCustomizerEvents() {
    // Customizer Tab Switch
    const tabs = document.querySelectorAll('.cust-tab-btn');
    tabs.forEach(t => {
      t.addEventListener('click', (e) => {
        tabs.forEach(tab => tab.classList.remove('active'));
        e.target.classList.add('active');
        const view = e.target.dataset.custView;
        document.querySelectorAll('.cust-section').forEach(s => s.style.display = 'none');
        const activeSection = document.getElementById(`cust-sec-${view}`);
        if (activeSection) activeSection.style.display = 'block';
      });
    });

    // Color Swatches
    const swatches = document.querySelectorAll('.color-swatch');
    swatches.forEach(s => {
      s.addEventListener('click', (e) => {
        swatches.forEach(sw => sw.classList.remove('active'));
        e.target.classList.add('active');
        const color = e.target.dataset.color;
        this.applyCustomization('paintColor', color);
      });
    });

    // Finish Options
    document.querySelectorAll('.finish-opt').forEach(opt => {
      opt.addEventListener('click', (e) => {
        document.querySelectorAll('.finish-opt').forEach(o => o.classList.remove('active'));
        e.target.classList.add('active');
        this.applyCustomization('finish', e.target.dataset.finish);
      });
    });

    // Underglow Options
    document.querySelectorAll('.underglow-opt').forEach(opt => {
      opt.addEventListener('click', (e) => {
        document.querySelectorAll('.underglow-opt').forEach(o => o.classList.remove('active'));
        e.target.classList.add('active');
        this.applyCustomization('underglow', e.target.dataset.glow);
      });
    });

    // Spoiler Options
    document.querySelectorAll('.spoiler-opt').forEach(opt => {
      opt.addEventListener('click', (e) => {
        document.querySelectorAll('.spoiler-opt').forEach(o => o.classList.remove('active'));
        e.target.classList.add('active');
        this.applyCustomization('spoiler', e.target.dataset.spoiler);
      });
    });
  }

  applyCustomization(key, value) {
    const spec = this.getCurrentCarSpec();
    if (!this.playerData.customizations[spec.id]) {
      this.playerData.customizations[spec.id] = {
        paintColor: spec.defaultColor,
        finish: 'metallic',
        underglow: 'off',
        spoiler: 'sport',
        upgrades: { engine: 0, turbo: 0, suspension: 0, brakes: 0, nitro: 0 }
      };
    }
    this.playerData.customizations[spec.id][key] = value;
    this.savePlayerData();
    this.renderShowroomCar(spec);
    if (window.audioManager) window.audioManager.playClick();
  }

  renderCustomizerUpgrades() {
    const spec = this.getCurrentCarSpec();
    const cust = this.playerData.customizations[spec.id] || {};
    const upg = cust.upgrades || { engine: 0, turbo: 0, suspension: 0, brakes: 0, nitro: 0 };

    const upgradesContainer = document.getElementById('upgrades-list');
    if (!upgradesContainer) return;
    upgradesContainer.innerHTML = '';

    const upgradeTypes = [
      { key: 'engine', name: 'Engine ECU Stage', max: 3, price: 3000 },
      { key: 'turbo', name: 'Twin Turbocharger', max: 3, price: 4500 },
      { key: 'suspension', name: 'Sport Suspension', max: 3, price: 2000 },
      { key: 'brakes', name: 'Carbon Brakes', max: 3, price: 2500 },
      { key: 'nitro', name: 'Nitro NOS System', max: 3, price: 3500 }
    ];

    upgradeTypes.forEach(u => {
      const currentLvl = upg[u.key] || 0;
      const isMax = currentLvl >= u.max;
      const card = document.createElement('div');
      card.className = 'upgrade-card';
      card.innerHTML = `
        <div class="upgrade-info">
          <div class="upgrade-name">${u.name}</div>
          <div class="upgrade-level">Stage ${currentLvl} / ${u.max}</div>
        </div>
        <button class="upgrade-btn ${isMax ? 'disabled' : ''}">
          ${isMax ? 'MAX' : `Upgrade (${u.price} CR)`}
        </button>
      `;

      if (!isMax) {
        card.querySelector('button').addEventListener('click', () => {
          if (this.playerData.coins >= u.price) {
            this.playerData.coins -= u.price;
            upg[u.key] = currentLvl + 1;
            cust.upgrades = upg;
            this.playerData.customizations[spec.id] = cust;
            this.savePlayerData();
            this.updateCoinsDisplay();
            this.renderCustomizerUpgrades();
            if (window.audioManager) window.audioManager.playCoinSound();
            this.game.showNotification(`${u.name} Upgraded to Stage ${currentLvl + 1}!`);
          } else {
            this.game.showNotification("Not enough coins for this upgrade!");
          }
        });
      }
      upgradesContainer.appendChild(card);
    });
  }

  initShowroomTouchOrbit() {
    const canvas = this.game.renderer.domElement;
    canvas.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.lastPointerX = e.clientX;
    });

    window.addEventListener('pointermove', (e) => {
      if (this.isDragging && this.currentCar3D) {
        const deltaX = e.clientX - this.lastPointerX;
        this.currentCar3D.rotation.y += deltaX * 0.008;
        this.lastPointerX = e.clientX;
      }
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
    });
  }

  update(dt) {
    if (this.currentCar3D && !this.isDragging) {
      // Gentle turntable rotation
      this.currentCar3D.rotation.y += dt * 0.35;
    }
  }
}

window.GarageManager = GarageManager;
