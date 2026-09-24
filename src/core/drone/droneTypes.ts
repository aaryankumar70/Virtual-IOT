/**
 * Drone Hardware Types & Specification Definitions
 * Real Documented Reference: GEPRC Mark4 5" Freestyle FPV Quadcopter
 */

export interface DroneMotorSpec {
  id: string;
  name: string;
  partNumber: string;
  manufacturer: string;
  kv: number; // RPM per volt
  maxRpm: number;
  voltageMin: number;
  voltageMax: number;
  maxCurrentA: number;
  maxPowerW: number;
  maxThrustGrams: number;
  massGrams: number;
  internalResistanceOhm: number;
  torqueConstantNmPerA: number;
  statorSize: string;
  efficiency: number; // 0.0 - 1.0
}

export interface DronePropellerSpec {
  id: string;
  name: string;
  partNumber: string;
  manufacturer: string;
  diameterInches: number;
  pitchInches: number;
  blades: number;
  massGrams: number;
  material: string;
  thrustCoefficientCt: number; // Ct aerodynamic coefficient
  powerCoefficientCp: number;  // Cp power coefficient
  maxRpm: number;
}

export interface DroneBatterySpec {
  id: string;
  name: string;
  partNumber: string;
  manufacturer: string;
  cellCount: number; // e.g. 3S, 4S, 6S
  cellNominalVoltage: number; // 3.7V standard LiPo
  cellFullVoltage: number;    // 4.2V
  cellCutoffVoltage: number;  // 3.3V
  capacityMah: number;
  cRatingContinuous: number;
  cRatingBurst: number;
  massGrams: number;
  internalResistanceOhmPerCell: number;
  connectorType: string;
}

export interface DroneEscSpec {
  id: string;
  name: string;
  partNumber: string;
  manufacturer: string;
  continuousCurrentA: number;
  burstCurrentA: number;
  protocol: 'DShot300' | 'DShot600' | 'PWM' | 'DShot1200';
  inputVoltageMin: number;
  inputVoltageMax: number;
  massGrams: number;
}

export interface DroneFlightControllerSpec {
  id: string;
  name: string;
  partNumber: string;
  manufacturer: string;
  mcu: string;
  gyro: string;
  massGrams: number;
  pidFrequencyHz: number;
}

export interface DronePayloadSpec {
  id: string;
  name: string;
  type: 'camera' | 'gps' | 'vtx' | 'receiver' | 'action_cam' | 'custom';
  massGrams: number;
  currentDrawMa: number;
}

export interface DroneConfiguration {
  id: string;
  name: string;
  description: string;
  frame: {
    name: string;
    model: string;
    wheelbaseMm: number;
    frameMassGrams: number;
    armLengthMeters: number; // Center of mass to motor axis
    geometry: 'true_x' | 'deadcat' | 'wide_x';
  };
  motors: [DroneMotorSpec, DroneMotorSpec, DroneMotorSpec, DroneMotorSpec];
  propellers: [DronePropellerSpec, DronePropellerSpec, DronePropellerSpec, DronePropellerSpec];
  battery: DroneBatterySpec;
  esc: DroneEscSpec;
  flightController: DroneFlightControllerSpec;
  payloads: DronePayloadSpec[];
}

export interface FailureModes {
  motorFailure: [boolean, boolean, boolean, boolean]; // motor 0..3 forced off
  propellerDamage: [boolean, boolean, boolean, boolean]; // 40% thrust loss per damaged blade
  gpsFailure: boolean;
  receiverSignalLoss: boolean;
  batteryOverheatOrSag: boolean;
}

export interface EnvironmentSettings {
  id: 'field' | 'hangar' | 'obstacles' | 'terrain';
  name: string;
  gravityMps2: number; // Default 9.80665 m/s^2
  airDensityKgM3: number; // 1.225 kg/m^3 at sea level
  windSpeedMps: number;
  windDirectionDeg: number; // 0 = North (+Z or -Z depending on frame)
  windGustIntensity: number; // 0..1 factor
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    maxY: number;
  };
}

export interface FlightTelemetry {
  timestamp: number;
  armed: boolean;
  flightMode: 'stabilize' | 'acro' | 'altitude_hold';
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  speedMps: number;
  verticalSpeedMps: number;
  altitudeM: number;
  acceleration: { x: number; y: number; z: number };
  rotationEulerDeg: { roll: number; pitch: number; yaw: number };
  angularVelocityDeg: { roll: number; pitch: number; yaw: number };
  motorRpm: [number, number, number, number];
  motorThrustN: [number, number, number, number];
  motorCurrentA: [number, number, number, number];
  totalThrustN: number;
  totalCurrentA: number;
  batteryVoltageV: number;
  batteryCurrentA: number;
  batterySocPercent: number;
  batteryMahDrawn: number;
  estimatedFlightTimeRemainingMin: number;
  totalMassKg: number;
  thrustToWeightRatio: number;
}

export interface FlightControlInputs {
  throttle: number; // 0.0 to 1.0
  roll: number;     // -1.0 to 1.0
  pitch: number;    // -1.0 to 1.0
  yaw: number;      // -1.0 to 1.0
  armSwitch: boolean;
}

export interface FlightTelemetryRecordPoint {
  timeSec: number;
  altitude: number;
  speed: number;
  totalThrustN: number;
  batteryVoltage: number;
  currentA: number;
  motorRpm: [number, number, number, number];
  rollDeg: number;
  pitchDeg: number;
  yawDeg: number;
  throttleInput: number;
}
