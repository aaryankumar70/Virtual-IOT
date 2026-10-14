import React, { useMemo } from 'react';
import * as THREE from 'three';
import { VirtualPin } from '../../core/pins/VirtualPin';
import { THEME, getPinColor } from '../../utils/theme';
import { viewStore, useView } from '../../state/view/viewStore';
import { projectStore, useProject } from '../../state/project/projectStore';
import { validateConnection } from '../../core/connections/validateConnection';
import { historyManager, Commands } from '../../editor/history/historyManager';
import { checkContinuity, testPinContinuity } from '../../core/circuit/continuityChecker';

interface PinMeshProps {
  pin: VirtualPin;
  componentId: string;
  componentName: string;
}

export const PinMesh: React.FC<PinMeshProps> = React.memo(({ pin, componentId, componentName }) => {
  const viewState = useView();
  const projectState = useProject();

  const isHovered =
    viewState.hoveredPin?.componentId === componentId &&
    viewState.hoveredPin?.pinId === pin.id;

  const isSnappedTarget =
    viewState.activeWiring?.snappedTarget?.componentId === componentId &&
    viewState.activeWiring?.snappedTarget?.pinId === pin.id;

  const isConnected = useMemo(() => {
    return projectState.connections.some(
      (c) =>
        (c.source.componentId === componentId && c.source.pinId === pin.id) ||
        (c.target.componentId === componentId && c.target.pinId === pin.id)
    );
  }, [projectState.connections, componentId, pin.id]);

  const isWiringSource =
    viewState.activeWiring?.sourceComponentId === componentId &&
    viewState.activeWiring?.sourcePinId === pin.id;

  // Check if this pin is in the same breadboard internal rail as the currently active/hovered pin
  const isBreadboardTieHighlight = useMemo(() => {
    const activeTarget = viewState.activeWiring?.snappedTarget || viewState.hoveredPin;
    if (!activeTarget || activeTarget.componentId !== componentId) return false;
    if (activeTarget.pinId === pin.id) return false;

    // Both row pins in same 5-hole group
    if (pin.id.startsWith('row_') && activeTarget.pinId.startsWith('row_')) {
      const partsA = pin.id.split('_'); // ['row', '12', 'a']
      const partsB = activeTarget.pinId.split('_');
      if (partsA[1] === partsB[1]) {
        const isLeftA = ['a', 'b', 'c', 'd', 'e'].includes(partsA[2]);
        const isLeftB = ['a', 'b', 'c', 'd', 'e'].includes(partsB[2]);
        return isLeftA === isLeftB;
      }
    }

    // Power rails
    if (pin.id.startsWith('rail_top_plus_') && activeTarget.pinId.startsWith('rail_top_plus_')) return true;
    if (pin.id.startsWith('rail_top_minus_') && activeTarget.pinId.startsWith('rail_top_minus_')) return true;
    if (pin.id.startsWith('rail_bot_plus_') && activeTarget.pinId.startsWith('rail_bot_plus_')) return true;
    if (pin.id.startsWith('rail_bot_minus_') && activeTarget.pinId.startsWith('rail_bot_minus_')) return true;

    return false;
  }, [viewState.activeWiring?.snappedTarget, viewState.hoveredPin, componentId, pin.id]);

  // Connection validation feedback if active wiring is in progress
  const wiringTargetFeedback = useMemo(() => {
    if (!viewState.activeWiring) return null;
    if (isWiringSource) return 'source';

    const sourceComp = projectState.components.find(
      (c) => c.id === viewState.activeWiring?.sourceComponentId
    );
    const sourcePin = sourceComp?.pins.find(
      (p) => p.id === viewState.activeWiring?.sourcePinId
    );

    if (!sourcePin) return null;

    const validation = validateConnection(sourcePin, pin, sourceComp?.id, componentId);
    return validation.valid ? 'valid' : 'invalid';
  }, [viewState.activeWiring, isWiringSource, projectState.components, componentId, pin]);

  const probeIndex = viewState.probeSelectedPins.findIndex(
    (p) => p.componentId === componentId && p.pinId === pin.id
  );
  const isProbed = probeIndex !== -1;

  // Color calculation
  const pinBaseColor = getPinColor(pin.type);
  const color = useMemo(() => {
    if (isProbed) return probeIndex === 0 ? '#ef4444' : '#0284c7';
    if (isWiringSource) return THEME.accent.hover;
    if (isSnappedTarget || isHovered) {
      if (wiringTargetFeedback === 'valid') return THEME.state.success;
      if (wiringTargetFeedback === 'invalid') return THEME.state.error;
      return THEME.accent.hover;
    }
    if (viewState.continuityMode && isConnected) {
      const report = checkContinuity(projectState.components, projectState.connections);
      const pinKey = `${componentId}:${pin.id}`;
      if (report.shortPinKeys.has(pinKey)) return '#ef4444';
      if (report.validPinKeys.has(pinKey)) return '#22c55e';
    }
    if (isBreadboardTieHighlight) return '#38bdf8';
    if (isConnected) return pinBaseColor;
    return '#8b9bb4';
  }, [
    isProbed,
    probeIndex,
    isWiringSource,
    isSnappedTarget,
    isHovered,
    wiringTargetFeedback,
    isBreadboardTieHighlight,
    isConnected,
    pinBaseColor,
    viewState.continuityMode,
    projectState.components,
    projectState.connections,
    componentId,
    pin.id,
  ]);

  const emissiveColor = useMemo(() => {
    if (isProbed) return probeIndex === 0 ? '#dc2626' : '#0284c7';
    if (isWiringSource) return THEME.accent.primary;
    if (isSnappedTarget || isHovered) {
      if (wiringTargetFeedback === 'valid') return THEME.state.success;
      if (wiringTargetFeedback === 'invalid') return THEME.state.error;
      return THEME.accent.hover;
    }
    if (viewState.continuityMode && isConnected) {
      const report = checkContinuity(projectState.components, projectState.connections);
      const pinKey = `${componentId}:${pin.id}`;
      if (report.shortPinKeys.has(pinKey)) return '#dc2626';
      if (report.validPinKeys.has(pinKey)) return '#16a34a';
    }
    if (isBreadboardTieHighlight) return '#0284c7';
    if (isConnected) return pinBaseColor;
    return '#000000';
  }, [
    isProbed,
    probeIndex,
    isWiringSource,
    isSnappedTarget,
    isHovered,
    wiringTargetFeedback,
    isBreadboardTieHighlight,
    isConnected,
    pinBaseColor,
    viewState.continuityMode,
    projectState.components,
    projectState.connections,
    componentId,
    pin.id,
  ]);

  const emissiveIntensity = isProbed ? 1.0 : isSnappedTarget ? 1.0 : (isHovered || isWiringSource) ? 0.9 : isBreadboardTieHighlight ? 0.75 : (viewState.continuityMode && isConnected) ? 0.8 : isConnected ? 0.4 : 0.1;
  const scale = isProbed ? 1.6 : isSnappedTarget ? 1.5 : isHovered ? 1.4 : isWiringSource ? 1.3 : isBreadboardTieHighlight ? 1.15 : 1.0;

  const completeConnection = () => {
    if (!viewState.activeWiring) return;
    if (isWiringSource) return;

    const sourceCompId = viewState.activeWiring.sourceComponentId;
    const sourcePinId = viewState.activeWiring.sourcePinId;

    const sourceComp = projectState.components.find((c) => c.id === sourceCompId);
    const sourcePin = sourceComp?.pins.find((p) => p.id === sourcePinId);

    if (sourcePin) {
      const validation = validateConnection(sourcePin, pin, sourceCompId, componentId);
      if (validation.valid) {
        const wireColor = viewState.activeWiring.wireColor || pinBaseColor;
        historyManager.execute(
          Commands.addConnection(
            {
              componentId: sourceCompId,
              interfaceId: sourcePinId,
              type: 'pin',
              pinId: sourcePinId,
            },
            {
              componentId,
              interfaceId: pin.id,
              type: 'pin',
              pinId: pin.id,
            },
            wireColor
          )
        );
        viewStore.cancelWiring();
        viewStore.setHoveredPin(null);
      } else {
        viewStore.setConnectionFeedback({
          message: validation.message,
          severity: validation.severity === 'warning' ? 'warning' : 'error',
        });
        viewStore.cancelWiring();
      }
    }
  };

  const handlePointerDown = (e: any) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    // If currently wiring and clicked another pin:
    if (viewState.activeWiring) {
      if (isWiringSource) {
        viewStore.cancelWiring();
        return;
      }
      completeConnection();
      return;
    }

    // Start dragging wire from this pin!
    const worldPos = projectStore.getPinWorldPosition(componentId, pin.id);
    if (worldPos) {
      let defaultColor = viewState.selectedWireColor || '#3b82f6';
      const pName = pin.name.toLowerCase();
      if (pin.type === 'ground' || pName.includes('gnd') || pin.id.includes('minus')) {
        defaultColor = '#1e293b'; // black/dark slate
      } else if (pin.type === 'power' || pName.includes('5v') || pName.includes('vcc') || pName.includes('vin') || pin.id.includes('plus')) {
        defaultColor = '#ef4444'; // red
      } else if (pName.includes('3v3') || pName.includes('3.3v')) {
        defaultColor = '#f97316'; // orange
      } else if (pin.type === 'analog') {
        defaultColor = '#10b981'; // emerald green
      } else if (pin.type === 'pwm') {
        defaultColor = '#eab308'; // yellow
      }

      viewStore.startWiring(
        componentId,
        pin.id,
        { x: worldPos.x, y: worldPos.y, z: worldPos.z },
        {
          isDragging: true,
          startScreenPos: { x: e.clientX, y: e.clientY },
          wireColor: defaultColor,
        }
      );
    }
  };

  const handlePointerUp = (e: any) => {
    e.stopPropagation();
    if (viewState.activeWiring && !isWiringSource) {
      completeConnection();
    }
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (viewState.continuityProbeMode) {
      viewStore.probePin(componentId, pin.id);
      const currentProbes = [...viewState.probeSelectedPins];
      const existingIdx = currentProbes.findIndex(
        (p) => p.componentId === componentId && p.pinId === pin.id
      );
      if (existingIdx !== -1) {
        currentProbes.splice(existingIdx, 1);
      } else if (currentProbes.length < 2) {
        currentProbes.push({ componentId, pinId: pin.id });
      } else {
        currentProbes.splice(0, currentProbes.length, { componentId, pinId: pin.id });
      }

      if (currentProbes.length === 2) {
        const res = testPinContinuity(
          projectState.components,
          projectState.connections,
          currentProbes[0],
          currentProbes[1]
        );
        viewStore.setProbeResult(res);
      } else {
        viewStore.setProbeResult(null);
      }
      return;
    }

    if (viewState.activeWiring) {
      if (isWiringSource) {
        viewStore.cancelWiring();
      } else {
        completeConnection();
      }
    }
  };

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    viewStore.setHoveredPin({ componentId, pinId: pin.id });
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    if (viewState.hoveredPin?.componentId === componentId && viewState.hoveredPin?.pinId === pin.id) {
      viewStore.setHoveredPin(null);
    }
  };

  const showHighlightRing =
    isProbed ||
    isSnappedTarget ||
    isHovered ||
    isWiringSource ||
    (viewState.activeWiring && !isWiringSource) ||
    viewState.wireModeActive ||
    (viewState.continuityMode && isConnected);

  const connectorStyle = pin.connectorStyle || 'header-pin';
  const isInteracting = isSnappedTarget || isHovered || isWiringSource || isConnected;

  const ringColor = isProbed
    ? (probeIndex === 0 ? '#ef4444' : '#0284c7')
    : viewState.continuityMode && isConnected
    ? emissiveColor
    : isWiringSource
    ? THEME.accent.hover
    : (isSnappedTarget || isHovered)
    ? (wiringTargetFeedback === 'valid' ? THEME.state.success : wiringTargetFeedback === 'invalid' ? THEME.state.error : THEME.accent.hover)
    : viewState.activeWiring
    ? THEME.accent.primary
    : '#94a3b8';

  return (
    <group position={[pin.localPosition.x, pin.localPosition.y, pin.localPosition.z]}>
      {/* Generous invisible hit target cylinder to ensure effortless clicking with priority over headers */}
      <mesh
        position={[0, 0.08, 0]}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <cylinderGeometry args={[0.26, 0.26, 0.42, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* 3D Multimeter Continuity Probe Needle when probed */}
      {isProbed && (
        <group position={[0, 0.12, 0]}>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.015, 0.005, 0.24, 8]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.36, 0]}>
            <cylinderGeometry args={[0.045, 0.035, 0.26, 12]} />
            <meshStandardMaterial color={probeIndex === 0 ? '#dc2626' : '#1e293b'} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.52, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.08, 8]} />
            <meshStandardMaterial color={probeIndex === 0 ? '#ef4444' : '#334155'} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshStandardMaterial
              color={probeIndex === 0 ? '#ef4444' : '#38bdf8'}
              emissive={probeIndex === 0 ? '#ef4444' : '#38bdf8'}
              emissiveIntensity={1.0}
            />
          </mesh>
        </group>
      )}

      {/* 1. Header Pin (Female Socket / Header): metal socket collar + conductive terminal */}
      {connectorStyle === 'header-pin' && (
        <>
          <mesh rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.075, 0.075, 0.08, 12]} />
            <meshStandardMaterial color="#2d3748" metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.045, 0]} scale={[scale, scale, scale]}>
            <sphereGeometry args={[0.085, 12, 12]} />
            <meshStandardMaterial
              color={color}
              emissive={emissiveColor}
              emissiveIntensity={emissiveIntensity}
              roughness={0.2}
              metalness={0.6}
            />
          </mesh>
        </>
      )}

      {/* 2. Breadboard Hole: recessed dark insertion hole with beveled plastic rim */}
      {connectorStyle === 'breadboard-hole' && (
        <>
          {/* Beveled hole pocket rim */}
          <mesh position={[0, -0.002, 0]}>
            <boxGeometry args={[0.092, 0.008, 0.092]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.6} />
          </mesh>
          {/* Deep dark internal spring receptacle contact cavity */}
          <mesh position={[0, 0.002, 0]}>
            <boxGeometry args={[0.056, 0.012, 0.056]} />
            <meshStandardMaterial color="#0f172a" roughness={0.95} metalness={0.2} />
          </mesh>
          {/* Active / hover / connected indicator marker */}
          {isInteracting && (
            <mesh position={[0, 0.025, 0]} scale={[scale, scale, scale]}>
              <sphereGeometry args={[0.065, 12, 12]} />
              <meshStandardMaterial
                color={color}
                emissive={emissiveColor}
                emissiveIntensity={emissiveIntensity}
                roughness={0.2}
                metalness={0.6}
              />
            </mesh>
          )}
        </>
      )}

      {/* 3. Lead Tip: wire end flush cap in idle, glowing terminal when interacting */}
      {connectorStyle === 'lead-tip' && (
        <>
          {!isInteracting ? (
            /* Flush wire cap at the tip of the modeled lead with same radius as lead */
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.038, 0.038, 0.015, 12]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.25} />
            </mesh>
          ) : (
            /* Active / hovered terminal node */
            <mesh position={[0, 0.02, 0]} scale={[scale, scale, scale]}>
              <sphereGeometry args={[0.065, 12, 12]} />
              <meshStandardMaterial
                color={color}
                emissive={emissiveColor}
                emissiveIntensity={emissiveIntensity}
                roughness={0.2}
                metalness={0.6}
              />
            </mesh>
          )}
        </>
      )}

      {/* Pin alignment / target halo ring when hovering or active wiring */}
      {showHighlightRing && (
        <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[isSnappedTarget ? 0.12 : 0.1, isSnappedTarget ? 0.22 : 0.16, 24]} />
          <meshBasicMaterial
            color={ringColor}
            transparent
            opacity={isProbed ? 1.0 : isSnappedTarget ? 1.0 : (isHovered || isWiringSource) ? 0.9 : 0.65}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
});
