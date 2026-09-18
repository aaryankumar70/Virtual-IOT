import React, { useMemo } from 'react';
import * as THREE from 'three';
import { VirtualConnector } from '../../core/connections/VirtualConnector';
import { THEME } from '../../utils/theme';
import { viewStore, useView } from '../../state/view/viewStore';
import { projectStore, useProject } from '../../state/project/projectStore';
import { validateConnectorConnection } from '../../core/connections/validateConnector';
import { historyManager, Commands } from '../../editor/history/historyManager';

interface ConnectorMeshProps {
  connector: VirtualConnector;
  componentId: string;
  componentName: string;
}

export const ConnectorMesh: React.FC<ConnectorMeshProps> = React.memo(
  ({ connector, componentId, componentName }) => {
    const viewState = useView();
    const projectState = useProject();

    const isHovered =
      viewState.hoveredConnector?.componentId === componentId &&
      viewState.hoveredConnector?.connectorId === connector.id;

    // Is this connector currently connected/occupied?
    const activeConnection = useMemo(() => {
      return projectState.connections.find(
        (c) =>
          (c.source.componentId === componentId &&
            (c.source.interfaceId === connector.id || c.source.pinId === connector.id)) ||
          (c.target.componentId === componentId &&
            (c.target.interfaceId === connector.id || c.target.pinId === connector.id))
      );
    }, [projectState.connections, componentId, connector.id]);

    const isConnected = !!activeConnection;

    const isWiringSource =
      (viewState.activeConnectorWiring?.sourceComponentId === componentId &&
        viewState.activeConnectorWiring?.sourceConnectorId === connector.id) ||
      (viewState.activeWiring?.sourceComponentId === componentId &&
        viewState.activeWiring?.sourcePinId === connector.id);

    // Validation feedback if connector wiring is active
    const wiringTargetFeedback = useMemo(() => {
      const activeConn = viewState.activeConnectorWiring;
      if (!activeConn) return null;
      if (isWiringSource) return 'source';

      const sourceComp = projectState.components.find(
        (c) => c.id === activeConn.sourceComponentId
      );
      const sourceConnector = sourceComp?.connectors?.find(
        (cn) => cn.id === activeConn.sourceConnectorId
      );

      if (!sourceConnector) return null;

      const validation = validateConnectorConnection(
        sourceConnector,
        connector,
        sourceComp?.id,
        componentId,
        projectState.connections.map((c) => ({
          source: { componentId: c.source.componentId, interfaceId: c.source.interfaceId },
          target: { componentId: c.target.componentId, interfaceId: c.target.interfaceId },
        }))
      );

      return validation.valid ? 'valid' : 'invalid';
    }, [viewState.activeConnectorWiring, isWiringSource, projectState.components, projectState.connections, componentId, connector]);

    // Check if this connector is a compatible target for the currently selected connection component
    const isSelectedComponentTarget = useMemo(() => {
      if (viewState.selectedComponentIds.length !== 1) return false;
      const selId = viewState.selectedComponentIds[0];
      if (selId === componentId) return false;
      const selComp = projectState.components.find((c) => c.id === selId);
      if (!selComp || !selComp.connectors) return false;

      // Only highlight targets if selected component is a connection component (cable / power supply)
      const isConnComp = selComp.type === 'usb-cable' || selComp.type === 'dc-power-supply';
      if (!isConnComp) return false;

      return selComp.connectors.some((srcConn) => {
        const validation = validateConnectorConnection(
          srcConn,
          connector,
          selComp.id,
          componentId,
          projectState.connections.map((c) => ({
            source: { componentId: c.source.componentId, interfaceId: c.source.interfaceId },
            target: { componentId: c.target.componentId, interfaceId: c.target.interfaceId },
          }))
        );
        return validation.valid;
      });
    }, [viewState.selectedComponentIds, componentId, connector, projectState.components, projectState.connections]);

    // Is this connector a plug on the currently selected connection component?
    const isPlugOnSelectedComponent = useMemo(() => {
      if (viewState.selectedComponentIds.length !== 1) return false;
      const selId = viewState.selectedComponentIds[0];
      if (selId !== componentId) return false;
      const selComp = projectState.components.find((c) => c.id === selId);
      return selComp?.type === 'usb-cable' || selComp?.type === 'dc-power-supply';
    }, [viewState.selectedComponentIds, componentId, projectState.components]);

    // Color feedback
    const accentColor = useMemo(() => {
      if (isWiringSource) return THEME.accent.hover;
      if (wiringTargetFeedback === 'valid') return THEME.state.success;
      if (wiringTargetFeedback === 'invalid') return THEME.state.error;
      if (isSelectedComponentTarget) return '#38bdf8';
      if (isPlugOnSelectedComponent) return '#38bdf8';
      if (isHovered) return THEME.accent.hover;
      if (isConnected) return '#10b981';
      return '#64748b';
    }, [isWiringSource, wiringTargetFeedback, isSelectedComponentTarget, isPlugOnSelectedComponent, isHovered, isConnected]);

    const handleClick = (e: any) => {
      e.stopPropagation();

      // If active connector wiring is in progress:
      if (viewState.activeConnectorWiring) {
        if (isWiringSource) {
          viewStore.cancelConnectorWiring();
          return;
        }

        const srcCompId = viewState.activeConnectorWiring.sourceComponentId;
        const srcConnId = viewState.activeConnectorWiring.sourceConnectorId;
        const srcComp = projectState.components.find((c) => c.id === srcCompId);
        const srcConnector = srcComp?.connectors?.find((cn) => cn.id === srcConnId);

        if (srcConnector) {
          const validation = validateConnectorConnection(
            srcConnector,
            connector,
            srcCompId,
            componentId,
            projectState.connections.map((c) => ({
              source: { componentId: c.source.componentId, interfaceId: c.source.interfaceId },
              target: { componentId: c.target.componentId, interfaceId: c.target.interfaceId },
            }))
          );

          if (validation.valid) {
            // Determine appropriate physical connection type
            let connectionType: any = 'plug-socket';
            if (connector.interfaceType === 'usb') connectionType = 'usb';
            else if (connector.interfaceType === 'dc-power') connectionType = 'dc-power';
            else if (connector.interfaceType === 'header') connectionType = 'header';

            historyManager.execute(
              Commands.addConnection(
                {
                  componentId: srcCompId,
                  interfaceId: srcConnId,
                  type: 'connector',
                  pinId: srcConnId,
                },
                {
                  componentId,
                  interfaceId: connector.id,
                  type: 'connector',
                  pinId: connector.id,
                },
                connectionType,
                connectionType === 'usb'
                  ? '#38bdf8'
                  : connectionType === 'dc-power'
                  ? '#f59e0b'
                  : '#a855f7',
                {
                  interfaceType: connector.interfaceType,
                  gender: connector.gender,
                }
              )
            );
            viewStore.cancelConnectorWiring();
          } else {
            viewStore.setConnectionFeedback({
              message: validation.message,
              severity: validation.severity === 'warning' ? 'warning' : 'error',
            });
          }
        }
        return;
      }

      // If wire wiring is active and target is a header:
      if (viewState.activeWiring && connector.interfaceType === 'header') {
        const srcCompId = viewState.activeWiring.sourceComponentId;
        const srcPinId = viewState.activeWiring.sourcePinId;
        historyManager.execute(
          Commands.addConnection(
            {
              componentId: srcCompId,
              interfaceId: srcPinId,
              type: 'pin',
              pinId: srcPinId,
            },
            {
              componentId,
              interfaceId: connector.id,
              type: 'connector',
              pinId: connector.id,
            },
            'header',
            '#a855f7'
          )
        );
        viewStore.cancelWiring();
        return;
      }

      // Start connector wiring from this connector
      const comp = projectState.components.find((c) => c.id === componentId);
      if (comp) {
        const worldPos = projectStore.getEndpointWorldPosition(componentId, connector.id);
        if (worldPos) {
          viewStore.startConnectorWiring(componentId, connector.id, {
            x: worldPos.x,
            y: worldPos.y,
            z: worldPos.z,
          });

          if (connector.interfaceType === 'usb' && !connector.connectorType.includes('plug')) {
            const hasUsbCable = projectState.components.some((c) => c.type === 'usb-cable');
            if (hasUsbCable) {
              viewStore.setConnectionFeedback({
                message: `Connecting ${connector.name}. Connect via the USB Cable plug in your scene.`,
                severity: 'warning',
              });
            } else {
              viewStore.setConnectionFeedback({
                message: `Connecting ${connector.name} requires a USB Cable (A-to-B). Add a USB Cable from the library.`,
                severity: 'warning',
              });
            }
          }
        }
      }
    };

    const handlePointerOver = (e: any) => {
      e.stopPropagation();
      viewStore.setHoveredConnector({ componentId, connectorId: connector.id });
    };

    const handlePointerOut = (e: any) => {
      e.stopPropagation();
      if (
        viewState.hoveredConnector?.componentId === componentId &&
        viewState.hoveredConnector?.connectorId === connector.id
      ) {
        viewStore.setHoveredConnector(null);
      }
    };

    // Render detailed visual geometry according to connectorType and interfaceType
    const renderConnectorGeometry = () => {
      const type = connector.connectorType.toLowerCase();
      const isMale = connector.gender === 'male' || type.includes('plug');

      // 1. USB TYPE-B
      if (type.includes('usb-b')) {
        if (isMale) {
          // Authentic USB-B Male Plug (House-shaped profile, nickel shroud, dark molded PVC boot & USB logo)
          return (
            <group>
              {/* Nickel Metal Shroud - Lower Rectangular Box */}
              <mesh position={[0, 0.16, 0.32]}>
                <boxGeometry args={[0.62, 0.32, 0.65]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.12} />
              </mesh>
              {/* Nickel Metal Shroud - Upper Beveled Roof */}
              <mesh position={[0, 0.34, 0.32]}>
                <boxGeometry args={[0.42, 0.18, 0.65]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.12} />
              </mesh>
              {/* Dual Top Retention Latch Windows */}
              <mesh position={[-0.1, 0.435, 0.32]}>
                <boxGeometry args={[0.08, 0.02, 0.14]} />
                <meshStandardMaterial color="#09090b" roughness={0.9} />
              </mesh>
              <mesh position={[0.1, 0.435, 0.32]}>
                <boxGeometry args={[0.08, 0.02, 0.14]} />
                <meshStandardMaterial color="#09090b" roughness={0.9} />
              </mesh>
              {/* Dark Front Cavity */}
              <mesh position={[0, 0.22, 0.64]}>
                <boxGeometry args={[0.5, 0.38, 0.04]} />
                <meshStandardMaterial color="#09090b" roughness={0.9} />
              </mesh>
              {/* White Insulator Core with 4 Gold Contacts */}
              <mesh position={[0, 0.22, 0.46]}>
                <boxGeometry args={[0.34, 0.22, 0.2]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.4} />
              </mesh>
              {[-0.09, -0.03, 0.03, 0.09].map((xOff, i) => (
                <mesh key={i} position={[xOff, 0.22, 0.58]}>
                  <boxGeometry args={[0.03, 0.06, 0.08]} />
                  <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
                </mesh>
              ))}

              {/* Molded PVC Overmold Body - House Profile */}
              <mesh position={[0, 0.2, -0.22]}>
                <boxGeometry args={[0.82, 0.42, 0.75]} />
                <meshStandardMaterial color="#1e293b" roughness={0.6} />
              </mesh>
              <mesh position={[0, 0.42, -0.22]}>
                <boxGeometry args={[0.56, 0.22, 0.75]} />
                <meshStandardMaterial color="#1e293b" roughness={0.6} />
              </mesh>

              {/* Embossed USB Trident Logo on top */}
              <group position={[0, 0.535, -0.22]}>
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[0.03, 0.02, 0.26]} />
                  <meshStandardMaterial color="#94a3b8" />
                </mesh>
                <mesh position={[0, 0, 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0, 0.05, 0.07, 3]} />
                  <meshStandardMaterial color="#94a3b8" />
                </mesh>
                <mesh position={[-0.07, 0, 0.04]}>
                  <boxGeometry args={[0.08, 0.02, 0.02]} />
                  <meshStandardMaterial color="#94a3b8" />
                </mesh>
                <mesh position={[-0.1, 0, 0.06]} rotation={[-Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.028, 0.028, 0.02, 8]} />
                  <meshStandardMaterial color="#94a3b8" />
                </mesh>
                <mesh position={[0.07, 0, 0.01]}>
                  <boxGeometry args={[0.08, 0.02, 0.02]} />
                  <meshStandardMaterial color="#94a3b8" />
                </mesh>
                <mesh position={[0.1, 0, 0.03]}>
                  <boxGeometry args={[0.04, 0.02, 0.04]} />
                  <meshStandardMaterial color="#94a3b8" />
                </mesh>
              </group>

              {/* Segmented Strain Relief Boot */}
              <mesh position={[0, 0.2, -0.66]}>
                <boxGeometry args={[0.62, 0.32, 0.14]} />
                <meshStandardMaterial color="#0f172a" roughness={0.7} />
              </mesh>
              <mesh position={[0, 0.2, -0.78]}>
                <boxGeometry args={[0.46, 0.24, 0.12]} />
                <meshStandardMaterial color="#0f172a" roughness={0.7} />
              </mesh>
              <mesh position={[0, 0.2, -0.88]}>
                <boxGeometry args={[0.32, 0.18, 0.1]} />
                <meshStandardMaterial color="#0f172a" roughness={0.7} />
              </mesh>
            </group>
          );
        }

        // Authentic USB-B Female Receptacle (Arduino Uno PCB Jack: Foxconn/Amphenol through-hole metal shield)
        return (
          <group>
            {/* Formed Sheet Metal Shield - Lower Rectangular Case */}
            <mesh position={[0, 0.22, 0]}>
              <boxGeometry args={[0.92, 0.44, 0.95]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.12} />
            </mesh>
            {/* Upper Beveled Roof Shoulders (House silhouette) */}
            <mesh position={[0, 0.46, 0]}>
              <boxGeometry args={[0.62, 0.24, 0.95]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.12} />
            </mesh>
            {/* Top Center Folded Seam Line */}
            <mesh position={[0, 0.585, 0]}>
              <boxGeometry args={[0.04, 0.02, 0.95]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} />
            </mesh>
            {/* Top Spring Retention Latch Cutouts */}
            <mesh position={[-0.15, 0.582, 0.15]}>
              <boxGeometry args={[0.1, 0.02, 0.14]} />
              <meshStandardMaterial color="#09090b" roughness={0.9} />
            </mesh>
            <mesh position={[0.15, 0.582, 0.15]}>
              <boxGeometry args={[0.1, 0.02, 0.14]} />
              <meshStandardMaterial color="#09090b" roughness={0.9} />
            </mesh>
            {/* Side PCB Solder Mounting Ground Tabs */}
            <mesh position={[-0.49, 0.06, 0]}>
              <boxGeometry args={[0.06, 0.12, 0.35]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} />
            </mesh>
            <mesh position={[0.49, 0.06, 0]}>
              <boxGeometry args={[0.06, 0.12, 0.35]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} />
            </mesh>

            {/* Deep Dark Receptacle Interior */}
            <mesh position={[0, 0.28, 0.48]}>
              <boxGeometry args={[0.74, 0.52, 0.04]} />
              <meshStandardMaterial color="#09090b" roughness={0.95} />
            </mesh>

            {/* Center Keystone Tongue (White PBT Plastic) */}
            <mesh position={[0, 0.2, 0.3]}>
              <boxGeometry args={[0.46, 0.16, 0.32]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.3, 0.3]}>
              <boxGeometry args={[0.3, 0.12, 0.32]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.4} />
            </mesh>

            {/* 4 Gold Spring Wiper Pins */}
            {[-0.15, -0.05, 0.05, 0.15].map((xOff, i) => (
              <mesh key={i} position={[xOff, 0.22, 0.35]}>
                <boxGeometry args={[0.03, 0.04, 0.22]} />
                <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.2} />
              </mesh>
            ))}
          </group>
        );
      }

      // 2. USB TYPE-A
      if (type.includes('usb-a')) {
        if (isMale) {
          // Authentic USB-A Male Plug (Nickel shell with dual stamped window cutouts, gold pins, molded boot & USB logo)
          return (
            <group>
              {/* Nickel Metal Shroud Box */}
              <mesh position={[0, 0.18, 0.36]}>
                <boxGeometry args={[0.7, 0.28, 0.75]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.12} />
              </mesh>
              {/* Signature Dual Rectangular Cutout Windows on top face */}
              <mesh position={[-0.15, 0.325, 0.36]}>
                <boxGeometry args={[0.12, 0.02, 0.16]} />
                <meshStandardMaterial color="#0f172a" roughness={0.9} />
              </mesh>
              <mesh position={[0.15, 0.325, 0.36]}>
                <boxGeometry args={[0.12, 0.02, 0.16]} />
                <meshStandardMaterial color="#0f172a" roughness={0.9} />
              </mesh>
              {/* Side Ground Detent Spring Bumps */}
              <mesh position={[-0.355, 0.18, 0.35]}>
                <sphereGeometry args={[0.035, 8, 8]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.95} />
              </mesh>
              <mesh position={[0.355, 0.18, 0.35]}>
                <sphereGeometry args={[0.035, 8, 8]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.95} />
              </mesh>
              {/* Front Socket Mating Chamber */}
              <mesh position={[0, 0.18, 0.74]}>
                <boxGeometry args={[0.62, 0.22, 0.02]} />
                <meshStandardMaterial color="#09090b" roughness={0.9} />
              </mesh>
              {/* Inner Blue USB 3.0 / White 2.0 Plastic Tongue */}
              <mesh position={[0, 0.23, 0.48]}>
                <boxGeometry args={[0.56, 0.08, 0.42]} />
                <meshStandardMaterial color="#0284c7" roughness={0.4} />
              </mesh>
              {/* 4 Gold Contact Leaves on Tongue */}
              {[-0.18, -0.06, 0.06, 0.18].map((xOff, i) => (
                <mesh key={i} position={[xOff, 0.272, 0.52]}>
                  <boxGeometry args={[0.04, 0.015, 0.24]} />
                  <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.2} />
                </mesh>
              ))}

              {/* Molded PVC Overmold Body */}
              <mesh position={[0, 0.2, -0.22]}>
                <boxGeometry args={[0.88, 0.38, 0.85]} />
                <meshStandardMaterial color="#1e293b" roughness={0.6} />
              </mesh>
              {/* Subtle Thumb Grip Recess on top */}
              <mesh position={[0, 0.395, -0.22]}>
                <boxGeometry args={[0.35, 0.02, 0.45]} />
                <meshStandardMaterial color="#0f172a" roughness={0.8} />
              </mesh>

              {/* Embossed USB Trident Logo */}
              <group position={[0, 0.405, -0.22]}>
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[0.03, 0.02, 0.26]} />
                  <meshStandardMaterial color="#94a3b8" />
                </mesh>
                <mesh position={[0, 0, 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0, 0.05, 0.07, 3]} />
                  <meshStandardMaterial color="#94a3b8" />
                </mesh>
                <mesh position={[-0.07, 0, 0.04]}>
                  <boxGeometry args={[0.08, 0.02, 0.02]} />
                  <meshStandardMaterial color="#94a3b8" />
                </mesh>
                <mesh position={[-0.1, 0, 0.06]} rotation={[-Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.028, 0.028, 0.02, 8]} />
                  <meshStandardMaterial color="#94a3b8" />
                </mesh>
                <mesh position={[0.07, 0, 0.01]}>
                  <boxGeometry args={[0.08, 0.02, 0.02]} />
                  <meshStandardMaterial color="#94a3b8" />
                </mesh>
                <mesh position={[0.1, 0, 0.03]}>
                  <boxGeometry args={[0.04, 0.02, 0.04]} />
                  <meshStandardMaterial color="#94a3b8" />
                </mesh>
              </group>

              {/* Segmented Strain Relief Boot */}
              <mesh position={[0, 0.2, -0.7]}>
                <boxGeometry args={[0.65, 0.3, 0.16]} />
                <meshStandardMaterial color="#0f172a" roughness={0.7} />
              </mesh>
              <mesh position={[0, 0.2, -0.82]}>
                <boxGeometry args={[0.48, 0.24, 0.14]} />
                <meshStandardMaterial color="#0f172a" roughness={0.7} />
              </mesh>
              <mesh position={[0, 0.2, -0.92]}>
                <boxGeometry args={[0.34, 0.18, 0.12]} />
                <meshStandardMaterial color="#0f172a" roughness={0.7} />
              </mesh>
            </group>
          );
        }

        // Authentic USB-A Female Receptacle (PC Host / Raspberry Pi USB Port with metal shield & blue 3.0 tongue)
        return (
          <group>
            {/* Formed Metal Shield Box */}
            <mesh position={[0, 0.24, 0]}>
              <boxGeometry args={[0.92, 0.48, 0.85]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
            </mesh>
            {/* Front Opening & Socket Cavity */}
            <mesh position={[0, 0.24, 0.43]}>
              <boxGeometry args={[0.76, 0.34, 0.04]} />
              <meshStandardMaterial color="#09090b" roughness={0.9} />
            </mesh>
            {/* Upper Grounding Spring Retention Tabs */}
            <mesh position={[-0.2, 0.485, 0.25]}>
              <boxGeometry args={[0.13, 0.03, 0.25]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} />
            </mesh>
            <mesh position={[0.2, 0.485, 0.25]}>
              <boxGeometry args={[0.13, 0.03, 0.25]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} />
            </mesh>
            {/* Blue USB 3.0 SuperSpeed Tongue */}
            <mesh position={[0, 0.31, 0.2]}>
              <boxGeometry args={[0.66, 0.08, 0.42]} />
              <meshStandardMaterial color="#0284c7" roughness={0.4} />
            </mesh>
            {/* 4 Gold Spring Contacts */}
            {[-0.2, -0.07, 0.07, 0.2].map((xOff, i) => (
              <mesh key={i} position={[xOff, 0.265, 0.22]}>
                <boxGeometry args={[0.04, 0.015, 0.28]} />
                <meshStandardMaterial color="#fbbf24" metalness={0.95} roughness={0.2} />
              </mesh>
            ))}
          </group>
        );
      }

      // 3. MICRO-USB & USB-C
      if (type.includes('micro-usb') || type.includes('usb-c')) {
        return (
          <group>
            {/* Metallic Shell */}
            <mesh position={[0, 0.14, 0]}>
              <boxGeometry args={[0.6, 0.26, 0.5]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
            </mesh>
            {/* Oval Inner Slot */}
            <mesh position={[0, 0.14, 0.25]}>
              <boxGeometry args={[0.45, 0.14, 0.04]} />
              <meshStandardMaterial color="#09090b" roughness={0.9} />
            </mesh>
            {/* Center Tongue */}
            <mesh position={[0, 0.14, 0.12]}>
              <boxGeometry args={[0.32, 0.04, 0.22]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
          </group>
        );
      }

      // 4. DC BARREL JACK & PLUG
      if (type.includes('dc-barrel') || type.includes('dc-power') || type.includes('dc_jack')) {
        if (isMale) {
          // Male 2.1mm DC Barrel Plug
          return (
            <group>
              {/* Knurled Handle Grip */}
              <mesh position={[0, 0.3, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.26, 0.26, 0.7, 16]} />
                <meshStandardMaterial color="#18181b" roughness={0.6} />
              </mesh>
              {/* Nickel Barrel Sleeve */}
              <mesh position={[0, 0.3, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.18, 0.18, 0.6, 20]} />
                <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
              </mesh>
              {/* Hollow 2.1mm Center Orifice */}
              <mesh position={[0, 0.3, 0.55]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
                <meshStandardMaterial color="#09090b" roughness={0.9} />
              </mesh>
            </group>
          );
        }

        // Female 2.1mm DC Barrel Jack (Arduino Uno style)
        return (
          <group>
            {/* Heavy-Duty Black Plastic Housing */}
            <mesh position={[0, 0.3, 0]}>
              <boxGeometry args={[0.95, 0.7, 1.2]} />
              <meshStandardMaterial color="#18181b" roughness={0.6} />
            </mesh>
            {/* Metallic Bushing Collar */}
            <mesh position={[0, 0.3, 0.58]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.32, 0.32, 0.15, 20]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* Center 2.1mm Solid Pin */}
            <mesh position={[0, 0.3, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 0.35, 14]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        );
      }

      // 5. PIN HEADERS
      if (type.includes('header') || connector.interfaceType === 'header') {
        const pinCount = connector.contactCount || 8;
        const isFemale = connector.gender === 'female';
        const length = Math.max(0.6, pinCount * 0.25);

        return (
          <group>
            {/* Shroud Housing */}
            <mesh position={[0, 0.15, 0]}>
              <boxGeometry args={[length, isFemale ? 0.35 : 0.15, 0.3]} />
              <meshStandardMaterial color="#1e293b" roughness={0.7} />
            </mesh>

            {/* Pins / Socket Holes */}
            {Array.from({ length: pinCount }).map((_, idx) => {
              const xOff = (idx - (pinCount - 1) / 2) * 0.25;
              return isFemale ? (
                <mesh key={idx} position={[xOff, 0.33, 0]}>
                  <boxGeometry args={[0.1, 0.02, 0.1]} />
                  <meshStandardMaterial color="#0f172a" roughness={0.9} />
                </mesh>
              ) : (
                <mesh key={idx} position={[xOff, 0.3, 0]}>
                  <boxGeometry args={[0.04, 0.35, 0.04]} />
                  <meshStandardMaterial color="#fbbf24" metalness={0.85} roughness={0.2} />
                </mesh>
              );
            })}
          </group>
        );
      }

      // Default generic connector mesh
      return (
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[0.5, 0.3, 0.5]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
        </mesh>
      );
    };

    const isHeader =
      connector.interfaceType === 'header' ||
      connector.connectorType.toLowerCase().includes('header');
    const headerLength = Math.max(0.6, (connector.contactCount || 8) * 0.25);

    // Compute rotation around Y axis based on connector direction vector
    const rotationY = connector.direction
      ? Math.atan2(connector.direction.x, connector.direction.z)
      : 0;

    return (
      <group
        position={[
          connector.localPosition.x,
          connector.localPosition.y,
          connector.localPosition.z,
        ]}
        rotation={[0, rotationY, 0]}
      >
        {/* Invisible Click/Hover Raycast Target */}
        {isHeader ? (
          <group>
            {/* Front housing edge hit target (outside pin row) */}
            <mesh
              position={[0, 0.18, 0.22]}
              onClick={handleClick}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
            >
              <boxGeometry args={[headerLength, 0.35, 0.14]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            {/* Back housing edge hit target (outside pin row) */}
            <mesh
              position={[0, 0.18, -0.22]}
              onClick={handleClick}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
            >
              <boxGeometry args={[headerLength, 0.35, 0.14]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            {/* Left housing end tab */}
            <mesh
              position={[-(headerLength / 2 + 0.08), 0.18, 0]}
              onClick={handleClick}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
            >
              <boxGeometry args={[0.16, 0.35, 0.3]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            {/* Right housing end tab */}
            <mesh
              position={[+(headerLength / 2 + 0.08), 0.18, 0]}
              onClick={handleClick}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
            >
              <boxGeometry args={[0.16, 0.35, 0.3]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>
        ) : (
          <mesh
            position={[0, 0.25, 0]}
            onClick={handleClick}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
          >
            <cylinderGeometry args={[0.55, 0.55, 0.7, 16]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        )}

        {/* 3D Connector Hardware Geometry */}
        {renderConnectorGeometry()}

        {/* Status Indicator LED / Engagement Glow Ring */}
        <group position={[0, 0.02, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry
              args={[
                wiringTargetFeedback === 'valid' || isSelectedComponentTarget ? 0.42 : 0.38,
                wiringTargetFeedback === 'valid' || isSelectedComponentTarget ? 0.54 : 0.46,
                24,
              ]}
            />
            <meshBasicMaterial
              color={accentColor}
              transparent
              opacity={
                isHovered || isWiringSource || wiringTargetFeedback === 'valid'
                  ? 0.95
                  : isSelectedComponentTarget || isPlugOnSelectedComponent
                  ? 0.85
                  : isConnected
                  ? 0.75
                  : 0.25
              }
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Compatible target beacon pulse ring */}
          {(wiringTargetFeedback === 'valid' || isSelectedComponentTarget) && (
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.58, 0.68, 24]} />
              <meshBasicMaterial
                color={wiringTargetFeedback === 'valid' ? '#10b981' : '#38bdf8'}
                transparent
                opacity={0.6}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}

          {/* Connection active dot indicator */}
          {isConnected && (
            <mesh position={[0, 0.5, 0]}>
              <sphereGeometry args={[0.06, 12, 12]} />
              <meshBasicMaterial color="#10b981" />
            </mesh>
          )}
        </group>
      </group>
    );
  }
);
