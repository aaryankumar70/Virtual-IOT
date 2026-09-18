import { ComponentRegistry, ComponentDefinition } from '../registry/ComponentRegistry';
import { VirtualPin } from '../pins/VirtualPin';
import { VirtualConnector } from '../connections/VirtualConnector';

// 1. ARDUINO UNO
const arduinoConnectors: VirtualConnector[] = [
  {
    id: 'usb_b_port',
    name: 'USB-B Port',
    connectorType: 'usb-b',
    interfaceType: 'usb',
    gender: 'female',
    localPosition: { x: -2.8, y: 0.55, z: -1.6 },
    compatibleWith: ['usb-b-plug', 'usb-cable-b'],
    metadata: { label: 'USB 2.0 Client Port' },
  },
  {
    id: 'dc_barrel_jack',
    name: 'DC Barrel Jack (2.1mm)',
    connectorType: 'dc-barrel-jack',
    interfaceType: 'dc-power',
    gender: 'female',
    localPosition: { x: -2.6, y: 0.55, z: 1.6 },
    compatibleWith: ['dc-barrel-plug'],
    metadata: { label: '7-12V Power Input' },
  },
  {
    id: 'header_female_digital',
    name: 'Digital Pin Header (10-pin)',
    connectorType: 'header-female-10',
    interfaceType: 'header',
    gender: 'female',
    contactCount: 10,
    localPosition: { x: 0.4, y: 0.58, z: -2.2 },
    compatibleWith: ['header-male-10', 'header-male-4', 'module-header'],
    metadata: { label: 'Digital 10-Pin Socket' },
  },
  {
    id: 'header_female_analog',
    name: 'Power / Analog Header (8-pin)',
    connectorType: 'header-female-8',
    interfaceType: 'header',
    gender: 'female',
    contactCount: 8,
    localPosition: { x: 0.4, y: 0.58, z: 2.2 },
    compatibleWith: ['header-male-8', 'header-male-4', 'module-header'],
    metadata: { label: 'Power & Analog Socket' },
  },
];
const arduinoPins: VirtualPin[] = [
  // Top Digital Header
  { id: 'aref', name: 'AREF', type: 'analog', direction: 'input', localPosition: { x: -1.5, y: 0.58, z: -2.2 }, connectorStyle: 'header-pin' },
  { id: 'gnd_top', name: 'GND', type: 'ground', direction: 'power', localPosition: { x: -1.25, y: 0.58, z: -2.2 }, connectorStyle: 'header-pin' },
  { id: 'd13', name: 'D13 (SCK)', type: 'digital', direction: 'bidirectional', localPosition: { x: -1.0, y: 0.58, z: -2.2 }, connectorStyle: 'header-pin' },
  { id: 'd12', name: 'D12 (MISO)', type: 'digital', direction: 'bidirectional', localPosition: { x: -0.75, y: 0.58, z: -2.2 }, connectorStyle: 'header-pin' },
  { id: 'd11', name: 'D11 (PWM/MOSI)', type: 'pwm', direction: 'bidirectional', localPosition: { x: -0.5, y: 0.58, z: -2.2 }, connectorStyle: 'header-pin' },
  { id: 'd10', name: 'D10 (PWM/SS)', type: 'pwm', direction: 'bidirectional', localPosition: { x: -0.25, y: 0.58, z: -2.2 }, connectorStyle: 'header-pin' },
  { id: 'd9', name: 'D9 (PWM)', type: 'pwm', direction: 'bidirectional', localPosition: { x: 0.0, y: 0.58, z: -2.2 }, connectorStyle: 'header-pin' },
  { id: 'd8', name: 'D8', type: 'digital', direction: 'bidirectional', localPosition: { x: 0.25, y: 0.58, z: -2.2 }, connectorStyle: 'header-pin' },
  { id: 'd7', name: 'D7', type: 'digital', direction: 'bidirectional', localPosition: { x: 0.65, y: 0.58, z: -2.2 }, connectorStyle: 'header-pin' },
  { id: 'd6', name: 'D6 (PWM)', type: 'pwm', direction: 'bidirectional', localPosition: { x: 0.9, y: 0.58, z: -2.2 }, connectorStyle: 'header-pin' },
  { id: 'd5', name: 'D5 (PWM)', type: 'pwm', direction: 'bidirectional', localPosition: { x: 1.15, y: 0.58, z: -2.2 }, connectorStyle: 'header-pin' },
  { id: 'd4', name: 'D4', type: 'digital', direction: 'bidirectional', localPosition: { x: 1.4, y: 0.58, z: -2.2 }, connectorStyle: 'header-pin' },
  { id: 'd3', name: 'D3 (PWM)', type: 'pwm', direction: 'bidirectional', localPosition: { x: 1.65, y: 0.58, z: -2.2 }, connectorStyle: 'header-pin' },
  { id: 'd2', name: 'D2', type: 'digital', direction: 'bidirectional', localPosition: { x: 1.9, y: 0.58, z: -2.2 }, connectorStyle: 'header-pin' },
  { id: 'd1', name: 'D1 (TX)', type: 'communication', direction: 'output', localPosition: { x: 2.15, y: 0.58, z: -2.2 }, connectorStyle: 'header-pin' },
  { id: 'd0', name: 'D0 (RX)', type: 'communication', direction: 'input', localPosition: { x: 2.4, y: 0.58, z: -2.2 }, connectorStyle: 'header-pin' },

  // Bottom Power & Analog Header
  { id: 'ioref', name: 'IOREF', type: 'power', direction: 'power', localPosition: { x: -1.25, y: 0.58, z: 2.2 }, connectorStyle: 'header-pin' },
  { id: 'reset', name: 'RESET', type: 'digital', direction: 'input', localPosition: { x: -1.0, y: 0.58, z: 2.2 }, connectorStyle: 'header-pin' },
  { id: '3v3', name: '3.3V', type: 'power', direction: 'power', localPosition: { x: -0.75, y: 0.58, z: 2.2 }, connectorStyle: 'header-pin' },
  { id: '5v', name: '5V', type: 'power', direction: 'power', localPosition: { x: -0.5, y: 0.58, z: 2.2 }, connectorStyle: 'header-pin' },
  { id: 'gnd_1', name: 'GND 1', type: 'ground', direction: 'power', localPosition: { x: -0.25, y: 0.58, z: 2.2 }, connectorStyle: 'header-pin' },
  { id: 'gnd_2', name: 'GND 2', type: 'ground', direction: 'power', localPosition: { x: 0.0, y: 0.58, z: 2.2 }, connectorStyle: 'header-pin' },
  { id: 'vin', name: 'VIN', type: 'power', direction: 'power', localPosition: { x: 0.25, y: 0.58, z: 2.2 }, connectorStyle: 'header-pin' },
  { id: 'a0', name: 'A0', type: 'analog', direction: 'input', localPosition: { x: 0.75, y: 0.58, z: 2.2 }, connectorStyle: 'header-pin' },
  { id: 'a1', name: 'A1', type: 'analog', direction: 'input', localPosition: { x: 1.0, y: 0.58, z: 2.2 }, connectorStyle: 'header-pin' },
  { id: 'a2', name: 'A2', type: 'analog', direction: 'input', localPosition: { x: 1.25, y: 0.58, z: 2.2 }, connectorStyle: 'header-pin' },
  { id: 'a3', name: 'A3', type: 'analog', direction: 'input', localPosition: { x: 1.5, y: 0.58, z: 2.2 }, connectorStyle: 'header-pin' },
  { id: 'a4', name: 'A4 (SDA)', type: 'analog', direction: 'bidirectional', localPosition: { x: 1.75, y: 0.58, z: 2.2 }, connectorStyle: 'header-pin' },
  { id: 'a5', name: 'A5 (SCL)', type: 'analog', direction: 'bidirectional', localPosition: { x: 2.0, y: 0.58, z: 2.2 }, connectorStyle: 'header-pin' },
];

export const ArduinoUnoDefinition: ComponentDefinition = {
  type: 'arduino-uno',
  displayName: 'Arduino Uno R3',
  category: 'microcontroller',
  description: 'ATmega328P microcontroller development board with 14 digital I/O pins and 6 analog inputs.',
  manufacturer: 'Arduino',
  pins: arduinoPins,
  connectors: arduinoConnectors,
  defaultState: { powered: false, led13: false },
  dimensions: { width: 6.86, height: 0.4, depth: 5.34 },
};

// 2. LED
const ledPins: VirtualPin[] = [
  { id: 'anode', name: 'Anode (+)', type: 'power', direction: 'input', localPosition: { x: -0.22, y: 0.18, z: 0.0 }, connectorStyle: 'lead-tip' },
  { id: 'cathode', name: 'Cathode (-)', type: 'ground', direction: 'output', localPosition: { x: 0.22, y: 0.18, z: 0.0 }, connectorStyle: 'lead-tip' },
];

export const LEDDefinition: ComponentDefinition = {
  type: 'led',
  displayName: 'Standard 5mm LED',
  category: 'output',
  description: 'Light-emitting diode with standard 5mm diffused epoxy dome and anode/cathode leads.',
  pins: ledPins,
  defaultState: { lit: false, color: '#ef4444' },
  dimensions: { width: 0.9, height: 1.4, depth: 0.9 },
};

// 3. RESISTOR
const resistorPins: VirtualPin[] = [
  { id: 'pin1', name: 'Lead 1', type: 'digital', direction: 'bidirectional', localPosition: { x: -0.9, y: 0.18, z: 0.0 }, connectorStyle: 'lead-tip' },
  { id: 'pin2', name: 'Lead 2', type: 'digital', direction: 'bidirectional', localPosition: { x: 0.9, y: 0.18, z: 0.0 }, connectorStyle: 'lead-tip' },
];

export const ResistorDefinition: ComponentDefinition = {
  type: 'resistor',
  displayName: 'Resistor (220Ω)',
  category: 'passive',
  description: '1/4W axial carbon film resistor for current limiting and voltage division.',
  pins: resistorPins,
  defaultState: { resistance: 220 },
  dimensions: { width: 2.0, height: 0.45, depth: 0.45 },
};

// 4. BREADBOARD (Section 25 - Logical hole/pin model)
function generateBreadboardPins(): VirtualPin[] {
  const pins: VirtualPin[] = [];
  const rows = 12; // 12 columns/rows of 5 holes each side + power rails
  const xSpacing = 0.55;
  const zSpacing = 0.45;
  const xOffset = -((rows - 1) * xSpacing) / 2;

  // Power Rails Top: + (Red) and - (Blue)
  for (let r = 0; r < rows; r++) {
    const x = xOffset + r * xSpacing;
    pins.push({
      id: `rail_top_plus_${r}`,
      name: `Top Rail + (${r + 1})`,
      type: 'power',
      direction: 'bidirectional',
      localPosition: { x, y: 0.43, z: -1.75 },
      connectorStyle: 'breadboard-hole',
    });
    pins.push({
      id: `rail_top_minus_${r}`,
      name: `Top Rail - (${r + 1})`,
      type: 'ground',
      direction: 'bidirectional',
      localPosition: { x, y: 0.43, z: -1.35 },
      connectorStyle: 'breadboard-hole',
    });
  }

  // Terminal rows: Section A-E (z from -1.0 to -0.2) and F-J (z from 0.2 to 1.0)
  const colsAE = ['A', 'B', 'C', 'D', 'E'];
  const colsFJ = ['F', 'G', 'H', 'I', 'J'];

  for (let r = 1; r <= rows; r++) {
    const x = xOffset + (r - 1) * xSpacing;
    // A-E
    colsAE.forEach((col, idx) => {
      pins.push({
        id: `row_${r}_${col.toLowerCase()}`,
        name: `Row ${r} Pin ${col}`,
        type: 'digital',
        direction: 'bidirectional',
        localPosition: { x, y: 0.43, z: -0.95 + idx * zSpacing * 0.45 },
        connectorStyle: 'breadboard-hole',
      });
    });

    // F-J
    colsFJ.forEach((col, idx) => {
      pins.push({
        id: `row_${r}_${col.toLowerCase()}`,
        name: `Row ${r} Pin ${col}`,
        type: 'digital',
        direction: 'bidirectional',
        localPosition: { x, y: 0.43, z: 0.25 + idx * zSpacing * 0.45 },
        connectorStyle: 'breadboard-hole',
      });
    });
  }

  // Power Rails Bottom: + (Red) and - (Blue)
  for (let r = 0; r < rows; r++) {
    const x = xOffset + r * xSpacing;
    pins.push({
      id: `rail_bot_plus_${r}`,
      name: `Bottom Rail + (${r + 1})`,
      type: 'power',
      direction: 'bidirectional',
      localPosition: { x, y: 0.43, z: 1.35 },
      connectorStyle: 'breadboard-hole',
    });
    pins.push({
      id: `rail_bot_minus_${r}`,
      name: `Bottom Rail - (${r + 1})`,
      type: 'ground',
      direction: 'bidirectional',
      localPosition: { x, y: 0.43, z: 1.75 },
      connectorStyle: 'breadboard-hole',
    });
  }

  return pins;
}

export const BreadboardDefinition: ComponentDefinition = {
  type: 'breadboard',
  displayName: 'Half-Size Breadboard',
  category: 'prototyping',
  description: 'Solderless breadboard with dual power distribution buses and center divider for DIP ICs.',
  pins: generateBreadboardPins(),
  dimensions: { width: 7.5, height: 0.6, depth: 4.2 },
};

// 5. ESP32 NodeMCU
const esp32Pins: VirtualPin[] = [
  // Left Row
  { id: '3v3', name: '3V3', type: 'power', direction: 'power', localPosition: { x: -1.3, y: 0.48, z: -1.8 }, connectorStyle: 'header-pin' },
  { id: 'en', name: 'EN', type: 'digital', direction: 'input', localPosition: { x: -1.3, y: 0.48, z: -1.35 }, connectorStyle: 'header-pin' },
  { id: 'vp', name: 'VP (GPIO36)', type: 'analog', direction: 'input', localPosition: { x: -1.3, y: 0.48, z: -0.9 }, connectorStyle: 'header-pin' },
  { id: 'vn', name: 'VN (GPIO39)', type: 'analog', direction: 'input', localPosition: { x: -1.3, y: 0.48, z: -0.45 }, connectorStyle: 'header-pin' },
  { id: 'd34', name: 'D34', type: 'digital', direction: 'input', localPosition: { x: -1.3, y: 0.48, z: 0.0 }, connectorStyle: 'header-pin' },
  { id: 'd35', name: 'D35', type: 'digital', direction: 'input', localPosition: { x: -1.3, y: 0.48, z: 0.45 }, connectorStyle: 'header-pin' },
  { id: 'd32', name: 'D32', type: 'digital', direction: 'bidirectional', localPosition: { x: -1.3, y: 0.48, z: 0.9 }, connectorStyle: 'header-pin' },
  { id: 'd33', name: 'D33', type: 'digital', direction: 'bidirectional', localPosition: { x: -1.3, y: 0.48, z: 1.35 }, connectorStyle: 'header-pin' },
  { id: 'gnd_left', name: 'GND', type: 'ground', direction: 'power', localPosition: { x: -1.3, y: 0.48, z: 1.8 }, connectorStyle: 'header-pin' },

  // Right Row
  { id: 'vin_esp', name: 'VIN (5V)', type: 'power', direction: 'power', localPosition: { x: 1.3, y: 0.48, z: -1.8 }, connectorStyle: 'header-pin' },
  { id: 'gnd_right', name: 'GND', type: 'ground', direction: 'power', localPosition: { x: 1.3, y: 0.48, z: -1.35 }, connectorStyle: 'header-pin' },
  { id: 'd13_esp', name: 'D13', type: 'digital', direction: 'bidirectional', localPosition: { x: 1.3, y: 0.48, z: -0.9 }, connectorStyle: 'header-pin' },
  { id: 'd12_esp', name: 'D12', type: 'digital', direction: 'bidirectional', localPosition: { x: 1.3, y: 0.48, z: -0.45 }, connectorStyle: 'header-pin' },
  { id: 'd14_esp', name: 'D14', type: 'digital', direction: 'bidirectional', localPosition: { x: 1.3, y: 0.48, z: 0.0 }, connectorStyle: 'header-pin' },
  { id: 'd27_esp', name: 'D27', type: 'digital', direction: 'bidirectional', localPosition: { x: 1.3, y: 0.48, z: 0.45 }, connectorStyle: 'header-pin' },
  { id: 'd26_esp', name: 'D26', type: 'digital', direction: 'bidirectional', localPosition: { x: 1.3, y: 0.48, z: 0.9 }, connectorStyle: 'header-pin' },
  { id: 'd25_esp', name: 'D25', type: 'digital', direction: 'bidirectional', localPosition: { x: 1.3, y: 0.48, z: 1.35 }, connectorStyle: 'header-pin' },
  { id: 'd33_esp', name: 'D33', type: 'digital', direction: 'bidirectional', localPosition: { x: 1.3, y: 0.48, z: 1.8 }, connectorStyle: 'header-pin' },
];

const esp32Connectors: VirtualConnector[] = [
  {
    id: 'micro_usb_port',
    name: 'Micro-USB Port',
    connectorType: 'micro-usb',
    interfaceType: 'usb',
    gender: 'female',
    localPosition: { x: 0.0, y: 0.48, z: -2.3 },
    compatibleWith: ['micro-usb-plug', 'usb-cable-micro'],
    metadata: { label: '5V Power & UART Programming' },
  },
];

export const ESP32Definition: ComponentDefinition = {
  type: 'esp32',
  displayName: 'ESP32 NodeMCU',
  category: 'microcontroller',
  description: 'Dual-core Tensilica Xtensa 32-bit LX6 with integrated 2.4 GHz Wi-Fi and Bluetooth.',
  manufacturer: 'Espressif',
  pins: esp32Pins,
  connectors: esp32Connectors,
  defaultState: { powered: false },
  dimensions: { width: 3.2, height: 0.4, depth: 5.2 },
};

// 6. PUSH BUTTON
const buttonPins: VirtualPin[] = [
  { id: '1a', name: 'Pin 1A', type: 'digital', direction: 'bidirectional', localPosition: { x: -0.55, y: 0.2, z: -0.4 }, connectorStyle: 'lead-tip' },
  { id: '1b', name: 'Pin 1B', type: 'digital', direction: 'bidirectional', localPosition: { x: 0.55, y: 0.2, z: -0.4 }, connectorStyle: 'lead-tip' },
  { id: '2a', name: 'Pin 2A', type: 'digital', direction: 'bidirectional', localPosition: { x: -0.55, y: 0.2, z: 0.4 }, connectorStyle: 'lead-tip' },
  { id: '2b', name: 'Pin 2B', type: 'digital', direction: 'bidirectional', localPosition: { x: 0.55, y: 0.2, z: 0.4 }, connectorStyle: 'lead-tip' },
];

export const PushButtonDefinition: ComponentDefinition = {
  type: 'push-button',
  displayName: 'Tactile Push Button',
  category: 'input',
  description: '6x6mm SPST momentary tactile switch with 4 breadboard-friendly pins.',
  pins: buttonPins,
  defaultState: { pressed: false },
  dimensions: { width: 1.4, height: 0.8, depth: 1.4 },
};

// 7. BUZZER
const buzzerPins: VirtualPin[] = [
  { id: 'pos', name: 'Positive (+)', type: 'power', direction: 'input', localPosition: { x: -0.4, y: 0.15, z: 0.0 }, connectorStyle: 'lead-tip' },
  { id: 'neg', name: 'Negative (-)', type: 'ground', direction: 'output', localPosition: { x: 0.4, y: 0.15, z: 0.0 }, connectorStyle: 'lead-tip' },
];

export const BuzzerDefinition: ComponentDefinition = {
  type: 'buzzer',
  displayName: 'Piezo Buzzer',
  category: 'output',
  description: 'Electromagnetic active/passive audio transducer for audible frequency alerts.',
  pins: buzzerPins,
  defaultState: { active: false, frequency: 440 },
  dimensions: { width: 1.6, height: 1.1, depth: 1.6 },
};

// 8. RASPBERRY PI
const rpiPins: VirtualPin[] = [
  { id: 'pin_3v3', name: '3V3 Power', type: 'power', direction: 'power', localPosition: { x: -2.0, y: 0.68, z: -1.2 }, connectorStyle: 'header-pin' },
  { id: 'pin_5v_1', name: '5V Power 1', type: 'power', direction: 'power', localPosition: { x: -1.75, y: 0.68, z: -1.2 }, connectorStyle: 'header-pin' },
  { id: 'pin_sda', name: 'GPIO 2 (SDA)', type: 'digital', direction: 'bidirectional', localPosition: { x: -1.5, y: 0.68, z: -1.2 }, connectorStyle: 'header-pin' },
  { id: 'pin_scl', name: 'GPIO 3 (SCL)', type: 'digital', direction: 'bidirectional', localPosition: { x: -1.25, y: 0.68, z: -1.2 }, connectorStyle: 'header-pin' },
  { id: 'pin_gnd_1', name: 'GND', type: 'ground', direction: 'power', localPosition: { x: -1.0, y: 0.68, z: -1.2 }, connectorStyle: 'header-pin' },
  { id: 'pin_gpio4', name: 'GPIO 4', type: 'digital', direction: 'bidirectional', localPosition: { x: -0.75, y: 0.68, z: -1.2 }, connectorStyle: 'header-pin' },
  { id: 'pin_tx', name: 'GPIO 14 (TX)', type: 'communication', direction: 'output', localPosition: { x: -0.5, y: 0.68, z: -1.2 }, connectorStyle: 'header-pin' },
  { id: 'pin_rx', name: 'GPIO 15 (RX)', type: 'communication', direction: 'input', localPosition: { x: -0.25, y: 0.68, z: -1.2 }, connectorStyle: 'header-pin' },
];

const rpiConnectors: VirtualConnector[] = [
  {
    id: 'usb_c_power_jack',
    name: 'USB-C Power In (5V 3A)',
    connectorType: 'usb-c-power',
    interfaceType: 'usb',
    gender: 'female',
    localPosition: { x: -3.5, y: 0.6, z: 2.3 },
    direction: { x: 0, y: 0, z: 1 },
    compatibleWith: ['usb-c-plug'],
    metadata: { label: '5V 3A Power Input' },
  },
  {
    id: 'usb_a_port_1',
    name: 'USB 3.0 Port (Dual)',
    connectorType: 'usb-a',
    interfaceType: 'usb',
    gender: 'female',
    localPosition: { x: 3.8, y: 0.65, z: -0.9 },
    direction: { x: 1, y: 0, z: 0 },
    compatibleWith: ['usb-a-plug'],
    metadata: { label: 'USB 3.0 Host Port' },
  },
  {
    id: 'header_gpio_40',
    name: '40-Pin GPIO Header',
    connectorType: 'header-male-40',
    interfaceType: 'header',
    gender: 'male',
    contactCount: 40,
    localPosition: { x: -1.0, y: 0.72, z: -1.2 },
    compatibleWith: ['header-female-40', 'header-female-8', 'module-header'],
    metadata: { label: '40-Pin GPIO Header' },
  },
];

export const RaspberryPiDefinition: ComponentDefinition = {
  type: 'raspberry-pi',
  displayName: 'Raspberry Pi 4',
  category: 'board',
  description: 'Quad-core Cortex-A72 64-bit single-board computer with 40-pin GPIO header and dual 4K HDMI.',
  manufacturer: 'Raspberry Pi Foundation',
  pins: rpiPins,
  connectors: rpiConnectors,
  defaultState: { powered: false },
  dimensions: { width: 8.5, height: 1.2, depth: 5.6 },
};

// 9. RGB LED
const rgbLedPins: VirtualPin[] = [
  { id: 'red', name: 'Red Anode', type: 'power', direction: 'input', localPosition: { x: -0.3, y: 0.2, z: 0.0 }, connectorStyle: 'lead-tip' },
  { id: 'cathode', name: 'Common Cathode (-)', type: 'ground', direction: 'power', localPosition: { x: -0.1, y: 0.2, z: 0.0 }, connectorStyle: 'lead-tip' },
  { id: 'green', name: 'Green Anode', type: 'power', direction: 'input', localPosition: { x: 0.1, y: 0.2, z: 0.0 }, connectorStyle: 'lead-tip' },
  { id: 'blue', name: 'Blue Anode', type: 'power', direction: 'input', localPosition: { x: 0.3, y: 0.2, z: 0.0 }, connectorStyle: 'lead-tip' },
];

export const LEDRGBDefinition: ComponentDefinition = {
  type: 'led-rgb',
  displayName: 'LED (RGB)',
  category: 'output',
  description: 'Four-terminal tri-color diffused RGB LED with independent red, green, and blue color channels.',
  pins: rgbLedPins,
  defaultState: { r: 255, g: 0, b: 128 },
  dimensions: { width: 1.0, height: 1.4, depth: 1.0 },
};

// 10. ULTRASONIC SENSOR (HC-SR04)
const ultrasonicPins: VirtualPin[] = [
  { id: 'vcc', name: 'VCC (5V)', type: 'power', direction: 'power', localPosition: { x: -0.45, y: -0.3, z: 0.0 }, connectorStyle: 'lead-tip' },
  { id: 'trig', name: 'Trig', type: 'digital', direction: 'input', localPosition: { x: -0.15, y: -0.3, z: 0.0 }, connectorStyle: 'lead-tip' },
  { id: 'echo', name: 'Echo', type: 'digital', direction: 'output', localPosition: { x: 0.15, y: -0.3, z: 0.0 }, connectorStyle: 'lead-tip' },
  { id: 'gnd', name: 'GND', type: 'ground', direction: 'power', localPosition: { x: 0.45, y: -0.3, z: 0.0 }, connectorStyle: 'lead-tip' },
];

export const UltrasonicSensorDefinition: ComponentDefinition = {
  type: 'ultrasonic-sensor',
  displayName: 'Ultrasonic Sensor',
  category: 'sensor',
  description: 'HC-SR04 ultrasonic distance sensor with 40kHz sonar transmitter and receiver transducers.',
  pins: ultrasonicPins,
  defaultState: { distanceCm: 42 },
  dimensions: { width: 4.5, height: 2.0, depth: 1.5 },
};

// 11. TEMPERATURE SENSOR (TMP36)
const tempPins: VirtualPin[] = [
  { id: 'vcc', name: 'Vs (2.7-5.5V)', type: 'power', direction: 'power', localPosition: { x: -0.25, y: 0.15, z: 0.0 }, connectorStyle: 'lead-tip' },
  { id: 'vout', name: 'Vout (Analog)', type: 'analog', direction: 'output', localPosition: { x: 0.0, y: 0.15, z: 0.0 }, connectorStyle: 'lead-tip' },
  { id: 'gnd', name: 'GND', type: 'ground', direction: 'power', localPosition: { x: 0.25, y: 0.15, z: 0.0 }, connectorStyle: 'lead-tip' },
];

export const TemperatureSensorDefinition: ComponentDefinition = {
  type: 'temperature-sensor',
  displayName: 'Temperature Sensor',
  category: 'sensor',
  description: 'Precision analog linear temperature sensor outputting 10 mV/°C with calibrated scale.',
  pins: tempPins,
  defaultState: { tempC: 24.5 },
  dimensions: { width: 0.8, height: 1.2, depth: 0.8 },
};

// 12. SERVO MOTOR (SG90)
const servoPins: VirtualPin[] = [
  { id: 'gnd', name: 'GND (Brown)', type: 'ground', direction: 'power', localPosition: { x: -0.2, y: 0.15, z: 0.0 }, connectorStyle: 'lead-tip' },
  { id: 'vcc', name: 'VCC 5V (Red)', type: 'power', direction: 'power', localPosition: { x: 0.0, y: 0.15, z: 0.0 }, connectorStyle: 'lead-tip' },
  { id: 'sig', name: 'PWM Signal (Orange)', type: 'pwm', direction: 'input', localPosition: { x: 0.2, y: 0.15, z: 0.0 }, connectorStyle: 'lead-tip' },
];

export const ServoMotorDefinition: ComponentDefinition = {
  type: 'servo-motor',
  displayName: 'Servo Motor',
  category: 'output',
  description: 'Micro 9g SG90 positional actuator servo with rotational control between 0° and 180°.',
  pins: servoPins,
  defaultState: { angle: 90 },
  dimensions: { width: 2.3, height: 2.9, depth: 1.2 },
};

// 13. WORKSTATION PC / USB HOST
const computerConnectors: VirtualConnector[] = [
  {
    id: 'pc_usb_a_port',
    name: 'USB 3.0 Host Port',
    connectorType: 'usb-a',
    interfaceType: 'usb',
    gender: 'female',
    localPosition: { x: 1.8, y: 0.6, z: 0.0 },
    compatibleWith: ['usb-a-plug', 'usb-cable-a'],
    metadata: { label: '5V VBUS 1.5A Host Port' },
  },
];

export const ComputerHostDefinition: ComponentDefinition = {
  type: 'computer-host',
  displayName: 'Workstation PC',
  category: 'power',
  description: 'Host PC workstation providing regulated 5V USB VBUS power and serial interface.',
  pins: [],
  connectors: computerConnectors,
  defaultState: { powered: true },
  dimensions: { width: 4.2, height: 2.4, depth: 3.2 },
};

// 14. 9V DC POWER ADAPTER
const dcSupplyConnectors: VirtualConnector[] = [
  {
    id: 'dc_plug',
    name: '9V DC Barrel Plug (2.1mm)',
    connectorType: 'dc-barrel-plug',
    interfaceType: 'dc-power',
    gender: 'male',
    localPosition: { x: 1.1, y: 0.35, z: 0.0 },
    compatibleWith: ['dc-barrel-jack'],
    metadata: { label: '9V DC Center-Positive Plug' },
  },
];

export const DCPowerSupplyDefinition: ComponentDefinition = {
  type: 'dc-power-supply',
  displayName: '9V DC Power Adapter',
  category: 'power',
  description: 'Regulated 9V DC 1A power adapter with standard 2.1mm center-positive male barrel plug.',
  pins: [],
  connectors: dcSupplyConnectors,
  defaultState: { powered: true, voltage: 9.0 },
  dimensions: { width: 2.5, height: 1.6, depth: 2.2 },
};

// 15. DHT11 SENSOR MODULE (With 4-Pin Male Header)
const dht11Pins: VirtualPin[] = [
  { id: 'vcc', name: 'VCC (3-5V)', type: 'power', direction: 'power', localPosition: { x: -0.45, y: 0.35, z: 0.45 }, connectorStyle: 'lead-tip' },
  { id: 'data', name: 'DATA', type: 'digital', direction: 'bidirectional', localPosition: { x: -0.15, y: 0.35, z: 0.45 }, connectorStyle: 'lead-tip' },
  { id: 'nc', name: 'NC', type: 'digital', direction: 'bidirectional', localPosition: { x: 0.15, y: 0.35, z: 0.45 }, connectorStyle: 'lead-tip' },
  { id: 'gnd', name: 'GND', type: 'ground', direction: 'power', localPosition: { x: 0.45, y: 0.35, z: 0.45 }, connectorStyle: 'lead-tip' },
];

const dht11Connectors: VirtualConnector[] = [
  {
    id: 'dht11_male_header',
    name: '4-Pin Male Pin Header',
    connectorType: 'header-male-4',
    interfaceType: 'header',
    gender: 'male',
    contactCount: 4,
    localPosition: { x: 0.0, y: 0.1, z: 0.45 },
    compatibleWith: ['header-female-8', 'header-female-10', 'module-header', 'breadboard-socket'],
    metadata: { label: '4-Pin 2.54mm Pitch Header' },
  },
];

export const DHT11SensorDefinition: ComponentDefinition = {
  type: 'dht11-sensor',
  displayName: 'DHT11 Sensor Breakout',
  category: 'sensor',
  description: 'Digital humidity and temperature module with integrated 4-pin 0.1" male header.',
  pins: dht11Pins,
  connectors: dht11Connectors,
  defaultState: { humidity: 45, temperature: 23 },
  dimensions: { width: 1.8, height: 2.2, depth: 1.4 },
};

// 16. USB A-TO-B CABLE
const usbCableConnectors: VirtualConnector[] = [
  {
    id: 'plug_usb_a',
    name: 'USB-A Male Plug',
    connectorType: 'usb-a-plug',
    interfaceType: 'usb',
    gender: 'male',
    localPosition: { x: -1.5, y: 0.3, z: 0.0 },
    direction: { x: -1, y: 0, z: 0 },
    compatibleWith: ['usb-a'],
    metadata: { label: 'USB 2.0 Host Plug' },
  },
  {
    id: 'plug_usb_b',
    name: 'USB-B Male Plug',
    connectorType: 'usb-b-plug',
    interfaceType: 'usb',
    gender: 'male',
    localPosition: { x: 1.5, y: 0.3, z: 0.0 },
    direction: { x: 1, y: 0, z: 0 },
    compatibleWith: ['usb-b'],
    metadata: { label: 'USB 2.0 Device Plug' },
  },
];

export const USBCableDefinition: ComponentDefinition = {
  type: 'usb-cable',
  displayName: 'USB Cable (A-to-B)',
  category: 'communication',
  description: 'Molded USB 2.0 A-to-B interface cable connecting computer host to Arduino Uno.',
  pins: [],
  connectors: usbCableConnectors,
  dimensions: { width: 3.2, height: 0.6, depth: 1.2 },
};

// Register all definitions into ComponentRegistry
export function registerAllComponents() {
  ComponentRegistry.register(ArduinoUnoDefinition);
  ComponentRegistry.register(ESP32Definition);
  ComponentRegistry.register(RaspberryPiDefinition);
  ComponentRegistry.register(BreadboardDefinition);
  ComponentRegistry.register(LEDDefinition);
  ComponentRegistry.register(LEDRGBDefinition);
  ComponentRegistry.register(ResistorDefinition);
  ComponentRegistry.register(PushButtonDefinition);
  ComponentRegistry.register(BuzzerDefinition);
  ComponentRegistry.register(UltrasonicSensorDefinition);
  ComponentRegistry.register(TemperatureSensorDefinition);
  ComponentRegistry.register(ServoMotorDefinition);
  ComponentRegistry.register(ComputerHostDefinition);
  ComponentRegistry.register(DCPowerSupplyDefinition);
  ComponentRegistry.register(DHT11SensorDefinition);
  ComponentRegistry.register(USBCableDefinition);
}

// Call on startup
registerAllComponents();
