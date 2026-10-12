import * as THREE from 'three';
import { VirtualComponent } from '../core/components/VirtualComponent';

export interface BreadboardHoleInfo {
  holeId: string;
  column: number;
  rowLabel: string;
  type: 'terminal' | 'power-plus' | 'power-minus';
  bank?: 'top' | 'bottom';
  localX: number;
  localZ: number;
  worldPos: THREE.Vector3;
}

export interface BreadboardLeadTarget {
  pinId: string;
  holeId: string;
  worldPos: { x: number; y: number; z: number };
  column: number;
  rowLabel: string;
}

export interface BreadboardDropPlacement {
  snappedPosition: { x: number; y: number; z: number };
  targetHoles: BreadboardLeadTarget[];
  label: string;
  column: number;
  breadboardId: string;
}

// Breadboard half-size geometric constants matching componentDefinitions.ts
export const BREADBOARD_COLS = 30;
export const BREADBOARD_PITCH_X = 0.25;
export const BREADBOARD_X_OFFSET = -((BREADBOARD_COLS - 1) * BREADBOARD_PITCH_X) / 2; // -3.625

export const BREADBOARD_ROW_Z: Record<string, number> = {
  // Top Rail
  rail_top_plus: -1.72,
  rail_top_minus: -1.35,
  // Bank A-E (top)
  a: -0.88,
  b: -0.66,
  c: -0.44,
  d: -0.22,
  e: -0.07,
  // Bank F-J (bottom)
  f: 0.07,
  g: 0.22,
  h: 0.44,
  i: 0.66,
  j: 0.88,
  // Bottom Rail
  rail_bot_plus: 1.35,
  rail_bot_minus: 1.72,
};

export const BREADBOARD_SURFACE_Y = 0.43;

/**
 * Checks if a world position (x, z) falls within the breadboard bounding bounds.
 */
export function isPointOverBreadboard(
  breadboard: VirtualComponent,
  worldX: number,
  worldZ: number,
  padding: number = 0.4
): boolean {
  const bx = breadboard.transform.position.x;
  const bz = breadboard.transform.position.z;
  const halfW = 4.2 + padding; // body width ~8.4
  const halfD = 2.2 + padding; // body depth ~4.2

  return Math.abs(worldX - bx) <= halfW && Math.abs(worldZ - bz) <= halfD;
}

/**
 * Finds the nearest breadboard hole given a world position.
 */
export function getClosestBreadboardHole(
  breadboard: VirtualComponent,
  worldX: number,
  worldZ: number
): BreadboardHoleInfo | null {
  const bx = breadboard.transform.position.x;
  const by = breadboard.transform.position.y;
  const bz = breadboard.transform.position.z;

  const localX = worldX - bx;
  const localZ = worldZ - bz;

  // Find closest column (1 to 30)
  const colIndexRaw = Math.round((localX - BREADBOARD_X_OFFSET) / BREADBOARD_PITCH_X);
  const column = Math.max(1, Math.min(BREADBOARD_COLS, colIndexRaw + 1));
  const snappedLocalX = BREADBOARD_X_OFFSET + (column - 1) * BREADBOARD_PITCH_X;

  // Find closest row Z
  let bestRowKey = 'c';
  let minZDist = Infinity;

  Object.entries(BREADBOARD_ROW_Z).forEach(([key, rowZ]) => {
    const dist = Math.abs(localZ - rowZ);
    if (dist < minZDist) {
      minZDist = dist;
      bestRowKey = key;
    }
  });

  const snappedLocalZ = BREADBOARD_ROW_Z[bestRowKey];
  let holeId = '';
  let rowLabel = '';
  let type: BreadboardHoleInfo['type'] = 'terminal';
  let bank: BreadboardHoleInfo['bank'] = undefined;

  if (bestRowKey === 'rail_top_plus') {
    holeId = `rail_top_plus_${column}`;
    rowLabel = `Top Rail + (${column})`;
    type = 'power-plus';
  } else if (bestRowKey === 'rail_top_minus') {
    holeId = `rail_top_minus_${column}`;
    rowLabel = `Top Rail - (${column})`;
    type = 'power-minus';
  } else if (bestRowKey === 'rail_bot_plus') {
    holeId = `rail_bot_plus_${column}`;
    rowLabel = `Bottom Rail + (${column})`;
    type = 'power-plus';
  } else if (bestRowKey === 'rail_bot_minus') {
    holeId = `rail_bot_minus_${column}`;
    rowLabel = `Bottom Rail - (${column})`;
    type = 'power-minus';
  } else {
    holeId = `row_${column}_${bestRowKey}`;
    rowLabel = `Row ${column} Pin ${bestRowKey.toUpperCase()}`;
    type = 'terminal';
    bank = ['a', 'b', 'c', 'd', 'e'].includes(bestRowKey) ? 'top' : 'bottom';
  }

  return {
    holeId,
    column,
    rowLabel,
    type,
    bank,
    localX: snappedLocalX,
    localZ: snappedLocalZ,
    worldPos: new THREE.Vector3(bx + snappedLocalX, by + BREADBOARD_SURFACE_Y, bz + snappedLocalZ),
  };
}

/**
 * Calculates optimal lead placement and component world positioning when dropping
 * an electronics component onto the breadboard.
 */
export function calculateComponentBreadboardPlacement(
  breadboard: VirtualComponent,
  componentType: string,
  worldX: number,
  worldZ: number
): BreadboardDropPlacement | null {
  if (!isPointOverBreadboard(breadboard, worldX, worldZ)) {
    return null;
  }

  const bx = breadboard.transform.position.x;
  const by = breadboard.transform.position.y;
  const bz = breadboard.transform.position.z;

  const localX = worldX - bx;
  const localZ = worldZ - bz;

  // Determine closest column
  const colIndexRaw = Math.round((localX - BREADBOARD_X_OFFSET) / BREADBOARD_PITCH_X);
  const centerCol = Math.max(1, Math.min(BREADBOARD_COLS, colIndexRaw + 1));

  // Determine terminal bank (top A-E vs bottom F-J vs rails)
  const isTopSide = localZ < 0;
  const defaultBankLetter = isTopSide ? 'c' : 'h';

  const targetHoles: BreadboardLeadTarget[] = [];
  let snappedPosX = bx + (BREADBOARD_X_OFFSET + (centerCol - 1) * BREADBOARD_PITCH_X);
  let snappedPosZ = bz + BREADBOARD_ROW_Z[defaultBankLetter];
  let spawnHeightOffset = 0.28;
  let label = '';

  switch (componentType) {
    case 'resistor': {
      // Resistor has lead span of ~1.8 units (about 4 columns: centerCol - 2 to centerCol + 2)
      let c1 = centerCol - 2;
      let c2 = centerCol + 2;
      if (c1 < 1) {
        c1 = 1;
        c2 = 5;
      } else if (c2 > BREADBOARD_COLS) {
        c2 = BREADBOARD_COLS;
        c1 = BREADBOARD_COLS - 4;
      }

      // Check if dropped near the center trough: can span across the center divider instead!
      if (Math.abs(localZ) < 0.35) {
        // Vertical resistor straddling center trough: Pin 1 in Row C (top), Pin 2 in Row H (bottom)
        const hole1Id = `row_${centerCol}_c`;
        const hole2Id = `row_${centerCol}_h`;
        targetHoles.push({
          pinId: 'pin1',
          holeId: hole1Id,
          column: centerCol,
          rowLabel: `Row ${centerCol} (C)`,
          worldPos: {
            x: bx + (BREADBOARD_X_OFFSET + (centerCol - 1) * BREADBOARD_PITCH_X),
            y: by + BREADBOARD_SURFACE_Y,
            z: bz + BREADBOARD_ROW_Z['c'],
          },
        });
        targetHoles.push({
          pinId: 'pin2',
          holeId: hole2Id,
          column: centerCol,
          rowLabel: `Row ${centerCol} (H)`,
          worldPos: {
            x: bx + (BREADBOARD_X_OFFSET + (centerCol - 1) * BREADBOARD_PITCH_X),
            y: by + BREADBOARD_SURFACE_Y,
            z: bz + BREADBOARD_ROW_Z['h'],
          },
        });
        snappedPosZ = bz; // centered in trough
        label = `Plug Resistor: Row ${centerCol} (C to H across divider)`;
      } else {
        // Horizontal resistor along bank
        const bankRow = defaultBankLetter;
        const hole1Id = `row_${c1}_${bankRow}`;
        const hole2Id = `row_${c2}_${bankRow}`;
        targetHoles.push({
          pinId: 'pin1',
          holeId: hole1Id,
          column: c1,
          rowLabel: `Row ${c1} (${bankRow.toUpperCase()})`,
          worldPos: {
            x: bx + (BREADBOARD_X_OFFSET + (c1 - 1) * BREADBOARD_PITCH_X),
            y: by + BREADBOARD_SURFACE_Y,
            z: bz + BREADBOARD_ROW_Z[bankRow],
          },
        });
        targetHoles.push({
          pinId: 'pin2',
          holeId: hole2Id,
          column: c2,
          rowLabel: `Row ${c2} (${bankRow.toUpperCase()})`,
          worldPos: {
            x: bx + (BREADBOARD_X_OFFSET + (c2 - 1) * BREADBOARD_PITCH_X),
            y: by + BREADBOARD_SURFACE_Y,
            z: bz + BREADBOARD_ROW_Z[bankRow],
          },
        });
        snappedPosX = (targetHoles[0].worldPos.x + targetHoles[1].worldPos.x) / 2;
        label = `Plug Resistor: Row ${c1} & Row ${c2} (Bank ${isTopSide ? 'A-E' : 'F-J'})`;
      }
      spawnHeightOffset = 0.32;
      break;
    }

    case 'led':
    case 'led-rgb': {
      // LED leads span 1 column or 2 columns
      let c1 = centerCol;
      let c2 = centerCol + 1;
      if (c2 > BREADBOARD_COLS) {
        c2 = BREADBOARD_COLS;
        c1 = BREADBOARD_COLS - 1;
      }

      const bankRow = defaultBankLetter;
      const hole1Id = `row_${c1}_${bankRow}`;
      const hole2Id = `row_${c2}_${bankRow}`;

      targetHoles.push({
        pinId: 'anode',
        holeId: hole1Id,
        column: c1,
        rowLabel: `Row ${c1} (${bankRow.toUpperCase()})`,
        worldPos: {
          x: bx + (BREADBOARD_X_OFFSET + (c1 - 1) * BREADBOARD_PITCH_X),
          y: by + BREADBOARD_SURFACE_Y,
          z: bz + BREADBOARD_ROW_Z[bankRow],
        },
      });
      targetHoles.push({
        pinId: 'cathode',
        holeId: hole2Id,
        column: c2,
        rowLabel: `Row ${c2} (${bankRow.toUpperCase()})`,
        worldPos: {
          x: bx + (BREADBOARD_X_OFFSET + (c2 - 1) * BREADBOARD_PITCH_X),
          y: by + BREADBOARD_SURFACE_Y,
          z: bz + BREADBOARD_ROW_Z[bankRow],
        },
      });

      snappedPosX = (targetHoles[0].worldPos.x + targetHoles[1].worldPos.x) / 2;
      spawnHeightOffset = 0.35;
      label = `Plug LED: Anode -> Row ${c1} · Cathode -> Row ${c2}`;
      break;
    }

    case 'capacitor':
    case 'capacitor-ceramic': {
      let c1 = centerCol;
      let c2 = centerCol + 1;
      if (c2 > BREADBOARD_COLS) {
        c2 = BREADBOARD_COLS;
        c1 = BREADBOARD_COLS - 1;
      }

      const bankRow = defaultBankLetter;
      const hole1Id = `row_${c1}_${bankRow}`;
      const hole2Id = `row_${c2}_${bankRow}`;

      targetHoles.push({
        pinId: componentType === 'capacitor' ? 'anode' : 'pin1',
        holeId: hole1Id,
        column: c1,
        rowLabel: `Row ${c1} (${bankRow.toUpperCase()})`,
        worldPos: {
          x: bx + (BREADBOARD_X_OFFSET + (c1 - 1) * BREADBOARD_PITCH_X),
          y: by + BREADBOARD_SURFACE_Y,
          z: bz + BREADBOARD_ROW_Z[bankRow],
        },
      });
      targetHoles.push({
        pinId: componentType === 'capacitor' ? 'cathode' : 'pin2',
        holeId: hole2Id,
        column: c2,
        rowLabel: `Row ${c2} (${bankRow.toUpperCase()})`,
        worldPos: {
          x: bx + (BREADBOARD_X_OFFSET + (c2 - 1) * BREADBOARD_PITCH_X),
          y: by + BREADBOARD_SURFACE_Y,
          z: bz + BREADBOARD_ROW_Z[bankRow],
        },
      });

      snappedPosX = (targetHoles[0].worldPos.x + targetHoles[1].worldPos.x) / 2;
      spawnHeightOffset = 0.32;
      label = `Plug Capacitor: Row ${c1} & Row ${c2} (${bankRow.toUpperCase()})`;
      break;
    }

    case 'push-button': {
      // Tactile button straddles the center IC trough
      let c1 = centerCol;
      let c2 = centerCol + 1;
      if (c2 > BREADBOARD_COLS) {
        c2 = BREADBOARD_COLS;
        c1 = BREADBOARD_COLS - 1;
      }

      // Top legs in Row D, bottom legs in Row G
      targetHoles.push({
        pinId: 'pin1',
        holeId: `row_${c1}_d`,
        column: c1,
        rowLabel: `Row ${c1} (D)`,
        worldPos: {
          x: bx + (BREADBOARD_X_OFFSET + (c1 - 1) * BREADBOARD_PITCH_X),
          y: by + BREADBOARD_SURFACE_Y,
          z: bz + BREADBOARD_ROW_Z['d'],
        },
      });
      targetHoles.push({
        pinId: 'pin2',
        holeId: `row_${c2}_d`,
        column: c2,
        rowLabel: `Row ${c2} (D)`,
        worldPos: {
          x: bx + (BREADBOARD_X_OFFSET + (c2 - 1) * BREADBOARD_PITCH_X),
          y: by + BREADBOARD_SURFACE_Y,
          z: bz + BREADBOARD_ROW_Z['d'],
        },
      });
      targetHoles.push({
        pinId: 'pin3',
        holeId: `row_${c1}_g`,
        column: c1,
        rowLabel: `Row ${c1} (G)`,
        worldPos: {
          x: bx + (BREADBOARD_X_OFFSET + (c1 - 1) * BREADBOARD_PITCH_X),
          y: by + BREADBOARD_SURFACE_Y,
          z: bz + BREADBOARD_ROW_Z['g'],
        },
      });
      targetHoles.push({
        pinId: 'pin4',
        holeId: `row_${c2}_g`,
        column: c2,
        rowLabel: `Row ${c2} (G)`,
        worldPos: {
          x: bx + (BREADBOARD_X_OFFSET + (c2 - 1) * BREADBOARD_PITCH_X),
          y: by + BREADBOARD_SURFACE_Y,
          z: bz + BREADBOARD_ROW_Z['g'],
        },
      });

      snappedPosX = (targetHoles[0].worldPos.x + targetHoles[1].worldPos.x) / 2;
      snappedPosZ = bz; // centered on the IC trough
      spawnHeightOffset = 0.35;
      label = `Plug Push Button: Rows ${c1} & ${c2} (Across Center Trough)`;
      break;
    }

    case 'buzzer': {
      let c1 = centerCol - 1;
      let c2 = centerCol + 1;
      if (c1 < 1) {
        c1 = 1;
        c2 = 3;
      } else if (c2 > BREADBOARD_COLS) {
        c2 = BREADBOARD_COLS;
        c1 = BREADBOARD_COLS - 2;
      }
      const bankRow = defaultBankLetter;
      targetHoles.push({
        pinId: 'vcc',
        holeId: `row_${c1}_${bankRow}`,
        column: c1,
        rowLabel: `Row ${c1} (${bankRow.toUpperCase()})`,
        worldPos: {
          x: bx + (BREADBOARD_X_OFFSET + (c1 - 1) * BREADBOARD_PITCH_X),
          y: by + BREADBOARD_SURFACE_Y,
          z: bz + BREADBOARD_ROW_Z[bankRow],
        },
      });
      targetHoles.push({
        pinId: 'gnd',
        holeId: `row_${c2}_${bankRow}`,
        column: c2,
        rowLabel: `Row ${c2} (${bankRow.toUpperCase()})`,
        worldPos: {
          x: bx + (BREADBOARD_X_OFFSET + (c2 - 1) * BREADBOARD_PITCH_X),
          y: by + BREADBOARD_SURFACE_Y,
          z: bz + BREADBOARD_ROW_Z[bankRow],
        },
      });
      snappedPosX = (targetHoles[0].worldPos.x + targetHoles[1].worldPos.x) / 2;
      spawnHeightOffset = 0.45;
      label = `Plug Buzzer: Row ${c1} (+) & Row ${c2} (-)`;
      break;
    }

    default: {
      // General single-point or module snap
      const closest = getClosestBreadboardHole(breadboard, worldX, worldZ);
      if (closest) {
        targetHoles.push({
          pinId: 'vcc',
          holeId: closest.holeId,
          column: closest.column,
          rowLabel: closest.rowLabel,
          worldPos: {
            x: closest.worldPos.x,
            y: closest.worldPos.y,
            z: closest.worldPos.z,
          },
        });
        snappedPosX = closest.worldPos.x;
        snappedPosZ = closest.worldPos.z;
        label = `Align with Breadboard: ${closest.rowLabel}`;
      }
      spawnHeightOffset = 0.35;
      break;
    }
  }

  return {
    snappedPosition: {
      x: Number(snappedPosX.toFixed(3)),
      y: Number((by + spawnHeightOffset).toFixed(3)),
      z: Number(snappedPosZ.toFixed(3)),
    },
    targetHoles,
    label,
    column: centerCol,
    breadboardId: breadboard.id,
  };
}
