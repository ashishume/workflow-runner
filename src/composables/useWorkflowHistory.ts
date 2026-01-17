import { computed, ref, toRaw } from 'vue'

import type { HistoryState, WorkflowEdge, WorkflowNode } from '../types/workflow'

// Helper to deep clone reactive objects safely
const deepClone = <T>(obj: T): T => {
  // Convert reactive objects to raw first, then clone
  const raw = toRaw(obj)
  try {
    return structuredClone(raw)
  } catch {
    // Fallback to JSON for edge cases
    return JSON.parse(JSON.stringify(raw))
  }
}

export interface UseWorkflowHistoryOptions {
  maxHistorySize?: number
}

export function useWorkflowHistory(options: UseWorkflowHistoryOptions = {}) {
  const { maxHistorySize = 50 } = options

  // History state
  const history = ref<HistoryState[]>([{ nodes: [], edges: [] }])
  const historyIndex = ref(0)
  const isUndoRedoAction = ref(false)

  // Computed
  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  // Save current state to history
  const saveToHistory = (nodes: WorkflowNode[], edges: WorkflowEdge[]) => {
    if (isUndoRedoAction.value) return

    // Remove any future states if we're in the middle of history
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }

    // Deep clone using structuredClone (faster than JSON.parse/stringify)
    const state: HistoryState = {
      nodes: deepClone(nodes),
      edges: deepClone(edges),
    }

    history.value.push(state)

    // Limit history size
    if (history.value.length > maxHistorySize) {
      history.value.shift()
      // Keep historyIndex pointing to the same logical position
      // Don't decrement below 0
      historyIndex.value = Math.max(0, history.value.length - 1)
    } else {
      historyIndex.value = history.value.length - 1
    }
  }

  // Undo - returns the state to restore, or null if can't undo
  const undo = (): HistoryState | null => {
    if (!canUndo.value) return null

    isUndoRedoAction.value = true
    historyIndex.value--
    const state = history.value[historyIndex.value]
    isUndoRedoAction.value = false

    if (state) {
      return {
        nodes: deepClone(state.nodes),
        edges: deepClone(state.edges),
      }
    }
    return null
  }

  // Redo - returns the state to restore, or null if can't redo
  const redo = (): HistoryState | null => {
    if (!canRedo.value) return null

    isUndoRedoAction.value = true
    historyIndex.value++
    const state = history.value[historyIndex.value]
    isUndoRedoAction.value = false

    if (state) {
      return {
        nodes: deepClone(state.nodes),
        edges: deepClone(state.edges),
      }
    }
    return null
  }

  // Reset history
  const resetHistory = () => {
    history.value = [{ nodes: [], edges: [] }]
    historyIndex.value = 0
  }

  // Check if currently in undo/redo action
  const isInUndoRedo = () => isUndoRedoAction.value

  return {
    canUndo,
    canRedo,
    saveToHistory,
    undo,
    redo,
    resetHistory,
    isInUndoRedo,
  }
}
