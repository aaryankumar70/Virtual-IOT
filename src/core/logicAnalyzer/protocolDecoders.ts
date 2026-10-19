import { DecodedPacket, ProtocolType } from './logicAnalyzerTypes';

/**
 * Format helper for hexadecimal strings
 */
export function toHexByte(val: number): string {
  const clamped = Math.max(0, Math.min(255, Math.floor(val)));
  return `0x${clamped.toString(16).toUpperCase().padStart(2, '0')}`;
}

export function toBinaryByte(val: number): string {
  const clamped = Math.max(0, Math.min(255, Math.floor(val)));
  return clamped.toString(2).padStart(8, '0');
}

export function toPrintableAscii(val: number): string {
  if (val >= 32 && val <= 126) {
    return String.fromCharCode(val);
  }
  if (val === 10) return '\\n';
  if (val === 13) return '\\r';
  if (val === 9) return '\\t';
  return '·';
}

/**
 * SSD1306 OLED Command Dictionary
 */
const SSD1306_COMMANDS: Record<number, string> = {
  0xAE: 'Display OFF (Sleep)',
  0xAF: 'Display ON (Active)',
  0x81: 'Set Contrast Control',
  0xA4: 'Resume to RAM content',
  0xA5: 'Entire Display ON',
  0xA6: 'Normal Display (1=ON)',
  0xA7: 'Inverse Display',
  0x20: 'Set Memory Addressing Mode',
  0x21: 'Set Column Address',
  0x22: 'Set Page Address',
  0x40: 'Set Display Start Line (0)',
  0x8D: 'Charge Pump Setting',
  0x14: 'Enable Charge Pump',
  0xD5: 'Set Display Clock Divide',
  0xA8: 'Set Multiplex Ratio',
  0xD3: 'Set Display Offset',
  0xDA: 'Set COM Pins Config',
  0xDB: 'Set VCOMH Deselect Level',
};

/**
 * MPU6050 Register Dictionary
 */
const MPU6050_REGISTERS: Record<number, string> = {
  0x19: 'SMPLRT_DIV (Sample Rate)',
  0x1A: 'CONFIG (DLPF)',
  0x1B: 'GYRO_CONFIG',
  0x1C: 'ACCEL_CONFIG',
  0x23: 'FIFO_EN',
  0x38: 'INT_ENABLE',
  0x3B: 'ACCEL_XOUT_H',
  0x3C: 'ACCEL_XOUT_L',
  0x3D: 'ACCEL_YOUT_H',
  0x3E: 'ACCEL_YOUT_L',
  0x3F: 'ACCEL_ZOUT_H',
  0x40: 'ACCEL_ZOUT_L',
  0x41: 'TEMP_OUT_H',
  0x42: 'TEMP_OUT_L',
  0x43: 'GYRO_XOUT_H',
  0x44: 'GYRO_XOUT_L',
  0x6A: 'USER_CTRL',
  0x6B: 'PWR_MGMT_1 (Sleep / Wake)',
  0x6C: 'PWR_MGMT_2',
  0x75: 'WHO_AM_I (Device ID 0x68)',
};

/**
 * Known I2C Device Addresses
 */
export const I2C_KNOWN_DEVICES: Record<number, string> = {
  0x3C: 'SSD1306 OLED Display (0.96")',
  0x3D: 'SSD1306 OLED Alt Addr',
  0x68: 'MPU-6050 6-DOF IMU',
  0x69: 'MPU-6050 Alt Addr',
  0x27: 'PCF8574 LCD 1602 Backpack',
  0x3F: 'PCF8574A LCD 1602 Backpack',
  0x50: 'AT24C32 EEPROM',
  0x76: 'BMP280 Barometric Pressure',
  0x77: 'BME280 Environmental Sensor',
};

/**
 * Helper to build human-readable I2C packet descriptions
 */
export function describeI2CPacket(
  type: DecodedPacket['type'],
  byteVal: number,
  prevAddress: number | null,
  isWrite: boolean,
  byteIndexInTx: number
): string {
  if (type === 'start') return 'I2C START Condition';
  if (type === 'stop') return 'I2C STOP Condition';

  if (type === 'address') {
    const addr7 = byteVal >> 1;
    const rwStr = isWrite ? 'Write' : 'Read';
    const devName = I2C_KNOWN_DEVICES[addr7] || 'Unknown I2C Device';
    return `Addr ${toHexByte(addr7)} (${devName}) — ${rwStr}`;
  }

  // Data payload byte interpretation based on target device
  if (prevAddress === 0x3C || prevAddress === 0x3D) {
    // OLED SSD1306
    if (byteIndexInTx === 1) {
      if (byteVal === 0x00) return 'Control Byte: Co=0, D/C#=0 (Commands follow)';
      if (byteVal === 0x40) return 'Control Byte: Co=0, D/C#=1 (GDDRAM data follows)';
      if (byteVal === 0x80) return 'Control Byte: Single Command';
    }
    const cmdDesc = SSD1306_COMMANDS[byteVal];
    if (cmdDesc) return `Cmd: ${cmdDesc}`;
    return `OLED Data: ${toHexByte(byteVal)} (${toBinaryByte(byteVal)})`;
  }

  if (prevAddress === 0x68 || prevAddress === 0x69) {
    // MPU-6050
    if (byteIndexInTx === 1) {
      const regName = MPU6050_REGISTERS[byteVal];
      if (regName) return `Reg Address: ${regName}`;
    }
    if (byteVal === 0x00) return 'Val: 0x00 (Clear Sleep / Wake up)';
    if (byteVal === 0x68) return 'Val: 0x68 (WHO_AM_I Signature Match)';
    return `IMU Register Data: ${toHexByte(byteVal)}`;
  }

  if (prevAddress === 0x27 || prevAddress === 0x3F) {
    // LCD 1602 PCF8574
    const char = toPrintableAscii(byteVal);
    const rs = (byteVal & 0x01) ? 'RS=1 (Data)' : 'RS=0 (Cmd)';
    const en = (byteVal & 0x04) ? 'EN=1' : 'EN=0';
    const bl = (byteVal & 0x08) ? 'BL=ON' : 'BL=OFF';
    return `LCD Backpack: '${char}' (${rs}, ${en}, ${bl})`;
  }

  return `Payload Data: ${toHexByte(byteVal)} (${byteVal})`;
}

/**
 * Helper to build human-readable SPI packet descriptions
 */
export function describeSPIPacket(mosiVal: number, misoVal: number): string {
  const SPI_FLASH_CMDS: Record<number, string> = {
    0x06: 'WREN (Write Enable)',
    0x04: 'WRDI (Write Disable)',
    0x05: 'RDSR (Read Status Register)',
    0x01: 'WRSR (Write Status Register)',
    0x03: 'READ (Read Data Bytes)',
    0x0B: 'FAST_READ',
    0x02: 'PP (Page Program)',
    0x20: 'SE (Sector Erase 4KB)',
    0xD8: 'BE (Block Erase 64KB)',
    0xC7: 'CE (Chip Erase)',
    0x9F: 'RDID (Read JEDEC ID)',
    0xAB: 'Release Power Down / Device ID',
  };

  const cmd = SPI_FLASH_CMDS[mosiVal];
  if (cmd) {
    return `MOSI: ${cmd} | MISO: ${toHexByte(misoVal)}`;
  }

  const asciiMosi = toPrintableAscii(mosiVal);
  const asciiMiso = toPrintableAscii(misoVal);
  return `MOSI: ${toHexByte(mosiVal)} ('${asciiMosi}') | MISO: ${toHexByte(misoVal)} ('${asciiMiso}')`;
}

/**
 * Helper to build human-readable UART packet descriptions
 */
export function describeUARTPacket(byteVal: number): string {
  const ascii = toPrintableAscii(byteVal);
  if (byteVal === 10) return 'ASCII: Line Feed (\\n)';
  if (byteVal === 13) return 'ASCII: Carriage Return (\\r)';
  if (byteVal === 0) return 'ASCII: NULL (0x00)';
  return `Char: '${ascii}' (${toHexByte(byteVal)})`;
}
