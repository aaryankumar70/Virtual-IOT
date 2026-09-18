import { useEffect } from 'react';
import { useView, viewStore } from '../../state/view/viewStore';
import { useProject, projectStore } from '../../state/project/projectStore';
import { historyManager, Commands } from '../history/historyManager';

export function useKeyboardShortcuts() {
  const viewState = useView();
  const projectState = useProject();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Never trigger while user is typing inside an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Undo / Redo
      if (cmdOrCtrl && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) {
          historyManager.redo();
        } else {
          historyManager.undo();
        }
        return;
      }

      // Duplicate: Ctrl+D
      if (cmdOrCtrl && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        if (viewState.selectedComponentIds.length > 0) {
          const id = viewState.selectedComponentIds[0];
          const copy = projectStore.duplicateComponent(id);
          if (copy) {
            historyManager.execute(Commands.addComponent(copy));
            viewStore.selectComponent(copy.id);
          }
        }
        return;
      }

      // Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (viewState.selectedComponentIds.length > 0) {
          e.preventDefault();
          viewState.selectedComponentIds.forEach((id) => {
            const comp = projectState.components.find((c) => c.id === id);
            if (comp) {
              const conns = projectState.connections.filter(
                (c) => c.source.componentId === id || c.target.componentId === id
              );
              historyManager.execute(Commands.deleteComponent(comp, conns));
            }
          });
          viewStore.clearSelection();
          return;
        }

        if (viewState.selectedConnectionId) {
          e.preventDefault();
          const conn = projectState.connections.find(
            (c) => c.id === viewState.selectedConnectionId
          );
          if (conn) {
            historyManager.execute(Commands.deleteConnection(conn));
          }
          viewStore.clearSelection();
          return;
        }
      }

      // Escape: cancel free moving, wiring, or deselect
      if (e.key === 'Escape') {
        if (viewState.isFreeMoving) {
          viewStore.setIsFreeMoving(false);
        } else if (viewState.activeConnectorWiring) {
          viewStore.cancelConnectorWiring();
        } else if (viewState.activeWiring || viewState.wireModeActive) {
          viewStore.cancelWiring();
        } else {
          viewStore.clearSelection();
        }
        viewStore.setContextMenu(null);
        return;
      }

      // Wire mode toggle
      if (e.key === 'w' || e.key === 'W') {
        viewStore.toggleWireMode();
        return;
      }

      // Transform modes
      if (e.key === 'g' || e.key === 'G') {
        viewStore.setTransformMode('translate');
      } else if (e.key === 'r' || e.key === 'R') {
        viewStore.setTransformMode('rotate');
      } else if (e.key === 's' || e.key === 'S') {
        viewStore.setTransformMode('scale');
      }

      // Camera shortcuts
      if (e.key === 'f' || e.key === 'F') {
        viewStore.triggerCamera('focusSelected');
      } else if (e.key === 'a' || e.key === 'A') {
        viewStore.triggerCamera('frameAll');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    viewState.selectedComponentIds,
    viewState.selectedConnectionId,
    viewState.activeWiring,
    viewState.wireModeActive,
    projectState.components,
    projectState.connections,
  ]);
}
