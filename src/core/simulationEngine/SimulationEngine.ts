/**
 * Virtual IoT Lab — Simulation Engine
 *
 * Multi-domain physics, electromechanical, aerodynamic, and control solver.
 * Reads directly from AssemblyGraph (dynamic mass & inertia) and ConnectionGraph (circuit continuity).
 */

import { assemblyGraph } from '../assemblyEngine/AssemblyGraph';
import { connectionGraph } from '../connectionEngine/ConnectionGraph';

export interface FlightControlInputs {
  throttle: number; // 0.0 to 1.0
  roll: number; // -1.0 to 1.0
  pitch: number; // -1.0 to 1.0
  yaw: number; // -1.0 to 1.0
  armSwitch: boolean;
  flightMode: 'angle' | 'acro' | 'alt_hold';
}

export interface EnvironmentDomainState {
  airDensityKgM3: number; // Standard sea level: 1.225 kg/m^3
  windSpeedMps: number;
  windDirectionDeg: number; // 0 = North, 90 = East
  ambientTempC: number;
  gravityMps2: number;
}

export interface DomainTelemetry {
  simTimeSec: number;
  // Rigid Body State
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  speedMps: number;
  orientation: { rollRad: number; pitchRad: number; yawRad: number };
  angularVelocity: { roll: number; pitch: number; yaw: number };
  acceleration: { x: number; y: number; z: number };

  // Electrical Domain
  batteryVoltageV: number;
  batteryLoadedVoltageV: number;
  batteryCurrentA: number;
  batterySocPercent: number;
  batteryConsumedMah: number;
  isBatteryConnected: boolean;

  // Motor & Propeller Domains
  motorRpm: [number, number, number, number];
  motorThrustN: [number, number, number, number];
  motorCurrentA: [number, number, number, number];
  motorPresent: [boolean, boolean, boolean, boolean];
  propellerPresent: [boolean, boolean, boolean, boolean];

  // Aggregated Forces & Dynamics
  totalThrustN: number;
  totalMassKg: number;
  thrustToWeightRatio: number;
  centerOfMass: { x: number; y: number; z: number };
  isGrounded: boolean;
  armed: boolean;
}

export class SimulationEngine {
  public isRunning: boolean = true;
  public simTimeSec: number = 0;
  public timeScale: number = 1.0;

  // 6-DOF Rigid Body States
  public posX: number = 0;
  public posY: number = 0.08; // Resting on ground plane
  public posZ: number = 0;

  public velX: number = 0;
  public velY: number = 0;
  public velZ: number = 0;

  public roll: number = 0;
  public pitch: number = 0;
  public yaw: number = 0;

  public omegaRoll: number = 0;
  public omegaPitch: number = 0;
  public omegaYaw: number = 0;

  // Motor Internal State
  public motorRpm: [number, number, number, number] = [0, 0, 0, 0];
  public motorThrustN: [number, number, number, number] = [0, 0, 0, 0];
  public motorCurrentA: [number, number, number, number] = [0, 0, 0, 0];

  // Battery Internal State
  public batterySoc: number = 1.0;
  public batteryConsumedMah: number = 0;
  public batteryLoadedVoltage: number = 25.2; // 6S full

  // Environment Settings
  public env: EnvironmentDomainState = {
    airDensityKgM3: 1.225,
    windSpeedMps: 0,
    windDirectionDeg: 0,
    ambientTempC: 22,
    gravityMps2: 9.81,
  };

  // Failure Injection
  public failures = {
    motorCutout: [false, false, false, false],
    chippedProp: [false, false, false, false],
    receiverLost: false,
  };

  // Flight Control Inputs
  public inputs: FlightControlInputs = {
    throttle: 0,
    roll: 0,
    pitch: 0,
    yaw: 0,
    armSwitch: false,
    flightMode: 'angle',
  };

  private listeners: Set<() => void> = new Set();

  constructor() {
    this.resetFlightState();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public resetFlightState(height: number = 0.08) {
    this.posX = 0;
    this.posY = height;
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
    this.batterySoc = 1.0;
    this.batteryConsumedMah = 0;
    this.batteryLoadedVoltage = 25.2;
    this.simTimeSec = 0;
    this.notify();
  }

  /**
   * Primary Simulation Step (Fixed timestep, e.g. 0.005s to 0.02s)
   */
  public step(dt: number): DomainTelemetry {
    if (!this.isRunning || dt <= 0) {
      return this.getTelemetry();
    }

    const effectiveDt = Math.min(0.05, dt * this.timeScale);
    this.simTimeSec += effectiveDt;

    // 1. Fetch live physical properties from Assembly Engine
    const physicalProps = assemblyGraph.computeAggregatePhysicalProperties();
    const massKg = physicalProps.totalMassKg;
    const { Ixx, Iyy, Izz } = physicalProps.momentOfInertia;
    const com = physicalProps.centerOfMass;

    // 2. Electrical Domain: Battery State & Circuit Continuity
    const isBatConnected = connectionGraph.isBatteryPowered();
    const cellCount = 6; // CNHL 6S LiPo
    const internalResistanceTotal = 0.0084; // 8.4 mOhm total pack IR

    const nominalCellV = 3.7;
    const fullCellV = 4.2;
    const cutoffCellV = 3.3;

    const ocvPerCell =
      this.batterySoc > 0.2
        ? nominalCellV + (this.batterySoc - 0.2) * (fullCellV - nominalCellV) * 1.25
        : cutoffCellV + this.batterySoc * (nominalCellV - cutoffCellV) * 5.0;

    const batteryOcv = cellCount * ocvPerCell;

    // 3. Flight Controller & Control Domain
    const isRcConnected = connectionGraph.isRcSignalConnected() && !this.failures.receiverLost;
    let cmdThrottle = this.inputs.armSwitch && isRcConnected ? this.inputs.throttle : 0.0;
    let cmdRoll = isRcConnected ? this.inputs.roll : 0.0;
    let cmdPitch = isRcConnected ? this.inputs.pitch : 0.0;
    let cmdYaw = isRcConnected ? this.inputs.yaw : 0.0;

    // Angle mode attitude leveling PID
    const rollKp = 2.8;
    const rollKd = 0.48;
    const pitchKp = 2.8;
    const pitchKd = 0.48;
    const yawKp = 2.0;
    const yawKd = 0.35;

    const targetRoll = cmdRoll * 0.48; // Max ~28 deg tilt
    const targetPitch = cmdPitch * 0.48;
    const targetYawRate = cmdYaw * 3.0; // Rad/sec

    const rollError = targetRoll - this.roll;
    const pitchError = targetPitch - this.pitch;
    const yawRateError = targetYawRate - this.omegaYaw;

    const rollCorrection = rollError * rollKp - this.omegaRoll * rollKd;
    const pitchCorrection = pitchError * pitchKp - this.omegaPitch * pitchKd;
    const yawCorrection = yawRateError * yawKp - this.omegaYaw * yawKd;

    // True-X Motor Mixing:
    // M1: Front Right (CW)  -> -roll, +pitch, +yaw
    // M2: Front Left (CCW)  -> +roll, +pitch, -yaw
    // M3: Rear Left (CW)    -> +roll, -pitch, +yaw
    // M4: Rear Right (CCW)  -> -roll, -pitch, -yaw
    const motorCommands = [
      cmdThrottle - rollCorrection * 0.35 + pitchCorrection * 0.35 + yawCorrection * 0.25,
      cmdThrottle + rollCorrection * 0.35 + pitchCorrection * 0.35 - yawCorrection * 0.25,
      cmdThrottle + rollCorrection * 0.35 - pitchCorrection * 0.35 + yawCorrection * 0.25,
      cmdThrottle - rollCorrection * 0.35 - pitchCorrection * 0.35 - yawCorrection * 0.25,
    ];

    let totalSimCurrentA = isBatConnected ? 0.32 : 0; // Base electronics draw

    // 4. Motor & Aerodynamic Domains
    const armLengthM = 0.1125; // 225mm diagonal wheelbase / 2
    const armX = armLengthM * Math.SQRT1_2;
    const armZ = armLengthM * Math.SQRT1_2;

    let netThrustN = 0;
    let netTorqueRollNm = 0;
    let netTorquePitchNm = 0;
    let netTorqueYawNm = 0;

    const motorPresent: [boolean, boolean, boolean, boolean] = [false, false, false, false];
    const propellerPresent: [boolean, boolean, boolean, boolean] = [false, false, false, false];

    for (let i = 0; i < 4; i++) {
      const motorId = `part_motor_emax_2207_1950kv_${i + 1}`;
      const propId = `part_prop_hq_5040_${i % 2 === 0 ? 'cw' : 'ccw'}_${i + 1}`;

      const isMotorMounted = assemblyGraph.isMounted(motorId);
      const isMotorWired = connectionGraph.isMotorElectricallyConnected(i);
      const isPropMounted = assemblyGraph.isMounted(propId);
      const isPropCoupled = connectionGraph.isPropellerCoupled(i);

      motorPresent[i] = isMotorMounted;
      propellerPresent[i] = isPropMounted && isPropCoupled;

      // If motor is unmounted, electrically cut, cut out by failure, or system disarmed:
      if (!isMotorMounted || !isMotorWired || this.failures.motorCutout[i] || !this.inputs.armSwitch || !isBatConnected) {
        this.motorRpm[i] = Math.max(0, this.motorRpm[i] - 18000 * effectiveDt);
        this.motorThrustN[i] = 0;
        this.motorCurrentA[i] = 0;
        continue;
      }

      const clampedCmd = Math.max(0.06, Math.min(1.0, motorCommands[i]));
      const kv = 1950;
      const targetRpm = kv * Math.max(8, this.batteryLoadedVoltage) * clampedCmd;

      // Motor spool rate
      const spoolRate = 50000;
      if (this.motorRpm[i] < targetRpm) {
        this.motorRpm[i] = Math.min(targetRpm, this.motorRpm[i] + spoolRate * effectiveDt);
      } else {
        this.motorRpm[i] = Math.max(targetRpm, this.motorRpm[i] - spoolRate * 1.5 * effectiveDt);
      }

      // Propeller aerodynamics
      if (propellerPresent[i]) {
        const nRevPerSec = this.motorRpm[i] / 60.0;
        const diamM = 5.0 * 0.0254; // 5 inches
        const ct = 0.108;
        const cp = 0.046;

        let thrustN = ct * this.env.airDensityKgM3 * nRevPerSec ** 2 * diamM ** 4;
        if (this.failures.chippedProp[i]) {
          thrustN *= 0.55; // 45% loss from damaged blade
        }

        const aeroPowerW = cp * this.env.airDensityKgM3 * nRevPerSec ** 3 * diamM ** 5;
        const motorCurrent = (aeroPowerW / (Math.max(8, this.batteryLoadedVoltage) * 0.86)) + 0.45;

        this.motorThrustN[i] = thrustN;
        this.motorCurrentA[i] = motorCurrent;
        totalSimCurrentA += motorCurrent;

        netThrustN += thrustN;

        // Reaction torque
        const reactionTorqueNm = (cp * this.env.airDensityKgM3 * nRevPerSec ** 2 * diamM ** 5) / (2 * Math.PI);

        // Arm moment arms relative to dynamic center of mass
        const relArmX = (i === 0 || i === 3 ? armX : -armX) - com.x;
        const relArmZ = (i === 2 || i === 3 ? armZ : -armZ) - com.z;

        // Roll torque (Y-axis force arm along X):
        // Thrust on +X produces -roll; thrust on -X produces +roll
        netTorqueRollNm += thrustN * (-relArmX);

        // Pitch torque (Y-axis force arm along Z):
        // Thrust on -Z (front) produces +pitch (nose down); thrust on +Z (rear) produces -pitch (nose up)
        netTorquePitchNm += thrustN * relArmZ;

        // Yaw reaction torque (CW rotor produces +yaw reaction; CCW rotor produces -yaw reaction)
        if (i === 0 || i === 2) {
          netTorqueYawNm += reactionTorqueNm;
        } else {
          netTorqueYawNm -= reactionTorqueNm;
        }
      } else {
        // Motor mounted but NO propeller! Motor spins free, 0 thrust, minimal no-load current
        this.motorThrustN[i] = 0;
        const noLoadCurrentA = 0.42;
        this.motorCurrentA[i] = noLoadCurrentA;
        totalSimCurrentA += noLoadCurrentA;
      }
    }

    // Update battery loaded voltage (sag) and state of charge
    this.batteryLoadedVoltage = isBatConnected
      ? Math.max(cellCount * cutoffCellV, batteryOcv - totalSimCurrentA * internalResistanceTotal)
      : 0;

    const mahDrawnThisStep = (totalSimCurrentA * (effectiveDt / 3600)) * 1000;
    this.batteryConsumedMah += mahDrawnThisStep;
    const totalCapacityMah = 1100;
    this.batterySoc = Math.max(0, 1.0 - this.batteryConsumedMah / totalCapacityMah);

    // 5. Mechanical Domain: 6-DOF Rigid Body Integration
    // Convert body forces to world forces via rotation matrix
    const cosR = Math.cos(this.roll);
    const sinR = Math.sin(this.roll);
    const cosP = Math.cos(this.pitch);
    const sinP = Math.sin(this.pitch);
    const cosY = Math.cos(this.yaw);
    const sinY = Math.sin(this.yaw);

    // Up vector in world frame
    const upX = sinR * sinY + cosR * sinP * cosY;
    const upY = cosR * cosP;
    const upZ = -sinR * cosY + cosR * sinP * sinY;

    // Environmental Wind
    const windRad = (this.env.windDirectionDeg * Math.PI) / 180;
    const windX = Math.sin(windRad) * this.env.windSpeedMps;
    const windZ = Math.cos(windRad) * this.env.windSpeedMps;

    const relVelX = this.velX - windX;
    const relVelY = this.velY;
    const relVelZ = this.velZ - windZ;
    const relSpeed = Math.hypot(relVelX, relVelY, relVelZ);

    // Aerodynamic quadratic body drag
    const cdArea = 0.018; // Equivalent flat plate area
    const dragForce = 0.5 * this.env.airDensityKgM3 * cdArea * relSpeed ** 2;
    const dragX = relSpeed > 0.01 ? (-relVelX / relSpeed) * dragForce : 0;
    const dragY = relSpeed > 0.01 ? (-relVelY / relSpeed) * dragForce : 0;
    const dragZ = relSpeed > 0.01 ? (-relVelZ / relSpeed) * dragForce : 0;

    // World Accelerations
    const worldThrustX = upX * netThrustN;
    const worldThrustY = upY * netThrustN;
    const worldThrustZ = upZ * netThrustN;

    const gravityForceY = -massKg * this.env.gravityMps2;

    let accX = (worldThrustX + dragX) / massKg;
    let accY = (worldThrustY + gravityForceY + dragY) / massKg;
    let accZ = (worldThrustZ + dragZ) / massKg;

    // Ground contact constraint
    const groundLevel = 0.08;
    if (this.posY <= groundLevel) {
      this.posY = groundLevel;
      if (accY < 0) accY = 0;
      if (this.velY < 0) this.velY = 0;

      // Ground friction
      this.velX *= 0.85;
      this.velZ *= 0.85;
      this.omegaRoll *= 0.8;
      this.omegaPitch *= 0.8;
      this.omegaYaw *= 0.8;
    }

    // Angular accelerations: alpha = (Torque - omega x (I * omega)) / I
    const alphaRoll = netTorqueRollNm / Ixx;
    const alphaPitch = netTorquePitchNm / Iyy;
    const alphaYaw = netTorqueYawNm / Izz;

    this.omegaRoll += alphaRoll * effectiveDt;
    this.omegaPitch += alphaPitch * effectiveDt;
    this.omegaYaw += alphaYaw * effectiveDt;

    // Angular damping
    this.omegaRoll *= 0.985;
    this.omegaPitch *= 0.985;
    this.omegaYaw *= 0.985;

    this.roll += this.omegaRoll * effectiveDt;
    this.pitch += this.omegaPitch * effectiveDt;
    this.yaw += this.omegaYaw * effectiveDt;

    // Velocity & Position Integration
    this.velX += accX * effectiveDt;
    this.velY += accY * effectiveDt;
    this.velZ += accZ * effectiveDt;

    this.posX += this.velX * effectiveDt;
    this.posY = Math.max(groundLevel, this.posY + this.velY * effectiveDt);
    this.posZ += this.velZ * effectiveDt;

    const telem = this.getTelemetry();
    this.notify();
    return telem;
  }

  public getTelemetry(): DomainTelemetry {
    const props = assemblyGraph.computeAggregatePhysicalProperties();
    const massKg = props.totalMassKg;
    const totalThrust = this.motorThrustN.reduce((a, b) => a + b, 0);
    const weightN = massKg * this.env.gravityMps2;

    const motorPresent: [boolean, boolean, boolean, boolean] = [
      assemblyGraph.isMounted('part_motor_emax_2207_1950kv_1'),
      assemblyGraph.isMounted('part_motor_emax_2207_1950kv_2'),
      assemblyGraph.isMounted('part_motor_emax_2207_1950kv_3'),
      assemblyGraph.isMounted('part_motor_emax_2207_1950kv_4'),
    ];

    const propPresent: [boolean, boolean, boolean, boolean] = [
      assemblyGraph.isMounted('part_prop_hq_5040_cw_1') && connectionGraph.isPropellerCoupled(0),
      assemblyGraph.isMounted('part_prop_hq_5040_ccw_2') && connectionGraph.isPropellerCoupled(1),
      assemblyGraph.isMounted('part_prop_hq_5040_cw_3') && connectionGraph.isPropellerCoupled(2),
      assemblyGraph.isMounted('part_prop_hq_5040_ccw_4') && connectionGraph.isPropellerCoupled(3),
    ];

    return {
      simTimeSec: this.simTimeSec,
      position: { x: this.posX, y: this.posY, z: this.posZ },
      velocity: { x: this.velX, y: this.velY, z: this.velZ },
      speedMps: Math.hypot(this.velX, this.velY, this.velZ),
      orientation: { rollRad: this.roll, pitchRad: this.pitch, yawRad: this.yaw },
      angularVelocity: { roll: this.omegaRoll, pitch: this.omegaPitch, yaw: this.omegaYaw },
      acceleration: { x: this.velX, y: this.velY, z: this.velZ },

      batteryVoltageV: 22.2,
      batteryLoadedVoltageV: this.batteryLoadedVoltage,
      batteryCurrentA: this.motorCurrentA.reduce((a, b) => a + b, 0) + 0.32,
      batterySocPercent: this.batterySoc * 100,
      batteryConsumedMah: this.batteryConsumedMah,
      isBatteryConnected: connectionGraph.isBatteryPowered(),

      motorRpm: [...this.motorRpm],
      motorThrustN: [...this.motorThrustN],
      motorCurrentA: [...this.motorCurrentA],
      motorPresent,
      propellerPresent: propPresent,

      totalThrustN: totalThrust,
      totalMassKg: massKg,
      thrustToWeightRatio: weightN > 0 ? Number((totalThrust / weightN).toFixed(2)) : 0,
      centerOfMass: props.centerOfMass,
      isGrounded: this.posY <= 0.082,
      armed: this.inputs.armSwitch,
    };
  }
}

export const simulationEngine = new SimulationEngine();
