export type PinType = 'digital' | 'analog' | 'power' | 'ground' | 'pwm' | 'communication';
export type PinDirection = 'input' | 'output' | 'bidirectional' | 'power';
export type PinConnectorStyle = 'header-pin' | 'breadboard-hole' | 'lead-tip';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Euler3D {
  x: number;
  y: number;
  z: number;
}

export interface VirtualPin {
  id: string;
  name: string;
  type: PinType;
  direction: PinDirection;
  localPosition: Vector3D;
  connectorStyle?: PinConnectorStyle;
  metadata?: Record<string, unknown>;
}
