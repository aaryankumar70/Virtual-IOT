/**
 * Virtual IoT Lab — Documented Real Hardware Catalog
 * Reference Platform: GEPRC Mark4 5-inch Freestyle FPV Quadcopter
 *
 * Real, documented hardware specifications from verified manufacturer datasheets.
 */

import { HardwareEntity } from './HardwareEntity';

export const HARDWARE_DATABASE: Record<string, HardwareEntity> = {
  // 1. AIRFRAME
  'part_frame_geprc_mark4': {
    id: 'part_frame_geprc_mark4',
    identity: {
      manufacturer: 'GEPRC',
      model: 'Mark4 5" Freestyle Frame',
      partNumber: 'GEP-MK4-5',
      category: 'airframe',
      description: 'True-X geometry 225mm diagonal wheelbase, 5mm 3K carbon fiber arms, 2.5mm top/bottom plate.',
      datasheetUrl: 'https://geprc.com/product/geprc-mark4-5inch-frame/',
    },
    physical: {
      dimensionsMm: { width: 145, height: 35, depth: 172 },
      massKg: 0.128, // 128 grams
      centerOfMass: { x: 0, y: 0.015, z: 0 },
      momentOfInertiaKgM2: { Ixx: 0.0018, Iyy: 0.0022, Izz: 0.0035 },
      mountingInterfaces: [
        { id: 'mount_motor_1', name: 'Front Right Arm Motor Mount', type: 'screw-pattern', standard: 'M3-16x16', localPosition: { x: 0.08, y: 0.02, z: -0.08 }, description: 'M3 16x16mm motor bolt pattern' },
        { id: 'mount_motor_2', name: 'Front Left Arm Motor Mount', type: 'screw-pattern', standard: 'M3-16x16', localPosition: { x: -0.08, y: 0.02, z: -0.08 }, description: 'M3 16x16mm motor bolt pattern' },
        { id: 'mount_motor_3', name: 'Rear Left Arm Motor Mount', type: 'screw-pattern', standard: 'M3-16x16', localPosition: { x: -0.08, y: 0.02, z: 0.08 }, description: 'M3 16x16mm motor bolt pattern' },
        { id: 'mount_motor_4', name: 'Rear Right Arm Motor Mount', type: 'screw-pattern', standard: 'M3-16x16', localPosition: { x: 0.08, y: 0.02, z: 0.08 }, description: 'M3 16x16mm motor bolt pattern' },
        { id: 'mount_esc_stack', name: 'Center Lower Stack (ESC)', type: 'standoff', standard: 'M3-30.5x30.5', localPosition: { x: 0, y: 0.015, z: 0 }, description: '30.5x30.5mm M3 nylon standoffs' },
        { id: 'mount_fc_stack', name: 'Center Upper Stack (FC)', type: 'standoff', standard: 'M3-30.5x30.5', localPosition: { x: 0, y: 0.025, z: 0 }, description: '30.5x30.5mm vibration dampening silicone grommets' },
        { id: 'mount_battery_pad', name: 'Top Plate Battery Mount', type: 'strap-pad', localPosition: { x: 0, y: 0.04, z: 0 }, description: 'Anti-slip silicone pad with Kevlar battery strap' },
        { id: 'mount_fpv_camera', name: 'Front Camera Cage', type: 'bracket', standard: 'micro-19mm', localPosition: { x: 0, y: 0.025, z: -0.075 }, description: '7075 aluminum camera side plates with 19mm micro spacing' },
        { id: 'mount_rx_tray', name: 'Rear Receiver Tray', type: 'socket', localPosition: { x: 0, y: 0.038, z: 0.06 }, description: 'Rear TPU receiver antenna mount' },
        { id: 'mount_gps_mast', name: 'Rear 30-deg GPS Mast', type: 'bracket', localPosition: { x: 0, y: 0.055, z: 0.07 }, description: 'Elevated TPU mast for magnetic isolation' },
      ],
    },
    electrical: {
      nominalVoltageV: 0,
      voltageRange: { minV: 0, maxV: 0 },
      maxCurrentA: 0,
      quiescentCurrentA: 0,
      electricalInterfaces: [],
    },
    communication: { commInterfaces: [] },
    mechanical: { mechanicalInterfaces: [] },
    behavior: { wheelbaseDiagonalMm: 225, armThicknessMm: 5, frameMaterial: 'T700 Carbon Fiber' },
    state: { isMounted: true, operationalStatus: 'nominal', diagnostics: ['Carbon fiber integrity nominal', 'Standoff fasteners torqued to 0.8 Nm'] },
  },

  // 2. BRUSHLESS MOTORS (4 Units for Quadcopter)
  'part_motor_emax_2207_1950kv_1': {
    id: 'part_motor_emax_2207_1950kv_1',
    identity: {
      manufacturer: 'EMAX',
      model: 'ECO II 2207 1950KV (Front Right)',
      partNumber: 'ECO-II-2207-1950',
      category: 'motor-brushless',
      description: 'Brushless DC outrunner motor, N52 curved neodymium magnets, 99.9% oxygen-free copper windings.',
      datasheetUrl: 'https://emaxmodel.com/products/emax-eco-ii-series-2207-brushless-motor',
    },
    physical: {
      dimensionsMm: { width: 27.5, height: 31.7, depth: 27.5 },
      massKg: 0.0336, // 33.6g
      centerOfMass: { x: 0, y: 0.012, z: 0 },
      momentOfInertiaKgM2: { Ixx: 0.0000035, Iyy: 0.0000035, Izz: 0.0000052 },
      mountingInterfaces: [
        { id: 'mount_prop_shaft_1', name: 'M5 Hollow Steel Propeller Shaft', type: 'shaft', standard: 'M5-shaft', localPosition: { x: 0, y: 0.024, z: 0 }, description: 'M5 threaded shaft with aluminum locknut' },
      ],
    },
    electrical: {
      nominalVoltageV: 22.2, // 6S nominal
      voltageRange: { minV: 12.0, maxV: 26.0 },
      maxCurrentA: 38.5,
      quiescentCurrentA: 0.45,
      internalResistanceOhm: 0.055, // 55 mOhm winding resistance
      electricalInterfaces: [
        { id: 'elec_motor_phases_1', name: '3-Phase Winding Leads (A, B, C)', type: 'power-phase', pinCount: 3, nominalVoltageV: 22.2, maxCurrentA: 40, direction: 'input', description: '20AWG silicone high-strand motor leads' },
      ],
    },
    communication: { commInterfaces: [] },
    mechanical: {
      mechanicalInterfaces: [
        { id: 'mech_rotor_1', name: 'Rotor Bell Rotation (CW)', type: 'rotary-shaft', maxRpm: 48000, maxTorqueNm: 0.45, description: 'Clockwise rotation direction' },
      ],
    },
    behavior: { kv: 1950, kt: 0.0049, efficiency: 0.86, statorDiameterMm: 22, statorHeightMm: 7, configuration: '12N14P', rotationDirection: 'CW' },
    state: { isMounted: true, mountPointId: 'mount_motor_1', operationalStatus: 'nominal', diagnostics: ['Bearing play nominal', 'Winding resistance 0.055 ohm balanced'] },
  },

  'part_motor_emax_2207_1950kv_2': {
    id: 'part_motor_emax_2207_1950kv_2',
    identity: {
      manufacturer: 'EMAX',
      model: 'ECO II 2207 1950KV (Front Left)',
      partNumber: 'ECO-II-2207-1950',
      category: 'motor-brushless',
      description: 'Brushless DC outrunner motor, N52 curved neodymium magnets, CCW rotation configuration.',
      datasheetUrl: 'https://emaxmodel.com/products/emax-eco-ii-series-2207-brushless-motor',
    },
    physical: {
      dimensionsMm: { width: 27.5, height: 31.7, depth: 27.5 },
      massKg: 0.0336,
      centerOfMass: { x: 0, y: 0.012, z: 0 },
      momentOfInertiaKgM2: { Ixx: 0.0000035, Iyy: 0.0000035, Izz: 0.0000052 },
      mountingInterfaces: [
        { id: 'mount_prop_shaft_2', name: 'M5 Hollow Steel Propeller Shaft', type: 'shaft', standard: 'M5-shaft', localPosition: { x: 0, y: 0.024, z: 0 }, description: 'M5 threaded shaft with aluminum locknut' },
      ],
    },
    electrical: {
      nominalVoltageV: 22.2,
      voltageRange: { minV: 12.0, maxV: 26.0 },
      maxCurrentA: 38.5,
      quiescentCurrentA: 0.45,
      internalResistanceOhm: 0.055,
      electricalInterfaces: [
        { id: 'elec_motor_phases_2', name: '3-Phase Winding Leads (A, B, C)', type: 'power-phase', pinCount: 3, nominalVoltageV: 22.2, maxCurrentA: 40, direction: 'input', description: '20AWG silicone high-strand motor leads' },
      ],
    },
    communication: { commInterfaces: [] },
    mechanical: {
      mechanicalInterfaces: [
        { id: 'mech_rotor_2', name: 'Rotor Bell Rotation (CCW)', type: 'rotary-shaft', maxRpm: 48000, maxTorqueNm: 0.45, description: 'Counter-clockwise rotation direction' },
      ],
    },
    behavior: { kv: 1950, kt: 0.0049, efficiency: 0.86, statorDiameterMm: 22, statorHeightMm: 7, configuration: '12N14P', rotationDirection: 'CCW' },
    state: { isMounted: true, mountPointId: 'mount_motor_2', operationalStatus: 'nominal', diagnostics: ['Bearing play nominal', 'Winding resistance 0.055 ohm balanced'] },
  },

  'part_motor_emax_2207_1950kv_3': {
    id: 'part_motor_emax_2207_1950kv_3',
    identity: {
      manufacturer: 'EMAX',
      model: 'ECO II 2207 1950KV (Rear Left)',
      partNumber: 'ECO-II-2207-1950',
      category: 'motor-brushless',
      description: 'Brushless DC outrunner motor, CW rotation configuration.',
      datasheetUrl: 'https://emaxmodel.com/products/emax-eco-ii-series-2207-brushless-motor',
    },
    physical: {
      dimensionsMm: { width: 27.5, height: 31.7, depth: 27.5 },
      massKg: 0.0336,
      centerOfMass: { x: 0, y: 0.012, z: 0 },
      momentOfInertiaKgM2: { Ixx: 0.0000035, Iyy: 0.0000035, Izz: 0.0000052 },
      mountingInterfaces: [
        { id: 'mount_prop_shaft_3', name: 'M5 Hollow Steel Propeller Shaft', type: 'shaft', standard: 'M5-shaft', localPosition: { x: 0, y: 0.024, z: 0 }, description: 'M5 threaded shaft with aluminum locknut' },
      ],
    },
    electrical: {
      nominalVoltageV: 22.2,
      voltageRange: { minV: 12.0, maxV: 26.0 },
      maxCurrentA: 38.5,
      quiescentCurrentA: 0.45,
      internalResistanceOhm: 0.055,
      electricalInterfaces: [
        { id: 'elec_motor_phases_3', name: '3-Phase Winding Leads (A, B, C)', type: 'power-phase', pinCount: 3, nominalVoltageV: 22.2, maxCurrentA: 40, direction: 'input', description: '20AWG silicone high-strand motor leads' },
      ],
    },
    communication: { commInterfaces: [] },
    mechanical: {
      mechanicalInterfaces: [
        { id: 'mech_rotor_3', name: 'Rotor Bell Rotation (CW)', type: 'rotary-shaft', maxRpm: 48000, maxTorqueNm: 0.45, description: 'Clockwise rotation direction' },
      ],
    },
    behavior: { kv: 1950, kt: 0.0049, efficiency: 0.86, statorDiameterMm: 22, statorHeightMm: 7, configuration: '12N14P', rotationDirection: 'CW' },
    state: { isMounted: true, mountPointId: 'mount_motor_3', operationalStatus: 'nominal', diagnostics: ['Bearing play nominal', 'Winding resistance 0.055 ohm balanced'] },
  },

  'part_motor_emax_2207_1950kv_4': {
    id: 'part_motor_emax_2207_1950kv_4',
    identity: {
      manufacturer: 'EMAX',
      model: 'ECO II 2207 1950KV (Rear Right)',
      partNumber: 'ECO-II-2207-1950',
      category: 'motor-brushless',
      description: 'Brushless DC outrunner motor, CCW rotation configuration.',
      datasheetUrl: 'https://emaxmodel.com/products/emax-eco-ii-series-2207-brushless-motor',
    },
    physical: {
      dimensionsMm: { width: 27.5, height: 31.7, depth: 27.5 },
      massKg: 0.0336,
      centerOfMass: { x: 0, y: 0.012, z: 0 },
      momentOfInertiaKgM2: { Ixx: 0.0000035, Iyy: 0.0000035, Izz: 0.0000052 },
      mountingInterfaces: [
        { id: 'mount_prop_shaft_4', name: 'M5 Hollow Steel Propeller Shaft', type: 'shaft', standard: 'M5-shaft', localPosition: { x: 0, y: 0.024, z: 0 }, description: 'M5 threaded shaft with aluminum locknut' },
      ],
    },
    electrical: {
      nominalVoltageV: 22.2,
      voltageRange: { minV: 12.0, maxV: 26.0 },
      maxCurrentA: 38.5,
      quiescentCurrentA: 0.45,
      internalResistanceOhm: 0.055,
      electricalInterfaces: [
        { id: 'elec_motor_phases_4', name: '3-Phase Winding Leads (A, B, C)', type: 'power-phase', pinCount: 3, nominalVoltageV: 22.2, maxCurrentA: 40, direction: 'input', description: '20AWG silicone high-strand motor leads' },
      ],
    },
    communication: { commInterfaces: [] },
    mechanical: {
      mechanicalInterfaces: [
        { id: 'mech_rotor_4', name: 'Rotor Bell Rotation (CCW)', type: 'rotary-shaft', maxRpm: 48000, maxTorqueNm: 0.45, description: 'Counter-clockwise rotation direction' },
      ],
    },
    behavior: { kv: 1950, kt: 0.0049, efficiency: 0.86, statorDiameterMm: 22, statorHeightMm: 7, configuration: '12N14P', rotationDirection: 'CCW' },
    state: { isMounted: true, mountPointId: 'mount_motor_4', operationalStatus: 'nominal', diagnostics: ['Bearing play nominal', 'Winding resistance 0.055 ohm balanced'] },
  },

  // 3. PROPELLERS (4 Units)
  'part_prop_hq_5040_cw_1': {
    id: 'part_prop_hq_5040_cw_1',
    identity: {
      manufacturer: 'HQProp',
      model: 'Ethix S5 5.0x4.0x3 (CW Prop 1)',
      partNumber: 'HQ-S5-50403-CW',
      category: 'propeller',
      description: 'Polycarbonate aerodynamic tri-blade propeller designed by Mr Steele for freestyle agility.',
      datasheetUrl: 'https://www.hqprop.com/ethix-s5-cinematic-propeller-p0090.html',
    },
    physical: {
      dimensionsMm: { width: 127, height: 12, depth: 127 },
      massKg: 0.0041, // 4.1 grams
      centerOfMass: { x: 0, y: 0.004, z: 0 },
      momentOfInertiaKgM2: { Ixx: 0.0000012, Iyy: 0.0000021, Izz: 0.0000012 },
      mountingInterfaces: [],
    },
    electrical: { nominalVoltageV: 0, voltageRange: { minV: 0, maxV: 0 }, maxCurrentA: 0, quiescentCurrentA: 0, electricalInterfaces: [] },
    communication: { commInterfaces: [] },
    mechanical: {
      mechanicalInterfaces: [
        { id: 'mech_prop_hub_1', name: 'M5 Hub Bore', type: 'rigid-mount', maxTorqueNm: 1.2, description: 'Direct coupling to motor shaft' },
      ],
    },
    behavior: { diameterInches: 5.0, pitchInches: 4.0, bladeCount: 3, thrustCoeffCt: 0.108, powerCoeffCp: 0.046, maxRpm: 38000, rotation: 'CW' },
    state: { isMounted: true, mountPointId: 'mount_prop_shaft_1', operationalStatus: 'nominal', diagnostics: ['Aerodynamic balance verified', 'Zero blade delamination'] },
  },

  'part_prop_hq_5040_ccw_2': {
    id: 'part_prop_hq_5040_ccw_2',
    identity: {
      manufacturer: 'HQProp',
      model: 'Ethix S5 5.0x4.0x3 (CCW Prop 2)',
      partNumber: 'HQ-S5-50403-CCW',
      category: 'propeller',
      description: 'Polycarbonate aerodynamic tri-blade propeller (CCW).',
      datasheetUrl: 'https://www.hqprop.com/ethix-s5-cinematic-propeller-p0090.html',
    },
    physical: {
      dimensionsMm: { width: 127, height: 12, depth: 127 },
      massKg: 0.0041,
      centerOfMass: { x: 0, y: 0.004, z: 0 },
      momentOfInertiaKgM2: { Ixx: 0.0000012, Iyy: 0.0000021, Izz: 0.0000012 },
      mountingInterfaces: [],
    },
    electrical: { nominalVoltageV: 0, voltageRange: { minV: 0, maxV: 0 }, maxCurrentA: 0, quiescentCurrentA: 0, electricalInterfaces: [] },
    communication: { commInterfaces: [] },
    mechanical: {
      mechanicalInterfaces: [
        { id: 'mech_prop_hub_2', name: 'M5 Hub Bore', type: 'rigid-mount', maxTorqueNm: 1.2, description: 'Direct coupling to motor shaft' },
      ],
    },
    behavior: { diameterInches: 5.0, pitchInches: 4.0, bladeCount: 3, thrustCoeffCt: 0.108, powerCoeffCp: 0.046, maxRpm: 38000, rotation: 'CCW' },
    state: { isMounted: true, mountPointId: 'mount_prop_shaft_2', operationalStatus: 'nominal', diagnostics: ['Aerodynamic balance verified', 'Zero blade delamination'] },
  },

  'part_prop_hq_5040_cw_3': {
    id: 'part_prop_hq_5040_cw_3',
    identity: {
      manufacturer: 'HQProp',
      model: 'Ethix S5 5.0x4.0x3 (CW Prop 3)',
      partNumber: 'HQ-S5-50403-CW',
      category: 'propeller',
      description: 'Polycarbonate aerodynamic tri-blade propeller (CW).',
      datasheetUrl: 'https://www.hqprop.com/ethix-s5-cinematic-propeller-p0090.html',
    },
    physical: {
      dimensionsMm: { width: 127, height: 12, depth: 127 },
      massKg: 0.0041,
      centerOfMass: { x: 0, y: 0.004, z: 0 },
      momentOfInertiaKgM2: { Ixx: 0.0000012, Iyy: 0.0000021, Izz: 0.0000012 },
      mountingInterfaces: [],
    },
    electrical: { nominalVoltageV: 0, voltageRange: { minV: 0, maxV: 0 }, maxCurrentA: 0, quiescentCurrentA: 0, electricalInterfaces: [] },
    communication: { commInterfaces: [] },
    mechanical: {
      mechanicalInterfaces: [
        { id: 'mech_prop_hub_3', name: 'M5 Hub Bore', type: 'rigid-mount', maxTorqueNm: 1.2, description: 'Direct coupling to motor shaft' },
      ],
    },
    behavior: { diameterInches: 5.0, pitchInches: 4.0, bladeCount: 3, thrustCoeffCt: 0.108, powerCoeffCp: 0.046, maxRpm: 38000, rotation: 'CW' },
    state: { isMounted: true, mountPointId: 'mount_prop_shaft_3', operationalStatus: 'nominal', diagnostics: ['Aerodynamic balance verified', 'Zero blade delamination'] },
  },

  'part_prop_hq_5040_ccw_4': {
    id: 'part_prop_hq_5040_ccw_4',
    identity: {
      manufacturer: 'HQProp',
      model: 'Ethix S5 5.0x4.0x3 (CCW Prop 4)',
      partNumber: 'HQ-S5-50403-CCW',
      category: 'propeller',
      description: 'Polycarbonate aerodynamic tri-blade propeller (CCW).',
      datasheetUrl: 'https://www.hqprop.com/ethix-s5-cinematic-propeller-p0090.html',
    },
    physical: {
      dimensionsMm: { width: 127, height: 12, depth: 127 },
      massKg: 0.0041,
      centerOfMass: { x: 0, y: 0.004, z: 0 },
      momentOfInertiaKgM2: { Ixx: 0.0000012, Iyy: 0.0000021, Izz: 0.0000012 },
      mountingInterfaces: [],
    },
    electrical: { nominalVoltageV: 0, voltageRange: { minV: 0, maxV: 0 }, maxCurrentA: 0, quiescentCurrentA: 0, electricalInterfaces: [] },
    communication: { commInterfaces: [] },
    mechanical: {
      mechanicalInterfaces: [
        { id: 'mech_prop_hub_4', name: 'M5 Hub Bore', type: 'rigid-mount', maxTorqueNm: 1.2, description: 'Direct coupling to motor shaft' },
      ],
    },
    behavior: { diameterInches: 5.0, pitchInches: 4.0, bladeCount: 3, thrustCoeffCt: 0.108, powerCoeffCp: 0.046, maxRpm: 38000, rotation: 'CCW' },
    state: { isMounted: true, mountPointId: 'mount_prop_shaft_4', operationalStatus: 'nominal', diagnostics: ['Aerodynamic balance verified', 'Zero blade delamination'] },
  },

  // 4. ESC (4-in-1 Electronic Speed Controller)
  'part_esc_speedybee_50a': {
    id: 'part_esc_speedybee_50a',
    identity: {
      manufacturer: 'SpeedyBee',
      model: 'BLHeli_S 50A 4-in-1 ESC',
      partNumber: 'SB-ESC-50A-4IN1',
      category: 'esc',
      description: '4-channel synchronous rectification ESC, BB21 MCU, DShot300/600, TVS diode, onboard current sensor.',
      datasheetUrl: 'https://www.speedybee.com/speedybee-f405-v3-bls-50a-30x30-fc-esc-stack/',
    },
    physical: {
      dimensionsMm: { width: 45.6, height: 6.8, depth: 40.0 },
      massKg: 0.0138, // 13.8g
      centerOfMass: { x: 0, y: 0.003, z: 0 },
      momentOfInertiaKgM2: { Ixx: 0.000002, Iyy: 0.000002, Izz: 0.000004 },
      mountingInterfaces: [
        { id: 'mount_esc_holes', name: '30.5x30.5mm M3 Standoff Holes', type: 'standoff', standard: 'M3-30.5x30.5', localPosition: { x: 0, y: 0, z: 0 }, description: 'Mounts on lower frame stack' },
      ],
    },
    electrical: {
      nominalVoltageV: 22.2,
      voltageRange: { minV: 11.1, maxV: 26.0 }, // 3S to 6S LiPo
      maxCurrentA: 200, // 50A continuous x 4
      quiescentCurrentA: 0.045,
      internalResistanceOhm: 0.002, // 2 mOhm shunt resistor
      electricalInterfaces: [
        { id: 'elec_esc_bat_input', name: 'Battery Main Input (XT60)', type: 'power-xt60', pinCount: 2, nominalVoltageV: 22.2, maxCurrentA: 160, direction: 'input', description: 'Heavy 14AWG power leads with Rubycon 1000uF 35V low-ESR capacitor' },
        { id: 'elec_esc_motor1_out', name: 'Motor 1 3-Phase Solder Pads', type: 'power-phase', pinCount: 3, nominalVoltageV: 22.2, maxCurrentA: 50, direction: 'output', description: 'Direct solder pads on front right corner' },
        { id: 'elec_esc_motor2_out', name: 'Motor 2 3-Phase Solder Pads', type: 'power-phase', pinCount: 3, nominalVoltageV: 22.2, maxCurrentA: 50, direction: 'output', description: 'Direct solder pads on front left corner' },
        { id: 'elec_esc_motor3_out', name: 'Motor 3 3-Phase Solder Pads', type: 'power-phase', pinCount: 3, nominalVoltageV: 22.2, maxCurrentA: 50, direction: 'output', description: 'Direct solder pads on rear left corner' },
        { id: 'elec_esc_motor4_out', name: 'Motor 4 3-Phase Solder Pads', type: 'power-phase', pinCount: 3, nominalVoltageV: 22.2, maxCurrentA: 50, direction: 'output', description: 'Direct solder pads on rear right corner' },
      ],
    },
    communication: {
      commInterfaces: [
        { id: 'comm_esc_control_jst', name: '8-Pin JST-SH Flight Controller Interface', protocol: 'DShot600', pinMapping: { '1': 'GND', '2': 'V_BAT', '3': 'M1_SIG', '4': 'M2_SIG', '5': 'M3_SIG', '6': 'M4_SIG', '7': 'CURR_ADC', '8': 'ESC_TELEM' }, description: 'Ribbon cable connection to FC' },
      ],
    },
    mechanical: { mechanicalInterfaces: [] },
    behavior: { continuousAmpsPerChannel: 50, burstAmpsPerChannel: 60, firmware: 'BLHeli_S 16.7', currentSensorScale: 386 },
    state: { isMounted: true, mountPointId: 'mount_esc_stack', operationalStatus: 'nominal', diagnostics: ['MOSFET thermals 24C', 'Gate drivers primed', 'Current shunt calibrated'] },
  },

  // 5. FLIGHT CONTROLLER
  'part_fc_speedybee_f405': {
    id: 'part_fc_speedybee_f405',
    identity: {
      manufacturer: 'SpeedyBee',
      model: 'F405 V3 Flight Controller',
      partNumber: 'SB-FC-F405-V3',
      category: 'flight-controller',
      description: 'STM32F405 MCU @ 168MHz, ICM42688P 6-axis IMU, DPS310 Barometer, AT7456E OSD, Bluetooth 4.0 BLE for wireless Betaflight tuning.',
      datasheetUrl: 'https://www.speedybee.com/speedybee-f405-v3-bls-50a-30x30-fc-esc-stack/',
    },
    physical: {
      dimensionsMm: { width: 38.0, height: 7.2, depth: 38.0 },
      massKg: 0.0092, // 9.2g
      centerOfMass: { x: 0, y: 0.003, z: 0 },
      momentOfInertiaKgM2: { Ixx: 0.000001, Iyy: 0.000001, Izz: 0.000002 },
      mountingInterfaces: [
        { id: 'mount_fc_holes', name: '30.5x30.5mm Silicone Dampened Holes', type: 'standoff', standard: 'M3-30.5x30.5', localPosition: { x: 0, y: 0, z: 0 }, description: 'Vibration-isolated M3 grommets' },
      ],
    },
    electrical: {
      nominalVoltageV: 5.0,
      voltageRange: { minV: 4.8, maxV: 26.0 }, // Has internal 5V 2A BEC and 9V 2A BEC
      maxCurrentA: 2.0,
      quiescentCurrentA: 0.18,
      electricalInterfaces: [
        { id: 'elec_fc_5v_bec', name: '5V 2A Regulated Rail', type: 'bec-rail', pinCount: 6, nominalVoltageV: 5.0, maxCurrentA: 2.0, direction: 'output', description: 'Powers RX, GPS, and onboard MCU' },
        { id: 'elec_fc_9v_bec', name: '9V 2A Clean Rail', type: 'bec-rail', pinCount: 2, nominalVoltageV: 9.0, maxCurrentA: 2.0, direction: 'output', description: 'Filtered power for FPV camera & VTX' },
      ],
    },
    communication: {
      commInterfaces: [
        { id: 'comm_fc_esc_jst', name: '8-Pin JST-SH ESC Control Port', protocol: 'DShot600', pinMapping: { '1': 'GND', '2': 'V_BAT', '3': 'M1_SIG', '4': 'M2_SIG', '5': 'M3_SIG', '6': 'M4_SIG', '7': 'CURR_ADC', '8': 'ESC_TELEM' }, description: 'Motor pulse lines 1-4' },
        { id: 'comm_fc_uart2_rx', name: 'UART2 (Radio Receiver)', protocol: 'CRSF', pinMapping: { 'TX': 'UART2_TX', 'RX': 'UART2_RX', '5V': '5V', 'GND': 'GND' }, description: 'ExpressLRS serial receiver link' },
        { id: 'comm_fc_uart1_gps', name: 'UART1 & I2C (GPS + Compass)', protocol: 'UART', pinMapping: { 'TX': 'UART1_TX', 'RX': 'UART1_RX', 'SDA': 'I2C1_SDA', 'SCL': 'I2C1_SCL' }, description: 'U-blox protocol 115200 baud' },
        { id: 'comm_fc_cam_port', name: 'Camera Port', protocol: 'Analog-Video', pinMapping: { 'VIN': 'CAM_VIN', 'GND': 'GND', '9V': '9V_CLEAN' }, description: 'OSD overlay video pipeline' },
      ],
    },
    mechanical: { mechanicalInterfaces: [] },
    behavior: { mcu: 'STM32F405RGT6', clockMhz: 168, imu: 'ICM-42688-P', pidLoopKhz: 8, osdChip: 'AT7456E', barometer: 'DPS310' },
    state: { isMounted: true, mountPointId: 'mount_fc_stack', operationalStatus: 'nominal', diagnostics: ['IMU calibrated: Gyro drift < 0.02 deg/s', 'Voltage sensor ADC ready'] },
  },

  // 6. BATTERY PACK
  'part_battery_cnhl_6s_1100': {
    id: 'part_battery_cnhl_6s_1100',
    identity: {
      manufacturer: 'CNHL',
      model: 'Black Series 6S 1100mAh 100C LiPo',
      partNumber: 'CNHL-BS-6S-1100',
      category: 'battery-pack',
      description: '6S1P High-discharge Lithium Polymer flight pack, 100C continuous / 200C burst, XT60 connector.',
      datasheetUrl: 'https://chinahobbyline.com/products/cnhl-black-series-1100mah-22-2v-6s-100c-lipo-battery',
    },
    physical: {
      dimensionsMm: { width: 38.0, height: 38.0, depth: 75.0 },
      massKg: 0.192, // 192g
      centerOfMass: { x: 0, y: 0.019, z: 0 },
      momentOfInertiaKgM2: { Ixx: 0.000045, Iyy: 0.000095, Izz: 0.000095 },
      mountingInterfaces: [],
    },
    electrical: {
      nominalVoltageV: 22.2, // 3.7V * 6
      voltageRange: { minV: 19.8, maxV: 25.2 }, // 3.3V to 4.2V per cell
      maxCurrentA: 110.0, // 100C * 1.1Ah = 110A
      quiescentCurrentA: 0,
      internalResistanceOhm: 0.0084, // 1.4 mOhm per cell * 6 = 8.4 mOhm
      electricalInterfaces: [
        { id: 'elec_bat_xt60_lead', name: 'XT60 Female Heavy Discharge Cable', type: 'power-xt60', pinCount: 2, nominalVoltageV: 22.2, maxCurrentA: 120, direction: 'output', description: '12AWG ultra-flexible silicone wire with genuine Amass XT60' },
        { id: 'elec_bat_balance_lead', name: 'JST-XH 7-Pin Balance Lead', type: 'pin-header', pinCount: 7, nominalVoltageV: 22.2, maxCurrentA: 2.0, direction: 'output', description: 'Cell-by-cell monitoring connector' },
      ],
    },
    communication: { commInterfaces: [] },
    mechanical: { mechanicalInterfaces: [] },
    behavior: { cellCount: 6, capacityMah: 1100, cRating: 100, cellNominalV: 3.7, cellFullV: 4.2, cellCutoffV: 3.3, energyWattHours: 24.42 },
    state: { isMounted: true, mountPointId: 'mount_battery_pad', operationalStatus: 'nominal', diagnostics: ['State of Charge: 100%', 'Loaded Voltage: 25.2V', 'Cell IR: 1.4 mOhm avg'] },
  },

  // 7. FPV CAMERA
  'part_camera_caddx_ratel_2': {
    id: 'part_camera_caddx_ratel_2',
    identity: {
      manufacturer: 'Caddx',
      model: 'Ratel 2 Micro FPV Camera',
      partNumber: 'CDX-RATEL2-RED',
      category: 'fpv-camera',
      description: '1200TVL Starlight sensor, 1/1.8" HDR lens, 0.0001 lux low-light sensitivity, aluminum alloy shell.',
      datasheetUrl: 'https://caddxfpv.com/products/caddx-ratel-2',
    },
    physical: {
      dimensionsMm: { width: 19.0, height: 19.0, depth: 20.5 },
      massKg: 0.0059, // 5.9g
      centerOfMass: { x: 0, y: 0, z: 0 },
      momentOfInertiaKgM2: { Ixx: 0.0000002, Iyy: 0.0000002, Izz: 0.0000002 },
      mountingInterfaces: [],
    },
    electrical: {
      nominalVoltageV: 9.0,
      voltageRange: { minV: 4.5, maxV: 36.0 },
      maxCurrentA: 0.15,
      quiescentCurrentA: 0.09,
      electricalInterfaces: [
        { id: 'elec_cam_power_lead', name: 'Power & Ground Lead', type: 'bec-rail', pinCount: 2, nominalVoltageV: 9.0, maxCurrentA: 0.2, direction: 'input', description: 'Filtered DC input from FC BEC' },
      ],
    },
    communication: {
      commInterfaces: [
        { id: 'comm_cam_video_out', name: 'Composite NTSC/PAL Video Out', protocol: 'Analog-Video', pinMapping: { 'VIDEO': 'CVBS', 'GND': 'GND' }, description: '75-ohm coaxial analog video signal' },
      ],
    },
    mechanical: {
      mechanicalInterfaces: [
        { id: 'mech_cam_tilt_pivot', name: 'M2 Side Bracket Pivots', type: 'gimbal-pivot', description: 'Adjustable camera uptilt 0 to 60 degrees' },
      ],
    },
    behavior: { resolutionTvl: 1200, fovDeg: 165, latencyMs: 4.5, sensorFormat: '1/1.8" HDR' },
    state: { isMounted: true, mountPointId: 'mount_fpv_camera', operationalStatus: 'nominal', diagnostics: ['Video lock valid', 'AGC operational'] },
  },

  // 8. RADIO RECEIVER
  'part_rx_radiomaster_rp1': {
    id: 'part_rx_radiomaster_rp1',
    identity: {
      manufacturer: 'RadioMaster',
      model: 'RP1 2.4GHz ExpressLRS Nano Receiver',
      partNumber: 'RM-RP1-ELRS',
      category: 'radio-receiver',
      description: 'SX1280 + ESP8285 MCU, ExpressLRS open-source 500Hz packet rate, CRSF serial protocol, 65mm U.FL T-antenna.',
      datasheetUrl: 'https://www.radiomasterrc.com/products/rp1-expresslrs-2-4ghz-nano-receiver',
    },
    physical: {
      dimensionsMm: { width: 13.0, height: 3.5, depth: 11.0 },
      massKg: 0.0022, // 2.2g
      centerOfMass: { x: 0, y: 0, z: 0 },
      momentOfInertiaKgM2: { Ixx: 0.00000005, Iyy: 0.00000005, Izz: 0.00000008 },
      mountingInterfaces: [],
    },
    electrical: {
      nominalVoltageV: 5.0,
      voltageRange: { minV: 4.5, maxV: 5.5 },
      maxCurrentA: 0.12,
      quiescentCurrentA: 0.065,
      electricalInterfaces: [
        { id: 'elec_rx_5v_lead', name: '5V & Ground Input', type: 'bec-rail', pinCount: 2, nominalVoltageV: 5.0, maxCurrentA: 0.15, direction: 'input', description: 'Connected to FC 5V' },
      ],
    },
    communication: {
      commInterfaces: [
        { id: 'comm_rx_crsf_bus', name: 'CRSF Serial Telemetry Bus', protocol: 'CRSF', pinMapping: { 'TX': 'CRSF_TX', 'RX': 'CRSF_RX' }, description: 'Full-duplex serial telemetry to FC UART2' },
      ],
    },
    mechanical: { mechanicalInterfaces: [] },
    behavior: { frequencyMhz: 2400, packetRateHz: 500, telemetryPowerMw: 100, sensitivityDbm: -105 },
    state: { isMounted: true, mountPointId: 'mount_rx_tray', operationalStatus: 'nominal', diagnostics: ['LQ (Link Quality): 100%', 'RSSI: -42 dBm', 'Latency: 2.1 ms'] },
  },

  // 9. GPS & COMPASS MODULE
  'part_gps_matek_sam_m8q': {
    id: 'part_gps_matek_sam_m8q',
    identity: {
      manufacturer: 'Matek Systems',
      model: 'SAM-M8Q GPS & QMC5883L Compass',
      partNumber: 'MATEK-SAM-M8Q',
      category: 'gps-module',
      description: 'U-blox M8 concurrent GNSS (GPS, GLONASS, Galileo), onboard patch antenna, QMC5883L I2C compass sensor.',
      datasheetUrl: 'http://www.mateksys.com/?portfolio=sam-m8q',
    },
    physical: {
      dimensionsMm: { width: 26.0, height: 7.5, depth: 16.0 },
      massKg: 0.0075, // 7.5g
      centerOfMass: { x: 0, y: 0.003, z: 0 },
      momentOfInertiaKgM2: { Ixx: 0.0000003, Iyy: 0.0000004, Izz: 0.0000006 },
      mountingInterfaces: [],
    },
    electrical: {
      nominalVoltageV: 5.0,
      voltageRange: { minV: 4.0, maxV: 5.5 },
      maxCurrentA: 0.075,
      quiescentCurrentA: 0.045,
      electricalInterfaces: [
        { id: 'elec_gps_5v_lead', name: '5V & Ground Input', type: 'bec-rail', pinCount: 2, nominalVoltageV: 5.0, maxCurrentA: 0.1, direction: 'input', description: 'Connected to FC 5V' },
      ],
    },
    communication: {
      commInterfaces: [
        { id: 'comm_gps_serial_i2c', name: 'GNSS UART & Mag I2C', protocol: 'UART', pinMapping: { 'TX': 'GPS_TX', 'RX': 'GPS_RX', 'SDA': 'MAG_SDA', 'SCL': 'MAG_SCL' }, description: 'Dual bus to FC' },
      ],
    },
    mechanical: { mechanicalInterfaces: [] },
    behavior: { gnssConstellations: 'GPS + GLONASS', updateRateHz: 10, satellitesLocked: 14, hdop: 0.9 },
    state: { isMounted: true, mountPointId: 'mount_gps_mast', operationalStatus: 'nominal', diagnostics: ['3D Satellite Fix acquired', 'Compass declination -4.2 deg'] },
  },
};
