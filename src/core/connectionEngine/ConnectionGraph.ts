/**
 * Virtual IoT Lab — Connection Engine
 *
 * Models typed physical, electrical, signal, and mechanical connections.
 * Provides netlist continuity checking:
 * - Battery XT60 power circuit
 * - 3-phase motor power lines
 * - DShot signal lines (FC to ESC)
 * - UART / I2C digital communications
 * - Mechanical shaft-to-propeller coupling
 */

export type ConnectionCategory = 'power' | 'phase-motor' | 'signal-digital' | 'analog-video' | 'mechanical-shaft';

export interface LabConnection {
  id: string;
  name: string;
  category: ConnectionCategory;
  sourceEntityId: string;
  sourceInterfaceId: string;
  targetEntityId: string;
  targetInterfaceId: string;
  isConnected: boolean;
  voltageV?: number;
  currentA?: number;
  description: string;
}

export class ConnectionGraph {
  public connections: Map<string, LabConnection> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.resetDefaultConnections();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public resetDefaultConnections() {
    this.connections.clear();

    const defs: LabConnection[] = [
      // 1. Battery Power
      {
        id: 'conn_bat_esc_xt60',
        name: 'Main Battery XT60 Power Leads',
        category: 'power',
        sourceEntityId: 'part_battery_cnhl_6s_1100',
        sourceInterfaceId: 'elec_bat_xt60_lead',
        targetEntityId: 'part_esc_speedybee_50a',
        targetInterfaceId: 'elec_esc_bat_input',
        isConnected: true,
        voltageV: 22.2,
        currentA: 0,
        description: '12AWG silicone leads supplying raw battery power to 4-in-1 ESC',
      },

      // 2. ESC to Motors (3-Phase AC Power)
      {
        id: 'conn_esc_m1_phase',
        name: 'Motor 1 3-Phase Phase Lines',
        category: 'phase-motor',
        sourceEntityId: 'part_esc_speedybee_50a',
        sourceInterfaceId: 'elec_esc_motor1_out',
        targetEntityId: 'part_motor_emax_2207_1950kv_1',
        targetInterfaceId: 'elec_motor_phases_1',
        isConnected: true,
        description: 'High-current 3-phase ESC inverter bridge output to Motor 1',
      },
      {
        id: 'conn_esc_m2_phase',
        name: 'Motor 2 3-Phase Phase Lines',
        category: 'phase-motor',
        sourceEntityId: 'part_esc_speedybee_50a',
        sourceInterfaceId: 'elec_esc_motor2_out',
        targetEntityId: 'part_motor_emax_2207_1950kv_2',
        targetInterfaceId: 'elec_motor_phases_2',
        isConnected: true,
        description: 'High-current 3-phase ESC inverter bridge output to Motor 2',
      },
      {
        id: 'conn_esc_m3_phase',
        name: 'Motor 3 3-Phase Phase Lines',
        category: 'phase-motor',
        sourceEntityId: 'part_esc_speedybee_50a',
        sourceInterfaceId: 'elec_esc_motor3_out',
        targetEntityId: 'part_motor_emax_2207_1950kv_3',
        targetInterfaceId: 'elec_motor_phases_3',
        isConnected: true,
        description: 'High-current 3-phase ESC inverter bridge output to Motor 3',
      },
      {
        id: 'conn_esc_m4_phase',
        name: 'Motor 4 3-Phase Phase Lines',
        category: 'phase-motor',
        sourceEntityId: 'part_esc_speedybee_50a',
        sourceInterfaceId: 'elec_esc_motor4_out',
        targetEntityId: 'part_motor_emax_2207_1950kv_4',
        targetInterfaceId: 'elec_motor_phases_4',
        isConnected: true,
        description: 'High-current 3-phase ESC inverter bridge output to Motor 4',
      },

      // 3. Flight Controller to ESC (8-Pin JST-SH Ribbon)
      {
        id: 'conn_fc_esc_harness',
        name: 'FC-to-ESC 8-Pin Signal & Telemetry Harness',
        category: 'signal-digital',
        sourceEntityId: 'part_fc_speedybee_f405',
        sourceInterfaceId: 'comm_fc_esc_jst',
        targetEntityId: 'part_esc_speedybee_50a',
        targetInterfaceId: 'comm_esc_control_jst',
        isConnected: true,
        description: 'Transmits DShot600 motor pulses (M1-M4), battery voltage, and current shunt ADC',
      },

      // 4. Radio Receiver to Flight Controller (CRSF UART)
      {
        id: 'conn_rx_fc_crsf',
        name: 'ExpressLRS CRSF Serial Bus',
        category: 'signal-digital',
        sourceEntityId: 'part_rx_radiomaster_rp1',
        sourceInterfaceId: 'comm_rx_crsf_bus',
        targetEntityId: 'part_fc_speedybee_f405',
        targetInterfaceId: 'comm_fc_uart2_rx',
        isConnected: true,
        description: '500Hz full-duplex RC control packets and telemetry downlink',
      },

      // 5. FPV Camera to Flight Controller (Video & BEC Power)
      {
        id: 'conn_cam_fc_video',
        name: 'FPV Camera 9V Power & Video Link',
        category: 'analog-video',
        sourceEntityId: 'part_camera_caddx_ratel_2',
        sourceInterfaceId: 'comm_cam_video_out',
        targetEntityId: 'part_fc_speedybee_f405',
        targetInterfaceId: 'comm_fc_cam_port',
        isConnected: true,
        description: 'Filtered 9V DC supply and analog composite video pipeline',
      },

      // 6. GPS to Flight Controller (UART + I2C Compass)
      {
        id: 'conn_gps_fc_bus',
        name: 'GPS Serial & Compass I2C Link',
        category: 'signal-digital',
        sourceEntityId: 'part_gps_matek_sam_m8q',
        sourceInterfaceId: 'comm_gps_serial_i2c',
        targetEntityId: 'part_fc_speedybee_f405',
        targetInterfaceId: 'comm_fc_uart1_gps',
        isConnected: true,
        description: 'U-blox NMEA/UBX serial stream and magnetic heading register readouts',
      },

      // 7. Mechanical Propeller Locknuts (M5 Shaft Couplings)
      {
        id: 'conn_mech_prop1',
        name: 'Motor 1 M5 Shaft Locknut Coupling',
        category: 'mechanical-shaft',
        sourceEntityId: 'part_motor_emax_2207_1950kv_1',
        sourceInterfaceId: 'mech_rotor_1',
        targetEntityId: 'part_prop_hq_5040_cw_1',
        targetInterfaceId: 'mech_prop_hub_1',
        isConnected: true,
        description: 'Nylon insert M5 locknut clamping Propeller 1 hub to motor shaft',
      },
      {
        id: 'conn_mech_prop2',
        name: 'Motor 2 M5 Shaft Locknut Coupling',
        category: 'mechanical-shaft',
        sourceEntityId: 'part_motor_emax_2207_1950kv_2',
        sourceInterfaceId: 'mech_rotor_2',
        targetEntityId: 'part_prop_hq_5040_ccw_2',
        targetInterfaceId: 'mech_prop_hub_2',
        isConnected: true,
        description: 'Nylon insert M5 locknut clamping Propeller 2 hub to motor shaft',
      },
      {
        id: 'conn_mech_prop3',
        name: 'Motor 3 M5 Shaft Locknut Coupling',
        category: 'mechanical-shaft',
        sourceEntityId: 'part_motor_emax_2207_1950kv_3',
        sourceInterfaceId: 'mech_rotor_3',
        targetEntityId: 'part_prop_hq_5040_cw_3',
        targetInterfaceId: 'mech_prop_hub_3',
        isConnected: true,
        description: 'Nylon insert M5 locknut clamping Propeller 3 hub to motor shaft',
      },
      {
        id: 'conn_mech_prop4',
        name: 'Motor 4 M5 Shaft Locknut Coupling',
        category: 'mechanical-shaft',
        sourceEntityId: 'part_motor_emax_2207_1950kv_4',
        sourceInterfaceId: 'mech_rotor_4',
        targetEntityId: 'part_prop_hq_5040_ccw_4',
        targetInterfaceId: 'mech_prop_hub_4',
        isConnected: true,
        description: 'Nylon insert M5 locknut clamping Propeller 4 hub to motor shaft',
      },
    ];

    defs.forEach((d) => this.connections.set(d.id, d));
    this.notify();
  }

  public setConnectionState(connectionId: string, isConnected: boolean) {
    const conn = this.connections.get(connectionId);
    if (conn) {
      conn.isConnected = isConnected;
      this.notify();
    }
  }

  public isBatteryPowered(): boolean {
    const batConn = this.connections.get('conn_bat_esc_xt60');
    return batConn?.isConnected ?? false;
  }

  public isMotorElectricallyConnected(motorIndex: number): boolean {
    if (!this.isBatteryPowered()) return false;
    const fcHarness = this.connections.get('conn_fc_esc_harness');
    if (!fcHarness?.isConnected) return false;

    const motorConnId = `conn_esc_m${motorIndex + 1}_phase`;
    const conn = this.connections.get(motorConnId);
    return conn?.isConnected ?? false;
  }

  public isPropellerCoupled(motorIndex: number): boolean {
    const propConnId = `conn_mech_prop${motorIndex + 1}`;
    const conn = this.connections.get(propConnId);
    return conn?.isConnected ?? false;
  }

  public isRcSignalConnected(): boolean {
    const rxConn = this.connections.get('conn_rx_fc_crsf');
    return rxConn?.isConnected ?? false;
  }

  public getAll(): LabConnection[] {
    return Array.from(this.connections.values());
  }
}

export const connectionGraph = new ConnectionGraph();
