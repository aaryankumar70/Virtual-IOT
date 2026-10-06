import React, { useState, useMemo } from 'react';
import {
  Search,
  Zap,
  Cpu,
  CircuitBoard,
  Layers,
  Volume2,
  Sliders,
  Radar,
  Wifi,
  BatteryCharging,
  Monitor,
  Boxes,
  Navigation,
  Folder,
  Sparkles,
  X,
  Plus,
  GripVertical,
  Activity,
} from 'lucide-react';
import { ComponentRegistry } from '../../core/registry/ComponentRegistry';
import { createComponent } from '../../core/factories/componentFactory';
import { projectStore, useProject } from '../../state/project/projectStore';
import { viewStore, useView } from '../../state/view/viewStore';
import { oscilloscopeStore } from '../../state/oscilloscope/oscilloscopeStore';
import { historyManager, Commands } from '../../editor/history/historyManager';
import { ComponentGraphic } from '../ComponentLibrary/ComponentGraphic';

export let activeDraggedType: string | null = null;
export function setActiveDraggedType(type: string | null) {
  activeDraggedType = type;
}

// Basic electronic components specifically highlighted for quick access
const BASIC_COMPONENT_TYPES = [
  'oscilloscope',
  'resistor',
  'led',
  'capacitor',
  'capacitor-ceramic',
  'led-rgb',
  'breadboard',
  'push-button',
  'buzzer',
  'arduino-uno',
  'lipo-battery',
];

export const ComponentPalette: React.FC = () => {
  const viewState = useView();
  const projectState = useProject();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Components', icon: Boxes },
    { id: 'basic', label: 'Basic Electronics', icon: Zap },
    { id: 'instrument', label: 'Test Instruments', icon: Activity },
    { id: 'passive', label: 'Passives', icon: Zap },
    { id: 'output', label: 'Output & Actuators', icon: Volume2 },
    { id: 'input', label: 'Input & Switches', icon: Sliders },
    { id: 'microcontroller', label: 'Microcontrollers', icon: Cpu },
    { id: 'prototyping', label: 'Prototyping', icon: Layers },
    { id: 'sensor', label: 'Sensors', icon: Radar },
    { id: 'power', label: 'Power', icon: BatteryCharging },
    { id: 'display', label: 'Displays', icon: Monitor },
    { id: 'communication', label: 'Communication', icon: Wifi },
  ];

  const allDefinitions = ComponentRegistry.getAll();

  const basicComponents = useMemo(() => {
    return BASIC_COMPONENT_TYPES.map((type) => ComponentRegistry.get(type)).filter(Boolean) as typeof allDefinitions;
  }, [allDefinitions]);

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
      if (activeCategory === 'basic') {
        return BASIC_COMPONENT_TYPES.includes(def.type);
      }
      return def.category === activeCategory;
    });
  }, [allDefinitions, searchQuery, activeCategory]);

  const handleAdd = (type: string) => {
    const offset = (Math.random() - 0.5) * 3;
    const comp = createComponent(type, { x: offset, y: 0, z: offset });
    historyManager.execute(Commands.addComponent(comp));
    viewStore.selectComponent(comp.id);
  };

  const handleDragStart = (e: React.DragEvent, type: string) => {
    setActiveDraggedType(type);
    e.dataTransfer.setData('application/json', JSON.stringify({ type }));
    e.dataTransfer.setData('text/plain', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setActiveDraggedType(null);
    viewStore.setDragPreview(null);
  };

  return (
    <aside
      id="component-palette"
      className="w-[380px] shrink-0 border-r border-slate-200 bg-white flex flex-col h-full z-20 select-none shadow-[1px_0_3px_rgba(0,0,0,0.02)]"
    >
      {/* Top Header & Tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 pt-3 text-xs bg-white">
        <div className="flex items-center gap-6">
          <button
            id="tab-components"
            onClick={() => viewStore.setActiveTab('components')}
            className={`pb-2.5 font-semibold transition-all relative ${
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
            className={`pb-2.5 font-semibold transition-all relative ${
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
            className={`pb-2.5 font-semibold transition-all relative ${
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

        <div className="text-[11px] text-slate-400 font-mono pb-2.5">
          {allDefinitions.length} parts
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
                placeholder="Search oscilloscope, resistors, LEDs, capacitors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-blue-500 text-xs text-slate-800 pl-9 pr-8 py-2 rounded-lg outline-none placeholder-slate-400 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded hover:bg-slate-200 transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Access "Basic Electronics" Tray when in 'all' view with no active search */}
          {activeCategory === 'all' && !searchQuery && (
            <div className="px-3 pt-2.5 pb-3 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap size={13} className="text-amber-500" />
                  Basic Electronics
                </span>
                <span className="text-[10px] text-slate-400">Drag to workbench</span>
              </div>

              {/* Horizontal scrollable quick-palette for Resistor, LED, Capacitor, etc. */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {basicComponents.map((def) => (
                  <div
                    key={`quick-${def.type}`}
                    id={`quick-card-${def.type}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, def.type)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleAdd(def.type)}
                    title={`Drag or click to add ${def.displayName}`}
                    className="group shrink-0 w-24 bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs rounded-lg p-1.5 flex flex-col items-center text-center cursor-grab active:cursor-grabbing transition-all"
                  >
                    <div className="w-full h-12 flex items-center justify-center p-1 bg-slate-50/80 rounded group-hover:bg-blue-50/30 transition-colors">
                      <ComponentGraphic type={def.type} className="w-full h-full max-h-10" />
                    </div>
                    <span className="text-[10.5px] font-medium text-slate-800 group-hover:text-blue-600 truncate w-full mt-1.5 leading-tight">
                      {def.displayName.split('(')[0].trim()}
                    </span>
                    <span className="text-[9px] text-slate-400 truncate w-full mt-0.5">
                      {def.type === 'oscilloscope'
                        ? '100MSa/s DSO'
                        : def.type === 'resistor'
                        ? '220Ω'
                        : def.type === 'capacitor'
                        ? '100µF'
                        : def.type === 'capacitor-ceramic'
                        ? '100nF'
                        : def.type === 'led'
                        ? '5mm Red'
                        : def.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2-Column Split: Sub-rail category list & Component cards grid */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Category Sub-Rail */}
            <div className="w-[140px] shrink-0 border-r border-slate-100 p-2 overflow-y-auto flex flex-col gap-0.5 text-xs bg-slate-50/50">
              {categories.map((cat) => {
                const IconComponent = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    id={`cat-btn-${cat.id}`}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-left transition-colors text-[11px] ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-normal'
                    }`}
                  >
                    <IconComponent
                      size={14}
                      className={isActive ? 'text-blue-600' : 'text-slate-400'}
                    />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Right Component Cards Grid */}
            <div className="flex-1 p-3 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2.5">
                {filtered.map((def) => (
                  <div
                    key={def.type}
                    id={`palette-card-${def.type}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, def.type)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleAdd(def.type)}
                    title={`Click or drag to place ${def.displayName}`}
                    className="group bg-white border border-slate-200 hover:border-blue-400 rounded-lg p-2.5 flex flex-col items-center justify-between text-center transition-all cursor-grab active:cursor-grabbing hover:shadow-sm"
                  >
                    {/* Visual Graphic Representation */}
                    <div className="w-full h-18 sm:h-20 flex items-center justify-center p-1 bg-slate-50/50 rounded-md group-hover:bg-blue-50/20 transition-colors relative">
                      <ComponentGraphic type={def.type} className="w-full h-full max-h-16" />
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
                        <GripVertical size={12} />
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
                    </div>
                  </div>
                ))}
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
        </div>
      )}
    </aside>
  );
};
