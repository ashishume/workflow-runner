import { createPinia, setActivePinia } from 'pinia'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ConditionOperator, NodeType, TransformOperation } from '../types/workflow'
import { useWorkflowStore } from './workflow'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

describe('Workflow Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Node Management', () => {
    it('should add a start node with default config', () => {
      const store = useWorkflowStore()
      const nodeId = store.addNode(NodeType.START, { x: 100, y: 100 })

      expect(store.nodes).toHaveLength(1)
      expect(store.nodes[0]!.id).toBe(nodeId)
      expect(store.nodes[0]!.type).toBe(NodeType.START)
      expect(store.nodes[0]!.data.nodeType).toBe(NodeType.START)
      expect(store.nodes[0]!.data.config).toHaveProperty('payload')
    })

    it('should add a transform node with default config', () => {
      const store = useWorkflowStore()
      store.addNode(NodeType.TRANSFORM, { x: 200, y: 100 })

      expect(store.nodes).toHaveLength(1)
      expect(store.nodes[0]!.data.nodeType).toBe(NodeType.TRANSFORM)
      expect(store.nodes[0]!.data.config).toHaveProperty('operation')
      expect(store.nodes[0]!.data.config).toHaveProperty('field')
    })

    it('should add a condition node with default config', () => {
      const store = useWorkflowStore()
      store.addNode(NodeType.CONDITION, { x: 300, y: 100 })

      expect(store.nodes).toHaveLength(1)
      expect(store.nodes[0]!.data.nodeType).toBe(NodeType.CONDITION)
      expect(store.nodes[0]!.data.config).toHaveProperty('field')
      expect(store.nodes[0]!.data.config).toHaveProperty('operator')
      expect(store.nodes[0]!.data.config).toHaveProperty('value')
    })

    it('should add an end node with default config', () => {
      const store = useWorkflowStore()
      store.addNode(NodeType.END, { x: 400, y: 100 })

      expect(store.nodes).toHaveLength(1)
      expect(store.nodes[0]!.data.nodeType).toBe(NodeType.END)
      expect(store.nodes[0]!.data.config).toHaveProperty('label')
    })

    it('should remove a node and its connected edges', () => {
      const store = useWorkflowStore()
      const node1Id = store.addNode(NodeType.START, { x: 100, y: 100 })
      const node2Id = store.addNode(NodeType.END, { x: 300, y: 100 })
      store.addEdge(node1Id, node2Id)

      expect(store.nodes).toHaveLength(2)
      expect(store.edges).toHaveLength(1)

      store.removeNode(node1Id)

      expect(store.nodes).toHaveLength(1)
      expect(store.edges).toHaveLength(0)
    })

    it('should update node position', () => {
      const store = useWorkflowStore()
      const nodeId = store.addNode(NodeType.START, { x: 100, y: 100 })

      store.updateNodePosition(nodeId, { x: 200, y: 200 })

      expect(store.nodes[0]!.position).toEqual({ x: 200, y: 200 })
    })

    it('should update node config', () => {
      const store = useWorkflowStore()
      const nodeId = store.addNode(NodeType.START, { x: 100, y: 100 })

      store.updateNodeConfig(nodeId, { payload: { test: 'value' } })

      expect(store.nodes[0]!.data.config).toEqual({
        payload: { test: 'value' },
      })
    })

    it('should update node label', () => {
      const store = useWorkflowStore()
      const nodeId = store.addNode(NodeType.START, { x: 100, y: 100 })

      store.updateNodeLabel(nodeId, 'Custom Start')

      expect(store.nodes[0]!.data.label).toBe('Custom Start')
    })
  })

  describe('Edge Management', () => {
    it('should add an edge between nodes', () => {
      const store = useWorkflowStore()
      const node1Id = store.addNode(NodeType.START, { x: 100, y: 100 })
      const node2Id = store.addNode(NodeType.END, { x: 300, y: 100 })

      store.addEdge(node1Id, node2Id)

      expect(store.edges).toHaveLength(1)
      expect(store.edges[0]!.source).toBe(node1Id)
      expect(store.edges[0]!.target).toBe(node2Id)
    })

    it('should prevent duplicate edges', () => {
      const store = useWorkflowStore()
      const node1Id = store.addNode(NodeType.START, { x: 100, y: 100 })
      const node2Id = store.addNode(NodeType.END, { x: 300, y: 100 })

      store.addEdge(node1Id, node2Id)
      store.addEdge(node1Id, node2Id) // Duplicate

      expect(store.edges).toHaveLength(1)
    })

    it('should prevent self-loops', () => {
      const store = useWorkflowStore()
      const nodeId = store.addNode(NodeType.TRANSFORM, { x: 100, y: 100 })

      store.addEdge(nodeId, nodeId)

      expect(store.edges).toHaveLength(0)
    })

    it('should remove an edge', () => {
      const store = useWorkflowStore()
      const node1Id = store.addNode(NodeType.START, { x: 100, y: 100 })
      const node2Id = store.addNode(NodeType.END, { x: 300, y: 100 })
      store.addEdge(node1Id, node2Id)

      store.removeEdge(`edge_${node1Id}_${node2Id}`)

      expect(store.edges).toHaveLength(0)
    })
  })

  describe('Node Selection', () => {
    it('should select a node', () => {
      const store = useWorkflowStore()
      const nodeId = store.addNode(NodeType.START, { x: 100, y: 100 })

      store.selectNode(nodeId)

      expect(store.selectedNodeId).toBe(nodeId)
      expect(store.selectedNode?.id).toBe(nodeId)
      expect(store.selectedNodeIds.has(nodeId)).toBe(true)
      expect(store.selectedNodeIds.size).toBe(1)
    })

    it('should deselect when selecting null', () => {
      const store = useWorkflowStore()
      const nodeId = store.addNode(NodeType.START, { x: 100, y: 100 })
      store.selectNode(nodeId)

      store.selectNode(null)

      expect(store.selectedNodeId).toBeNull()
      expect(store.selectedNode).toBeNull()
      expect(store.selectedNodeIds.size).toBe(0)
    })

    it('should clear selection when node is deleted', () => {
      const store = useWorkflowStore()
      const nodeId = store.addNode(NodeType.START, { x: 100, y: 100 })
      store.selectNode(nodeId)

      store.removeNode(nodeId)

      expect(store.selectedNodeId).toBeNull()
      expect(store.selectedNodeIds.has(nodeId)).toBe(false)
      expect(store.selectedNodeIds.size).toBe(0)
    })

    it('should select multiple nodes', () => {
      const store = useWorkflowStore()
      const node1Id = store.addNode(NodeType.START, { x: 100, y: 100 })
      const node2Id = store.addNode(NodeType.TRANSFORM, { x: 200, y: 100 })
      const node3Id = store.addNode(NodeType.END, { x: 300, y: 100 })

      store.selectNodes([node1Id, node2Id, node3Id])

      expect(store.selectedNodeIds.size).toBe(3)
      expect(store.selectedNodeIds.has(node1Id)).toBe(true)
      expect(store.selectedNodeIds.has(node2Id)).toBe(true)
      expect(store.selectedNodeIds.has(node3Id)).toBe(true)
      expect(store.selectedNodeId).toBeNull() // Multiple selection clears selectedNodeId
    })

    it('should select all nodes', () => {
      const store = useWorkflowStore()
      const node1Id = store.addNode(NodeType.START, { x: 100, y: 100 })
      const node2Id = store.addNode(NodeType.TRANSFORM, { x: 200, y: 100 })
      const node3Id = store.addNode(NodeType.END, { x: 300, y: 100 })

      store.selectAllNodes()

      expect(store.selectedNodeIds.size).toBe(3)
      expect(store.selectedNodeIds.has(node1Id)).toBe(true)
      expect(store.selectedNodeIds.has(node2Id)).toBe(true)
      expect(store.selectedNodeIds.has(node3Id)).toBe(true)
      expect(store.selectedNodeId).toBeNull()
    })

    it('should select all nodes when only one node exists', () => {
      const store = useWorkflowStore()
      const nodeId = store.addNode(NodeType.START, { x: 100, y: 100 })

      store.selectAllNodes()

      expect(store.selectedNodeIds.size).toBe(1)
      expect(store.selectedNodeIds.has(nodeId)).toBe(true)
      expect(store.selectedNodeId).toBeNull()
    })

    it('should handle selectAllNodes when no nodes exist', () => {
      const store = useWorkflowStore()

      store.selectAllNodes()

      expect(store.selectedNodeIds.size).toBe(0)
      expect(store.selectedNodeId).toBeNull()
    })

    it('should toggle node selection', () => {
      const store = useWorkflowStore()
      const node1Id = store.addNode(NodeType.START, { x: 100, y: 100 })
      const node2Id = store.addNode(NodeType.TRANSFORM, { x: 200, y: 100 })

      // Initially select node1
      store.selectNode(node1Id)
      expect(store.selectedNodeIds.size).toBe(1)
      expect(store.selectedNodeId).toBe(node1Id)

      // Toggle node2 (add to selection)
      store.toggleNodeSelection(node2Id)
      expect(store.selectedNodeIds.size).toBe(2)
      expect(store.selectedNodeIds.has(node1Id)).toBe(true)
      expect(store.selectedNodeIds.has(node2Id)).toBe(true)
      expect(store.selectedNodeId).toBeNull() // Multiple selection clears selectedNodeId

      // Toggle node1 (remove from selection)
      store.toggleNodeSelection(node1Id)
      expect(store.selectedNodeIds.size).toBe(1)
      expect(store.selectedNodeIds.has(node1Id)).toBe(false)
      expect(store.selectedNodeIds.has(node2Id)).toBe(true)
      expect(store.selectedNodeId).toBe(node2Id) // Single selection sets selectedNodeId
    })

    it('should remove multiple nodes at once', () => {
      const store = useWorkflowStore()
      const node1Id = store.addNode(NodeType.START, { x: 100, y: 100 })
      const node2Id = store.addNode(NodeType.TRANSFORM, { x: 200, y: 100 })
      const node3Id = store.addNode(NodeType.END, { x: 300, y: 100 })
      store.addEdge(node1Id, node2Id)
      store.addEdge(node2Id, node3Id)

      expect(store.nodes).toHaveLength(3)
      expect(store.edges).toHaveLength(2)

      store.removeNodes([node1Id, node3Id])

      expect(store.nodes).toHaveLength(1)
      expect(store.nodes[0]!.id).toBe(node2Id)
      expect(store.edges).toHaveLength(0) // All edges should be removed
    })

    it('should clear selectedNodeIds when removing multiple nodes', () => {
      const store = useWorkflowStore()
      const node1Id = store.addNode(NodeType.START, { x: 100, y: 100 })
      const node2Id = store.addNode(NodeType.TRANSFORM, { x: 200, y: 100 })
      const node3Id = store.addNode(NodeType.END, { x: 300, y: 100 })

      store.selectNodes([node1Id, node2Id, node3Id])
      expect(store.selectedNodeIds.size).toBe(3)

      store.removeNodes([node1Id, node2Id])

      // node3 should still be selected since it wasn't removed
      expect(store.selectedNodeIds.size).toBe(1)
      expect(store.selectedNodeIds.has(node1Id)).toBe(false)
      expect(store.selectedNodeIds.has(node2Id)).toBe(false)
      expect(store.selectedNodeIds.has(node3Id)).toBe(true)
      expect(store.selectedNodeId).toBe(node3Id) // Single selection should set selectedNodeId
    })

    it('should update selectedNodeId when removing the selected node from multiple selection', () => {
      const store = useWorkflowStore()
      const node1Id = store.addNode(NodeType.START, { x: 100, y: 100 })
      const node2Id = store.addNode(NodeType.TRANSFORM, { x: 200, y: 100 })

      // Select node1 as single selection
      store.selectNode(node1Id)
      expect(store.selectedNodeId).toBe(node1Id)

      // Add node2 to selection (multi-select)
      store.toggleNodeSelection(node2Id)
      expect(store.selectedNodeId).toBeNull() // Multi-select clears selectedNodeId

      // Remove node2 (which was in selection)
      store.removeNode(node2Id)

      expect(store.selectedNodeIds.size).toBe(1)
      expect(store.selectedNodeIds.has(node1Id)).toBe(true)
      expect(store.selectedNodeId).toBeNull() // Still null because it was multi-select
    })
  })

  describe('Undo/Redo', () => {
    it('should undo node addition', () => {
      const store = useWorkflowStore()
      store.addNode(NodeType.START, { x: 100, y: 100 })

      expect(store.nodes).toHaveLength(1)
      expect(store.canUndo).toBe(true)

      store.undo()

      expect(store.nodes).toHaveLength(0)
    })

    it('should redo node addition', () => {
      const store = useWorkflowStore()
      store.addNode(NodeType.START, { x: 100, y: 100 })
      store.undo()

      expect(store.nodes).toHaveLength(0)
      expect(store.canRedo).toBe(true)

      store.redo()

      expect(store.nodes).toHaveLength(1)
    })

    it('should not undo when no history', () => {
      const store = useWorkflowStore()

      expect(store.canUndo).toBe(false)
      store.undo() // Should not throw

      expect(store.nodes).toHaveLength(0)
    })

    it('should not redo when at latest state', () => {
      const store = useWorkflowStore()
      store.addNode(NodeType.START, { x: 100, y: 100 })

      expect(store.canRedo).toBe(false)
      store.redo() // Should not throw

      expect(store.nodes).toHaveLength(1)
    })
  })

  describe('Export/Import', () => {
    it('should export workflow state', () => {
      const store = useWorkflowStore()
      store.addNode(NodeType.START, { x: 100, y: 100 })
      store.addNode(NodeType.END, { x: 300, y: 100 })

      const exported = store.exportWorkflow()

      expect(exported.nodes).toHaveLength(2)
      expect(exported.edges).toHaveLength(0)
      expect(exported).toHaveProperty('viewport')
    })

    it('should import workflow state', () => {
      const store = useWorkflowStore()
      const workflowState = {
        nodes: [
          {
            id: 'node_1',
            type: NodeType.START,
            position: { x: 100, y: 100 },
            data: {
              label: 'Start',
              config: { payload: { message: 'test' } },
              nodeType: NodeType.START,
            },
          },
        ],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      }

      store.importWorkflow(workflowState)

      expect(store.nodes).toHaveLength(1)
      expect(store.nodes[0]!.id).toBe('node_1')
      expect(store.selectedNodeId).toBeNull()
      expect(store.selectedNodeIds.size).toBe(0)
    })
  })

  describe('Clear Workflow', () => {
    it('should clear all nodes and edges', () => {
      const store = useWorkflowStore()
      const node1Id = store.addNode(NodeType.START, { x: 100, y: 100 })
      const node2Id = store.addNode(NodeType.END, { x: 300, y: 100 })
      store.addEdge(node1Id, node2Id)
      store.selectNodes([node1Id, node2Id])

      store.clearWorkflow()

      expect(store.nodes).toHaveLength(0)
      expect(store.edges).toHaveLength(0)
      expect(store.executionLogs).toHaveLength(0)
      expect(store.selectedNodeId).toBeNull()
      expect(store.selectedNodeIds.size).toBe(0)
    })
  })
})

describe('Workflow Execution', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('should show error when no start node exists', async () => {
    const store = useWorkflowStore()
    store.addNode(NodeType.END, { x: 100, y: 100 })

    await store.executeWorkflow()

    // There may be warnings + errors, check that at least one is the start node error
    expect(store.executionLogs.length).toBeGreaterThan(0)
    expect(
      store.executionLogs.some(
        (log) => log.status === 'error' && log.message?.includes('Start node')
      )
    ).toBe(true)
  })

  it('should execute a simple workflow', async () => {
    const store = useWorkflowStore()
    const startId = store.addNode(NodeType.START, { x: 100, y: 100 })
    const endId = store.addNode(NodeType.END, { x: 300, y: 100 })
    store.addEdge(startId, endId)

    await store.executeWorkflow()

    expect(store.executionLogs.length).toBeGreaterThan(0)
    expect(store.executionLogs.some((log) => log.nodeType === NodeType.START)).toBe(true)
    expect(store.executionLogs.some((log) => log.nodeType === NodeType.END)).toBe(true)
  })

  it('should apply uppercase transform', async () => {
    const store = useWorkflowStore()
    const startId = store.addNode(NodeType.START, { x: 100, y: 100 })
    store.updateNodeConfig(startId, { payload: { message: 'hello' } })

    const transformId = store.addNode(NodeType.TRANSFORM, { x: 200, y: 100 })
    store.updateNodeConfig(transformId, {
      operation: TransformOperation.UPPERCASE,
      field: 'message',
      value: '',
    })

    const endId = store.addNode(NodeType.END, { x: 300, y: 100 })

    store.addEdge(startId, transformId)
    store.addEdge(transformId, endId)

    await store.executeWorkflow()

    const transformLog = store.executionLogs.find((log) => log.nodeType === NodeType.TRANSFORM)
    expect(transformLog?.output.message).toBe('HELLO')
  })

  it('should apply lowercase transform', async () => {
    const store = useWorkflowStore()
    const startId = store.addNode(NodeType.START, { x: 100, y: 100 })
    store.updateNodeConfig(startId, { payload: { message: 'HELLO' } })

    const transformId = store.addNode(NodeType.TRANSFORM, { x: 200, y: 100 })
    store.updateNodeConfig(transformId, {
      operation: TransformOperation.LOWERCASE,
      field: 'message',
      value: '',
    })

    const endId = store.addNode(NodeType.END, { x: 300, y: 100 })

    store.addEdge(startId, transformId)
    store.addEdge(transformId, endId)

    await store.executeWorkflow()

    const transformLog = store.executionLogs.find((log) => log.nodeType === NodeType.TRANSFORM)
    expect(transformLog?.output.message).toBe('hello')
  })

  it('should apply append transform', async () => {
    const store = useWorkflowStore()
    const startId = store.addNode(NodeType.START, { x: 100, y: 100 })
    store.updateNodeConfig(startId, { payload: { message: 'hello' } })

    const transformId = store.addNode(NodeType.TRANSFORM, { x: 200, y: 100 })
    store.updateNodeConfig(transformId, {
      operation: TransformOperation.APPEND,
      field: 'message',
      value: ' world',
    })

    const endId = store.addNode(NodeType.END, { x: 300, y: 100 })

    store.addEdge(startId, transformId)
    store.addEdge(transformId, endId)

    await store.executeWorkflow()

    const transformLog = store.executionLogs.find((log) => log.nodeType === NodeType.TRANSFORM)
    expect(transformLog?.output.message).toBe('hello world')
  })

  it('should apply multiply transform', async () => {
    const store = useWorkflowStore()
    const startId = store.addNode(NodeType.START, { x: 100, y: 100 })
    store.updateNodeConfig(startId, { payload: { value: 5 } })

    const transformId = store.addNode(NodeType.TRANSFORM, { x: 200, y: 100 })
    store.updateNodeConfig(transformId, {
      operation: TransformOperation.MULTIPLY,
      field: 'value',
      value: 3,
    })

    const endId = store.addNode(NodeType.END, { x: 300, y: 100 })

    store.addEdge(startId, transformId)
    store.addEdge(transformId, endId)

    await store.executeWorkflow()

    const transformLog = store.executionLogs.find((log) => log.nodeType === NodeType.TRANSFORM)
    expect(transformLog?.output.value).toBe(15)
  })

  it('should apply add transform', async () => {
    const store = useWorkflowStore()
    const startId = store.addNode(NodeType.START, { x: 100, y: 100 })
    store.updateNodeConfig(startId, { payload: { value: 10 } })

    const transformId = store.addNode(NodeType.TRANSFORM, { x: 200, y: 100 })
    store.updateNodeConfig(transformId, {
      operation: TransformOperation.ADD,
      field: 'value',
      value: 5,
    })

    const endId = store.addNode(NodeType.END, { x: 300, y: 100 })

    store.addEdge(startId, transformId)
    store.addEdge(transformId, endId)

    await store.executeWorkflow()

    const transformLog = store.executionLogs.find((log) => log.nodeType === NodeType.TRANSFORM)
    expect(transformLog?.output.value).toBe(15)
  })

  it('should follow true branch in condition node', async () => {
    const store = useWorkflowStore()
    const startId = store.addNode(NodeType.START, { x: 100, y: 100 })
    store.updateNodeConfig(startId, { payload: { value: 50 } })

    const conditionId = store.addNode(NodeType.CONDITION, { x: 200, y: 100 })
    store.updateNodeConfig(conditionId, {
      field: 'value',
      operator: ConditionOperator.GREATER_THAN,
      value: '25',
    })

    const trueEndId = store.addNode(NodeType.END, { x: 350, y: 50 })
    store.updateNodeLabel(trueEndId, 'True End')

    const falseEndId = store.addNode(NodeType.END, { x: 350, y: 150 })
    store.updateNodeLabel(falseEndId, 'False End')

    store.addEdge(startId, conditionId)
    store.addEdge(conditionId, trueEndId, 'true')
    store.addEdge(conditionId, falseEndId, 'false')

    await store.executeWorkflow()

    const conditionLog = store.executionLogs.find((log) => log.nodeType === NodeType.CONDITION)
    expect(conditionLog?.output._conditionMet).toBe(true)

    // Should have executed True End
    expect(store.executionLogs.some((log) => log.nodeName === 'True End')).toBe(true)
  })

  it('should follow false branch in condition node', async () => {
    const store = useWorkflowStore()
    const startId = store.addNode(NodeType.START, { x: 100, y: 100 })
    store.updateNodeConfig(startId, { payload: { value: 10 } })

    const conditionId = store.addNode(NodeType.CONDITION, { x: 200, y: 100 })
    store.updateNodeConfig(conditionId, {
      field: 'value',
      operator: ConditionOperator.GREATER_THAN,
      value: '25',
    })

    const trueEndId = store.addNode(NodeType.END, { x: 350, y: 50 })
    store.updateNodeLabel(trueEndId, 'True End')

    const falseEndId = store.addNode(NodeType.END, { x: 350, y: 150 })
    store.updateNodeLabel(falseEndId, 'False End')

    store.addEdge(startId, conditionId)
    store.addEdge(conditionId, trueEndId, 'true')
    store.addEdge(conditionId, falseEndId, 'false')

    await store.executeWorkflow()

    const conditionLog = store.executionLogs.find((log) => log.nodeType === NodeType.CONDITION)
    expect(conditionLog?.output._conditionMet).toBe(false)

    // Should have executed False End
    expect(store.executionLogs.some((log) => log.nodeName === 'False End')).toBe(true)
  })

  it('should detect cycles and prevent infinite loops at connection time', async () => {
    const store = useWorkflowStore()
    const startId = store.addNode(NodeType.START, { x: 100, y: 100 })
    const transformId = store.addNode(NodeType.TRANSFORM, { x: 200, y: 100 })

    store.addEdge(startId, transformId)
    // Note: connecting transform back to start should fail due to validation
    // (Start nodes cannot have incoming connections)
    // So we test with transform nodes creating a cycle
    const transform2Id = store.addNode(NodeType.TRANSFORM, { x: 300, y: 100 })
    store.addEdge(transformId, transform2Id)

    // Attempting to create a cycle should be rejected at connection time
    const result = store.addEdge(transform2Id, transformId)

    // The edge creation should fail with an error about infinite loops
    expect(result.success).toBe(false)
    expect(result.error).toContain('infinite loop')

    // The edge should not have been added
    expect(store.edges.some((e) => e.source === transform2Id && e.target === transformId)).toBe(
      false
    )
  })

  it('should handle equals condition operator', async () => {
    const store = useWorkflowStore()
    const startId = store.addNode(NodeType.START, { x: 100, y: 100 })
    store.updateNodeConfig(startId, { payload: { status: 'active' } })

    const conditionId = store.addNode(NodeType.CONDITION, { x: 200, y: 100 })
    store.updateNodeConfig(conditionId, {
      field: 'status',
      operator: ConditionOperator.EQUALS,
      value: 'active',
    })

    const endId = store.addNode(NodeType.END, { x: 300, y: 100 })
    store.addEdge(startId, conditionId)
    store.addEdge(conditionId, endId, 'true')

    await store.executeWorkflow()

    const conditionLog = store.executionLogs.find((log) => log.nodeType === NodeType.CONDITION)
    expect(conditionLog?.output._conditionMet).toBe(true)
  })

  it('should handle notEquals condition operator', async () => {
    const store = useWorkflowStore()
    const startId = store.addNode(NodeType.START, { x: 100, y: 100 })
    store.updateNodeConfig(startId, { payload: { status: 'inactive' } })

    const conditionId = store.addNode(NodeType.CONDITION, { x: 200, y: 100 })
    store.updateNodeConfig(conditionId, {
      field: 'status',
      operator: ConditionOperator.NOT_EQUALS,
      value: 'active',
    })

    const endId = store.addNode(NodeType.END, { x: 300, y: 100 })
    store.addEdge(startId, conditionId)
    store.addEdge(conditionId, endId, 'true')

    await store.executeWorkflow()

    const conditionLog = store.executionLogs.find((log) => log.nodeType === NodeType.CONDITION)
    expect(conditionLog?.output._conditionMet).toBe(true)
  })

  it('should handle contains condition operator', async () => {
    const store = useWorkflowStore()
    const startId = store.addNode(NodeType.START, { x: 100, y: 100 })
    store.updateNodeConfig(startId, { payload: { message: 'hello world' } })

    const conditionId = store.addNode(NodeType.CONDITION, { x: 200, y: 100 })
    store.updateNodeConfig(conditionId, {
      field: 'message',
      operator: ConditionOperator.CONTAINS,
      value: 'world',
    })

    const endId = store.addNode(NodeType.END, { x: 300, y: 100 })
    store.addEdge(startId, conditionId)
    store.addEdge(conditionId, endId, 'true')

    await store.executeWorkflow()

    const conditionLog = store.executionLogs.find((log) => log.nodeType === NodeType.CONDITION)
    expect(conditionLog?.output._conditionMet).toBe(true)
  })

  it('should handle isEmpty condition operator', async () => {
    const store = useWorkflowStore()
    const startId = store.addNode(NodeType.START, { x: 100, y: 100 })
    store.updateNodeConfig(startId, { payload: { message: '' } })

    const conditionId = store.addNode(NodeType.CONDITION, { x: 200, y: 100 })
    store.updateNodeConfig(conditionId, {
      field: 'message',
      operator: ConditionOperator.IS_EMPTY,
      value: '',
    })

    const endId = store.addNode(NodeType.END, { x: 300, y: 100 })
    store.addEdge(startId, conditionId)
    store.addEdge(conditionId, endId, 'true')

    await store.executeWorkflow()

    const conditionLog = store.executionLogs.find((log) => log.nodeType === NodeType.CONDITION)
    expect(conditionLog?.output._conditionMet).toBe(true)
  })

  it('should handle isNotEmpty condition operator', async () => {
    const store = useWorkflowStore()
    const startId = store.addNode(NodeType.START, { x: 100, y: 100 })
    store.updateNodeConfig(startId, { payload: { message: 'hello' } })

    const conditionId = store.addNode(NodeType.CONDITION, { x: 200, y: 100 })
    store.updateNodeConfig(conditionId, {
      field: 'message',
      operator: ConditionOperator.IS_NOT_EMPTY,
      value: '',
    })

    const endId = store.addNode(NodeType.END, { x: 300, y: 100 })
    store.addEdge(startId, conditionId)
    store.addEdge(conditionId, endId, 'true')

    await store.executeWorkflow()

    const conditionLog = store.executionLogs.find((log) => log.nodeType === NodeType.CONDITION)
    expect(conditionLog?.output._conditionMet).toBe(true)
  })
})

describe('Validation Functions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should clear execution logs', () => {
    const store = useWorkflowStore()
    // Add some fake log
    store.executionLogs.push({
      nodeId: 'test',
      nodeName: 'Test',
      nodeType: NodeType.START,
      input: {},
      output: {},
      timestamp: Date.now(),
      status: 'success',
    })

    store.clearExecutionLogs()

    expect(store.executionLogs).toHaveLength(0)
  })
})
