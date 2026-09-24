export interface ElectricalRating {
  operatingVoltage: string;
  minVoltage?: number;
  maxVoltage?: number;
  logicLevel?: string;
  quiescentCurrentMa?: number;
  maxCurrentDrawMa?: number;
  powerRatingWatts?: number;
}

export interface PhysicalDimensions {
  widthMm: number;
  heightMm: number;
  depthMm: number;
  massGrams: number;
  mountingHolePitchMm?: string;
}

export interface HardwareSubcomponent {
  id: string;
  name: string;
  category:
    | 'chassis'
    | 'ic'
    | 'motor'
    | 'propeller'
    | 'esc'
    | 'sensor'
    | 'connector'
    | 'passive'
    | 'optical'
    | 'power'
    | 'radio'
    | 'control'
    | 'display';
  partNumber?: string;
  manufacturer?: string;
  description: string;
  localPosition?: { x: number; y: number; z: number };
  localRotation?: { x: number; y: number; z: number };
  status?: 'nominal' | 'active' | 'standby' | 'warning' | 'fault';
  specifications?: Record<string, string | number>;
  removable?: boolean;
  children?: HardwareSubcomponent[];
}

export interface HardwareSpecification {
  modelNumber: string;
  manufacturer: string;
  revision?: string;
  datasheetUrl?: string;
  dimensions: PhysicalDimensions;
  electrical: ElectricalRating;
  subcomponents?: HardwareSubcomponent[];
  mechanicalMounts?: string[];
  protocols?: string[];
  features?: string[];
}
