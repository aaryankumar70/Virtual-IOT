import { useMemo } from 'react';
import * as THREE from 'three';
import { LogicGateType, LOGIC_GATES_INFO } from '../../core/logic/logicGatesEngine';

/**
 * Procedurally generates high-resolution top-surface silkscreen canvas texture for logic gate ICs.
 */
export function useLogicGateTexture(gateType: LogicGateType | string): THREE.CanvasTexture {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return new THREE.CanvasTexture(canvas);
    }

    const info = LOGIC_GATES_INFO[gateType as LogicGateType] || LOGIC_GATES_INFO['gate-and'];

    // 1. IC Body Dark Epoxy Background with subtle texture
    ctx.fillStyle = '#181b20';
    ctx.fillRect(0, 0, 1024, 512);

    // Beveled border guide
    ctx.strokeStyle = '#2d333b';
    ctx.lineWidth = 12;
    ctx.strokeRect(16, 16, 992, 480);

    // Pin 1 Index Notch on Left Edge
    ctx.fillStyle = '#0f1115';
    ctx.beginPath();
    ctx.arc(40, 256, 36, -Math.PI / 2, Math.PI / 2);
    ctx.fill();
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Pin 1 Dot Marker
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(80, 100, 14, 0, Math.PI * 2);
    ctx.fill();

    // 2. Chip Title & Manufacturer Silkscreen (Laser-Etched Off-White Style)
    ctx.fillStyle = 'rgba(241, 245, 249, 0.88)';
    ctx.font = 'bold 44px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SN${info.chipModel}N`, 130, 95);

    ctx.font = '600 32px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
    ctx.fillText(`${info.symbolName} GATE`, 130, 145);

    // 3. Draw ANSI / IEEE Standard Schematic Gate Symbol in Center
    ctx.save();
    ctx.translate(560, 256);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const drawGateSymbol = () => {
      switch (gateType) {
        case 'gate-and':
        case 'gate-nand': {
          // Input lead stubs
          ctx.beginPath();
          ctx.moveTo(-130, -50);
          ctx.lineTo(-70, -50);
          ctx.moveTo(-130, 50);
          ctx.lineTo(-70, 50);
          ctx.stroke();

          // D-Shape AND Body
          ctx.beginPath();
          ctx.moveTo(-70, -80);
          ctx.lineTo(0, -80);
          ctx.arc(0, 0, 80, -Math.PI / 2, Math.PI / 2, false);
          ctx.lineTo(-70, 80);
          ctx.closePath();
          ctx.fillStyle = 'rgba(14, 165, 233, 0.12)';
          ctx.fill();
          ctx.stroke();

          if (gateType === 'gate-nand') {
            // Inversion Bubble
            ctx.beginPath();
            ctx.arc(96, 0, 14, 0, Math.PI * 2);
            ctx.fillStyle = '#181b20';
            ctx.fill();
            ctx.stroke();

            // Output lead
            ctx.beginPath();
            ctx.moveTo(110, 0);
            ctx.lineTo(160, 0);
            ctx.stroke();
          } else {
            // Output lead
            ctx.beginPath();
            ctx.moveTo(80, 0);
            ctx.lineTo(150, 0);
            ctx.stroke();
          }
          break;
        }

        case 'gate-or':
        case 'gate-nor': {
          // Input leads
          ctx.beginPath();
          ctx.moveTo(-140, -50);
          ctx.lineTo(-65, -50);
          ctx.moveTo(-140, 50);
          ctx.lineTo(-65, 50);
          ctx.stroke();

          // OR Shield Body: curved back, pointed front
          ctx.beginPath();
          ctx.moveTo(-80, -80);
          ctx.quadraticCurveTo(0, -75, 80, 0);
          ctx.quadraticCurveTo(0, 75, -80, 80);
          ctx.quadraticCurveTo(-45, 0, -80, -80);
          ctx.closePath();
          ctx.fillStyle = 'rgba(14, 165, 233, 0.12)';
          ctx.fill();
          ctx.stroke();

          if (gateType === 'gate-nor') {
            // Bubble
            ctx.beginPath();
            ctx.arc(96, 0, 14, 0, Math.PI * 2);
            ctx.fillStyle = '#181b20';
            ctx.fill();
            ctx.stroke();

            // Output lead
            ctx.beginPath();
            ctx.moveTo(110, 0);
            ctx.lineTo(160, 0);
            ctx.stroke();
          } else {
            // Output lead
            ctx.beginPath();
            ctx.moveTo(80, 0);
            ctx.lineTo(150, 0);
            ctx.stroke();
          }
          break;
        }

        case 'gate-xor':
        case 'gate-xnor': {
          // Double Curved Back Line for XOR
          ctx.beginPath();
          ctx.moveTo(-105, -80);
          ctx.quadraticCurveTo(-70, 0, -105, 80);
          ctx.stroke();

          // Input leads
          ctx.beginPath();
          ctx.moveTo(-150, -50);
          ctx.lineTo(-90, -50);
          ctx.moveTo(-150, 50);
          ctx.lineTo(-90, 50);
          ctx.stroke();

          // XOR Shield Body
          ctx.beginPath();
          ctx.moveTo(-80, -80);
          ctx.quadraticCurveTo(0, -75, 80, 0);
          ctx.quadraticCurveTo(0, 75, -80, 80);
          ctx.quadraticCurveTo(-45, 0, -80, -80);
          ctx.closePath();
          ctx.fillStyle = 'rgba(14, 165, 233, 0.12)';
          ctx.fill();
          ctx.stroke();

          if (gateType === 'gate-xnor') {
            // Inversion Bubble
            ctx.beginPath();
            ctx.arc(96, 0, 14, 0, Math.PI * 2);
            ctx.fillStyle = '#181b20';
            ctx.fill();
            ctx.stroke();

            // Output lead
            ctx.beginPath();
            ctx.moveTo(110, 0);
            ctx.lineTo(160, 0);
            ctx.stroke();
          } else {
            // Output lead
            ctx.beginPath();
            ctx.moveTo(80, 0);
            ctx.lineTo(150, 0);
            ctx.stroke();
          }
          break;
        }

        case 'gate-not': {
          // Input lead
          ctx.beginPath();
          ctx.moveTo(-120, 0);
          ctx.lineTo(-60, 0);
          ctx.stroke();

          // Triangle Body
          ctx.beginPath();
          ctx.moveTo(-60, -75);
          ctx.lineTo(50, 0);
          ctx.lineTo(-60, 75);
          ctx.closePath();
          ctx.fillStyle = 'rgba(14, 165, 233, 0.12)';
          ctx.fill();
          ctx.stroke();

          // Inversion Bubble
          ctx.beginPath();
          ctx.arc(66, 0, 14, 0, Math.PI * 2);
          ctx.fillStyle = '#181b20';
          ctx.fill();
          ctx.stroke();

          // Output lead
          ctx.beginPath();
          ctx.moveTo(80, 0);
          ctx.lineTo(140, 0);
          ctx.stroke();
          break;
        }
      }
    };

    drawGateSymbol();
    ctx.restore();

    // 4. Pin Labels Silkscreen
    ctx.font = 'bold 28px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(203, 213, 225, 0.85)';

    // Top Row Labels
    if (info.inputsCount === 2) {
      ctx.fillText('A [IN]', 180, 48);
      ctx.fillText('B [IN]', 480, 48);
      ctx.fillStyle = '#ef4444';
      ctx.fillText('VCC (+5V)', 780, 48);
    } else {
      ctx.fillText('A [IN]', 260, 48);
      ctx.fillStyle = '#ef4444';
      ctx.fillText('VCC (+5V)', 780, 48);
    }

    // Bottom Row Labels
    ctx.fillStyle = '#10b981';
    ctx.fillText('Y [OUT]', 220, 484);
    ctx.fillStyle = '#3b82f6';
    ctx.fillText('GND (0V)', 780, 484);

    // 5. Logic Equation Bottom Left
    ctx.font = '600 28px "Inter", sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(info.booleanEquation, 130, 430);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }, [gateType]);
}
