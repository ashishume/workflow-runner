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
  const clipboard = ref<{ nodes: WorkflowNode[]; edges: WorkflowEdge[] } | null>(null)

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
    // Remove deleted nodes from selection
    nodeIds.forEach((id) => selectedNodeIds.value.delete(id))
    // Update selectedNodeId based on remaining selection
    if (selectedNodeIds.value.size === 1) {
      // If only one node is selected, set selectedNodeId
      selectedNodeId.value = Array.from(selectedNodeIds.value)[0] ?? null
    } else if (selectedNodeIds.value.size === 0) {
      selectedNodeId.value = null
    } else if (selectedNodeId.value && idsSet.has(selectedNodeId.value)) {
      // If the selectedNodeId was removed, clear it
      selectedNodeId.value = null
    }
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
      // Update selectedNodeId based on remaining selection
      if (selectedNodeIds.value.size === 1) {
        selectedNodeId.value = Array.from(selectedNodeIds.value)[0] ?? null
      } else {
        selectedNodeId.value = null
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

  // Copy/Paste
  clipboard,
  copyNodes: () => {
    const selectedIds = Array.from(selectedNodeIds.value)
    if (selectedIds.length === 0 && selectedNodeId.value) {
      selectedIds.push(selectedNodeId.value)
    }
    if (selectedIds.length === 0) return false

    // Get selected nodes
    const nodesToCopy = nodes.value.filter((n) => selectedIds.includes(n.id))
    if (nodesToCopy.length === 0) return false

    // Get edges between selected nodes only
    const edgesToCopy = edges.value.filter(
      (e) => selectedIds.includes(e.source) && selectedIds.includes(e.target)
    )

    // Deep clone nodes and edges
    clipboard.value = {
      nodes: JSON.parse(JSON.stringify(toRaw(nodesToCopy))),
      edges: JSON.parse(JSON.stringify(toRaw(edgesToCopy))),
    }

    return true
  },
  pasteNodes: (offset: { x: number; y: number } = { x: 50, y: 50 }) => {
    if (!clipboard.value || clipboard.value.nodes.length === 0) return false

    // Create mapping from old IDs to new IDs
    const idMap = new Map<string, string>()
    const newNodes: WorkflowNode[] = []
    const newEdges: WorkflowEdge[] = []

    // Calculate center of copied nodes
    const centerX =
      clipboard.value.nodes.reduce((sum, n) => sum + n.position.x, 0) /
      clipboard.value.nodes.length
    const centerY =
      clipboard.value.nodes.reduce((sum, n) => sum + n.position.y, 0) /
      clipboard.value.nodes.length

    // Calculate paste position (viewport center with offset)
    // Viewport center in canvas coordinates
    const viewportCenterX = -viewport.value.x / viewport.value.zoom
    const viewportCenterY = -viewport.value.y / viewport.value.zoom

    // Create new nodes with new IDs and offset positions
    clipboard.value.nodes.forEach((node) => {
      const newId = generateId()
      idMap.set(node.id, newId)

      // Position relative to viewport center with offset
      const newPosition = {
        x: viewportCenterX + (node.position.x - centerX) + offset.x,
        y: viewportCenterY + (node.position.y - centerY) + offset.y,
      }

      newNodes.push({
        ...node,
        id: newId,
        position: newPosition,
      })
    })

    // Create new edges with updated source/target IDs
    clipboard.value.edges.forEach((edge) => {
      const newSourceId = idMap.get(edge.source)
      const newTargetId = idMap.get(edge.target)
      if (newSourceId && newTargetId) {
        newEdges.push({
          ...edge,
          id: `edge_${newSourceId}_${newTargetId}`,
          source: newSourceId,
          target: newTargetId,
        })
      }
    })

    // Add new nodes and edges
    nodes.value.push(...newNodes)
    edges.value.push(...newEdges)

    // Select the newly pasted nodes
    selectedNodeIds.value = new Set(newNodes.map((n) => n.id))
    if (newNodes.length === 1) {
      selectedNodeId.value = newNodes[0]?.id ?? null
    } else {
      selectedNodeId.value = null
    }

    saveToHistory()
    return true
  },
  }
})
