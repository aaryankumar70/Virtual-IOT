import * as THREE from 'three';
import { VirtualComponent } from '../components/VirtualComponent';

const _v = new THREE.Vector3();
const _euler = new THREE.Euler();
const _matrix = new THREE.Matrix4();
const _scale = new THREE.Vector3();
const _pos = new THREE.Vector3();
const _quaternion = new THREE.Quaternion();

/**
 * Computes the exact 3D world position of a pin from its owning component's transform
 * and its local offset.
 *
 * Never caches static coordinates: computed fresh whenever components move or are queried.
 */
export function calculatePinWorldPosition(
  component: VirtualComponent,
  pinId: string
): THREE.Vector3 | null {
  const pin = component.pins.find((p) => p.id === pinId);
  if (!pin) return null;

  _pos.set(component.transform.position.x, component.transform.position.y, component.transform.position.z);
  _euler.set(component.transform.rotation.x, component.transform.rotation.y, component.transform.rotation.z, 'XYZ');
  _quaternion.setFromEuler(_euler);
  _scale.set(component.transform.scale.x, component.transform.scale.y, component.transform.scale.z);

  _matrix.compose(_pos, _quaternion, _scale);

  const localVec = new THREE.Vector3(pin.localPosition.x, pin.localPosition.y, pin.localPosition.z);
  return localVec.applyMatrix4(_matrix);
}

/**
 * Global helper that looks up component by ID in a component map/array and computes the pin world position.
 */
export function getPinWorldPositionFromList(
  components: VirtualComponent[],
  componentId: string,
  pinId: string
): THREE.Vector3 | null {
  const comp = components.find((c) => c.id === componentId);
  if (!comp) return null;
  return calculatePinWorldPosition(comp, pinId);
}
