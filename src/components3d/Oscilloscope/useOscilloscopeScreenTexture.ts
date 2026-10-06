import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OscilloscopeSignalEngine } from '../../core/oscilloscope/OscilloscopeSignalEngine';
import { oscilloscopeStore } from '../../state/oscilloscope/oscilloscopeStore';
import { projectStore } from '../../state/project/projectStore';

export function useOscilloscopeScreenTexture(oscilloscopeCompId?: string) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    // Canvas resolution (512x320 for sharp crisp 3D screen face)
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 320;
    canvasRef.current = canvas;

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    textureRef.current = texture;

    let animId: number;
    let lastRenderTime = performance.now();

    const render = (time: number) => {
      animId = requestAnimationFrame(render);

      // Throttle to 30fps for the 3D in-world screen mesh to keep 60fps overall performance
      if (time - lastRenderTime < 33) return;
      lastRenderTime = time;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const oscState = oscilloscopeStore.getState();
      const projState = projectStore.getState();

      const width = canvas.width;
      const height = canvas.height;

      // Dark oscilloscope CRT/LCD background with deep navy phosphor tint
      ctx.fillStyle = '#050914';
      ctx.fillRect(0, 0, width, height);

      // Margins for screen graticule:
      const padX = 24;
      const padY = 28;
      const gridW = width - padX * 2;
      const gridH = height - padY * 2 - 24; // space for bottom measurement bar

      // 1. Grid Graticule (10 horizontal divisions, 8 vertical divisions)
      ctx.strokeStyle = 'rgba(30, 58, 138, 0.45)'; // subtle deep blue grid
      ctx.lineWidth = 1;

      const xDivs = 10;
      const yDivs = 8;
      const dx = gridW / xDivs;
      const dy = gridH / yDivs;

      ctx.beginPath();
      for (let i = 0; i <= xDivs; i++) {
        const x = padX + i * dx;
        ctx.moveTo(x, padY);
        ctx.lineTo(x, padY + gridH);
      }
      for (let j = 0; j <= yDivs; j++) {
        const y = padY + j * dy;
        ctx.moveTo(padX, y);
        ctx.lineTo(padX + gridW, y);
      }
      ctx.stroke();

      // Center crosshair axis ticks
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.4)';
      ctx.lineWidth = 1.2;
      const midX = padX + gridW / 2;
      const midY = padY + gridH / 2;

      ctx.beginPath();
      // Center horizontal axis
      ctx.moveTo(padX, midY);
      ctx.lineTo(padX + gridW, midY);
      // Center vertical axis
      ctx.moveTo(midX, padY);
      ctx.lineTo(midX, padY + gridH);
      ctx.stroke();

      // 2. Resolve signals
      // Check if connections exist on the 3D oscilloscope component itself
      let ch1Target = oscState.ch1ProbeEndpoint;
      let ch2Target = oscState.ch2ProbeEndpoint;

      if (oscilloscopeCompId) {
        // Automatically check wires connected to this oscilloscope component in projectState
        const conn1 = projState.connections.find(
          (c) =>
            (c.source.componentId === oscilloscopeCompId && (c.source.interfaceId === 'ch1_probe' || c.source.pinId === 'ch1_probe')) ||
            (c.target.componentId === oscilloscopeCompId && (c.target.interfaceId === 'ch1_probe' || c.target.pinId === 'ch1_probe'))
        );
        if (conn1) {
          const ep = conn1.source.componentId === oscilloscopeCompId ? conn1.target : conn1.source;
          ch1Target = { componentId: ep.componentId, pinId: ep.interfaceId || ep.pinId || '' };
        }

        const conn2 = projState.connections.find(
          (c) =>
            (c.source.componentId === oscilloscopeCompId && (c.source.interfaceId === 'ch2_probe' || c.source.pinId === 'ch2_probe')) ||
            (c.target.componentId === oscilloscopeCompId && (c.target.interfaceId === 'ch2_probe' || c.target.pinId === 'ch2_probe'))
        );
        if (conn2) {
          const ep = conn2.source.componentId === oscilloscopeCompId ? conn2.target : conn2.source;
          ch2Target = { componentId: ep.componentId, pinId: ep.interfaceId || ep.pinId || '' };
        }
      }

      const sig1 = OscilloscopeSignalEngine.resolveChannelSignal(
        ch1Target,
        projState.components,
        projState.connections,
        oscState.ch1
      );
      const sig2 = OscilloscopeSignalEngine.resolveChannelSignal(
        ch2Target,
        projState.components,
        projState.connections,
        oscState.ch2
      );

      const totalTimeSpan = oscState.horizontal.timePerDiv * xDivs;
      const tNow = oscState.isRunning ? time / 1000 : 0;
      const tStart = tNow + oscState.horizontal.offsetX;

      // 3. Draw Channel Traces
      const drawChannel = (
        sig: typeof sig1,
        chSettings: typeof oscState.ch1,
        color: string
      ) => {
        if (!chSettings.enabled || chSettings.coupling === 'gnd') return;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2.0;
        ctx.shadowColor = color;
        ctx.shadowBlur = 4;

        ctx.beginPath();
        const steps = 240;
        for (let i = 0; i <= steps; i++) {
          const frac = i / steps;
          const t = tStart + frac * totalTimeSpan;
          const v = sig.voltageAtTime(t);

          // Convert V to screen Y:
          // Center screen is 0V + chSettings.offsetY * voltsPerDiv
          const vOffset = chSettings.offsetY * chSettings.voltsPerDiv;
          const deltaV = v - vOffset;
          // dy per volt: dy / voltsPerDiv
          const pixelsPerVolt = dy / chSettings.voltsPerDiv;
          const screenY = midY - deltaV * pixelsPerVolt;
          const screenX = padX + frac * gridW;

          // Clamp within graticule
          const clampedY = Math.max(padY, Math.min(padY + gridH, screenY));

          if (i === 0) ctx.moveTo(screenX, clampedY);
          else ctx.lineTo(screenX, clampedY);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      };

      // Draw CH2 then CH1
      drawChannel(sig2, oscState.ch2, oscState.ch2.color);
      drawChannel(sig1, oscState.ch1, oscState.ch1.color);

      // 4. Top Status Header
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(
        `TIME: ${(oscState.horizontal.timePerDiv * 1000).toFixed(2)}ms/div  |  TRIG: ${oscState.trigger.source.toUpperCase()} ${oscState.trigger.level.toFixed(2)}V`,
        padX,
        18
      );

      ctx.fillStyle = oscState.isRunning ? '#22c55e' : '#ef4444';
      ctx.fillRect(width - 70, 8, 8, 8);
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(oscState.isRunning ? 'RUN' : 'STOP', width - 56, 16);

      // 5. Bottom Measurement & Channel HUD Bar
      ctx.font = '10px monospace';
      // CH1 Info
      ctx.fillStyle = oscState.ch1.color;
      ctx.fillText(
        `1: ${(oscState.ch1.voltsPerDiv >= 1 ? `${oscState.ch1.voltsPerDiv}V` : `${oscState.ch1.voltsPerDiv * 1000}mV`)}/div [${sig1.type}]`,
        padX,
        height - 10
      );

      // CH2 Info
      ctx.fillStyle = oscState.ch2.color;
      ctx.fillText(
        `2: ${(oscState.ch2.voltsPerDiv >= 1 ? `${oscState.ch2.voltsPerDiv}V` : `${oscState.ch2.voltsPerDiv * 1000}mV`)}/div`,
        width / 2 + 10,
        height - 10
      );

      texture.needsUpdate = true;
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      texture.dispose();
    };
  }, [oscilloscopeCompId]);

  return textureRef.current;
}
