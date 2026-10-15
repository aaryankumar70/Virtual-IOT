import React, { useMemo } from 'react';
import * as THREE from 'three';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { PinMesh } from '../../scene/World/PinMesh';
import { useLogicGateTexture } from './useLogicGateTexture';
import { evaluateGateOutput, LOGIC_GATES_INFO, LogicGateType } from '../../core/logic/logicGatesEngine';
import { projectStore, useProject } from '../../state/project/projectStore';
import { viewStore } from '../../state/view/viewStore';

interface Props {
  component: VirtualComponent;
}

export const LogicGateMesh: React.FC<Props> = ({ component }) => {
  const projectState = useProject();
  const texture = useLogicGateTexture(component.type);

  const gateInfo = LOGIC_GATES_INFO[component.type as LogicGateType] || LOGIC_GATES_INFO['gate-and'];

  // Determine input values from connected wires or internal toggles
  const { inputA, inputB, outputY } = useMemo(() => {
    // Check manual toggle states in component.state first
    let aVal = !!component.state?.inputA;
    let bVal = !!component.state?.inputB;

    // Check if input_a or input_b are connected to HIGH/VCC or LOW/GND signals in the circuit
    const conns = projectState.connections;
    const isPinConnectedTo = (pinId: string, keyword: string) => {
      return conns.some((c) => {
        const isSrc = c.source.componentId === component.id && (c.source.pinId === pinId || c.source.interfaceId === pinId);
        const isTgt = c.target.componentId === component.id && (c.target.pinId === pinId || c.target.interfaceId === pinId);
        if (!isSrc && !isTgt) return false;
        const otherEp = isSrc ? c.target : c.source;
        const otherPinId = (otherEp.pinId || otherEp.interfaceId || '').toLowerCase();
        return otherPinId.includes(keyword);
      });
    };

    if (isPinConnectedTo('pin_in_a', '5v') || isPinConnectedTo('pin_in_a', 'plus') || isPinConnectedTo('pin_in_a', 'vcc')) {
      aVal = true;
    } else if (isPinConnectedTo('pin_in_a', 'gnd') || isPinConnectedTo('pin_in_a', 'minus')) {
      aVal = false;
    }

    if (gateInfo.inputsCount === 2) {
      if (isPinConnectedTo('pin_in_b', '5v') || isPinConnectedTo('pin_in_b', 'plus') || isPinConnectedTo('pin_in_b', 'vcc')) {
        bVal = true;
      } else if (isPinConnectedTo('pin_in_b', 'gnd') || isPinConnectedTo('pin_in_b', 'minus')) {
        bVal = false;
      }
    }

    const yVal = evaluateGateOutput(component.type, aVal, bVal);
    return { inputA: aVal, inputB: bVal, outputY: yVal };
  }, [component.id, component.type, component.state, projectState.connections, gateInfo.inputsCount]);

  const handleToggleInputA = (e: any) => {
    e.stopPropagation();
    projectStore.updateComponentState(component.id, { inputA: !inputA });
    viewStore.setConnectionFeedback({
      message: `${component.name}: Input A set to ${!inputA ? '1 (HIGH)' : '0 (LOW)'}`,
      severity: 'info',
    });
  };

  const handleToggleInputB = (e: any) => {
    e.stopPropagation();
    if (gateInfo.inputsCount < 2) return;
    projectStore.updateComponentState(component.id, { inputB: !inputB });
    viewStore.setConnectionFeedback({
      message: `${component.name}: Input B set to ${!inputB ? '1 (HIGH)' : '0 (LOW)'}`,
      severity: 'info',
    });
  };

  return (
    <group>
      {/* 1. Main DIP IC Epoxy Body */}
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.05, 0.22, 0.58]} />
        <meshStandardMaterial
          color="#181b20"
          roughness={0.75}
          metalness={0.15}
        />
      </mesh>

      {/* 2. Top Silkscreen Face Plate with Gate Symbol */}
      <mesh position={[0, 0.272, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.02, 0.55]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.5}
          metalness={0.1}
        />
      </mesh>

      {/* 3. Output Y LED Status Indicator (Right Side / Near Pin Y) */}
      <group position={[-0.25, 0.28, 0.16]}>
        {/* LED Bezel Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.035, 0.055, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Glowing Indicator Lens */}
        <mesh position={[0, 0.015, 0]}>
          <sphereGeometry args={[0.038, 16, 16]} />
          <meshStandardMaterial
            color={outputY ? '#10b981' : '#1e293b'}
            emissive={outputY ? '#10b981' : '#000000'}
            emissiveIntensity={outputY ? 1.4 : 0.0}
            roughness={0.2}
            metalness={0.1}
          />
        </mesh>
        {/* Output Halo Glow when HIGH */}
        {outputY && (
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.05, 0.11, 16]} />
            <meshBasicMaterial color="#34d399" transparent opacity={0.65} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>

      {/* 4. Input A Interactive Indicator & Button on Top */}
      <group position={[-0.25, 0.28, -0.16]} onClick={handleToggleInputA}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.03, 0.05, 16]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.012, 0]}>
          <sphereGeometry args={[0.032, 12, 12]} />
          <meshStandardMaterial
            color={inputA ? '#06b6d4' : '#1e293b'}
            emissive={inputA ? '#06b6d4' : '#000000'}
            emissiveIntensity={inputA ? 1.2 : 0.0}
            roughness={0.3}
          />
        </mesh>
      </group>

      {/* 5. Input B Interactive Indicator & Button on Top (for 2-input gates) */}
      {gateInfo.inputsCount === 2 && (
        <group position={[0, 0.28, -0.16]} onClick={handleToggleInputB}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.03, 0.05, 16]} />
            <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.012, 0]}>
            <sphereGeometry args={[0.032, 12, 12]} />
            <meshStandardMaterial
              color={inputB ? '#06b6d4' : '#1e293b'}
              emissive={inputB ? '#06b6d4' : '#000000'}
              emissiveIntensity={inputB ? 1.2 : 0.0}
              roughness={0.3}
            />
          </mesh>
        </group>
      )}

      {/* 6. Formed Tin-Plated Metallic DIP Lead Frame Legs */}
      {/* Top Pins (Row D) */}
      <mesh position={[-0.25, 0.06, -0.25]} castShadow>
        <boxGeometry args={[0.05, 0.24, 0.06]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.88} roughness={0.25} />
      </mesh>
      {gateInfo.inputsCount === 2 && (
        <mesh position={[0, 0.06, -0.25]} castShadow>
          <boxGeometry args={[0.05, 0.24, 0.06]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.88} roughness={0.25} />
        </mesh>
      )}
      <mesh position={[0.25, 0.06, -0.25]} castShadow>
        <boxGeometry args={[0.05, 0.24, 0.06]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.88} roughness={0.25} />
      </mesh>

      {/* Bottom Pins (Row G) */}
      <mesh position={[-0.25, 0.06, 0.25]} castShadow>
        <boxGeometry args={[0.05, 0.24, 0.06]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.88} roughness={0.25} />
      </mesh>
      <mesh position={[0.25, 0.06, 0.25]} castShadow>
        <boxGeometry args={[0.05, 0.24, 0.06]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.88} roughness={0.25} />
      </mesh>

      {/* 7. Connectable Virtual Terminal Pins */}
      {component.pins.map((pin) => (
        <PinMesh
          key={pin.id}
          pin={pin}
          componentId={component.id}
          componentName={component.name}
        />
      ))}
    </group>
  );
};
