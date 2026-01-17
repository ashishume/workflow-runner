import { ref } from 'vue'

import { useDebounceFn } from '@vueuse/core'

import type { WorkflowState } from '../types/workflow'
import { validateImportedWorkflow } from '../utils/validation'

export interface UseWorkflowPersistenceOptions {
  storageKey?: string
  debounceMs?: number
}

export function useWorkflowPersistence(options: UseWorkflowPersistenceOptions = {}) {
  const { storageKey = 'workflow-autosave', debounceMs = 500 } = options

  // Last saved timestamp for UI indicator
  const lastSavedAt = ref<number | null>(null)

  // Internal save function
  const _saveToStorage = (state: WorkflowState) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state))
      lastSavedAt.value = Date.now()
    } catch (error) {
      console.error('Failed to save workflow to localStorage:', error)
    }
  }

  // Debounced auto-save function
  const autoSave = useDebounceFn((state: WorkflowState) => {
    _saveToStorage(state)
  }, debounceMs)

  // Load from storage
  const loadFromStorage = (): WorkflowState | null => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const state = JSON.parse(saved) as WorkflowState
        // Validate before returning
        const validation = validateImportedWorkflow(state)
        if (validation.valid) {
          return state
        }
        console.warn('Invalid workflow in storage:', validation.errors)
      }
    } catch (error) {
      console.error('Failed to load workflow from localStorage:', error)
    }
    return null
  }

  // Clear storage
  const clearStorage = () => {
    try {
      localStorage.removeItem(storageKey)
      lastSavedAt.value = null
    } catch (error) {
      console.error('Failed to clear workflow from localStorage:', error)
    }
  }

  // Export workflow to JSON string
  const exportToJson = (state: WorkflowState): string => {
    return JSON.stringify(state, null, 2)
  }

  // Import workflow from JSON string
  const importFromJson = (
    jsonString: string
  ): { success: boolean; state?: WorkflowState; errors: string[] } => {
    try {
      const state = JSON.parse(jsonString) as WorkflowState
      const validation = validateImportedWorkflow(state)

      if (!validation.valid) {
        return { success: false, errors: validation.errors }
      }

      return { success: true, state, errors: [] }
    } catch (error) {
      const message = error instanceof SyntaxError ? `Invalid JSON: ${error.message}` : 'Invalid JSON format'
      return { success: false, errors: [message] }
    }
  }

  // Download workflow as file
  const downloadAsFile = (state: WorkflowState, filename?: string) => {
    const json = exportToJson(state)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename ?? `workflow-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return {
    lastSavedAt,
    autoSave,
    loadFromStorage,
    clearStorage,
    exportToJson,
    importFromJson,
    downloadAsFile,
  }
}
