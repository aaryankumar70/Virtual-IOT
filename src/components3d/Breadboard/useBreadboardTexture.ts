import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { BREADBOARD_COLS, BREADBOARD_PITCH_X, BREADBOARD_X_OFFSET, BREADBOARD_ROW_Z } from '../../utils/breadboardSnap';

/**
 * Creates a photorealistic 2048x1024 procedural canvas texture for the half-size solderless breadboard.
 * Features:
 * - High-contrast silkscreen typography (numbers 1-30, letters A-J)
 * - Industrial Red (+) and Blue (-) power rail polarity lines and symbols
 * - Molded ABS plastic texture with beveled edge depth and central DIP IC trough
 * - Phosphor-bronze internal spring contact socket appearances
 */
export function useBreadboardTexture() {
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    const width = 2048;
    const height = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Off-White / Ivory ABS Molded Plastic Base
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#f8fafc');
    bgGrad.addColorStop(0.5, '#f1f5f9');
    bgGrad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle plastic grain texture
    ctx.fillStyle = 'rgba(0, 0, 0, 0.015)';
    for (let i = 0; i < 40000; i++) {
      const rx = Math.random() * width;
      const ry = Math.random() * height;
      ctx.fillRect(rx, ry, 1.5, 1.5);
    }

    // Outer Beveled Plastic Border
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 12;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 6;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Coordinate mapping helper from 3D local coordinates to 2D canvas pixels
    // Breadboard dimensions: width 8.4 units, depth 4.2 units
    // canvas: x: 0..width, y: 0..height (z from -2.1 to +2.1)
    const worldW = 8.4;
    const worldD = 4.2;

    const toCanvasX = (localX: number) => ((localX + worldW / 2) / worldW) * width;
    const toCanvasY = (localZ: number) => ((localZ + worldD / 2) / worldD) * height;

    // 2. Central IC DIP Divider Trough / Channel
    const troughY = toCanvasY(0);
    const troughH = (0.34 / worldD) * height;
    const troughGrad = ctx.createLinearGradient(0, troughY - troughH / 2, 0, troughY + troughH / 2);
    troughGrad.addColorStop(0, '#94a3b8');
    troughGrad.addColorStop(0.15, '#cbd5e1');
    troughGrad.addColorStop(0.5, '#e2e8f0');
    troughGrad.addColorStop(0.85, '#cbd5e1');
    troughGrad.addColorStop(1, '#64748b');
    ctx.fillStyle = troughGrad;
    ctx.fillRect(40, troughY - troughH / 2, width - 80, troughH);

    // Central trough center groove line
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(40, troughY);
    ctx.lineTo(width - 40, troughY);
    ctx.stroke();

    // 3. Power Rail Separation Grooves
    const topGrooveY = toCanvasY(-1.12);
    const botGrooveY = toCanvasY(1.12);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(50, topGrooveY);
    ctx.lineTo(width - 50, topGrooveY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(50, botGrooveY);
    ctx.lineTo(width - 50, botGrooveY);
    ctx.stroke();

    // 4. Power Distribution Rail Polarity Lines
    const railXStart = toCanvasX(-3.85);
    const railXEnd = toCanvasX(3.85);

    // Top Red (+) Line
    const topRedY = toCanvasY(-1.9);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(railXStart, topRedY);
    ctx.lineTo(railXEnd, topRedY);
    ctx.stroke();

    // Top Blue (-) Line
    const topBlueY = toCanvasY(-1.21);
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(railXStart, topBlueY);
    ctx.lineTo(railXEnd, topBlueY);
    ctx.stroke();

    // Bottom Red (+) Line
    const botRedY = toCanvasY(1.21);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(railXStart, botRedY);
    ctx.lineTo(railXEnd, botRedY);
    ctx.stroke();

    // Bottom Blue (-) Line
    const botBlueY = toCanvasY(1.9);
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(railXStart, botBlueY);
    ctx.lineTo(railXEnd, botBlueY);
    ctx.stroke();

    // 5. Silkscreen Symbols ('+' and '-') along Power Rails
    ctx.font = 'bold 26px "SF Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Top Red '+'
    ctx.fillStyle = '#dc2626';
    [railXStart - 35, railXEnd + 35].forEach((px) => {
      ctx.fillText('+', px, topRedY);
    });

    // Top Blue '-'
    ctx.fillStyle = '#2563eb';
    [railXStart - 35, railXEnd + 35].forEach((px) => {
      ctx.fillText('—', px, topBlueY);
    });

    // Bottom Red '+'
    ctx.fillStyle = '#dc2626';
    [railXStart - 35, railXEnd + 35].forEach((px) => {
      ctx.fillText('+', px, botRedY);
    });

    // Bottom Blue '-'
    ctx.fillStyle = '#2563eb';
    [railXStart - 35, railXEnd + 35].forEach((px) => {
      ctx.fillText('—', px, botBlueY);
    });

    // 6. Column Numbers and Alignment Ticks
    const numYTop = toCanvasY(-0.99);
    const numYCenterTop = troughY - troughH / 2 - 12;
    const numYCenterBot = troughY + troughH / 2 + 16;
    const numYBot = toCanvasY(0.99);

    ctx.font = 'bold 21px "SF Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
    ctx.fillStyle = '#334155';
    ctx.textAlign = 'center';

    for (let c = 1; c <= BREADBOARD_COLS; c++) {
      const localX = BREADBOARD_X_OFFSET + (c - 1) * BREADBOARD_PITCH_X;
      const px = toCanvasX(localX);

      // Print number on landmark columns (1, 5, 10, 15, 20, 25, 30)
      if (c === 1 || c % 5 === 0) {
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 22px "SF Pro", sans-serif';
        ctx.fillText(String(c), px, numYTop);
        ctx.fillText(String(c), px, numYBot + 14);
        ctx.fillText(String(c), px, numYCenterTop);
        ctx.fillText(String(c), px, numYCenterBot);
      } else {
        // Subtle tick mark for intermediate columns
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(px - 1, numYTop - 4, 2, 8);
        ctx.fillRect(px - 1, numYBot + 6, 2, 8);
      }
    }

    // 7. Row Letters (A, B, C, D, E) and (F, G, H, I, J) on Left & Right Margins
    const leftMarginX = toCanvasX(-3.95);
    const rightMarginX = toCanvasX(3.95);

    ctx.font = 'bold 24px "SF Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
    ctx.fillStyle = '#1e293b';

    const rowLetters: { key: string; label: string }[] = [
      { key: 'a', label: 'A' },
      { key: 'b', label: 'B' },
      { key: 'c', label: 'C' },
      { key: 'd', label: 'D' },
      { key: 'e', label: 'E' },
      { key: 'f', label: 'F' },
      { key: 'g', label: 'G' },
      { key: 'h', label: 'H' },
      { key: 'i', label: 'I' },
      { key: 'j', label: 'J' },
    ];

    rowLetters.forEach(({ key, label }) => {
      const py = toCanvasY(BREADBOARD_ROW_Z[key]);
      ctx.fillText(label, leftMarginX, py + 1);
      ctx.fillText(label, rightMarginX, py + 1);
    });

    // 8. Model Name & Branding Silkscreen Decal
    ctx.font = 'bold 19px "SF Pro", -apple-system, BlinkMacSystemFont, monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('MB-102 SOLDERLESS BREADBOARD', width / 2, toCanvasY(-2.0));
    ctx.font = '16px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('400 TIE-POINTS • 2.54mm PITCH • DUAL POWER BUS', width / 2, toCanvasY(2.03));

    // 9. Precision Socket Holes Silkscreen (Beveled cavity + dark interior contacts)
    const holeRadius = 11;
    const innerRadius = 7.5;

    const drawSocketHole = (cx: number, cy: number) => {
      // Outer beveled rim
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.roundRect(cx - holeRadius, cy - holeRadius, holeRadius * 2, holeRadius * 2, 2.5);
      ctx.fill();

      // Deep dark contact hole cavity
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(cx - innerRadius, cy - innerRadius, innerRadius * 2, innerRadius * 2, 1.5);
      ctx.fill();

      // Internal nickel-silver metallic contact clip reflection
      ctx.fillStyle = '#64748b';
      ctx.fillRect(cx - innerRadius + 2, cy - 1, (innerRadius - 2) * 2, 2);
    };

    // Draw all 30 columns of socket holes
    for (let c = 1; c <= BREADBOARD_COLS; c++) {
      const localX = BREADBOARD_X_OFFSET + (c - 1) * BREADBOARD_PITCH_X;
      const px = toCanvasX(localX);

      // Top power rails
      drawSocketHole(px, toCanvasY(BREADBOARD_ROW_Z['rail_top_plus']));
      drawSocketHole(px, toCanvasY(BREADBOARD_ROW_Z['rail_top_minus']));

      // Bank A-E
      ['a', 'b', 'c', 'd', 'e'].forEach((letter) => {
        drawSocketHole(px, toCanvasY(BREADBOARD_ROW_Z[letter]));
      });

      // Bank F-J
      ['f', 'g', 'h', 'i', 'j'].forEach((letter) => {
        drawSocketHole(px, toCanvasY(BREADBOARD_ROW_Z[letter]));
      });

      // Bottom power rails
      drawSocketHole(px, toCanvasY(BREADBOARD_ROW_Z['rail_bot_plus']));
      drawSocketHole(px, toCanvasY(BREADBOARD_ROW_Z['rail_bot_minus']));
    }

    // Build Three.js Texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;

    textureRef.current = texture;
  }, []);

  return textureRef.current;
}
