// DriveZone 3D - Master Game Loop & Controller
class DriveZoneGame {
  constructor() {
    this.mode = 'GARAGE'; // 'GARAGE' or 'DRIVING'
    this.cameraView = 'CHASE'; // 'CHASE', 'CHASE_FAR', 'COCKPIT', 'HOOD', 'CINEMATIC'
    this.steerMode = 'WHEEL'; // 'WHEEL', 'BUTTONS', 'TILT'

    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();

    // Scene & Renderer
    this.initThree();

    // Showroom Scene
    this.initShowroomScene();

    // City Driving Scene & World
    this.initDrivingScene();

    // Garage & Economy Manager
    this.garageManager = new window.GarageManager(this);

    // Controls & Touch Listeners
    this.initTouchControls();
    this.initHUDButtons();
    this.initMinimap();

    // Start in Garage Showroom
    this.garageManager.updateShowroom();

    // Start Main Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    // Hide Loading Screen
    setTimeout(() => {
      const loadEl = document.getElementById('loading-screen');
      if (loadEl) loadEl.style.display = 'none';
    }, 600);
  }

  initThree() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1500);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  initShowroomScene() {
    this.showroomScene = new THREE.Scene();
    this.showroomScene.background = new THREE.Color(0x080c14);

    // Luxury Showroom Floor
    const floorGeo = new THREE.PlaneGeometry(80, 80);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.8
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.showroomScene.add(floor);

    // Showroom Circular Turntable Pedestal
    const pedGeo = new THREE.CylinderGeometry(5.2, 5.4, 0.2, 48);
    const pedMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.25,
      metalness: 0.7
    });
    const pedestal = new THREE.Mesh(pedGeo, pedMat);
    pedestal.position.y = 0.1;
    pedestal.receiveShadow = true;
    this.showroomScene.add(pedestal);

    // Showroom Lighting
    const amb = new THREE.AmbientLight(0xffffff, 0.7);
    this.showroomScene.add(amb);

    const spot1 = new THREE.SpotLight(0x38bdf8, 3.5, 30, Math.PI / 4, 0.5);
    spot1.position.set(6, 12, 6);
    spot1.castShadow = true;
    this.showroomScene.add(spot1);

    const spot2 = new THREE.SpotLight(0xf43f5e, 2.5, 30, Math.PI / 4, 0.5);
    spot2.position.set(-6, 10, -6);
    this.showroomScene.add(spot2);

    const centerLight = new THREE.PointLight(0xffffff, 1.5, 15);
    centerLight.position.set(0, 4, 0);
    this.showroomScene.add(centerLight);
  }

  initDrivingScene() {
    this.drivingScene = new THREE.Scene();
    this.cityWorld = new window.CityWorld(this.drivingScene);
  }

  startDriving(carId) {
    if (window.audioManager) window.audioManager.init();

    this.mode = 'DRIVING';
    document.getElementById('garage-screen').style.display = 'none';
    document.getElementById('driving-hud').style.display = 'block';

    const spec = window.VEHICLE_CATALOG.find(c => c.id === carId) || window.VEHICLE_CATALOG[0];
    const cust = this.garageManager.playerData.customizations[carId] || {
      paintColor: spec.defaultColor,
      finish: 'metallic',
      underglow: 'off',
      spoiler: 'sport'
    };

    // Remove old driving car
    if (this.playerCar3D) {
      this.drivingScene.remove(this.playerCar3D);
    }

    this.playerCar3D = window.VehicleBuilder.createCar(spec, cust);
    this.playerPhysics = new window.CarPhysics(spec, cust);

    // Initial position on main boulevard
    this.playerPhysics.position.set(0, 0, 0);
    this.playerPhysics.heading = 0;
    this.drivingScene.add(this.playerCar3D);

    this.showNotification(`Driving ${spec.name}! Free Drive Active.`);
  }

  returnToGarage() {
    this.mode = 'GARAGE';
    document.getElementById('driving-hud').style.display = 'none';
    document.getElementById('garage-screen').style.display = 'flex';
    document.getElementById('pause-modal').style.display = 'none';

    if (window.audioManager) {
      window.audioManager.updateEngine(0, 0, false);
      window.audioManager.updateTireSqueal(0);
    }

    this.garageManager.updateShowroom();
  }

  initTouchControls() {
    // Steering Wheel Touch Drag
    const wheelEl = document.getElementById('steering-wheel');
    let isTouchingWheel = false;
    let wheelCenter = { x: 0, y: 0 };

    if (wheelEl) {
      const getCenter = () => {
        const rect = wheelEl.getBoundingClientRect();
        wheelCenter.x = rect.left + rect.width / 2;
        wheelCenter.y = rect.top + rect.height / 2;
      };

      wheelEl.addEventListener('pointerdown', (e) => {
        isTouchingWheel = true;
        getCenter();
        wheelEl.setPointerCapture(e.pointerId);
      });

      window.addEventListener('pointermove', (e) => {
        if (!isTouchingWheel || !this.playerPhysics) return;
        const dx = e.clientX - wheelCenter.x;
        const dy = e.clientY - wheelCenter.y;
        let angle = Math.atan2(dx, -dy); // 0 at top
        angle = THREE.MathUtils.clamp(angle, -Math.PI * 0.75, Math.PI * 0.75);

        wheelEl.style.transform = `rotate(${THREE.MathUtils.radToDeg(angle)}deg)`;
        this.playerPhysics.targetSteer = angle / (Math.PI * 0.75);
      });

      const releaseWheel = () => {
        if (!isTouchingWheel) return;
        isTouchingWheel = false;
        wheelEl.style.transform = 'rotate(0deg)';
        if (this.playerPhysics) this.playerPhysics.targetSteer = 0;
      };

      window.addEventListener('pointerup', releaseWheel);
      window.addEventListener('pointercancel', releaseWheel);
    }

    // Left/Right Button Steering
    const btnLeft = document.getElementById('btn-steer-left');
    const btnRight = document.getElementById('btn-steer-right');

    const bindHold = (btn, onStart, onEnd) => {
      if (!btn) return;
      btn.addEventListener('pointerdown', (e) => {
        btn.classList.add('pressed');
        onStart();
        if (window.audioManager) window.audioManager.ensureRunning();
      });
      const endFn = () => {
        btn.classList.remove('pressed');
        onEnd();
      };
      btn.addEventListener('pointerup', endFn);
      btn.addEventListener('pointercancel', endFn);
      btn.addEventListener('pointerleave', endFn);
    };

    bindHold(btnLeft, () => { if (this.playerPhysics) this.playerPhysics.targetSteer = -1.0; },
                       () => { if (this.playerPhysics) this.playerPhysics.targetSteer = 0; });

    bindHold(btnRight, () => { if (this.playerPhysics) this.playerPhysics.targetSteer = 1.0; },
                        () => { if (this.playerPhysics) this.playerPhysics.targetSteer = 0; });

    // Gas & Brake Pedals
    const pedalGas = document.getElementById('pedal-gas');
    const pedalBrake = document.getElementById('pedal-brake');

    bindHold(pedalGas, () => { if (this.playerPhysics) this.playerPhysics.throttle = 1.0; },
                       () => { if (this.playerPhysics) this.playerPhysics.throttle = 0; });

    bindHold(pedalBrake, () => { if (this.playerPhysics) this.playerPhysics.brake = 1.0; },
                         () => { if (this.playerPhysics) this.playerPhysics.brake = 0; });

    // Handbrake
    const btnHandbrake = document.getElementById('btn-handbrake');
    bindHold(btnHandbrake, () => { if (this.playerPhysics) this.playerPhysics.handbrake = true; },
                           () => { if (this.playerPhysics) this.playerPhysics.handbrake = false; });

    // Nitro NOS
    const btnNos = document.getElementById('btn-nos');
    bindHold(btnNos, () => { if (this.playerPhysics) this.playerPhysics.nitroActive = true; },
                     () => { if (this.playerPhysics) this.playerPhysics.nitroActive = false; });

    // Horn
    const btnHorn = document.getElementById('btn-horn');
    bindHold(btnHorn, () => { if (window.audioManager) window.audioManager.startHorn(); },
                      () => { if (window.audioManager) window.audioManager.stopHorn(); });

    // Keyboard controls for testing / desktop
    window.addEventListener('keydown', (e) => {
      if (!this.playerPhysics || this.mode !== 'DRIVING') return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.playerPhysics.throttle = 1.0;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.playerPhysics.brake = 1.0;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.playerPhysics.targetSteer = -1.0;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.playerPhysics.targetSteer = 1.0;
      if (e.key === ' ') this.playerPhysics.handbrake = true;
      if (e.key === 'Shift') this.playerPhysics.nitroActive = true;
      if (e.key === 'h' || e.key === 'H') window.audioManager.startHorn();
      if (e.key === 'c' || e.key === 'C') this.switchCamera();
    });

    window.addEventListener('keyup', (e) => {
      if (!this.playerPhysics || this.mode !== 'DRIVING') return;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.playerPhysics.throttle = 0;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.playerPhysics.brake = 0;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ||
          e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.playerPhysics.targetSteer = 0;
      if (e.key === ' ') this.playerPhysics.handbrake = false;
      if (e.key === 'Shift') this.playerPhysics.nitroActive = false;
      if (e.key === 'h' || e.key === 'H') window.audioManager.stopHorn();
    });
  }

  initHUDButtons() {
    // Camera View Toggle
    const camBtn = document.getElementById('btn-cam-switch');
    if (camBtn) camBtn.addEventListener('click', () => this.switchCamera());

    // Headlights Toggle
    const lightBtn = document.getElementById('btn-headlights');
    let lightsOn = true;
    if (lightBtn) {
      lightBtn.addEventListener('click', () => {
        lightsOn = !lightsOn;
        lightBtn.classList.toggle('active', lightsOn);
        if (this.playerCar3D && this.playerCar3D.headlights) {
          this.playerCar3D.headlights.forEach(hl => hl.visible = lightsOn);
        }
      });
    }

    // Weather / Time of Day Toggle
    const timeBtn = document.getElementById('btn-weather-switch');
    const times = ['day', 'sunset', 'night', 'rain'];
    let timeIndex = 0;
    if (timeBtn) {
      timeBtn.addEventListener('click', () => {
        timeIndex = (timeIndex + 1) % times.length;
        const t = times[timeIndex];
        this.cityWorld.setTimeOfDay(t);
        this.showNotification(`Time / Weather set to: ${t.toUpperCase()}`);
      });
    }

    // Pause Menu
    const pauseBtn = document.getElementById('btn-pause');
    const pauseModal = document.getElementById('pause-modal');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => {
        pauseModal.style.display = 'flex';
      });
    }

    const resumeBtn = document.getElementById('btn-resume');
    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => {
        pauseModal.style.display = 'none';
      });
    }

    const garageBtn = document.getElementById('btn-pause-garage');
    if (garageBtn) {
      garageBtn.addEventListener('click', () => this.returnToGarage());
    }

    const resetBtn = document.getElementById('btn-pause-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        pauseModal.style.display = 'none';
        if (this.playerPhysics) {
          this.playerPhysics.position.set(0, 0, 0);
          this.playerPhysics.velocity.set(0, 0, 0);
          this.playerPhysics.forwardSpeed = 0;
          this.playerPhysics.heading = 0;
          this.playerPhysics.health = 100;
          this.showNotification("Vehicle Reset to Start Line.");
        }
      });
    }
  }

  switchCamera() {
    const views = ['CHASE', 'CHASE_FAR', 'COCKPIT', 'HOOD', 'CINEMATIC'];
    const currIdx = views.indexOf(this.cameraView);
    this.cameraView = views[(currIdx + 1) % views.length];
    this.showNotification(`Camera: ${this.cameraView}`);
    if (window.audioManager) window.audioManager.playClick();
  }

  initMinimap() {
    this.minimapCanvas = document.getElementById('minimap-canvas');
    if (this.minimapCanvas) {
      this.minimapCtx = this.minimapCanvas.getContext('2d');
      this.minimapCanvas.width = 110;
      this.minimapCanvas.height = 110;
    }
  }

  updateMinimap() {
    if (!this.minimapCtx || !this.playerPhysics) return;
    const ctx = this.minimapCtx;
    const w = 110;
    const h = 110;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 0.14; // pixels per meter

    ctx.clearRect(0, 0, w, h);

    // Save and rotate map relative to player heading
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-this.playerPhysics.heading);

    const px = this.playerPhysics.position.x;
    const pz = this.playerPhysics.position.z;

    // Draw Road Grid
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    [-240, -120, 0, 120, 240].forEach(coord => {
      // East-West
      ctx.beginPath();
      ctx.moveTo(-200, (coord - pz) * scale);
      ctx.lineTo(200, (coord - pz) * scale);
      ctx.stroke();

      // North-South
      ctx.beginPath();
      ctx.moveTo((coord - px) * scale, -200);
      ctx.lineTo((coord - px) * scale, 200);
      ctx.stroke();
    });

    // Draw AI Traffic blips
    ctx.fillStyle = '#ef4444';
    if (this.cityWorld && this.cityWorld.trafficCars) {
      this.cityWorld.trafficCars.forEach(tc => {
        const tx = (tc.mesh.position.x - px) * scale;
        const tz = (tc.mesh.position.z - pz) * scale;
        if (Math.hypot(tx, tz) < cx) {
          ctx.beginPath();
          ctx.arc(tx, tz, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // Draw Parking Zone
    ctx.fillStyle = '#f59e0b';
    const parkX = (-180 - px) * scale;
    const parkZ = (-180 - pz) * scale;
    ctx.fillRect(parkX - 4, parkZ - 4, 8, 8);

    ctx.restore();

    // Draw Player Indicator (Always center arrow)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 6);
    ctx.lineTo(cx - 4, cy + 5);
    ctx.lineTo(cx, cy + 2);
    ctx.lineTo(cx + 4, cy + 5);
    ctx.closePath();
    ctx.fill();
  }

  showNotification(text) {
    const el = document.getElementById('notification-banner');
    if (!el) return;
    el.textContent = text;
    el.style.display = 'flex';
    clearTimeout(this.notifTimeout);
    this.notifTimeout = setTimeout(() => {
      el.style.display = 'none';
    }, 2800);
  }

  updateDriving(dt) {
    if (!this.playerPhysics || !this.playerCar3D) return;

    // 1. Update Physics
    this.playerPhysics.update(dt, this.cityWorld.colliders);

    // 2. Sync 3D Car Model Position & Orientation
    this.playerCar3D.position.copy(this.playerPhysics.position);
    this.playerCar3D.rotation.y = this.playerPhysics.heading;
    this.playerCar3D.rotation.x = this.playerPhysics.pitch;
    this.playerCar3D.rotation.z = this.playerPhysics.roll;

    // 3. Wheel Steering & Spin Animation
    const steerAngle = this.playerPhysics.steerAngle;
    if (this.playerCar3D.wheels) {
      this.playerCar3D.wheels.flPivot.rotation.y = steerAngle;
      this.playerCar3D.wheels.frPivot.rotation.y = steerAngle;

      const spinSpeed = (this.playerPhysics.forwardSpeed / 0.34) * dt;
      this.playerCar3D.wheels.flWheel.rotation.x += spinSpeed;
      this.playerCar3D.wheels.frWheel.rotation.x += spinSpeed;
      this.playerCar3D.wheels.rlWheel.rotation.x += spinSpeed;
      this.playerCar3D.wheels.rrWheel.rotation.x += spinSpeed;
    }

    // 4. Cockpit Steering Wheel Sync
    if (this.playerCar3D.steeringWheelPivot) {
      this.playerCar3D.steeringWheelPivot.rotation.z = -steerAngle * 2.8;
    }

    // 5. Taillight / Brake Light Activation
    if (this.playerCar3D.taillights) {
      const isBraking = this.playerPhysics.brake > 0.1 || this.playerPhysics.isReversing;
      const intensity = isBraking ? 1.5 : 0.4;
      this.playerCar3D.taillights.forEach(tl => {
        tl.material.emissiveIntensity = intensity;
      });
    }

    // 6. Camera Placement
    this.updateCamera(dt);

    // 7. Update City World Traffic & Environment
    this.cityWorld.update(dt, this.playerPhysics.position);

    // 8. Update HUD Telemetry
    const speedKmh = this.playerPhysics.getSpeedKmh();
    document.getElementById('hud-speed-val').textContent = speedKmh;

    const rpmRatio = (this.playerPhysics.rpm - this.playerPhysics.idleRpm) / (this.playerPhysics.maxRpm - this.playerPhysics.idleRpm);
    document.getElementById('hud-rpm-fill').style.width = `${Math.min(rpmRatio * 100, 100)}%`;

    const gearText = this.playerPhysics.gear === -1 ? 'R' : (this.playerPhysics.gear === 0 ? 'N' : `D${this.playerPhysics.gear}`);
    document.getElementById('hud-gear-val').textContent = gearText;

    document.getElementById('hud-health-fill').style.width = `${this.playerPhysics.health}%`;

    // 9. Drift Coins Accumulation
    if (this.playerPhysics.isDrifting && Math.random() < 0.1) {
      this.garageManager.addCoins(25, 'High Speed Drift!');
    }

    // 10. Check Speed Traps
    for (const trap of this.cityWorld.speedTraps) {
      const dist = this.playerPhysics.position.distanceTo(trap.position);
      if (dist < trap.radius) {
        if (!trap.triggered && speedKmh >= trap.targetSpeed) {
          trap.triggered = true;
          this.garageManager.addCoins(trap.reward, `${trap.name} Top Speed (${speedKmh} km/h)!`);
          if (window.audioManager) window.audioManager.playCoinSound();
          setTimeout(() => { trap.triggered = false; }, 8000);
        }
      }
    }

    // 11. Check Parking Spots
    for (const spot of this.cityWorld.parkingSpots) {
      const dist = this.playerPhysics.position.distanceTo(spot.position);
      if (dist < 4.0 && speedKmh < 3 && !spot.completed) {
        spot.completed = true;
        this.garageManager.addCoins(1500, `Bay #${spot.id} Parked Perfectly!`);
        this.showNotification(`PARKED! +1500 Coins Earned.`);
      }
    }

    // 12. Minimap
    this.updateMinimap();
  }

  updateCamera(dt) {
    const pos = this.playerPhysics.position;
    const heading = this.playerPhysics.heading;

    const forward = new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading));
    const up = new THREE.Vector3(0, 1, 0);

    if (this.cameraView === 'CHASE') {
      const targetCamPos = pos.clone().sub(forward.clone().multiplyScalar(6.5)).add(new THREE.Vector3(0, 2.4, 0));
      this.camera.position.lerp(targetCamPos, dt * 10);
      const lookAtTarget = pos.clone().add(new THREE.Vector3(0, 1.2, 0)).add(forward.clone().multiplyScalar(4));
      this.camera.lookAt(lookAtTarget);
      this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, this.playerPhysics.nitroActive ? 75 : 60, dt * 8);
      this.camera.updateProjectionMatrix();
    } else if (this.cameraView === 'CHASE_FAR') {
      const targetCamPos = pos.clone().sub(forward.clone().multiplyScalar(10)).add(new THREE.Vector3(0, 4.0, 0));
      this.camera.position.lerp(targetCamPos, dt * 8);
      this.camera.lookAt(pos.clone().add(new THREE.Vector3(0, 1.0, 0)));
    } else if (this.cameraView === 'COCKPIT') {
      // Driver cockpit eye point
      const cockpitOffset = new THREE.Vector3(0.32, 1.08, -0.1).applyAxisAngle(up, heading);
      this.camera.position.copy(pos).add(cockpitOffset);
      const lookTarget = this.camera.position.clone().add(forward.clone().multiplyScalar(20)).add(new THREE.Vector3(0, -0.2, 0));
      this.camera.lookAt(lookTarget);
    } else if (this.cameraView === 'HOOD') {
      const hoodOffset = forward.clone().multiplyScalar(this.playerPhysics.length * 0.45).add(new THREE.Vector3(0, 0.85, 0));
      this.camera.position.copy(pos).add(hoodOffset);
      const lookTarget = this.camera.position.clone().add(forward.clone().multiplyScalar(30));
      this.camera.lookAt(lookTarget);
    } else if (this.cameraView === 'CINEMATIC') {
      const orbitAngle = Date.now() * 0.0006;
      const camOffset = new THREE.Vector3(Math.cos(orbitAngle) * 8, 3.2, Math.sin(orbitAngle) * 8);
      this.camera.position.copy(pos).add(camOffset);
      this.camera.lookAt(pos.clone().add(new THREE.Vector3(0, 1.0, 0)));
    }
  }

  animate() {
    requestAnimationFrame(this.animate);
    const dt = this.clock.getDelta();

    if (this.mode === 'GARAGE') {
      this.garageManager.update(dt);
      // Showroom Camera framing
      this.camera.position.set(4.5, 2.2, 5.5);
      this.camera.lookAt(0, 0.8, 0);
      this.renderer.render(this.showroomScene, this.camera);
    } else if (this.mode === 'DRIVING') {
      this.updateDriving(dt);
      this.renderer.render(this.drivingScene, this.camera);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.driveZoneGame = new DriveZoneGame();
});
