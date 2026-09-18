import { Vector3D, Euler3D } from '../pins/VirtualPin';

export type ConnectorInterfaceType =
  | 'header'
  | 'socket'
  | 'plug'
  | 'usb'
  | 'dc-power'
  | 'breadboard-socket';

export type ConnectorGender = 'male' | 'female' | 'none';

export interface VirtualConnector {
  id: string;
  name: string;
  connectorType: string; // e.g. 'usb-b', 'usb-a', 'dc-barrel-jack', 'dc-barrel-plug', 'header-male-4', 'header-female-8', etc.
  interfaceType: ConnectorInterfaceType;
  localPosition: Vector3D;
  direction?: Vector3D; // normalized normal/pointing vector for connector socket/plug orientation
  orientation?: Euler3D;
  contactCount?: number;
  gender?: ConnectorGender;
  compatibleWith?: string[]; // list of compatible connector types
  occupied?: boolean;
  pinMapping?: Record<string, string>; // maps contact numbers/labels to internal component signals
  maxCurrentMa?: number;
  voltage?: string | number;
  metadata?: Record<string, unknown>;
}

export interface VirtualPort extends VirtualConnector {
  protocol?: string; // e.g. 'USB 2.0', '9V-12V DC', 'UART', 'I2C'
  powerDelivery?: boolean;
}
