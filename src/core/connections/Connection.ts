export interface PinEndpoint {
  componentId: string;
  pinId: string;
}

export interface Connection {
  id: string;
  source: PinEndpoint;
  target: PinEndpoint;
  color?: string;
  metadata?: Record<string, unknown>;
}
