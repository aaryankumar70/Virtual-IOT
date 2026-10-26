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
export const BREADBOARD_PITCH_X = 0.25; // Standard 2.54mm (0.1") pitch in 3D scene units
export const SCENE_GRID_STEP = BREADBOARD_PITCH_X; // Global 3D scene grid step aligned to breadboard pitch
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

export const BREADBOARD_TERMINAL_ROWS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'] as const;

export const BREADBOARD_SURFACE_Y = 0.43;

/**
 * Snaps any scalar coordinate to the 2.54mm (0.25 unit) laboratory grid pitch.
 */
export function snapToSceneGrid(value: number, step: number = SCENE_GRID_STEP): number {
  return Number((Math.round(value / step) * step).toFixed(3));
}

/**
 * Helper to compute the exact world X of a breadboard column (1..30).
 */
export function getBreadboardColumnWorldX(breadboard: VirtualComponent, column: number): number {
  const clampedCol = Math.max(1, Math.min(BREADBOARD_COLS, column));
  return Number(
    (breadboard.transform.position.x + BREADBOARD_X_OFFSET + (clampedCol - 1) * BREADBOARD_PITCH_X).toFixed(3)
  );
}

/**
 * Helper to compute the exact world Z of a breadboard row ('a'..'j' or rail).
 */
export function getBreadboardRowWorldZ(breadboard: VirtualComponent, rowKey: string): number {
  const zOff = BREADBOARD_ROW_Z[rowKey] ?? 0;
  return Number((breadboard.transform.position.z + zOff).toFixed(3));
}

/**
 * Checks if a world position (x, z) falls within the breadboard bounding bounds.
 */
export function isPointOverBreadboard(
  breadboard: VirtualComponent,
  worldX: number,
  worldZ: number,
  padding: number = 0.45
): boolean {
  const bx = breadboard.transform.position.x;
  const bz = breadboard.transform.position.z;
  const halfW = 4.2 + padding; // body width ~8.4
  const halfD = 2.1 + padding; // body depth ~4.2

  return Math.abs(worldX - bx) <= halfW && Math.abs(worldZ - bz) <= halfD;
}

/**
 * Finds the nearest breadboard terminal row ('a'..'j') for a given localZ coordinate.
 */
export function getClosestTerminalRowLetter(localZ: number): string {
  let bestRow = localZ < 0 ? 'c' : 'h';
  let minDist = Infinity;

  for (const letter of BREADBOARD_TERMINAL_ROWS) {
    const rowZ = BREADBOARD_ROW_Z[letter];
    const dist = Math.abs(localZ - rowZ);
    if (dist < minDist) {
      minDist = dist;
      bestRow = letter;
    }
  }
  return bestRow;
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
 * Searches all breadboards in the scene and computes the exact hole-snapped placement
 * if the given world coordinates fall over a breadboard.
 */
export function findBreadboardPlacementForComponent(
  components: VirtualComponent[],
  componentType: string,
  worldX: number,
  worldZ: number,
  excludeComponentId?: string
): BreadboardDropPlacement | null {
  if (componentType === 'breadboard') return null;

  const breadboards = components.filter(
    (c) => c.type === 'breadboard' && c.id !== excludeComponentId
  );

  for (const breadboard of breadboards) {
    const placement = calculateComponentBreadboardPlacement(
      breadboard,
      componentType,
      worldX,
      worldZ
    );
    if (placement) {
      return placement;
    }
  }

  return null;
}

/**
 * Calculates optimal lead placement and component world positioning when dropping
 * or moving an electronics component onto a breadboard.
 * Every pin's localPosition + snappedPosition matches targetHoles[i].worldPos with 0.000mm precision.
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

  // Determine closest column (1..30)
  const colIndexRaw = Math.round((localX - BREADBOARD_X_OFFSET) / BREADBOARD_PITCH_X);
  const centerCol = Math.max(1, Math.min(BREADBOARD_COLS, colIndexRaw + 1));

  // Determine closest terminal row letter ('a'..'e' on top bank, 'f'..'j' on bottom bank)
  const bankRow = getClosestTerminalRowLetter(localZ);
  const isTopSide = ['a', 'b', 'c', 'd', 'e'].includes(bankRow);

  const targetHoles: BreadboardLeadTarget[] = [];
  let snappedPosX = getBreadboardColumnWorldX(breadboard, centerCol);
  let snappedPosZ = getBreadboardRowWorldZ(breadboard, bankRow);
  let spawnHeightOffset = 0.32;
  let label = '';

  const makeHoleTarget = (pinId: string, col: number, rowLetter: string, customSuffix?: string): BreadboardLeadTarget => {
    const holeId = `row_${col}_${rowLetter}`;
    return {
      pinId,
      holeId,
      column: col,
      rowLabel: `Row ${col}${rowLetter.toUpperCase()}${customSuffix ? ` (${customSuffix})` : ''}`,
      worldPos: {
        x: getBreadboardColumnWorldX(breadboard, col),
        y: Number((by + BREADBOARD_SURFACE_Y).toFixed(3)),
        z: getBreadboardRowWorldZ(breadboard, rowLetter),
      },
    };
  };

  switch (componentType) {
    case 'resistor': {
      // Resistor has exact 4-column lead span: pin1 at x = -0.50, pin2 at x = +0.50 (4 * 0.25 = 1.00 unit)
      let c1 = centerCol - 2;
      let c2 = centerCol + 2;
      if (c1 < 1) {
        c1 = 1;
        c2 = 5;
      } else if (c2 > BREADBOARD_COLS) {
        c2 = BREADBOARD_COLS;
        c1 = BREADBOARD_COLS - 4;
      }

      const t1 = makeHoleTarget('pin1', c1, bankRow, 'Lead 1');
      const t2 = makeHoleTarget('pin2', c2, bankRow, 'Lead 2');
      targetHoles.push(t1, t2);

      snappedPosX = (t1.worldPos.x + t2.worldPos.x) / 2;
      snappedPosZ = t1.worldPos.z;
      spawnHeightOffset = 0.32; // pin.y = 0.11 -> 0.32 + 0.11 = 0.43 = BREADBOARD_SURFACE_Y
      label = `Snap Resistor: Hole ${c1}${bankRow.toUpperCase()} & Hole ${c2}${bankRow.toUpperCase()} (Bank ${isTopSide ? 'A-E' : 'F-J'})`;
      break;
    }

    case 'led': {
      // LED has exact 1-column lead span: anode at x = -0.125, cathode at x = +0.125 (1 * 0.25 = 0.25 units)
      let c1 = centerCol;
      let c2 = centerCol + 1;
      if (c2 > BREADBOARD_COLS) {
        c2 = BREADBOARD_COLS;
        c1 = BREADBOARD_COLS - 1;
      }

      const t1 = makeHoleTarget('anode', c1, bankRow, 'Anode +');
      const t2 = makeHoleTarget('cathode', c2, bankRow, 'Cathode -');
      targetHoles.push(t1, t2);

      snappedPosX = (t1.worldPos.x + t2.worldPos.x) / 2;
      snappedPosZ = t1.worldPos.z;
      spawnHeightOffset = 0.35; // pin.y = 0.08 -> 0.35 + 0.08 = 0.43 = BREADBOARD_SURFACE_Y
      label = `Snap LED: Anode -> ${c1}${bankRow.toUpperCase()} · Cathode -> ${c2}${bankRow.toUpperCase()}`;
      break;
    }

    case 'led-rgb': {
      // RGB LED has 4 leads spaced at 0.25: red (-0.375), cathode (-0.125), green (+0.125), blue (+0.375)
      let c1 = centerCol - 1;
      if (c1 < 1) c1 = 1;
      if (c1 + 3 > BREADBOARD_COLS) c1 = BREADBOARD_COLS - 3;
      const c2 = c1 + 1;
      const c3 = c1 + 2;
      const c4 = c1 + 3;

      const t1 = makeHoleTarget('red', c1, bankRow, 'R');
      const t2 = makeHoleTarget('cathode', c2, bankRow, 'GND');
      const t3 = makeHoleTarget('green', c3, bankRow, 'G');
      const t4 = makeHoleTarget('blue', c4, bankRow, 'B');
      targetHoles.push(t1, t2, t3, t4);

      snappedPosX = (t1.worldPos.x + t4.worldPos.x) / 2;
      snappedPosZ = t1.worldPos.z;
      spawnHeightOffset = 0.35; // pin.y = 0.08 -> 0.35 + 0.08 = 0.43
      label = `Snap RGB LED: Holes ${c1}${bankRow.toUpperCase()}–${c4}${bankRow.toUpperCase()}`;
      break;
    }

    case 'capacitor': {
      // Electrolytic capacitor has 1-column lead span: anode at x = -0.125, cathode at x = +0.125
      let c1 = centerCol;
      let c2 = centerCol + 1;
      if (c2 > BREADBOARD_COLS) {
        c2 = BREADBOARD_COLS;
        c1 = BREADBOARD_COLS - 1;
      }

      const t1 = makeHoleTarget('anode', c1, bankRow, '+');
      const t2 = makeHoleTarget('cathode', c2, bankRow, '-');
      targetHoles.push(t1, t2);

      snappedPosX = (t1.worldPos.x + t2.worldPos.x) / 2;
      snappedPosZ = t1.worldPos.z;
      spawnHeightOffset = 0.32; // pin.y = 0.11 -> 0.32 + 0.11 = 0.43
      label = `Snap Capacitor: ${c1}${bankRow.toUpperCase()} (+) & ${c2}${bankRow.toUpperCase()} (-)`;
      break;
    }

    case 'capacitor-ceramic': {
      // Ceramic capacitor has 2-column lead span: pin1 at x = -0.25, pin2 at x = +0.25 (2 * 0.25 = 0.50 units)
      let c1 = centerCol - 1;
      let c2 = centerCol + 1;
      if (c1 < 1) {
        c1 = 1;
        c2 = 3;
      } else if (c2 > BREADBOARD_COLS) {
        c2 = BREADBOARD_COLS;
        c1 = BREADBOARD_COLS - 2;
      }

      const t1 = makeHoleTarget('pin1', c1, bankRow, 'Lead 1');
      const t2 = makeHoleTarget('pin2', c2, bankRow, 'Lead 2');
      targetHoles.push(t1, t2);

      snappedPosX = (t1.worldPos.x + t2.worldPos.x) / 2;
      snappedPosZ = t1.worldPos.z;
      spawnHeightOffset = 0.32; // pin.y = 0.11 -> 0.32 + 0.11 = 0.43
      label = `Snap Ceramic Cap: Holes ${c1}${bankRow.toUpperCase()} & ${c2}${bankRow.toUpperCase()}`;
      break;
    }

    case 'push-button': {
      // Tactile button straddles center IC trough (Row D z = -0.22 & Row G z = +0.22) with 2-column X span (x = ±0.25)
      let c1 = centerCol - 1;
      let c2 = centerCol + 1;
      if (c1 < 1) {
        c1 = 1;
        c2 = 3;
      } else if (c2 > BREADBOARD_COLS) {
        c2 = BREADBOARD_COLS;
        c1 = BREADBOARD_COLS - 2;
      }

      const t1a = makeHoleTarget('1a', c1, 'd', '1A');
      const t1b = makeHoleTarget('1b', c2, 'd', '1B');
      const t2a = makeHoleTarget('2a', c1, 'g', '2A');
      const t2b = makeHoleTarget('2b', c2, 'g', '2B');
      targetHoles.push(t1a, t1b, t2a, t2b);

      snappedPosX = (t1a.worldPos.x + t1b.worldPos.x) / 2;
      snappedPosZ = bz; // centered on IC trough
      spawnHeightOffset = 0.35; // pin.y = 0.08 -> 0.35 + 0.08 = 0.43
      label = `Snap Push Button: Holes ${c1}D/${c2}D & ${c1}G/${c2}G (Across Center Trough)`;
      break;
    }

    case 'buzzer': {
      // Buzzer has 2-column lead span: pos at x = -0.25, neg at x = +0.25
      let c1 = centerCol - 1;
      let c2 = centerCol + 1;
      if (c1 < 1) {
        c1 = 1;
        c2 = 3;
      } else if (c2 > BREADBOARD_COLS) {
        c2 = BREADBOARD_COLS;
        c1 = BREADBOARD_COLS - 2;
      }

      const tPos = makeHoleTarget('pos', c1, bankRow, '+');
      const tNeg = makeHoleTarget('neg', c2, bankRow, '-');
      targetHoles.push(tPos, tNeg);

      snappedPosX = (tPos.worldPos.x + tNeg.worldPos.x) / 2;
      snappedPosZ = tPos.worldPos.z;
      spawnHeightOffset = 0.35; // pin.y = 0.08 -> 0.35 + 0.08 = 0.43
      label = `Snap Buzzer: ${c1}${bankRow.toUpperCase()} (+) & ${c2}${bankRow.toUpperCase()} (-)`;
      break;
    }

    case 'temperature-sensor':
    case 'servo-motor': {
      // 3-pin components at 0.25 pitch: x = -0.25, 0.0, +0.25
      let c1 = centerCol - 1;
      let c2 = centerCol;
      let c3 = centerCol + 1;
      if (c1 < 1) {
        c1 = 1;
        c2 = 2;
        c3 = 3;
      } else if (c3 > BREADBOARD_COLS) {
        c3 = BREADBOARD_COLS;
        c2 = BREADBOARD_COLS - 1;
        c1 = BREADBOARD_COLS - 2;
      }

      const pinIds = componentType === 'temperature-sensor' ? ['vcc', 'vout', 'gnd'] : ['gnd', 'vcc', 'sig'];
      const t1 = makeHoleTarget(pinIds[0], c1, bankRow);
      const t2 = makeHoleTarget(pinIds[1], c2, bankRow);
      const t3 = makeHoleTarget(pinIds[2], c3, bankRow);
      targetHoles.push(t1, t2, t3);

      snappedPosX = t2.worldPos.x;
      snappedPosZ = t2.worldPos.z;
      spawnHeightOffset = 0.32; // pin.y = 0.11 -> 0.32 + 0.11 = 0.43
      label = `Snap ${componentType === 'temperature-sensor' ? 'TMP36 Sensor' : 'Servo Header'}: Holes ${c1}${bankRow.toUpperCase()}–${c3}${bankRow.toUpperCase()}`;
      break;
    }

    case 'ultrasonic-sensor':
    case 'dht11-sensor': {
      // 4-pin sensors at 0.25 pitch: x = -0.375, -0.125, 0.125, 0.375
      let c1 = centerCol - 1;
      if (c1 < 1) c1 = 1;
      if (c1 + 3 > BREADBOARD_COLS) c1 = BREADBOARD_COLS - 3;
      const c2 = c1 + 1;
      const c3 = c1 + 2;
      const c4 = c1 + 3;

      const pinIds =
        componentType === 'ultrasonic-sensor'
          ? ['vcc', 'trig', 'echo', 'gnd']
          : ['vcc', 'data', 'nc', 'gnd'];

      const t1 = makeHoleTarget(pinIds[0], c1, bankRow);
      const t2 = makeHoleTarget(pinIds[1], c2, bankRow);
      const t3 = makeHoleTarget(pinIds[2], c3, bankRow);
      const t4 = makeHoleTarget(pinIds[3], c4, bankRow);
      targetHoles.push(t1, t2, t3, t4);

      snappedPosX = (t1.worldPos.x + t4.worldPos.x) / 2;
      snappedPosZ = t1.worldPos.z;
      spawnHeightOffset = componentType === 'ultrasonic-sensor' ? 0.35 : 0.32;
      label = `Snap ${componentType === 'ultrasonic-sensor' ? 'HC-SR04' : 'DHT11'}: Holes ${c1}${bankRow.toUpperCase()}–${c4}${bankRow.toUpperCase()}`;
      break;
    }

    case 'arduino-nano': {
      // Arduino Nano straddles center trough: 15 pins in Row B (z = -0.66) and 15 pins in Row I (z = +0.66)
      let startCol = centerCol - 7;
      if (startCol < 1) startCol = 1;
      if (startCol + 14 > BREADBOARD_COLS) startCol = BREADBOARD_COLS - 14;

      const topNames = ['d1', 'd0', 'rst1', 'gnd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'd10', 'd11', 'd12'];
      const botNames = ['d13', '3v3', 'ref', 'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', '5v', 'rst2', 'gnd2', 'vin'];

      topNames.forEach((pinId, idx) => {
        targetHoles.push(makeHoleTarget(pinId, startCol + idx, 'b', pinId.toUpperCase()));
      });
      botNames.forEach((pinId, idx) => {
        targetHoles.push(makeHoleTarget(pinId, startCol + idx, 'i', pinId.toUpperCase()));
      });

      const midCol = startCol + 7; // i=7 corresponds to localX = 0
      snappedPosX = getBreadboardColumnWorldX(breadboard, midCol);
      snappedPosZ = bz;
      spawnHeightOffset = 0.35; // pin.y = 0.08 -> 0.35 + 0.08 = 0.43
      label = `Snap Arduino Nano: Columns ${startCol}–${startCol + 14} (Rows B & I)`;
      break;
    }

    case 'gate-and':
    case 'gate-or':
    case 'gate-xor':
    case 'gate-not':
    case 'gate-nand':
    case 'gate-nor':
    case 'gate-xnor': {
      const isOneInput = componentType === 'gate-not';
      let c1 = centerCol - 1;
      let c2 = centerCol;
      let c3 = centerCol + 1;
      if (c1 < 1) {
        c1 = 1;
        c2 = 2;
        c3 = 3;
      } else if (c3 > BREADBOARD_COLS) {
        c3 = BREADBOARD_COLS;
        c2 = BREADBOARD_COLS - 1;
        c1 = BREADBOARD_COLS - 2;
      }

      // Input A in Col c1, Row D (localX = -0.25, localZ = -0.22)
      targetHoles.push(makeHoleTarget('pin_in_a', c1, 'd', 'Input A'));

      if (!isOneInput) {
        // Input B in Col c2, Row D (localX = 0.0, localZ = -0.22)
        targetHoles.push(makeHoleTarget('pin_in_b', c2, 'd', 'Input B'));
      }

      // VCC in Col c3, Row D (localX = +0.25, localZ = -0.22)
      targetHoles.push(makeHoleTarget('pin_vcc', c3, 'd', 'VCC 5V'));

      // Output Y in Col c1, Row G (localX = -0.25, localZ = +0.22)
      targetHoles.push(makeHoleTarget('pin_out_y', c1, 'g', 'Output Y'));

      // GND in Col c3, Row G (localX = +0.25, localZ = +0.22)
      targetHoles.push(makeHoleTarget('pin_gnd', c3, 'g', 'GND 0V'));

      snappedPosX = getBreadboardColumnWorldX(breadboard, c2);
      snappedPosZ = bz; // centered over trough
      spawnHeightOffset = 0.49; // pin.y = -0.06 -> 0.49 - 0.06 = 0.43 = BREADBOARD_SURFACE_Y
      const gateNames: Record<string, string> = {
        'gate-and': 'AND Gate (74HC08)',
        'gate-or': 'OR Gate (74HC32)',
        'gate-xor': 'XOR Gate (74HC86)',
        'gate-not': 'NOT Gate (74HC04)',
        'gate-nand': 'NAND Gate (74HC00)',
        'gate-nor': 'NOR Gate (74HC02)',
        'gate-xnor': 'XNOR Gate (74HC266)',
      };
      label = `Snap ${gateNames[componentType] || 'Logic Gate'}: Holes ${c1}D–${c3}D & ${c1}G–${c3}G`;
      break;
    }

    default: {
      // General single-point or module snap to nearest breadboard hole
      const closest = getClosestBreadboardHole(breadboard, worldX, worldZ);
      if (closest) {
        targetHoles.push({
          pinId: 'vcc',
          holeId: closest.holeId,
          column: closest.column,
          rowLabel: closest.rowLabel,
          worldPos: {
            x: Number(closest.worldPos.x.toFixed(3)),
            y: Number(closest.worldPos.y.toFixed(3)),
            z: Number(closest.worldPos.z.toFixed(3)),
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
