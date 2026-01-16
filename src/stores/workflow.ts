import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import type {
  WorkflowNode,
  WorkflowEdge,
  NodeType,
  NodeConfig,
  StartNodeConfig,
  TransformNodeConfig,
  ConditionNodeConfig,
  EndNodeConfig,
  ExecutionLogEntry,
  WorkflowState,
  HistoryState,
} from "../types/workflow";
import {
  isValidConnection,
  validateWorkflow,
  validateImportedWorkflow,
} from "../utils/validation";

// Default configurations for each node type
const getDefaultConfig = (type: NodeType): NodeConfig => {
  switch (type) {
    case "start":
      return { payload: { message: "Hello World" } } as StartNodeConfig;
    case "transform":
      return {
        operation: "uppercase",
        field: "message",
        value: "",
      } as TransformNodeConfig;
    case "condition":
      return {
        field: "message",
        operator: "equals",
        value: "",
      } as ConditionNodeConfig;
    case "end":
      return { label: "End" } as EndNodeConfig;
    default:
      return { payload: {} } as StartNodeConfig;
  }
};

const getNodeLabel = (type: NodeType): string => {
  switch (type) {
    case "start":
      return "Start";
    case "transform":
      return "Transform";
    case "condition":
      return "If-Else";
    case "end":
      return "End";
    default:
      return "Node";
  }
};

export const useWorkflowStore = defineStore("workflow", () => {
  // State
  const nodes = ref<WorkflowNode[]>([]);
  const edges = ref<WorkflowEdge[]>([]);
  const selectedNodeId = ref<string | null>(null);
  const executionLogs = ref<ExecutionLogEntry[]>([]);
  const isExecuting = ref(false);
  const viewport = ref({ x: 0, y: 0, zoom: 1 });

  // Undo/Redo history
  const history = ref<HistoryState[]>([]);
  const historyIndex = ref(-1);
  const maxHistorySize = 50;
  const isUndoRedoAction = ref(false);

  // Dark mode
  const isDarkMode = ref(localStorage.getItem("darkMode") === "true");

  // Last saved timestamp for autosave indicator
  const lastSavedAt = ref<number | null>(null);

  // Computed
  const selectedNode = computed(
    () => nodes.value.find((n) => n.id === selectedNodeId.value) || null
  );

  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < history.value.length - 1);

  // Save current state to history
  const saveToHistory = () => {
    if (isUndoRedoAction.value) return;

    // Remove any future states if we're in the middle of history
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1);
    }

    // Add current state
    const state: HistoryState = {
      nodes: JSON.parse(JSON.stringify(nodes.value)),
      edges: JSON.parse(JSON.stringify(edges.value)),
    };

    history.value.push(state);

    // Limit history size
    if (history.value.length > maxHistorySize) {
      history.value.shift();
    } else {
      historyIndex.value = history.value.length - 1;
    }
  };

  // Initialize history with empty state
  const initHistory = () => {
    history.value = [
      {
        nodes: [],
        edges: [],
      },
    ];
    historyIndex.value = 0;
  };

  // Undo
  const undo = () => {
    if (!canUndo.value) return;

    isUndoRedoAction.value = true;
    historyIndex.value--;
    const state = history.value[historyIndex.value];
    if (state) {
      nodes.value = JSON.parse(JSON.stringify(state.nodes));
      edges.value = JSON.parse(JSON.stringify(state.edges));
    }
    selectedNodeId.value = null;
    isUndoRedoAction.value = false;
  };

  // Redo
  const redo = () => {
    if (!canRedo.value) return;

    isUndoRedoAction.value = true;
    historyIndex.value++;
    const state = history.value[historyIndex.value];
    if (state) {
      nodes.value = JSON.parse(JSON.stringify(state.nodes));
      edges.value = JSON.parse(JSON.stringify(state.edges));
    }
    selectedNodeId.value = null;
    isUndoRedoAction.value = false;
  };

  // Generate unique ID
  const generateId = () =>
    `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add node
  const addNode = (type: NodeType, position: { x: number; y: number }) => {
    const id = generateId();
    const newNode: WorkflowNode = {
      id,
      type,
      position,
      data: {
        label: getNodeLabel(type),
        config: getDefaultConfig(type),
        nodeType: type,
      },
    };
    nodes.value.push(newNode);
    saveToHistory();
    return id;
  };

  // Update node position
  const updateNodePosition = (
    nodeId: string,
    position: { x: number; y: number }
  ) => {
    const node = nodes.value.find((n) => n.id === nodeId);
    if (node) {
      node.position = position;
    }
  };

  // Update node positions (batch)
  const updateNodePositions = (
    updates: Array<{ id: string; position: { x: number; y: number } }>
  ) => {
    updates.forEach((update) => {
      const node = nodes.value.find((n) => n.id === update.id);
      if (node) {
        node.position = update.position;
      }
    });
    saveToHistory();
  };

  // Update node config
  const updateNodeConfig = (nodeId: string, config: Partial<NodeConfig>) => {
    const node = nodes.value.find((n) => n.id === nodeId);
    if (node) {
      node.data.config = { ...node.data.config, ...config } as NodeConfig;
      saveToHistory();
    }
  };

  // Update node label
  const updateNodeLabel = (nodeId: string, label: string) => {
    const node = nodes.value.find((n) => n.id === nodeId);
    if (node) {
      node.data.label = label;
      saveToHistory();
    }
  };

  // Remove node
  const removeNode = (nodeId: string) => {
    nodes.value = nodes.value.filter((n) => n.id !== nodeId);
    edges.value = edges.value.filter(
      (e) => e.source !== nodeId && e.target !== nodeId
    );
    if (selectedNodeId.value === nodeId) {
      selectedNodeId.value = null;
    }
    saveToHistory();
  };

  // Add edge with validation
  const addEdge = (
    source: string,
    target: string,
    sourceHandle?: string,
    targetHandle?: string
  ): { success: boolean; error?: string } => {
    const sourceNode = nodes.value.find((n) => n.id === source);
    const targetNode = nodes.value.find((n) => n.id === target);

    if (!sourceNode || !targetNode) {
      return { success: false, error: "Source or target node not found" };
    }

    // Use validation utility
    const validation = isValidConnection(sourceNode, targetNode, edges.value);
    if (!validation.valid) {
      return { success: false, error: validation.reason };
    }

    const edge: WorkflowEdge = {
      id: `edge_${source}_${target}`,
      source,
      target,
      sourceHandle,
      targetHandle,
      animated: true,
    };
    edges.value.push(edge);
    saveToHistory();
    return { success: true };
  };

  // Remove edge
  const removeEdge = (edgeId: string) => {
    edges.value = edges.value.filter((e) => e.id !== edgeId);
    saveToHistory();
  };

  // Select node
  const selectNode = (nodeId: string | null) => {
    selectedNodeId.value = nodeId;
  };

  // Update viewport
  const updateViewport = (newViewport: {
    x: number;
    y: number;
    zoom: number;
  }) => {
    viewport.value = newViewport;
  };

  // Clear workflow
  const clearWorkflow = () => {
    nodes.value = [];
    edges.value = [];
    selectedNodeId.value = null;
    executionLogs.value = [];
    saveToHistory();
  };

  // Export workflow
  const exportWorkflow = (): WorkflowState => {
    return {
      nodes: JSON.parse(JSON.stringify(nodes.value)),
      edges: JSON.parse(JSON.stringify(edges.value)),
      viewport: { ...viewport.value },
    };
  };

  // Import workflow with validation
  const importWorkflow = (
    state: WorkflowState
  ): { success: boolean; errors: string[] } => {
    // Validate the imported workflow
    const validation = validateImportedWorkflow(state);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    nodes.value = state.nodes;
    edges.value = state.edges;
    if (state.viewport) {
      viewport.value = state.viewport;
    }
    selectedNodeId.value = null;
    executionLogs.value = [];
    saveToHistory();
    return { success: true, errors: [] };
  };

  // Validate workflow before execution
  const getWorkflowValidation = () => {
    return validateWorkflow(nodes.value, edges.value);
  };

  // Execute workflow
  const executeWorkflow = async () => {
    executionLogs.value = [];
    isExecuting.value = true;

    // Validate workflow first
    const validation = validateWorkflow(nodes.value, edges.value);

    // Log warnings
    validation.warnings.forEach((warning) => {
      executionLogs.value.push({
        nodeId: "system",
        nodeName: "System",
        nodeType: "start",
        input: {},
        output: {},
        timestamp: Date.now(),
        status: "skipped",
        message: `⚠️ Warning: ${warning}`,
      });
    });

    // Check for errors
    if (!validation.valid) {
      validation.errors.forEach((error) => {
        executionLogs.value.push({
          nodeId: "system",
          nodeName: "System",
          nodeType: "start",
          input: {},
          output: {},
          timestamp: Date.now(),
          status: "error",
          message: error,
        });
      });
      isExecuting.value = false;
      return;
    }

    // Find start nodes
    const startNodes = nodes.value.filter((n) => n.data.nodeType === "start");

    if (startNodes.length === 0) {
      executionLogs.value.push({
        nodeId: "system",
        nodeName: "System",
        nodeType: "start",
        input: {},
        output: {},
        timestamp: Date.now(),
        status: "error",
        message: "No start node found in workflow",
      });
      isExecuting.value = false;
      return;
    }

    // Build adjacency list for traversal
    const adjacencyList = new Map<string, string[]>();
    nodes.value.forEach((n) => adjacencyList.set(n.id, []));
    edges.value.forEach((e) => {
      const targets = adjacencyList.get(e.source) || [];
      targets.push(e.target);
      adjacencyList.set(e.source, targets);
    });

    // Execute from each start node
    for (const startNode of startNodes) {
      await executeFromNode(
        startNode,
        adjacencyList,
        (startNode.data.config as StartNodeConfig).payload
      );
    }

    isExecuting.value = false;
  };

  // Execute from a specific node
  const executeFromNode = async (
    node: WorkflowNode,
    adjacencyList: Map<string, string[]>,
    inputData: Record<string, unknown>,
    visited: Set<string> = new Set()
  ) => {
    // Cycle detection
    if (visited.has(node.id)) {
      executionLogs.value.push({
        nodeId: node.id,
        nodeName: node.data.label,
        nodeType: node.data.nodeType,
        input: inputData,
        output: {},
        timestamp: Date.now(),
        status: "error",
        message: "Cycle detected - node already visited",
      });
      return;
    }

    visited.add(node.id);

    // Simulate delay for visual effect
    await new Promise((resolve) => setTimeout(resolve, 500));

    let outputData: Record<string, unknown> = { ...inputData };
    let status: "success" | "error" | "skipped" = "success";
    let message: string | undefined;

    try {
      switch (node.data.nodeType) {
        case "start": {
          const config = node.data.config as StartNodeConfig;
          outputData = { ...config.payload };
          message = "Started workflow execution";
          break;
        }

        case "transform": {
          const config = node.data.config as TransformNodeConfig;
          const fieldValue = inputData[config.field];

          switch (config.operation) {
            case "uppercase":
              if (typeof fieldValue === "string") {
                outputData[config.field] = fieldValue.toUpperCase();
              }
              break;
            case "lowercase":
              if (typeof fieldValue === "string") {
                outputData[config.field] = fieldValue.toLowerCase();
              }
              break;
            case "append":
              if (typeof fieldValue === "string") {
                outputData[config.field] = fieldValue + (config.value || "");
              }
              break;
            case "prepend":
              if (typeof fieldValue === "string") {
                outputData[config.field] = (config.value || "") + fieldValue;
              }
              break;
            case "multiply":
              if (typeof fieldValue === "number") {
                outputData[config.field] =
                  fieldValue * (Number(config.value) || 1);
              }
              break;
            case "add":
              if (typeof fieldValue === "number") {
                outputData[config.field] =
                  fieldValue + (Number(config.value) || 0);
              }
              break;
            case "replace":
              outputData[config.field] = config.value;
              break;
          }
          message = `Applied ${config.operation} to ${config.field}`;
          break;
        }

        case "condition": {
          const config = node.data.config as ConditionNodeConfig;
          const fieldValue = inputData[config.field];
          let conditionMet = false;

          switch (config.operator) {
            case "equals":
              conditionMet = fieldValue === config.value;
              break;
            case "notEquals":
              conditionMet = fieldValue !== config.value;
              break;
            case "contains":
              conditionMet = String(fieldValue).includes(String(config.value));
              break;
            case "greaterThan":
              conditionMet = Number(fieldValue) > Number(config.value);
              break;
            case "lessThan":
              conditionMet = Number(fieldValue) < Number(config.value);
              break;
            case "greaterThanOrEqual":
              conditionMet = Number(fieldValue) >= Number(config.value);
              break;
            case "lessThanOrEqual":
              conditionMet = Number(fieldValue) <= Number(config.value);
              break;
            case "isEmpty":
              conditionMet = !fieldValue || fieldValue === "";
              break;
            case "isNotEmpty":
              conditionMet = !!fieldValue && fieldValue !== "";
              break;
            case "isEven":
              conditionMet =
                typeof fieldValue === "number" && fieldValue % 2 === 0;
              break;
            case "isOdd":
              conditionMet =
                typeof fieldValue === "number" && fieldValue % 2 !== 0;
              break;
            case "isDivisibleBy":
              conditionMet =
                typeof fieldValue === "number" &&
                Number(config.value) !== 0 &&
                fieldValue % Number(config.value) === 0;
              break;
          }

          outputData = { ...inputData, _conditionMet: conditionMet };
          message = `Condition ${config.field} ${config.operator} ${
            config.value || ""
          }: ${conditionMet}`;
          break;
        }

        case "end": {
          message = "Workflow execution completed";
          break;
        }
      }
    } catch (error) {
      status = "error";
      message = error instanceof Error ? error.message : "Unknown error";
    }

    // Log execution
    executionLogs.value.push({
      nodeId: node.id,
      nodeName: node.data.label,
      nodeType: node.data.nodeType,
      input: inputData,
      output: outputData,
      timestamp: Date.now(),
      status,
      message,
    });

    // Continue to next nodes
    if (status !== "error") {
      const nextNodeIds = adjacencyList.get(node.id) || [];

      for (const nextNodeId of nextNodeIds) {
        const nextNode = nodes.value.find((n) => n.id === nextNodeId);
        if (nextNode) {
          // For condition nodes, check which branch to follow
          if (node.data.nodeType === "condition") {
            const edge = edges.value.find(
              (e) => e.source === node.id && e.target === nextNodeId
            );
            const conditionMet = outputData._conditionMet as boolean;

            // If edge is from 'true' handle and condition is not met, skip
            if (edge?.sourceHandle === "true" && !conditionMet) continue;
            // If edge is from 'false' handle and condition is met, skip
            if (edge?.sourceHandle === "false" && conditionMet) continue;
          }

          await executeFromNode(
            nextNode,
            adjacencyList,
            outputData,
            new Set(visited)
          );
        }
      }
    }
  };

  // Clear execution logs
  const clearExecutionLogs = () => {
    executionLogs.value = [];
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value;
    localStorage.setItem("darkMode", String(isDarkMode.value));
  };

  // Auto-save to localStorage
  const autoSave = () => {
    const state = exportWorkflow();
    localStorage.setItem("workflow-autosave", JSON.stringify(state));
    lastSavedAt.value = Date.now();
  };

  // Load from auto-save
  const loadAutoSave = () => {
    const saved = localStorage.getItem("workflow-autosave");
    if (saved) {
      try {
        const state = JSON.parse(saved) as WorkflowState;
        importWorkflow(state);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  };

  // Watch for changes and auto-save
  watch(
    [nodes, edges],
    () => {
      autoSave();
    },
    { deep: true }
  );

  // Initialize
  initHistory();

  return {
    // State
    nodes,
    edges,
    selectedNodeId,
    selectedNode,
    executionLogs,
    isExecuting,
    viewport,
    isDarkMode,
    lastSavedAt,

    // Undo/Redo
    canUndo,
    canRedo,
    undo,
    redo,

    // Actions
    addNode,
    updateNodePosition,
    updateNodePositions,
    updateNodeConfig,
    updateNodeLabel,
    removeNode,
    addEdge,
    removeEdge,
    selectNode,
    updateViewport,
    clearWorkflow,
    exportWorkflow,
    importWorkflow,
    executeWorkflow,
    clearExecutionLogs,
    toggleDarkMode,
    loadAutoSave,
    getWorkflowValidation,
  };
});
