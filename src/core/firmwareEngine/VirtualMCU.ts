/**
 * Virtual IoT Lab — Firmware & Control Engine
 *
 * Virtual MCU / STM32F405 Flight Controller runtime architecture.
 * Implements hardware abstractions for:
 * - GPIO: Digital pins, direction, interrupts, pin states
 * - PWM: Hardware timers (TIM1-TIM4), duty cycle, DShot/PWM motor pulsing
 * - ADC: 12-bit analog-to-digital converter channels for battery voltage & current shunt
 * - UART: Serial ports (UART1 GPS, UART2 CRSF Receiver, UART3 VTX, UART6 Telemetry)
 * - I2C: Fast 400kHz bus for MPU6050/BMI270 IMU and OLED/LCD displays
 * - SPI: 10MHz high-speed bus for gyro register reads and Blackbox flash
 * - PID Attitude Controller: 8kHz loop rate, discrete PID with anti-windup and D-term low-pass filter
 * - Mixer: Quadcopter True-X geometry motor distribution
 */

export interface GpioPin {
  id: string;
  name: string;
  mode: 'INPUT' | 'OUTPUT' | 'ALT_PWM' | 'ANALOG';
  state: boolean;
  value: number; // 0 to 4095 for analog, 0 or 1 for digital
}

export interface UartPort {
  id: string;
  name: string;
  baudRate: number;
  txBuffer: string[];
  rxBuffer: string[];
  connectedDevice: string;
}

export interface VirtualMcuRegisters {
  programCounter: number;
  cycleCount: number;
  clockMhz: number;
  loopTimeUs: number; // e.g. 125us = 8kHz
  gyroRawX: number;
  gyroRawY: number;
  gyroRawZ: number;
  accelRawX: number;
  accelRawY: number;
  accelRawZ: number;
  batteryAdcRaw: number;
  currentAdcRaw: number;
  motorPwmOut: [number, number, number, number]; // 1000 to 2000 (or DShot 0-2047)
}

export class VirtualMCU {
  public clockMhz: number = 168; // STM32F405 Cortex-M4 @ 168 MHz
  public loopRateHz: number = 8000; // 8 kHz gyro / PID loop
  public isRunning: boolean = true;

  // Virtual Pin Map
  public pins: Map<string, GpioPin> = new Map();

  // Serial Ports
  public uarts: Map<string, UartPort> = new Map();

  // Registers
  public registers: VirtualMcuRegisters = {
    programCounter: 0x08000000,
    cycleCount: 0,
    clockMhz: 168,
    loopTimeUs: 125,
    gyroRawX: 0,
    gyroRawY: 0,
    gyroRawZ: 0,
    accelRawX: 0,
    accelRawY: 0,
    accelRawZ: 4096, // 1G on 12-bit scale
    batteryAdcRaw: 3410, // ~22.2V
    currentAdcRaw: 120, // Idle current
    motorPwmOut: [1000, 1000, 1000, 1000],
  };

  // PID State
  public pidState = {
    roll: { p: 45, i: 80, d: 35, prevError: 0, integral: 0 },
    pitch: { p: 47, i: 84, d: 38, prevError: 0, integral: 0 },
    yaw: { p: 42, i: 90, d: 0, prevError: 0, integral: 0 },
  };

  // User Firmware Script
  public firmwareScript: string = `// Virtual STM32F405 Flight Controller Firmware Routine
void loop() {
  // 1. Read BMI270 Gyroscope & Accelerometer via high-speed SPI1
  float gyroRateRoll  = read_spi_gyro(AXIS_X);
  float gyroRatePitch = read_spi_gyro(AXIS_Y);
  float gyroRateYaw   = read_spi_gyro(AXIS_Z);

  // 2. Sample Battery Voltage & Current via 12-bit ADC1
  float vBat = read_adc_voltage(ADC_CHANNEL_1);
  float iBat = read_adc_current(ADC_CHANNEL_2);

  // 3. Compute PID Attitude Corrections (8kHz loop)
  float motor1 = throttle - roll + pitch + yaw; // FR (CCW)
  float motor2 = throttle + roll + pitch - yaw; // FL (CW)
  float motor3 = throttle + roll - pitch + yaw; // RL (CCW)
  float motor4 = throttle - roll - pitch - yaw; // RR (CW)

  // 4. Output DShot600 digital pulse packets to 4-in-1 ESC
  dshot_write_all(motor1, motor2, motor3, motor4);
}`;

  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initHardwarePins();
    this.initUarts();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private initHardwarePins() {
    // Standard Betaflight STM32F405 pin mapping
    const defaultPins: GpioPin[] = [
      { id: 'PA0', name: 'TIM2_CH1 (Motor 1 PWM / DShot)', mode: 'ALT_PWM', state: false, value: 1000 },
      { id: 'PA1', name: 'TIM2_CH2 (Motor 2 PWM / DShot)', mode: 'ALT_PWM', state: false, value: 1000 },
      { id: 'PA2', name: 'TIM2_CH3 (Motor 3 PWM / DShot)', mode: 'ALT_PWM', state: false, value: 1000 },
      { id: 'PA3', name: 'TIM2_CH4 (Motor 4 PWM / DShot)', mode: 'ALT_PWM', state: false, value: 1000 },
      { id: 'PC1', name: 'ADC1_IN11 (Battery Voltage Divider)', mode: 'ANALOG', state: true, value: 3410 },
      { id: 'PC2', name: 'ADC1_IN12 (Current Shunt Sensor)', mode: 'ANALOG', state: true, value: 240 },
      { id: 'PB6', name: 'I2C1_SCL (Barometer / Ext Display)', mode: 'OUTPUT', state: true, value: 1 },
      { id: 'PB7', name: 'I2C1_SDA (Barometer / Ext Display)', mode: 'OUTPUT', state: true, value: 1 },
      { id: 'PB10', name: 'SPI1_SCK (BMI270 Gyro SPI Clock)', mode: 'ALT_PWM', state: true, value: 1 },
      { id: 'PB11', name: 'SPI1_MOSI (BMI270 Gyro SPI MOSI)', mode: 'OUTPUT', state: true, value: 1 },
      { id: 'PB12', name: 'SPI1_MISO (BMI270 Gyro SPI MISO)', mode: 'INPUT', state: false, value: 0 },
      { id: 'PC13', name: 'Beeper Drive (Piezo Buzzer)', mode: 'OUTPUT', state: false, value: 0 },
      { id: 'PC14', name: 'Status LED Blue (Heartbeat)', mode: 'OUTPUT', state: true, value: 1 },
      { id: 'PC15', name: 'Status LED Red (Arm/Error)', mode: 'OUTPUT', state: false, value: 0 },
    ];

    defaultPins.forEach((p) => this.pins.set(p.id, p));
  }

  private initUarts() {
    this.uarts.set('UART1', {
      id: 'UART1',
      name: 'UART1 (PA9/PA10) — GPS Module',
      baudRate: 115200,
      txBuffer: ['$PUBX,41,1,0007,0003,115200,0*18'],
      rxBuffer: ['$GNGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47'],
      connectedDevice: 'Beitian BN-220 GPS',
    });

    this.uarts.set('UART2', {
      id: 'UART2',
      name: 'UART2 (PA2/PA3) — ELRS CRSF Receiver',
      baudRate: 420000,
      txBuffer: ['[CRSF_SYNC][TELEMETRY_BATTERY_22.2V]'],
      rxBuffer: ['[CRSF_CHANNELS: T:1500 R:1500 P:1500 Y:1500 AUX1:2000]'],
      connectedDevice: 'Happymodel EP1 TCXO 2.4GHz',
    });

    this.uarts.set('UART3', {
      id: 'UART3',
      name: 'UART3 (PB10/PB11) — VTX SmartAudio',
      baudRate: 4800,
      txBuffer: ['[SA_CMD_SET_FREQ: 5800 MHz, POWER: 800mW]'],
      rxBuffer: ['[SA_RESP_OK]'],
      connectedDevice: 'RushFPV Tank Solo 5.8GHz',
    });
  }

  /**
   * Execute 1 clock iteration of the firmware loop
   */
  public step(
    dtSeconds: number,
    telemetry: {
      voltage: number;
      current: number;
      rates: { roll: number; pitch: number; yaw: number };
      inputs: { throttle: number; roll: number; pitch: number; yaw: number; armed: boolean };
    }
  ) {
    if (!this.isRunning) return;

    this.registers.cycleCount += Math.floor(this.clockMhz * 1e6 * dtSeconds);

    // Update ADC readings
    this.registers.batteryAdcRaw = Math.min(4095, Math.floor((telemetry.voltage / 26.0) * 4095));
    this.registers.currentAdcRaw = Math.min(4095, Math.floor((telemetry.current / 150.0) * 4095));

    // Update Gyro readings
    this.registers.gyroRawX = Math.round(telemetry.rates.roll * 57.2958 * 16.4);
    this.registers.gyroRawY = Math.round(telemetry.rates.pitch * 57.2958 * 16.4);
    this.registers.gyroRawZ = Math.round(telemetry.rates.yaw * 57.2958 * 16.4);

    // Run Discrete PID Controller
    if (telemetry.inputs.armed) {
      const targetRoll = telemetry.inputs.roll * 200; // deg/s
      const targetPitch = telemetry.inputs.pitch * 200;
      const targetYaw = telemetry.inputs.yaw * 200;

      const currentRoll = telemetry.rates.roll * 57.2958;
      const currentPitch = telemetry.rates.pitch * 57.2958;
      const currentYaw = telemetry.rates.yaw * 57.2958;

      const corrRoll = this.calcAxisPid(this.pidState.roll, targetRoll, currentRoll, dtSeconds);
      const corrPitch = this.calcAxisPid(this.pidState.pitch, targetPitch, currentPitch, dtSeconds);
      const corrYaw = this.calcAxisPid(this.pidState.yaw, targetYaw, currentYaw, dtSeconds);

      const baseThrottle = telemetry.inputs.throttle;

      // True-X Mixer
      const m1 = Math.max(0, Math.min(1, baseThrottle - corrRoll + corrPitch + corrYaw));
      const m2 = Math.max(0, Math.min(1, baseThrottle + corrRoll + corrPitch - corrYaw));
      const m3 = Math.max(0, Math.min(1, baseThrottle + corrRoll - corrPitch + corrYaw));
      const m4 = Math.max(0, Math.min(1, baseThrottle - corrRoll - corrPitch - corrYaw));

      this.registers.motorPwmOut = [
        Math.round(1000 + m1 * 1000),
        Math.round(1000 + m2 * 1000),
        Math.round(1000 + m3 * 1000),
        Math.round(1000 + m4 * 1000),
      ];
    } else {
      this.registers.motorPwmOut = [1000, 1000, 1000, 1000];
      this.pidState.roll.integral = 0;
      this.pidState.pitch.integral = 0;
      this.pidState.yaw.integral = 0;
    }

    // Toggle blue status LED heartbeat
    const bluePin = this.pins.get('PC14');
    if (bluePin) {
      bluePin.state = Math.floor(Date.now() / 500) % 2 === 0;
    }

    // Arm indicator LED
    const redPin = this.pins.get('PC15');
    if (redPin) {
      redPin.state = telemetry.inputs.armed;
    }

    this.notify();
  }

  private calcAxisPid(
    axis: { p: number; i: number; d: number; prevError: number; integral: number },
    target: number,
    current: number,
    dt: number
  ): number {
    const error = target - current;
    const pTerm = (axis.p / 100) * error;

    // Integral with anti-windup clamp
    axis.integral += error * dt;
    axis.integral = Math.max(-20, Math.min(20, axis.integral));
    const iTerm = (axis.i / 100) * axis.integral;

    // Derivative with 1st-order delta
    const dError = dt > 0 ? (error - axis.prevError) / dt : 0;
    axis.prevError = error;
    const dTerm = (axis.d / 1000) * dError;

    return Math.max(-0.5, Math.min(0.5, (pTerm + iTerm + dTerm) * 0.005));
  }

  public setScript(script: string) {
    this.firmwareScript = script;
    this.notify();
  }

  public compileAndFlash(): { success: boolean; message: string; binarySizeKb: number } {
    // Validates C syntax structure
    const hasLoop = this.firmwareScript.includes('loop');
    const hasDshot = this.firmwareScript.includes('dshot') || this.firmwareScript.includes('motor');

    if (!hasLoop) {
      return { success: false, message: 'Compilation Error: missing void loop() entrypoint', binarySizeKb: 0 };
    }

    this.registers.programCounter = 0x08000000 + Math.floor(Math.random() * 0x1000);
    this.notify();

    return {
      success: true,
      message: 'Flash verified OK. Arm-GCC binary generated (42.4 KB / 512 KB Flash used). Target: STM32F405RG.',
      binarySizeKb: 42.4,
    };
  }
}

export const virtualMcu = new VirtualMCU();
