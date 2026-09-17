import { projectStore } from '../../state/project/projectStore';
import { VirtualComponent, ComponentTransform } from '../../core/components/VirtualComponent';
import { Connection, PinEndpoint } from '../../core/connections/Connection';

export interface Command {
  name: string;
  execute: () => void;
  undo: () => void;
}

class HistoryManagerClass {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxHistory: number = 50;

  execute(command: Command) {
    command.execute();
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  undo() {
    const command = this.undoStack.pop();
    if (!command) return;
    command.undo();
    this.redoStack.push(command);
  }

  redo() {
    const command = this.redoStack.pop();
    if (!command) return;
    command.execute();
    this.undoStack.push(command);
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}

export const historyManager = new HistoryManagerClass();

// Command Creators
export const Commands = {
  addComponent(component: VirtualComponent): Command {
    return {
      name: `Add ${component.name}`,
      execute: () => projectStore.addComponent(component),
      undo: () => projectStore.removeComponent(component.id),
    };
  },

  deleteComponent(component: VirtualComponent, attachedConnections: Connection[]): Command {
    return {
      name: `Delete ${component.name}`,
      execute: () => projectStore.removeComponent(component.id),
      undo: () => {
        projectStore.addComponent(component);
        attachedConnections.forEach((conn) => {
          projectStore.addConnection(conn.source, conn.target, conn.color);
        });
      },
    };
  },

  transformComponent(
    componentId: string,
    prevTransform: ComponentTransform,
    nextTransform: ComponentTransform
  ): Command {
    return {
      name: 'Transform Component',
      execute: () => projectStore.updateComponentTransform(componentId, nextTransform),
      undo: () => projectStore.updateComponentTransform(componentId, prevTransform),
    };
  },

  addConnection(source: PinEndpoint, target: PinEndpoint, color?: string): Command {
    let createdConnId: string | null = null;
    return {
      name: 'Add Wire',
      execute: () => {
        const conn = projectStore.addConnection(source, target, color);
        createdConnId = conn.id;
      },
      undo: () => {
        if (createdConnId) {
          projectStore.removeConnection(createdConnId);
        }
      },
    };
  },

  deleteConnection(connection: Connection): Command {
    return {
      name: 'Delete Wire',
      execute: () => projectStore.removeConnection(connection.id),
      undo: () => {
        projectStore.addConnection(connection.source, connection.target, connection.color);
      },
    };
  },
};
