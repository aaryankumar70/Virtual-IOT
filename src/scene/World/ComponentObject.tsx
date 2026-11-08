import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { ComponentRenderer } from '../../components3d/ComponentRenderer';
import { ComponentRegistry } from '../../core/registry/ComponentRegistry';
import { useView, viewStore } from '../../state/view/viewStore';
import { THEME } from '../../utils/theme';
import { TransformGizmo } from '../Transform/TransformGizmo';
import { HardwareDebugOverlay } from './HardwareDebugOverlay';

interface Props {
  component: VirtualComponent;
}

export const ComponentObject: React.FC<Props> = ({ component }) => {
  const groupRef = useRef<THREE.Group>(null);
  const viewState = useView();
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isSelected = viewState.selectedComponentIds.includes(component.id);
  const isPrimary = viewState.selectedComponentIds[0] === component.id;

  const def = ComponentRegistry.get(component.type);
  const footprintRadius = Math.max(
    0.55,
    Math.hypot(def?.dimensions?.width || 1.5, def?.dimensions?.depth || 1.5) * 0.45
  );

  const handleSelect = (e: any) => {
    e.stopPropagation();

    // If wiring is in progress, clicking component body doesn't override pin wiring
    if (viewState.activeWiring || viewState.activeConnectorWiring || viewState.wireModeActive) {
      return;
    }

    if (e.shiftKey) {
      // Shift + click selects the component and starts free move
      viewStore.selectComponent(component.id, false);
      viewStore.setIsFreeMoving(true);
      return;
    }

    const isMulti = e.ctrlKey || e.metaKey;
    if (!isSelected || isMulti) {
      viewStore.selectComponent(component.id, isMulti);
    }
  };

  const handleContextMenu = (e: any) => {
    e.stopPropagation();
    if (!isSelected) {
      viewStore.selectComponent(component.id, false);
    }
    viewStore.setContextMenu({
      x: e.clientX,
      y: e.clientY,
      componentId: component.id,
    });
  };

  return (
    <>
      <group
        ref={groupRef}
        position={[
          component.transform.position.x,
          component.transform.position.y,
          component.transform.position.z,
        ]}
        rotation={[
          component.transform.rotation.x,
          component.transform.rotation.y,
          component.transform.rotation.z,
        ]}
        scale={[
          component.transform.scale.x,
          component.transform.scale.y,
          component.transform.scale.z,
        ]}
        onPointerDown={(e) => {
          if (e.button === 0) {
            handleSelect(e);
          }
        }}
        onClick={handleSelect}
        onPointerOver={(e) => {
          e.stopPropagation();
          setIsHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setIsHovered(false);
        }}
        onContextMenu={handleContextMenu}
      >
        {/* Component 3D hardware model & pins */}
        <ComponentRenderer component={component} />

        {/* Visual Hardware Debug Mode: Pin & Connector Coordinates Overlay */}
        {viewState.hardwareDebugMode && (isSelected || viewState.selectedComponentIds.length === 0) && (
          <HardwareDebugOverlay component={component} />
        )}

        {/* Selected or Hovered Ground Contact Glow / Outline Ring */}
        {(isSelected || (isHovered && !viewState.wireModeActive && !viewState.activeWiring)) && (
          <group position={[0, 0.01, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry
                args={[footprintRadius * 0.92, footprintRadius * 1.04, 36]}
              />
              <meshBasicMaterial
                color={isSelected ? THEME.selection.outline : '#60a5fa'}
                transparent
                opacity={isSelected ? 0.78 : 0.42}
                side={THREE.DoubleSide}
              />
            </mesh>
            {isSelected && (
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[footprintRadius * 0.96, 36]} />
                <meshBasicMaterial
                  color={THEME.selection.outline}
                  transparent
                  opacity={0.12}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}
          </group>
        )}
      </group>

      {/* 3D TransformControls Gizmo for primary selected component */}
      {mounted && isSelected && isPrimary && !viewState.isFreeMoving && groupRef.current && (
        <TransformGizmo
          targetObject={groupRef.current}
          componentId={component.id}
        />
      )}
    </>
  );
};
