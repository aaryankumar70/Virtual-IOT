/**
 * Virtual IoT Lab — Hardware Engine
 *
 * Defines the real hardware entity specification. A hardware component is NOT merely
 * "mesh + pins + state", but a complete physical, electrical, mechanical, and behavioral entity.
 */

export interface MountInterface {
  id: string;
  name: string;
  type: 'screw-pattern' | 'shaft' | 'standoff' | 'socket' | 'bracket' | 'strap-pad';
  standard?: 'M2-20x20' | 'M3-30.5x30.5' | 'M3-16x16' | 'M5-shaft' | 'micro-19mm' | 'custom';
  localPosition: { x: number; y: number; z: number };
  localRotation?: { x: number; y: number; z: number };
  description: string;
}

export interface ElectricalInterface {
  id: string;
  name: string;
  type: 'power-xt60' | 'power-phase' | 'power-dc' | 'bec-rail' | 'gnd' | 'pin-header' | 'jst-sh';
  pinCount: number;
  nominalVoltageV?: number;
  maxCurrentA?: number;
  direction: 'input' | 'output' | 'bidirectional';
  description: string;
}

export interface CommInterface {
  id: string;
  name: string;
  protocol: 'DShot600' | 'DShot300' | 'PWM' | 'UART' | 'I2C' | 'SPI' | 'CRSF' | 'Analog-Video';
  pinMapping: Record<string, string>;
  description: string;
}

export interface MechanicalInterface {
  id: string;
  name: string;
  type: 'rotary-shaft' | 'rigid-mount' | 'gimbal-pivot' | 'clamp';
  maxTorqueNm?: number;
  maxRpm?: number;
  description: string;
}

export interface HardwareIdentity {
  manufacturer: string;
  model: string;
  partNumber: string;
  category:
    | 'airframe'
    | 'motor-brushless'
    | 'propeller'
    | 'esc'
    | 'flight-controller'
    | 'battery-pack'
    | 'fpv-camera'
    | 'radio-receiver'
    | 'gps-module'
    | 'sensor'
    | 'payload';
  description: string;
  datasheetUrl?: string;
}

export interface HardwarePhysical {
  dimensionsMm: { width: number; height: number; depth: number };
  massKg: number;
  centerOfMass: { x: number; y: number; z: number }; // Local coordinates relative to entity origin
  momentOfInertiaKgM2: { Ixx: number; Iyy: number; Izz: number };
  mountingInterfaces: MountInterface[];
}

export interface HardwareElectrical {
  nominalVoltageV: number;
  voltageRange: { minV: number; maxV: number };
  maxCurrentA: number;
  quiescentCurrentA: number;
  internalResistanceOhm?: number;
  electricalInterfaces: ElectricalInterface[];
}

export interface HardwareEntity {
  id: string;
  identity: HardwareIdentity;
  physical: HardwarePhysical;
  electrical: HardwareElectrical;
  communication: {
    commInterfaces: CommInterface[];
  };
  mechanical: {
    mechanicalInterfaces: MechanicalInterface[];
  };
  behavior: Record<string, number | string | boolean>;
  state: {
    isMounted: boolean;
    mountPointId?: string;
    operationalStatus: 'nominal' | 'degraded' | 'fault' | 'disconnected' | 'destroyed';
    diagnostics: string[];
  };
}
