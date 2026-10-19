import {
  DecodedPacket,
  DigitalTransition,
  ChannelWaveformData,
  ProtocolType,
} from './logicAnalyzerTypes';
import {
  toHexByte,
  toBinaryByte,
  toPrintableAscii,
  describeI2CPacket,
  describeSPIPacket,
  describeUARTPacket,
} from './protocolDecoders';

export interface ProtocolTrafficDataset {
  packets: DecodedPacket[];
  waveforms: Record<string, ChannelWaveformData>;
  totalTimeUs: number;
}

/**
 * Generates an I2C traffic stream with exact microsecond-level clock (SCL) and data (SDA) waveforms.
 */
export function generateI2CTraffic(startTimeUs: number = 200): ProtocolTrafficDataset {
  const sclTransitions: DigitalTransition[] = [{ timeUs: 0, val: 1 }];
  const sdaTransitions: DigitalTransition[] = [{ timeUs: 0, val: 1 }];
  const packets: DecodedPacket[] = [];

  let t = startTimeUs;
  const bitHalfPeriodUs = 5; // 100 kHz I2C (10µs clock period, 5µs half-period)

  const transactions = [
    // 1. OLED Display SSD1306 Initialization (Addr 0x3C Write)
    {
      addr: 0x3C,
      isWrite: true,
      bytes: [0x00, 0xAE, 0xD5, 0x80, 0xA8, 0x3F, 0x8D, 0x14, 0xAF],
      desc: 'SSD1306 OLED Display Init (Turn ON Display & Charge Pump)',
    },
    // 2. MPU-6050 Accelerometer / Gyroscope Read (Addr 0x68 Write + Read)
    {
      addr: 0x68,
      isWrite: true,
      bytes: [0x6B, 0x00], // Clear Sleep bit
      desc: 'MPU-6050 Wake Up (PWR_MGMT_1 = 0x00)',
    },
    {
      addr: 0x68,
      isWrite: false,
      bytes: [0x68], // WHO_AM_I response
      desc: 'MPU-6050 WHO_AM_I Register Verification (0x68)',
    },
    // 3. LCD1602 with I2C Backpack (Addr 0x27 Write)
    {
      addr: 0x27,
      isWrite: true,
      bytes: [0x48, 0x69, 0x21], // "Hi!"
      desc: 'LCD 1602 Character Print Command ("Hi!")',
    },
    // 4. OLED SSD1306 Data Burst
    {
      addr: 0x3C,
      isWrite: true,
      bytes: [0x40, 0xFF, 0x81, 0x81, 0xFF], // Rectangle icon bitmap
      desc: 'SSD1306 GDDRAM Graphics Bitmap Frame Buffer Write',
    },
  ];

  transactions.forEach((tx, txIndex) => {
    // Inter-transaction idle gap (40µs)
    t += 40;
    sclTransitions.push({ timeUs: t, val: 1 });
    sdaTransitions.push({ timeUs: t, val: 1 });

    // --- A. START Condition (SDA goes HIGH->LOW while SCL is HIGH) ---
    t += 5;
    const startPacketTime = t;
    sdaTransitions.push({ timeUs: t, val: 0 });
    t += 5;
    sclTransitions.push({ timeUs: t, val: 0 });

    packets.push({
      id: `i2c-start-${txIndex}`,
      timestampUs: startPacketTime,
      durationUs: 10,
      protocol: 'i2c',
      type: 'start',
      channelId: 'ch1_sda',
      hex: 'S',
      dec: 0,
      bin: 'START',
      description: 'I2C START Condition',
    });

    // Helper to send a byte (8 bits MSB first + 1 ACK bit)
    const sendByte = (byteVal: number, isAddressByte: boolean, byteIndex: number) => {
      const byteStartTime = t;
      const binStr = toBinaryByte(byteVal);

      for (let b = 7; b >= 0; b--) {
        const bit = ((byteVal >> b) & 1) as 0 | 1;
        // SDA changes while SCL is LOW
        sdaTransitions.push({ timeUs: t, val: bit });
        t += bitHalfPeriodUs;
        // SCL rises to HIGH for sampling
        sclTransitions.push({ timeUs: t, val: 1 });
        t += bitHalfPeriodUs;
        // SCL falls to LOW
        sclTransitions.push({ timeUs: t, val: 0 });
      }

      // 9th Clock: ACK (SDA driven LOW by slave)
      sdaTransitions.push({ timeUs: t, val: 0 });
      t += bitHalfPeriodUs;
      sclTransitions.push({ timeUs: t, val: 1 });
      t += bitHalfPeriodUs;
      sclTransitions.push({ timeUs: t, val: 0 });

      const byteDuration = t - byteStartTime;
      const type = isAddressByte ? 'address' : 'data';
      const desc = describeI2CPacket(type, byteVal, tx.addr, tx.isWrite, byteIndex);

      packets.push({
        id: `i2c-pkg-${txIndex}-${byteIndex}`,
        timestampUs: byteStartTime,
        durationUs: byteDuration,
        protocol: 'i2c',
        type,
        channelId: 'ch1_sda',
        hex: toHexByte(byteVal),
        dec: byteVal,
        bin: binStr,
        ascii: toPrintableAscii(byteVal),
        description: desc,
        ack: true,
        direction: tx.isWrite ? 'write' : 'read',
      });
    };

    // --- B. Address Byte (7-bit address + R/W bit) ---
    const addrByte = (tx.addr << 1) | (tx.isWrite ? 0 : 1);
    sendByte(addrByte, true, 0);

    // --- C. Data Payload Bytes ---
    tx.bytes.forEach((byteVal, bIdx) => {
      sendByte(byteVal, false, bIdx + 1);
    });

    // --- D. STOP Condition (SDA goes LOW->HIGH while SCL is HIGH) ---
    t += 2;
    sdaTransitions.push({ timeUs: t, val: 0 });
    t += 5;
    sclTransitions.push({ timeUs: t, val: 1 });
    t += 5;
    const stopPacketTime = t;
    sdaTransitions.push({ timeUs: t, val: 1 });

    packets.push({
      id: `i2c-stop-${txIndex}`,
      timestampUs: stopPacketTime,
      durationUs: 10,
      protocol: 'i2c',
      type: 'stop',
      channelId: 'ch1_sda',
      hex: 'P',
      dec: 0,
      bin: 'STOP',
      description: 'I2C STOP Condition',
    });
  });

  return {
    packets,
    waveforms: {
      ch0_scl: { channelId: 'ch0_scl', transitions: sclTransitions },
      ch1_sda: { channelId: 'ch1_sda', transitions: sdaTransitions },
    },
    totalTimeUs: t + 50,
  };
}

/**
 * Generates an SPI traffic stream with CS, SCK, MOSI, and MISO waveforms.
 */
export function generateSPITraffic(startTimeUs: number = 200): ProtocolTrafficDataset {
  const csTransitions: DigitalTransition[] = [{ timeUs: 0, val: 1 }];
  const sckTransitions: DigitalTransition[] = [{ timeUs: 0, val: 0 }];
  const mosiTransitions: DigitalTransition[] = [{ timeUs: 0, val: 0 }];
  const misoTransitions: DigitalTransition[] = [{ timeUs: 0, val: 0 }];
  const packets: DecodedPacket[] = [];

  let t = startTimeUs;
  const bitHalfPeriodUs = 1; // 500 kHz SPI (2µs clock period, 1µs half-period)

  const spiFrames = [
    // 1. Read JEDEC Manufacturer & Device ID (0x9F)
    {
      mosi: [0x9F, 0x00, 0x00, 0x00],
      miso: [0x00, 0xEF, 0x40, 0x18], // Winbond W25Q128 response
      desc: 'Read JEDEC Flash ID (Winbond W25Q128: 0xEF4018)',
    },
    // 2. Write Enable Command (0x06)
    {
      mosi: [0x06],
      miso: [0x00],
      desc: 'SPI Flash Write Enable (WREN)',
    },
    // 3. Read Status Register (0x05)
    {
      mosi: [0x05, 0x00],
      miso: [0x00, 0x02], // WEL=1 (Write Enabled)
      desc: 'Read Status Register (WEL=1, WIP=0 Ready)',
    },
    // 4. Page Program (0x02, Addr: 0x00 0x10 0x00, Data: 'I', 'O', 'T')
    {
      mosi: [0x02, 0x00, 0x10, 0x00, 0x49, 0x4F, 0x54],
      miso: [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
      desc: 'Page Program 3 Bytes to Flash 0x001000 ("IOT")',
    },
  ];

  spiFrames.forEach((frame, fIdx) => {
    t += 30; // Inter-frame idle gap

    // 1. Assert CS (Active LOW)
    t += 5;
    const csAssertTime = t;
    csTransitions.push({ timeUs: t, val: 0 });

    packets.push({
      id: `spi-cs-assert-${fIdx}`,
      timestampUs: csAssertTime,
      durationUs: 5,
      protocol: 'spi',
      type: 'cs-assert',
      channelId: 'ch2_cs',
      hex: 'CS_L',
      dec: 0,
      bin: '0',
      description: 'SPI Chip Select Asserted (LOW)',
      direction: 'mosi',
    });

    t += 5;

    // 2. Transfer bytes
    const maxLen = Math.max(frame.mosi.length, frame.miso.length);
    for (let byteIdx = 0; byteIdx < maxLen; byteIdx++) {
      const mosiVal = frame.mosi[byteIdx] ?? 0;
      const misoVal = frame.miso[byteIdx] ?? 0;
      const byteStartTime = t;

      for (let bitIdx = 7; bitIdx >= 0; bitIdx--) {
        const mosiBit = ((mosiVal >> bitIdx) & 1) as 0 | 1;
        const misoBit = ((misoVal >> bitIdx) & 1) as 0 | 1;

        mosiTransitions.push({ timeUs: t, val: mosiBit });
        misoTransitions.push({ timeUs: t, val: misoBit });
        sckTransitions.push({ timeUs: t, val: 0 });

        t += bitHalfPeriodUs;
        // Rising edge of SCK: data sampled (Mode 0)
        sckTransitions.push({ timeUs: t, val: 1 });
        t += bitHalfPeriodUs;
        // Falling edge of SCK
        sckTransitions.push({ timeUs: t, val: 0 });
      }

      const byteDuration = t - byteStartTime;
      packets.push({
        id: `spi-pkg-${fIdx}-${byteIdx}`,
        timestampUs: byteStartTime,
        durationUs: byteDuration,
        protocol: 'spi',
        type: 'data',
        channelId: 'ch4_mosi',
        hex: toHexByte(mosiVal),
        dec: mosiVal,
        bin: toBinaryByte(mosiVal),
        ascii: toPrintableAscii(mosiVal),
        misoHex: toHexByte(misoVal),
        misoDec: misoVal,
        misoAscii: toPrintableAscii(misoVal),
        description: describeSPIPacket(mosiVal, misoVal),
        direction: 'mosi',
      });

      t += 2; // Intra-byte gap
    }

    // 3. Deassert CS (HIGH)
    t += 5;
    const csDeassertTime = t;
    csTransitions.push({ timeUs: t, val: 1 });

    packets.push({
      id: `spi-cs-deassert-${fIdx}`,
      timestampUs: csDeassertTime,
      durationUs: 5,
      protocol: 'spi',
      type: 'cs-deassert',
      channelId: 'ch2_cs',
      hex: 'CS_H',
      dec: 1,
      bin: '1',
      description: 'SPI Chip Select Deasserted (HIGH)',
      direction: 'mosi',
    });
  });

  return {
    packets,
    waveforms: {
      ch2_cs: { channelId: 'ch2_cs', transitions: csTransitions },
      ch3_sck: { channelId: 'ch3_sck', transitions: sckTransitions },
      ch4_mosi: { channelId: 'ch4_mosi', transitions: mosiTransitions },
      ch5_miso: { channelId: 'ch5_miso', transitions: misoTransitions },
    },
    totalTimeUs: t + 50,
  };
}

/**
 * Generates an asynchronous UART serial traffic stream (8-N-1).
 */
export function generateUARTTraffic(
  baudRate: number = 115200,
  startTimeUs: number = 200
): ProtocolTrafficDataset {
  const txTransitions: DigitalTransition[] = [{ timeUs: 0, val: 1 }];
  const rxTransitions: DigitalTransition[] = [{ timeUs: 0, val: 1 }];
  const packets: DecodedPacket[] = [];

  const bitPeriodUs = Math.round(1000000 / baudRate); // e.g. 8.68µs at 115200 baud, 104µs at 9600 baud
  let t = startTimeUs;

  const messages = [
    { text: '[INIT] MCU Boot OK\r\n', channel: 'tx' as const },
    { text: 'AT+STATUS?\r\n', channel: 'rx' as const },
    { text: '+STATUS:READY,V=5.00V\r\n', channel: 'tx' as const },
  ];

  messages.forEach((msg, mIdx) => {
    t += bitPeriodUs * 4; // Idle period between messages
    const isTx = msg.channel === 'tx';
    const activeTransitions = isTx ? txTransitions : rxTransitions;
    const activeChannelId = isTx ? 'ch6_tx' : 'ch7_rx';

    for (let cIdx = 0; cIdx < msg.text.length; cIdx++) {
      const charCode = msg.text.charCodeAt(cIdx);
      const byteStartTime = t;

      // 1. START bit (LOW)
      activeTransitions.push({ timeUs: t, val: 0 });
      t += bitPeriodUs;

      // 2. 8 Data bits (LSB first)
      for (let bit = 0; bit < 8; bit++) {
        const bitVal = ((charCode >> bit) & 1) as 0 | 1;
        activeTransitions.push({ timeUs: t, val: bitVal });
        t += bitPeriodUs;
      }

      // 3. STOP bit (HIGH)
      activeTransitions.push({ timeUs: t, val: 1 });
      t += bitPeriodUs;

      // Inter-character spacing
      t += Math.round(bitPeriodUs * 0.5);

      const byteDuration = t - byteStartTime;
      packets.push({
        id: `uart-pkg-${mIdx}-${cIdx}`,
        timestampUs: byteStartTime,
        durationUs: byteDuration,
        protocol: 'uart',
        type: 'data',
        channelId: activeChannelId,
        hex: toHexByte(charCode),
        dec: charCode,
        bin: toBinaryByte(charCode),
        ascii: toPrintableAscii(charCode),
        description: `UART ${isTx ? 'TX' : 'RX'}: ${describeUARTPacket(charCode)}`,
        direction: isTx ? 'tx' : 'rx',
      });
    }
  });

  return {
    packets,
    waveforms: {
      ch6_tx: { channelId: 'ch6_tx', transitions: txTransitions },
      ch7_rx: { channelId: 'ch7_rx', transitions: rxTransitions },
    },
    totalTimeUs: t + 50,
  };
}

/**
 * Combines I2C, SPI, and UART traffic into a master dataset.
 */
export function generateAllProtocolsDataset(baudRate: number = 115200): ProtocolTrafficDataset {
  const i2c = generateI2CTraffic(100);
  const spi = generateSPITraffic(150);
  const uart = generateUARTTraffic(baudRate, 200);

  // Merge and sort packets chronologically
  const allPackets = [...i2c.packets, ...spi.packets, ...uart.packets].sort(
    (a, b) => a.timestampUs - b.timestampUs
  );

  const mergedWaveforms: Record<string, ChannelWaveformData> = {
    ...i2c.waveforms,
    ...spi.waveforms,
    ...uart.waveforms,
  };

  const totalTimeUs = Math.max(i2c.totalTimeUs, spi.totalTimeUs, uart.totalTimeUs);

  return {
    packets: allPackets,
    waveforms: mergedWaveforms,
    totalTimeUs,
  };
}
