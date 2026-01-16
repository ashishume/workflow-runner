// Node types
export type NodeType = 'start' | 'transform' | 'condition' | 'end'

// Transform operations
export type TransformOperation = 
  | 'uppercase' 
  | 'lowercase' 
  | 'append' 
  | 'prepend' 
  | 'multiply' 
  | 'add' 
  | 'replace'

// Condition operators
export type ConditionOperator = 
  | 'equals' 
  | 'notEquals' 
  | 'contains' 
  | 'greaterThan' 
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'isEven'
  | 'isOdd'
  | 'isDivisibleBy'

// Start Node Configuration
export interface StartNodeConfig {
  payload: Record<string, unknown>
}

// Transform Node Configuration
export interface TransformNodeConfig {
  operation: TransformOperation
  field: string
  value?: string | number
}

// Condition Node Configuration
export interface ConditionNodeConfig {
  field: string
  operator: ConditionOperator
  value: string | number | boolean
}

// End Node Configuration
export interface EndNodeConfig {
  label: string
}

// Union type for all node configurations
export type NodeConfig = StartNodeConfig | TransformNodeConfig | ConditionNodeConfig | EndNodeConfig

// Workflow Node
export interface WorkflowNode {
  id: string
  type: NodeType
  position: { x: number; y: number }
  data: {
    label: string
    config: NodeConfig
    nodeType: NodeType
  }
}

// Workflow Edge
export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  label?: string
  animated?: boolean
}

// Execution Log Entry
export interface ExecutionLogEntry {
  nodeId: string
  nodeName: string
  nodeType: NodeType
  input: Record<string, unknown>
  output: Record<string, unknown>
  timestamp: number
  status: 'success' | 'error' | 'skipped'
  message?: string
}

// Workflow State for Export/Import
export interface WorkflowState {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  viewport?: {
    x: number
    y: number
    zoom: number
  }
}

// History State for Undo/Redo
export interface HistoryState {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}
