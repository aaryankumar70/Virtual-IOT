import React, { useRef } from 'react';
import {
  MousePointer,
  Move,
  RotateCw,
  Maximize2,
  Cable,
  Trash2,
  Copy,
  Undo2,
  Redo2,
  Save,
  FolderOpen,
  Plus,
  Sun,
  Moon,
  User,
  Cpu,
  Activity,
  Zap,
  Boxes,
  Sliders,
} from 'lucide-react';
import { useView, viewStore } from '../../state/view/viewStore';
import { useProject, projectStore } from '../../state/project/projectStore';
import { oscilloscopeStore, useOscilloscope } from '../../state/oscilloscope/oscilloscopeStore';
import { historyManager, Commands } from '../../editor/history/historyManager';
import { serializeProject, deserializeProject } from '../../project/serialization/projectSchema';
import { checkContinuity } from '../../core/circuit/continuityChecker';

export const TopToolbar: React.FC = () => {
  const viewState = useView();
  const projectState = useProject();
  const oscState = useOscilloscope();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const continuityReport = React.useMemo(() => {
    return checkContinuity(projectState.components, projectState.connections);
  }, [projectState.components, projectState.connections]);

  const selectedPrimaryId = viewState.selectedComponentIds[0] || null;

  const handleExportJSON = () => {
    const jsonStr = serializeProject(
      projectState.metadata.name,
      projectState.components,
      projectState.connections,
      projectState.metadata.description
    );
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectState.metadata.name.toLowerCase().replace(/\s+/g, '_')}.iotlab.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = ev.target?.result as string;
        const data = deserializeProject(content);
        projectStore.loadProject(data);
        historyManager.clear();
        viewStore.clearSelection();
        viewStore.triggerCamera('frameAll');
      } catch (err: any) {
        console.error('Failed to load project file:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDeleteSelected = () => {
    if (selectedPrimaryId) {
      const comp = projectState.components.find((c) => c.id === selectedPrimaryId);
      if (comp) {
        const attached = projectState.connections.filter(
          (c) => c.source.componentId === comp.id || c.target.componentId === comp.id
        );
        historyManager.execute(Commands.deleteComponent(comp, attached));
        viewStore.clearSelection();
      }
    } else if (viewState.selectedConnectionId) {
      const conn = projectState.connections.find((c) => c.id === viewState.selectedConnectionId);
      if (conn) {
        historyManager.execute(Commands.deleteConnection(conn));
        viewStore.clearSelection();
      }
    }
  };

  const handleDuplicateSelected = () => {
    if (!selectedPrimaryId) return;
    const copy = projectStore.duplicateComponent(selectedPrimaryId);
    if (copy) {
      historyManager.execute(Commands.addComponent(copy));
      viewStore.selectComponent(copy.id);
    }
  };

  const handleNewProject = () => {
    if (projectState.components.length === 0) {
      projectStore.resetProject();
      return;
    }
    projectStore.resetProject();
    historyManager.clear();
    viewStore.clearSelection();
  };

  return (
    <header
      id="lab-top-toolbar"
      className="h-13 border-b border-slate-200 bg-white px-4 flex items-center justify-between z-30 select-none shadow-xs"
    >
      {/* Hidden File Input for JSON Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Left: App Logo, Title, and Sidebar Panels Toggle */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-2xs">
            <Cpu size={18} className="stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-tight text-slate-900 leading-tight">
              IOT Simulation Lab
            </span>
            <span className="text-[10.5px] text-slate-400 font-normal leading-tight hidden sm:inline">
              Virtual Electronics Prototyping
            </span>
          </div>
        </div>

        <div className="w-px h-5 bg-slate-200 mx-1 hidden sm:block" />

        {/* Panel Toggles */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => viewStore.toggleLibrary()}
            title={viewState.libraryOpen ? 'Hide Component Library' : 'Show Component Library'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              viewState.libraryOpen
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Boxes size={14} />
            <span className="hidden md:inline">Components</span>
          </button>

          <button
            onClick={() => viewStore.toggleInspector()}
            title={viewState.inspectorOpen ? 'Hide Inspector' : 'Show Inspector'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              viewState.inspectorOpen
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Sliders size={14} />
            <span className="hidden md:inline">Inspector</span>
          </button>
        </div>
      </div>

      {/* Center: Clean Segmented Controls for Mode & Instruments */}
      <div className="flex items-center gap-2">
        {/* Transform & Wiring Modes */}
        <div className="flex items-center bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/60 shadow-2xs">
          {/* Select Mode */}
          <button
            id="btn-tool-select"
            onClick={() => {
              viewStore.clearSelection();
              if (viewState.wireModeActive) viewStore.toggleWireMode();
            }}
            title="Selection Mode"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
              !viewState.wireModeActive && !viewState.activeWiring && viewState.selectedComponentIds.length === 0
                ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MousePointer size={13} />
            <span className="hidden lg:inline text-[11px]">Select</span>
          </button>

          {/* Move Mode */}
          <button
            id="btn-mode-translate"
            onClick={() => {
              if (viewState.wireModeActive) viewStore.toggleWireMode();
              viewStore.setTransformMode('translate');
            }}
            title="Move Component (G)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
              !viewState.wireModeActive && viewState.transformMode === 'translate' && viewState.selectedComponentIds.length > 0
                ? 'bg-white text-blue-600 font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Move size={13} />
            <span className="hidden lg:inline text-[11px]">Move</span>
          </button>

          {/* Rotate Mode */}
          <button
            id="btn-mode-rotate"
            onClick={() => {
              if (viewState.wireModeActive) viewStore.toggleWireMode();
              viewStore.setTransformMode('rotate');
            }}
            title="Rotate Component (R)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
              !viewState.wireModeActive && viewState.transformMode === 'rotate'
                ? 'bg-white text-blue-600 font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCw size={13} />
            <span className="hidden lg:inline text-[11px]">Rotate</span>
          </button>

          {/* Scale Mode */}
          <button
            id="btn-mode-scale"
            onClick={() => {
              if (viewState.wireModeActive) viewStore.toggleWireMode();
              viewStore.setTransformMode('scale');
            }}
            title="Scale Component (S)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
              !viewState.wireModeActive && viewState.transformMode === 'scale'
                ? 'bg-white text-blue-600 font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Maximize2 size={13} />
            <span className="hidden lg:inline text-[11px]">Scale</span>
          </button>

          {/* Wire Mode */}
          <button
            id="btn-mode-wire"
            onClick={() => viewStore.toggleWireMode()}
            title="Wiring Tool (W)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
              viewState.wireModeActive || !!viewState.activeWiring
                ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cable size={13} />
            <span className="text-[11px]">Wire</span>
          </button>
        </div>

        {/* Instruments / Simulation Tools */}
        <div className="flex items-center gap-1">
          {/* Continuity Checker Button */}
          <button
            id="btn-tool-continuity"
            onClick={() => viewStore.toggleContinuityMode()}
            title="Electrical Continuity Checker (Green = valid path, Red = short circuit)"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
              viewState.continuityMode
                ? continuityReport.hasShortCircuit
                  ? 'bg-red-50 text-red-700 border-red-300 shadow-2xs'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <div className="relative flex items-center">
              <Zap
                size={14}
                className={
                  viewState.continuityMode
                    ? continuityReport.hasShortCircuit
                      ? 'text-red-600 fill-current'
                      : 'text-emerald-600 fill-current'
                    : 'text-slate-500'
                }
              />
              {continuityReport.hasShortCircuit ? (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </span>
              ) : viewState.continuityMode ? (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
              ) : null}
            </div>
            <span className="hidden sm:inline text-[11px]">Continuity</span>
          </button>

          {/* Digital Oscilloscope Button */}
          <button
            id="btn-tool-oscilloscope"
            onClick={() => oscilloscopeStore.openOscilloscope()}
            title="Digital Oscilloscope & Waveform Analyzer (O)"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
              oscState.isOpen
                ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50'
            }`}
          >
            <Activity
              size={14}
              className={oscState.isOpen ? 'animate-pulse text-amber-600' : 'text-slate-500'}
            />
            <span className="hidden sm:inline text-[11px]">Scope</span>
          </button>
        </div>

        {/* Edit History (Undo, Redo, Duplicate, Delete) */}
        <div className="hidden xl:flex items-center gap-0.5 bg-slate-50 p-0.5 rounded-lg border border-slate-200/60">
          <button
            id="btn-undo"
            onClick={() => historyManager.undo()}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded text-slate-500 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
          >
            <Undo2 size={13} />
          </button>
          <button
            id="btn-redo"
            onClick={() => historyManager.redo()}
            title="Redo (Ctrl+Shift+Z)"
            className="p-1.5 rounded text-slate-500 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
          >
            <Redo2 size={13} />
          </button>
          <div className="w-px h-3 bg-slate-200 mx-0.5" />
          <button
            id="btn-tool-duplicate"
            onClick={handleDuplicateSelected}
            title="Duplicate Component (Ctrl+D)"
            disabled={!selectedPrimaryId}
            className="p-1.5 rounded text-slate-500 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          >
            <Copy size={13} />
          </button>
          <button
            id="btn-tool-delete"
            onClick={handleDeleteSelected}
            title="Delete Selected (Del)"
            disabled={!selectedPrimaryId && !viewState.selectedConnectionId}
            className="p-1.5 rounded text-slate-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Right: Project Actions, Theme & Profile */}
      <div className="flex items-center gap-1.5">
        <button
          id="btn-reset-lab"
          onClick={handleNewProject}
          title="New Circuit"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium transition-colors cursor-pointer"
        >
          <Plus size={14} className="text-slate-400" />
          <span className="hidden md:inline">New</span>
        </button>

        <button
          id="btn-import-project"
          onClick={handleImportClick}
          title="Open Saved Circuit (.json)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium transition-colors cursor-pointer"
        >
          <FolderOpen size={14} className="text-slate-400" />
          <span className="hidden md:inline">Open</span>
        </button>

        <button
          id="btn-export-project"
          onClick={handleExportJSON}
          title="Save Circuit to Disk"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-2xs transition-colors cursor-pointer"
        >
          <Save size={14} />
          <span>Save</span>
        </button>

        <div className="w-px h-4 bg-slate-200 mx-1 hidden sm:block" />

        <button
          id="btn-toggle-theme"
          onClick={() => viewStore.toggleTheme()}
          title="Toggle Theme"
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          {viewState.theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div
          className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 ml-0.5"
          title="User Session"
        >
          <User size={14} />
        </div>
      </div>
    </header>
  );
};
