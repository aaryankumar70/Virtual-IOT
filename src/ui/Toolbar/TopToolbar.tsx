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
} from 'lucide-react';
import { useView, viewStore } from '../../state/view/viewStore';
import { useProject, projectStore } from '../../state/project/projectStore';
import { historyManager, Commands } from '../../editor/history/historyManager';
import { serializeProject, deserializeProject } from '../../project/serialization/projectSchema';

export const TopToolbar: React.FC = () => {
  const viewState = useView();
  const projectState = useProject();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between z-30 select-none shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
    >
      {/* Hidden File Input for JSON Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Left: App Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
          <Cpu size={20} className="stroke-[2.2]" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-tight text-slate-900 leading-tight">
            Virtual IoT Lab
          </span>
          <span className="text-[11px] text-slate-400 font-normal leading-tight">
            Build · Learn · Simulate · Create
          </span>
        </div>
      </div>

      {/* Center: Main Operation Tools */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Select */}
        <button
          id="btn-tool-select"
          onClick={() => {
            viewStore.clearSelection();
          }}
          title="Selection Mode"
          className="flex flex-col items-center justify-center px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <MousePointer size={15} />
          <span className="text-[10px] font-medium mt-0.5">Select</span>
        </button>

        {/* Move */}
        <button
          id="btn-mode-translate"
          onClick={() => viewStore.setTransformMode('translate')}
          title="Move Mode (G)"
          className={`flex flex-col items-center justify-center px-2.5 py-1 rounded-lg transition-all ${
            viewState.transformMode === 'translate'
              ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
          }`}
        >
          <Move size={15} />
          <span className="text-[10px] font-medium mt-0.5">Move</span>
        </button>

        {/* Rotate */}
        <button
          id="btn-mode-rotate"
          onClick={() => viewStore.setTransformMode('rotate')}
          title="Rotate Mode (R)"
          className={`flex flex-col items-center justify-center px-2.5 py-1 rounded-lg transition-all ${
            viewState.transformMode === 'rotate'
              ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
          }`}
        >
          <RotateCw size={15} />
          <span className="text-[10px] font-medium mt-0.5">Rotate</span>
        </button>

        {/* Scale */}
        <button
          id="btn-mode-scale"
          onClick={() => viewStore.setTransformMode('scale')}
          title="Scale Mode (S)"
          className={`flex flex-col items-center justify-center px-2.5 py-1 rounded-lg transition-all ${
            viewState.transformMode === 'scale'
              ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
          }`}
        >
          <Maximize2 size={15} />
          <span className="text-[10px] font-medium mt-0.5">Scale</span>
        </button>

        {/* Wire */}
        <button
          id="btn-mode-wire"
          onClick={() => viewStore.toggleWireMode()}
          title="Wire Mode (W)"
          className={`flex flex-col items-center justify-center px-2.5 py-1 rounded-lg transition-all ${
            viewState.wireModeActive || !!viewState.activeWiring
              ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
          }`}
        >
          <Cable size={15} />
          <span className="text-[10px] font-medium mt-0.5">Wire</span>
        </button>

        <div className="w-[1px] h-6 bg-slate-200 mx-1" />

        {/* Delete */}
        <button
          id="btn-tool-delete"
          onClick={handleDeleteSelected}
          title="Delete Selected (Del/Backspace)"
          disabled={!selectedPrimaryId && !viewState.selectedConnectionId}
          className="flex flex-col items-center justify-center px-2.5 py-1 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 transition-colors"
        >
          <Trash2 size={15} />
          <span className="text-[10px] font-medium mt-0.5">Delete</span>
        </button>

        {/* Duplicate */}
        <button
          id="btn-tool-duplicate"
          onClick={handleDuplicateSelected}
          title="Duplicate Component (Ctrl+D)"
          disabled={!selectedPrimaryId}
          className="flex flex-col items-center justify-center px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-600 transition-colors"
        >
          <Copy size={15} />
          <span className="text-[10px] font-medium mt-0.5">Duplicate</span>
        </button>

        {/* Undo */}
        <button
          id="btn-undo"
          onClick={() => historyManager.undo()}
          title="Undo (Ctrl+Z)"
          className="flex flex-col items-center justify-center px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <Undo2 size={15} />
          <span className="text-[10px] font-medium mt-0.5">Undo</span>
        </button>

        {/* Redo */}
        <button
          id="btn-redo"
          onClick={() => historyManager.redo()}
          title="Redo (Ctrl+Shift+Z)"
          className="flex flex-col items-center justify-center px-2.5 py-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <Redo2 size={15} />
          <span className="text-[10px] font-medium mt-0.5">Redo</span>
        </button>
      </div>

      {/* Right: Actions & User */}
      <div className="flex items-center gap-2">
        {/* Save button */}
        <button
          id="btn-export-project"
          onClick={handleExportJSON}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-colors shadow-2xs"
          title="Save project"
        >
          <Save size={14} className="text-slate-500" />
          <span>Save</span>
        </button>

        {/* Load button */}
        <button
          id="btn-import-project"
          onClick={handleImportClick}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-colors shadow-2xs"
          title="Load project JSON"
        >
          <FolderOpen size={14} className="text-slate-500" />
          <span>Load</span>
        </button>

        {/* New button */}
        <button
          id="btn-reset-lab"
          onClick={handleNewProject}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-colors shadow-2xs"
          title="Start fresh project"
        >
          <Plus size={14} className="text-slate-500" />
          <span>New</span>
        </button>

        {/* Theme toggle */}
        <button
          id="btn-toggle-theme"
          onClick={() => viewStore.toggleTheme()}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors ml-1"
          title="Toggle theme"
        >
          {viewState.theme === 'light' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 ml-0.5">
          <User size={16} />
        </div>
      </div>
    </header>
  );
};
