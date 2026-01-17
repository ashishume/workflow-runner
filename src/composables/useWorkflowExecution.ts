import { ref } from 'vue'

import { ConditionOperator, NodeType, TransformOperation } from '../types/workflow'
import type {
  ConditionNodeConfig,
  ExecutionLogEntry,
  StartNodeConfig,
  TransformNodeConfig,
  WorkflowEdge,
  WorkflowNode,
} from '../types/workflow'
import { validateWorkflow } from '../utils/validation'

export interface UseWorkflowExecutionOptions {
  executionDelay?: number
  maxLogEntries?: number
}

export function useWorkflowExecution(options: UseWorkflowExecutionOptions = {}) {
  const { executionDelay = 500, maxLogEntries = 100 } = options

  const executionLogs = ref<ExecutionLogEntry[]>([])
  const isExecuting = ref(false)

  // Add log entry with limit
  const addLog = (entry: ExecutionLogEntry) => {
    executionLogs.value.push(entry)
    // Cap logs to prevent unbounded growth
    if (executionLogs.value.length > maxLogEntries) {
      executionLogs.value = executionLogs.value.slice(-maxLogEntries)
    }
  }

  // Clear execution logs
  const clearLogs = () => {
    executionLogs.value = []
  }

  // Execute a single node
  const executeNode = async (
    node: WorkflowNode,
    inputData: Record<string, unknown>
  ): Promise<{
    outputData: Record<string, unknown>
    status: 'success' | 'error'
    message?: string
  }> => {
    let outputData: Record<string, unknown> = { ...inputData }
    let status: 'success' | 'error' = 'success'
    let message: string | undefined

    try {
      switch (node.data.nodeType) {
        case NodeType.START: {
          const config = node.data.config as StartNodeConfig
          outputData = { ...config.payload }
          message = 'Started workflow execution'
          break
        }

        case NodeType.TRANSFORM: {
          const config = node.data.config as TransformNodeConfig
          const fieldValue = inputData[config.field]

          switch (config.operation) {
            case TransformOperation.UPPERCASE:
              if (typeof fieldValue === 'string') {
                outputData[config.field] = fieldValue.toUpperCase()
              }
              break
            case TransformOperation.LOWERCASE:
              if (typeof fieldValue === 'string') {
                outputData[config.field] = fieldValue.toLowerCase()
              }
              break
            case TransformOperation.APPEND:
              if (typeof fieldValue === 'string') {
                outputData[config.field] = fieldValue + (config.value || '')
              }
              break
            case TransformOperation.PREPEND:
              if (typeof fieldValue === 'string') {
                outputData[config.field] = (config.value || '') + fieldValue
              }
              break
            case TransformOperation.MULTIPLY:
              if (typeof fieldValue === 'number') {
                outputData[config.field] = fieldValue * (Number(config.value) || 1)
              }
              break
            case TransformOperation.ADD:
              if (typeof fieldValue === 'number') {
                outputData[config.field] = fieldValue + (Number(config.value) || 0)
              }
              break
            case TransformOperation.REPLACE:
              outputData[config.field] = config.value
              break
          }
          message = `Applied ${config.operation} to ${config.field}`
          break
        }

        case NodeType.CONDITION: {
          const config = node.data.config as ConditionNodeConfig
          const fieldValue = inputData[config.field]
          let conditionMet = false

          switch (config.operator) {
            case ConditionOperator.EQUALS:
              conditionMet = fieldValue === config.value
              break
            case ConditionOperator.NOT_EQUALS:
              conditionMet = fieldValue !== config.value
              break
            case ConditionOperator.CONTAINS:
              conditionMet = String(fieldValue).includes(String(config.value))
              break
            case ConditionOperator.GREATER_THAN:
              conditionMet = Number(fieldValue) > Number(config.value)
              break
            case ConditionOperator.LESS_THAN:
              conditionMet = Number(fieldValue) < Number(config.value)
              break
            case ConditionOperator.GREATER_THAN_OR_EQUAL:
              conditionMet = Number(fieldValue) >= Number(config.value)
              break
            case ConditionOperator.LESS_THAN_OR_EQUAL:
              conditionMet = Number(fieldValue) <= Number(config.value)
              break
            case ConditionOperator.IS_EMPTY:
              conditionMet = !fieldValue || fieldValue === ''
              break
            case ConditionOperator.IS_NOT_EMPTY:
              conditionMet = !!fieldValue && fieldValue !== ''
              break
            case ConditionOperator.IS_EVEN:
              conditionMet = typeof fieldValue === 'number' && fieldValue % 2 === 0
              break
            case ConditionOperator.IS_ODD:
              conditionMet = typeof fieldValue === 'number' && fieldValue % 2 !== 0
              break
            case ConditionOperator.IS_DIVISIBLE_BY:
              conditionMet =
                typeof fieldValue === 'number' &&
                Number(config.value) !== 0 &&
                fieldValue % Number(config.value) === 0
              break
          }

          outputData = { ...inputData, _conditionMet: conditionMet }
          message = `Condition ${config.field} ${config.operator} ${config.value || ''}: ${conditionMet}`
          break
        }

        case NodeType.END: {
          message = 'Workflow execution completed'
          break
        }
      }
    } catch (error) {
      status = 'error'
      message = error instanceof Error ? error.message : 'Unknown error'
    }

    return { outputData, status, message }
  }

  // Execute from a specific node (recursive with iteration to prevent stack overflow)
  const executeFromNode = async (
    node: WorkflowNode,
    adjacencyList: Map<string, string[]>,
    edges: WorkflowEdge[],
    nodes: WorkflowNode[],
    inputData: Record<string, unknown>,
    visited: Set<string> = new Set()
  ) => {
    // Use a queue for iterative execution to prevent stack overflow
    const queue: Array<{
      node: WorkflowNode
      inputData: Record<string, unknown>
      visited: Set<string>
    }> = [{ node, inputData, visited }]

    while (queue.length > 0) {
      const current = queue.shift()!
      const { node: currentNode, inputData: currentInput, visited: currentVisited } = current

      // Cycle detection
      if (currentVisited.has(currentNode.id)) {
        addLog({
          nodeId: currentNode.id,
          nodeName: currentNode.data.label,
          nodeType: currentNode.data.nodeType,
          input: currentInput,
          output: {},
          timestamp: Date.now(),
          status: 'error',
          message: 'Cycle detected - node already visited',
        })
        continue
      }

      const newVisited = new Set(currentVisited)
      newVisited.add(currentNode.id)

      // Simulate delay for visual effect
      await new Promise((resolve) => setTimeout(resolve, executionDelay))

      // Execute the node
      const { outputData, status, message } = await executeNode(currentNode, currentInput)

      // Log execution
      addLog({
        nodeId: currentNode.id,
        nodeName: currentNode.data.label,
        nodeType: currentNode.data.nodeType,
        input: currentInput,
        output: outputData,
        timestamp: Date.now(),
        status,
        message,
      })

      // Continue to next nodes if no error
      if (status !== 'error') {
        const nextNodeIds = adjacencyList.get(currentNode.id) || []

        for (const nextNodeId of nextNodeIds) {
          const nextNode = nodes.find((n) => n.id === nextNodeId)
          if (nextNode) {
            // For condition nodes, check which branch to follow
            if (currentNode.data.nodeType === NodeType.CONDITION) {
              const edge = edges.find(
                (e) => e.source === currentNode.id && e.target === nextNodeId
              )
              const conditionMet = outputData._conditionMet as boolean

              // If edge is from 'true' handle and condition is not met, skip
              if (edge?.sourceHandle === 'true' && !conditionMet) continue
              // If edge is from 'false' handle and condition is met, skip
              if (edge?.sourceHandle === 'false' && conditionMet) continue
            }

            queue.push({
              node: nextNode,
              inputData: outputData,
              visited: newVisited,
            })
          }
        }
      }
    }
  }

  // Execute the entire workflow
  const execute = async (nodes: WorkflowNode[], edges: WorkflowEdge[]) => {
    clearLogs()
    isExecuting.value = true

    try {
      // Validate workflow first
      const validation = validateWorkflow(nodes, edges)

      // Log warnings
      validation.warnings.forEach((warning) => {
        addLog({
          nodeId: 'system',
          nodeName: 'System',
          nodeType: NodeType.START,
          input: {},
          output: {},
          timestamp: Date.now(),
          status: 'skipped',
          message: `⚠️ Warning: ${warning}`,
        })
      })

      // Check for errors
      if (!validation.valid) {
        validation.errors.forEach((error) => {
          addLog({
            nodeId: 'system',
            nodeName: 'System',
            nodeType: NodeType.START,
            input: {},
            output: {},
            timestamp: Date.now(),
            status: 'error',
            message: error,
          })
        })
        return
      }

      // Find start nodes
      const startNodes = nodes.filter((n) => n.data.nodeType === NodeType.START)

      if (startNodes.length === 0) {
        addLog({
          nodeId: 'system',
          nodeName: 'System',
          nodeType: NodeType.START,
          input: {},
          output: {},
          timestamp: Date.now(),
          status: 'error',
          message: 'No start node found in workflow',
        })
        return
      }

      // Build adjacency list for traversal
      const adjacencyList = new Map<string, string[]>()
      nodes.forEach((n) => adjacencyList.set(n.id, []))
      edges.forEach((e) => {
        const targets = adjacencyList.get(e.source) || []
        targets.push(e.target)
        adjacencyList.set(e.source, targets)
      })

      // Execute from each start node
      for (const startNode of startNodes) {
        await executeFromNode(
          startNode,
          adjacencyList,
          edges,
          nodes,
          (startNode.data.config as StartNodeConfig).payload
        )
      }
    } finally {
      isExecuting.value = false
    }
  }

  return {
    executionLogs,
    isExecuting,
    execute,
    clearLogs,
  }
}
