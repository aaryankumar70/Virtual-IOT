import React, { useState, useMemo } from 'react';
import {
  Search,
  Zap,
  Cpu,
  Layers,
  Volume2,
  Sliders,
  Radar,
  Wifi,
  BatteryCharging,
  Monitor,
  Boxes,
  Folder,
  Sparkles,
  X,
  GripVertical,
  Activity,
  CircuitBoard,
  Binary,
} from 'lucide-react';
import { ComponentRegistry } from '../../core/registry/ComponentRegistry';
import { createComponent } from '../../core/factories/componentFactory';
import { projectStore, useProject } from '../../state/project/projectStore';
import { viewStore, useView } from '../../state/view/viewStore';
import { oscilloscopeStore } from '../../state/oscilloscope/oscilloscopeStore';
import { historyManager, Commands } from '../../editor/history/historyManager';
import { ComponentGraphic } from '../ComponentLibrary/ComponentGraphic';
import { calculateComponentBreadboardPlacement } from '../../utils/breadboardSnap';

export let activeDraggedType: string | null = null;
export let activeDraggedState: Record<string, unknown> | null = null;

export function setActiveDraggedType(type: string | null, state: Record<string, unknown> | null = null) {
  activeDraggedType = type;
  activeDraggedState = state;
}

// Common breadboard prototyping components
const BREADBOARD_COMPONENT_TYPES = [
  'breadboard',
  'gate-and',
  'gate-or',
  'gate-xor',
  'gate-not',
  'gate-nand',
  'gate-nor',
  'gate-xnor',
  'resistor',
  'led',
  'capacitor-ceramic',
  'capacitor',
  'led-rgb',
  'push-button',
  'buzzer',
  'arduino-uno',
  'arduino-nano',
  'oscilloscope',
  'ultrasonic-sensor',
  'temperature-sensor',
  'dht11-sensor',
  'pir-sensor',
];

export const ComponentPalette: React.FC = () => {
  const viewState = useView();
  const projectState = useProject();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('breadboard');

  // Variant selections for customizable breadboard components
  const [resistorVariant, setResistorVariant] = useState<number>(220); // 220, 1000, 10000
  const [ledVariantColor, setLedVariantColor] = useState<string>('#ef4444'); // Red, Green, Blue, Yellow

  const categories = [
    { id: 'breadboard', label: 'Breadboard Essentials', icon: CircuitBoard },
    { id: 'logic', label: 'Logic Gates', icon: Binary },
    { id: 'all', label: 'All Components', icon: Boxes },
    { id: 'passive', label: 'Passives (R, C)', icon: Zap },
    { id: 'output', label: 'Outputs & LEDs', icon: Volume2 },
    { id: 'input', label: 'Switches & Inputs', icon: Sliders },
    { id: 'instrument', label: 'Instruments', icon: Activity },
    { id: 'microcontroller', label: 'Microcontrollers', icon: Cpu },
    { id: 'prototyping', label: 'Prototyping', icon: Layers },
    { id: 'sensor', label: 'Sensors', icon: Radar },
    { id: 'power', label: 'Power', icon: BatteryCharging },
    { id: 'display', label: 'Displays', icon: Monitor },
    { id: 'communication', label: 'Communication', icon: Wifi },
  ];

  const allDefinitions = ComponentRegistry.getAll();

  const filtered = useMemo(() => {
    return allDefinitions.filter((def) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        def.displayName.toLowerCase().includes(q) ||
        def.description.toLowerCase().includes(q) ||
        def.type.toLowerCase().includes(q) ||
        def.category.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (activeCategory === 'all') return true;
      if (activeCategory === 'breadboard') {
        return BREADBOARD_COMPONENT_TYPES.includes(def.type);
      }
      return def.category === activeCategory;
    });
  }, [allDefinitions, searchQuery, activeCategory]);

  const handleAdd = (type: string, customState?: Record<string, unknown>) => {
    // If a breadboard exists and component is breadboard-compatible, snap onto breadboard!
    const breadboard = projectStore.getState().components.find((c) => c.type === 'breadboard');
    let targetPos = { x: (Math.random() - 0.5) * 3, y: 0, z: (Math.random() - 0.5) * 3 };

    if (breadboard && type !== 'breadboard') {
      const randomCol = Math.floor(Math.random() * 20) + 5;
      const colX = breadboard.transform.position.x - 3.625 + (randomCol - 1) * 0.25;
      const colZ = breadboard.transform.position.z - 0.44;
      const placement = calculateComponentBreadboardPlacement(breadboard, type, colX, colZ);

      if (placement) {
        const comp = createComponent(type, placement.snappedPosition, customState);
        historyManager.execute(Commands.addComponent(comp));

        // Auto-connect leads into breadboard holes
        placement.targetHoles.forEach((target) => {
          projectStore.addConnection(
            {
              componentId: comp.id,
              interfaceId: target.pinId,
              type: 'pin',
              pinId: target.pinId,
            },
            {
              componentId: breadboard.id,
              interfaceId: target.holeId,
              type: 'breadboard-hole',
              pinId: target.holeId,
            },
            'breadboard'
          );
        });

        viewStore.selectComponent(comp.id);
        viewStore.setConnectionFeedback({
          message: `${placement.label} (Placed & Connected)`,
          severity: 'info',
        });
        return;
      }
    }

    const comp = createComponent(type, targetPos, customState);
    historyManager.execute(Commands.addComponent(comp));
    viewStore.selectComponent(comp.id);
  };

  const handleDragStart = (e: React.DragEvent, type: string, customState?: Record<string, unknown>) => {
    let payloadState = customState;
    if (!payloadState) {
      if (type === 'resistor') {
        payloadState = { resistance: resistorVariant };
      } else if (type === 'led') {
        payloadState = { color: ledVariantColor };
      }
    }

    setActiveDraggedType(type, payloadState || null);
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ type, state: payloadState })
    );
    e.dataTransfer.setData('text/plain', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setActiveDraggedType(null, null);
    viewStore.setDragPreview(null);
    viewStore.setBreadboardSnapTarget(null);
  };

  return (
    <aside
      id="component-palette"
      className="w-[390px] shrink-0 border-r border-slate-200 bg-white flex flex-col h-full z-20 select-none shadow-[1px_0_3px_rgba(0,0,0,0.02)]"
    >
      {/* Top Header & Tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 pt-3 text-xs bg-white">
        <div className="flex items-center gap-6">
          <button
            id="tab-components"
            onClick={() => viewStore.setActiveTab('components')}
            className={`pb-2.5 font-semibold transition-all relative cursor-pointer ${
              viewState.activeTab === 'components'
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Components
            {viewState.activeTab === 'components' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>

          <button
            id="tab-projects"
            onClick={() => viewStore.setActiveTab('projects')}
            className={`pb-2.5 font-semibold transition-all relative cursor-pointer ${
              viewState.activeTab === 'projects'
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Projects
            {viewState.activeTab === 'projects' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>

          <button
            id="tab-examples"
            onClick={() => viewStore.setActiveTab('examples')}
            className={`pb-2.5 font-semibold transition-all relative cursor-pointer ${
              viewState.activeTab === 'examples'
                ? 'text-blue-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Examples
            {viewState.activeTab === 'examples' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-mono pb-2.5 flex items-center gap-1.5">
          <CircuitBoard size={13} className="text-emerald-600" />
          <span>{allDefinitions.length} parts</span>
        </div>
      </div>

      {viewState.activeTab === 'components' && (
        <>
          {/* Search bar with clear button */}
          <div className="p-3 border-b border-slate-100 bg-white">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
              <input
                id="input-search-components"
                type="text"
                placeholder="Search resistors, LEDs, capacitors, breadboard..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-blue-500 text-xs text-slate-800 pl-9 pr-8 py-2 rounded-lg outline-none placeholder-slate-400 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Access "Breadboard Common Parts" Tray when viewing default or empty search */}
          {!searchQuery && (
            <div className="px-3 pt-2.5 pb-3 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CircuitBoard size={13} className="text-emerald-600" />
                  Breadboard Essentials
                </span>
                <span className="text-[10px] text-slate-400">Drag to breadboard</span>
              </div>

              {/* Horizontal scrollable quick-palette for Resistors, LEDs, Capacitors */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {/* 1. Resistor */}
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'resistor', { resistance: resistorVariant })}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleAdd('resistor', { resistance: resistorVariant })}
                  title="Drag or click to place Resistor"
                  className="group shrink-0 w-24 bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-xs rounded-lg p-1.5 flex flex-col items-center text-center cursor-grab active:cursor-grabbing transition-all"
                >
                  <div className="w-full h-12 flex items-center justify-center p-1 bg-slate-50/80 rounded group-hover:bg-emerald-50/40 transition-colors">
                    <ComponentGraphic type="resistor" className="w-full h-full max-h-10" />
                  </div>
                  <span className="text-[10.5px] font-semibold text-slate-800 group-hover:text-emerald-700 truncate w-full mt-1.5 leading-tight">
                    Resistor
                  </span>
                  <span className="text-[9px] text-emerald-600 font-mono font-medium truncate w-full mt-0.5">
                    {resistorVariant}Ω
                  </span>
                </div>

                {/* 2. LED */}
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'led', { color: ledVariantColor })}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleAdd('led', { color: ledVariantColor })}
                  title="Drag or click to place LED"
                  className="group shrink-0 w-24 bg-white border border-slate-200 hover:border-red-400 hover:shadow-xs rounded-lg p-1.5 flex flex-col items-center text-center cursor-grab active:cursor-grabbing transition-all"
                >
                  <div className="w-full h-12 flex items-center justify-center p-1 bg-slate-50/80 rounded group-hover:bg-red-50/40 transition-colors">
                    <ComponentGraphic type="led" className="w-full h-full max-h-10" />
                  </div>
                  <span className="text-[10.5px] font-semibold text-slate-800 group-hover:text-red-700 truncate w-full mt-1.5 leading-tight">
                    5mm LED
                  </span>
                  <span className="text-[9px] text-red-600 font-medium truncate w-full mt-0.5 flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: ledVariantColor }} />
                    {ledVariantColor === '#ef4444' ? 'Red' : ledVariantColor === '#10b981' ? 'Green' : ledVariantColor === '#3b82f6' ? 'Blue' : 'Yellow'}
                  </span>
                </div>

                {/* 3. Ceramic Capacitor */}
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'capacitor-ceramic')}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleAdd('capacitor-ceramic')}
                  title="Drag or click to place Ceramic Capacitor"
                  className="group shrink-0 w-24 bg-white border border-slate-200 hover:border-amber-400 hover:shadow-xs rounded-lg p-1.5 flex flex-col items-center text-center cursor-grab active:cursor-grabbing transition-all"
                >
                  <div className="w-full h-12 flex items-center justify-center p-1 bg-slate-50/80 rounded group-hover:bg-amber-50/40 transition-colors">
                    <ComponentGraphic type="capacitor-ceramic" className="w-full h-full max-h-10" />
                  </div>
                  <span className="text-[10.5px] font-semibold text-slate-800 group-hover:text-amber-700 truncate w-full mt-1.5 leading-tight">
                    Ceramic Cap
                  </span>
                  <span className="text-[9px] text-amber-600 font-mono truncate w-full mt-0.5">
                    100nF / 0.1µF
                  </span>
                </div>

                {/* 4. Electrolytic Capacitor */}
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'capacitor')}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleAdd('capacitor')}
                  title="Drag or click to place Electrolytic Capacitor"
                  className="group shrink-0 w-24 bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs rounded-lg p-1.5 flex flex-col items-center text-center cursor-grab active:cursor-grabbing transition-all"
                >
                  <div className="w-full h-12 flex items-center justify-center p-1 bg-slate-50/80 rounded group-hover:bg-blue-50/40 transition-colors">
                    <ComponentGraphic type="capacitor" className="w-full h-full max-h-10" />
                  </div>
                  <span className="text-[10.5px] font-semibold text-slate-800 group-hover:text-blue-700 truncate w-full mt-1.5 leading-tight">
                    Electro Cap
                  </span>
                  <span className="text-[9px] text-blue-600 font-mono truncate w-full mt-0.5">
                    100µF / 25V
                  </span>
                </div>

                {/* 5. Breadboard */}
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'breadboard')}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleAdd('breadboard')}
                  title="Drag or click to place Solderless Breadboard"
                  className="group shrink-0 w-24 bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-xs rounded-lg p-1.5 flex flex-col items-center text-center cursor-grab active:cursor-grabbing transition-all"
                >
                  <div className="w-full h-12 flex items-center justify-center p-1 bg-slate-50/80 rounded group-hover:bg-emerald-50/40 transition-colors">
                    <ComponentGraphic type="breadboard" className="w-full h-full max-h-10" />
                  </div>
                  <span className="text-[10.5px] font-semibold text-slate-800 group-hover:text-emerald-700 truncate w-full mt-1.5 leading-tight">
                    Breadboard
                  </span>
                  <span className="text-[9px] text-emerald-600 font-mono truncate w-full mt-0.5">
                    400 Holes
                  </span>
                </div>

                {/* 6. Push Button */}
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'push-button')}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleAdd('push-button')}
                  title="Drag or click to place Tactile Push Button"
                  className="group shrink-0 w-24 bg-white border border-slate-200 hover:border-slate-400 hover:shadow-xs rounded-lg p-1.5 flex flex-col items-center text-center cursor-grab active:cursor-grabbing transition-all"
                >
                  <div className="w-full h-12 flex items-center justify-center p-1 bg-slate-50/80 rounded group-hover:bg-slate-100 transition-colors">
                    <ComponentGraphic type="push-button" className="w-full h-full max-h-10" />
                  </div>
                  <span className="text-[10.5px] font-semibold text-slate-800 truncate w-full mt-1.5 leading-tight">
                    Push Button
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono truncate w-full mt-0.5">
                    4-Pin DIP
                  </span>
                </div>

                {/* 7. Oscilloscope */}
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, 'oscilloscope')}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleAdd('oscilloscope')}
                  title="Drag or click to place Digital Oscilloscope"
                  className="group shrink-0 w-24 bg-white border border-slate-200 hover:border-amber-400 hover:shadow-xs rounded-lg p-1.5 flex flex-col items-center text-center cursor-grab active:cursor-grabbing transition-all"
                >
                  <div className="w-full h-12 flex items-center justify-center p-1 bg-slate-50/80 rounded group-hover:bg-amber-50/40 transition-colors">
                    <ComponentGraphic type="oscilloscope" className="w-full h-full max-h-10" />
                  </div>
                  <span className="text-[10.5px] font-semibold text-slate-800 group-hover:text-amber-700 truncate w-full mt-1.5 leading-tight">
                    Oscilloscope
                  </span>
                  <span className="text-[9px] text-amber-600 font-mono truncate w-full mt-0.5">
                    Dual DSO
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 2-Column Split: Sub-rail category list & Component cards grid */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Category Sub-Rail */}
            <div className="w-[145px] shrink-0 border-r border-slate-100 p-2 overflow-y-auto flex flex-col gap-0.5 text-xs bg-slate-50/50">
              {categories.map((cat) => {
                const IconComponent = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    id={`cat-btn-${cat.id}`}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-left transition-colors text-[11px] cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-normal'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <IconComponent
                        size={14}
                        className={isActive ? 'text-blue-600 shrink-0' : 'text-slate-400 shrink-0'}
                      />
                      <span className="truncate">{cat.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Component Cards Grid */}
            <div className="flex-1 p-3 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2.5">
                {filtered.map((def) => {
                  const isResistor = def.type === 'resistor';
                  const isLED = def.type === 'led';
                  const isBreadboard = def.type === 'breadboard';

                  return (
                    <div
                      key={def.type}
                      id={`palette-card-${def.type}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, def.type)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleAdd(def.type)}
                      title={`Click to place or drag onto breadboard`}
                      className="group bg-white border border-slate-200 hover:border-blue-400 rounded-lg p-2.5 flex flex-col items-center justify-between text-center transition-all cursor-grab active:cursor-grabbing hover:shadow-xs relative"
                    >
                      {/* Visual Graphic Representation */}
                      <div className="w-full h-18 sm:h-20 flex items-center justify-center p-1 bg-slate-50/60 rounded-md group-hover:bg-blue-50/20 transition-colors relative">
                        <ComponentGraphic type={def.type} className="w-full h-full max-h-16" />
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
                          <GripVertical size={13} />
                        </div>
                      </div>

                      {/* Component Info */}
                      <div className="w-full mt-2">
                        <h4 className="text-xs font-semibold text-slate-800 group-hover:text-blue-600 truncate leading-tight">
                          {def.displayName}
                        </h4>
                        <span className="text-[10px] text-slate-400 capitalize block mt-0.5 truncate">
                          {def.category}
                        </span>

                        {/* Interactive Variant Pills for Resistor Values */}
                        {isResistor && (
                          <div
                            className="flex items-center justify-center gap-1 mt-2 pt-1.5 border-t border-slate-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {[220, 1000, 10000].map((val) => (
                              <button
                                key={val}
                                onClick={() => setResistorVariant(val)}
                                draggable
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  setResistorVariant(val);
                                  handleDragStart(e, 'resistor', { resistance: val });
                                }}
                                onDragEnd={handleDragEnd}
                                className={`text-[9px] font-mono px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                                  resistorVariant === val
                                    ? 'bg-blue-600 text-white font-semibold'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                                title={`Drag or set ${val >= 1000 ? `${val / 1000}k` : val}Ω`}
                              >
                                {val >= 1000 ? `${val / 1000}k` : val}Ω
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Interactive Variant Swatches for LED Colors */}
                        {isLED && (
                          <div
                            className="flex items-center justify-center gap-1.5 mt-2 pt-1.5 border-t border-slate-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {[
                              { color: '#ef4444', label: 'Red' },
                              { color: '#10b981', label: 'Green' },
                              { color: '#3b82f6', label: 'Blue' },
                              { color: '#eab308', label: 'Yellow' },
                            ].map((c) => (
                              <button
                                key={c.color}
                                onClick={() => setLedVariantColor(c.color)}
                                draggable
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  setLedVariantColor(c.color);
                                  handleDragStart(e, 'led', { color: c.color });
                                }}
                                onDragEnd={handleDragEnd}
                                style={{ backgroundColor: c.color }}
                                className={`w-3.5 h-3.5 rounded-full transition-transform cursor-pointer ${
                                  ledVariantColor === c.color
                                    ? 'scale-125 ring-2 ring-slate-800'
                                    : 'hover:scale-110 opacity-75 hover:opacity-100'
                                }`}
                                title={`Drag or set ${c.label} LED`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {filtered.length === 0 && (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No components found matching &ldquo;{searchQuery}&rdquo;
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Projects Tab */}
      {viewState.activeTab === 'projects' && (
        <div className="p-4 flex flex-col gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 text-slate-700 font-semibold mb-1">
              <Folder size={16} className="text-blue-600" />
              <span>{projectState.metadata.name}</span>
            </div>
            <p className="text-slate-500 text-[11px] mb-3">
              {projectState.metadata.description || 'Current active virtual laboratory circuit'}
            </p>
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-200 pt-2">
              <span>{projectState.components.length} components</span>
              <span>{projectState.connections.length} connections</span>
            </div>
          </div>
        </div>
      )}

      {/* Examples Tab */}
      {viewState.activeTab === 'examples' && (
        <div className="p-4 flex flex-col gap-3 text-xs overflow-y-auto">
          {/* Example 1: Oscilloscope connected to breadboard PWM and RC Filter */}
          <div
            id="example-oscilloscope-lab"
            onClick={() => {
              projectStore.loadOscilloscopeCircuit();
              oscilloscopeStore.openOscilloscope();
            }}
            className="p-3 rounded-lg border border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50/30 cursor-pointer transition-all flex items-start gap-3 shadow-2xs group"
          >
            <div className="p-2 rounded-md bg-amber-50 text-amber-600 group-hover:bg-amber-100/70 transition-colors">
              <Activity size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-semibold text-slate-800 group-hover:text-amber-700">Oscilloscope PWM & RC Filter Lab</h4>
                <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-mono font-medium">Featured</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Dual-channel DSO connected to breadboard pins analyzing 490Hz PWM and filtered analog waveform.
              </p>
            </div>
          </div>

          {/* Example 2: Arduino Uno LED Circuit */}
          <div
            id="example-arduino-led"
            onClick={() => projectStore.loadExampleCircuit()}
            className="p-3 rounded-lg border border-slate-200 hover:border-blue-400 bg-white hover:bg-slate-50 cursor-pointer transition-all flex items-start gap-3 shadow-2xs group"
          >
            <div className="p-2 rounded-md bg-blue-50 text-blue-600 group-hover:bg-blue-100/70 transition-colors">
              <Sparkles size={18} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 group-hover:text-blue-600">Arduino Uno LED & OLED Circuit</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Arduino Uno connected via breadboard to 220Ω resistor, 5mm LED, and I2C OLED display.
              </p>
            </div>
          </div>

          {/* Example 3: Digital Logic Gates Lab */}
          <div
            id="example-logic-gates"
            onClick={() => projectStore.loadLogicGateCircuit()}
            className="p-3 rounded-lg border border-slate-200 hover:border-sky-400 bg-white hover:bg-sky-50/40 cursor-pointer transition-all flex items-start gap-3 shadow-2xs group"
          >
            <div className="p-2 rounded-md bg-sky-50 text-sky-600 group-hover:bg-sky-100/70 transition-colors">
              <Binary size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-semibold text-slate-800 group-hover:text-sky-700">Digital Logic Gates Lab</h4>
                <span className="text-[9px] bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded font-mono font-medium">New</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                74HC08 AND Gate & 74HC86 XOR Gate wired onto breadboard with live truth tables and output LED.
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
