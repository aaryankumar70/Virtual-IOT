import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// 7-segment digit lookup table (segments: a, b, c, d, e, f, g)
const SEGMENT_MAP: Record<string, number> = {
  '0': 0b0111111,
  '1': 0b0000110,
  '2': 0b1011011,
  '3': 0b1001111,
  '4': 0b1100110,
  '5': 0b1101101,
  '6': 0b1111101,
  '7': 0b0000111,
  '8': 0b1111111,
  '9': 0b1101111,
  'A': 0b1110111,
  'b': 0b1111100,
  'C': 0b0111001,
  'd': 0b1011110,
  'E': 0b1111001,
  'F': 0b1110001,
  '-': 0b1000000,
  ' ': 0b0000000,
  'o': 0b1100011, // degree
};

// 1. OLED Canvas Texture Hook (128x64 resolution, 256x128 canvas for high-DPI crispness)
export function useOLEDTexture(state?: {
  powered?: boolean;
  displayMode?: string;
  textLine1?: string;
  textLine2?: string;
  textLine3?: string;
  contrast?: number;
  invert?: boolean;
  color?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const [, setFrame] = useState(0);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    canvasRef.current = canvas;

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    textureRef.current = texture;

    let animId: number;
    let tick = 0;

    const render = () => {
      tick++;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const isPowered = state?.powered ?? true;
      const mode = state?.displayMode ?? 'telemetry';
      const oledColor = state?.color || '#38bdf8'; // electric cyan-blue default

      // Background (pitch black when powered, dull matte black when off)
      ctx.fillStyle = isPowered ? '#05070c' : '#090a0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!isPowered) {
        texture.needsUpdate = true;
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.fillStyle = oledColor;
      ctx.strokeStyle = oledColor;

      if (mode === 'telemetry') {
        // Status header
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.fillText('SSD1306 I2C 0x3C', 10, 16);
        ctx.beginPath();
        ctx.moveTo(10, 22);
        ctx.lineTo(246, 22);
        ctx.lineWidth = 1;
        ctx.stroke();

        // Battery icon
        ctx.strokeRect(210, 7, 24, 10);
        ctx.fillRect(235, 10, 2, 4);
        ctx.fillRect(212, 9, 16, 6);

        // Lines of live sensor telemetry
        ctx.font = '13px "JetBrains Mono", monospace';
        const line1 = state?.textLine1 || 'TEMP: 24.8 C';
        const line2 = state?.textLine2 || 'HUMI: 54.2 %';
        const line3 = state?.textLine3 || 'VCC : 3.29 V';
        ctx.fillText(line1, 14, 46);
        ctx.fillText(line2, 14, 66);
        ctx.fillText(line3, 14, 86);

        // Mini animated sine sparkline at bottom
        ctx.beginPath();
        for (let x = 14; x < 242; x += 2) {
          const y = 112 + Math.sin((x + tick * 3) * 0.08) * 8;
          if (x === 14) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (mode === 'wave') {
        // Fullscreen Oscilloscope / ECG Waveform
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.fillText('LIVE OSCILLOSCOPE CH1', 12, 16);
        ctx.fillText('2.0ms/div  500mV/div', 120, 16);

        // Grid dots
        ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
        for (let x = 10; x < 246; x += 20) {
          for (let y = 26; y < 120; y += 15) {
            ctx.fillRect(x, y, 1, 1);
          }
        }

        ctx.fillStyle = oledColor;
        ctx.beginPath();
        for (let x = 10; x < 246; x++) {
          const phase = (x + tick * 4) * 0.06;
          const y = 72 + Math.sin(phase) * 28 + Math.sin(phase * 2.3) * 10;
          if (x === 10) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (mode === 'logo') {
        // Retro Pixel Cyber Logo & Greeting
        ctx.font = 'bold 18px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('VIRTUAL IoT LAB', 128, 45);
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.fillText('ENGINEERING WORKBENCH', 128, 68);
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillText('Status: ONLINE [READY]', 128, 92);
        ctx.strokeRect(20, 10, 216, 108);
        ctx.strokeRect(23, 13, 210, 102);
        ctx.textAlign = 'left';
      } else {
        // Custom lines mode
        ctx.font = 'bold 14px "JetBrains Mono", monospace';
        ctx.fillText(state?.textLine1 || 'CUSTOM DISPLAY', 16, 36);
        ctx.font = '13px "JetBrains Mono", monospace';
        ctx.fillText(state?.textLine2 || 'TEXT LINE 2', 16, 64);
        ctx.fillText(state?.textLine3 || 'TEXT LINE 3', 16, 92);
        ctx.strokeRect(10, 10, 236, 108);
      }

      texture.needsUpdate = true;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      texture.dispose();
    };
  }, [state?.powered, state?.displayMode, state?.textLine1, state?.textLine2, state?.textLine3, state?.color]);

  return textureRef.current;
}

// 2. LCD 1602 Canvas Texture Hook (512x128 canvas for high-DPI character cells)
export function useLCD1602Texture(state?: {
  powered?: boolean;
  backlight?: boolean;
  line1?: string;
  line2?: string;
  theme?: 'blue' | 'green' | 'amber';
}) {
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    textureRef.current = texture;

    const isPowered = state?.powered ?? true;
    const hasBacklight = (state?.backlight ?? true) && isPowered;
    const theme = state?.theme || 'blue';

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background color based on theme and backlight
    let bgColor = '#0f172a';
    let charOnColor = '#ffffff';
    let charOffColor = 'rgba(255, 255, 255, 0.08)';

    if (theme === 'blue') {
      bgColor = hasBacklight ? '#1d4ed8' : '#1e293b';
      charOnColor = '#ffffff';
      charOffColor = 'rgba(255, 255, 255, 0.07)';
    } else if (theme === 'green') {
      bgColor = hasBacklight ? '#84cc16' : '#3f6212';
      charOnColor = '#14532d';
      charOffColor = 'rgba(20, 83, 45, 0.12)';
    } else if (theme === 'amber') {
      bgColor = hasBacklight ? '#d97706' : '#451a03';
      charOnColor = '#fffbeb';
      charOffColor = 'rgba(255, 251, 235, 0.1)';
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!isPowered) {
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      texture.needsUpdate = true;
      return () => texture.dispose();
    }

    // Draw 16x2 character grid with subtle 5x8 cell matrix background
    const padX = 18;
    const padY = 16;
    const charWidth = 28;
    const charHeight = 44;
    const gapX = 3;
    const gapY = 8;

    const line1Text = (state?.line1 || 'VIRTUAL IOT LAB ').padEnd(16).slice(0, 16);
    const line2Text = (state?.line2 || 'SYSTEM READY OK ').padEnd(16).slice(0, 16);

    ctx.font = 'bold 36px "Courier New", monospace';
    ctx.textBaseline = 'top';

    // Row 1
    for (let c = 0; c < 16; c++) {
      const x = padX + c * (charWidth + gapX);
      const y = padY;
      ctx.fillStyle = charOffColor;
      ctx.fillRect(x, y, charWidth, charHeight);

      const ch = line1Text[c] || ' ';
      ctx.fillStyle = charOnColor;
      ctx.fillText(ch, x + 4, y + 4);
    }

    // Row 2
    for (let c = 0; c < 16; c++) {
      const x = padX + c * (charWidth + gapX);
      const y = padY + charHeight + gapY;
      ctx.fillStyle = charOffColor;
      ctx.fillRect(x, y, charWidth, charHeight);

      const ch = line2Text[c] || ' ';
      ctx.fillStyle = charOnColor;
      ctx.fillText(ch, x + 4, y + 4);
    }

    texture.needsUpdate = true;
    return () => texture.dispose();
  }, [state?.powered, state?.backlight, state?.line1, state?.line2, state?.theme]);

  return textureRef.current;
}

// 3. TFT 240x240 Color IPS Texture Hook (High-res 256x256 display)
export function useTFTTexture(state?: {
  powered?: boolean;
  brightness?: number;
  displayMode?: string;
  gaugeValue?: number;
}) {
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    textureRef.current = texture;

    let animId: number;
    let tick = 0;

    const render = () => {
      tick++;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const isPowered = state?.powered ?? true;
      if (!isPowered) {
        ctx.fillStyle = '#090a0f';
        ctx.fillRect(0, 0, 256, 256);
        texture.needsUpdate = true;
        animId = requestAnimationFrame(render);
        return;
      }

      // High-tech dark background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 256, 256);

      // Top status bar
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 256, 28);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px "Inter", sans-serif';
      ctx.fillText('ST7789 IPS', 12, 18);
      ctx.fillText('240x240 RGB', 170, 18);

      // Radial dial gauge in center
      const centerX = 128;
      const centerY = 135;
      const radius = 64;

      // Track ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, 2.25 * Math.PI);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 14;
      ctx.stroke();

      // Active fill arc (animated or value)
      const val = state?.gaugeValue ?? (60 + Math.sin(tick * 0.05) * 25);
      const angle = 0.75 * Math.PI + (val / 100) * 1.5 * Math.PI;

      const gradient = ctx.createLinearGradient(centerX - radius, centerY, centerX + radius, centerY);
      gradient.addColorStop(0, '#06b6d4');
      gradient.addColorStop(0.5, '#3b82f6');
      gradient.addColorStop(1, '#ec4899');

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0.75 * Math.PI, angle);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Center value readout
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 28px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(val)}%`, centerX, centerY + 8);
      ctx.font = '10px "Inter", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('SYSTEM LOAD', centerX, centerY + 24);

      // Bottom bar
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(16, 218, 224, 22);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(18, 220, (val / 100) * 220, 18);
      ctx.textAlign = 'left';

      texture.needsUpdate = true;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      texture.dispose();
    };
  }, [state?.powered, state?.brightness, state?.displayMode, state?.gaugeValue]);

  return textureRef.current;
}

// 4. TM1637 4-Digit 7-Segment Canvas Texture Hook (256x128 canvas)
export function useTM1637Texture(state?: {
  powered?: boolean;
  digits?: string;
  colon?: boolean;
  color?: 'red' | 'green' | 'blue' | 'amber';
  brightness?: number;
}) {
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    textureRef.current = texture;

    let animId: number;
    let tick = 0;

    const render = () => {
      tick++;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const isPowered = state?.powered ?? true;
      ctx.fillStyle = '#0a0a0f'; // Dark filtered display mask
      ctx.fillRect(0, 0, 256, 128);

      if (!isPowered) {
        texture.needsUpdate = true;
        animId = requestAnimationFrame(render);
        return;
      }

      const activeColor = state?.color === 'green'
        ? '#22c55e'
        : state?.color === 'blue'
        ? '#38bdf8'
        : state?.color === 'amber'
        ? '#f59e0b'
        : '#ef4444'; // Red default

      const dimColor = state?.color === 'green'
        ? 'rgba(34, 197, 94, 0.08)'
        : state?.color === 'blue'
        ? 'rgba(56, 189, 248, 0.08)'
        : state?.color === 'amber'
        ? 'rgba(245, 158, 11, 0.08)'
        : 'rgba(239, 68, 68, 0.08)';

      const rawDigits = (state?.digits || '12:34').replace(':', '');
      const digitChars = rawDigits.padEnd(4, ' ').slice(0, 4);

      // Render 4 digits
      const digitWidth = 38;
      const digitHeight = 70;
      const startX = 26;
      const startY = 28;
      const spacing = 52;

      for (let i = 0; i < 4; i++) {
        const char = digitChars[i] || ' ';
        const mask = SEGMENT_MAP[char.toUpperCase()] ?? SEGMENT_MAP[' '];
        const dx = startX + i * spacing;

        // Draw 7 segments:
        // a: top, b: top-right, c: bottom-right, d: bottom, e: bottom-left, f: top-left, g: middle
        const segA = Boolean(mask & 0b0000001);
        const segB = Boolean(mask & 0b0000010);
        const segC = Boolean(mask & 0b0000100);
        const segD = Boolean(mask & 0b0001000);
        const segE = Boolean(mask & 0b0010000);
        const segF = Boolean(mask & 0b0100000);
        const segG = Boolean(mask & 0b1000000);

        // a
        ctx.fillStyle = segA ? activeColor : dimColor;
        ctx.fillRect(dx + 6, startY, digitWidth - 12, 6);
        // b
        ctx.fillStyle = segB ? activeColor : dimColor;
        ctx.fillRect(dx + digitWidth - 6, startY + 6, 6, digitHeight / 2 - 8);
        // c
        ctx.fillStyle = segC ? activeColor : dimColor;
        ctx.fillRect(dx + digitWidth - 6, startY + digitHeight / 2 + 2, 6, digitHeight / 2 - 8);
        // d
        ctx.fillStyle = segD ? activeColor : dimColor;
        ctx.fillRect(dx + 6, startY + digitHeight - 6, digitWidth - 12, 6);
        // e
        ctx.fillStyle = segE ? activeColor : dimColor;
        ctx.fillRect(dx, startY + digitHeight / 2 + 2, 6, digitHeight / 2 - 8);
        // f
        ctx.fillStyle = segF ? activeColor : dimColor;
        ctx.fillRect(dx, startY + 6, 6, digitHeight / 2 - 8);
        // g
        ctx.fillStyle = segG ? activeColor : dimColor;
        ctx.fillRect(dx + 6, startY + digitHeight / 2 - 3, digitWidth - 12, 6);
      }

      // Central blinking colon
      const showColon = state?.colon ?? (Math.floor(tick / 30) % 2 === 0);
      ctx.fillStyle = showColon ? activeColor : dimColor;
      ctx.fillRect(startX + 2 * spacing - 16, startY + 22, 6, 6);
      ctx.fillRect(startX + 2 * spacing - 16, startY + 44, 6, 6);

      texture.needsUpdate = true;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      texture.dispose();
    };
  }, [state?.powered, state?.digits, state?.colon, state?.color]);

  return textureRef.current;
}

// 5. FPV Field Monitor Live OSD Canvas Texture Hook (512x288 widescreen)
export function useFPVMonitorTexture(state?: {
  powered?: boolean;
  channel?: string;
  osdEnabled?: boolean;
}) {
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 288;

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    textureRef.current = texture;

    let animId: number;
    let tick = 0;

    const render = () => {
      tick++;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const isPowered = state?.powered ?? true;

      if (!isPowered) {
        // Power off matte screen
        ctx.fillStyle = '#08080c';
        ctx.fillRect(0, 0, 512, 288);
        texture.needsUpdate = true;
        animId = requestAnimationFrame(render);
        return;
      }

      // Outdoor sky / ground simulation horizon backdrop
      const pitchOffset = Math.sin(tick * 0.02) * 20;
      const rollAngle = Math.sin(tick * 0.015) * 0.15;

      ctx.save();
      ctx.translate(256, 144);
      ctx.rotate(rollAngle);
      ctx.translate(-256, -144);

      // Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 144 + pitchOffset);
      skyGrad.addColorStop(0, '#1e3a8a');
      skyGrad.addColorStop(1, '#60a5fa');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(-100, -100, 712, 244 + pitchOffset);

      // Ground
      const groundGrad = ctx.createLinearGradient(0, 144 + pitchOffset, 0, 400);
      groundGrad.addColorStop(0, '#14532d');
      groundGrad.addColorStop(1, '#052e16');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(-100, 144 + pitchOffset, 712, 400);

      // Horizon line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-100, 144 + pitchOffset);
      ctx.lineTo(612, 144 + pitchOffset);
      ctx.stroke();

      ctx.restore();

      // Betaflight OSD Overlay
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;

      // Helper to draw text with black outline for high readability in sunlight
      const drawOSD = (text: string, x: number, y: number) => {
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
      };

      // Top row OSD
      drawOSD(`CH: ${state?.channel || 'R4 5800M'}`, 16, 24);
      drawOSD('RSSI: 99%', 220, 24);
      drawOSD('SATS: 14', 420, 24);

      // Center crosshair and artificial horizon ladder
      ctx.strokeRect(250, 142, 12, 4);
      ctx.fillRect(250, 142, 12, 4);
      ctx.beginPath();
      ctx.moveTo(216, 144);
      ctx.lineTo(240, 144);
      ctx.moveTo(272, 144);
      ctx.lineTo(296, 144);
      ctx.stroke();

      // Bottom telemetry
      const batteryVoltage = (15.2 - Math.sin(tick * 0.05) * 0.4).toFixed(1);
      const mahUsed = Math.floor(450 + tick * 0.2);
      const currentAmps = (18.4 + Math.sin(tick * 0.1) * 3.2).toFixed(1);

      drawOSD(`BATT: ${batteryVoltage}V (4S)`, 16, 268);
      drawOSD(`DRAW: ${currentAmps}A`, 190, 268);
      drawOSD(`MAH: ${mahUsed}`, 330, 268);
      drawOSD('ARMED: ACRO', 400, 248);

      texture.needsUpdate = true;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      texture.dispose();
    };
  }, [state?.powered, state?.channel, state?.osdEnabled]);

  return textureRef.current;
}
