import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  LogicChannel,
  DecodedPacket,
  ChannelWaveformData,
} from '../../core/logicAnalyzer/logicAnalyzerTypes';
import { logicAnalyzerStore, useLogicAnalyzer } from '../../state/logicAnalyzer/logicAnalyzerStore';

interface Props {
  channels: LogicChannel[];
  packets: DecodedPacket[];
  waveforms: Record<string, ChannelWaveformData>;
  timeWindowUs: number;
  offsetUs: number;
  totalTimeUs: number;
  selectedPacketId: string | null;
  cursorAUs: number | null;
  cursorBUs: number | null;
}

const LANE_HEIGHT = 44;
const HEADER_HEIGHT = 28;
const LABEL_WIDTH = 100;

export const DigitalWaveformView: React.FC<Props> = ({
  channels,
  packets,
  waveforms,
  timeWindowUs,
  offsetUs,
  totalTimeUs,
  selectedPacketId,
  cursorAUs,
  cursorBUs,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [isDraggingPan, setIsDraggingPan] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartOffset, setDragStartOffset] = useState(0);
  const [activeCursorDrag, setActiveCursorDrag] = useState<'A' | 'B' | null>(null);

  // Resize observer for container width
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const waveformWidth = Math.max(100, containerWidth - LABEL_WIDTH);

  // Conversion: microsecond time -> pixel X on waveform canvas
  const timeToPixelX = useCallback(
    (timeUs: number) => {
      const relTime = timeUs - offsetUs;
      return (relTime / timeWindowUs) * waveformWidth;
    },
    [offsetUs, timeWindowUs, waveformWidth]
  );

  // Conversion: pixel X on waveform canvas -> microsecond time
  const pixelXToTime = useCallback(
    (pixelX: number) => {
      return offsetUs + (pixelX / waveformWidth) * timeWindowUs;
    },
    [offsetUs, timeWindowUs, waveformWidth]
  );

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = Math.max(0, e.clientX - rect.left - LABEL_WIDTH);
    const mouseTimeUs = pixelXToTime(mouseX);

    const zoomFactor = e.deltaY < 0 ? 0.8 : 1.25;
    const newWindowUs = Math.max(100, Math.min(totalTimeUs * 2, timeWindowUs * zoomFactor));

    // Keep the time under the mouse position anchored
    const newOffsetUs = mouseTimeUs - (mouseX / waveformWidth) * newWindowUs;
    logicAnalyzerStore.setTimeWindow(newWindowUs);
    logicAnalyzerStore.setOffset(newOffsetUs);
  };

  // Mouse pan & cursor drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left - LABEL_WIDTH;

    if (clickX < 0) return; // Clicked on label area

    const clickTime = pixelXToTime(clickX);

    // Check if clicked near Cursor A or B
    if (cursorAUs !== null && Math.abs(clickTime - cursorAUs) < timeWindowUs * 0.02) {
      setActiveCursorDrag('A');
      return;
    }
    if (cursorBUs !== null && Math.abs(clickTime - cursorBUs) < timeWindowUs * 0.02) {
      setActiveCursorDrag('B');
      return;
    }

    if (e.shiftKey) {
      // Shift+Click places Cursor B
      logicAnalyzerStore.setCursorB(Math.round(clickTime));
    } else if (e.altKey) {
      // Alt+Click places Cursor A
      logicAnalyzerStore.setCursorA(Math.round(clickTime));
    } else {
      // Start horizontal pan
      setIsDraggingPan(true);
      setDragStartX(e.clientX);
      setDragStartOffset(offsetUs);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (activeCursorDrag) {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const currentX = Math.max(0, e.clientX - rect.left - LABEL_WIDTH);
      const newTime = Math.round(pixelXToTime(currentX));
      if (activeCursorDrag === 'A') logicAnalyzerStore.setCursorA(newTime);
      if (activeCursorDrag === 'B') logicAnalyzerStore.setCursorB(newTime);
      return;
    }

    if (isDraggingPan) {
      const deltaPixels = e.clientX - dragStartX;
      const deltaTimeUs = (deltaPixels / waveformWidth) * timeWindowUs;
      logicAnalyzerStore.setOffset(dragStartOffset - deltaTimeUs);
    }
  };

  const handleMouseUp = () => {
    setIsDraggingPan(false);
    setActiveCursorDrag(null);
  };

  const enabledChannels = channels.filter((c) => c.enabled);

  // Time grid divisions (calculate nice round intervals like 10µs, 50µs, 100µs, 500µs...)
  const rawIntervalUs = timeWindowUs / 8;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawIntervalUs)));
  const normalized = rawIntervalUs / magnitude;
  let gridStepUs = magnitude;
  if (normalized >= 5) gridStepUs = 5 * magnitude;
  else if (normalized >= 2) gridStepUs = 2 * magnitude;

  const firstGridTime = Math.floor(offsetUs / gridStepUs) * gridStepUs;
  const gridTicks: number[] = [];
  for (let t = firstGridTime; t <= offsetUs + timeWindowUs + gridStepUs; t += gridStepUs) {
    if (t >= offsetUs && t <= offsetUs + timeWindowUs) {
      gridTicks.push(t);
    }
  }

  // Cursor delta computation
  const deltaTUs =
    cursorAUs !== null && cursorBUs !== null ? Math.abs(cursorBUs - cursorAUs) : null;
  const freqHz = deltaTUs && deltaTUs > 0 ? (1000000 / deltaTUs).toFixed(1) : null;

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative w-full overflow-hidden bg-[#0a0f1d] border-b border-slate-800 select-none text-xs font-mono ${
        isDraggingPan ? 'cursor-grabbing' : 'cursor-crosshair'
      }`}
      style={{ height: HEADER_HEIGHT + enabledChannels.length * LANE_HEIGHT + 14 }}
    >
      {/* 1. Header Timeline Ruler */}
      <div
        className="flex items-center border-b border-slate-800 bg-[#0d1424] text-[10px] text-slate-400 font-mono"
        style={{ height: HEADER_HEIGHT }}
      >
        {/* Left corner label: Cursors Readout */}
        <div
          className="shrink-0 px-2.5 flex items-center justify-between border-r border-slate-800 font-semibold text-slate-300"
          style={{ width: LABEL_WIDTH }}
        >
          <span>CHANNELS</span>
        </div>

        {/* Timeline Ticks Bar */}
        <div className="relative flex-1 h-full overflow-hidden">
          {gridTicks.map((t) => {
            const x = timeToPixelX(t);
            return (
              <div
                key={t}
                className="absolute top-0 bottom-0 flex flex-col justify-between pointer-events-none"
                style={{ left: `${x}px` }}
              >
                <span className="text-[9px] -translate-x-1/2 pt-1 text-slate-400 font-mono">
                  {t >= 1000 ? `${(t / 1000).toFixed(2)}ms` : `${Math.round(t)}µs`}
                </span>
                <div className="w-[1px] h-2 bg-slate-700 -translate-x-1/2" />
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Waveform Channel Lanes */}
      <div className="relative flex">
        {/* Left Channel Info Headers */}
        <div
          className="shrink-0 flex flex-col border-r border-slate-800 bg-[#0d1424]/90 z-10"
          style={{ width: LABEL_WIDTH }}
        >
          {enabledChannels.map((ch, idx) => {
            return (
              <div
                key={ch.id}
                className="px-2.5 flex items-center justify-between border-b border-slate-800/60"
                style={{ height: LANE_HEIGHT }}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: ch.color }}
                  />
                  <div className="flex flex-col min-w-0 leading-tight">
                    <span className="font-bold text-[11px] text-white truncate">
                      {ch.name}
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase truncate">
                      {ch.role}
                    </span>
                  </div>
                </div>

                <span className="text-[9px] font-mono text-slate-400 bg-slate-800/80 px-1 py-0.2 rounded shrink-0">
                  D{idx}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right Digital Waveforms Canvas Area */}
        <div className="relative flex-1 h-full overflow-hidden">
          {/* Vertical Grid Lines */}
          {gridTicks.map((t) => {
            const x = timeToPixelX(t);
            return (
              <div
                key={`grid-line-${t}`}
                className="absolute top-0 bottom-0 w-[1px] bg-slate-800/50 pointer-events-none"
                style={{ left: `${x}px` }}
              />
            );
          })}

          {/* SVG Waveform Paths for Each Channel */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={waveformWidth}
            height={enabledChannels.length * LANE_HEIGHT}
          >
            {enabledChannels.map((ch, chIdx) => {
              const yBase = chIdx * LANE_HEIGHT;
              const yHigh = yBase + 10;
              const yLow = yBase + LANE_HEIGHT - 12;

              const waveData = waveforms[ch.id];
              if (!waveData || waveData.transitions.length === 0) {
                // Flat line if no transitions
                return (
                  <line
                    key={ch.id}
                    x1={0}
                    y1={yLow}
                    x2={waveformWidth}
                    y2={yLow}
                    stroke={ch.color}
                    strokeWidth={1.5}
                    strokeOpacity={0.8}
                  />
                );
              }

              // Build square digital trace path: M x0 y0 H x1 V y1 H x2...
              const transitions = waveData.transitions;
              let pathD = '';

              // Find initial state at offsetUs
              let currentVal: 0 | 1 = transitions[0].val;
              for (const tr of transitions) {
                if (tr.timeUs <= offsetUs) {
                  currentVal = tr.val;
                } else {
                  break;
                }
              }

              let lastX = 0;
              let lastY = currentVal === 1 ? yHigh : yLow;
              pathD += `M ${lastX} ${lastY}`;

              for (const tr of transitions) {
                if (tr.timeUs < offsetUs) continue;
                if (tr.timeUs > offsetUs + timeWindowUs) break;

                const targetX = timeToPixelX(tr.timeUs);
                const targetY = tr.val === 1 ? yHigh : yLow;

                // Horizontal to transition time, then Vertical to new state
                pathD += ` H ${targetX} V ${targetY}`;
                lastX = targetX;
                lastY = targetY;
              }

              // Draw remaining horizontal span to edge of screen
              pathD += ` H ${waveformWidth}`;

              return (
                <g key={`trace-${ch.id}`}>
                  {/* Subtle lane divider line */}
                  <line
                    x1={0}
                    y1={yBase + LANE_HEIGHT}
                    x2={waveformWidth}
                    y2={yBase + LANE_HEIGHT}
                    stroke="#1e293b"
                    strokeWidth={1}
                  />

                  {/* Faint ground reference level line */}
                  <line
                    x1={0}
                    y1={yLow}
                    x2={waveformWidth}
                    y2={yLow}
                    stroke="#334155"
                    strokeWidth={1}
                    strokeDasharray="2 3"
                    strokeOpacity={0.4}
                  />

                  {/* Primary Crisp Digital Logic Waveform */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={ch.color}
                    strokeWidth={2}
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                  />
                </g>
              );
            })}
          </svg>

          {/* 3. Decoded Protocol Bubble Overlays on Waveforms */}
          <div className="absolute inset-0 pointer-events-none">
            {packets.map((pkg) => {
              // Find matching channel or default to SDA / MOSI / TX
              let targetChannelIdx = 0;
              if (pkg.protocol === 'i2c') targetChannelIdx = 1; // SDA lane
              else if (pkg.protocol === 'spi') targetChannelIdx = 4; // MOSI lane
              else if (pkg.protocol === 'uart') targetChannelIdx = 6; // TX lane

              // Adjust if channel list is filtered
              const foundIdx = enabledChannels.findIndex(
                (c) =>
                  c.id === pkg.channelId ||
                  (pkg.protocol === 'i2c' && c.role === 'sda') ||
                  (pkg.protocol === 'spi' && c.role === 'mosi') ||
                  (pkg.protocol === 'uart' && c.role === 'tx')
              );
              if (foundIdx !== -1) targetChannelIdx = foundIdx;

              const xStart = timeToPixelX(pkg.timestampUs);
              const xEnd = timeToPixelX(pkg.timestampUs + pkg.durationUs);
              const bubbleWidth = Math.max(16, xEnd - xStart);

              // Don't render bubbles completely outside viewport
              if (xEnd < -20 || xStart > waveformWidth + 20) return null;

              const isSelected = selectedPacketId === pkg.id;
              const yLane = targetChannelIdx * LANE_HEIGHT;

              // Color styles based on packet type
              let bubbleBg = 'bg-sky-900/80 text-sky-200 border-sky-500';
              if (pkg.type === 'start') {
                bubbleBg = 'bg-emerald-950/90 text-emerald-300 border-emerald-500 font-bold';
              } else if (pkg.type === 'stop') {
                bubbleBg = 'bg-rose-950/90 text-rose-300 border-rose-500 font-bold';
              } else if (pkg.type === 'address') {
                bubbleBg = 'bg-cyan-950/90 text-cyan-200 border-cyan-400 font-bold';
              } else if (pkg.type === 'cs-assert' || pkg.type === 'cs-deassert') {
                bubbleBg = 'bg-amber-950/90 text-amber-200 border-amber-500';
              } else if (pkg.protocol === 'uart') {
                bubbleBg = 'bg-indigo-950/90 text-indigo-200 border-indigo-400';
              }

              return (
                <div
                  key={pkg.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    logicAnalyzerStore.selectPacket(pkg.id);
                  }}
                  title={`[${pkg.protocol.toUpperCase()}] ${pkg.hex} — ${pkg.description}`}
                  style={{
                    left: `${Math.max(0, xStart)}px`,
                    top: `${yLane + 12}px`,
                    width: `${bubbleWidth}px`,
                  }}
                  className={`absolute h-5 px-1 rounded-sm border pointer-events-auto flex items-center justify-center text-[10px] font-mono cursor-pointer transition-all truncate shadow-2xs ${bubbleBg} ${
                    isSelected ? 'ring-2 ring-yellow-400 scale-105 z-20' : 'hover:scale-102 hover:brightness-125'
                  }`}
                >
                  <span className="truncate">
                    {pkg.type === 'start'
                      ? 'S'
                      : pkg.type === 'stop'
                      ? 'P'
                      : pkg.type === 'address'
                      ? `${pkg.hex} ${pkg.direction === 'write' ? 'W' : 'R'}`
                      : pkg.ascii && pkg.ascii !== '·'
                      ? `${pkg.hex} '${pkg.ascii}'`
                      : pkg.hex}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 4. Interactive Time Measurement Cursors (Cursor A & Cursor B) */}
          {cursorAUs !== null && (
            <div
              style={{ left: `${timeToPixelX(cursorAUs)}px` }}
              className="absolute top-0 bottom-0 w-[1.5px] bg-cyan-400 z-30 pointer-events-none shadow-[0_0_8px_rgba(6,182,212,0.8)]"
            >
              <div className="absolute top-0 -translate-x-1/2 bg-cyan-500 text-slate-950 text-[9px] font-bold px-1 py-0.2 rounded-b shadow-sm pointer-events-auto cursor-ew-resize">
                A: {cursorAUs >= 1000 ? `${(cursorAUs / 1000).toFixed(2)}ms` : `${cursorAUs}µs`}
              </div>
            </div>
          )}

          {cursorBUs !== null && (
            <div
              style={{ left: `${timeToPixelX(cursorBUs)}px` }}
              className="absolute top-0 bottom-0 w-[1.5px] bg-amber-400 z-30 pointer-events-none shadow-[0_0_8px_rgba(245,158,11,0.8)]"
            >
              <div className="absolute top-0 -translate-x-1/2 bg-amber-500 text-slate-950 text-[9px] font-bold px-1 py-0.2 rounded-b shadow-sm pointer-events-auto cursor-ew-resize">
                B: {cursorBUs >= 1000 ? `${(cursorBUs / 1000).toFixed(2)}ms` : `${cursorBUs}µs`}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Cursors Readout Banner (Bottom strip) */}
      <div className="h-6 px-3 bg-[#0a0f1d] border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <div className="flex items-center gap-4">
          <span>
            Window: <strong className="text-white">{timeWindowUs >= 1000 ? `${(timeWindowUs / 1000).toFixed(2)}ms` : `${timeWindowUs}µs`}</strong>
          </span>
          <span>
            Offset: <strong className="text-white">{offsetUs >= 1000 ? `${(offsetUs / 1000).toFixed(2)}ms` : `${offsetUs}µs`}</strong>
          </span>
          {deltaTUs !== null && (
            <>
              <span className="text-cyan-400 font-semibold">
                Δt (B - A): {deltaTUs >= 1000 ? `${(deltaTUs / 1000).toFixed(2)}ms` : `${deltaTUs}µs`}
              </span>
              {freqHz && (
                <span className="text-amber-400 font-semibold">
                  1/Δt: {Number(freqHz) >= 1000 ? `${(Number(freqHz) / 1000).toFixed(2)}kHz` : `${freqHz}Hz`}
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-[9px] text-slate-400">
          <span>Alt+Click: Set Cursor A</span>
          <span>·</span>
          <span>Shift+Click: Set Cursor B</span>
          <span>·</span>
          <span>Scroll to Zoom</span>
        </div>
      </div>
    </div>
  );
};
