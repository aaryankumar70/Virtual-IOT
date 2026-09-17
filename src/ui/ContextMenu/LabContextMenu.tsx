import React, { useEffect, useRef } from 'react';
import {
  Move,
  RotateCw,
  Copy,
  Trash2,
  Focus,
  Unlink,
  Edit2,
  Plus,
  Compass,
} from 'lucide-react';
import { useView, viewStore } from '../../state/view/viewStore';
import { useProject, projectStore } from '../../state/project/projectStore';
import { historyManager, Commands } from '../../editor/history/historyManager';
import { createComponent } from '../../core/factories/componentFactory';

export const LabContextMenu: React.FC = () => {
  const viewState = useView();
  const projectState = useProject();
  const menuRef = useRef<HTMLDivElement>(null);

  const menu = viewState.contextMenu;

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        viewStore.setContextMenu(null);
      }
    };
    window.addEventListener('mousedown', handleGlobalClick);
    return () => window.removeEventListener('mousedown', handleGlobalClick);
  }, []);

  if (!menu) return null;

  const comp = menu.componentId
    ? projectState.components.find((c) => c.id === menu.componentId)
    : null;
  const conn = menu.connectionId
    ? projectState.connections.find((c) => c.id === menu.connectionId)
    : null;

  const handleAction = (action: () => void) => {
    action();
    viewStore.setContextMenu(null);
  };

  // Ensure menu doesn't overflow viewport edges
  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(menu.x, window.innerWidth - 200),
    top: Math.min(menu.y, window.innerHeight - 260),
    zIndex: 9999,
  };

  return (
    <div
      ref={menuRef}
      id="lab-context-menu"
      style={style}
      className="w-48 bg-white border border-slate-200 rounded-lg shadow-xl p-1 text-xs select-none backdrop-blur-md"
    >
      {/* 1. Component Context Menu */}
      {comp && (
        <div className="flex flex-col">
          <div className="px-2.5 py-1.5 text-[10px] text-slate-400 font-mono border-b border-slate-100 mb-1 truncate">
            {comp.name}
          </div>

          <button
            onClick={() =>
              handleAction(() => {
                viewStore.selectComponent(comp.id);
                viewStore.setTransformMode('translate');
              })
            }
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <Move size={13} className="text-blue-600" />
            <span>Move</span>
          </button>

          <button
            onClick={() =>
              handleAction(() => {
                viewStore.selectComponent(comp.id);
                viewStore.setTransformMode('rotate');
              })
            }
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <RotateCw size={13} className="text-blue-600" />
            <span>Rotate</span>
          </button>

          <button
            onClick={() =>
              handleAction(() => {
                viewStore.selectComponent(comp.id);
                viewStore.triggerCamera('focusSelected');
              })
            }
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <Focus size={13} className="text-blue-600" />
            <span>Focus Camera</span>
          </button>

          <button
            onClick={() =>
              handleAction(() => {
                const copy = projectStore.duplicateComponent(comp.id);
                if (copy) {
                  historyManager.execute(Commands.addComponent(copy));
                  viewStore.selectComponent(copy.id);
                }
              })
            }
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <Copy size={13} className="text-slate-500" />
            <span>Duplicate</span>
          </button>

          <div className="h-[1px] bg-slate-100 my-1" />

          <button
            onClick={() =>
              handleAction(() => {
                const attached = projectState.connections.filter(
                  (c) => c.source.componentId === comp.id || c.target.componentId === comp.id
                );
                historyManager.execute(Commands.deleteComponent(comp, attached));
                viewStore.clearSelection();
              })
            }
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-red-50 text-red-600 transition-colors"
          >
            <Trash2 size={13} />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* 2. Wire Connection Context Menu */}
      {conn && (
        <div className="flex flex-col">
          <div className="px-2.5 py-1.5 text-[10px] text-slate-400 font-mono border-b border-slate-100 mb-1 truncate">
            Wire: {conn.id}
          </div>

          <button
            onClick={() =>
              handleAction(() => {
                historyManager.execute(Commands.deleteConnection(conn));
                viewStore.clearSelection();
              })
            }
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-red-50 text-red-600 transition-colors"
          >
            <Unlink size={13} />
            <span>Delete Wire</span>
          </button>
        </div>
      )}

      {/* 3. Empty Workbench Ground Context Menu */}
      {!comp && !conn && (
        <div className="flex flex-col">
          <div className="px-2.5 py-1.5 text-[10px] text-slate-400 font-mono border-b border-slate-100 mb-1">
            Workbench
          </div>

          <button
            onClick={() =>
              handleAction(() => {
                const c = createComponent('arduino-uno', { x: 0, y: 0, z: 0 });
                historyManager.execute(Commands.addComponent(c));
                viewStore.selectComponent(c.id);
              })
            }
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <Plus size={13} className="text-blue-600" />
            <span>Add Arduino Uno</span>
          </button>

          <button
            onClick={() =>
              handleAction(() => {
                const c = createComponent('breadboard', { x: 0, y: 0, z: 2 });
                historyManager.execute(Commands.addComponent(c));
                viewStore.selectComponent(c.id);
              })
            }
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <Plus size={13} className="text-blue-600" />
            <span>Add Breadboard</span>
          </button>

          <button
            onClick={() =>
              handleAction(() => {
                const c = createComponent('led', { x: 0, y: 0, z: -2 });
                historyManager.execute(Commands.addComponent(c));
                viewStore.selectComponent(c.id);
              })
            }
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <Plus size={13} className="text-blue-600" />
            <span>Add LED</span>
          </button>

          <div className="h-[1px] bg-slate-100 my-1" />

          <button
            onClick={() => handleAction(() => viewStore.triggerCamera('reset'))}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <Compass size={13} className="text-slate-500" />
            <span>Reset Camera</span>
          </button>
        </div>
      )}
    </div>
  );
};
