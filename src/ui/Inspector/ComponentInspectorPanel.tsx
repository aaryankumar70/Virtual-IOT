import React, { useState } from 'react';
import {
  Trash2,
  ChevronDown,
  ChevronUp,
  Link2,
  Unlink,
} from 'lucide-react';
import { useView, viewStore } from '../../state/view/viewStore';
import { useProject, projectStore } from '../../state/project/projectStore';
import { historyManager, Commands } from '../../editor/history/historyManager';
import { ComponentGraphic } from '../ComponentLibrary/ComponentGraphic';

export const ComponentInspectorPanel: React.FC = () => {
  const viewState = useView();
  const projectState = useProject();
  const [showAllPins, setShowAllPins] = useState(false);

  const selectedCompId = viewState.selectedComponentIds[0];
  const selectedComponent = projectState.components.find((c) => c.id === selectedCompId);
  const selectedConnection = projectState.connections.find(
    (c) => c.id === viewState.selectedConnectionId
  );

  const handleDeleteComponent = () => {
    if (!selectedComponent) return;
    const attachedConns = projectState.connections.filter(
      (c) =>
        c.source.componentId === selectedComponent.id ||
        c.target.componentId === selectedComponent.id
    );
    historyManager.execute(Commands.deleteComponent(selectedComponent, attachedConns));
    viewStore.clearSelection();
  };

  const handleDeleteConnection = () => {
    if (!selectedConnection) return;
    historyManager.execute(Commands.deleteConnection(selectedConnection));
    viewStore.clearSelection();
  };

  const handleTransformChange = (
    prop: 'position' | 'rotation' | 'scale',
    axis: 'x' | 'y' | 'z',
    value: number
  ) => {
    if (!selectedComponent) return;
    const current = selectedComponent.transform[prop];
    const updated = { ...current, [axis]: value };
    projectStore.updateComponentTransform(selectedComponent.id, {
      [prop]: updated,
    });
  };

  // 1. INSPECT WIRE / CONNECTION
  if (selectedConnection) {
    const sourceComp = projectState.components.find(
      (c) => c.id === selectedConnection.source.componentId
    );
    const sourcePin = sourceComp?.pins.find(
      (p) => p.id === selectedConnection.source.pinId
    );
    const targetComp = projectState.components.find(
      (c) => c.id === selectedConnection.target.componentId
    );
    const targetPin = targetComp?.pins.find(
      (p) => p.id === selectedConnection.target.pinId
    );

    return (
      <aside
        id="inspector-panel-connection"
        className="w-[340px] shrink-0 border-l border-slate-200 bg-white flex flex-col h-full z-20 select-none shadow-[-1px_0_3px_rgba(0,0,0,0.02)] text-xs"
      >
        <div className="flex items-center border-b border-slate-200 px-4 pt-3 gap-6 bg-white">
          <button
            onClick={() => viewStore.setInspectorTab('inspector')}
            className={`pb-2.5 font-semibold relative ${
              viewState.inspectorTab === 'inspector'
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Inspector
            {viewState.inspectorTab === 'inspector' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
          <button
            onClick={() => viewStore.setInspectorTab('properties')}
            className={`pb-2.5 font-semibold relative ${
              viewState.inspectorTab === 'properties'
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Properties
            {viewState.inspectorTab === 'properties' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-800 text-sm">Wire Connection</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
              {selectedConnection.id}
            </span>
          </div>

          {/* Endpoints */}
          <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Connected Terminals
            </span>
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Source</span>
              <div className="text-right">
                <div className="text-slate-800 font-medium">{sourceComp?.name}</div>
                <div className="text-[11px] text-blue-600 font-mono">{sourcePin?.name}</div>
              </div>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500">Target</span>
              <div className="text-right">
                <div className="text-slate-800 font-medium">{targetComp?.name}</div>
                <div className="text-[11px] text-blue-600 font-mono">{targetPin?.name}</div>
              </div>
            </div>
          </div>

          {/* Wire Color Palette */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-slate-700">Wire Color</span>
            <div className="flex items-center gap-2">
              {['#3b82f6', '#ef4444', '#22c55e', '#fbbf24', '#a78bfa', '#0f172a', '#94a3b8'].map(
                (col) => (
                  <button
                    key={col}
                    onClick={() => {
                      projectStore.removeConnection(selectedConnection.id);
                      projectStore.addConnection(
                        selectedConnection.source,
                        selectedConnection.target,
                        col
                      );
                    }}
                    style={{ backgroundColor: col }}
                    className={`w-6 h-6 rounded-full border ${
                      selectedConnection.color === col
                        ? 'ring-2 ring-blue-500 scale-110 shadow-xs'
                        : 'border-slate-300'
                    } transition-transform`}
                  />
                )
              )}
            </div>
          </div>

          <button
            onClick={handleDeleteConnection}
            className="w-full flex items-center justify-center gap-1.5 py-2 mt-4 rounded-md bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-medium transition-colors"
          >
            <Trash2 size={13} />
            <span>Delete Wire</span>
          </button>
        </div>
      </aside>
    );
  }

  // 2. INSPECT COMPONENT (Matches reference image)
  if (selectedComponent) {
    const compConns = projectState.connections.filter(
      (c) =>
        c.source.componentId === selectedComponent.id ||
        c.target.componentId === selectedComponent.id
    );

    const radToDeg = (rad: number) => Math.round((rad * 180) / Math.PI);
    const degToRad = (deg: number) => (deg * Math.PI) / 180;

    const displayedPins = showAllPins
      ? selectedComponent.pins
      : selectedComponent.pins.slice(0, 5);

    return (
      <aside
        id="inspector-panel-component"
        className="w-[340px] shrink-0 border-l border-slate-200 bg-white flex flex-col h-full z-20 select-none shadow-[-1px_0_3px_rgba(0,0,0,0.02)] text-xs"
      >
        {/* Top 2 Tabs */}
        <div className="flex items-center border-b border-slate-200 px-4 pt-3 gap-6 bg-white">
          <button
            id="inspector-tab-btn"
            onClick={() => viewStore.setInspectorTab('inspector')}
            className={`pb-2.5 font-semibold relative ${
              viewState.inspectorTab === 'inspector'
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Inspector
            {viewState.inspectorTab === 'inspector' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
          <button
            id="properties-tab-btn"
            onClick={() => viewStore.setInspectorTab('properties')}
            className={`pb-2.5 font-semibold relative ${
              viewState.inspectorTab === 'properties'
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Properties
            {viewState.inspectorTab === 'properties' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {/* Header Component Thumbnail & Title Card */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="w-14 h-12 bg-white rounded-md border border-slate-200 flex items-center justify-center p-1 shrink-0">
              <ComponentGraphic type={selectedComponent.type} className="w-full h-full max-h-10" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-900 text-sm truncate leading-tight">
                {selectedComponent.name}
              </h3>
              <p className="text-slate-500 text-[11px] capitalize truncate mt-0.5">
                {selectedComponent.type.replace('-', ' ')}
              </p>
            </div>
          </div>

          {/* Section: Transform */}
          <div className="flex flex-col gap-2">
            <span className="font-bold text-xs text-slate-900">Transform</span>

            {/* Position */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 w-16">Position</span>
              <div className="flex items-center gap-1.5 flex-1">
                {(['x', 'y', 'z'] as const).map((axis) => (
                  <div
                    key={axis}
                    className="flex items-center flex-1 bg-slate-50 border border-slate-200 rounded-md px-2 py-1"
                  >
                    <span className="text-[10px] text-slate-400 font-semibold uppercase mr-1">
                      {axis}
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      value={Number(selectedComponent.transform.position[axis].toFixed(2))}
                      onChange={(e) =>
                        handleTransformChange('position', axis, parseFloat(e.target.value) || 0)
                      }
                      className="w-full bg-transparent text-center font-mono text-[11px] text-slate-800 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Rotation */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 w-16">Rotation</span>
              <div className="flex items-center gap-1.5 flex-1">
                {(['x', 'y', 'z'] as const).map((axis) => (
                  <div
                    key={axis}
                    className="flex items-center flex-1 bg-slate-50 border border-slate-200 rounded-md px-2 py-1"
                  >
                    <span className="text-[10px] text-slate-400 font-semibold uppercase mr-1">
                      {axis}
                    </span>
                    <input
                      type="number"
                      step="15"
                      value={radToDeg(selectedComponent.transform.rotation[axis])}
                      onChange={(e) =>
                        handleTransformChange(
                          'rotation',
                          axis,
                          degToRad(parseFloat(e.target.value) || 0)
                        )
                      }
                      className="w-full bg-transparent text-center font-mono text-[11px] text-slate-800 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Scale */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500 w-16">Scale</span>
              <div className="flex items-center gap-1.5 flex-1">
                {(['x', 'y', 'z'] as const).map((axis) => (
                  <div
                    key={axis}
                    className="flex items-center flex-1 bg-slate-50 border border-slate-200 rounded-md px-2 py-1"
                  >
                    <span className="text-[10px] text-slate-400 font-semibold uppercase mr-1">
                      {axis}
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10"
                      value={Number(selectedComponent.transform.scale[axis].toFixed(2))}
                      onChange={(e) =>
                        handleTransformChange('scale', axis, parseFloat(e.target.value) || 1)
                      }
                      className="w-full bg-transparent text-center font-mono text-[11px] text-slate-800 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-slate-100" />

          {/* Section: Component Info */}
          <div className="flex flex-col gap-2">
            <span className="font-bold text-xs text-slate-900">Component</span>

            <div className="flex items-center justify-between py-1">
              <span className="text-[11px] text-slate-500">Type</span>
              <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-700 font-mono text-[11px]">
                {selectedComponent.type}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-[11px] text-slate-500">ID</span>
              <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-700 font-mono text-[11px]">
                {selectedComponent.id}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-[11px] text-slate-500">Category</span>
              <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-slate-700 capitalize text-[11px]">
                {selectedComponent.type.includes('uno') || selectedComponent.type.includes('esp')
                  ? 'Microcontroller'
                  : 'Hardware'}
              </span>
            </div>

            <div className="flex flex-col gap-1 mt-1">
              <span className="text-[11px] text-slate-500">Description</span>
              <p className="p-2 bg-slate-50 border border-slate-200 rounded text-slate-600 text-[11px] leading-relaxed">
                {selectedComponent.name} development module with interactive virtual pins and
                real-time circuit signal propagation.
              </p>
            </div>
          </div>

          <div className="h-[1px] bg-slate-100" />

          {/* Section: Pins */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">Pins</span>
              <span className="text-[10px] text-slate-400">
                {selectedComponent.pins.length} pins
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              {displayedPins.map((pin) => {
                const isConnected = compConns.some(
                  (c) =>
                    (c.source.componentId === selectedComponent.id && c.source.pinId === pin.id) ||
                    (c.target.componentId === selectedComponent.id && c.target.pinId === pin.id)
                );

                return (
                  <div
                    key={pin.id}
                    className="flex items-center justify-between p-2 rounded-md bg-slate-50 border border-slate-100 text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 font-mono">{pin.name}</span>
                      <span className="text-slate-400 text-[10px] capitalize">
                        {pin.type} {pin.direction}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isConnected ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Connected</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <span>Not connected</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedComponent.pins.length > 5 && (
              <button
                onClick={() => setShowAllPins(!showAllPins)}
                className="text-blue-600 hover:text-blue-700 text-[11px] font-medium flex items-center gap-1 self-start mt-1"
              >
                <span>{showAllPins ? 'Show less pins' : 'Show all pins'}</span>
                {showAllPins ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
          </div>

          <div className="h-[1px] bg-slate-100" />

          {/* Section: Connections */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900">Connections</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {compConns.length} active
              </span>
            </div>

            {compConns.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {compConns.map((conn) => {
                  const isSource = conn.source.componentId === selectedComponent.id;
                  const myPinId = isSource ? conn.source.pinId : conn.target.pinId;
                  const otherCompId = isSource ? conn.target.componentId : conn.source.componentId;
                  const otherPinId = isSource ? conn.target.pinId : conn.source.pinId;

                  const myPin = selectedComponent.pins.find((p) => p.id === myPinId);
                  const otherComp = projectState.components.find((c) => c.id === otherCompId);
                  const otherPin = otherComp?.pins.find((p) => p.id === otherPinId);

                  return (
                    <div
                      key={conn.id}
                      className="flex items-center justify-between p-2 rounded-md bg-slate-50 border border-slate-200 text-[11px]"
                    >
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: conn.color }}
                        />
                        <span className="font-mono text-slate-900">{myPin?.name}</span>
                        <span className="text-slate-400">→</span>
                        <span className="text-slate-700 truncate">
                          {otherComp?.name} ({otherPin?.name})
                        </span>
                      </div>

                      <button
                        onClick={() => projectStore.removeConnection(conn.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Disconnect wire"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 py-1">No active connections</p>
            )}
          </div>

          {/* Delete Component Button */}
          <div className="pt-2 mt-auto">
            <button
              onClick={handleDeleteComponent}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-medium transition-colors"
            >
              <Trash2 size={13} />
              <span>Delete Component</span>
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // 3. CIRCUIT SUMMARY & QUICK SHORTCUTS (Empty selection)
  return (
    <aside
      id="inspector-panel-empty"
      className="w-[340px] shrink-0 border-l border-slate-200 bg-white flex flex-col h-full z-20 select-none shadow-[-1px_0_3px_rgba(0,0,0,0.02)] text-xs"
    >
      <div className="flex items-center border-b border-slate-200 px-4 pt-3 gap-6 bg-white">
        <button
          onClick={() => viewStore.setInspectorTab('inspector')}
          className="pb-2.5 font-semibold text-blue-600 relative"
        >
          Inspector
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
        </button>
        <button
          onClick={() => viewStore.setInspectorTab('properties')}
          className="pb-2.5 font-semibold text-slate-500 hover:text-slate-800"
        >
          Properties
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 block">Components</span>
            <span className="text-lg font-bold text-slate-800 font-mono">
              {projectState.components.length}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 block">Connections</span>
            <span className="text-lg font-bold text-slate-800 font-mono">
              {projectState.connections.length}
            </span>
          </div>
        </div>

        {/* Keyboard Shortcuts Reference */}
        <div className="flex flex-col gap-2">
          <span className="font-bold text-xs text-slate-800">Keyboard Shortcuts</span>
          <div className="flex flex-col gap-1.5 text-[11px] text-slate-600">
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span>Translate / Move</span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px] text-slate-700">
                G
              </kbd>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span>Rotate</span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px] text-slate-700">
                R
              </kbd>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span>Scale</span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px] text-slate-700">
                S
              </kbd>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span>Focus Selected</span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px] text-slate-700">
                F
              </kbd>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span>Frame All</span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px] text-slate-700">
                A
              </kbd>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span>Duplicate</span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px] text-slate-700">
                Ctrl+D
              </kbd>
            </div>
            <div className="flex items-center justify-between py-1">
              <span>Delete</span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px] text-slate-700">
                Del
              </kbd>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed mt-2">
          Click any component or wire in the 3D scene to inspect and fine-tune its transform
          coordinates, parameters, and pin connections.
        </div>
      </div>
    </aside>
  );
};
