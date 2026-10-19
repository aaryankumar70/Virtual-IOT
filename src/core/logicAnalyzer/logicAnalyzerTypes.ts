export type ProtocolType = 'i2c' | 'spi' | 'uart' | 'all';

export type PacketType =
  | 'start'
  | 'stop'
  | 'address'
  | 'data'
  | 'ack'
  | 'nack'
  | 'cs-assert'
  | 'cs-deassert'
  | 'command'
  | 'parity-err'
  | 'framing-err';

export interface DecodedPacket {
  id: string;
  timestampUs: number; // Start timestamp in microseconds
  durationUs: number;  // Duration in microseconds
  protocol: 'i2c' | 'spi' | 'uart';
  type: PacketType;
  channelId?: string;
  hex: string;         // e.g. "0x3C", "0xAF"
  dec: number;         // e.g. 60, 175
  bin: string;         // e.g. "00111100"
  ascii?: string;      // e.g. "<", "h"
  description: string; // e.g. "SSD1306 Addr 0x3C (Write)", "Set Display ON"
  ack?: boolean;       // For I2C ACK (true) / NACK (false)
  direction?: 'read' | 'write' | 'tx' | 'rx' | 'mosi' | 'miso';
  misoHex?: string;    // For SPI simultaneous bidirectional bytes
  misoDec?: number;
  misoAscii?: string;
  error?: boolean;
}

export interface LogicChannel {
  id: string; // e.g. "ch0", "ch1", "ch2", "ch3"
  name: string; // e.g. "SCL", "SDA", "MOSI", "MISO", "SCK", "CS", "TX", "RX"
  color: string;
  role: 'scl' | 'sda' | 'mosi' | 'miso' | 'sck' | 'cs' | 'tx' | 'rx' | 'general';
  enabled: boolean;
  inverted?: boolean;
  probeTarget?: {
    componentId: string;
    pinId: string;
    componentName?: string;
    pinName?: string;
  } | null;
}

export interface DigitalTransition {
  timeUs: number;
  val: 0 | 1;
}

export interface ChannelWaveformData {
  channelId: string;
  transitions: DigitalTransition[];
}

export type TriggerMode = 'auto' | 'normal' | 'single';
export type TriggerSlope = 'rising' | 'falling' | 'either';

export interface LogicAnalyzerTrigger {
  mode: TriggerMode;
  channelId: string;
  slope: TriggerSlope;
  protocolFilter?: ProtocolType;
  addressFilter?: string; // e.g. "0x3C" or "0x68"
  triggered: boolean;
}

export interface LogicAnalyzerState {
  isOpen: boolean;
  isMinimized: boolean;
  isRunning: boolean;
  activeProtocol: ProtocolType;
  baudRate: number; // 9600, 19200, 38400, 57600, 115200
  spiMode: 0 | 1 | 2 | 3;
  sampleRateKsps: number; // 1000, 10000, 24000 (1MS/s to 24MS/s)
  timeWindowUs: number; // Horizontal zoom view range (e.g. 1000µs to 50000µs)
  offsetUs: number; // Horizontal pan scroll position in µs
  channels: LogicChannel[];
  trigger: LogicAnalyzerTrigger;
  searchFilter: string;
  selectedPacketId: string | null;
  selectedProtocolTab: 'all' | 'i2c' | 'spi' | 'uart';
  autoScrollToLatest: boolean;
  packets: DecodedPacket[];
  waveforms: Record<string, ChannelWaveformData>;
  totalCaptureTimeUs: number;
  cursorAUs: number | null;
  cursorBUs: number | null;
}
