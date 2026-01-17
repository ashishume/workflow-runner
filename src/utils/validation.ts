import { NodeType } from '../types/workflow'
import type { WorkflowEdge, WorkflowNode, WorkflowState } from '../types/workflow'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface CycleDetectionResult {
  hasCycle: boolean
  cyclePath: string[] // Node IDs forming the cycle
}

/**
 * Validates if a connection between two nodes is allowed
 */
export function isValidConnection(
  sourceNode: WorkflowNode,
  targetNode: WorkflowNode,
  existingEdges: WorkflowEdge[]
): { valid: boolean; reason?: string } {
  // Prevent self-loops
  if (sourceNode.id === targetNode.id) {
    return { valid: false, reason: 'Cannot connect a node to itself' }
  }

  // Prevent duplicate connections
  const exists = existingEdges.some((e) => e.source === sourceNode.id && e.target === targetNode.id)
  if (exists) {
    return { valid: false, reason: 'Connection already exists' }
  }

  // End nodes cannot have outgoing connections
  if (sourceNode.data.nodeType === NodeType.END) {
    return {
      valid: false,
      reason: 'End nodes cannot have outgoing connections',
    }
  }

  // Start nodes cannot have incoming connections
  if (targetNode.data.nodeType === NodeType.START) {
    return {
      valid: false,
      reason: 'Start nodes cannot have incoming connections',
    }
  }

  // Note: Start-to-Start and End-to-End connections are already prevented
  // by the rules above (End cannot have outgoing, Start cannot have incoming)

  return { valid: true }
}

/**
 * Checks if adding a new edge would create a cycle using DFS
 * This is used when validating a new connection before it's added
 */
export function wouldCreateCycle(
  sourceId: string,
  targetId: string,
  existingEdges: WorkflowEdge[]
): boolean {
  // If adding edge from source to target would create a cycle,
  // it means there's already a path from target to source
  // We check if we can reach source from target using existing edges

  // Build adjacency list from existing edges
  const adjacencyList = new Map<string, string[]>()
  existingEdges.forEach((edge) => {
    const targets = adjacencyList.get(edge.source) || []
    targets.push(edge.target)
    adjacencyList.set(edge.source, targets)
  })

  // DFS from target to see if we can reach source
  const visited = new Set<string>()
  const stack = [targetId]

  while (stack.length > 0) {
    const current = stack.pop()!

    if (current === sourceId) {
      return true // Found a path from target to source, adding edge would create cycle
    }

    if (visited.has(current)) {
      continue
    }

    visited.add(current)
    const neighbors = adjacencyList.get(current) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        stack.push(neighbor)
      }
    }
  }

  return false
}

/**
 * Extended validation that also checks for cycles
 * Use this when you have access to all nodes
 */
export function isValidConnectionWithCycleCheck(
  sourceNode: WorkflowNode,
  targetNode: WorkflowNode,
  existingEdges: WorkflowEdge[]
): { valid: boolean; reason?: string } {
  // First do basic validation
  const basicResult = isValidConnection(sourceNode, targetNode, existingEdges)
  if (!basicResult.valid) {
    return basicResult
  }

  // Check if adding this edge would create a cycle
  if (wouldCreateCycle(sourceNode.id, targetNode.id, existingEdges)) {
    return {
      valid: false,
      reason: 'This connection would create an infinite loop',
    }
  }

  return { valid: true }
}

/**
 * Detects cycles (infinite loops) in the workflow graph using DFS
 * Returns the cycle path if found for better error messaging
 */
export function detectCycles(nodes: WorkflowNode[], edges: WorkflowEdge[]): CycleDetectionResult {
  // Build adjacency list
  const adjacencyList = new Map<string, string[]>()
  nodes.forEach((node) => adjacencyList.set(node.id, []))
  edges.forEach((edge) => {
    const targets = adjacencyList.get(edge.source) || []
    targets.push(edge.target)
    adjacencyList.set(edge.source, targets)
  })

  // Track visited nodes and nodes in current recursion stack
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  const parent = new Map<string, string>() // To reconstruct cycle path

  // DFS helper function
  const dfs = (nodeId: string): string | null => {
    visited.add(nodeId)
    recursionStack.add(nodeId)

    const neighbors = adjacencyList.get(nodeId) || []
    for (const neighbor of neighbors) {
      // If neighbor is in recursion stack, we found a cycle
      if (recursionStack.has(neighbor)) {
        parent.set(neighbor, nodeId)
        return neighbor // Return the start of the cycle
      }

      // If not visited, continue DFS
      if (!visited.has(neighbor)) {
        parent.set(neighbor, nodeId)
        const cycleStart = dfs(neighbor)
        if (cycleStart !== null) {
          return cycleStart
        }
      }
    }

    recursionStack.delete(nodeId)
    return null
  }

  // Check all nodes (handles disconnected components)
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      const cycleStart = dfs(node.id)
      if (cycleStart !== null) {
        // Reconstruct the cycle path
        const cyclePath: string[] = [cycleStart]
        let current = parent.get(cycleStart)
        while (current && current !== cycleStart) {
          cyclePath.unshift(current)
          current = parent.get(current)
        }
        cyclePath.unshift(cycleStart) // Complete the cycle

        return { hasCycle: true, cyclePath }
      }
    }
  }

  return { hasCycle: false, cyclePath: [] }
}

/**
 * Validates the entire workflow before execution
 */
export function validateWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[]): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check for empty workflow
  if (nodes.length === 0) {
    errors.push('Workflow is empty. Add at least a Start and End node.')
    return { valid: false, errors, warnings }
  }

  // Check for Start node
  const startNodes = nodes.filter((n) => n.data.nodeType === NodeType.START)
  if (startNodes.length === 0) {
    errors.push('Workflow must have at least one Start node')
  }

  // Check for End node
  const endNodes = nodes.filter((n) => n.data.nodeType === NodeType.END)
  if (endNodes.length === 0) {
    warnings.push('Workflow has no End node. Execution will stop after the last connected node.')
  }

  // Check for infinite loops (cycles)
  const cycleResult = detectCycles(nodes, edges)
  if (cycleResult.hasCycle) {
    // Get node labels for better error message
    const cycleLabels = cycleResult.cyclePath.map((nodeId) => {
      const node = nodes.find((n) => n.id === nodeId)
      return node?.data.label || nodeId
    })
    errors.push(`Infinite loop detected: ${cycleLabels.join(' → ')}`)
  }

  // Check for disconnected nodes
  const connectedNodeIds = new Set<string>()
  edges.forEach((edge) => {
    connectedNodeIds.add(edge.source)
    connectedNodeIds.add(edge.target)
  })

  // Start nodes only need outgoing connections
  startNodes.forEach((node) => {
    const hasOutgoing = edges.some((e) => e.source === node.id)
    if (!hasOutgoing) {
      warnings.push(`Start node "${node.data.label}" has no outgoing connections`)
    }
  })

  // End nodes only need incoming connections
  endNodes.forEach((node) => {
    const hasIncoming = edges.some((e) => e.target === node.id)
    if (!hasIncoming) {
      warnings.push(`End node "${node.data.label}" has no incoming connections`)
    }
  })

  // Other nodes need both incoming and outgoing
  const otherNodes = nodes.filter(
    (n) => n.data.nodeType !== NodeType.START && n.data.nodeType !== NodeType.END
  )
  otherNodes.forEach((node) => {
    const hasIncoming = edges.some((e) => e.target === node.id)
    const hasOutgoing = edges.some((e) => e.source === node.id)

    if (!hasIncoming && !hasOutgoing) {
      warnings.push(`Node "${node.data.label}" is not connected to the workflow`)
    } else if (!hasIncoming) {
      warnings.push(`Node "${node.data.label}" has no incoming connections`)
    } else if (!hasOutgoing) {
      warnings.push(`Node "${node.data.label}" has no outgoing connections`)
    }
  })

  // Validate Start node configurations
  startNodes.forEach((node) => {
    try {
      const config = node.data.config as { payload: unknown }
      if (!config.payload || typeof config.payload !== 'object') {
        warnings.push(`Start node "${node.data.label}" has invalid payload configuration`)
      }
    } catch {
      warnings.push(`Start node "${node.data.label}" has invalid configuration`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validates imported workflow JSON
 */
export function validateImportedWorkflow(data: unknown): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    errors.push('Invalid workflow data: expected an object')
    return { valid: false, errors }
  }

  const workflow = data as Partial<WorkflowState>

  // Check nodes array
  if (!Array.isArray(workflow.nodes)) {
    errors.push('Invalid workflow: "nodes" must be an array')
  } else {
    workflow.nodes.forEach((node, index) => {
      if (!node.id) {
        errors.push(`Node at index ${index} is missing "id" field`)
      }
      if (!node.type) {
        errors.push(`Node at index ${index} is missing "type" field`)
      }
      if (
        !node.position ||
        typeof node.position.x !== 'number' ||
        typeof node.position.y !== 'number'
      ) {
        errors.push(`Node "${node.id || index}" has invalid position`)
      }
      if (!node.data || !node.data.nodeType) {
        errors.push(`Node "${node.id || index}" has invalid data structure`)
      }

      // Validate node type
      const validTypes: NodeType[] = [
        NodeType.START,
        NodeType.TRANSFORM,
        NodeType.CONDITION,
        NodeType.END,
      ]
      if (node.type && !validTypes.includes(node.type as NodeType)) {
        errors.push(`Node "${node.id || index}" has invalid type "${node.type}"`)
      }
    })
  }

  // Check edges array
  if (!Array.isArray(workflow.edges)) {
    errors.push('Invalid workflow: "edges" must be an array')
  } else {
    workflow.edges.forEach((edge, index) => {
      if (!edge.id) {
        errors.push(`Edge at index ${index} is missing "id" field`)
      }
      if (!edge.source) {
        errors.push(`Edge at index ${index} is missing "source" field`)
      }
      if (!edge.target) {
        errors.push(`Edge at index ${index} is missing "target" field`)
      }
    })

    // Check if edge references exist in nodes
    if (Array.isArray(workflow.nodes)) {
      const nodeIds = new Set(workflow.nodes.map((n) => n.id))
      workflow.edges.forEach((edge) => {
        if (edge.source && !nodeIds.has(edge.source)) {
          errors.push(`Edge "${edge.id}" references non-existent source node "${edge.source}"`)
        }
        if (edge.target && !nodeIds.has(edge.target)) {
          errors.push(`Edge "${edge.id}" references non-existent target node "${edge.target}"`)
        }
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validates JSON string
 */
export function validateJSON(jsonString: string): {
  valid: boolean
  error?: string
  data?: unknown
} {
  try {
    const data = JSON.parse(jsonString)
    return { valid: true, data }
  } catch (e) {
    return {
      valid: false,
      error: e instanceof Error ? `Invalid JSON: ${e.message}` : 'Invalid JSON format',
    }
  }
}
