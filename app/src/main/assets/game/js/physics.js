// DriveZone 3D - Realistic Vehicle Physics Engine
class CarPhysics {
  constructor(spec, customization = {}) {
    this.spec = spec;
    this.customization = customization;

    // Upgrades modifiers
    const upgrades = customization.upgrades || { engine: 0, turbo: 0, suspension: 0, brakes: 0, nitro: 0 };
    const powerBonus = 1.0 + (upgrades.engine * 0.12) + (upgrades.turbo * 0.15);
    const gripBonus = 1.0 + (upgrades.suspension * 0.1);
    const brakeBonus = 1.0 + (upgrades.brakes * 0.15);

    this.maxSpeed = (spec.stats.speed * 0.27778) * (1.0 + upgrades.engine * 0.05); // convert km/h to m/s
    this.basePower = spec.stats.power * powerBonus;
    this.mass = 1450; // kg
    this.grip = (spec.stats.handling / 100) * 1.25 * gripBonus;
    this.brakeForce = (spec.stats.braking / 100) * 32 * brakeBonus;

    // Dynamic State
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.heading = 0; // radians around Y
    this.speed = 0; // scalar m/s
    this.forwardSpeed = 0;
    this.sideSpeed = 0;

    // Steering & Controls
    this.steerAngle = 0; // radians
    this.targetSteer = 0;
    this.throttle = 0; // 0 to 1
    this.brake = 0; // 0 to 1
    this.handbrake = false;
    this.isReversing = false;

    // Transmission & Drivetrain
    this.gear = 1; // 1 to 6, 0 = N, -1 = R
    this.isManual = false;
    this.gearRatios = [3.82, 2.36, 1.68, 1.31, 1.00, 0.79];
    this.reverseRatio = 3.5;
    this.finalDrive = 3.44;
    this.rpm = 900;
    this.idleRpm = 850;
    this.maxRpm = 8000;
    this.shiftRpm = 6800;

    // Nitro (NOS)
    this.nitroActive = false;
    this.nitroCapacity = 100;
    this.nitroLevel = 100;
    this.hasNitro = upgrades.nitro > 0 || true; // standard equipped

    // Suspension Body Roll & Pitch
    this.pitch = 0;
    this.roll = 0;

    // Drift & Slip Telemetry
    this.slipAngle = 0;
    this.isDrifting = false;
    this.driftScore = 0;

    // Health / Damage
    this.health = 100;

    // Dimensions
    this.length = spec.dimensions.length;
    this.width = spec.dimensions.width;
  }

  update(dt, worldColliders = []) {
    if (dt > 0.1) dt = 0.1; // clamp delta time for stability

    // 1. Steering Dynamics (speed-dependent reduction)
    const speedRatio = Math.min(Math.abs(this.forwardSpeed) / (this.maxSpeed * 0.75), 1.0);
    const maxLock = THREE.MathUtils.degToRad(34 - speedRatio * 18); // tighter lock at high speeds
    const targetAngle = this.targetSteer * maxLock;
    this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, targetAngle, dt * 10);

    // 2. Nitro Handling
    let nitroMultiplier = 1.0;
    if (this.nitroActive && this.nitroLevel > 0) {
      nitroMultiplier = 1.5;
      this.nitroLevel = Math.max(this.nitroLevel - dt * 25, 0);
    } else {
      this.nitroActive = false;
      this.nitroLevel = Math.min(this.nitroLevel + dt * 4, this.nitroCapacity);
    }

    // 3. Transmission & RPM Logic
    const currentRatio = this.gear === -1 ? this.reverseRatio : (this.gearRatios[this.gear - 1] || 1.0);
    const driveRatio = currentRatio * this.finalDrive;
    const wheelRadius = 0.34;

    const currentWheelRpm = (Math.abs(this.forwardSpeed) / (wheelRadius * 2 * Math.PI)) * 60;
    const calculatedRpm = currentWheelRpm * driveRatio;
    this.rpm = THREE.MathUtils.lerp(this.rpm, Math.max(this.idleRpm, Math.min(this.maxRpm, calculatedRpm)), dt * 15);

    // Automatic Gear Shift
    if (!this.isManual) {
      if (this.isReversing) {
        this.gear = -1;
      } else {
        if (this.rpm >= this.shiftRpm && this.gear < 6) {
          this.gear++;
          if (window.audioManager) window.audioManager.playGearShift();
        } else if (this.rpm < 2200 && this.gear > 1) {
          this.gear--;
        }
      }
    }

    // 4. Engine Power & Acceleration Calculation
    let engineForce = 0;
    if (this.throttle > 0 && !this.handbrake) {
      const torqueCurve = Math.sin((this.rpm / this.maxRpm) * Math.PI) * 0.8 + 0.3;
      const baseForce = (this.basePower * 9.5) / (wheelRadius * driveRatio + 0.1);
      engineForce = baseForce * torqueCurve * this.throttle * nitroMultiplier;
    }

    // Braking Force
    let brakeForce = 0;
    if (this.brake > 0) {
      brakeForce = this.brakeForce * this.mass * this.brake;
    }
    if (this.handbrake) {
      brakeForce += this.brakeForce * this.mass * 1.5;
    }

    // Aerodynamic Drag & Rolling Resistance
    const airDragCoeff = 0.32;
    const dragForce = 0.5 * 1.225 * airDragCoeff * (this.width * 1.2) * (this.forwardSpeed * this.forwardSpeed);
    const rollingResistance = this.mass * 9.81 * 0.015;

    // Net Forward Acceleration
    let totalForwardForce = 0;
    if (this.isReversing) {
      totalForwardForce = -engineForce * 0.5 + brakeForce;
    } else {
      totalForwardForce = engineForce - (Math.sign(this.forwardSpeed) * (brakeForce + dragForce + rollingResistance));
    }

    const forwardAcc = totalForwardForce / this.mass;
    this.forwardSpeed += forwardAcc * dt;

    // Handle reverse transition
    if (this.forwardSpeed < 0.2 && this.brake > 0.5 && !this.handbrake) {
      this.isReversing = true;
    } else if (this.forwardSpeed > 0.5 && this.throttle > 0.1) {
      this.isReversing = false;
    }

    // 5. Lateral Grip & Drifting
    const forwardVec = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
    const rightVec = new THREE.Vector3(Math.cos(this.heading), 0, -Math.sin(this.heading));

    const currentVelHeading = Math.atan2(this.velocity.x, this.velocity.z);
    this.slipAngle = THREE.MathUtils.radToDeg(Math.abs(currentVelHeading - this.heading));
    if (this.slipAngle > 180) this.slipAngle = 360 - this.slipAngle;

    let effectiveGrip = this.grip;
    if (this.handbrake) {
      effectiveGrip *= 0.35; // Break rear traction easily!
    }

    this.isDrifting = (this.slipAngle > 15 && Math.abs(this.forwardSpeed) > 8);
    if (this.isDrifting) {
      this.driftScore += Math.floor(this.slipAngle * dt * 8);
    }

    // Turning moment
    const turnRadius = 2.7 / Math.tan(this.steerAngle || 0.0001);
    const yawRate = (this.forwardSpeed / turnRadius) * (this.isDrifting ? 1.4 : 1.0);
    this.heading += yawRate * dt;

    // Update Velocity Vector
    const targetVel = forwardVec.clone().multiplyScalar(this.forwardSpeed);
    this.velocity.lerp(targetVel, Math.min(dt * (effectiveGrip * 8.5), 1.0));

    // Update Position
    this.position.addScaledVector(this.velocity, dt);
    this.speed = this.velocity.length(); // m/s

    // 6. Suspension Pitch & Roll
    const targetPitch = THREE.MathUtils.clamp(-forwardAcc * 0.003, -0.06, 0.04);
    const targetRoll = THREE.MathUtils.clamp(-yawRate * this.forwardSpeed * 0.004, -0.08, 0.08);
    this.pitch = THREE.MathUtils.lerp(this.pitch, targetPitch, dt * 8);
    this.roll = THREE.MathUtils.lerp(this.roll, targetRoll, dt * 8);

    // 7. World Collisions
    this.handleWorldCollisions(worldColliders);

    // Update Audio & Haptic Telemetry
    if (window.audioManager) {
      const rpmRatio = (this.rpm - this.idleRpm) / (this.maxRpm - this.idleRpm);
      window.audioManager.updateEngine(rpmRatio, this.throttle, true);
      window.audioManager.updateTireSqueal(this.slipAngle / 40);
      window.audioManager.setNitro(this.nitroActive);
    }
  }

  handleWorldCollisions(colliders) {
    if (!colliders || colliders.length === 0) return;

    const carRadius = this.length * 0.45;
    for (const c of colliders) {
      // Box bounding check
      if (c.isBox) {
        const minX = c.min.x - carRadius;
        const maxX = c.max.x + carRadius;
        const minZ = c.min.z - carRadius;
        const maxZ = c.max.z + carRadius;

        if (this.position.x > minX && this.position.x < maxX &&
            this.position.z > minZ && this.position.z < maxZ) {
          // Resolve collision
          const pushX1 = Math.abs(this.position.x - minX);
          const pushX2 = Math.abs(this.position.x - maxX);
          const pushZ1 = Math.abs(this.position.z - minZ);
          const pushZ2 = Math.abs(this.position.z - maxZ);
          const minPush = Math.min(pushX1, pushX2, pushZ1, pushZ2);

          if (minPush === pushX1) this.position.x = minX;
          else if (minPush === pushX2) this.position.x = maxX;
          else if (minPush === pushZ1) this.position.z = minZ;
          else this.position.z = maxZ;

          // Impact response
          const impactSpeed = this.speed;
          if (impactSpeed > 4) {
            this.forwardSpeed *= -0.3;
            this.velocity.multiplyScalar(-0.3);
            this.health = Math.max(this.health - impactSpeed * 0.8, 10);

            if (window.audioManager) window.audioManager.playCrash(impactSpeed / 20);
            if (window.AndroidBridge && window.AndroidBridge.vibrate) {
              window.AndroidBridge.vibrate(Math.min(Math.floor(impactSpeed * 15), 250));
            }
          }
        }
      }
    }
  }

  getSpeedKmh() {
    return Math.floor(Math.abs(this.forwardSpeed) * 3.6);
  }

  getSpeedMph() {
    return Math.floor(Math.abs(this.forwardSpeed) * 2.23694);
  }
}

window.CarPhysics = CarPhysics;
