import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  Shield,
  Cpu,
  CircuitBoard,
  Layers,
  Volume2,
  Sliders,
  Radar,
  Zap,
  Wifi,
  BatteryCharging,
  Monitor,
  Boxes,
  Sparkles,
  Folder,
} from 'lucide-react';
import { ComponentRegistry } from '../../core/registry/ComponentRegistry';
import { createComponent } from '../../core/factories/componentFactory';
import { projectStore, useProject } from '../../state/project/projectStore';
import { viewStore, useView } from '../../state/view/viewStore';
import { historyManager, Commands } from '../../editor/history/historyManager';
import { ComponentGraphic } from './ComponentGraphic';

export let activeDraggedType: string | null = null;
export function setActiveDraggedType(type: string | null) {
  activeDraggedType = type;
}

export const ComponentLibraryPanel: React.FC = () => {
  const viewState = useView();
  const projectState = useProject();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Components', icon: Shield },
    { id: 'microcontroller', label: 'Microcontrollers', icon: Cpu },
    { id: 'board', label: 'Boards', icon: CircuitBoard },
    { id: 'prototyping', label: 'Prototyping', icon: Layers },
    { id: 'output', label: 'Output', icon: Volume2 },
    { id: 'input', label: 'Input', icon: Sliders },
    { id: 'sensor', label: 'Sensors', icon: Radar },
    { id: 'passive', label: 'Passive', icon: Zap },
    { id: 'communication', label: 'Communication', icon: Wifi },
    { id: 'power', label: 'Power', icon: BatteryCharging },
    { id: 'display', label: 'Displays', icon: Monitor },
    { id: 'misc', label: 'Miscellaneous', icon: Boxes },
  ];

  const allDefinitions = ComponentRegistry.getAll();

  const filtered = allDefinitions.filter((def) => {
    const matchesSearch =
      def.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      def.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      def.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = activeCategory === 'all' || def.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  const handleAdd = (type: string) => {
    const offset = (Math.random() - 0.5) * 3;
    const comp = createComponent(type, { x: offset, y: 0, z: offset });
    historyManager.execute(Commands.addComponent(comp));
    viewStore.selectComponent(comp.id);
  };

  const handleDragStart = (e: React.DragEvent, type: string) => {
    setActiveDraggedType(type);
    e.dataTransfer.setData('application/json', JSON.stringify({ type }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setActiveDraggedType(null);
    viewStore.setDragPreview(null);
  };

  return (
    <aside
      id="component-library-panel"
      className="w-[380px] shrink-0 border-r border-slate-200 bg-white flex flex-col h-full z-20 select-none shadow-[1px_0_3px_rgba(0,0,0,0.02)]"
    >
      {/* Top 3 Navigation Tabs */}
      <div className="flex items-center border-b border-slate-200 px-4 pt-3 gap-6 text-xs bg-white">
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

      {viewState.activeTab === 'components' && (
        <>
          {/* Search bar with filter icon */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3 text-slate-400" />
              <input
                id="input-search-components"
                type="text"
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-blue-500 text-xs text-slate-800 pl-9 pr-9 py-2 rounded-lg outline-none placeholder-slate-400 transition-all"
              />
              <button
                title="Filter options"
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-1"
              >
                <SlidersHorizontal size={14} />
              </button>
            </div>
          </div>

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
                    id={`lib-card-${def.type}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, def.type)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleAdd(def.type)}
                    title={`Click or drag to add ${def.displayName}`}
                    className="group bg-white border border-slate-200 hover:border-blue-400 rounded-lg p-2.5 flex flex-col items-center justify-between text-center transition-all cursor-grab active:cursor-grabbing hover:shadow-sm"
                  >
                    {/* Visual Graphic Representation */}
                    <div className="w-full h-18 sm:h-20 flex items-center justify-center p-1 bg-slate-50/50 rounded-md group-hover:bg-blue-50/20 transition-colors">
                      <ComponentGraphic type={def.type} className="w-full h-full max-h-16" />
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
          <div
            onClick={() => projectStore.loadExampleCircuit()}
            className="p-3 rounded-lg border border-slate-200 hover:border-blue-400 bg-white hover:bg-slate-50 cursor-pointer transition-all flex items-start gap-3"
          >
            <div className="p-2 rounded-md bg-blue-50 text-blue-600">
              <Sparkles size={16} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">Arduino Uno LED Circuit</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Arduino Uno connected via breadboard to 220Ω resistor and 5mm LED.
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
