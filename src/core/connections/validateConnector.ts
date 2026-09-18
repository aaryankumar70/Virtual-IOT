import { VirtualConnector } from './VirtualConnector';

export interface ConnectorValidationResult {
  valid: boolean;
  severity: 'info' | 'warning' | 'error';
  message: string;
}

export function validateConnectorConnection(
  sourceConnector: VirtualConnector,
  targetConnector: VirtualConnector,
  sourceComponentId?: string,
  targetComponentId?: string,
  existingConnections?: Array<{ source: { componentId: string; interfaceId: string }; target: { componentId: string; interfaceId: string } }>
): ConnectorValidationResult {
  // 1. Cannot connect to self or same component
  if (sourceComponentId && targetComponentId && sourceComponentId === targetComponentId) {
    return {
      valid: false,
      severity: 'error',
      message: 'Cannot connect a connector to the same component.',
    };
  }

  // 2. Occupancy check
  if (existingConnections) {
    const isSourceOccupied = existingConnections.some(
      (c) =>
        (c.source.componentId === sourceComponentId && c.source.interfaceId === sourceConnector.id) ||
        (c.target.componentId === sourceComponentId && c.target.interfaceId === sourceConnector.id)
    );

    const isTargetOccupied = existingConnections.some(
      (c) =>
        (c.source.componentId === targetComponentId && c.source.interfaceId === targetConnector.id) ||
        (c.target.componentId === targetComponentId && c.target.interfaceId === targetConnector.id)
    );

    if (isTargetOccupied || targetConnector.occupied) {
      return {
        valid: false,
        severity: 'error',
        message: `Port "${targetConnector.name}" is already occupied. Disconnect the existing cable first.`,
      };
    }

    if (isSourceOccupied || sourceConnector.occupied) {
      return {
        valid: false,
        severity: 'error',
        message: `Connector "${sourceConnector.name}" is already occupied.`,
      };
    }
  }

  // 3. Gender check
  if (
    sourceConnector.gender &&
    targetConnector.gender &&
    sourceConnector.gender === targetConnector.gender &&
    sourceConnector.gender !== 'none'
  ) {
    let hint = '';
    if (sourceConnector.interfaceType === 'usb' && targetConnector.interfaceType === 'usb') {
      hint = ' A USB cable is required. Drag a USB Cable from the library and connect it between these two ports.';
    }
    return {
      valid: false,
      severity: 'error',
      message:
        sourceConnector.interfaceType === 'usb' && targetConnector.interfaceType === 'usb'
          ? `Connector type "${sourceConnector.connectorType}" is not compatible with "${targetConnector.connectorType}".${hint}`
          : `Gender mismatch: Cannot mate two ${sourceConnector.gender} connectors together.`,
    };
  }

  // 4. Incompatible interface types check (e.g. USB to DC)
  if (
    (sourceConnector.interfaceType === 'usb' && targetConnector.interfaceType === 'dc-power') ||
    (sourceConnector.interfaceType === 'dc-power' && targetConnector.interfaceType === 'usb')
  ) {
    return {
      valid: false,
      severity: 'error',
      message: 'Physical incompatibility: Cannot connect a USB interface to a DC barrel jack.',
    };
  }

  // 5. Explicit compatibility list check
  const sourceMatchesTarget =
    !sourceConnector.compatibleWith ||
    sourceConnector.compatibleWith.length === 0 ||
    sourceConnector.compatibleWith.includes(targetConnector.connectorType) ||
    sourceConnector.compatibleWith.includes(targetConnector.interfaceType);

  const targetMatchesSource =
    !targetConnector.compatibleWith ||
    targetConnector.compatibleWith.length === 0 ||
    targetConnector.compatibleWith.includes(sourceConnector.connectorType) ||
    targetConnector.compatibleWith.includes(sourceConnector.interfaceType);

  if (!sourceMatchesTarget || !targetMatchesSource) {
    let hint = '';
    if (sourceConnector.interfaceType === 'usb' && targetConnector.interfaceType === 'usb') {
      hint = ' A USB cable is required. Drag a USB Cable from the library and connect it between these two ports.';
    } else if (
      sourceConnector.interfaceType === 'dc-power' &&
      targetConnector.interfaceType === 'dc-power'
    ) {
      hint = ' An intermediate power cable or adapter is required.';
    }
    return {
      valid: false,
      severity: 'error',
      message: `Connector type "${sourceConnector.connectorType}" is not compatible with "${targetConnector.connectorType}".${hint}`,
    };
  }

  // 6. Header contact count mismatch check
  if (
    sourceConnector.interfaceType === 'header' &&
    targetConnector.interfaceType === 'header' &&
    sourceConnector.contactCount &&
    targetConnector.contactCount &&
    sourceConnector.contactCount > targetConnector.contactCount
  ) {
    return {
      valid: false,
      severity: 'warning',
      message: `Header pin count mismatch: ${sourceConnector.contactCount}-pin header exceeds ${targetConnector.contactCount}-pin socket capacity.`,
    };
  }

  return {
    valid: true,
    severity: 'info',
    message: `Physical connection established between ${sourceConnector.name} and ${targetConnector.name}.`,
  };
}
