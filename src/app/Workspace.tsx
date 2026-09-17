import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { TopToolbar } from '../ui/Toolbar/TopToolbar';
import { ComponentLibraryPanel, activeDraggedType, setActiveDraggedType } from '../ui/ComponentLibrary/ComponentLibraryPanel';
import { ComponentInspectorPanel } from '../ui/Inspector/ComponentInspectorPanel';
import { LabContextMenu } from '../ui/ContextMenu/LabContextMenu';
import { PinTooltip } from '../ui/Tooltip/PinTooltip';
import { LabScene } from '../scene/World/LabScene';
import { ViewportOverlay } from '../ui/Viewport/ViewportOverlay';
import { activeCameraRef } from '../scene/Camera/activeCameraRef';
import { useView, viewStore } from '../state/view/viewStore';
import { useProject, projectStore } from '../state/project/projectStore';
import { useKeyboardShortcuts } from '../editor/shortcuts/KeyboardShortcuts';
import { createComponent } from '../core/factories/componentFactory';
import { historyManager, Commands } from '../editor/history/historyManager';
import { Sparkles } from 'lucide-react';

export const Workspace: React.FC = () => {
  const viewState = useView();
  const projectState = useProject();
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Activate global keyboard shortcuts (G, R, S, F, A, Ctrl+D, Ctrl+Z, Del, Esc)
  useKeyboardShortcuts();

  // Raycast drag over handling with live active camera for ghost preview
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
      let posX = intersection.x;
      let posZ = intersection.z;
      if (viewState.snapToGrid) {
        posX = Math.round(posX);
        posZ = Math.round(posZ);
      } else {
        posX = Number(posX.toFixed(2));
        posZ = Number(posZ.toFixed(2));
      }

      viewStore.setDragPreview({
        type: activeDraggedType,
        worldPos: { x: posX, y: 0, z: posZ },
      });
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    viewStore.setDragPreview(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    viewStore.setDragPreview(null);

    const dataStr = e.dataTransfer.getData('application/json');
    let componentType = activeDraggedType;
    if (dataStr) {
      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.type) componentType = parsed.type;
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

    let spawnX = hit ? intersection.x : 0;
    let spawnZ = hit ? intersection.z : 0;

    if (viewState.snapToGrid) {
      spawnX = Math.round(spawnX);
      spawnZ = Math.round(spawnZ);
    } else {
      spawnX = Number(spawnX.toFixed(2));
      spawnZ = Number(spawnZ.toFixed(2));
    }

    const newComp = createComponent(componentType, { x: spawnX, y: 0, z: spawnZ });
    historyManager.execute(Commands.addComponent(newComp));
    viewStore.selectComponent(newComp.id);
  };

  const isEmpty = projectState.components.length === 0;

  return (
    <div id="virtual-iot-lab-root" className="flex flex-col w-screen h-screen overflow-hidden bg-slate-100">
      {/* Top CAD Toolbar */}
      <TopToolbar />

      {/* Main Studio Viewport */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left: Component Library Panel */}
        {viewState.libraryOpen && <ComponentLibraryPanel />}

        {/* Center: 3D Engineering Viewport */}
        <div
          ref={canvasContainerRef}
          id="canvas-viewport"
          className="flex-1 h-full relative cursor-default bg-slate-50"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Canvas
            shadows
            camera={{ position: [0, 10, 14], fov: 45, near: 0.1, far: 1000 }}
            gl={{ antialias: true, alpha: false }}
          >
            <LabScene />
          </Canvas>

          {/* Floating Viewport Overlays (Top controls, Bottom status, Quick nav) */}
          <ViewportOverlay />

          {/* Empty State Onboarding Hint */}
          {isEmpty && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 text-center select-none z-10">
              <div className="max-w-md bg-white/95 border border-slate-200 p-6 rounded-xl shadow-lg backdrop-blur-sm pointer-events-auto flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Sparkles size={20} />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Your laboratory is empty
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Drag a component from the library on the left into the 3D workspace to begin
                  building your circuit, or load an example circuit.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => projectStore.loadExampleCircuit()}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs text-white font-medium transition-colors shadow-xs"
                  >
                    Load Demo Circuit
                  </button>
                  <button
                    onClick={() => {
                      const c = createComponent('arduino-uno', { x: 0, y: 0, z: 0 });
                      historyManager.execute(Commands.addComponent(c));
                      viewStore.selectComponent(c.id);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium transition-colors shadow-2xs"
                  >
                    Add Arduino Uno
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Component / Wire Inspector Panel */}
        {viewState.inspectorOpen && <ComponentInspectorPanel />}
      </div>

      {/* Floating Overlays */}
      <PinTooltip />
      <LabContextMenu />
    </div>
  );
};
