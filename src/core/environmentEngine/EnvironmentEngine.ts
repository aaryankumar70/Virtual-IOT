/**
 * Virtual IoT Lab — Environment Engine
 *
 * Models physical environments, atmospheres, gravity, wind fields,
 * and aerodynamic boundary conditions.
 * Feeds directly into:
 * - SimulationEngine (aerodynamic drag, rotor thrust, aircraft dynamics)
 * - SensorDomain (barometer altitude, pitot airspeed, thermometer, magnetometer)
 * - Battery & Motor models (thermal degradation, cooling efficiency)
 */

export interface WindVector {
  speedMps: number;
  directionDeg: number; // 0 = North, 90 = East, 180 = South, 270 = West
  gustFactor: number; // multiplier for turbulence fluctuations
  verticalDraftMps: number; // updrafts / downdrafts
}

export interface EnvironmentPreset {
  id: string;
  name: string;
  description: string;
  altitudeMeters: number;
  temperatureC: number;
  airDensityKgM3: number;
  pressureHpa: number;
  gravityMps2: number;
  wind: WindVector;
}

export const ENVIRONMENT_PRESETS: EnvironmentPreset[] = [
  {
    id: 'sea-level-calm',
    name: 'Open Airfield (Standard Sea Level)',
    description: 'Standard atmospheric temperature and pressure (ISA standard: 1.225 kg/m³, 20°C, calm wind).',
    altitudeMeters: 0,
    temperatureC: 20.0,
    airDensityKgM3: 1.225,
    pressureHpa: 1013.25,
    gravityMps2: 9.81,
    wind: { speedMps: 1.2, directionDeg: 45, gustFactor: 0.15, verticalDraftMps: 0 },
  },
  {
    id: 'high-wind-gusts',
    name: 'Coastal Gale (Turbulent Winds)',
    description: 'Challenging 8.5 m/s wind with 14 m/s gusts. Tests flight controller rate responsiveness and I-gain.',
    altitudeMeters: 15,
    temperatureC: 17.0,
    airDensityKgM3: 1.228,
    pressureHpa: 1011.0,
    gravityMps2: 9.81,
    wind: { speedMps: 8.5, directionDeg: 120, gustFactor: 0.65, verticalDraftMps: 0.8 },
  },
  {
    id: 'high-altitude-alpine',
    name: 'Alpine Mountain Summit (3000m)',
    description: 'Thin air (0.909 kg/m³, -25% density). Reduces propeller thrust by 26%, requiring higher RPM to hover.',
    altitudeMeters: 3000,
    temperatureC: 0.5,
    airDensityKgM3: 0.909,
    pressureHpa: 701.2,
    gravityMps2: 9.80,
    wind: { speedMps: 4.0, directionDeg: 280, gustFactor: 0.3, verticalDraftMps: -0.5 },
  },
  {
    id: 'desert-extreme-heat',
    name: 'Desert Thermal Field (45°C)',
    description: 'High ambient temperature reduces air density to 1.11 kg/m³ and accelerates motor/battery thermal rise.',
    altitudeMeters: 250,
    temperatureC: 45.0,
    airDensityKgM3: 1.109,
    pressureHpa: 984.0,
    gravityMps2: 9.81,
    wind: { speedMps: 3.2, directionDeg: 190, gustFactor: 0.25, verticalDraftMps: 1.4 },
  },
  {
    id: 'indoor-test-hangar',
    name: 'Indoor Robotics Test Hangar',
    description: 'Completely calm indoor conditions with zero wind and fixed 22°C ambient temperature. Ideal for baseline tuning.',
    altitudeMeters: 40,
    temperatureC: 22.0,
    airDensityKgM3: 1.218,
    pressureHpa: 1008.5,
    gravityMps2: 9.81,
    wind: { speedMps: 0.0, directionDeg: 0, gustFactor: 0.0, verticalDraftMps: 0 },
  },
  {
    id: 'martian-atmosphere',
    name: 'Martian Surface (Ingenuity Simulation)',
    description: 'Extreme low density (0.020 kg/m³, ~1.6% of Earth) with 3.71 m/s² gravity. Proves why Earth props cannot lift on Mars!',
    altitudeMeters: 0,
    temperatureC: -60.0,
    airDensityKgM3: 0.020,
    pressureHpa: 6.1,
    gravityMps2: 3.71,
    wind: { speedMps: 5.0, directionDeg: 90, gustFactor: 0.2, verticalDraftMps: 0 },
  },
];

export class EnvironmentEngine {
  public activePresetId: string = 'sea-level-calm';

  // Physical Parameters
  public altitudeMeters: number = 0;
  public temperatureC: number = 20.0;
  public airDensityKgM3: number = 1.225;
  public pressureHpa: number = 1013.25;
  public gravityMps2: number = 9.81;

  // Dynamic Wind Field
  public wind: WindVector = {
    speedMps: 1.2,
    directionDeg: 45,
    gustFactor: 0.15,
    verticalDraftMps: 0,
  };

  // Geomagnetic Field (microTesla for Compass)
  public magneticFieldUt: { x: number; y: number; z: number } = {
    x: 21.2, // North component
    y: 43.5, // Downward component
    z: 2.8,  // East component
  };

  private listeners: Set<() => void> = new Set();

  constructor() {
    this.applyPreset('sea-level-calm');
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public applyPreset(presetId: string) {
    const preset = ENVIRONMENT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    this.activePresetId = preset.id;
    this.altitudeMeters = preset.altitudeMeters;
    this.temperatureC = preset.temperatureC;
    this.airDensityKgM3 = preset.airDensityKgM3;
    this.pressureHpa = preset.pressureHpa;
    this.gravityMps2 = preset.gravityMps2;
    this.wind = { ...preset.wind };

    this.notify();
  }

  /**
   * Recalculates air density and barometric pressure based on altitude and temperature
   * using the International Standard Atmosphere (ISA) barometric formula
   */
  public updateAtmosphere(altitudeM: number, tempC: number) {
    this.altitudeMeters = altitudeM;
    this.temperatureC = tempC;

    const T0 = 288.15; // Sea level standard temp in Kelvin
    const L = 0.0065; // Temperature lapse rate (K/m)
    const T = tempC + 273.15;
    const P0 = 101325; // Sea level pressure (Pa)
    const g = this.gravityMps2;
    const M = 0.0289644; // Molar mass of Earth's air (kg/mol)
    const R = 8.31447; // Universal gas constant (J/(mol·K))

    // Barometric pressure
    const P = P0 * Math.pow(1 - (L * altitudeM) / T0, (g * M) / (R * L));
    this.pressureHpa = Math.max(0.1, Number((P / 100).toFixed(2)));

    // Ideal gas law for air density: rho = P / (R_spec * T)
    const R_spec = 287.058; // Specific gas constant for dry air (J/(kg·K))
    this.airDensityKgM3 = Math.max(0.001, Number((P / (R_spec * T)).toFixed(4)));

    this.notify();
  }

  /**
   * Samples instantaneous wind velocity vector including turbulence gusts
   */
  public getInstantaneousWind(timeSec: number): { x: number; y: number; z: number; totalSpeed: number } {
    const rad = (this.wind.directionDeg * Math.PI) / 180;
    const gustNoise =
      Math.sin(timeSec * 1.7) * 0.5 +
      Math.cos(timeSec * 3.3) * 0.3 +
      Math.sin(timeSec * 7.1) * 0.2;

    const currentSpeed = Math.max(
      0,
      this.wind.speedMps * (1.0 + gustNoise * this.wind.gustFactor)
    );

    const vx = Math.sin(rad) * currentSpeed;
    const vz = Math.cos(rad) * currentSpeed;
    const vy = this.wind.verticalDraftMps + Math.sin(timeSec * 2.1) * 0.2 * this.wind.gustFactor;

    return {
      x: vx,
      y: vy,
      z: vz,
      totalSpeed: Math.sqrt(vx * vx + vy * vy + vz * vz),
    };
  }
}

export const environmentEngine = new EnvironmentEngine();
