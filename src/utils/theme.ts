/**
 * Virtual IoT Lab - Design System Tokens
 */

export const THEME = {
  bg: {
    app: '#f8fafc',
    panel: '#ffffff',
    panelElevated: '#f1f5f9',
    canvas: '#f8fafc',
    workbenchLight: '#edf0f3',
    workbenchDark: '#0e131b',
  },
  border: {
    subtle: '#e2e8f0',
    strong: '#cbd5e1',
  },
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#94a3b8',
    disabled: '#cbd5e1',
  },
  accent: {
    primary: '#2563eb',
    hover: '#3b82f6',
    pressed: '#1d4ed8',
    subtleFill: 'rgba(37, 99, 235, 0.08)',
    glow: 'rgba(37, 99, 235, 0.25)',
  },
  state: {
    success: '#16a34a',
    warning: '#ca8a04',
    error: '#dc2626',
    info: '#0284c7',
  },
  pins: {
    digital: '#2563eb',
    analog: '#7c3aed',
    power: '#dc2626',
    ground: '#475569',
    pwm: '#d97706',
    communication: '#059669',
  },
  grid: {
    major: '#cbd5e1',
    minor: '#e2e8f0',
    origin: '#94a3b8',
  },
  selection: {
    outline: '#2563eb',
    glow: 'rgba(37, 99, 235, 0.35)',
    hoverOutline: '#60a5fa',
  },
} as const;

export type PinType = 'digital' | 'analog' | 'power' | 'ground' | 'pwm' | 'communication';

export function getPinColor(type: PinType): string {
  return THEME.pins[type] || THEME.accent.primary;
}
