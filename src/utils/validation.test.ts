import { describe, it, expect } from 'vitest'
import {
  isValidConnection,
  validateWorkflow,
  validateImportedWorkflow,
  validateJSON
} from './validation'
import type { WorkflowNode, WorkflowEdge } from '../types/workflow'

// Helper to create mock nodes
const createNode = (id: string, type: 'start' | 'transform' | 'condition' | 'end', label?: string): WorkflowNode => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data: {
    label: label || type.charAt(0).toUpperCase() + type.slice(1),
    nodeType: type,
    config: type === 'start' 
      ? { payload: {} }
      : type === 'transform'
      ? { operation: 'uppercase', field: 'message', value: '' }
      : type === 'condition'
      ? { field: 'value', operator: 'equals', value: '' }
      : { label: 'End' }
  }
})

describe('isValidConnection', () => {
  it('should prevent self-loops', () => {
    const node = createNode('node1', 'transform')
    const result = isValidConnection(node, node, [])
    
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('itself')
  })

  it('should prevent duplicate connections', () => {
    const sourceNode = createNode('node1', 'start')
    const targetNode = createNode('node2', 'end')
    const existingEdges: WorkflowEdge[] = [
      { id: 'edge1', source: 'node1', target: 'node2' }
    ]
    
    const result = isValidConnection(sourceNode, targetNode, existingEdges)
    
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('already exists')
  })

  it('should prevent End nodes from having outgoing connections', () => {
    const sourceNode = createNode('node1', 'end')
    const targetNode = createNode('node2', 'transform')
    
    const result = isValidConnection(sourceNode, targetNode, [])
    
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('End nodes cannot have outgoing')
  })

  it('should prevent Start nodes from having incoming connections', () => {
    const sourceNode = createNode('node1', 'transform')
    const targetNode = createNode('node2', 'start')
    
    const result = isValidConnection(sourceNode, targetNode, [])
    
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('Start nodes cannot have incoming')
  })

  it('should allow valid connections', () => {
    const sourceNode = createNode('node1', 'start')
    const targetNode = createNode('node2', 'transform')
    
    const result = isValidConnection(sourceNode, targetNode, [])
    
    expect(result.valid).toBe(true)
  })

  it('should allow connecting Transform to End', () => {
    const sourceNode = createNode('node1', 'transform')
    const targetNode = createNode('node2', 'end')
    
    const result = isValidConnection(sourceNode, targetNode, [])
    
    expect(result.valid).toBe(true)
  })

  it('should allow connecting Condition to Transform', () => {
    const sourceNode = createNode('node1', 'condition')
    const targetNode = createNode('node2', 'transform')
    
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
    const nodes = [createNode('node1', 'end')]
    const result = validateWorkflow(nodes, [])
    
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('Start node'))).toBe(true)
  })

  it('should return warning when no End node exists', () => {
    const nodes = [createNode('node1', 'start')]
    const result = validateWorkflow(nodes, [])
    
    expect(result.valid).toBe(true) // It's a warning, not error
    expect(result.warnings.some(w => w.includes('End node'))).toBe(true)
  })

  it('should warn about disconnected Start nodes', () => {
    const nodes = [
      createNode('node1', 'start'),
      createNode('node2', 'end')
    ]
    const result = validateWorkflow(nodes, [])
    
    expect(result.warnings.some(w => w.includes('Start node') && w.includes('no outgoing'))).toBe(true)
  })

  it('should warn about disconnected End nodes', () => {
    const nodes = [
      createNode('node1', 'start'),
      createNode('node2', 'end')
    ]
    const edges: WorkflowEdge[] = []
    const result = validateWorkflow(nodes, edges)
    
    expect(result.warnings.some(w => w.includes('End node') && w.includes('no incoming'))).toBe(true)
  })

  it('should validate a proper workflow', () => {
    const nodes = [
      createNode('node1', 'start'),
      createNode('node2', 'transform'),
      createNode('node3', 'end')
    ]
    const edges: WorkflowEdge[] = [
      { id: 'edge1', source: 'node1', target: 'node2' },
      { id: 'edge2', source: 'node2', target: 'node3' }
    ]
    const result = validateWorkflow(nodes, edges)
    
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should warn about Transform nodes without connections', () => {
    const nodes = [
      createNode('node1', 'start'),
      createNode('node2', 'transform'),
      createNode('node3', 'end')
    ]
    const edges: WorkflowEdge[] = [
      { id: 'edge1', source: 'node1', target: 'node3' }
    ]
    const result = validateWorkflow(nodes, edges)
    
    expect(result.warnings.some(w => w.includes('Transform') && w.includes('not connected'))).toBe(true)
  })
})

describe('validateImportedWorkflow', () => {
  it('should reject non-object data', () => {
    const result = validateImportedWorkflow(null)
    
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('expected an object'))).toBe(true)
  })

  it('should reject missing nodes array', () => {
    const result = validateImportedWorkflow({ edges: [] })
    
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('"nodes" must be an array'))).toBe(true)
  })

  it('should reject missing edges array', () => {
    const result = validateImportedWorkflow({ nodes: [] })
    
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('"edges" must be an array'))).toBe(true)
  })

  it('should reject nodes without id', () => {
    const result = validateImportedWorkflow({
      nodes: [{ type: 'start', position: { x: 0, y: 0 }, data: { nodeType: 'start' } }],
      edges: []
    })
    
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('missing "id"'))).toBe(true)
  })

  it('should reject nodes with invalid type', () => {
    const result = validateImportedWorkflow({
      nodes: [{ id: 'node1', type: 'invalid', position: { x: 0, y: 0 }, data: { nodeType: 'invalid' } }],
      edges: []
    })
    
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('invalid type'))).toBe(true)
  })

  it('should reject edges referencing non-existent nodes', () => {
    const result = validateImportedWorkflow({
      nodes: [{ id: 'node1', type: 'start', position: { x: 0, y: 0 }, data: { nodeType: 'start' } }],
      edges: [{ id: 'edge1', source: 'node1', target: 'node999' }]
    })
    
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('non-existent'))).toBe(true)
  })

  it('should accept valid workflow', () => {
    const result = validateImportedWorkflow({
      nodes: [
        { id: 'node1', type: 'start', position: { x: 0, y: 0 }, data: { nodeType: 'start', label: 'Start', config: {} } },
        { id: 'node2', type: 'end', position: { x: 100, y: 0 }, data: { nodeType: 'end', label: 'End', config: {} } }
      ],
      edges: [
        { id: 'edge1', source: 'node1', target: 'node2' }
      ]
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
