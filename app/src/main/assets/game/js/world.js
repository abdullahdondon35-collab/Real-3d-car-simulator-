// DriveZone 3D - Open World City & AI Traffic Environment
class CityWorld {
  constructor(scene) {
    this.scene = scene;
    this.colliders = [];
    this.trafficCars = [];
    this.trafficLights = [];
    this.speedTraps = [];
    this.parkingSpots = [];
    this.rainParticles = null;
    this.timeOfDay = 'day'; // 'day', 'sunset', 'night', 'rain'

    this.initWorld();
  }

  initWorld() {
    this.setupLighting();
    this.buildTerrainAndRoads();
    this.buildCityCenter();
    this.buildHighwayAndBridges();
    this.buildDragStrip();
    this.buildParkingLot();
    this.buildStuntRamps();
    this.buildTrafficLights();
    this.spawnAITraffic();
    this.setupRainSystem();
  }

  setupLighting() {
    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(this.ambientLight);

    // Directional Sun / Moon
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    this.sunLight.position.set(120, 180, 100);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 400;
    const d = 150;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.scene.add(this.sunLight);

    // Hemisphere sky bounce
    this.hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e293b, 0.4);
    this.scene.add(this.hemiLight);

    // Sky background
    this.scene.background = new THREE.Color(0x38bdf8);
    this.scene.fog = new THREE.FogExp2(0x38bdf8, 0.0018);
  }

  setTimeOfDay(time) {
    this.timeOfDay = time;
    if (time === 'day') {
      this.scene.background.setHex(0x38bdf8);
      this.scene.fog.color.setHex(0x38bdf8);
      this.scene.fog.density = 0.0015;
      this.ambientLight.intensity = 0.65;
      this.ambientLight.color.setHex(0xffffff);
      this.sunLight.intensity = 1.2;
      this.sunLight.color.setHex(0xfffaed);
      this.sunLight.position.set(120, 180, 100);
      if (this.rainParticles) this.rainParticles.visible = false;
    } else if (time === 'sunset') {
      this.scene.background.setHex(0xf97316);
      this.scene.fog.color.setHex(0xf97316);
      this.scene.fog.density = 0.0022;
      this.ambientLight.intensity = 0.45;
      this.ambientLight.color.setHex(0xfed7aa);
      this.sunLight.intensity = 1.0;
      this.sunLight.color.setHex(0xfb923c);
      this.sunLight.position.set(220, 40, 50);
      if (this.rainParticles) this.rainParticles.visible = false;
    } else if (time === 'night') {
      this.scene.background.setHex(0x020617);
      this.scene.fog.color.setHex(0x020617);
      this.scene.fog.density = 0.003;
      this.ambientLight.intensity = 0.18;
      this.ambientLight.color.setHex(0x38bdf8);
      this.sunLight.intensity = 0.25;
      this.sunLight.color.setHex(0x93c5fd);
      this.sunLight.position.set(-80, 120, -50);
      if (this.rainParticles) this.rainParticles.visible = false;
    } else if (time === 'rain') {
      this.scene.background.setHex(0x1e293b);
      this.scene.fog.color.setHex(0x1e293b);
      this.scene.fog.density = 0.004;
      this.ambientLight.intensity = 0.35;
      this.ambientLight.color.setHex(0x94a3b8);
      this.sunLight.intensity = 0.4;
      if (this.rainParticles) this.rainParticles.visible = true;
    }
  }

  buildTerrainAndRoads() {
    // Ground Base
    const groundGeo = new THREE.PlaneGeometry(1200, 1200);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x166534, // lush green grass
      roughness: 0.9,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Asphalt Main Roads Material
    this.asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.65,
      metalness: 0.15
    });

    const markingMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 }); // yellow center lines
    const whiteLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); // white edge lines

    // City Grid Roads (Avenue X & Avenue Z)
    const roadWidth = 24;
    const roadLength = 900;

    // Cross Avenues
    const coords = [-240, -120, 0, 120, 240];
    for (const pos of coords) {
      // East-West Roads (along X)
      const roadXGeo = new THREE.PlaneGeometry(roadLength, roadWidth);
      const roadX = new THREE.Mesh(roadXGeo, this.asphaltMat);
      roadX.rotation.x = -Math.PI / 2;
      roadX.position.set(0, 0.02, pos);
      roadX.receiveShadow = true;
      this.scene.add(roadX);

      // North-South Roads (along Z)
      const roadZGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
      const roadZ = new THREE.Mesh(roadZGeo, this.asphaltMat);
      roadZ.rotation.x = -Math.PI / 2;
      roadZ.position.set(pos, 0.02, 0);
      roadZ.receiveShadow = true;
      this.scene.add(roadZ);

      // Yellow Center Dashed Lines
      const dashGeo = new THREE.PlaneGeometry(6, 0.6);
      for (let d = -400; d <= 400; d += 16) {
        const dashX = new THREE.Mesh(dashGeo, markingMat);
        dashX.rotation.x = -Math.PI / 2;
        dashX.position.set(d, 0.04, pos);
        this.scene.add(dashX);

        const dashZ = new THREE.Mesh(dashGeo, markingMat);
        dashZ.rotation.x = -Math.PI / 2;
        dashZ.rotation.z = Math.PI / 2;
        dashZ.position.set(pos, 0.04, d);
        this.scene.add(dashZ);
      }
    }
  }

  buildCityCenter() {
    // High-rise Skyscrapers
    const buildingColors = [0x0f172a, 0x1e293b, 0x334155, 0x0284c7, 0x475569];

    // City blocks inside the road grid
    const blockCenters = [
      { x: -60, z: -60 }, { x: 60, z: -60 },
      { x: -60, z: 60 }, { x: 60, z: 60 },
      { x: -180, z: -60 }, { x: 180, z: -60 },
      { x: -180, z: 60 }, { x: 180, z: 60 }
    ];

    for (const block of blockCenters) {
      // 4 Skyscrapers per block
      const offsets = [
        { dx: -24, dz: -24 }, { dx: 24, dz: -24 },
        { dx: -24, dz: 24 }, { dx: 24, dz: 24 }
      ];

      for (const off of offsets) {
        const bx = block.x + off.dx;
        const bz = block.z + off.dz;
        const width = 34;
        const depth = 34;
        const height = 45 + Math.random() * 85;

        const bGeo = new THREE.BoxGeometry(width, height, depth);
        const bMat = new THREE.MeshStandardMaterial({
          color: buildingColors[Math.floor(Math.random() * buildingColors.length)],
          roughness: 0.25,
          metalness: 0.75
        });
        const building = new THREE.Mesh(bGeo, bMat);
        building.position.set(bx, height / 2, bz);
        building.castShadow = true;
        building.receiveShadow = true;
        this.scene.add(building);

        // Add to colliders
        this.colliders.push({
          isBox: true,
          min: new THREE.Vector3(bx - width / 2, 0, bz - depth / 2),
          max: new THREE.Vector3(bx + width / 2, height, bz + depth / 2)
        });

        // Glowing Windows / Roof Antennas
        const roofGeo = new THREE.BoxGeometry(width * 0.8, 4, depth * 0.8);
        const roof = new THREE.Mesh(roofGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        roof.position.set(bx, height + 2, bz);
        this.scene.add(roof);
      }
    }
  }

  buildHighwayAndBridges() {
    // Elevated Highway Overpass
    const hwWidth = 26;
    const hwLength = 700;
    const hwY = 8;

    const hwGeo = new THREE.BoxGeometry(hwWidth, 1.2, hwLength);
    const hwMesh = new THREE.Mesh(hwGeo, this.asphaltMat);
    hwMesh.position.set(360, hwY, 0);
    hwMesh.receiveShadow = true;
    hwMesh.castShadow = true;
    this.scene.add(hwMesh);

    // Highway Ramps (Incline up and down)
    const rampLength = 90;
    const rampGeo = new THREE.BoxGeometry(hwWidth, 1.0, rampLength);

    const rampNorth = new THREE.Mesh(rampGeo, this.asphaltMat);
    rampNorth.position.set(360, hwY / 2, -350 - rampLength / 2);
    rampNorth.rotation.x = -Math.atan2(hwY, rampLength);
    this.scene.add(rampNorth);

    const rampSouth = new THREE.Mesh(rampGeo, this.asphaltMat);
    rampSouth.position.set(360, hwY / 2, 350 + rampLength / 2);
    rampSouth.rotation.x = Math.atan2(hwY, rampLength);
    this.scene.add(rampSouth);

    // Highway Guardrails
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const railLeft = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, hwLength), railMat);
    railLeft.position.set(360 + hwWidth / 2 - 0.3, hwY + 1.2, 0);
    this.scene.add(railLeft);

    const railRight = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, hwLength), railMat);
    railRight.position.set(360 - hwWidth / 2 + 0.3, hwY + 1.2, 0);
    this.scene.add(railRight);

    // Highway Pillars
    for (let pz = -300; pz <= 300; pz += 60) {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 1.6, hwY, 16),
        new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8 })
      );
      pillar.position.set(360, hwY / 2, pz);
      pillar.castShadow = true;
      this.scene.add(pillar);

      this.colliders.push({
        isBox: true,
        min: new THREE.Vector3(360 - 2, 0, pz - 2),
        max: new THREE.Vector3(360 + 2, hwY, pz + 2)
      });
    }

    // Speed Trap on the Highway
    this.speedTraps.push({
      position: new THREE.Vector3(360, hwY, 0),
      radius: 18,
      targetSpeed: 280, // km/h
      reward: 2500,
      name: 'Skyway Radar Camera'
    });
  }

  buildDragStrip() {
    // 1-Mile Airport Drag Strip
    const stripWidth = 36;
    const stripLength = 800;
    const stripX = -360;

    const stripMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(stripWidth, stripLength),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.1 })
    );
    stripMesh.rotation.x = -Math.PI / 2;
    stripMesh.position.set(stripX, 0.03, 0);
    this.scene.add(stripMesh);

    // Start / Finish Line Checks
    const lineGeo = new THREE.PlaneGeometry(stripWidth, 2);
    const startLine = new THREE.Mesh(lineGeo, new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    startLine.rotation.x = -Math.PI / 2;
    startLine.position.set(stripX, 0.05, 360);
    this.scene.add(startLine);

    const finishLine = new THREE.Mesh(lineGeo, new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    finishLine.rotation.x = -Math.PI / 2;
    finishLine.position.set(stripX, 0.05, -360);
    this.scene.add(finishLine);

    // Speed Trap on Drag Strip
    this.speedTraps.push({
      position: new THREE.Vector3(stripX, 0, -360),
      radius: 20,
      targetSpeed: 320,
      reward: 3500,
      name: 'Runway Speed Trap'
    });
  }

  buildParkingLot() {
    // Precision Parking Challenge Zone
    const plWidth = 80;
    const plLength = 80;
    const plX = -180;
    const plZ = -180;

    const lotMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(plWidth, plLength),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
    );
    lotMesh.rotation.x = -Math.PI / 2;
    lotMesh.position.set(plX, 0.03, plZ);
    this.scene.add(lotMesh);

    // Parking Bays
    const bayMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i < 4; i++) {
      const zOffset = plZ - 25 + i * 16;
      const bay = {
        id: i + 1,
        position: new THREE.Vector3(plX, 0, zOffset),
        size: { width: 4.5, length: 7.5 },
        completed: false
      };
      this.parkingSpots.push(bay);

      // Bay outline
      const outline = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 7.5), new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true }));
      outline.rotation.x = -Math.PI / 2;
      outline.position.set(plX, 0.06, zOffset);
      this.scene.add(outline);
    }
  }

  buildStuntRamps() {
    // High Stunt Ramp in open area
    const rampGeo = new THREE.BoxGeometry(16, 1.2, 35);
    const rampMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
    const ramp = new THREE.Mesh(rampGeo, rampMat);
    ramp.position.set(180, 4.5, 200);
    ramp.rotation.x = -0.3; // 17 degrees incline
    this.scene.add(ramp);

    // Support pillars
    const sup = new THREE.Mesh(new THREE.BoxGeometry(16, 9, 2), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    sup.position.set(180, 4.5, 215);
    this.scene.add(sup);
  }

  buildTrafficLights() {
    const intersections = [
      { x: 0, z: 0 },
      { x: 120, z: 0 },
      { x: -120, z: 0 },
      { x: 0, z: 120 },
      { x: 0, z: -120 }
    ];

    for (const inter of intersections) {
      const tl = {
        position: new THREE.Vector3(inter.x + 14, 0, inter.z + 14),
        state: 'green',
        timer: 0
      };

      // Pole
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 7, 8), new THREE.MeshStandardMaterial({ color: 0x334155 }));
      pole.position.set(inter.x + 13, 3.5, inter.z + 13);
      this.scene.add(pole);

      // Light housing
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.2, 0.8), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
      box.position.set(inter.x + 13, 6.5, inter.z + 13);
      this.scene.add(box);

      // Light bulb
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), new THREE.MeshBasicMaterial({ color: 0x10b981 }));
      bulb.position.set(inter.x + 13, 6.2, inter.z + 13.45);
      this.scene.add(bulb);
      tl.bulb = bulb;

      this.trafficLights.push(tl);
    }
  }

  spawnAITraffic() {
    // Generate AI vehicles on road lanes
    const colors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x64748b, 0xffffff];
    const lanePositions = [-120, 0, 120, 240];

    for (let i = 0; i < 16; i++) {
      const carGroup = new THREE.Group();
      const carMat = new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        metalness: 0.7,
        roughness: 0.3
      });

      // Simple low-poly car for AI performance
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.1, 4.4), carMat);
      body.position.y = 0.75;
      carGroup.add(body);

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 2.2), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 }));
      cabin.position.set(0, 1.5, -0.2);
      carGroup.add(cabin);

      // Lights
      const hl = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 0.1), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      hl.position.set(0, 0.75, 2.22);
      carGroup.add(hl);

      const tl = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 0.1), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
      tl.position.set(0, 0.75, -2.22);
      carGroup.add(tl);

      // Initial placement along random avenues
      const isNorthSouth = Math.random() > 0.5;
      const lane = lanePositions[Math.floor(Math.random() * lanePositions.length)];
      const laneOffset = (Math.random() > 0.5 ? 6 : -6);

      let px, pz, dir;
      if (isNorthSouth) {
        px = lane + laneOffset;
        pz = (Math.random() - 0.5) * 600;
        dir = laneOffset > 0 ? 1 : -1;
        carGroup.rotation.y = dir > 0 ? 0 : Math.PI;
      } else {
        px = (Math.random() - 0.5) * 600;
        pz = lane + laneOffset;
        dir = laneOffset > 0 ? 1 : -1;
        carGroup.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      }

      carGroup.position.set(px, 0, pz);
      this.scene.add(carGroup);

      this.trafficCars.push({
        mesh: carGroup,
        speed: 12 + Math.random() * 8, // ~50 km/h
        isNorthSouth: isNorthSouth,
        dir: dir,
        lane: lane,
        laneOffset: laneOffset
      });
    }
  }

  setupRainSystem() {
    const rainCount = 1800;
    const rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = Math.random() * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.18,
      transparent: true,
      opacity: 0.65
    });

    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }

  update(dt, playerPos) {
    // 1. Update AI Traffic Movement
    for (const car of this.trafficCars) {
      if (car.isNorthSouth) {
        car.mesh.position.z += car.speed * car.dir * dt;
        if (car.mesh.position.z > 400) car.mesh.position.z = -400;
        if (car.mesh.position.z < -400) car.mesh.position.z = 400;
      } else {
        car.mesh.position.x += car.speed * car.dir * dt;
        if (car.mesh.position.x > 400) car.mesh.position.x = -400;
        if (car.mesh.position.x < -400) car.mesh.position.x = 400;
      }
    }

    // 2. Update Traffic Lights Cycles
    for (const tl of this.trafficLights) {
      tl.timer += dt;
      if (tl.timer > 10) {
        tl.timer = 0;
        tl.state = tl.state === 'green' ? 'red' : 'green';
        tl.bulb.material.color.setHex(tl.state === 'green' ? 0x10b981 : 0xef4444);
      }
    }

    // 3. Update Rain Particle Follow
    if (this.rainParticles && this.rainParticles.visible && playerPos) {
      this.rainParticles.position.x = playerPos.x;
      this.rainParticles.position.z = playerPos.z;

      const pos = this.rainParticles.geometry.attributes.position.array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] -= 35 * dt;
        if (pos[i] < 0) pos[i] = 45;
      }
      this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }
  }
}

window.CityWorld = CityWorld;
