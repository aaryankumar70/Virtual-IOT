import { ConnectionGraph } from '../connections/connectionGraph';
import { VirtualComponent } from '../components/VirtualComponent';
import { Connection } from '../connections/Connection';
import { ChannelSettings, ChannelMeasurements, SignalWaveformType } from './oscilloscopeTypes';

export interface EvaluatedSignal {
  voltageAtTime: (t: number) => number;
  type: string;
  nominalFreq: number;
  nominalAmp: number;
  nominalOffset: number;
  nominalDuty: number;
  sourceDescription: string;
}

export class OscilloscopeSignalEngine {
  /**
   * Analyzes the circuit and returns a signal evaluator for a specific channel probe.
   */
  public static resolveChannelSignal(
    probeTarget: { componentId: string; pinId: string } | null,
    components: VirtualComponent[],
    connections: Connection[],
    channelSettings: ChannelSettings
  ): EvaluatedSignal {
    // If channel has a manual generator mode override set
    if (channelSettings.generatorMode && channelSettings.generatorMode !== 'auto') {
      return this.createSyntheticSignal(
        channelSettings.generatorMode,
        channelSettings.generatorFrequency ?? 1000,
        channelSettings.generatorAmplitude ?? 5.0,
        channelSettings.generatorDutyCycle ?? 50,
        channelSettings.generatorOffset ?? 0.0,
        `Built-in Generator (${channelSettings.generatorMode.toUpperCase()})`
      );
    }

    if (!probeTarget) {
      return this.createFloatingProbeSignal('Probe Unconnected (Ambient Pickup)');
    }

    // 1. Build connection graph to resolve electrical net
    const graph = new ConnectionGraph(components, connections);
    const startEndpoint = {
      componentId: probeTarget.componentId,
      interfaceId: probeTarget.pinId,
      pinId: probeTarget.pinId,
      type: 'pin' as const,
    };

    const connectedEndpoints = [startEndpoint, ...graph.getConnectedEndpoints(startEndpoint)];

    // 2. Inspect all connected endpoints for known signal sources
    for (const ep of connectedEndpoints) {
      const comp = components.find((c) => c.id === ep.componentId);
      if (!comp) continue;

      const pinId = ep.pinId || ep.interfaceId || '';
      const pinIdLower = pinId.toLowerCase();
      const compType = comp.type;

      // A. Ground
      if (
        pinIdLower.includes('gnd') ||
        pinIdLower.includes('minus') ||
        pinIdLower.startsWith('rail_top_minus') ||
        pinIdLower.startsWith('rail_bot_minus')
      ) {
        return {
          voltageAtTime: () => (Math.random() - 0.5) * 0.003, // ~3mV thermal noise floor
          type: 'GND Reference',
          nominalFreq: 0,
          nominalAmp: 0,
          nominalOffset: 0,
          nominalDuty: 0,
          sourceDescription: `${comp.name} (${pinId.toUpperCase()})`,
        };
      }

      // B. Constant DC Power Rails (5V, 3.3V, 9V, 12V)
      if (
        pinIdLower.includes('5v') ||
        pinIdLower.includes('vcc') ||
        pinIdLower.startsWith('rail_top_plus') ||
        pinIdLower.startsWith('rail_bot_plus')
      ) {
        return {
          voltageAtTime: (t) => 5.0 + Math.sin(t * 2 * Math.PI * 100000) * 0.012 + (Math.random() - 0.5) * 0.005,
          type: 'DC 5.0V Rail',
          nominalFreq: 0,
          nominalAmp: 5.0,
          nominalOffset: 5.0,
          nominalDuty: 100,
          sourceDescription: `${comp.name} (+5V DC)`,
        };
      }

      if (pinIdLower.includes('3v3') || pinIdLower.includes('3.3v')) {
        return {
          voltageAtTime: (t) => 3.3 + Math.sin(t * 2 * Math.PI * 120000) * 0.008 + (Math.random() - 0.5) * 0.004,
          type: 'DC 3.3V Rail',
          nominalFreq: 0,
          nominalAmp: 3.3,
          nominalOffset: 3.3,
          nominalDuty: 100,
          sourceDescription: `${comp.name} (+3.3V DC)`,
        };
      }

      if (compType === 'lipo-battery') {
        return {
          voltageAtTime: (t) => 7.4 + Math.sin(t * 50) * 0.003,
          type: 'LiPo 7.4V DC',
          nominalFreq: 0,
          nominalAmp: 7.4,
          nominalOffset: 7.4,
          nominalDuty: 100,
          sourceDescription: 'LiPo Battery Pack (7.4V)',
        };
      }

      // C. Arduino / Microcontroller PWM Pins
      const isArduinoOrMcu = compType === 'arduino-uno' || compType === 'arduino-nano' || compType === 'esp32' || compType === 'raspberry-pi';
      const isPwmPin =
        pinIdLower === 'd3' ||
        pinIdLower === 'd5' ||
        pinIdLower === 'd6' ||
        pinIdLower === 'd9' ||
        pinIdLower === 'd10' ||
        pinIdLower === 'd11' ||
        pinIdLower.includes('pwm') ||
        pinIdLower === 'sig';

      if (isArduinoOrMcu && isPwmPin) {
        // High-frequency PWM: pins 5 & 6 are 980Hz, others 490Hz on Uno
        const freq = pinIdLower === 'd5' || pinIdLower === 'd6' ? 980 : 490;
        const vHigh = compType === 'esp32' || compType === 'raspberry-pi' ? 3.3 : 5.0;

        // Check if there is an RC capacitor filter connected on this net
        const hasCapacitor = connectedEndpoints.some((e) => {
          const otherComp = components.find((c) => c.id === e.componentId);
          return otherComp?.type === 'capacitor' || otherComp?.type === 'capacitor-ceramic';
        });

        if (hasCapacitor) {
          // RC Smoothed PWM Low-Pass Filter
          const tau = 0.0006; // RC time constant
          return {
            voltageAtTime: (t) => {
              const period = 1 / freq;
              const phase = (t % period) / period;
              const duty = 0.5;
              if (phase < duty) {
                return vHigh * (1 - Math.exp(-((phase * period) / tau))) + (Math.random() - 0.5) * 0.02;
              } else {
                const peak = vHigh * (1 - Math.exp(-((duty * period) / tau)));
                return peak * Math.exp(-(((phase - duty) * period) / tau)) + (Math.random() - 0.5) * 0.02;
              }
            },
            type: `Filtered PWM (${freq}Hz RC)`,
            nominalFreq: freq,
            nominalAmp: vHigh,
            nominalOffset: vHigh * 0.5,
            nominalDuty: 50,
            sourceDescription: `${comp.name} Pin ${pinId.toUpperCase()} with RC Filter`,
          };
        }

        // Standard Sharp Digital PWM Waveform
        return {
          voltageAtTime: (t) => {
            const period = 1 / freq;
            const subPhase = (t % period) / period;
            const duty = 0.55; // 55% PWM duty cycle
            const isHigh = subPhase < duty;
            // Add subtle rise time ringing & slight power noise
            const ring = isHigh ? Math.sin(subPhase * 400) * Math.exp(-subPhase * 100) * 0.15 : 0;
            return (isHigh ? vHigh : 0.0) + ring + (Math.random() - 0.5) * 0.01;
          },
          type: `PWM Signal (${freq}Hz)`,
          nominalFreq: freq,
          nominalAmp: vHigh,
          nominalOffset: vHigh / 2,
          nominalDuty: 55,
          sourceDescription: `${comp.name} Pin ${pinId.toUpperCase()} (PWM Output)`,
        };
      }

      // D. Arduino Blink Pin (D13)
      if (isArduinoOrMcu && pinIdLower === 'd13') {
        const freq = 1.0; // 1Hz LED blink
        return {
          voltageAtTime: (t) => {
            const isHigh = Math.sin(t * 2 * Math.PI * freq) > 0;
            return (isHigh ? 5.0 : 0.0) + (Math.random() - 0.5) * 0.015;
          },
          type: 'Digital Pulse (1Hz Blink)',
          nominalFreq: 1.0,
          nominalAmp: 5.0,
          nominalOffset: 2.5,
          nominalDuty: 50,
          sourceDescription: `${comp.name} Pin D13 (Blink)`,
        };
      }

      // E. Arduino Analog Pins (A0 - A5) or Sensors
      if (pinIdLower.startsWith('a') && pinIdLower.length <= 3 && isArduinoOrMcu) {
        return {
          voltageAtTime: (t) => {
            // Analog sensor reading: smooth sinusoidal wave 0.5V to 4.5V with harmonic
            const base = 2.5 + 1.8 * Math.sin(t * 2 * Math.PI * 250);
            const harmonic = 0.25 * Math.sin(t * 2 * Math.PI * 750);
            return base + harmonic + (Math.random() - 0.5) * 0.03;
          },
          type: 'Analog Signal (250Hz)',
          nominalFreq: 250,
          nominalAmp: 3.6,
          nominalOffset: 2.5,
          nominalDuty: 50,
          sourceDescription: `${comp.name} Pin ${pinId.toUpperCase()} (Analog Input)`,
        };
      }

      // F. Ultrasonic Sensor Echo Pin
      if (compType === 'ultrasonic-sensor') {
        return {
          voltageAtTime: (t) => {
            const burstPeriod = 0.06; // 60ms ping interval
            const localT = t % burstPeriod;
            if (localT < 0.002) {
              // 2ms echo high pulse (representing ~34cm distance)
              return 5.0 + (Math.random() - 0.5) * 0.02;
            }
            return (Math.random() - 0.5) * 0.005;
          },
          type: 'Ultrasonic Pulse (Echo)',
          nominalFreq: 16.6,
          nominalAmp: 5.0,
          nominalOffset: 0.2,
          nominalDuty: 3.3,
          sourceDescription: `${comp.name} (Echo Pulse)`,
        };
      }

      // G. Temperature Sensor Output
      if (compType === 'temperature-sensor') {
        const vTemp = 0.75; // 25°C = 750mV (10mV/°C)
        return {
          voltageAtTime: (t) => vTemp + Math.sin(t * 2) * 0.02 + (Math.random() - 0.5) * 0.008,
          type: 'Analog Temp Voltage (750mV)',
          nominalFreq: 0.3,
          nominalAmp: 0.04,
          nominalOffset: vTemp,
          nominalDuty: 50,
          sourceDescription: `${comp.name} (Vout)`,
        };
      }

      // H. Servo Motor PWM Control Signal (50Hz standard RC servo PWM)
      if (compType === 'servo-motor' || pinIdLower === 'servo') {
        const freq = 50; // 50Hz (20ms frame)
        const pulseWidth = 0.0015; // 1.5ms pulse (center 90° position)
        return {
          voltageAtTime: (t) => {
            const frameT = t % (1 / freq);
            const isHigh = frameT < pulseWidth;
            return (isHigh ? 5.0 : 0.0) + (Math.random() - 0.5) * 0.01;
          },
          type: 'Servo PWM (50Hz / 1.5ms)',
          nominalFreq: 50,
          nominalAmp: 5.0,
          nominalOffset: 0.375,
          nominalDuty: 7.5,
          sourceDescription: `${comp.name} (50Hz PWM)`,
        };
      }

      // I. Buzzer Audio Drive Signal
      if (compType === 'buzzer') {
        const freq = 2400; // 2.4kHz resonant piezo tone
        return {
          voltageAtTime: (t) => {
            const period = 1 / freq;
            const isHigh = (t % period) < period * 0.5;
            return (isHigh ? 5.0 : 0.0) + Math.sin(t * 2 * Math.PI * freq * 3) * 0.2;
          },
          type: 'Audio Tone (2.4kHz Buzzer)',
          nominalFreq: 2400,
          nominalAmp: 5.0,
          nominalOffset: 2.5,
          nominalDuty: 50,
          sourceDescription: `${comp.name} (Audio Output)`,
        };
      }

      // J. I2C Bus Signals (SDA / SCL)
      if (pinIdLower === 'sda' || pinIdLower === 'scl') {
        const isClock = pinIdLower === 'scl';
        const clkFreq = 100000; // 100kHz Standard I2C
        return {
          voltageAtTime: (t) => {
            // I2C packet transactions every 20ms
            const burstCycle = t % 0.02;
            const inBurst = burstCycle < 0.002; // 2ms transaction window
            if (!inBurst) return 5.0 + (Math.random() - 0.5) * 0.01; // I2C idle pulled high
            if (isClock) {
              const clkPhase = (burstCycle * clkFreq) % 1;
              return clkPhase < 0.5 ? 5.0 : 0.2;
            } else {
              // SDA pseudo-random data bits synchronized to clock
              const bit = Math.sin(burstCycle * clkFreq * 0.5 * Math.PI) > 0;
              return bit ? 4.9 : 0.2;
            }
          },
          type: isClock ? 'I2C Clock SCL (100kHz)' : 'I2C Data SDA Packet',
          nominalFreq: 100000,
          nominalAmp: 4.8,
          nominalOffset: 4.0,
          nominalDuty: 50,
          sourceDescription: `${comp.name} (${pinId.toUpperCase()} Bus)`,
        };
      }

      // H. Oscilloscope Built-in Probe Comp Test Lug (1kHz Square)
      if (compType === 'oscilloscope' && (pinIdLower.includes('comp') || pinIdLower.includes('test'))) {
        return {
          voltageAtTime: (t) => {
            const freq = 1000;
            const period = 1 / freq;
            const isHigh = (t % period) < period * 0.5;
            return isHigh ? 3.0 : 0.0;
          },
          type: 'Probe Comp (1kHz 3V Square)',
          nominalFreq: 1000,
          nominalAmp: 3.0,
          nominalOffset: 1.5,
          nominalDuty: 50,
          sourceDescription: 'Oscilloscope 1kHz Probe Test Lug',
        };
      }
    }

    // Default connected node without active generator
    const targetComp = components.find((c) => c.id === probeTarget.componentId);
    return {
      voltageAtTime: (t) => Math.sin(t * 2 * Math.PI * 60) * 0.08 + (Math.random() - 0.5) * 0.02,
      type: 'Passive Node (Low Impedance)',
      nominalFreq: 60,
      nominalAmp: 0.16,
      nominalOffset: 0,
      nominalDuty: 50,
      sourceDescription: `${targetComp?.name || 'Node'}: ${probeTarget.pinId}`,
    };
  }

  /**
   * Floating probe ungrounded (ambient 50/60Hz AC noise pickup)
   */
  private static createFloatingProbeSignal(description: string): EvaluatedSignal {
    return {
      voltageAtTime: (t) => {
        const hum = 0.22 * Math.sin(t * 2 * Math.PI * 60) + 0.06 * Math.sin(t * 2 * Math.PI * 180);
        const noise = (Math.random() - 0.5) * 0.04;
        return hum + noise;
      },
      type: 'Floating Probe (60Hz Hum)',
      nominalFreq: 60,
      nominalAmp: 0.44,
      nominalOffset: 0,
      nominalDuty: 50,
      sourceDescription: description,
    };
  }

  /**
   * Synthetic user-configured signal generator
   */
  public static createSyntheticSignal(
    mode: SignalWaveformType,
    freq: number,
    amp: number,
    duty: number,
    offset: number,
    description: string
  ): EvaluatedSignal {
    return {
      voltageAtTime: (t) => {
        const period = 1 / Math.max(0.1, freq);
        const phase = (t % period) / period;
        const halfAmp = amp / 2;

        switch (mode) {
          case 'sine':
            return offset + halfAmp * Math.sin(phase * 2 * Math.PI);

          case 'square':
          case 'pwm': {
            const isHigh = phase < duty / 100;
            return offset + (isHigh ? halfAmp : -halfAmp);
          }

          case 'triangle': {
            const tri = phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase;
            return offset + halfAmp * tri;
          }

          case 'rc': {
            const dFrac = duty / 100;
            if (phase < dFrac) {
              return offset + amp * (1 - Math.exp(-phase * 8));
            } else {
              return offset + amp * (1 - Math.exp(-dFrac * 8)) * Math.exp(-(phase - dFrac) * 8);
            }
          }

          case 'dc':
            return offset + amp;

          case 'noise':
            return offset + (Math.random() - 0.5) * amp;

          default:
            return offset + halfAmp * Math.sin(phase * 2 * Math.PI);
        }
      },
      type: `${mode.toUpperCase()} Wave (${freq >= 1000 ? `${(freq / 1000).toFixed(1)}kHz` : `${freq}Hz`})`,
      nominalFreq: freq,
      nominalAmp: amp,
      nominalOffset: offset,
      nominalDuty: duty,
      sourceDescription: description,
    };
  }

  /**
   * Samples a time window and calculates real-time electrical measurements
   */
  public static computeMeasurements(
    signal: EvaluatedSignal,
    windowStart: number,
    windowDuration: number,
    numSamples: number = 400
  ): ChannelMeasurements {
    let min = Infinity;
    let max = -Infinity;
    let sum = 0;
    let sumSquares = 0;

    const dt = windowDuration / numSamples;
    const values: number[] = [];

    for (let i = 0; i < numSamples; i++) {
      const t = windowStart + i * dt;
      const v = signal.voltageAtTime(t);
      values.push(v);
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v;
      sumSquares += v * v;
    }

    const vpp = max - min;
    const vavg = sum / numSamples;
    const vrms = Math.sqrt(sumSquares / numSamples);

    // Edge crossing detection for measured frequency and duty cycle
    let risingCrossings = 0;
    let highCount = 0;
    const midLevel = (max + min) / 2;

    for (let i = 1; i < values.length; i++) {
      if (values[i] >= midLevel) highCount++;
      if (values[i - 1] < midLevel && values[i] >= midLevel) {
        risingCrossings++;
      }
    }

    const measuredFreq = signal.nominalFreq > 0 ? signal.nominalFreq : risingCrossings > 1 ? (risingCrossings - 1) / windowDuration : 0;
    const measuredDuty = vpp > 0.1 ? (highCount / numSamples) * 100 : 0;

    return {
      vpp: Number(vpp.toFixed(3)),
      vmax: Number(max.toFixed(3)),
      vmin: Number(min.toFixed(3)),
      vrms: Number(vrms.toFixed(3)),
      vavg: Number(vavg.toFixed(3)),
      frequency: Number(measuredFreq.toFixed(1)),
      period: measuredFreq > 0 ? Number((1 / measuredFreq).toFixed(6)) : 0,
      dutyCycle: Number(measuredDuty.toFixed(1)),
      detectedType: signal.type,
      connectedSource: signal.sourceDescription,
    };
  }
}
