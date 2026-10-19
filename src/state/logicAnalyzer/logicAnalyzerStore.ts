import { useSyncExternalStore } from 'react';
import {
  LogicAnalyzerState,
  LogicChannel,
  ProtocolType,
  DecodedPacket,
  ChannelWaveformData,
} from '../../core/logicAnalyzer/logicAnalyzerTypes';
import {
  generateAllProtocolsDataset,
  generateI2CTraffic,
  generateSPITraffic,
  generateUARTTraffic,
} from '../../core/logicAnalyzer/trafficGenerators';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { Connection } from '../../core/connections/Connection';

const initialChannels: LogicChannel[] = [
  { id: 'ch0_scl', name: 'SCL', color: '#eab308', role: 'scl', enabled: true },
  { id: 'ch1_sda', name: 'SDA', color: '#06b6d4', role: 'sda', enabled: true },
  { id: 'ch2_cs', name: 'CS#', color: '#f97316', role: 'cs', enabled: true },
  { id: 'ch3_sck', name: 'SCK', color: '#8b5cf6', role: 'sck', enabled: true },
  { id: 'ch4_mosi', name: 'MOSI', color: '#10b981', role: 'mosi', enabled: true },
  { id: 'ch5_miso', name: 'MISO', color: '#3b82f6', role: 'miso', enabled: true },
  { id: 'ch6_tx', name: 'TX', color: '#f59e0b', role: 'tx', enabled: true },
  { id: 'ch7_rx', name: 'RX', color: '#ec4899', role: 'rx', enabled: true },
];

const initialDataset = generateAllProtocolsDataset(115200);

let state: LogicAnalyzerState = {
  isOpen: false,
  isMinimized: false,
  isRunning: true,
  activeProtocol: 'all',
  baudRate: 115200,
  spiMode: 0,
  sampleRateKsps: 10000, // 10 MS/s
  timeWindowUs: 2500, // 2.5ms view window
  offsetUs: 0,
  channels: initialChannels,
  trigger: {
    mode: 'auto',
    channelId: 'ch0_scl',
    slope: 'falling',
    triggered: true,
  },
  searchFilter: '',
  selectedPacketId: null,
  selectedProtocolTab: 'all',
  autoScrollToLatest: true,
  packets: initialDataset.packets,
  waveforms: initialDataset.waveforms,
  totalCaptureTimeUs: initialDataset.totalTimeUs,
  cursorAUs: 320,
  cursorBUs: 980,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export const logicAnalyzerStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getState(): LogicAnalyzerState {
    return state;
  },

  openLogicAnalyzer(protocol?: ProtocolType) {
    state = {
      ...state,
      isOpen: true,
      isMinimized: false,
      activeProtocol: protocol || state.activeProtocol,
      selectedProtocolTab: protocol || state.selectedProtocolTab,
    };
    notify();
  },

  closeLogicAnalyzer() {
    state = { ...state, isOpen: false };
    notify();
  },

  toggleLogicAnalyzer() {
    state = { ...state, isOpen: !state.isOpen, isMinimized: false };
    notify();
  },

  toggleMinimized() {
    state = { ...state, isMinimized: !state.isMinimized };
    notify();
  },

  startCapture() {
    state = { ...state, isRunning: true };
    this.refreshCapture();
  },

  stopCapture() {
    state = { ...state, isRunning: false };
    notify();
  },

  toggleRun() {
    if (state.isRunning) {
      this.stopCapture();
    } else {
      this.startCapture();
    }
  },

  singleCapture() {
    state = { ...state, isRunning: false };
    this.refreshCapture();
  },

  setProtocol(protocol: ProtocolType) {
    state = {
      ...state,
      activeProtocol: protocol,
      selectedProtocolTab: protocol,
    };
    this.refreshCapture();
  },

  setProtocolTab(tab: 'all' | 'i2c' | 'spi' | 'uart') {
    state = { ...state, selectedProtocolTab: tab };
    notify();
  },

  setBaudRate(baud: number) {
    state = { ...state, baudRate: baud };
    this.refreshCapture();
  },

  setTimeWindow(us: number) {
    state = { ...state, timeWindowUs: Math.max(100, Math.min(100000, us)) };
    notify();
  },

  setOffset(us: number) {
    const maxOffset = Math.max(0, state.totalCaptureTimeUs - state.timeWindowUs);
    state = { ...state, offsetUs: Math.max(0, Math.min(maxOffset, us)) };
    notify();
  },

  zoomIn() {
    const newWindow = Math.max(200, state.timeWindowUs * 0.7);
    state = { ...state, timeWindowUs: newWindow };
    notify();
  },

  zoomOut() {
    const newWindow = Math.min(state.totalCaptureTimeUs * 1.5, state.timeWindowUs * 1.4);
    state = { ...state, timeWindowUs: newWindow };
    notify();
  },

  setSearchFilter(filter: string) {
    state = { ...state, searchFilter: filter };
    notify();
  },

  selectPacket(packetId: string | null) {
    state = { ...state, selectedPacketId: packetId };

    // Jump waveform view directly to the packet's timestamp
    if (packetId) {
      const pkg = state.packets.find((p) => p.id === packetId);
      if (pkg) {
        const centerUs = pkg.timestampUs - state.timeWindowUs * 0.25;
        const maxOffset = Math.max(0, state.totalCaptureTimeUs - state.timeWindowUs);
        state = {
          ...state,
          selectedPacketId: packetId,
          offsetUs: Math.max(0, Math.min(maxOffset, centerUs)),
        };
      }
    }

    notify();
  },

  setCursorA(us: number | null) {
    state = { ...state, cursorAUs: us };
    notify();
  },

  setCursorB(us: number | null) {
    state = { ...state, cursorBUs: us };
    notify();
  },

  toggleChannel(channelId: string) {
    const updated = state.channels.map((ch) =>
      ch.id === channelId ? { ...ch, enabled: !ch.enabled } : ch
    );
    state = { ...state, channels: updated };
    notify();
  },

  assignProbe(
    channelId: string,
    componentId: string,
    pinId: string,
    componentName?: string,
    pinName?: string
  ) {
    const updated = state.channels.map((ch) =>
      ch.id === channelId
        ? {
            ...ch,
            probeTarget: {
              componentId,
              pinId,
              componentName,
              pinName,
            },
          }
        : ch
    );
    state = { ...state, channels: updated };
    notify();
  },

  /**
   * Automatically scans project circuit and maps analyzer probes to active I2C/SPI/UART pins!
   */
  autoDetectCircuitProbes(components: VirtualComponent[], connections: Connection[]) {
    // 1. Look for I2C devices (OLED, MPU-6050, LCD1602, Arduino A4/A5)
    let sclTarget: LogicChannel['probeTarget'] = null;
    let sdaTarget: LogicChannel['probeTarget'] = null;

    const oled = components.find((c) => c.type === 'oled-display');
    const mpu = components.find((c) => c.type === 'mpu6050-sensor');
    const lcd = components.find((c) => c.type === 'lcd-1602');
    const arduino = components.find((c) => c.type === 'arduino-uno' || c.type === 'arduino-nano');

    if (oled) {
      sclTarget = { componentId: oled.id, pinId: 'scl', componentName: oled.name, pinName: 'SCL' };
      sdaTarget = { componentId: oled.id, pinId: 'sda', componentName: oled.name, pinName: 'SDA' };
    } else if (mpu) {
      sclTarget = { componentId: mpu.id, pinId: 'scl', componentName: mpu.name, pinName: 'SCL' };
      sdaTarget = { componentId: mpu.id, pinId: 'sda', componentName: mpu.name, pinName: 'SDA' };
    } else if (lcd) {
      sclTarget = { componentId: lcd.id, pinId: 'scl', componentName: lcd.name, pinName: 'SCL' };
      sdaTarget = { componentId: lcd.id, pinId: 'sda', componentName: lcd.name, pinName: 'SDA' };
    } else if (arduino) {
      sclTarget = { componentId: arduino.id, pinId: 'a5', componentName: arduino.name, pinName: 'A5 (SCL)' };
      sdaTarget = { componentId: arduino.id, pinId: 'a4', componentName: arduino.name, pinName: 'A4 (SDA)' };
    }

    // 2. Look for UART (Arduino D0/D1 or Raspberry Pi GPIO 14/15)
    let txTarget: LogicChannel['probeTarget'] = null;
    let rxTarget: LogicChannel['probeTarget'] = null;

    if (arduino) {
      txTarget = { componentId: arduino.id, pinId: 'd1', componentName: arduino.name, pinName: 'D1 (TX)' };
      rxTarget = { componentId: arduino.id, pinId: 'd0', componentName: arduino.name, pinName: 'D0 (RX)' };
    }

    // 3. Look for SPI (Arduino D10-D13 or TFT)
    let csTarget: LogicChannel['probeTarget'] = null;
    let sckTarget: LogicChannel['probeTarget'] = null;
    let mosiTarget: LogicChannel['probeTarget'] = null;
    let misoTarget: LogicChannel['probeTarget'] = null;

    if (arduino) {
      csTarget = { componentId: arduino.id, pinId: 'd10', componentName: arduino.name, pinName: 'D10 (SS)' };
      sckTarget = { componentId: arduino.id, pinId: 'd13', componentName: arduino.name, pinName: 'D13 (SCK)' };
      mosiTarget = { componentId: arduino.id, pinId: 'd11', componentName: arduino.name, pinName: 'D11 (MOSI)' };
      misoTarget = { componentId: arduino.id, pinId: 'd12', componentName: arduino.name, pinName: 'D12 (MISO)' };
    }

    const updated = state.channels.map((ch) => {
      if (ch.id === 'ch0_scl') return { ...ch, probeTarget: sclTarget || ch.probeTarget };
      if (ch.id === 'ch1_sda') return { ...ch, probeTarget: sdaTarget || ch.probeTarget };
      if (ch.id === 'ch2_cs') return { ...ch, probeTarget: csTarget || ch.probeTarget };
      if (ch.id === 'ch3_sck') return { ...ch, probeTarget: sckTarget || ch.probeTarget };
      if (ch.id === 'ch4_mosi') return { ...ch, probeTarget: mosiTarget || ch.probeTarget };
      if (ch.id === 'ch5_miso') return { ...ch, probeTarget: misoTarget || ch.probeTarget };
      if (ch.id === 'ch6_tx') return { ...ch, probeTarget: txTarget || ch.probeTarget };
      if (ch.id === 'ch7_rx') return { ...ch, probeTarget: rxTarget || ch.probeTarget };
      return ch;
    });

    state = { ...state, channels: updated };
    notify();
  },

  refreshCapture() {
    let dataset;
    if (state.activeProtocol === 'i2c') {
      dataset = generateI2CTraffic(50);
    } else if (state.activeProtocol === 'spi') {
      dataset = generateSPITraffic(50);
    } else if (state.activeProtocol === 'uart') {
      dataset = generateUARTTraffic(state.baudRate, 50);
    } else {
      dataset = generateAllProtocolsDataset(state.baudRate);
    }

    state = {
      ...state,
      packets: dataset.packets,
      waveforms: dataset.waveforms,
      totalCaptureTimeUs: dataset.totalTimeUs,
    };
    notify();
  },

  exportTraffic(format: 'json' | 'csv' | 'txt') {
    let content = '';
    let filename = `logic_analyzer_capture.${format}`;

    if (format === 'json') {
      content = JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          protocol: state.activeProtocol,
          baudRate: state.baudRate,
          packets: state.packets,
        },
        null,
        2
      );
    } else if (format === 'csv') {
      content = 'Index,Timestamp(us),Duration(us),Protocol,Type,Hex,Dec,ASCII,Description\n';
      state.packets.forEach((p, idx) => {
        content += `${idx + 1},${p.timestampUs},${p.durationUs},${p.protocol},${p.type},${p.hex},${p.dec},"${p.ascii || ''}","${p.description.replace(/"/g, '""')}"\n`;
      });
    } else {
      content = `=== IOT SIMULATION LAB LOGIC ANALYZER CAPTURE ===\n`;
      content += `Capture Protocol: ${state.activeProtocol.toUpperCase()}\n`;
      content += `Timestamp: ${new Date().toLocaleString()}\n`;
      content += `Total Packets: ${state.packets.length}\n\n`;
      state.packets.forEach((p, idx) => {
        content += `[#${(idx + 1).toString().padStart(3, '0')}] @ ${p.timestampUs}µs (+${p.durationUs}µs) | ${p.protocol.toUpperCase()} | ${p.type.padEnd(8)} | ${p.hex.padEnd(6)} | ${p.description}\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};

export function useLogicAnalyzer(): LogicAnalyzerState {
  return useSyncExternalStore(logicAnalyzerStore.subscribe, logicAnalyzerStore.getState);
}
