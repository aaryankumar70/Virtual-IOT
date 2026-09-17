import React, { useMemo } from 'react';
import * as THREE from 'three';
import { VirtualPin } from '../../core/pins/VirtualPin';
import { THEME, getPinColor } from '../../utils/theme';
import { viewStore, useView } from '../../state/view/viewStore';
import { projectStore, useProject } from '../../state/project/projectStore';
import { validateConnection } from '../../core/connections/validateConnection';
import { historyManager, Commands } from '../../editor/history/historyManager';

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

  // Color calculation
  const pinBaseColor = getPinColor(pin.type);
  const color = useMemo(() => {
    if (isWiringSource) return THEME.accent.hover;
    if (wiringTargetFeedback === 'valid' && isHovered) return THEME.state.success;
    if (wiringTargetFeedback === 'invalid' && isHovered) return THEME.state.error;
    if (isHovered) return THEME.accent.hover;
    if (isConnected) return pinBaseColor;
    return '#8b9bb4';
  }, [isWiringSource, wiringTargetFeedback, isHovered, isConnected, pinBaseColor]);

  const emissiveColor = useMemo(() => {
    if (isWiringSource) return THEME.accent.primary;
    if (wiringTargetFeedback === 'valid' && isHovered) return THEME.state.success;
    if (wiringTargetFeedback === 'invalid' && isHovered) return THEME.state.error;
    if (isHovered) return THEME.accent.hover;
    if (isConnected) return pinBaseColor;
    return '#000000';
  }, [isWiringSource, wiringTargetFeedback, isHovered, isConnected, pinBaseColor]);

  const emissiveIntensity = isHovered || isWiringSource ? 0.9 : isConnected ? 0.4 : 0.1;
  const scale = isHovered ? 1.4 : isWiringSource ? 1.3 : 1.0;

  const handleClick = (e: any) => {
    e.stopPropagation();

    // If we are currently wiring:
    if (viewState.activeWiring) {
      if (isWiringSource) {
        // clicked self, cancel
        viewStore.cancelWiring();
        return;
      }

      // Finish wiring to this pin!
      const sourceCompId = viewState.activeWiring.sourceComponentId;
      const sourcePinId = viewState.activeWiring.sourcePinId;

      const sourceComp = projectState.components.find((c) => c.id === sourceCompId);
      const sourcePin = sourceComp?.pins.find((p) => p.id === sourcePinId);

      if (sourcePin) {
        const validation = validateConnection(sourcePin, pin, sourceCompId, componentId);
        if (validation.valid) {
          // Execute with history manager so action is fully undoable
          historyManager.execute(
            Commands.addConnection(
              { componentId: sourceCompId, pinId: sourcePinId },
              { componentId, pinId: pin.id },
              pinBaseColor
            )
          );
          viewStore.cancelWiring();
        }
      }
      return;
    }

    // Otherwise, start wiring from this pin!
    const worldPos = projectStore.getPinWorldPosition(componentId, pin.id);
    if (worldPos) {
      viewStore.startWiring(componentId, pin.id, {
        x: worldPos.x,
        y: worldPos.y,
        z: worldPos.z,
      });
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
    isHovered ||
    isWiringSource ||
    (viewState.activeWiring && !isWiringSource) ||
    viewState.wireModeActive;

  return (
    <group position={[pin.localPosition.x, pin.localPosition.y, pin.localPosition.z]}>
      {/* Generous invisible hit target cylinder to ensure effortless clicking */}
      <mesh
        position={[0, 0.05, 0]}
        onClick={handleClick}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <cylinderGeometry args={[0.22, 0.22, 0.35, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Outer socket metal contact */}
      <mesh rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.08, 12]} />
        <meshStandardMaterial color="#2d3748" metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Inner conductive / colored connection terminal point */}
      <mesh
        position={[0, 0.045, 0]}
        scale={[scale, scale, scale]}
      >
        <sphereGeometry args={[0.085, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          roughness={0.2}
          metalness={0.6}
        />
      </mesh>

      {/* Pin alignment / target halo ring when hovering or active wiring */}
      {showHighlightRing && (
        <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.1, 0.16, 16]} />
          <meshBasicMaterial
            color={
              isWiringSource
                ? THEME.accent.hover
                : isHovered
                ? THEME.state.success
                : viewState.activeWiring
                ? THEME.accent.primary
                : '#94a3b8'
            }
            transparent
            opacity={isHovered || isWiringSource ? 0.9 : 0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
});
