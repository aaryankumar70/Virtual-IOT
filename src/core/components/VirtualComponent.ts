import { VirtualPin, Vector3D, Euler3D } from '../pins/VirtualPin';
import { VirtualConnector, VirtualPort } from '../connections/VirtualConnector';

export interface ComponentTransform {
  position: Vector3D;
  rotation: Euler3D;
  scale: Vector3D;
}

export interface ComponentMetadata {
  category: string;
  manufacturer?: string;
  description?: string;
  tags?: string[];
}

export interface VirtualComponent {
  id: string;
  type: string;
  name: string;
  transform: ComponentTransform;
  pins: VirtualPin[];
  connectors?: VirtualConnector[];
  ports?: VirtualPort[];
  metadata: ComponentMetadata;
  state: Record<string, unknown>;
}
