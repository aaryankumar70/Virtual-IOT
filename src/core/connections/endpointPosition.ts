import * as THREE from 'three';
import { VirtualComponent } from '../components/VirtualComponent';
import { ConnectionEndpoint } from './Connection';
import { calculatePinWorldPosition } from '../pins/pinPosition';

const _euler = new THREE.Euler();
const _matrix = new THREE.Matrix4();
const _scale = new THREE.Vector3();
const _pos = new THREE.Vector3();
const _quaternion = new THREE.Quaternion();

/**
 * Computes the 3D world position and orientation of a connector on a component.
 */
export function calculateConnectorWorldTransform(
  component: VirtualComponent,
  connectorId: string
): { position: THREE.Vector3; quaternion: THREE.Quaternion } | null {
  const connector =
    component.connectors?.find((c) => c.id === connectorId) ||
    component.ports?.find((p) => p.id === connectorId);

  if (!connector) return null;

  _pos.set(
    component.transform.position.x,
    component.transform.position.y,
    component.transform.position.z
  );
  _euler.set(
    component.transform.rotation.x,
    component.transform.rotation.y,
    component.transform.rotation.z,
    'XYZ'
  );
  _quaternion.setFromEuler(_euler);
  _scale.set(
    component.transform.scale.x,
    component.transform.scale.y,
    component.transform.scale.z
  );

  _matrix.compose(_pos, _quaternion, _scale);

  const localVec = new THREE.Vector3(
    connector.localPosition.x,
    connector.localPosition.y,
    connector.localPosition.z
  );
  const worldPos = localVec.applyMatrix4(_matrix);

  // Compute world rotation for connector orientation
  const connQuat = new THREE.Quaternion();
  if (connector.orientation) {
    const connEuler = new THREE.Euler(
      connector.orientation.x,
      connector.orientation.y,
      connector.orientation.z,
      'XYZ'
    );
    connQuat.setFromEuler(connEuler);
  }
  const worldQuat = _quaternion.clone().multiply(connQuat);

  return { position: worldPos, quaternion: worldQuat };
}

/**
 * Universal endpoint world position resolver: handles pins, connectors, ports, and breadboard holes.
 */
export function calculateEndpointWorldPosition(
  component: VirtualComponent,
  endpoint: ConnectionEndpoint
): THREE.Vector3 | null {
  const interfaceId = endpoint.interfaceId || endpoint.pinId || '';

  // 1. Try connector or port
  if (endpoint.type === 'connector' || endpoint.type === 'socket' || endpoint.type === 'port') {
    const result = calculateConnectorWorldTransform(component, interfaceId);
    if (result) return result.position;
  }

  // 2. Try pin or breadboard-hole
  return calculatePinWorldPosition(component, interfaceId);
}
