import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { TopToolbar } from '../ui/Toolbar/TopToolbar';
import { ComponentPalette, activeDraggedType, setActiveDraggedType } from '../ui/ComponentPalette';
import { ComponentInspectorPanel } from '../ui/Inspector/ComponentInspectorPanel';
import { LabContextMenu } from '../ui/ContextMenu/LabContextMenu';
import { PinTooltip } from '../ui/Tooltip/PinTooltip';
import { VirtualOscilloscopePanel } from '../ui/Oscilloscope/VirtualOscilloscopePanel';
import { LogicAnalyzerPanel } from '../ui/LogicAnalyzer/LogicAnalyzerPanel';
import { LabScene } from '../scene/World/LabScene';
import { ViewportOverlay } from '../ui/Viewport/ViewportOverlay';
import { activeCameraRef } from '../scene/Camera/activeCameraRef';
import { useView, viewStore } from '../state/view/viewStore';
import { useProject, projectStore } from '../state/project/projectStore';
import { useKeyboardShortcuts } from '../editor/shortcuts/KeyboardShortcuts';
import { createComponent } from '../core/factories/componentFactory';
import { historyManager, Commands } from '../editor/history/historyManager';
import { Layers, Cpu, PanelLeftOpen, PanelRightOpen, GripVertical, CircuitBoard, Zap, Activity } from 'lucide-react';
import { findBreadboardPlacementForComponent, snapToSceneGrid } from '../utils/breadboardSnap';
import { oscilloscopeStore } from '../state/oscilloscope/oscilloscopeStore';

const QUICK_DRAG_ITEMS = [
  { type: 'breadboard', label: 'Breadboard', icon: CircuitBoard },
  { type: 'arduino-uno', label: 'Arduino Uno', icon: Cpu },
  { type: 'resistor', label: 'Resistor', icon: Zap },
  { type: 'led', label: 'LED', icon: Activity },
];

export const Workspace: React.FC = () => {
  const viewState = useView();
  const projectState = useProject();
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Activate global keyboard shortcuts
  useKeyboardShortcuts();

  // Raycast drag over handling for breadboard and 2.54mm grid snapping
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';

    const cam = activeCameraRef.current;
    const container = canvasContainerRef.current;
    if (!cam || !container || !activeDraggedType) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cam);
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    const hit = raycaster.ray.intersectPlane(groundPlane, intersection);

    if (hit) {
      const rawX = intersection.x;
      const rawZ = intersection.z;

      // Check if hovering over any breadboard in the workspace first using exact coordinates
      const placement = findBreadboardPlacementForComponent(
        projectStore.getState().components,
        activeDraggedType,
        rawX,
        rawZ
      );

      if (placement) {
        viewStore.setBreadboardSnapTarget({
          breadboardId: placement.breadboardId,
          holeId: placement.targetHoles[0]?.holeId || '',
          position: placement.snappedPosition,
          targetHoles: placement.targetHoles,
          label: placement.label,
          column: placement.column,
        });

        viewStore.setDragPreview({
          type: activeDraggedType,
          worldPos: placement.snappedPosition,
        });
        return;
      }

      // Not over a breadboard: snap to 2.54mm (0.25 unit) scene grid if enabled
      const posX = viewState.snapToGrid ? snapToSceneGrid(rawX) : Number(rawX.toFixed(2));
      const posZ = viewState.snapToGrid ? snapToSceneGrid(rawZ) : Number(rawZ.toFixed(2));

      viewStore.setBreadboardSnapTarget(null);

      viewStore.setDragPreview({
        type: activeDraggedType,
        worldPos: { x: posX, y: 0, z: posZ },
      });
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    viewStore.setDragPreview(null);
    viewStore.setBreadboardSnapTarget(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    viewStore.setDragPreview(null);

    const dataStr = e.dataTransfer.getData('application/json');
    let componentType = activeDraggedType;
    let initialStateOverrides: Record<string, unknown> | undefined = undefined;
    if (dataStr) {
      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.type) componentType = parsed.type;
        if (parsed.state) initialStateOverrides = parsed.state;
      } catch (err) {
        console.error('Failed to parse drag data:', err);
      }
    }
    setActiveDraggedType(null);
    if (!componentType) return;

    const container = canvasContainerRef.current;
    const cam = activeCameraRef.current;
    if (!container || !cam) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cam);
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    const hit = raycaster.ray.intersectPlane(groundPlane, intersection);

    const rawX = hit ? intersection.x : 0;
    const rawZ = hit ? intersection.z : 0;

    // Check if dropping onto any breadboard in the workspace
    const placement = findBreadboardPlacementForComponent(
      projectStore.getState().components,
      componentType,
      rawX,
      rawZ
    );

    if (placement) {
      const newComp = createComponent(componentType, placement.snappedPosition, initialStateOverrides);
      historyManager.execute(Commands.addComponent(newComp));
      projectStore.syncBreadboardConnectionsForComponent(newComp.id, placement);

      viewStore.selectComponent(newComp.id);
      viewStore.setBreadboardSnapTarget(null);
      viewStore.setConnectionFeedback({
        message: `${placement.label} (Inserted)`,
        severity: 'info',
      });
      return;
    }

    // Normal workspace ground drop (snapped to 2.54mm / 0.25 unit grid when enabled)
    const spawnX = viewState.snapToGrid ? snapToSceneGrid(rawX) : Number(rawX.toFixed(2));
    const spawnZ = viewState.snapToGrid ? snapToSceneGrid(rawZ) : Number(rawZ.toFixed(2));

    viewStore.setBreadboardSnapTarget(null);
    const newComp = createComponent(componentType, { x: spawnX, y: 0, z: spawnZ }, initialStateOverrides);
    historyManager.execute(Commands.addComponent(newComp));
    viewStore.selectComponent(newComp.id);
  };

  const isEmpty = projectState.components.length === 0;

  // Compute CSS Grid column template based on sidebar & inspector visibility
  const gridColsClass =
    viewState.libraryOpen && viewState.inspectorOpen
      ? 'grid-cols-[auto_minmax(0,1fr)_auto]'
      : viewState.libraryOpen && !viewState.inspectorOpen
      ? 'grid-cols-[auto_minmax(0,1fr)_auto]'
      : !viewState.libraryOpen && viewState.inspectorOpen
      ? 'grid-cols-[auto_minmax(0,1fr)_auto]'
      : 'grid-cols-[auto_minmax(0,1fr)_auto]';

  return (
    <div
      id="virtual-iot-lab-root"
      className="grid grid-rows-[auto_minmax(0,1fr)] w-screen h-screen overflow-hidden bg-slate-100"
    >
      {/* Row 1: Header for File Operations, Mode Controls, and Lab Instruments */}
      <TopToolbar />

      {/* Row 2: CSS Grid Layout for Component Drag-and-Drop Sidebar, Main 3D Canvas Container, and Inspector */}
      <div
        id="workspace-grid-body"
        className={`grid ${gridColsClass} min-h-0 min-w-0 w-full h-full overflow-hidden relative`}
      >
        {/* Left Grid Column: Component Drag-and-Drop Sidebar */}
        {viewState.libraryOpen ? (
          <ComponentPalette />
        ) : (
          <aside
            id="component-palette-collapsed"
            aria-label="Collapsed Component Drag-and-Drop Sidebar"
            className="w-12 border-r border-slate-200 bg-white flex flex-col items-center py-3 gap-2 z-20 select-none"
          >
            <button
              onClick={() => viewStore.toggleLibrary()}
              title="Expand Component Drag-and-Drop Sidebar"
              className="p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <PanelLeftOpen size={16} />
            </button>
            <div className="w-6 h-px bg-slate-200 my-1" />
            {QUICK_DRAG_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.type}
                  draggable
                  onDragStart={(e) => {
                    setActiveDraggedType(item.type, null);
                    e.dataTransfer.setData(
                      'application/json',
                      JSON.stringify({ type: item.type })
                    );
                    e.dataTransfer.setData('text/plain', item.type);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onDragEnd={() => {
                    setActiveDraggedType(null, null);
                    viewStore.setDragPreview(null);
                    viewStore.setBreadboardSnapTarget(null);
                  }}
                  title={`Drag ${item.label} into 3D Canvas`}
                  className="p-2 rounded-lg border border-slate-200/80 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-600 hover:text-blue-600 cursor-grab active:cursor-grabbing transition-all"
                >
                  <Icon size={15} />
                </div>
              );
            })}
          </aside>
        )}

        {/* Center Grid Column: Main 3D Canvas Container */}
        <main
          ref={canvasContainerRef}
          id="canvas-viewport"
          aria-label="3D Electronics Laboratory Canvas"
          className={`min-w-0 min-h-0 w-full h-full relative cursor-default bg-slate-50 overflow-hidden transition-shadow ${
            viewState.dragPreview ? 'ring-2 ring-inset ring-blue-500/50' : ''
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Active Drag-and-Drop Placement Indicator */}
          {viewState.dragPreview && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center gap-2 bg-slate-900/90 text-white px-3 py-1.5 rounded-lg shadow-md text-xs font-medium backdrop-blur-xs">
              <GripVertical size={13} className="text-blue-400" />
              <span>
                Placing <strong className="font-semibold text-blue-300">{viewState.dragPreview.type}</strong>
              </span>
              <span className="text-slate-400">·</span>
              <span className="font-mono text-[11px] text-emerald-300">
                {viewState.breadboardSnapTarget
                  ? viewState.breadboardSnapTarget.label
                  : `Grid (${viewState.dragPreview.worldPos.x.toFixed(2)}, ${viewState.dragPreview.worldPos.z.toFixed(2)})`}
              </span>
            </div>
          )}

          <Canvas
            shadows
            dpr={[1, 2]}
            camera={{ position: [0, 10, 14], fov: 45, near: 0.1, far: 1000 }}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: 'high-performance',
            }}
            onCreated={({ gl }) => {
              gl.shadowMap.type = THREE.PCFSoftShadowMap;
              gl.shadowMap.enabled = true;
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 1.05;
            }}
          >
            <LabScene />
          </Canvas>
          <ViewportOverlay />

          {isEmpty && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 text-center select-none z-10">
              <div className="max-w-lg bg-white/95 border border-slate-200/90 p-6 rounded-2xl shadow-xl backdrop-blur-md pointer-events-auto flex flex-col items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
                  <Cpu size={22} className="stroke-[2.2]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                    Welcome to IOT Simulation Lab
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                    Drop components from the left sidebar into the 3D workspace to build, wire, and test circuits with real-time continuity checking.
                  </p>
                </div>

                <div className="w-full pt-1 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      const bb = createComponent('breadboard', { x: 0, y: 0, z: 0 });
                      historyManager.execute(Commands.addComponent(bb));
                      viewStore.selectComponent(bb.id);
                    }}
                    className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Layers size={14} />
                    <span>Start Blank Breadboard Circuit</span>
                  </button>

                  <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-400">
                    <span className="w-full h-px bg-slate-100" />
                    <span className="shrink-0 px-1 font-medium">or explore pre-built labs</span>
                    <span className="w-full h-px bg-slate-100" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-0.5">
                    <button
                      onClick={() => projectStore.loadLogicGateCircuit()}
                      className="p-2 rounded-lg border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 bg-white text-left transition-all cursor-pointer group"
                    >
                      <div className="text-xs font-semibold text-slate-800 group-hover:text-sky-700 truncate">
                        Logic Gates
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">AND & XOR Gates</div>
                    </button>

                    <button
                      onClick={() => {
                        projectStore.loadOscilloscopeCircuit();
                        oscilloscopeStore.openOscilloscope();
                      }}
                      className="p-2 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 bg-white text-left transition-all cursor-pointer group"
                    >
                      <div className="text-xs font-semibold text-slate-800 group-hover:text-amber-700 truncate">
                        Oscilloscope
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">DSO & RC Filter</div>
                    </button>

                    <button
                      onClick={() => projectStore.loadExampleCircuit()}
                      className="p-2 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 bg-white text-left transition-all cursor-pointer group"
                    >
                      <div className="text-xs font-semibold text-slate-800 group-hover:text-emerald-700 truncate">
                        Arduino Uno
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">LED & OLED Circuit</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right Grid Column: Component Inspector Panel */}
        {viewState.inspectorOpen ? (
          <ComponentInspectorPanel />
        ) : (
          <aside
            id="inspector-panel-collapsed"
            aria-label="Collapsed Inspector Sidebar"
            className="w-10 border-l border-slate-200 bg-white flex flex-col items-center py-3 z-20 select-none"
          >
            <button
              onClick={() => viewStore.toggleInspector()}
              title="Expand Inspector Sidebar"
              className="p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <PanelRightOpen size={16} />
            </button>
          </aside>
        )}
      </div>

      {/* Floating Overlays & Instrumentation Modals */}
      <PinTooltip />
      <LabContextMenu />
      <VirtualOscilloscopePanel />
      <LogicAnalyzerPanel />
    </div>
  );
};
