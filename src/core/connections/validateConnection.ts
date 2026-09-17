import { VirtualPin } from '../pins/VirtualPin';

export interface ValidationResult {
  valid: boolean;
  severity: 'info' | 'warning' | 'error';
  message: string;
}

export function validateConnection(
  sourcePin: VirtualPin,
  targetPin: VirtualPin,
  sourceComponentId?: string,
  targetComponentId?: string
): ValidationResult {
  if (sourceComponentId && targetComponentId && sourceComponentId === targetComponentId) {
    if (sourcePin.id === targetPin.id) {
      return {
        valid: false,
        severity: 'error',
        message: 'Cannot connect a pin to itself',
      };
    }
    // Allow connecting different pins on the same component if needed (like breadboard tie points)
  }

  // Ground to Power check
  if (
    (sourcePin.type === 'ground' && targetPin.type === 'power') ||
    (sourcePin.type === 'power' && targetPin.type === 'ground')
  ) {
    return {
      valid: true,
      severity: 'error',
      message: 'Direct Short Circuit Warning! Power is wired directly to Ground.',
    };
  }

  // Power to Power
  if (sourcePin.type === 'power' && targetPin.type === 'power') {
    return {
      valid: true,
      severity: 'warning',
      message: 'Connecting two power pins directly. Ensure voltage potentials match.',
    };
  }

  // Ground to Ground
  if (sourcePin.type === 'ground' && targetPin.type === 'ground') {
    return {
      valid: true,
      severity: 'info',
      message: 'Common ground bus connection.',
    };
  }

  // Digital to Analog
  if (
    (sourcePin.type === 'digital' && targetPin.type === 'analog') ||
    (sourcePin.type === 'analog' && targetPin.type === 'digital')
  ) {
    return {
      valid: true,
      severity: 'warning',
      message: 'Digital to Analog bridge. Verify signal levels & ADC tolerance.',
    };
  }

  // Output to Output warning
  if (sourcePin.direction === 'output' && targetPin.direction === 'output') {
    return {
      valid: true,
      severity: 'warning',
      message: 'Contention warning: both pins configured as outputs.',
    };
  }

  return {
    valid: true,
    severity: 'info',
    message: `Connected ${sourcePin.name} (${sourcePin.type}) to ${targetPin.name} (${targetPin.type})`,
  };
}
