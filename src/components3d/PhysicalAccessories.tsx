import React, { useMemo } from 'react';
import * as THREE from 'three';
import { VirtualComponent } from '../core/components/VirtualComponent';
import { PinMesh } from '../scene/World/PinMesh';
import { ConnectorMesh } from '../scene/World/ConnectorMesh';
import { useView } from '../state/view/viewStore';
import { useProject } from '../state/project/projectStore';

interface ComponentMeshProps {
  component: VirtualComponent;
}

/**
 * Workstation PC / USB Host (5V VBUS & Serial Dev Terminal)
 */
export const ComputerHostMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  return (
    <group>
      {/* PC Tower / Desktop Chassis */}
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[3.8, 2.3, 3.0]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Front Faceplate */}
      <mesh position={[1.91, 1.2, 0]}>
        <boxGeometry args={[0.04, 2.25, 2.95]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} />
      </mesh>

      {/* Power Button & Blue LED */}
      <mesh position={[1.93, 1.9, -0.8]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.05, 16]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} />
      </mesh>

      {/* Front Ventilation Grille */}
      <mesh position={[1.93, 0.6, 0]}>
        <boxGeometry args={[0.02, 0.8, 2.4]} />
        <meshStandardMaterial color="#020617" roughness={0.9} />
      </mesh>

      {/* Render Connectors (USB-A 3.0 Host Port) */}
      {component.connectors?.map((connector) => (
        <ConnectorMesh
          key={connector.id}
          connector={connector}
          componentId={component.id}
          componentName={component.name}
        />
      ))}
    </group>
  );
};

/**
 * Regulated 9V DC Wall Power Adapter with 2.1mm Center-Positive Barrel Plug
 */
export const DCPowerSupplyMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  return (
    <group>
      {/* Adapter Brick Body */}
      <mesh position={[-0.4, 0.8, 0]}>
        <boxGeometry args={[1.8, 1.5, 1.6]} />
        <meshStandardMaterial color="#18181b" roughness={0.4} />
      </mesh>

      {/* AC Wall Prongs (US/EU style rear pins) */}
      <mesh position={[-1.35, 0.8, -0.3]}>
        <boxGeometry args={[0.2, 0.5, 0.08]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[-1.35, 0.8, 0.3]}>
        <boxGeometry args={[0.2, 0.5, 0.08]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Power Indicator Green LED */}
      <mesh position={[-0.4, 1.56, 0]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={0.9} />
      </mesh>

      {/* Strain Relief Boot & Outgoing Cable */}
      <mesh position={[0.55, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.22, 0.3, 12]} />
        <meshStandardMaterial color="#27272a" roughness={0.7} />
      </mesh>
      <mesh position={[0.8, 0.38, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.4, 12]} />
        <meshStandardMaterial color="#09090b" roughness={0.8} />
      </mesh>

      {/* Render Connectors (2.1mm Barrel Plug) */}
      {component.connectors?.map((connector) => (
        <ConnectorMesh
          key={connector.id}
          connector={connector}
          componentId={component.id}
          componentName={component.name}
        />
      ))}
    </group>
  );
};

/**
 * DHT11 Temperature & Humidity Sensor Breakout Module
 */
export const DHT11SensorMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  return (
    <group>
      {/* Blue Plastic Slotted Humidity Chamber */}
      <mesh position={[0, 1.2, -0.1]}>
        <boxGeometry args={[1.3, 1.6, 0.8]} />
        <meshStandardMaterial color="#0284c7" roughness={0.3} />
      </mesh>

      {/* Slotted Ventilation Louvers */}
      {[-0.3, 0.0, 0.3].map((yOff, i) => (
        <mesh key={i} position={[0, 1.2 + yOff, 0.31]}>
          <boxGeometry args={[0.9, 0.08, 0.04]} />
          <meshStandardMaterial color="#0369a1" roughness={0.6} />
        </mesh>
      ))}

      {/* PCB Breakout Baseboard */}
      <mesh position={[0, 0.25, 0.15]}>
        <boxGeometry args={[1.5, 0.2, 1.2]} />
        <meshStandardMaterial color="#15803d" roughness={0.4} />
      </mesh>

      {/* Onboard 10k Pull-up Resistor */}
      <mesh position={[-0.35, 0.38, 0.1]}>
        <boxGeometry args={[0.25, 0.08, 0.12]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* Power SMD LED */}
      <mesh position={[0.35, 0.38, 0.1]}>
        <boxGeometry args={[0.1, 0.05, 0.1]} />
        <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.6} />
      </mesh>

      {/* Render Pins (VCC, DATA, NC, GND) */}
      {component.pins.map((pin) => (
        <PinMesh
          key={pin.id}
          pin={pin}
          componentId={component.id}
          componentName={component.name}
        />
      ))}

      {/* Render Connector (4-Pin Male Header) */}
      {component.connectors?.map((connector) => (
        <ConnectorMesh
          key={connector.id}
          connector={connector}
          componentId={component.id}
          componentName={component.name}
        />
      ))}
    </group>
  );
};

/**
 * USB 2.0 A-to-B Molded Cable Assembly Component
 */
export const USBCableMesh: React.FC<ComponentMeshProps> = ({ component }) => {
  const viewState = useView();
  const projectState = useProject();

  const isSelected = viewState.selectedComponentIds.includes(component.id);

  // Check connection status for each plug
  const isUsbAConnected = useMemo(() => {
    return projectState.connections.some(
      (c) =>
        (c.source.componentId === component.id && c.source.interfaceId === 'plug_usb_a') ||
        (c.target.componentId === component.id && c.target.interfaceId === 'plug_usb_a')
    );
  }, [projectState.connections, component.id]);

  const isUsbBConnected = useMemo(() => {
    return projectState.connections.some(
      (c) =>
        (c.source.componentId === component.id && c.source.interfaceId === 'plug_usb_b') ||
        (c.target.componentId === component.id && c.target.interfaceId === 'plug_usb_b')
    );
  }, [projectState.connections, component.id]);

  // Realistic curved flexible cable draped on workbench surface
  const cableGeometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.25, 0.28, 0.0),
      new THREE.Vector3(-0.85, 0.16, 0.35),
      new THREE.Vector3(-0.25, 0.12, 0.48),
      new THREE.Vector3(0.35, 0.14, 0.42),
      new THREE.Vector3(0.85, 0.18, 0.22),
      new THREE.Vector3(1.25, 0.28, 0.0),
    ]);
    return new THREE.TubeGeometry(curve, 36, 0.08, 12, false);
  }, []);

  return (
    <group>
      {/* Flexible Curved Translucent Blue USB Cord */}
      <mesh geometry={cableGeometry}>
        <meshStandardMaterial
          color="#0284c7"
          roughness={0.3}
          metalness={0.15}
        />
      </mesh>

      {/* Molded Ferrite Core Noise Choke Bead (near Host USB-A end) */}
      <group position={[-0.85, 0.16, 0.35]} rotation={[0, -0.4, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18, 0.18, 0.42, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} />
        </mesh>
        {/* Ferrite Core Snap Clamp Seam */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.185, 0.185, 0.04, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
      </group>

      {/* USB-A End Strain Relief Boot (Transition to Plug) */}
      <mesh position={[-1.25, 0.28, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.12, 0.35, 12]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} />
      </mesh>

      {/* USB-B End Strain Relief Boot (Transition to Plug) */}
      <mesh position={[1.25, 0.28, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.12, 0.35, 12]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} />
      </mesh>

      {/* In-Scene 3D Connection Guidance Indicators when Selected */}
      {isSelected && (
        <group>
          {/* USB-A Plug Callout Guide (Left) */}
          <group position={[-1.5, 0.8, 0]}>
            {/* Guide line down to plug */}
            <mesh position={[0, -0.25, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
            {/* Pulsing indicator sphere */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.09, 12, 12]} />
              <meshBasicMaterial color={isUsbAConnected ? '#10b981' : '#38bdf8'} />
            </mesh>
          </group>

          {/* USB-B Plug Callout Guide (Right) */}
          <group position={[1.5, 0.8, 0]}>
            {/* Guide line down to plug */}
            <mesh position={[0, -0.25, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
            {/* Pulsing indicator sphere */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.09, 12, 12]} />
              <meshBasicMaterial color={isUsbBConnected ? '#10b981' : '#38bdf8'} />
            </mesh>
          </group>
        </group>
      )}

      {/* Render Connectors (USB-A Plug & USB-B Plug) */}
      {component.connectors?.map((connector) => (
        <ConnectorMesh
          key={connector.id}
          connector={connector}
          componentId={component.id}
          componentName={component.name}
        />
      ))}
    </group>
  );
};
