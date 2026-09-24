import {
  DroneConfiguration,
  EnvironmentSettings,
  FailureModes,
  FlightControlInputs,
  FlightTelemetry,
} from './droneTypes';

/**
 * Aerodynamic & Electromechanical Simulation Model
 *
 * Implements:
 * 1. Motor Electrical Model: Back-EMF, winding resistance, torque = Kt * I, RPM curve based on battery voltage.
 * 2. Propeller Aerodynamic Model: Thrust T = Ct * rho * n^2 * D^4, Power P = Cp * rho * n^3 * D^5.
 * 3. Quadcopter Motor Mixing (True-X Betaflight convention):
 *    - Motor 1 (Front Right, CW):  Throttle - Roll + Pitch + Yaw
 *    - Motor 2 (Front Left, CCW):  Throttle + Roll + Pitch - Yaw
 *    - Motor 3 (Rear Left, CW):    Throttle + Roll - Pitch + Yaw
 *    - Motor 4 (Rear Right, CCW):  Throttle - Roll - Pitch - Yaw
 * 4. 6-DOF Rigid-Body Integration: Translational + Rotational dynamics with inertia tensor.
 * 5. Battery Internal Resistance, Sag, and Coulomb Counter discharge.
 */
export class DronePhysicsEngine {
  // Rigid body state
  public posX: number = 0;
  public posY: number = 0.08; // Ground contact level
  public posZ: number = 0;

  public velX: number = 0;
  public velY: number = 0;
  public velZ: number = 0;

  // Euler orientation in radians: roll, pitch, yaw
  public roll: number = 0;
  public pitch: number = 0;
  public yaw: number = 0;

  // Angular velocities in rad/sec
  public omegaRoll: number = 0;
  public omegaPitch: number = 0;
  public omegaYaw: number = 0;

  // Motors internal state (current RPM)
  public motorRpm: [number, number, number, number] = [0, 0, 0, 0];
  public motorThrustN: [number, number, number, number] = [0, 0, 0, 0];
  public motorCurrentA: [number, number, number, number] = [0, 0, 0, 0];

  // Battery state
  public batteryCapacityDrawnMah: number = 0;
  public batterySoc: number = 1.0; // 0.0 to 1.0
  public batteryLoadedVoltage: number = 16.8;

  // Acceleration tracking
  public accX: number = 0;
  public accY: number = 0;
  public accZ: number = 0;

  // Simulation time
  public simTimeSec: number = 0;

  constructor() {
    this.resetState();
  }

  public resetState(spawnHeight: number = 0.08) {
    this.posX = 0;
    this.posY = spawnHeight;
    this.posZ = 0;
    this.velX = 0;
    this.velY = 0;
    this.velZ = 0;
    this.roll = 0;
    this.pitch = 0;
    this.yaw = 0;
    this.omegaRoll = 0;
    this.omegaPitch = 0;
    this.omegaYaw = 0;
    this.motorRpm = [0, 0, 0, 0];
    this.motorThrustN = [0, 0, 0, 0];
    this.motorCurrentA = [0, 0, 0, 0];
    this.batteryCapacityDrawnMah = 0;
    this.batterySoc = 1.0;
    this.batteryLoadedVoltage = 16.8;
    this.accX = 0;
    this.accY = 0;
    this.accZ = 0;
    this.simTimeSec = 0;
  }

  /**
   * Calculate all-up mass (AUW) in kg
   */
  public calculateTotalMassKg(config: DroneConfiguration): number {
    let massGrams = config.frame.frameMassGrams;
    // 4 motors
    config.motors.forEach((m) => (massGrams += m.massGrams));
    // 4 props
    config.propellers.forEach((p) => (massGrams += p.massGrams));
    // Battery
    massGrams += config.battery.massGrams;
    // ESC & FC
    massGrams += config.esc.massGrams;
    massGrams += config.flightController.massGrams;
    // Payloads
    config.payloads.forEach((pl) => (massGrams += pl.massGrams));

    return massGrams / 1000.0;
  }

  /**
   * Estimate Moment of Inertia for 5" quadcopter:
   * Ixx (Roll), Iyy (Pitch), Izz (Yaw) in kg*m^2
   */
  public calculateInertia(massKg: number, armLengthM: number) {
    // Quadcopter arms distributed mass approximation
    const Ixx = (1 / 12) * massKg * (2 * armLengthM) ** 2 * 0.95;
    const Iyy = (1 / 12) * massKg * (2 * armLengthM) ** 2 * 0.95;
    const Izz = Ixx + Iyy; // Perpendicular axis theorem
    return { Ixx: Math.max(0.0015, Ixx), Iyy: Math.max(0.0015, Iyy), Izz: Math.max(0.0028, Izz) };
  }

  /**
   * Primary Physics Simulation Step
   */
  public step(
    dt: number,
    inputs: FlightControlInputs,
    config: DroneConfiguration,
    env: EnvironmentSettings,
    failures: FailureModes
  ): FlightTelemetry {
    this.simTimeSec += dt;
    const massKg = this.calculateTotalMassKg(config);
    const { Ixx, Iyy, Izz } = this.calculateInertia(massKg, config.frame.armLengthMeters);

    // 1. Battery Model: Open Circuit Voltage (OCV) from SOC
    const cellCount = config.battery.cellCount;
    // Nonlinear LiPo discharge curve approximation
    const ocvPerCell =
      this.batterySoc > 0.2
        ? config.battery.cellNominalVoltage + (this.batterySoc - 0.2) * (config.battery.cellFullVoltage - config.battery.cellNominalVoltage) * 1.25
        : config.battery.cellCutoffVoltage + this.batterySoc * (config.battery.cellNominalVoltage - config.battery.cellCutoffVoltage) * 5.0;

    const batteryOcv = Math.max(cellCount * config.battery.cellCutoffVoltage, cellCount * ocvPerCell);
    const totalInternalResistance = cellCount * config.battery.internalResistanceOhmPerCell;

    // 2. Flight Controller & Motor Mixing
    // Betaflight Rate / Angle mode controller:
    // Inputs: throttle (0..1), roll (-1..1), pitch (-1..1), yaw (-1..1)
    let cmdThrottle = inputs.armSwitch ? inputs.throttle : 0.0;
    let cmdRoll = inputs.roll;
    let cmdPitch = inputs.pitch;
    let cmdYaw = inputs.yaw;

    if (failures.receiverSignalLoss) {
      // Failsafe drop
      cmdThrottle = 0;
      cmdRoll = 0;
      cmdPitch = 0;
      cmdYaw = 0;
    }

    // PID Attitude leveling stabilization
    // If not actively deflecting stick, restore towards level attitude
    const rollKp = 2.5;
    const rollKd = 0.45;
    const pitchKp = 2.5;
    const pitchKd = 0.45;
    const yawKp = 1.8;
    const yawKd = 0.3;

    const targetRoll = cmdRoll * 0.45; // Max 26 deg tilt
    const targetPitch = cmdPitch * 0.45;
    const targetYawRate = cmdYaw * 2.8; // Rad/sec

    const rollError = targetRoll - this.roll;
    const pitchError = targetPitch - this.pitch;
    const yawRateError = targetYawRate - this.omegaYaw;

    const rollCorrection = rollError * rollKp - this.omegaRoll * rollKd;
    const pitchCorrection = pitchError * pitchKp - this.omegaPitch * pitchKd;
    const yawCorrection = yawRateError * yawKp - this.omegaYaw * yawKd;

    // True-X Quad Mixing (4 motors)
    // Motor 1: Front Right (CW)  -> -roll, +pitch, +yaw
    // Motor 2: Front Left (CCW)  -> +roll, +pitch, -yaw
    // Motor 3: Rear Left (CW)    -> +roll, -pitch, +yaw
    // Motor 4: Rear Right (CCW)  -> -roll, -pitch, -yaw
    const motorCommands = [
      cmdThrottle - rollCorrection * 0.35 + pitchCorrection * 0.35 + yawCorrection * 0.25,
      cmdThrottle + rollCorrection * 0.35 + pitchCorrection * 0.35 - yawCorrection * 0.25,
      cmdThrottle + rollCorrection * 0.35 - pitchCorrection * 0.35 + yawCorrection * 0.25,
      cmdThrottle - rollCorrection * 0.35 - pitchCorrection * 0.35 - yawCorrection * 0.25,
    ];

    let totalSimCurrentA = 0.35; // Electronics base quiescent current

    // 3. Motor & Propeller Physics calculations for each of the 4 corners
    const armDistanceM = config.frame.armLengthMeters;
    // 45 degree angle for True-X: xArm = arm * sin(45), zArm = arm * cos(45)
    const armX = armDistanceM * Math.SQRT1_2;
    const armZ = armDistanceM * Math.SQRT1_2;

    let netThrustN = 0;
    let netTorqueRollNm = 0;
    let netTorquePitchNm = 0;
    let netTorqueYawNm = 0;

    for (let i = 0; i < 4; i++) {
      if (failures.motorFailure[i] || !inputs.armSwitch) {
        // Motor is disabled or off
        this.motorRpm[i] = Math.max(0, this.motorRpm[i] - 15000 * dt);
        this.motorThrustN[i] = 0;
        this.motorCurrentA[i] = 0;
        continue;
      }

      const motor = config.motors[i];
      const prop = config.propellers[i];

      // Clamp command 0.0 - 1.0 (with idle speed when armed)
      const clampedCmd = Math.max(inputs.armSwitch ? 0.06 : 0.0, Math.min(1.0, motorCommands[i]));

      // Motor target RPM = KV * V_loaded * Cmd
      // Loaded voltage accounts for internal resistance: V_load = OCV - I_tot * R_int
      const targetRpm = motor.kv * Math.max(10, this.batteryLoadedVoltage) * clampedCmd;
      const cappedTargetRpm = Math.min(motor.maxRpm, Math.min(prop.maxRpm, targetRpm));

      // Motor mechanical inertia response rate: ~180 rad/s mechanical acceleration
      const rpmChangeRate = 45000; // RPM per second spool rate
      if (this.motorRpm[i] < cappedTargetRpm) {
        this.motorRpm[i] = Math.min(cappedTargetRpm, this.motorRpm[i] + rpmChangeRate * dt);
      } else {
        this.motorRpm[i] = Math.max(cappedTargetRpm, this.motorRpm[i] - rpmChangeRate * 1.5 * dt);
      }

      const nRevPerSec = this.motorRpm[i] / 60.0;
      const diameterM = prop.diameterInches * 0.0254;

      // Thrust formula: T = Ct * rho * n^2 * D^4
      let thrustN =
        prop.thrustCoefficientCt *
        env.airDensityKgM3 *
        nRevPerSec ** 2 *
        diameterM ** 4;

      if (failures.propellerDamage[i]) {
        thrustN *= 0.55; // 45% loss from chipped blade
      }

      // Motor Electrical Current:
      // Power = Cp * rho * n^3 * D^5
      // Current I = Power / (V * efficiency) + I_idle
      const aeroPowerWatts =
        prop.powerCoefficientCp *
        env.airDensityKgM3 *
        nRevPerSec ** 3 *
        diameterM ** 5;
      const currentA = (aeroPowerWatts / (Math.max(10, this.batteryLoadedVoltage) * motor.efficiency)) + (this.motorRpm[i] > 100 ? 0.4 : 0);

      this.motorThrustN[i] = thrustN;
      this.motorCurrentA[i] = currentA;
      totalSimCurrentA += currentA;

      // Accumulate Thrust & Moments
      netThrustN += thrustN;

      // Motor positions in body frame (Y is Up, Z is Forward or Backward, X is Right)
      // Convention: M1 (Front Right), M2 (Front Left), M3 (Rear Left), M4 (Rear Right)
      // Roll torque: + for left motor thrust, - for right motor thrust
      // Pitch torque: + for rear motor thrust, - for front motor thrust
      // Yaw reaction torque: proportional to motor torque (Q = Cp * rho * n^2 * D^5 / (2*PI))
      const reactionTorqueNm = (prop.powerCoefficientCp * env.airDensityKgM3 * nRevPerSec ** 2 * diameterM ** 5) / (2 * Math.PI);

      if (i === 0) {
        // M1: Front Right (+X, -Z, CW reaction)
        netTorqueRollNm -= thrustN * armX;
        netTorquePitchNm -= thrustN * armZ;
        netTorqueYawNm += reactionTorqueNm;
      } else if (i === 1) {
        // M2: Front Left (-X, -Z, CCW reaction)
        netTorqueRollNm += thrustN * armX;
        netTorquePitchNm -= thrustN * armZ;
        netTorqueYawNm -= reactionTorqueNm;
      } else if (i === 2) {
        // M3: Rear Left (-X, +Z, CW reaction)
        netTorqueRollNm += thrustN * armX;
        netTorquePitchNm += thrustN * armZ;
        netTorqueYawNm += reactionTorqueNm;
      } else if (i === 3) {
        // M4: Rear Right (+X, +Z, CCW reaction)
        netTorqueRollNm -= thrustN * armX;
        netTorquePitchNm += thrustN * armZ;
        netTorqueYawNm -= reactionTorqueNm;
      }
    }

    // Update battery sag based on total draw
    this.batteryLoadedVoltage = Math.max(
      cellCount * 3.0,
      batteryOcv - totalSimCurrentA * totalInternalResistance
    );

    // Coulomb counter: integrate mAh consumed
    const mahConsumedThisStep = (totalSimCurrentA * 1000 * dt) / 3600.0;
    this.batteryCapacityDrawnMah += mahConsumedThisStep;
    this.batterySoc = Math.max(
      0.0,
      (config.battery.capacityMah - this.batteryCapacityDrawnMah) / config.battery.capacityMah
    );

    // 4. Rigid-Body Dynamics Integration
    // Convert body-frame thrust to world-frame forces via Euler rotations
    const sinRoll = Math.sin(this.roll);
    const cosRoll = Math.cos(this.roll);
    const sinPitch = Math.sin(this.pitch);
    const cosPitch = Math.cos(this.pitch);
    const sinYaw = Math.sin(this.yaw);
    const cosYaw = Math.cos(this.yaw);

    // Body Up vector in World coordinates:
    const upX = sinRoll * cosYaw + cosRoll * sinPitch * sinYaw;
    const upY = cosRoll * cosPitch;
    const upZ = sinRoll * sinYaw - cosRoll * sinPitch * cosYaw;

    // Forces in World Frame:
    // Thrust Force
    const thrustFx = netThrustN * upX;
    const thrustFy = netThrustN * upY;
    const thrustFz = netThrustN * upZ;

    // Aerodynamic Drag Force: F_drag = 0.5 * rho * Cd * A * v^2
    const airDragCoeff = 0.28;
    // Wind vector
    const windRad = (env.windDirectionDeg * Math.PI) / 180.0;
    const windGust = 1.0 + Math.sin(this.simTimeSec * 3.0) * env.windGustIntensity * 0.5;
    const windWorldX = Math.sin(windRad) * env.windSpeedMps * windGust;
    const windWorldZ = Math.cos(windRad) * env.windSpeedMps * windGust;

    const relVelX = this.velX - windWorldX;
    const relVelY = this.velY;
    const relVelZ = this.velZ - windWorldZ;

    const dragFx = -0.5 * env.airDensityKgM3 * airDragCoeff * 0.045 * relVelX * Math.abs(relVelX);
    const dragFy = -0.5 * env.airDensityKgM3 * airDragCoeff * 0.055 * relVelY * Math.abs(relVelY);
    const dragFz = -0.5 * env.airDensityKgM3 * airDragCoeff * 0.045 * relVelZ * Math.abs(relVelZ);

    // Gravity Force
    const gravityFy = -massKg * env.gravityMps2;

    // Total World Forces:
    const totalFx = thrustFx + dragFx;
    const totalFy = thrustFy + gravityFy + dragFy;
    const totalFz = thrustFz + dragFz;

    this.accX = totalFx / massKg;
    this.accY = totalFy / massKg;
    this.accZ = totalFz / massKg;

    // Integrate Velocities
    this.velX += this.accX * dt;
    this.velY += this.accY * dt;
    this.velZ += this.accZ * dt;

    // Integrate Positions
    this.posX += this.velX * dt;
    this.posY += this.velY * dt;
    this.posZ += this.velZ * dt;

    // Ground contact & bounce model (Ground level y = 0.08)
    const groundLevel = 0.08;
    if (this.posY <= groundLevel) {
      this.posY = groundLevel;
      if (this.velY < 0) {
        this.velY = -this.velY * 0.15; // Inelastic ground impact
      }
      // Ground friction
      this.velX *= 0.85;
      this.velZ *= 0.85;
      this.omegaRoll *= 0.8;
      this.omegaPitch *= 0.8;
      this.omegaYaw *= 0.8;
    }

    // World Boundary Enforcements
    this.posX = Math.max(env.bounds.minX, Math.min(env.bounds.maxX, this.posX));
    this.posZ = Math.max(env.bounds.minZ, Math.min(env.bounds.maxZ, this.posZ));
    this.posY = Math.min(env.bounds.maxY, this.posY);

    // 5. Angular Acceleration & Dynamics:
    // Angular Accel = Torque / Moment of Inertia - Damping
    const angularDamping = 4.2;
    const alphaRoll = (netTorqueRollNm - this.omegaRoll * angularDamping) / Ixx;
    const alphaPitch = (netTorquePitchNm - this.omegaPitch * angularDamping) / Iyy;
    const alphaYaw = (netTorqueYawNm - this.omegaYaw * angularDamping) / Izz;

    this.omegaRoll += alphaRoll * dt;
    this.omegaPitch += alphaPitch * dt;
    this.omegaYaw += alphaYaw * dt;

    this.roll += this.omegaRoll * dt;
    this.pitch += this.omegaPitch * dt;
    this.yaw += this.omegaYaw * dt;

    // Ground contact tilt limiter
    if (this.posY <= groundLevel + 0.02 && Math.abs(this.roll) + Math.abs(this.pitch) > 0.4) {
      this.roll *= 0.9;
      this.pitch *= 0.9;
    }

    // 6. Assemble Telemetry Output
    const speed = Math.hypot(this.velX, this.velY, this.velZ);
    const flightTimeRemainingMin =
      totalSimCurrentA > 0.5
        ? ((config.battery.capacityMah * this.batterySoc) / (totalSimCurrentA * 1000)) * 60.0
        : 12.0;

    return {
      timestamp: Date.now(),
      armed: inputs.armSwitch,
      flightMode: 'stabilize',
      position: { x: this.posX, y: this.posY, z: this.posZ },
      velocity: { x: this.velX, y: this.velY, z: this.velZ },
      speedMps: speed,
      verticalSpeedMps: this.velY,
      altitudeM: Math.max(0, this.posY - groundLevel),
      acceleration: { x: this.accX, y: this.accY, z: this.accZ },
      rotationEulerDeg: {
        roll: (this.roll * 180) / Math.PI,
        pitch: (this.pitch * 180) / Math.PI,
        yaw: (this.yaw * 180) / Math.PI,
      },
      angularVelocityDeg: {
        roll: (this.omegaRoll * 180) / Math.PI,
        pitch: (this.omegaPitch * 180) / Math.PI,
        yaw: (this.omegaYaw * 180) / Math.PI,
      },
      motorRpm: [...this.motorRpm],
      motorThrustN: [...this.motorThrustN],
      motorCurrentA: [...this.motorCurrentA],
      totalThrustN: netThrustN,
      totalCurrentA: totalSimCurrentA,
      batteryVoltageV: this.batteryLoadedVoltage,
      batteryCurrentA: totalSimCurrentA,
      batterySocPercent: Math.round(this.batterySoc * 100),
      batteryMahDrawn: Math.round(this.batteryCapacityDrawnMah),
      estimatedFlightTimeRemainingMin: Number(flightTimeRemainingMin.toFixed(1)),
      totalMassKg: Number(massKg.toFixed(3)),
      thrustToWeightRatio: Number((netThrustN / (massKg * env.gravityMps2)).toFixed(2)),
    };
  }
}
