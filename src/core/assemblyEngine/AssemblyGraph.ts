/**
 * Virtual IoT Lab — Assembly Engine
 *
 * Manages physical machine hierarchy, mounting sockets, independent hardware entities,
 * and dynamic aggregation of physical properties (total mass, dynamic center of mass,
 * moment of inertia tensor).
 */

import { HardwareEntity, MountInterface } from '../hardwareEngine/HardwareEntity';
import { HARDWARE_DATABASE } from '../hardwareEngine/hardwareDatabase';

export interface MountedNode {
  entityId: string;
  mountPointId: string; // The parent's mount point
  parentEntityId: string;
  worldTransform: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
  };
}

export interface AggregatePhysicalProperties {
  totalMassKg: number;
  centerOfMass: { x: number; y: number; z: number };
  momentOfInertia: { Ixx: number; Iyy: number; Izz: number };
  mountedEntityCount: number;
}

export class AssemblyGraph {
  public rootEntityId: string;
  public entities: Map<string, HardwareEntity> = new Map();
  public mountMap: Map<string, MountedNode> = new Map(); // entityId -> MountedNode

  private listeners: Set<() => void> = new Set();

  constructor(rootEntityId: string = 'part_frame_geprc_mark4') {
    this.rootEntityId = rootEntityId;
    this.resetToDefaultDrone();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  /**
   * Reset assembly to factory-assembled GEPRC Mark4 5" quadcopter
   */
  public resetToDefaultDrone() {
    this.entities.clear();
    this.mountMap.clear();

    // Clone all entities from database so mutations are isolated
    Object.values(HARDWARE_DATABASE).forEach((proto) => {
      const clone: HardwareEntity = JSON.parse(JSON.stringify(proto));
      this.entities.set(clone.id, clone);
    });

    // Establish mount relationships
    const root = this.entities.get(this.rootEntityId);
    if (!root) return;

    // Motors mounted to frame arm tips
    this.mountEntity('part_motor_emax_2207_1950kv_1', 'mount_motor_1', this.rootEntityId);
    this.mountEntity('part_motor_emax_2207_1950kv_2', 'mount_motor_2', this.rootEntityId);
    this.mountEntity('part_motor_emax_2207_1950kv_3', 'mount_motor_3', this.rootEntityId);
    this.mountEntity('part_motor_emax_2207_1950kv_4', 'mount_motor_4', this.rootEntityId);

    // Propellers mounted to motor shafts
    this.mountEntity('part_prop_hq_5040_cw_1', 'mount_prop_shaft_1', 'part_motor_emax_2207_1950kv_1');
    this.mountEntity('part_prop_hq_5040_ccw_2', 'mount_prop_shaft_2', 'part_motor_emax_2207_1950kv_2');
    this.mountEntity('part_prop_hq_5040_cw_3', 'mount_prop_shaft_3', 'part_motor_emax_2207_1950kv_3');
    this.mountEntity('part_prop_hq_5040_ccw_4', 'mount_prop_shaft_4', 'part_motor_emax_2207_1950kv_4');

    // Electronics stack & accessories mounted to frame
    this.mountEntity('part_esc_speedybee_50a', 'mount_esc_stack', this.rootEntityId);
    this.mountEntity('part_fc_speedybee_f405', 'mount_fc_stack', this.rootEntityId);
    this.mountEntity('part_battery_cnhl_6s_1100', 'mount_battery_pad', this.rootEntityId);
    this.mountEntity('part_camera_caddx_ratel_2', 'mount_fpv_camera', this.rootEntityId);
    this.mountEntity('part_rx_radiomaster_rp1', 'mount_rx_tray', this.rootEntityId);
    this.mountEntity('part_gps_matek_sam_m8q', 'mount_gps_mast', this.rootEntityId);

    this.notify();
  }

  /**
   * Mount an entity to a specific mount point of a parent entity
   */
  public mountEntity(entityId: string, mountPointId: string, parentEntityId: string): boolean {
    const entity = this.entities.get(entityId);
    const parent = this.entities.get(parentEntityId);

    if (!entity || !parent) {
      console.warn(`Cannot mount ${entityId}: entity or parent ${parentEntityId} not found`);
      return false;
    }

    // Locate the mount interface on the parent
    const mount = parent.physical.mountingInterfaces.find((m) => m.id === mountPointId);
    if (!mount) {
      console.warn(`Mount point ${mountPointId} does not exist on parent ${parent.identity.model}`);
      return false;
    }

    // Calculate position
    const parentPos = this.mountMap.get(parentEntityId)?.worldTransform.position || { x: 0, y: 0, z: 0 };
    const worldPos = {
      x: parentPos.x + mount.localPosition.x,
      y: parentPos.y + mount.localPosition.y,
      z: parentPos.z + mount.localPosition.z,
    };

    entity.state.isMounted = true;
    entity.state.mountPointId = mountPointId;
    entity.state.operationalStatus = 'nominal';

    this.mountMap.set(entityId, {
      entityId,
      mountPointId,
      parentEntityId,
      worldTransform: {
        position: worldPos,
        rotation: mount.localRotation || { x: 0, y: 0, z: 0 },
      },
    });

    this.notify();
    return true;
  }

  /**
   * Physically unmount an entity from the assembly.
   * If any child entities are mounted onto this entity (e.g. Propeller on Motor),
   * they are automatically unmounted as well!
   */
  public unmountEntity(entityId: string): boolean {
    if (entityId === this.rootEntityId) {
      console.warn('Cannot unmount root airframe entity');
      return false;
    }

    const entity = this.entities.get(entityId);
    if (!entity || !entity.state.isMounted) return false;

    // Find children mounted onto this entity and recursively unmount them
    const childrenToUnmount: string[] = [];
    this.mountMap.forEach((node, childId) => {
      if (node.parentEntityId === entityId) {
        childrenToUnmount.push(childId);
      }
    });

    childrenToUnmount.forEach((childId) => this.unmountEntity(childId));

    entity.state.isMounted = false;
    entity.state.mountPointId = undefined;
    entity.state.operationalStatus = 'disconnected';
    this.mountMap.delete(entityId);

    this.notify();
    return true;
  }

  /**
   * Check if an entity is mounted
   */
  public isMounted(entityId: string): boolean {
    if (entityId === this.rootEntityId) return true;
    return this.entities.get(entityId)?.state.isMounted ?? false;
  }

  /**
   * Retrieve all mounted entities
   */
  public getMountedEntities(): HardwareEntity[] {
    const mounted: HardwareEntity[] = [];
    const root = this.entities.get(this.rootEntityId);
    if (root) mounted.push(root);

    this.mountMap.forEach((_, entityId) => {
      const ent = this.entities.get(entityId);
      if (ent && ent.state.isMounted) {
        mounted.push(ent);
      }
    });
    return mounted;
  }

  /**
   * Compute dynamic aggregated physical properties based on ONLY currently mounted entities.
   * Calculates dynamic center of mass shift and moment of inertia via Parallel Axis Theorem.
   */
  public computeAggregatePhysicalProperties(): AggregatePhysicalProperties {
    const mounted = this.getMountedEntities();
    let totalMass = 0;
    let weightedX = 0;
    let weightedY = 0;
    let weightedZ = 0;

    mounted.forEach((ent) => {
      const mass = ent.physical.massKg;
      totalMass += mass;
      const node = this.mountMap.get(ent.id);
      const pos = node ? node.worldTransform.position : { x: 0, y: 0, z: 0 };
      const comX = pos.x + ent.physical.centerOfMass.x;
      const comY = pos.y + ent.physical.centerOfMass.y;
      const comZ = pos.z + ent.physical.centerOfMass.z;

      weightedX += mass * comX;
      weightedY += mass * comY;
      weightedZ += mass * comZ;
    });

    if (totalMass <= 0) totalMass = 0.001;
    const centerOfMass = {
      x: weightedX / totalMass,
      y: weightedY / totalMass,
      z: weightedZ / totalMass,
    };

    // Parallel Axis Theorem: I = sum(I_local + m * d^2)
    let Ixx = 0;
    let Iyy = 0;
    let Izz = 0;

    mounted.forEach((ent) => {
      const mass = ent.physical.massKg;
      const node = this.mountMap.get(ent.id);
      const pos = node ? node.worldTransform.position : { x: 0, y: 0, z: 0 };
      const comX = pos.x + ent.physical.centerOfMass.x;
      const comY = pos.y + ent.physical.centerOfMass.y;
      const comZ = pos.z + ent.physical.centerOfMass.z;

      const dx = comX - centerOfMass.x;
      const dy = comY - centerOfMass.y;
      const dz = comZ - centerOfMass.z;

      Ixx += ent.physical.momentOfInertiaKgM2.Ixx + mass * (dy * dy + dz * dz);
      Iyy += ent.physical.momentOfInertiaKgM2.Iyy + mass * (dx * dx + dz * dz);
      Izz += ent.physical.momentOfInertiaKgM2.Izz + mass * (dx * dx + dy * dy);
    });

    return {
      totalMassKg: totalMass,
      centerOfMass,
      momentOfInertia: {
        Ixx: Math.max(0.0005, Ixx),
        Iyy: Math.max(0.0005, Iyy),
        Izz: Math.max(0.0008, Izz),
      },
      mountedEntityCount: mounted.length,
    };
  }

  /**
   * Get all mount points in the entire assembly with their occupancy state
   */
  public getAllMountPoints(): Array<{
    mount: MountInterface;
    parentEntityId: string;
    parentModel: string;
    occupiedBy?: HardwareEntity;
  }> {
    const list: Array<{
      mount: MountInterface;
      parentEntityId: string;
      parentModel: string;
      occupiedBy?: HardwareEntity;
    }> = [];

    this.entities.forEach((entity) => {
      if (entity.id === this.rootEntityId || entity.state.isMounted) {
        entity.physical.mountingInterfaces.forEach((mount) => {
          let occupant: HardwareEntity | undefined;
          this.mountMap.forEach((node, childId) => {
            if (node.mountPointId === mount.id && node.parentEntityId === entity.id) {
              occupant = this.entities.get(childId);
            }
          });
          list.push({
            mount,
            parentEntityId: entity.id,
            parentModel: entity.identity.model,
            occupiedBy: occupant,
          });
        });
      }
    });

    return list;
  }
}

export const assemblyGraph = new AssemblyGraph();
