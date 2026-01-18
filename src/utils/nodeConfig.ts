import { NodeType } from '../types/workflow'

export interface NodeColorConfig {
  primary: string
  background: string
  border: string
}

export interface NodeTypeConfig {
  type: NodeType
  label: string
  description: string
  icon: string
  colors: NodeColorConfig
}

// Centralized node color configuration
export const NODE_COLORS: Record<NodeType, NodeColorConfig> = {
  [NodeType.START]: {
    primary: '#4ade80',
    background: 'rgba(74, 222, 128, 0.2)',
    border: '#2d8a4e',
  },
  [NodeType.TRANSFORM]: {
    primary: '#a78bfa',
    background: 'rgba(167, 139, 250, 0.2)',
    border: '#7c3aed',
  },
  [NodeType.CONDITION]: {
    primary: '#fbbf24',
    background: 'rgba(251, 191, 36, 0.2)',
    border: '#d97706',
  },
  [NodeType.END]: {
    primary: '#f87171',
    background: 'rgba(248, 113, 113, 0.2)',
    border: '#dc2626',
  },
}

// Node type configurations for palette
export const NODE_TYPE_CONFIGS: NodeTypeConfig[] = [
  {
    type: NodeType.START,
    label: 'Start',
    description: 'Begin workflow with payload',
    icon: 'play',
    colors: NODE_COLORS[NodeType.START],
  },
  {
    type: NodeType.TRANSFORM,
    label: 'Transform',
    description: 'Modify data fields',
    icon: 'transform',
    colors: NODE_COLORS[NodeType.TRANSFORM],
  },
  {
    type: NodeType.CONDITION,
    label: 'If-Else',
    description: 'Conditional branching',
    icon: 'branch',
    colors: NODE_COLORS[NodeType.CONDITION],
  },
  {
    type: NodeType.END,
    label: 'End',
    description: 'Terminate workflow',
    icon: 'stop',
    colors: NODE_COLORS[NodeType.END],
  },
]

// Helper function to get node color by type
export function getNodeColor(nodeType: NodeType | string): string {
  const type = nodeType as NodeType
  return NODE_COLORS[type]?.primary ?? '#94a3b8'
}

// Helper function to get node label by type
export function getNodeLabel(type: NodeType): string {
  const config = NODE_TYPE_CONFIGS.find((c) => c.type === type)
  return config?.label ?? 'Node'
}
