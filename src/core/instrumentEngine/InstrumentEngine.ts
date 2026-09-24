/**
 * Virtual IoT Lab — Instrument Engine
 *
 * Provides real engineering laboratory instruments connected to the simulation engine:
 * 1. Digital Multimeter (Voltage, Current, Power, Shunt mV, Continuity)
 * 2. Dual-Channel Oscilloscope with live waveform buffers and timebase triggering
 * 3. Blackbox Flight Telemetry Data Logger
 */

import { simulationEngine } from '../simulationEngine/SimulationEngine';
import { connectionGraph } from '../connectionEngine/ConnectionGraph';

export type MultimeterMode = 'voltage_dc' | 'current_dc' | 'power_watts' | 'phase_rms' | 'continuity';

export type MultimeterTestPoint =
  | 'BAT_XT60'
  | 'ESC_TOTAL_CURRENT'
  | 'FC_5V_REG'
  | 'MOTOR_1_PHASE'
  | 'MOTOR_2_PHASE'
  | 'MOTOR_3_PHASE'
  | 'MOTOR_4_PHASE'
  | 'CURRENT_SHUNT_MV';

export type ScopeChannelSource =
  | 'M1_DSHOT'
  | 'M2_DSHOT'
  | 'GYRO_ROLL_RATE'
  | 'GYRO_PITCH_RATE'
  | 'BATTERY_VOLTAGE'
  | 'ACCEL_Z'
  | 'TOTAL_CURRENT';

export interface ScopeWaveformSample {
  timeSec: number;
  ch1Val: number;
  ch2Val: number;
}

export class InstrumentEngine {
  // Digital Multimeter State
  public dmmMode: MultimeterMode = 'voltage_dc';
  public dmmTestPoint: MultimeterTestPoint = 'BAT_XT60';
  public dmmHold: boolean = false;
  public dmmHoldValue: number | null = null;

  // Oscilloscope State
  public scopeCh1Source: ScopeChannelSource = 'M1_DSHOT';
  public scopeCh2Source: ScopeChannelSource = 'GYRO_ROLL_RATE';
  public scopeTimebaseMs: number = 10; // 10ms per div
  public scopeCh1VoltsPerDiv: number = 1.0;
  public scopeCh2VoltsPerDiv: number = 2.0;
  public scopeRunning: boolean = true;
  public waveformBuffer: ScopeWaveformSample[] = [];
  public maxBufferSize: number = 300;

  // Blackbox Logger
  public isLogging: boolean = false;
  public logRecords: Array<{
    t: number;
    rollDeg: number;
    pitchDeg: number;
    yawDeg: number;
    m1Rpm: number;
    m2Rpm: number;
    m3Rpm: number;
    m4Rpm: number;
    volts: number;
    amps: number;
    altM: number;
  }> = [];

  private listeners: Set<() => void> = new Set();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  /**
   * Sample signals for oscilloscope and data logger
   */
  public sample(dt: number) {
    const telem = simulationEngine.getTelemetry();

    // Multimeter read calculation
    if (this.scopeRunning) {
      const ch1 = this.evaluateSignal(this.scopeCh1Source, telem);
      const ch2 = this.evaluateSignal(this.scopeCh2Source, telem);

      this.waveformBuffer.push({
        timeSec: telem.simTimeSec,
        ch1Val: ch1,
        ch2Val: ch2,
      });

      if (this.waveformBuffer.length > this.maxBufferSize) {
        this.waveformBuffer.shift();
      }
    }

    // Blackbox Flight Data Logging
    if (this.isLogging) {
      this.logRecords.push({
        t: Number(telem.simTimeSec.toFixed(3)),
        rollDeg: Number(((telem.orientation.rollRad * 180) / Math.PI).toFixed(1)),
        pitchDeg: Number(((telem.orientation.pitchRad * 180) / Math.PI).toFixed(1)),
        yawDeg: Number(((telem.orientation.yawRad * 180) / Math.PI).toFixed(1)),
        m1Rpm: Math.round(telem.motorRpm[0]),
        m2Rpm: Math.round(telem.motorRpm[1]),
        m3Rpm: Math.round(telem.motorRpm[2]),
        m4Rpm: Math.round(telem.motorRpm[3]),
        volts: Number(telem.batteryLoadedVoltageV.toFixed(2)),
        amps: Number(telem.batteryCurrentA.toFixed(2)),
        altM: Number(telem.position.y.toFixed(2)),
      });

      if (this.logRecords.length > 2000) {
        this.logRecords.shift();
      }
    }

    this.notify();
  }

  private evaluateSignal(source: ScopeChannelSource, telem: ReturnType<typeof simulationEngine.getTelemetry>): number {
    switch (source) {
      case 'M1_DSHOT':
        // Synthetic DShot PWM carrier burst modulated by motor RPM command
        return telem.motorPresent[0] && telem.armed
          ? (telem.motorRpm[0] / 35000) * 3.3 + (Math.sin(telem.simTimeSec * 1200) > 0 ? 0.4 : -0.4)
          : 0;
      case 'M2_DSHOT':
        return telem.motorPresent[1] && telem.armed
          ? (telem.motorRpm[1] / 35000) * 3.3 + (Math.sin(telem.simTimeSec * 1200) > 0 ? 0.4 : -0.4)
          : 0;
      case 'GYRO_ROLL_RATE':
        return (telem.angularVelocity.roll * 180) / Math.PI; // deg/sec
      case 'GYRO_PITCH_RATE':
        return (telem.angularVelocity.pitch * 180) / Math.PI;
      case 'BATTERY_VOLTAGE':
        return telem.batteryLoadedVoltageV;
      case 'ACCEL_Z':
        return telem.acceleration.y / 9.81; // In G's
      case 'TOTAL_CURRENT':
        return telem.batteryCurrentA;
      default:
        return 0;
    }
  }

  /**
   * Get live Multimeter reading based on active test point & mode
   */
  public getDmmReading(): { value: number; unit: string; description: string; status: 'ok' | 'open' | 'overload' } {
    if (this.dmmHold && this.dmmHoldValue !== null) {
      return { value: this.dmmHoldValue, unit: 'HOLD', description: 'Display Hold Active', status: 'ok' };
    }

    const telem = simulationEngine.getTelemetry();
    const isBatConnected = connectionGraph.isBatteryPowered();

    switch (this.dmmTestPoint) {
      case 'BAT_XT60':
        if (!isBatConnected) {
          return { value: 0.0, unit: 'V DC', description: 'XT60 Circuit Open / Disconnected', status: 'open' };
        }
        return {
          value: Number(telem.batteryLoadedVoltageV.toFixed(2)),
          unit: 'V DC',
          description: `Loaded Battery Terminal Voltage (${telem.batterySocPercent.toFixed(0)}% SOC)`,
          status: 'ok',
        };

      case 'ESC_TOTAL_CURRENT':
        if (!isBatConnected) {
          return { value: 0.0, unit: 'A DC', description: '0 Amps (Circuit Disconnected)', status: 'open' };
        }
        return {
          value: Number(telem.batteryCurrentA.toFixed(2)),
          unit: 'A DC',
          description: 'Total Instantaneous Power Draw Through ESC Shunt',
          status: 'ok',
        };

      case 'FC_5V_REG':
        if (!isBatConnected) {
          return { value: 0.0, unit: 'V DC', description: 'BEC Unpowered', status: 'open' };
        }
        return {
          value: 4.98,
          unit: 'V DC',
          description: 'SpeedyBee F405 Integrated 5V 2A Regulated Rail',
          status: 'ok',
        };

      case 'CURRENT_SHUNT_MV':
        if (!isBatConnected) return { value: 0, unit: 'mV', description: 'Shunt Unpowered', status: 'open' };
        // 2 mOhm shunt -> 2 mV per Amp
        return {
          value: Number((telem.batteryCurrentA * 2.0).toFixed(1)),
          unit: 'mV',
          description: 'Current Sense Resistor Voltage Drop (2.0 mΩ Shunt)',
          status: 'ok',
        };

      case 'MOTOR_1_PHASE':
      case 'MOTOR_2_PHASE':
      case 'MOTOR_3_PHASE':
      case 'MOTOR_4_PHASE': {
        const idx = Number(this.dmmTestPoint.replace('MOTOR_', '').replace('_PHASE', '')) - 1;
        const wired = connectionGraph.isMotorElectricallyConnected(idx);
        const present = telem.motorPresent[idx];
        if (!wired || !present) {
          return { value: 0, unit: 'V RMS', description: `Motor ${idx + 1} Phase Circuit Disconnected`, status: 'open' };
        }
        const duty = telem.motorRpm[idx] / 38000;
        const vRms = (telem.batteryLoadedVoltageV / Math.SQRT2) * duty;
        return {
          value: Number(vRms.toFixed(2)),
          unit: 'V RMS',
          description: `Motor ${idx + 1} Inverter 3-Phase Back-EMF Waveform RMS`,
          status: 'ok',
        };
      }

      default:
        return { value: 0, unit: 'V', description: 'High Impedance Probe', status: 'ok' };
    }
  }

  public toggleDmmHold() {
    this.dmmHold = !this.dmmHold;
    if (this.dmmHold) {
      this.dmmHoldValue = this.getDmmReading().value;
    } else {
      this.dmmHoldValue = null;
    }
    this.notify();
  }

  public exportLogAsCsv(): string {
    if (this.logRecords.length === 0) return 'No log records available';
    const header = 'Time_s,Roll_deg,Pitch_deg,Yaw_deg,M1_RPM,M2_RPM,M3_RPM,M4_RPM,Voltage_V,Current_A,Altitude_m\n';
    const rows = this.logRecords
      .map(
        (r) =>
          `${r.t},${r.rollDeg},${r.pitchDeg},${r.yawDeg},${r.m1Rpm},${r.m2Rpm},${r.m3Rpm},${r.m4Rpm},${r.volts},${r.amps},${r.altM}`
      )
      .join('\n');
    return header + rows;
  }
}

export const instrumentEngine = new InstrumentEngine();
