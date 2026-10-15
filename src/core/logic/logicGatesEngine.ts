export type LogicGateType =
  | 'gate-and'
  | 'gate-or'
  | 'gate-xor'
  | 'gate-not'
  | 'gate-nand'
  | 'gate-nor'
  | 'gate-xnor';

export interface GateTruthTableRow {
  a: number;
  b?: number;
  y: number;
}

export interface GateInfo {
  type: LogicGateType;
  name: string;
  chipModel: string;
  symbolName: string;
  booleanEquation: string;
  description: string;
  inputsCount: 1 | 2;
  truthTable: GateTruthTableRow[];
}

export const LOGIC_GATES_INFO: Record<LogicGateType, GateInfo> = {
  'gate-and': {
    type: 'gate-and',
    name: 'AND Gate',
    chipModel: '74HC08',
    symbolName: 'AND',
    booleanEquation: 'Y = A · B',
    description: 'Output is HIGH (1) only when BOTH inputs A and B are HIGH.',
    inputsCount: 2,
    truthTable: [
      { a: 0, b: 0, y: 0 },
      { a: 0, b: 1, y: 0 },
      { a: 1, b: 0, y: 0 },
      { a: 1, b: 1, y: 1 },
    ],
  },
  'gate-or': {
    type: 'gate-or',
    name: 'OR Gate',
    chipModel: '74HC32',
    symbolName: 'OR',
    booleanEquation: 'Y = A + B',
    description: 'Output is HIGH (1) if EITHER input A or input B (or both) is HIGH.',
    inputsCount: 2,
    truthTable: [
      { a: 0, b: 0, y: 0 },
      { a: 0, b: 1, y: 1 },
      { a: 1, b: 0, y: 1 },
      { a: 1, b: 1, y: 1 },
    ],
  },
  'gate-xor': {
    type: 'gate-xor',
    name: 'XOR Gate',
    chipModel: '74HC86',
    symbolName: 'XOR',
    booleanEquation: 'Y = A ⊕ B',
    description: 'Exclusive OR: Output is HIGH (1) if inputs DIFFER (one is HIGH, one is LOW).',
    inputsCount: 2,
    truthTable: [
      { a: 0, b: 0, y: 0 },
      { a: 0, b: 1, y: 1 },
      { a: 1, b: 0, y: 1 },
      { a: 1, b: 1, y: 0 },
    ],
  },
  'gate-not': {
    type: 'gate-not',
    name: 'NOT Gate (Inverter)',
    chipModel: '74HC04',
    symbolName: 'NOT',
    booleanEquation: 'Y = ¬A',
    description: 'Inverts input: Output is HIGH (1) when input A is LOW (0), and vice versa.',
    inputsCount: 1,
    truthTable: [
      { a: 0, y: 1 },
      { a: 1, y: 0 },
    ],
  },
  'gate-nand': {
    type: 'gate-nand',
    name: 'NAND Gate',
    chipModel: '74HC00',
    symbolName: 'NAND',
    booleanEquation: 'Y = ¬(A · B)',
    description: 'Universal gate: Output is LOW (0) only when BOTH inputs A and B are HIGH.',
    inputsCount: 2,
    truthTable: [
      { a: 0, b: 0, y: 1 },
      { a: 0, b: 1, y: 1 },
      { a: 1, b: 0, y: 1 },
      { a: 1, b: 1, y: 0 },
    ],
  },
  'gate-nor': {
    type: 'gate-nor',
    name: 'NOR Gate',
    chipModel: '74HC02',
    symbolName: 'NOR',
    booleanEquation: 'Y = ¬(A + B)',
    description: 'Universal gate: Output is HIGH (1) only when BOTH inputs A and B are LOW (0).',
    inputsCount: 2,
    truthTable: [
      { a: 0, b: 0, y: 1 },
      { a: 0, b: 1, y: 0 },
      { a: 1, b: 0, y: 0 },
      { a: 1, b: 1, y: 0 },
    ],
  },
  'gate-xnor': {
    type: 'gate-xnor',
    name: 'XNOR Gate',
    chipModel: '74HC266',
    symbolName: 'XNOR',
    booleanEquation: 'Y = ¬(A ⊕ B)',
    description: 'Equivalence gate: Output is HIGH (1) if inputs are EQUAL (both 0 or both 1).',
    inputsCount: 2,
    truthTable: [
      { a: 0, b: 0, y: 1 },
      { a: 0, b: 1, y: 0 },
      { a: 1, b: 0, y: 0 },
      { a: 1, b: 1, y: 1 },
    ],
  },
};

/**
 * Computes output boolean state given gate type, input A, and input B.
 */
export function evaluateGateOutput(
  gateType: LogicGateType | string,
  inputA: boolean,
  inputB: boolean = false
): boolean {
  switch (gateType) {
    case 'gate-and':
      return inputA && inputB;
    case 'gate-or':
      return inputA || inputB;
    case 'gate-xor':
      return inputA !== inputB;
    case 'gate-not':
      return !inputA;
    case 'gate-nand':
      return !(inputA && inputB);
    case 'gate-nor':
      return !(inputA || inputB);
    case 'gate-xnor':
      return inputA === inputB;
    default:
      return false;
  }
}
