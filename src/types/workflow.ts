// Node types
export const NodeType = {
  START: "start",
  TRANSFORM: "transform",
  CONDITION: "condition",
  END: "end",
} as const;
export type NodeType = (typeof NodeType)[keyof typeof NodeType];

// Transform operations
export const TransformOperation = {
  UPPERCASE: "uppercase",
  LOWERCASE: "lowercase",
  APPEND: "append",
  PREPEND: "prepend",
  MULTIPLY: "multiply",
  ADD: "add",
  REPLACE: "replace",
} as const;
export type TransformOperation =
  (typeof TransformOperation)[keyof typeof TransformOperation];

// Condition operators
export const ConditionOperator = {
  EQUALS: "equals",
  NOT_EQUALS: "notEquals",
  CONTAINS: "contains",
  GREATER_THAN: "greaterThan",
  LESS_THAN: "lessThan",
  GREATER_THAN_OR_EQUAL: "greaterThanOrEqual",
  LESS_THAN_OR_EQUAL: "lessThanOrEqual",
  IS_EMPTY: "isEmpty",
  IS_NOT_EMPTY: "isNotEmpty",
  IS_EVEN: "isEven",
  IS_ODD: "isOdd",
  IS_DIVISIBLE_BY: "isDivisibleBy",
} as const;
export type ConditionOperator =
  (typeof ConditionOperator)[keyof typeof ConditionOperator];

// Start Node Configuration
export interface StartNodeConfig {
  payload: Record<string, unknown>;
}

// Transform Node Configuration
export interface TransformNodeConfig {
  operation: TransformOperation;
  field: string;
  value?: string | number;
}

// Condition Node Configuration
export interface ConditionNodeConfig {
  field: string;
  operator: ConditionOperator;
  value: string | number | boolean;
}

// End Node Configuration
export interface EndNodeConfig {
  label: string;
}

// Union type for all node configurations
export type NodeConfig =
  | StartNodeConfig
  | TransformNodeConfig
  | ConditionNodeConfig
  | EndNodeConfig;

// Workflow Node
export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: {
    label: string;
    config: NodeConfig;
    nodeType: NodeType;
  };
}

// Workflow Edge
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  animated?: boolean;
}

// Execution Log Entry
export interface ExecutionLogEntry {
  nodeId: string;
  nodeName: string;
  nodeType: NodeType;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  timestamp: number;
  status: "success" | "error" | "skipped";
  message?: string;
}

// Workflow State for Export/Import
export interface WorkflowState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

// History State for Undo/Redo
export interface HistoryState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}
