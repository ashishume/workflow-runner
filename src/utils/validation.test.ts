import { describe, expect, it } from 'vitest'

import { ConditionOperator, NodeType, TransformOperation } from '../types/workflow'
import type { WorkflowEdge, WorkflowNode } from '../types/workflow'
import {
  detectCycles,
  isValidConnection,
  isValidConnectionWithCycleCheck,
  validateImportedWorkflow,
  validateJSON,
  validateWorkflow,
  wouldCreateCycle,
} from './validation'

// Helper to create mock nodes
const createNode = (id: string, type: NodeType, label?: string): WorkflowNode => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data: {
    label: label || type.charAt(0).toUpperCase() + type.slice(1),
    nodeType: type,
    config:
      type === NodeType.START
        ? { payload: {} }
        : type === NodeType.TRANSFORM
          ? { operation: TransformOperation.UPPERCASE, field: 'message', value: '' }
          : type === NodeType.CONDITION
            ? { field: 'value', operator: ConditionOperator.EQUALS, value: '' }
            : { label: 'End' },
  },
})

describe('isValidConnection', () => {
  it('should prevent self-loops', () => {
    const node = createNode('node1', NodeType.TRANSFORM)
    const result = isValidConnection(node, node, [])

    expect(result.valid).toBe(false)
    expect(result.reason).toContain('itself')
  })

  it('should prevent duplicate connections', () => {
    const sourceNode = createNode('node1', NodeType.START)
    const targetNode = createNode('node2', NodeType.END)
    const existingEdges: WorkflowEdge[] = [{ id: 'edge1', source: 'node1', target: 'node2' }]

    const result = isValidConnection(sourceNode, targetNode, existingEdges)

    expect(result.valid).toBe(false)
    expect(result.reason).toContain('already exists')
  })

  it('should prevent End nodes from having outgoing connections', () => {
    const sourceNode = createNode('node1', NodeType.END)
    const targetNode = createNode('node2', NodeType.TRANSFORM)

    const result = isValidConnection(sourceNode, targetNode, [])

    expect(result.valid).toBe(false)
    expect(result.reason).toContain('End nodes cannot have outgoing')
  })

  it('should prevent Start nodes from having incoming connections', () => {
    const sourceNode = createNode('node1', NodeType.TRANSFORM)
    const targetNode = createNode('node2', NodeType.START)

    const result = isValidConnection(sourceNode, targetNode, [])

    expect(result.valid).toBe(false)
    expect(result.reason).toContain('Start nodes cannot have incoming')
  })

  it('should allow valid connections', () => {
    const sourceNode = createNode('node1', NodeType.START)
    const targetNode = createNode('node2', NodeType.TRANSFORM)

    const result = isValidConnection(sourceNode, targetNode, [])

    expect(result.valid).toBe(true)
  })

  it('should allow connecting Transform to End', () => {
    const sourceNode = createNode('node1', NodeType.TRANSFORM)
    const targetNode = createNode('node2', NodeType.END)

    const result = isValidConnection(sourceNode, targetNode, [])

    expect(result.valid).toBe(true)
  })

  it('should allow connecting Condition to Transform', () => {
    const sourceNode = createNode('node1', NodeType.CONDITION)
    const targetNode = createNode('node2', NodeType.TRANSFORM)

    const result = isValidConnection(sourceNode, targetNode, [])

    expect(result.valid).toBe(true)
  })
})

describe('validateWorkflow', () => {
  it('should return error for empty workflow', () => {
    const result = validateWorkflow([], [])

    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Workflow is empty. Add at least a Start and End node.')
  })

  it('should return error when no Start node exists', () => {
    const nodes = [createNode('node1', NodeType.END)]
    const result = validateWorkflow(nodes, [])

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('Start node'))).toBe(true)
  })

  it('should return warning when no End node exists', () => {
    const nodes = [createNode('node1', NodeType.START)]
    const result = validateWorkflow(nodes, [])

    expect(result.valid).toBe(true) // It's a warning, not error
    expect(result.warnings.some((w) => w.includes('End node'))).toBe(true)
  })

  it('should warn about disconnected Start nodes', () => {
    const nodes = [createNode('node1', NodeType.START), createNode('node2', NodeType.END)]
    const result = validateWorkflow(nodes, [])

    expect(result.warnings.some((w) => w.includes('Start node') && w.includes('no outgoing'))).toBe(
      true
    )
  })

  it('should warn about disconnected End nodes', () => {
    const nodes = [createNode('node1', NodeType.START), createNode('node2', NodeType.END)]
    const edges: WorkflowEdge[] = []
    const result = validateWorkflow(nodes, edges)

    expect(result.warnings.some((w) => w.includes('End node') && w.includes('no incoming'))).toBe(
      true
    )
  })

  it('should validate a proper workflow', () => {
    const nodes = [
      createNode('node1', NodeType.START),
      createNode('node2', NodeType.TRANSFORM),
      createNode('node3', NodeType.END),
    ]
    const edges: WorkflowEdge[] = [
      { id: 'edge1', source: 'node1', target: 'node2' },
      { id: 'edge2', source: 'node2', target: 'node3' },
    ]
    const result = validateWorkflow(nodes, edges)

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should warn about Transform nodes without connections', () => {
    const nodes = [
      createNode('node1', NodeType.START),
      createNode('node2', NodeType.TRANSFORM),
      createNode('node3', NodeType.END),
    ]
    const edges: WorkflowEdge[] = [{ id: 'edge1', source: 'node1', target: 'node3' }]
    const result = validateWorkflow(nodes, edges)

    expect(
      result.warnings.some((w) => w.includes('Transform') && w.includes('not connected'))
    ).toBe(true)
  })
})

describe('validateImportedWorkflow', () => {
  it('should reject non-object data', () => {
    const result = validateImportedWorkflow(null)

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('expected an object'))).toBe(true)
  })

  it('should reject missing nodes array', () => {
    const result = validateImportedWorkflow({ edges: [] })

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('"nodes" must be an array'))).toBe(true)
  })

  it('should reject missing edges array', () => {
    const result = validateImportedWorkflow({ nodes: [] })

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('"edges" must be an array'))).toBe(true)
  })

  it('should reject nodes without id', () => {
    const result = validateImportedWorkflow({
      nodes: [
        { type: NodeType.START, position: { x: 0, y: 0 }, data: { nodeType: NodeType.START } },
      ],
      edges: [],
    })

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('missing "id"'))).toBe(true)
  })

  it('should reject nodes with invalid type', () => {
    const result = validateImportedWorkflow({
      nodes: [
        { id: 'node1', type: 'invalid', position: { x: 0, y: 0 }, data: { nodeType: 'invalid' } },
      ],
      edges: [],
    })

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('invalid type'))).toBe(true)
  })

  it('should reject edges referencing non-existent nodes', () => {
    const result = validateImportedWorkflow({
      nodes: [
        {
          id: 'node1',
          type: NodeType.START,
          position: { x: 0, y: 0 },
          data: { nodeType: NodeType.START },
        },
      ],
      edges: [{ id: 'edge1', source: 'node1', target: 'node999' }],
    })

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('non-existent'))).toBe(true)
  })

  it('should accept valid workflow', () => {
    const result = validateImportedWorkflow({
      nodes: [
        {
          id: 'node1',
          type: NodeType.START,
          position: { x: 0, y: 0 },
          data: { nodeType: NodeType.START, label: 'Start', config: {} },
        },
        {
          id: 'node2',
          type: NodeType.END,
          position: { x: 100, y: 0 },
          data: { nodeType: NodeType.END, label: 'End', config: {} },
        },
      ],
      edges: [{ id: 'edge1', source: 'node1', target: 'node2' }],
    })

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})

describe('validateJSON', () => {
  it('should parse valid JSON', () => {
    const result = validateJSON('{"key": "value"}')

    expect(result.valid).toBe(true)
    expect(result.data).toEqual({ key: 'value' })
  })

  it('should reject invalid JSON', () => {
    const result = validateJSON('not valid json')

    expect(result.valid).toBe(false)
    expect(result.error).toContain('Invalid JSON')
  })

  it('should reject empty string', () => {
    const result = validateJSON('')

    expect(result.valid).toBe(false)
  })

  it('should parse arrays', () => {
    const result = validateJSON('[1, 2, 3]')

    expect(result.valid).toBe(true)
    expect(result.data).toEqual([1, 2, 3])
  })

  it('should parse nested objects', () => {
    const result = validateJSON('{"outer": {"inner": "value"}}')

    expect(result.valid).toBe(true)
    expect((result.data as Record<string, unknown>).outer).toEqual({ inner: 'value' })
  })
})

describe('detectCycles', () => {
  it('should detect no cycles in a linear workflow', () => {
    const nodes = [
      createNode('node1', NodeType.START),
      createNode('node2', NodeType.TRANSFORM),
      createNode('node3', NodeType.END),
    ]
    const edges: WorkflowEdge[] = [
      { id: 'edge1', source: 'node1', target: 'node2' },
      { id: 'edge2', source: 'node2', target: 'node3' },
    ]

    const result = detectCycles(nodes, edges)

    expect(result.hasCycle).toBe(false)
    expect(result.cyclePath).toHaveLength(0)
  })

  it('should detect a simple cycle (A -> B -> A)', () => {
    const nodes = [
      createNode('node1', NodeType.TRANSFORM, 'Node A'),
      createNode('node2', NodeType.TRANSFORM, 'Node B'),
    ]
    const edges: WorkflowEdge[] = [
      { id: 'edge1', source: 'node1', target: 'node2' },
      { id: 'edge2', source: 'node2', target: 'node1' },
    ]

    const result = detectCycles(nodes, edges)

    expect(result.hasCycle).toBe(true)
    expect(result.cyclePath.length).toBeGreaterThan(0)
  })

  it('should detect a longer cycle (A -> B -> C -> A)', () => {
    const nodes = [
      createNode('node1', NodeType.START, 'Node A'),
      createNode('node2', NodeType.TRANSFORM, 'Node B'),
      createNode('node3', NodeType.TRANSFORM, 'Node C'),
    ]
    const edges: WorkflowEdge[] = [
      { id: 'edge1', source: 'node1', target: 'node2' },
      { id: 'edge2', source: 'node2', target: 'node3' },
      { id: 'edge3', source: 'node3', target: 'node1' },
    ]

    const result = detectCycles(nodes, edges)

    expect(result.hasCycle).toBe(true)
  })

  it('should detect no cycle with branching paths', () => {
    const nodes = [
      createNode('node1', NodeType.START),
      createNode('node2', NodeType.CONDITION),
      createNode('node3', NodeType.TRANSFORM),
      createNode('node4', NodeType.TRANSFORM),
      createNode('node5', NodeType.END),
    ]
    const edges: WorkflowEdge[] = [
      { id: 'edge1', source: 'node1', target: 'node2' },
      { id: 'edge2', source: 'node2', target: 'node3' },
      { id: 'edge3', source: 'node2', target: 'node4' },
      { id: 'edge4', source: 'node3', target: 'node5' },
      { id: 'edge5', source: 'node4', target: 'node5' },
    ]

    const result = detectCycles(nodes, edges)

    expect(result.hasCycle).toBe(false)
  })

  it('should handle empty workflow', () => {
    const result = detectCycles([], [])

    expect(result.hasCycle).toBe(false)
  })

  it('should handle disconnected nodes', () => {
    const nodes = [createNode('node1', NodeType.START), createNode('node2', NodeType.END)]
    const edges: WorkflowEdge[] = []

    const result = detectCycles(nodes, edges)

    expect(result.hasCycle).toBe(false)
  })
})

describe('wouldCreateCycle', () => {
  it('should return false for a valid new connection', () => {
    const edges: WorkflowEdge[] = [{ id: 'edge1', source: 'node1', target: 'node2' }]

    // Adding node2 -> node3 would not create a cycle
    const result = wouldCreateCycle('node2', 'node3', edges)

    expect(result).toBe(false)
  })

  it('should return true when new edge would create a cycle', () => {
    const edges: WorkflowEdge[] = [
      { id: 'edge1', source: 'node1', target: 'node2' },
      { id: 'edge2', source: 'node2', target: 'node3' },
    ]

    // Adding node3 -> node1 would create a cycle
    const result = wouldCreateCycle('node3', 'node1', edges)

    expect(result).toBe(true)
  })

  it('should return true for direct back-edge', () => {
    const edges: WorkflowEdge[] = [{ id: 'edge1', source: 'node1', target: 'node2' }]

    // Adding node2 -> node1 would create a cycle
    const result = wouldCreateCycle('node2', 'node1', edges)

    expect(result).toBe(true)
  })

  it('should return false for empty edges', () => {
    const result = wouldCreateCycle('node1', 'node2', [])

    expect(result).toBe(false)
  })
})

describe('isValidConnectionWithCycleCheck', () => {
  it('should reject connection that would create a cycle', () => {
    const node1 = createNode('node1', NodeType.TRANSFORM, 'Transform A')
    const node2 = createNode('node2', NodeType.TRANSFORM, 'Transform B')
    const node3 = createNode('node3', NodeType.TRANSFORM, 'Transform C')
    const edges: WorkflowEdge[] = [
      { id: 'edge1', source: 'node1', target: 'node2' },
      { id: 'edge2', source: 'node2', target: 'node3' },
    ]

    // Trying to connect node3 back to node1 would create a cycle
    const result = isValidConnectionWithCycleCheck(node3, node1, edges)

    expect(result.valid).toBe(false)
    expect(result.reason).toContain('infinite loop')
  })

  it('should allow valid connection without cycle', () => {
    const node1 = createNode('node1', NodeType.START)
    const node2 = createNode('node2', NodeType.TRANSFORM)
    const node3 = createNode('node3', NodeType.END)
    const edges: WorkflowEdge[] = [{ id: 'edge1', source: 'node1', target: 'node2' }]

    // Adding node2 -> node3 is valid
    const result = isValidConnectionWithCycleCheck(node2, node3, edges)

    expect(result.valid).toBe(true)
  })

  it('should still reject basic invalid connections', () => {
    const node = createNode('node1', NodeType.TRANSFORM)

    // Self-loop
    const result = isValidConnectionWithCycleCheck(node, node, [])

    expect(result.valid).toBe(false)
    expect(result.reason).toContain('itself')
  })
})

describe('validateWorkflow with cycle detection', () => {
  it('should return error for workflow with cycle', () => {
    const nodes = [
      createNode('node1', NodeType.START, 'Start'),
      createNode('node2', NodeType.TRANSFORM, 'Transform A'),
      createNode('node3', NodeType.TRANSFORM, 'Transform B'),
    ]
    const edges: WorkflowEdge[] = [
      { id: 'edge1', source: 'node1', target: 'node2' },
      { id: 'edge2', source: 'node2', target: 'node3' },
      { id: 'edge3', source: 'node3', target: 'node2' }, // Creates cycle
    ]

    const result = validateWorkflow(nodes, edges)

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('Infinite loop'))).toBe(true)
  })

  it('should pass validation for workflow without cycle', () => {
    const nodes = [
      createNode('node1', NodeType.START, 'Start'),
      createNode('node2', NodeType.TRANSFORM, 'Transform'),
      createNode('node3', NodeType.END, 'End'),
    ]
    const edges: WorkflowEdge[] = [
      { id: 'edge1', source: 'node1', target: 'node2' },
      { id: 'edge2', source: 'node2', target: 'node3' },
    ]

    const result = validateWorkflow(nodes, edges)

    expect(result.valid).toBe(true)
    expect(result.errors.filter((e) => e.includes('Infinite loop'))).toHaveLength(0)
  })
})
