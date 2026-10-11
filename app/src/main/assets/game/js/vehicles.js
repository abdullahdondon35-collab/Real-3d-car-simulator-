// DriveZone 3D - Vehicles Definition & 3D Model Procedural Builder
const VEHICLE_CATALOG = [
  {
    id: 'pulse_sport',
    name: 'Pulse Sport 2.0T',
    brand: 'Urban Sport',
    category: 'Standard',
    price: 0,
    unlocked: true,
    stats: { speed: 235, accel: 6.2, handling: 72, braking: 70, power: 240, drive: 'FWD' },
    dimensions: { length: 4.1, width: 1.82, height: 1.35, wheelBase: 2.5 },
    bodyType: 'hatchback',
    defaultColor: '#0284c7'
  },
  {
    id: 'apex_venator',
    name: 'Apex Venator V12',
    brand: 'Apex Motors',
    category: 'Supercar',
    price: 18500,
    unlocked: false,
    stats: { speed: 355, accel: 2.8, handling: 92, braking: 90, power: 770, drive: 'AWD' },
    dimensions: { length: 4.78, width: 2.05, height: 1.13, wheelBase: 2.7 },
    bodyType: 'supercar_wedge',
    defaultColor: '#f97316'
  },
  {
    id: 'scuderia_48',
    name: 'Scuderia F48 Tributo',
    brand: 'Rosso Italia',
    category: 'Supercar',
    price: 21000,
    unlocked: false,
    stats: { speed: 340, accel: 2.9, handling: 94, braking: 89, power: 720, drive: 'RWD' },
    dimensions: { length: 4.61, width: 1.98, height: 1.21, wheelBase: 2.65 },
    bodyType: 'supercar_curved',
    defaultColor: '#dc2626'
  },
  {
    id: 'mistral_w16',
    name: 'Mistral Hyper W16',
    brand: 'Molsheim Craft',
    category: 'Hypercar',
    price: 45000,
    unlocked: false,
    stats: { speed: 420, accel: 2.4, handling: 88, braking: 95, power: 1500, drive: 'AWD' },
    dimensions: { length: 4.85, width: 2.08, height: 1.18, wheelBase: 2.72 },
    bodyType: 'hypercar_horseshoe',
    defaultColor: '#1e3a8a'
  },
  {
    id: 'aero_720',
    name: 'Aero 720 LT',
    brand: 'Woking Performance',
    category: 'Supercar',
    price: 24500,
    unlocked: false,
    stats: { speed: 345, accel: 2.7, handling: 95, braking: 92, power: 755, drive: 'RWD' },
    dimensions: { length: 4.65, width: 1.95, height: 1.16, wheelBase: 2.67 },
    bodyType: 'supercar_dihedral',
    defaultColor: '#eab308'
  },
  {
    id: 'sovereign_v12',
    name: 'Sovereign Phantom V',
    brand: 'Goodwood Luxury',
    category: 'Luxury',
    price: 32000,
    unlocked: false,
    stats: { speed: 250, accel: 5.1, handling: 70, braking: 82, power: 570, drive: 'RWD' },
    dimensions: { length: 5.4, width: 2.1, height: 1.55, wheelBase: 3.2 },
    bodyType: 'luxury_pantheon',
    defaultColor: '#0f172a'
  },
  {
    id: 'stuttgart_gt63',
    name: 'Stuttgart GT63 S',
    brand: 'Affalterbach AMG',
    category: 'Luxury',
    price: 19500,
    unlocked: false,
    stats: { speed: 315, accel: 3.2, handling: 86, braking: 88, power: 630, drive: 'AWD' },
    dimensions: { length: 5.05, width: 1.95, height: 1.44, wheelBase: 2.95 },
    bodyType: 'sport_sedan',
    defaultColor: '#64748b'
  },
  {
    id: 'bavarian_m',
    name: 'Bavarian M-Power Twin',
    brand: 'Munich Works',
    category: 'Track',
    price: 17800,
    unlocked: false,
    stats: { speed: 305, accel: 3.3, handling: 89, braking: 87, power: 617, drive: 'RWD' },
    dimensions: { length: 4.8, width: 1.92, height: 1.38, wheelBase: 2.85 },
    bodyType: 'sport_sedan_m',
    defaultColor: '#10b981'
  },
  {
    id: 'weissach_911',
    name: 'Weissach 911 GT3 RS',
    brand: 'Zuffenhausen GT',
    category: 'Track',
    price: 26000,
    unlocked: false,
    stats: { speed: 320, accel: 3.0, handling: 98, braking: 96, power: 520, drive: 'RWD' },
    dimensions: { length: 4.57, width: 1.9, height: 1.28, wheelBase: 2.46 },
    bodyType: 'coupe_track',
    defaultColor: '#e11d48'
  },
  {
    id: 'kamikaze_gtr',
    name: 'Kamikaze GT-R R35',
    brand: 'Yokohama Spec',
    category: 'Track',
    price: 16500,
    unlocked: false,
    stats: { speed: 330, accel: 2.8, handling: 88, braking: 88, power: 600, drive: 'AWD' },
    dimensions: { length: 4.71, width: 1.9, height: 1.37, wheelBase: 2.78 },
    bodyType: 'supercar_wedge',
    defaultColor: '#f1f5f9'
  },
  {
    id: 'aether_jesko',
    name: 'Aether Jesko 1600hp',
    brand: 'Angelholm Mega',
    category: 'Hypercar',
    price: 60000,
    unlocked: false,
    stats: { speed: 485, accel: 2.2, handling: 96, braking: 98, power: 1600, drive: 'RWD' },
    dimensions: { length: 4.62, width: 2.03, height: 1.21, wheelBase: 2.7 },
    bodyType: 'hypercar_horseshoe',
    defaultColor: '#e0f2fe'
  }
];

class VehicleBuilder {
  static createCar(spec, customization = {}) {
    const group = new THREE.Group();
    group.name = spec.id;

    const paintColor = customization.paintColor || spec.defaultColor;
    const finish = customization.finish || 'metallic';
    let roughness = 0.2;
    let metalness = 0.85;

    if (finish === 'gloss') { roughness = 0.08; metalness = 0.4; }
    else if (finish === 'matte') { roughness = 0.65; metalness = 0.15; }
    else if (finish === 'chameleon') { roughness = 0.12; metalness = 0.95; }

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(paintColor),
      roughness: roughness,
      metalness: metalness
    });

    const carbonMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.35,
      metalness: 0.6
    });

    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.75
    });

    const interiorDarkMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.2
    });

    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.95
    });

    const headlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.9,
      roughness: 0.1
    });

    const taillightMaterial = new THREE.MeshStandardMaterial({
      color: 0xff1111,
      emissive: 0xff0000,
      emissiveIntensity: 0.7,
      roughness: 0.2
    });

    const dim = spec.dimensions;
    const halfL = dim.length / 2;
    const halfW = dim.width / 2;
    const halfH = dim.height / 2;
    const groundClearance = 0.28;

    // --- MAIN CHASSIS & BODYWORK ---
    const bodyGroup = new THREE.Group();

    // 1. Lower Body / Tub
    const lowerBodyGeo = new THREE.BoxGeometry(dim.width * 0.92, dim.height * 0.38, dim.length * 0.95);
    const lowerBodyMesh = new THREE.Mesh(lowerBodyGeo, bodyMaterial);
    lowerBodyMesh.position.y = groundClearance + (dim.height * 0.19);
    lowerBodyMesh.castShadow = true;
    lowerBodyMesh.receiveShadow = true;
    bodyGroup.add(lowerBodyMesh);

    // 2. Front Hood & Nose Shape
    let hoodLength = dim.length * 0.35;
    let hoodGeo;
    if (spec.bodyType.includes('wedge')) {
      hoodGeo = new THREE.CylinderGeometry(dim.width * 0.44, dim.width * 0.48, hoodLength, 4);
      const hood = new THREE.Mesh(hoodGeo, bodyMaterial);
      hood.rotation.y = Math.PI / 4;
      hood.rotation.x = Math.PI / 2;
      hood.position.set(0, groundClearance + dim.height * 0.22, halfL - hoodLength * 0.5);
      hood.scale.set(1, 0.4, 1);
      bodyGroup.add(hood);
    } else {
      hoodGeo = new THREE.BoxGeometry(dim.width * 0.88, dim.height * 0.18, hoodLength);
      const hood = new THREE.Mesh(hoodGeo, bodyMaterial);
      hood.position.set(0, groundClearance + dim.height * 0.28, halfL - hoodLength * 0.5);
      bodyGroup.add(hood);
    }

    // 3. Cabin & Greenhouse
    const cabinLength = dim.length * 0.45;
    const cabinWidth = dim.width * 0.78;
    const cabinHeight = dim.height * 0.52;

    const cabinGeo = new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLength);
    const cabinMesh = new THREE.Mesh(cabinGeo, glassMaterial);
    cabinMesh.position.set(0, groundClearance + dim.height * 0.38 + cabinHeight * 0.5, -dim.length * 0.03);
    cabinMesh.castShadow = true;
    bodyGroup.add(cabinMesh);

    // Roof Panel
    const roofGeo = new THREE.BoxGeometry(cabinWidth * 0.95, 0.05, cabinLength * 0.7);
    const roofMesh = new THREE.Mesh(roofGeo, carbonMaterial);
    roofMesh.position.set(0, groundClearance + dim.height * 0.38 + cabinHeight + 0.02, -dim.length * 0.03);
    bodyGroup.add(roofMesh);

    // 4. Aerodynamic Front Splitter & Rear Diffuser
    const splitterGeo = new THREE.BoxGeometry(dim.width * 0.96, 0.06, 0.4);
    const splitter = new THREE.Mesh(splitterGeo, carbonMaterial);
    splitter.position.set(0, groundClearance * 0.6, halfL - 0.15);
    bodyGroup.add(splitter);

    const diffuserGeo = new THREE.BoxGeometry(dim.width * 0.9, 0.12, 0.35);
    const diffuser = new THREE.Mesh(diffuserGeo, carbonMaterial);
    diffuser.position.set(0, groundClearance * 0.8, -halfL + 0.15);
    bodyGroup.add(diffuser);

    // 5. Headlights & Taillights
    const hlW = 0.28;
    const hlH = 0.1;
    const hlGeo = new THREE.BoxGeometry(hlW, hlH, 0.08);

    const hlLeft = new THREE.Mesh(hlGeo, headlightMaterial);
    hlLeft.position.set(halfW * 0.7, groundClearance + dim.height * 0.26, halfL - 0.04);
    bodyGroup.add(hlLeft);

    const hlRight = new THREE.Mesh(hlGeo, headlightMaterial);
    hlRight.position.set(-halfW * 0.7, groundClearance + dim.height * 0.26, halfL - 0.04);
    bodyGroup.add(hlRight);

    // Headlight SpotLights for night driving
    const spotLeft = new THREE.SpotLight(0xffffff, 2.5, 60, Math.PI / 6, 0.4, 1.2);
    spotLeft.position.set(halfW * 0.7, groundClearance + dim.height * 0.26, halfL + 0.1);
    spotLeft.target.position.set(halfW * 0.7, groundClearance, halfL + 25);
    spotLeft.castShadow = false; // keep mobile fast
    bodyGroup.add(spotLeft);
    bodyGroup.add(spotLeft.target);

    const spotRight = new THREE.SpotLight(0xffffff, 2.5, 60, Math.PI / 6, 0.4, 1.2);
    spotRight.position.set(-halfW * 0.7, groundClearance + dim.height * 0.26, halfL + 0.1);
    spotRight.target.position.set(-halfW * 0.7, groundClearance, halfL + 25);
    bodyGroup.add(spotRight);
    bodyGroup.add(spotRight.target);

    // Taillights
    const tlGeo = new THREE.BoxGeometry(hlW * 1.1, hlH * 0.8, 0.08);
    const tlLeft = new THREE.Mesh(tlGeo, taillightMaterial);
    tlLeft.position.set(halfW * 0.7, groundClearance + dim.height * 0.3, -halfL + 0.04);
    bodyGroup.add(tlLeft);

    const tlRight = new THREE.Mesh(tlGeo, taillightMaterial);
    tlRight.position.set(-halfW * 0.7, groundClearance + dim.height * 0.3, -halfL + 0.04);
    bodyGroup.add(tlRight);

    // Center Exhaust Tips
    const exhaustGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.15, 12);
    const exhaust1 = new THREE.Mesh(exhaustGeo, chromeMaterial);
    exhaust1.rotation.x = Math.PI / 2;
    exhaust1.position.set(0.08, groundClearance + 0.12, -halfL + 0.05);
    bodyGroup.add(exhaust1);

    const exhaust2 = new THREE.Mesh(exhaustGeo, chromeMaterial);
    exhaust2.rotation.x = Math.PI / 2;
    exhaust2.position.set(-0.08, groundClearance + 0.12, -halfL + 0.05);
    bodyGroup.add(exhaust2);

    // --- COCKPIT & INTERIOR ---
    const cockpitGroup = new THREE.Group();
    // Dashboard
    const dashGeo = new THREE.BoxGeometry(cabinWidth * 0.88, 0.3, 0.45);
    const dashMesh = new THREE.Mesh(dashGeo, interiorDarkMaterial);
    dashMesh.position.set(0, groundClearance + dim.height * 0.45, halfL * 0.25);
    cockpitGroup.add(dashMesh);

    // Animated Steering Wheel
    const steerPivot = new THREE.Group();
    steerPivot.position.set(cabinWidth * 0.25, groundClearance + dim.height * 0.58, halfL * 0.18);
    steerPivot.rotation.x = -Math.PI / 6;

    const rimTorus = new THREE.TorusGeometry(0.18, 0.025, 8, 20);
    const steerRim = new THREE.Mesh(rimTorus, carbonMaterial);
    steerPivot.add(steerRim);

    const hubGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.04, 12);
    const steerHub = new THREE.Mesh(hubGeo, chromeMaterial);
    steerHub.rotation.x = Math.PI / 2;
    steerPivot.add(steerHub);

    cockpitGroup.add(steerPivot);
    group.steeringWheelPivot = steerPivot;

    // Driver Seat
    const seatGeo = new THREE.BoxGeometry(0.42, 0.65, 0.45);
    const seatMesh = new THREE.Mesh(seatGeo, interiorDarkMaterial);
    seatMesh.position.set(cabinWidth * 0.25, groundClearance + dim.height * 0.45, -0.2);
    cockpitGroup.add(seatMesh);

    // Passenger Seat
    const seat2 = new THREE.Mesh(seatGeo, interiorDarkMaterial);
    seat2.position.set(-cabinWidth * 0.25, groundClearance + dim.height * 0.45, -0.2);
    cockpitGroup.add(seat2);

    // Rearview Mirror
    const mirrorGeo = new THREE.BoxGeometry(0.25, 0.08, 0.04);
    const mirrorMesh = new THREE.Mesh(mirrorGeo, chromeMaterial);
    mirrorMesh.position.set(0, groundClearance + dim.height * 0.88, halfL * 0.15);
    cockpitGroup.add(mirrorMesh);

    bodyGroup.add(cockpitGroup);

    // --- CUSTOMIZABLE SPOILER ---
    const spoilerType = customization.spoiler || 'sport';
    if (spoilerType !== 'none') {
      const spoilerGroup = new THREE.Group();
      if (spoilerType === 'gt' || spoilerType === 'hyper' || spec.category === 'Track') {
        // High carbon wing
        const wingGeo = new THREE.BoxGeometry(dim.width * 0.9, 0.04, 0.35);
        const wing = new THREE.Mesh(wingGeo, carbonMaterial);
        wing.position.set(0, groundClearance + dim.height * 0.65, -halfL + 0.3);

        const strutGeo = new THREE.BoxGeometry(0.05, 0.35, 0.08);
        const strutL = new THREE.Mesh(strutGeo, carbonMaterial);
        strutL.position.set(dim.width * 0.3, groundClearance + dim.height * 0.48, -halfL + 0.3);

        const strutR = new THREE.Mesh(strutGeo, carbonMaterial);
        strutR.position.set(-dim.width * 0.3, groundClearance + dim.height * 0.48, -halfL + 0.3);

        spoilerGroup.add(wing);
        spoilerGroup.add(strutL);
        spoilerGroup.add(strutR);
      } else {
        // Ducktail / sport lip
        const lipGeo = new THREE.BoxGeometry(dim.width * 0.8, 0.08, 0.2);
        const lip = new THREE.Mesh(lipGeo, carbonMaterial);
        lip.position.set(0, groundClearance + dim.height * 0.42, -halfL + 0.15);
        lip.rotation.x = -0.2;
        spoilerGroup.add(lip);
      }
      bodyGroup.add(spoilerGroup);
    }

    // --- NEON UNDERGLOW ---
    const underglowColor = customization.underglow || 'off';
    if (underglowColor !== 'off') {
      const glowLight = new THREE.PointLight(new THREE.Color(underglowColor), 3.0, 4.0);
      glowLight.position.set(0, 0.12, 0);
      group.add(glowLight);
      group.underglowLight = glowLight;
    }

    group.add(bodyGroup);
    group.bodyGroup = bodyGroup;
    group.bodyMaterial = bodyMaterial;
    group.headlights = [spotLeft, spotRight];
    group.taillights = [tlLeft, tlRight];

    // --- 4 WHEELS (TIRES + ALLOY RIMS + CALIPERS) ---
    const wheelRadius = 0.34;
    const wheelWidth = 0.26;
    const wheelY = wheelRadius;
    const wheelZFront = halfL - 0.75;
    const wheelZRear = -halfL + 0.75;
    const wheelX = halfW - 0.04;

    const tireMaterial = new THREE.MeshStandardMaterial({
      color: 0x171717,
      roughness: 0.85,
      metalness: 0.1
    });

    const rimMaterial = new THREE.MeshStandardMaterial({
      color: customization.rimColor ? new THREE.Color(customization.rimColor) : 0xd1d5db,
      roughness: 0.15,
      metalness: 0.95
    });

    const caliperMaterial = new THREE.MeshStandardMaterial({
      color: 0xef4444, // racing red caliper
      roughness: 0.3,
      metalness: 0.8
    });

    function createWheel(isLeft) {
      const wheelGroup = new THREE.Group();

      // Tire Outer Cylinder
      const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 24);
      const tire = new THREE.Mesh(tireGeo, tireMaterial);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wheelGroup.add(tire);

      // Alloy Rim
      const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.72, wheelRadius * 0.72, wheelWidth * 1.02, 16);
      const rim = new THREE.Mesh(rimGeo, rimMaterial);
      rim.rotation.z = Math.PI / 2;
      wheelGroup.add(rim);

      // Rim Spokes (5-spoke star)
      for (let s = 0; s < 5; s++) {
        const spokeGeo = new THREE.BoxGeometry(wheelRadius * 0.65, wheelWidth * 1.03, 0.04);
        const spoke = new THREE.Mesh(spokeGeo, rimMaterial);
        spoke.rotation.y = (s * Math.PI * 2) / 5;
        spoke.rotation.z = Math.PI / 2;
        wheelGroup.add(spoke);
      }

      // Brake Caliper
      const caliperGeo = new THREE.BoxGeometry(0.08, 0.12, 0.16);
      const caliper = new THREE.Mesh(caliperGeo, caliperMaterial);
      caliper.position.set(isLeft ? -0.06 : 0.06, 0.12, 0);
      wheelGroup.add(caliper);

      return wheelGroup;
    }

    // Front-Left
    const flWheelPivot = new THREE.Group();
    flWheelPivot.position.set(wheelX, wheelY, wheelZFront);
    const flWheel = createWheel(true);
    flWheelPivot.add(flWheel);
    group.add(flWheelPivot);

    // Front-Right
    const frWheelPivot = new THREE.Group();
    frWheelPivot.position.set(-wheelX, wheelY, wheelZFront);
    const frWheel = createWheel(false);
    frWheelPivot.add(frWheel);
    group.add(frWheelPivot);

    // Rear-Left
    const rlWheelPivot = new THREE.Group();
    rlWheelPivot.position.set(wheelX, wheelY, wheelZRear);
    const rlWheel = createWheel(true);
    rlWheelPivot.add(rlWheel);
    group.add(rlWheelPivot);

    // Rear-Right
    const rrWheelPivot = new THREE.Group();
    rrWheelPivot.position.set(-wheelX, wheelY, wheelZRear);
    const rrWheel = createWheel(false);
    rrWheelPivot.add(rrWheel);
    group.add(rrWheelPivot);

    group.wheels = {
      flPivot: flWheelPivot,
      frPivot: frWheelPivot,
      rlPivot: rlWheelPivot,
      rrPivot: rrWheelPivot,
      flWheel: flWheel,
      frWheel: frWheel,
      rlWheel: rlWheel,
      rrWheel: rrWheel
    };

    return group;
  }
}

window.VEHICLE_CATALOG = VEHICLE_CATALOG;
window.VehicleBuilder = VehicleBuilder;
