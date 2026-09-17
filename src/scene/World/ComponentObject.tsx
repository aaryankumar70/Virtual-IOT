import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { ComponentRenderer } from '../../components3d/ComponentRenderer';
import { useView, viewStore } from '../../state/view/viewStore';
import { THEME } from '../../utils/theme';

interface Props {
  component: VirtualComponent;
  onSelectObject?: (comp: VirtualComponent, obj: THREE.Object3D) => void;
}

export const ComponentObject: React.FC<Props> = ({ component, onSelectObject }) => {
  const groupRef = useRef<THREE.Group>(null);
  const viewState = useView();

  const isSelected = viewState.selectedComponentIds.includes(component.id);

  // Sync transform position, rotation, scale
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(
        component.transform.position.x,
        component.transform.position.y,
        component.transform.position.z
      );
      groupRef.current.rotation.set(
        component.transform.rotation.x,
        component.transform.rotation.y,
        component.transform.rotation.z
      );
      groupRef.current.scale.set(
        component.transform.scale.x,
        component.transform.scale.y,
        component.transform.scale.z
      );
    }
  }, [component.transform]);

  useEffect(() => {
    if (isSelected && groupRef.current && onSelectObject) {
      onSelectObject(component, groupRef.current);
    }
  }, [isSelected, component, onSelectObject]);

  const handleClick = (e: any) => {
    e.stopPropagation();

    // If wiring is in progress, clicking component body doesn't do anything (pin handles connection)
    if (viewState.activeWiring) return;

    if (e.shiftKey) {
      // Shift + click selects the component and starts free move
      viewStore.selectComponent(component.id, false);
      viewStore.setIsFreeMoving(true);
      return;
    }

    const isMulti = e.ctrlKey || e.metaKey;
    viewStore.selectComponent(component.id, isMulti);
  };

  const handleContextMenu = (e: any) => {
    e.stopPropagation();
    viewStore.setContextMenu({
      x: e.clientX,
      y: e.clientY,
      componentId: component.id,
    });
  };

  return (
    <group
      ref={groupRef}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {/* Component 3D hardware model & pins */}
      <ComponentRenderer component={component} />

      {/* Selected Ground Contact Glow / Outline Ring */}
      {isSelected && (
        <group position={[0, 0.01, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.6, 1.8, 32]} />
            <meshBasicMaterial
              color={THEME.selection.outline}
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.7, 32]} />
            <meshBasicMaterial
              color={THEME.selection.outline}
              transparent
              opacity={0.12}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}
    </group>
  );
};
