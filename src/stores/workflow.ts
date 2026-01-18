import { computed, ref, toRaw, watch } from 'vue'

import { defineStore } from 'pinia'

import { useTheme } from '../composables/useTheme'
import { useWorkflowExecution } from '../composables/useWorkflowExecution'
import { useWorkflowHistory } from '../composables/useWorkflowHistory'
import { useWorkflowPersistence } from '../composables/useWorkflowPersistence'
import { ConditionOperator, NodeType, TransformOperation } from '../types/workflow'
import type {
  ConditionNodeConfig,
  EndNodeConfig,
  NodeConfig,
  StartNodeConfig,
  TransformNodeConfig,
  WorkflowEdge,
  WorkflowNode,
  WorkflowState,
} from '../types/workflow'
import { getNodeLabel } from '../utils/nodeConfig'
import {
  isValidConnectionWithCycleCheck,
  validateImportedWorkflow,
  validateWorkflow,
} from '../utils/validation'

// Default configurations for each node type
const getDefaultConfig = (type: NodeType): NodeConfig => {
  switch (type) {
    case NodeType.START:
      return { payload: { message: 'Hello World' } } as StartNodeConfig
    case NodeType.TRANSFORM:
      return {
        operation: TransformOperation.UPPERCASE,
        field: 'message',
        value: '',
      } as TransformNodeConfig
    case NodeType.CONDITION:
      return {
        field: 'message',
        operator: ConditionOperator.EQUALS,
        value: '',
      } as ConditionNodeConfig
    case NodeType.END:
      return { label: 'End' } as EndNodeConfig
    default:
      return { payload: {} } as StartNodeConfig
  }
}

export const useWorkflowStore = defineStore('workflow', () => {
  // Initialize composables
  const history = useWorkflowHistory({ maxHistorySize: 50 })
  const persistence = useWorkflowPersistence({ debounceMs: 500 })
  const execution = useWorkflowExecution({ executionDelay: 500, maxLogEntries: 100 })
  const theme = useTheme()

  // State
  const nodes = ref<WorkflowNode[]>([])
  const edges = ref<WorkflowEdge[]>([])
  const selectedNodeId = ref<string | null>(null) // Keep for backward compatibility
  const selectedNodeIds = ref<Set<string>>(new Set())
  const viewport = ref({ x: 0, y: 0, zoom: 1 })

  // Computed
  const selectedNode = computed(
    () => nodes.value.find((n) => n.id === selectedNodeId.value) || null
  )

  // Generate unique ID
  const generateId = () => `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Save to history helper
  const saveToHistory = () => {
    history.saveToHistory(nodes.value, edges.value)
  }

  // Add node
  const addNode = (type: NodeType, position: { x: number; y: number }) => {
    const id = generateId()
    const newNode: WorkflowNode = {
      id,
      type,
      position,
      data: {
        label: getNodeLabel(type),
        config: getDefaultConfig(type),
        nodeType: type,
      },
    }
    nodes.value.push(newNode)
    saveToHistory()
    return id
  }

  // Update node position (without saving to history - for drag)
  const updateNodePosition = (nodeId: string, position: { x: number; y: number }) => {
    const node = nodes.value.find((n) => n.id === nodeId)
    if (node) {
      node.position = position
    }
  }

  // Update node positions (batch) - saves to history
  const updateNodePositions = (
    updates: Array<{ id: string; position: { x: number; y: number } }>
  ) => {
    updates.forEach((update) => {
      const node = nodes.value.find((n) => n.id === update.id)
      if (node) {
        node.position = update.position
      }
    })
    saveToHistory()
  }

  // Update node config
  const updateNodeConfig = (nodeId: string, config: Partial<NodeConfig>) => {
    const node = nodes.value.find((n) => n.id === nodeId)
    if (node) {
      node.data.config = { ...node.data.config, ...config } as NodeConfig
      saveToHistory()
    }
  }

  // Update node label
  const updateNodeLabel = (nodeId: string, label: string) => {
    const node = nodes.value.find((n) => n.id === nodeId)
    if (node) {
      node.data.label = label
      saveToHistory()
    }
  }

  // Remove node
  const removeNode = (nodeId: string) => {
    nodes.value = nodes.value.filter((n) => n.id !== nodeId)
    edges.value = edges.value.filter((e) => e.source !== nodeId && e.target !== nodeId)
    if (selectedNodeId.value === nodeId) {
      selectedNodeId.value = null
    }
    selectedNodeIds.value.delete(nodeId)
    saveToHistory()
  }

  // Remove multiple nodes
  const removeNodes = (nodeIds: string[]) => {
    const idsSet = new Set(nodeIds)
    nodes.value = nodes.value.filter((n) => !idsSet.has(n.id))
    edges.value = edges.value.filter(
      (e) => !idsSet.has(e.source) && !idsSet.has(e.target)
    )
    if (selectedNodeId.value && idsSet.has(selectedNodeId.value)) {
      selectedNodeId.value = null
    }
    nodeIds.forEach((id) => selectedNodeIds.value.delete(id))
    saveToHistory()
  }

  // Add edge with validation
  const addEdge = (
    source: string,
    target: string,
    sourceHandle?: string,
    targetHandle?: string
  ): { success: boolean; error?: string } => {
    const sourceNode = nodes.value.find((n) => n.id === source)
    const targetNode = nodes.value.find((n) => n.id === target)

    if (!sourceNode || !targetNode) {
      return { success: false, error: 'Source or target node not found' }
    }

    // Use validation utility with cycle detection
    const validation = isValidConnectionWithCycleCheck(sourceNode, targetNode, edges.value)
    if (!validation.valid) {
      return { success: false, error: validation.reason }
    }

    const edge: WorkflowEdge = {
      id: `edge_${source}_${target}`,
      source,
      target,
      sourceHandle,
      targetHandle,
      animated: true,
    }
    edges.value.push(edge)
    saveToHistory()
    return { success: true }
  }

  // Remove edge
  const removeEdge = (edgeId: string) => {
    edges.value = edges.value.filter((e) => e.id !== edgeId)
    saveToHistory()
  }

  // Select node
  const selectNode = (nodeId: string | null) => {
    selectedNodeId.value = nodeId
    if (nodeId) {
      selectedNodeIds.value.clear()
      selectedNodeIds.value.add(nodeId)
    } else {
      selectedNodeIds.value.clear()
    }
  }

  // Select multiple nodes
  const selectNodes = (nodeIds: string[]) => {
    selectedNodeIds.value = new Set(nodeIds)
    if (nodeIds.length === 1) {
      selectedNodeId.value = nodeIds[0] ?? null
    } else {
      selectedNodeId.value = null
    }
  }

  // Select all nodes
  const selectAllNodes = () => {
    const allIds = nodes.value.map((n) => n.id)
    selectedNodeIds.value = new Set(allIds)
    selectedNodeId.value = null
  }

  // Toggle node selection (for multi-select with Ctrl/Cmd)
  const toggleNodeSelection = (nodeId: string) => {
    if (selectedNodeIds.value.has(nodeId)) {
      selectedNodeIds.value.delete(nodeId)
      if (selectedNodeId.value === nodeId) {
        selectedNodeId.value = selectedNodeIds.value.size === 1 
          ? Array.from(selectedNodeIds.value)[0] ?? null
          : null
      }
    } else {
      selectedNodeIds.value.add(nodeId)
      if (selectedNodeIds.value.size === 1) {
        selectedNodeId.value = nodeId
      } else {
        selectedNodeId.value = null
      }
    }
  }

  // Update viewport
  const updateViewport = (newViewport: { x: number; y: number; zoom: number }) => {
    viewport.value = newViewport
  }

  // Clear workflow
  const clearWorkflow = () => {
    nodes.value = []
    edges.value = []
    selectedNodeId.value = null
    selectedNodeIds.value.clear()
    execution.clearLogs()
    saveToHistory()
  }

  // Export workflow
  const exportWorkflow = (): WorkflowState => {
    return {
      nodes: JSON.parse(JSON.stringify(toRaw(nodes.value))),
      edges: JSON.parse(JSON.stringify(toRaw(edges.value))),
      viewport: { ...viewport.value },
    }
  }

  // Import workflow with validation
  const importWorkflow = (state: WorkflowState): { success: boolean; errors: string[] } => {
    // Validate the imported workflow
    const validation = validateImportedWorkflow(state)
    if (!validation.valid) {
      return { success: false, errors: validation.errors }
    }

    nodes.value = state.nodes
    edges.value = state.edges
    if (state.viewport) {
      viewport.value = state.viewport
    }
    selectedNodeId.value = null
    selectedNodeIds.value.clear()
    execution.clearLogs()
    saveToHistory()
    return { success: true, errors: [] }
  }

  // Validate workflow before execution
  const getWorkflowValidation = () => {
    return validateWorkflow(nodes.value, edges.value)
  }

  // Execute workflow
  const executeWorkflow = async () => {
    await execution.execute(nodes.value, edges.value)
  }

  // Undo
  const undo = () => {
    const state = history.undo()
    if (state) {
      nodes.value = state.nodes
      edges.value = state.edges
      selectedNodeId.value = null
    }
  }

  // Redo
  const redo = () => {
    const state = history.redo()
    if (state) {
      nodes.value = state.nodes
      edges.value = state.edges
      selectedNodeId.value = null
    }
  }

  // Load from auto-save
  const loadAutoSave = () => {
    const state = persistence.loadFromStorage()
    if (state) {
      const result = importWorkflow(state)
      return result.success
    }
    return false
  }

  // Watch for changes and auto-save (debounced via composable)
  watch(
    [nodes, edges],
    () => {
      if (!history.isInUndoRedo()) {
        persistence.autoSave(exportWorkflow())
      }
    },
    { deep: true }
  )

  return {
    // State
    nodes,
    edges,
    selectedNodeId,
    selectedNodeIds,
    selectedNode,
    viewport,

    // Execution state (from composable)
    executionLogs: execution.executionLogs,
    isExecuting: execution.isExecuting,

    // Theme (from composable)
    isDarkMode: theme.isDarkMode,
    toggleDarkMode: theme.toggleDarkMode,

    // Persistence (from composable)
    lastSavedAt: persistence.lastSavedAt,

    // Undo/Redo
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    undo,
    redo,

    // Actions
    addNode,
    updateNodePosition,
    updateNodePositions,
    updateNodeConfig,
    updateNodeLabel,
    removeNode,
    removeNodes,
    addEdge,
    removeEdge,
    selectNode,
    selectNodes,
    selectAllNodes,
    toggleNodeSelection,
    updateViewport,
    clearWorkflow,
    exportWorkflow,
    importWorkflow,
    executeWorkflow,
    clearExecutionLogs: execution.clearLogs,
    loadAutoSave,
    getWorkflowValidation,

    // Expose persistence methods for toolbar
    downloadWorkflow: persistence.downloadAsFile,
  }
})
