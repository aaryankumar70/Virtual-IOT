import { VirtualComponent } from '../components/VirtualComponent';
import { Connection } from '../connections/Connection';
import { OscilloscopeSignalEngine, EvaluatedSignal } from '../oscilloscope/OscilloscopeSignalEngine';
import { evaluateGateOutput, LOGIC_GATES_INFO, LogicGateType } from '../logic/logicGatesEngine';

export interface PinSignalInfo {
  pinId: string;
  pinName: string;
  pinType: string;
  color: string;
  evaluator: (t: number) => number;
  patternType: string;
  nominalVoltage: number;
  nominalFrequency: number;
  nominalDuty: number;
  isHigh: boolean;
  unit: string;
}

export interface ComponentSignalProfile {
  componentId: string;
  componentName: string;
  componentType: string;
  description: string;
  pins: PinSignalInfo[];
  primaryPinIds: string[];
}

// Curated distinctive signal trace colors for Recharts
const SIGNAL_COLORS = [
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#f97316', // Orange
  '#14b8a6', // Teal
];

export class ComponentSignalResolver {
  /**
   * Resolves the real-time signal profile for a given component in the circuit.
   */
  public static resolveComponentSignals(
    component: VirtualComponent,
    allComponents: VirtualComponent[],
    connections: Connection[]
  ): ComponentSignalProfile {
    const isLogicGate = component.type.startsWith('gate-');

    // 1. Logic Gates (AND, OR, XOR, NOT, NAND, NOR, XNOR)
    if (isLogicGate) {
      return this.resolveLogicGateSignals(component, allComponents, connections);
    }

    // 2. LED
    if (component.type === 'led' || component.type === 'led-rgb') {
      return this.resolveLEDSignals(component, allComponents, connections);
    }

    // 3. Resistor & Capacitors
    if (component.type === 'resistor' || component.type === 'capacitor' || component.type === 'capacitor-ceramic') {
      return this.resolvePassiveSignals(component, allComponents, connections);
    }

    // 4. Arduino / ESP32 / Raspberry Pi
    if (
      component.type === 'arduino-uno' ||
      component.type === 'arduino-nano' ||
      component.type === 'esp32' ||
      component.type === 'raspberry-pi'
    ) {
      return this.resolveMicrocontrollerSignals(component, allComponents, connections);
    }

    // 5. Breadboard
    if (component.type === 'breadboard') {
      return this.resolveBreadboardSignals(component, allComponents, connections);
    }

    // 6. Generic or Sensor / Instrument component
    return this.resolveGenericComponentSignals(component, allComponents, connections);
  }

  /**
   * Logic Gate Signal Resolver
   */
  private static resolveLogicGateSignals(
    component: VirtualComponent,
    allComponents: VirtualComponent[],
    connections: Connection[]
  ): ComponentSignalProfile {
    const info = LOGIC_GATES_INFO[component.type as LogicGateType] || LOGIC_GATES_INFO['gate-and'];

    // Check manual toggle states in component.state first
    let inputA = !!component.state?.inputA;
    let inputB = !!component.state?.inputB;

    // Check circuit connections
    const isPinConnectedTo = (pinId: string, keyword: string) => {
      return connections.some((c) => {
        const isSrc = c.source.componentId === component.id && (c.source.pinId === pinId || c.source.interfaceId === pinId);
        const isTgt = c.target.componentId === component.id && (c.target.pinId === pinId || c.target.interfaceId === pinId);
        if (!isSrc && !isTgt) return false;
        const otherEp = isSrc ? c.target : c.source;
        const otherPinId = (otherEp.pinId || otherEp.interfaceId || '').toLowerCase();
        return otherPinId.includes(keyword);
      });
    };

    if (isPinConnectedTo('pin_in_a', '5v') || isPinConnectedTo('pin_in_a', 'plus') || isPinConnectedTo('pin_in_a', 'vcc')) {
      inputA = true;
    } else if (isPinConnectedTo('pin_in_a', 'gnd') || isPinConnectedTo('pin_in_a', 'minus')) {
      inputA = false;
    }

    if (info.inputsCount === 2) {
      if (isPinConnectedTo('pin_in_b', '5v') || isPinConnectedTo('pin_in_b', 'plus') || isPinConnectedTo('pin_in_b', 'vcc')) {
        inputB = true;
      } else if (isPinConnectedTo('pin_in_b', 'gnd') || isPinConnectedTo('pin_in_b', 'minus')) {
        inputB = false;
      }
    }

    const outputY = evaluateGateOutput(component.type, inputA, inputB);

    const pins: PinSignalInfo[] = [
      {
        pinId: 'pin_in_a',
        pinName: 'Input A',
        pinType: 'digital-in',
        color: '#06b6d4',
        evaluator: () => (inputA ? 5.0 : 0.0) + (Math.random() - 0.5) * 0.015,
        patternType: inputA ? 'Logic HIGH (5.0V)' : 'Logic LOW (0.0V)',
        nominalVoltage: inputA ? 5.0 : 0.0,
        nominalFrequency: 0,
        nominalDuty: inputA ? 100 : 0,
        isHigh: inputA,
        unit: 'V',
      },
    ];

    if (info.inputsCount === 2) {
      pins.push({
        pinId: 'pin_in_b',
        pinName: 'Input B',
        pinType: 'digital-in',
        color: '#8b5cf6',
        evaluator: () => (inputB ? 5.0 : 0.0) + (Math.random() - 0.5) * 0.015,
        patternType: inputB ? 'Logic HIGH (5.0V)' : 'Logic LOW (0.0V)',
        nominalVoltage: inputB ? 5.0 : 0.0,
        nominalFrequency: 0,
        nominalDuty: inputB ? 100 : 0,
        isHigh: inputB,
        unit: 'V',
      });
    }

    pins.push({
      pinId: 'pin_out_y',
      pinName: 'Output Y',
      pinType: 'digital-out',
      color: '#10b981',
      evaluator: () => (outputY ? 5.0 : 0.0) + (Math.random() - 0.5) * 0.015,
      patternType: outputY ? 'Logic HIGH (5.0V Output)' : 'Logic LOW (0.0V Output)',
      nominalVoltage: outputY ? 5.0 : 0.0,
      nominalFrequency: 0,
      nominalDuty: outputY ? 100 : 0,
      isHigh: outputY,
      unit: 'V',
    });

    pins.push({
      pinId: 'pin_vcc',
      pinName: 'VCC (5V)',
      pinType: 'power',
      color: '#ef4444',
      evaluator: (t) => 5.0 + Math.sin(t * 1000) * 0.01 + (Math.random() - 0.5) * 0.005,
      patternType: 'DC 5.0V Supply',
      nominalVoltage: 5.0,
      nominalFrequency: 0,
      nominalDuty: 100,
      isHigh: true,
      unit: 'V',
    });

    pins.push({
      pinId: 'pin_gnd',
      pinName: 'GND (0V)',
      pinType: 'ground',
      color: '#64748b',
      evaluator: () => (Math.random() - 0.5) * 0.004,
      patternType: 'Ground Reference',
      nominalVoltage: 0.0,
      nominalFrequency: 0,
      nominalDuty: 0,
      isHigh: false,
      unit: 'V',
    });

    return {
      componentId: component.id,
      componentName: `${component.name} (${info.chipModel})`,
      componentType: component.type,
      description: `${info.booleanEquation} — ${info.description}`,
      pins,
      primaryPinIds: info.inputsCount === 2 ? ['pin_in_a', 'pin_in_b', 'pin_out_y'] : ['pin_in_a', 'pin_out_y'],
    };
  }

  /**
   * LED Signal Resolver
   */
  private static resolveLEDSignals(
    component: VirtualComponent,
    allComponents: VirtualComponent[],
    connections: Connection[]
  ): ComponentSignalProfile {
    // Check if anode and cathode are connected to power/gnd or PWM
    const isWiredToPwm = connections.some((c) => {
      const isSrc = c.source.componentId === component.id;
      const isTgt = c.target.componentId === component.id;
      if (!isSrc && !isTgt) return false;
      const ep = isSrc ? c.target : c.source;
      const pinLower = (ep.pinId || ep.interfaceId || '').toLowerCase();
      return pinLower.includes('d9') || pinLower.includes('d10') || pinLower.includes('pwm');
    });

    const isWiredToVcc = connections.some((c) => {
      const isSrc = c.source.componentId === component.id;
      const isTgt = c.target.componentId === component.id;
      if (!isSrc && !isTgt) return false;
      const ep = isSrc ? c.target : c.source;
      const pinLower = (ep.pinId || ep.interfaceId || '').toLowerCase();
      return pinLower.includes('5v') || pinLower.includes('plus') || pinLower.includes('vcc');
    });

    const freq = 490;
    const vFwd = 2.1; // Forward drop for LED

    const anodeEvaluator = isWiredToPwm
      ? (t: number) => {
          const period = 1 / freq;
          const phase = (t % period) / period;
          const isHigh = phase < 0.55;
          return isHigh ? 5.0 + (Math.random() - 0.5) * 0.02 : 0.02;
        }
      : isWiredToVcc
      ? (t: number) => 5.0 + (Math.random() - 0.5) * 0.01
      : () => 0.05 + (Math.random() - 0.5) * 0.01;

    const cathodeEvaluator = () => (Math.random() - 0.5) * 0.005;

    const vDropEvaluator = (t: number) => {
      const a = anodeEvaluator(t);
      const k = cathodeEvaluator();
      return Math.max(0, Math.min(vFwd, a - k));
    };

    const pins: PinSignalInfo[] = [
      {
        pinId: 'anode',
        pinName: 'Anode (+)',
        pinType: 'anode',
        color: '#10b981',
        evaluator: anodeEvaluator,
        patternType: isWiredToPwm ? 'PWM Pulsed (490Hz)' : isWiredToVcc ? 'DC 5.0V Active' : 'Idle / Floating',
        nominalVoltage: isWiredToPwm ? 2.75 : isWiredToVcc ? 5.0 : 0.0,
        nominalFrequency: isWiredToPwm ? 490 : 0,
        nominalDuty: isWiredToPwm ? 55 : isWiredToVcc ? 100 : 0,
        isHigh: isWiredToVcc || isWiredToPwm,
        unit: 'V',
      },
      {
        pinId: 'cathode',
        pinName: 'Cathode (-)',
        pinType: 'cathode',
        color: '#64748b',
        evaluator: cathodeEvaluator,
        patternType: 'Ground Reference (0V)',
        nominalVoltage: 0.0,
        nominalFrequency: 0,
        nominalDuty: 0,
        isHigh: false,
        unit: 'V',
      },
      {
        pinId: 'v_drop',
        pinName: 'Forward Drop (Vf)',
        pinType: 'differential',
        color: '#06b6d4',
        evaluator: vDropEvaluator,
        patternType: isWiredToPwm ? 'Pulsed Forward Bias (~2.1V)' : isWiredToVcc ? 'Steady Forward Bias (2.1V)' : 'Zero Bias (0.0V)',
        nominalVoltage: isWiredToVcc || isWiredToPwm ? vFwd : 0.0,
        nominalFrequency: isWiredToPwm ? 490 : 0,
        nominalDuty: isWiredToPwm ? 55 : isWiredToVcc ? 100 : 0,
        isHigh: isWiredToVcc || isWiredToPwm,
        unit: 'V',
      },
    ];

    return {
      componentId: component.id,
      componentName: component.name,
      componentType: component.type,
      description: `Semiconductor diode with ~${vFwd}V forward voltage drop and photon emission.`,
      pins,
      primaryPinIds: ['anode', 'v_drop'],
    };
  }

  /**
   * Passive Components (Resistors & Capacitors)
   */
  private static resolvePassiveSignals(
    component: VirtualComponent,
    allComponents: VirtualComponent[],
    connections: Connection[]
  ): ComponentSignalProfile {
    const isCap = component.type.includes('capacitor');
    const resistance = (component.state?.resistance as number) || 220;

    // Check if connected to an RC filter circuit
    const freq = 490;
    const tau = 0.0006; // RC time constant ~0.6ms

    const evaluatorPin1 = (t: number) => {
      const period = 1 / freq;
      const phase = (t % period) / period;
      return (phase < 0.5 ? 5.0 : 0.0) + (Math.random() - 0.5) * 0.015;
    };

    const evaluatorPin2 = (t: number) => {
      if (isCap) {
        // RC exponential charging/discharging curve
        const period = 1 / freq;
        const phase = (t % period) / period;
        const duty = 0.5;
        if (phase < duty) {
          return 5.0 * (1 - Math.exp(-((phase * period) / tau))) + (Math.random() - 0.5) * 0.01;
        } else {
          const peak = 5.0 * (1 - Math.exp(-((duty * period) / tau)));
          return peak * Math.exp(-(((phase - duty) * period) / tau)) + (Math.random() - 0.5) * 0.01;
        }
      }
      return 2.5 + Math.sin(t * 2 * Math.PI * freq) * 1.8 + (Math.random() - 0.5) * 0.02;
    };

    const pins: PinSignalInfo[] = [
      {
        pinId: component.pins[0]?.id || 'pin1',
        pinName: component.pins[0]?.name || 'Terminal 1',
        pinType: 'terminal',
        color: '#06b6d4',
        evaluator: evaluatorPin1,
        patternType: 'Square Wave Input (490Hz)',
        nominalVoltage: 2.5,
        nominalFrequency: freq,
        nominalDuty: 50,
        isHigh: true,
        unit: 'V',
      },
      {
        pinId: component.pins[1]?.id || 'pin2',
        pinName: component.pins[1]?.name || 'Terminal 2',
        pinType: 'terminal',
        color: '#f59e0b',
        evaluator: evaluatorPin2,
        patternType: isCap ? 'Exponential RC Filter Curve' : 'Attenuated Voltage Drop',
        nominalVoltage: 2.1,
        nominalFrequency: freq,
        nominalDuty: 50,
        isHigh: true,
        unit: 'V',
      },
    ];

    return {
      componentId: component.id,
      componentName: component.name,
      componentType: component.type,
      description: isCap
        ? 'Charge storage device with exponential charging/discharging dynamics'
        : `Linear current-limiting resistor (${resistance}Ω)`,
      pins,
      primaryPinIds: [pins[0].pinId, pins[1].pinId],
    };
  }

  /**
   * Microcontrollers (Arduino Uno, Nano, ESP32)
   */
  private static resolveMicrocontrollerSignals(
    component: VirtualComponent,
    allComponents: VirtualComponent[],
    connections: Connection[]
  ): ComponentSignalProfile {
    const isESP = component.type === 'esp32' || component.type === 'raspberry-pi';
    const vLogic = isESP ? 3.3 : 5.0;

    const pins: PinSignalInfo[] = [
      {
        pinId: 'd9',
        pinName: 'D9 (PWM 490Hz)',
        pinType: 'pwm',
        color: '#06b6d4',
        evaluator: (t) => {
          const period = 1 / 490;
          const phase = (t % period) / period;
          return (phase < 0.55 ? vLogic : 0.0) + (Math.random() - 0.5) * 0.015;
        },
        patternType: 'High-Frequency PWM (490Hz, 55% Duty)',
        nominalVoltage: vLogic * 0.55,
        nominalFrequency: 490,
        nominalDuty: 55,
        isHigh: true,
        unit: 'V',
      },
      {
        pinId: 'd13',
        pinName: 'D13 (SCK / 1Hz Blink)',
        pinType: 'digital',
        color: '#10b981',
        evaluator: (t) => {
          const isHigh = Math.sin(t * 2 * Math.PI * 1.0) > 0;
          return (isHigh ? vLogic : 0.0) + (Math.random() - 0.5) * 0.01;
        },
        patternType: 'Clock Pulse (1.0Hz Blink Cycle)',
        nominalVoltage: vLogic * 0.5,
        nominalFrequency: 1.0,
        nominalDuty: 50,
        isHigh: true,
        unit: 'V',
      },
      {
        pinId: 'a0',
        pinName: 'A0 (Analog In)',
        pinType: 'analog',
        color: '#f59e0b',
        evaluator: (t) => 2.4 + Math.sin(t * 8) * 0.8 + Math.cos(t * 30) * 0.2 + (Math.random() - 0.5) * 0.03,
        patternType: 'Sensor Analog Waveform (0–5V)',
        nominalVoltage: 2.4,
        nominalFrequency: 1.27,
        nominalDuty: 50,
        isHigh: false,
        unit: 'V',
      },
      {
        pinId: '5v',
        pinName: `${vLogic}V Power Rail`,
        pinType: 'power',
        color: '#ef4444',
        evaluator: (t) => vLogic + Math.sin(t * 80000) * 0.012 + (Math.random() - 0.5) * 0.005,
        patternType: `Clean DC ${vLogic}V Regulated Rail`,
        nominalVoltage: vLogic,
        nominalFrequency: 0,
        nominalDuty: 100,
        isHigh: true,
        unit: 'V',
      },
      {
        pinId: 'gnd',
        pinName: 'GND Reference',
        pinType: 'ground',
        color: '#64748b',
        evaluator: () => (Math.random() - 0.5) * 0.003,
        patternType: 'Ground Reference (0V)',
        nominalVoltage: 0.0,
        nominalFrequency: 0,
        nominalDuty: 0,
        isHigh: false,
        unit: 'V',
      },
    ];

    return {
      componentId: component.id,
      componentName: component.name,
      componentType: component.type,
      description: `${vLogic}V Microcontroller unit with PWM, digital GPIO, and ADC channels`,
      pins,
      primaryPinIds: ['d9', 'd13', 'a0'],
    };
  }

  /**
   * Breadboard Signal Resolver
   */
  private static resolveBreadboardSignals(
    component: VirtualComponent,
    allComponents: VirtualComponent[],
    connections: Connection[]
  ): ComponentSignalProfile {
    // Collect active rows with connections
    const activeRowColumns: number[] = [];
    connections.forEach((c) => {
      const p1 = c.source.componentId === component.id ? c.source.pinId || c.source.interfaceId : null;
      const p2 = c.target.componentId === component.id ? c.target.pinId || c.target.interfaceId : null;
      [p1, p2].forEach((p) => {
        if (p && p.startsWith('row_')) {
          const parts = p.split('_');
          const col = parseInt(parts[1], 10);
          if (!isNaN(col) && !activeRowColumns.includes(col)) {
            activeRowColumns.push(col);
          }
        }
      });
    });

    const pins: PinSignalInfo[] = [
      {
        pinId: 'rail_top_plus',
        pinName: 'Top Rail (+) 5V',
        pinType: 'power',
        color: '#ef4444',
        evaluator: (t) => 5.0 + Math.sin(t * 50000) * 0.01 + (Math.random() - 0.5) * 0.005,
        patternType: 'Regulated DC 5.0V Distribution Rail',
        nominalVoltage: 5.0,
        nominalFrequency: 0,
        nominalDuty: 100,
        isHigh: true,
        unit: 'V',
      },
      {
        pinId: 'rail_top_minus',
        pinName: 'Top Rail (-) GND',
        pinType: 'ground',
        color: '#64748b',
        evaluator: () => (Math.random() - 0.5) * 0.003,
        patternType: 'Continuous Ground Bus Bar',
        nominalVoltage: 0.0,
        nominalFrequency: 0,
        nominalDuty: 0,
        isHigh: false,
        unit: 'V',
      },
    ];

    // Add up to 3 active tie-point rows
    activeRowColumns.slice(0, 3).forEach((col, idx) => {
      const pinId = `row_${col}`;
      pins.push({
        pinId,
        pinName: `Row ${col} Net`,
        pinType: 'terminal',
        color: SIGNAL_COLORS[(idx + 2) % SIGNAL_COLORS.length],
        evaluator: (t) => {
          if (idx === 0) return 4.98 + (Math.random() - 0.5) * 0.02; // Logic HIGH net
          if (idx === 1) {
            const period = 1 / 490;
            const phase = (t % period) / period;
            return (phase < 0.5 ? 5.0 : 0.0) + (Math.random() - 0.5) * 0.02;
          }
          return 2.1 + Math.sin(t * 12) * 0.5 + (Math.random() - 0.5) * 0.03;
        },
        patternType: idx === 0 ? 'DC Active Net' : idx === 1 ? 'PWM Signal Net' : 'Analog Signal Net',
        nominalVoltage: idx === 0 ? 5.0 : idx === 1 ? 2.5 : 2.1,
        nominalFrequency: idx === 1 ? 490 : 0,
        nominalDuty: idx === 1 ? 50 : 100,
        isHigh: idx === 0,
        unit: 'V',
      });
    });

    return {
      componentId: component.id,
      componentName: component.name,
      componentType: component.type,
      description: 'Solderless breadboard distribution bus and tie-point strips',
      pins,
      primaryPinIds: pins.map((p) => p.pinId),
    };
  }

  /**
   * Generic Component Signal Resolver
   */
  private static resolveGenericComponentSignals(
    component: VirtualComponent,
    allComponents: VirtualComponent[],
    connections: Connection[]
  ): ComponentSignalProfile {
    const pins: PinSignalInfo[] = component.pins.slice(0, 6).map((pin, idx) => {
      const signal = OscilloscopeSignalEngine.resolveChannelSignal(
        { componentId: component.id, pinId: pin.id },
        allComponents,
        connections,
        { enabled: true, color: SIGNAL_COLORS[idx % SIGNAL_COLORS.length], voltsPerDiv: 1.0, offsetY: 0, coupling: 'dc', probeAttenuation: 1, label: pin.name || pin.id }
      );

      return {
        pinId: pin.id,
        pinName: pin.name || pin.id,
        pinType: pin.type,
        color: SIGNAL_COLORS[idx % SIGNAL_COLORS.length],
        evaluator: signal.voltageAtTime,
        patternType: signal.type,
        nominalVoltage: signal.nominalAmp,
        nominalFrequency: signal.nominalFreq,
        nominalDuty: signal.nominalDuty,
        isHigh: signal.nominalAmp > 2.5,
        unit: 'V',
      };
    });

    return {
      componentId: component.id,
      componentName: component.name,
      componentType: component.type,
      description: `Hardware module with ${component.pins.length} connectable terminal pins`,
      pins,
      primaryPinIds: pins.slice(0, 3).map((p) => p.pinId),
    };
  }
}
