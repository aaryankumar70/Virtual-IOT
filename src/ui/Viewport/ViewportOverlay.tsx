import React from 'react';
import {
  Grid as GridIcon,
  Magnet,
  Ruler,
  Eye,
  Plus,
  Minus,
  Focus,
  Maximize,
  RotateCcw,
  Camera,
} from 'lucide-react';
import { useView, viewStore } from '../../state/view/viewStore';

export const ViewportOverlay: React.FC = () => {
  const viewState = useView();

  return (
    <>
      {/* Top Center Floating Workbench Controls Bar */}
      <div
        id="workbench-top-controls"
        className="absolute top-3 left-1/2 -translate-x-1/2 z-10 select-none pointer-events-auto flex items-center gap-2 bg-white/95 backdrop-blur-sm border border-slate-200/90 shadow-xs px-3 py-1.5 rounded-lg text-xs text-slate-700"
      >
        {/* Camera Mode */}
        <button
          onClick={() =>
            viewStore.setCameraMode(
              viewState.cameraMode === 'perspective' ? 'orthographic' : 'perspective'
            )
          }
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-100 font-medium text-slate-800 transition-colors"
          title="Toggle Perspective / Orthographic view"
        >
          <Camera size={13} className="text-slate-500" />
          <span className="capitalize">{viewState.cameraMode}</span>
        </button>

        <div className="w-[1px] h-4 bg-slate-200" />

        {/* Grid Toggle */}
        <label
          className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-slate-100 cursor-pointer font-medium text-slate-700 transition-colors"
          title="Toggle 3D Grid"
        >
          <input
            type="checkbox"
            checked={viewState.showGrid}
            onChange={() => viewStore.toggleGrid()}
            className="rounded border-slate-300 text-blue-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
          />
          <GridIcon size={13} className="text-slate-500" />
          <span>Grid</span>
        </label>

        {/* Snap to Grid Toggle */}
        <label
          className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-slate-100 cursor-pointer font-medium text-slate-700 transition-colors"
          title="Toggle Grid Snapping"
        >
          <input
            type="checkbox"
            checked={viewState.snapToGrid}
            onChange={() => viewStore.toggleSnap()}
            className="rounded border-slate-300 text-blue-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
          />
          <Magnet size={13} className="text-slate-500" />
          <span>Snap</span>
        </label>

        <div className="w-[1px] h-4 bg-slate-200" />

        {/* Measure Mode */}
        <button
          onClick={() => viewStore.toggleMeasure()}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
            viewState.measureMode
              ? 'bg-blue-50 text-blue-600 font-semibold'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
          title="Measurement Tool"
        >
          <Ruler size={13} className={viewState.measureMode ? 'text-blue-600' : 'text-slate-500'} />
          <span>Measure</span>
        </button>

        {/* View Options */}
        <button
          onClick={() => viewStore.triggerCamera('reset')}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-100 text-slate-700 transition-colors"
          title="Reset View"
        >
          <Eye size={13} className="text-slate-500" />
          <span>View</span>
        </button>
      </div>

      {/* Wire Mode Active Banner */}
      {(viewState.wireModeActive || viewState.activeWiring) && (
        <div
          id="wire-mode-banner"
          className="absolute top-13 left-1/2 -translate-x-1/2 z-10 select-none pointer-events-auto flex items-center gap-2 bg-white/95 backdrop-blur-sm border border-blue-200/90 shadow-xs px-3.5 py-1.5 rounded-full text-xs text-slate-800"
        >
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 animate-pulse" />
          <span className="font-medium text-[11.5px]">
            {viewState.activeWiring
              ? 'Wiring in progress — click target pin, or Esc to cancel'
              : 'Wire Mode — click a pin to start connection (Esc to exit)'}
          </span>
          <button
            onClick={() => viewStore.cancelWiring()}
            className="ml-1 text-slate-400 hover:text-slate-700 text-[11px] px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
            title="Exit Wire Mode (Esc)"
          >
            Esc
          </button>
        </div>
      )}

      {/* Free Move Mode Active Banner */}
      {viewState.isFreeMoving && (
        <div
          id="free-move-banner"
          className="absolute top-13 left-1/2 -translate-x-1/2 z-10 select-none pointer-events-auto flex items-center gap-2 bg-white/95 backdrop-blur-sm border border-emerald-300 shadow-xs px-3.5 py-1.5 rounded-full text-xs text-slate-800"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-ping" />
          <span className="font-medium text-[11.5px] text-emerald-900">
            Shift + Move: Free Moving Object (Release Shift or Click to Place, Esc to Cancel)
          </span>
        </div>
      )}

      {/* Bottom Left Status Pill */}
      <div className="absolute bottom-3 left-3 z-10 select-none pointer-events-none flex items-center gap-2 bg-white/90 backdrop-blur-xs border border-slate-200 shadow-2xs px-2.5 py-1 rounded-md text-[11px] text-slate-500 font-mono">
        <span>Grid: 1.0mm</span>
        <span>·</span>
        <span>Snap: {viewState.snapToGrid ? 'On' : 'Off'}</span>
        {viewState.isFreeMoving && (
          <>
            <span>·</span>
            <span className="text-emerald-600 font-semibold">Free Move</span>
          </>
        )}
        {viewState.wireModeActive && (
          <>
            <span>·</span>
            <span className="text-blue-600 font-medium">Wire Mode</span>
          </>
        )}
        {viewState.measureMode && (
          <>
            <span>·</span>
            <span className="text-blue-600 font-medium">Measure Active</span>
          </>
        )}
      </div>

      {/* Bottom Right Floating Quick Camera Navigation */}
      <div className="absolute bottom-3 right-3 z-10 select-none pointer-events-auto flex flex-col gap-1 bg-white/95 backdrop-blur-sm border border-slate-200 shadow-xs p-1 rounded-lg">
        <button
          onClick={() => viewStore.triggerCamera('frameAll')}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
          title="Frame All (A)"
        >
          <Maximize size={15} />
        </button>
        <button
          onClick={() => viewStore.triggerCamera('focusSelected')}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
          title="Focus Selected (F)"
        >
          <Focus size={15} />
        </button>
        <button
          onClick={() => viewStore.triggerCamera('reset')}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
          title="Reset Camera View"
        >
          <RotateCcw size={15} />
        </button>
      </div>
    </>
  );
};
