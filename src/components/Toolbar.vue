<script setup lang="ts">
  import { computed, ref } from 'vue'

  import { useEventListener } from '@vueuse/core'

  import {
    CloseIcon,
    CopyIcon,
    DownloadIcon,
    ExportIcon,
    ImportIcon,
    MoonIcon,
    PlayIcon,
    RedoIcon,
    SaveIcon,
    SpinnerIcon,
    SunIcon,
    TrashIcon,
    UndoIcon,
    WorkflowIcon,
  } from '../assets/icons'
  import { useToast } from '../composables/useToast'
  import { useWorkflowStore } from '../stores/workflow'
  import type { WorkflowState } from '../types/workflow'
  import ConfirmModal from './ConfirmModal.vue'

  const store = useWorkflowStore()
  const toast = useToast()

  const isExportModalOpen = ref(false)
  const isImportModalOpen = ref(false)
  const isConfirmClearOpen = ref(false)
  const exportedJson = ref('')
  const importJson = ref('')
  const importError = ref('')

  const canUndo = computed(() => store.canUndo)
  const canRedo = computed(() => store.canRedo)
  const isExecuting = computed(() => store.isExecuting)
  const isDarkMode = computed(() => store.isDarkMode)
  const hasNodes = computed(() => store.nodes.length > 0)
  const lastSavedAt = computed(() => store.lastSavedAt)

  // Format time since last save
  const lastSavedText = computed(() => {
    if (!lastSavedAt.value) return ''
    const now = Date.now()
    const diff = now - lastSavedAt.value
    if (diff < 5000) return 'Saved just now'
    if (diff < 60000) return `Saved ${Math.floor(diff / 1000)}s ago`
    if (diff < 3600000) return `Saved ${Math.floor(diff / 60000)}m ago`
    return 'Saved'
  })

  // Run workflow with validation
  const runWorkflow = () => {
    // Validate workflow before execution
    const validation = store.getWorkflowValidation()

    // Show errors as toast notifications
    if (validation.errors.length > 0) {
      validation.errors.forEach((error) => {
        toast.error(error, 5000)
      })
      return // Don't execute if there are errors
    }

    // Show warnings as toast notifications (but still execute)
    if (validation.warnings.length > 0) {
      validation.warnings.forEach((warning) => {
        toast.warning(warning, 4000)
      })
    }

    store.executeWorkflow()
  }

  // Undo/Redo
  const undo = () => store.undo()
  const redo = () => store.redo()

  // Clear workflow
  const openClearConfirm = () => {
    isConfirmClearOpen.value = true
  }

  const confirmClear = () => {
    store.clearWorkflow()
    isConfirmClearOpen.value = false
    toast.success('Workflow cleared')
  }

  const cancelClear = () => {
    isConfirmClearOpen.value = false
  }

  // Export workflow
  const openExportModal = () => {
    const state = store.exportWorkflow()
    exportedJson.value = JSON.stringify(state, null, 2)
    isExportModalOpen.value = true
  }

  const closeExportModal = () => {
    isExportModalOpen.value = false
    exportedJson.value = ''
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportedJson.value)
      toast.success('Copied to clipboard!')
    } catch {
      toast.error('Failed to copy. Please select and copy manually.')
    }
  }

  const downloadJson = () => {
    store.downloadWorkflow(store.exportWorkflow())
    toast.success('Workflow downloaded!')
  }

  // Import workflow
  const openImportModal = () => {
    importJson.value = ''
    importError.value = ''
    isImportModalOpen.value = true
  }

  const closeImportModal = () => {
    isImportModalOpen.value = false
    importJson.value = ''
    importError.value = ''
  }

  const handleFileUpload = (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      importJson.value = e.target?.result as string
      importError.value = ''
    }
    reader.readAsText(file)
  }

  const importWorkflow = () => {
    try {
      const state = JSON.parse(importJson.value) as WorkflowState

      // Use store's validated import
      const result = store.importWorkflow(state)

      if (!result.success) {
        // Show detailed errors
        importError.value =
          result.errors.length > 0 ? result.errors.join('\n') : 'Invalid workflow structure'
        return
      }

      closeImportModal()
      toast.success('Workflow imported successfully!')
    } catch (error) {
      if (error instanceof SyntaxError) {
        importError.value = `Invalid JSON: ${error.message}`
      } else {
        importError.value = error instanceof Error ? error.message : 'Invalid JSON format'
      }
    }
  }

  // Toggle dark mode
  const toggleDarkMode = () => {
    store.toggleDarkMode()
  }

  // Keyboard shortcuts handler
  const handleKeydown = (event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return
    }

    if (event.metaKey || event.ctrlKey) {
      if (event.key === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo()
      } else if ((event.key === 'z' && event.shiftKey) || event.key === 'y') {
        event.preventDefault()
        redo()
      } else if (event.key === 'e') {
        event.preventDefault()
        openExportModal()
      } else if (event.key === 'i') {
        event.preventDefault()
        openImportModal()
      }
    }

    // Delete selected node
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (store.selectedNodeId) {
        event.preventDefault()
        store.removeNode(store.selectedNodeId)
        toast.info('Node deleted')
      }
    }

    // Escape to deselect
    if (event.key === 'Escape') {
      if (store.selectedNodeId) {
        store.selectNode(null)
      }
      // Close any open modals
      if (isExportModalOpen.value) closeExportModal()
      if (isImportModalOpen.value) closeImportModal()
      if (isConfirmClearOpen.value) cancelClear()
    }
  }

  // Use vueuse's useEventListener for automatic cleanup
  useEventListener(window, 'keydown', handleKeydown)
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <div class="logo">
        <WorkflowIcon :size="24" />
        <span>Workflow Builder</span>
      </div>
      <div v-if="lastSavedText" class="autosave-indicator">
        <SaveIcon :size="14" />
        <span>{{ lastSavedText }}</span>
      </div>
    </div>

    <div class="toolbar-center">
      <div class="button-group">
        <button class="toolbar-btn" @click="undo" :disabled="!canUndo" title="Undo (Ctrl+Z)">
          <UndoIcon :size="18" />
        </button>
        <button class="toolbar-btn" @click="redo" :disabled="!canRedo" title="Redo (Ctrl+Y)">
          <RedoIcon :size="18" />
        </button>
      </div>

      <div class="separator"></div>

      <button
        class="toolbar-btn run-btn"
        @click="runWorkflow"
        :disabled="isExecuting || !hasNodes"
        title="Run Workflow"
      >
        <PlayIcon v-if="!isExecuting" :size="18" />
        <SpinnerIcon v-else :size="18" />
        <span>{{ isExecuting ? 'Running...' : 'Run' }}</span>
      </button>

      <div class="separator"></div>

      <div class="button-group">
        <button
          class="toolbar-btn"
          @click="openExportModal"
          :disabled="!hasNodes"
          title="Export Workflow (Ctrl+E)"
        >
          <ExportIcon :size="18" />
          <span>Export</span>
        </button>
        <button class="toolbar-btn" @click="openImportModal" title="Import Workflow (Ctrl+I)">
          <ImportIcon :size="18" />
          <span>Import</span>
        </button>
      </div>

      <div class="separator"></div>

      <button
        class="toolbar-btn danger"
        @click="openClearConfirm"
        :disabled="!hasNodes"
        title="Clear Workflow"
      >
        <TrashIcon :size="18" />
        <span>Clear</span>
      </button>
    </div>

    <div class="toolbar-right">
      <button
        class="toolbar-btn icon-only"
        @click="toggleDarkMode"
        :title="isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
      >
        <SunIcon v-if="isDarkMode" :size="18" />
        <MoonIcon v-else :size="18" />
      </button>
    </div>
  </div>

  <!-- Confirm Clear Modal -->
  <ConfirmModal
    v-if="isConfirmClearOpen"
    title="Clear Workflow"
    message="Are you sure you want to clear the workflow? This action cannot be undone."
    confirm-text="Clear"
    confirm-variant="danger"
    @confirm="confirmClear"
    @cancel="cancelClear"
  />

  <!-- Export Modal -->
  <Teleport to="body">
    <div v-if="isExportModalOpen" class="modal-overlay" @click="closeExportModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>Export Workflow</h2>
          <button class="close-btn" @click="closeExportModal">
            <CloseIcon :size="20" />
          </button>
        </div>
        <div class="modal-body">
          <textarea class="json-textarea" :value="exportedJson" readonly></textarea>
        </div>
        <div class="modal-footer">
          <button class="btn secondary" @click="copyToClipboard">
            <CopyIcon :size="16" />
            Copy
          </button>
          <button class="btn primary" @click="downloadJson">
            <DownloadIcon :size="16" />
            Download JSON
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Import Modal -->
  <Teleport to="body">
    <div v-if="isImportModalOpen" class="modal-overlay" @click="closeImportModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>Import Workflow</h2>
          <button class="close-btn" @click="closeImportModal">
            <CloseIcon :size="20" />
          </button>
        </div>
        <div class="modal-body">
          <div class="file-upload">
            <input type="file" accept=".json" @change="handleFileUpload" id="file-upload" />
            <label for="file-upload" class="file-upload-label">
              <ExportIcon :size="24" />
              <span>Upload JSON file</span>
            </label>
          </div>
          <div class="divider">
            <span>or paste JSON</span>
          </div>
          <textarea
            class="json-textarea"
            v-model="importJson"
            placeholder='{"nodes": [...], "edges": [...]}'
          ></textarea>
          <span v-if="importError" class="error-text">{{ importError }}</span>
        </div>
        <div class="modal-footer">
          <button class="btn secondary" @click="closeImportModal">Cancel</button>
          <button class="btn primary" @click="importWorkflow" :disabled="!importJson.trim()">
            Import
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background: var(--toolbar-bg);
    border-bottom: 1px solid var(--border-color);
    gap: 16px;
  }

  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
  }

  .toolbar-center {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--accent-color);

    span {
      font-weight: 700;
      font-size: 15px;
      color: var(--text-primary);
      letter-spacing: -0.3px;
    }
  }

  .autosave-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: 16px;
    padding: 4px 10px;
    background: rgba(74, 222, 128, 0.1);
    border: 1px solid rgba(74, 222, 128, 0.2);
    border-radius: 6px;
    color: #4ade80;
    font-size: 11px;
    font-weight: 500;
  }

  .button-group {
    display: flex;
    align-items: center;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;

    .toolbar-btn {
      border-radius: 0;
      border: none;

      &:not(:last-child) {
        border-right: 1px solid var(--border-color);
      }
    }
  }

  .toolbar-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;

    &:hover:not(:disabled) {
      background: var(--hover-bg);
      color: var(--text-primary);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &.icon-only {
      padding: 8px;
    }

    &.run-btn {
      background: var(--accent-color);
      border-color: var(--accent-color);
      color: #000;
      font-weight: 600;

      &:hover:not(:disabled) {
        background: color-mix(in srgb, var(--accent-color) 80%, white);
      }
    }

    &.danger:hover:not(:disabled) {
      background: rgba(248, 113, 113, 0.1);
      border-color: rgba(248, 113, 113, 0.3);
      color: #f87171;
    }
  }

  .separator {
    width: 1px;
    height: 24px;
    background: var(--border-color);
    margin: 0 4px;
  }

  // Modal Styles
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }

  .modal {
    background: var(--panel-bg);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color);

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: var(--hover-bg);
      color: var(--text-primary);
    }
  }

  .modal-body {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
  }

  .json-textarea {
    width: 100%;
    min-height: 300px;
    padding: 12px;
    background: var(--input-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-primary);
    font-family: 'JetBrains Mono', 'Monaco', 'Consolas', monospace;
    font-size: 12px;
    resize: vertical;

    &:focus {
      outline: none;
      border-color: var(--accent-color);
    }
  }

  .file-upload {
    display: flex;
    justify-content: center;

    input {
      display: none;
    }
  }

  .file-upload-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px 48px;
    border: 2px dashed var(--border-color);
    border-radius: 8px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--accent-color);
      color: var(--accent-color);
    }
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 16px;
    margin: 16px 0;
    color: var(--text-tertiary);
    font-size: 12px;

    &::before,
    &::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border-color);
    }
  }

  .error-text {
    display: block;
    margin-top: 8px;
    font-size: 12px;
    color: #f87171;
    white-space: pre-wrap;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid var(--border-color);
  }

  .btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &.primary {
      background: var(--accent-color);
      border: none;
      color: #000;

      &:hover:not(:disabled) {
        background: color-mix(in srgb, var(--accent-color) 80%, white);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    &.secondary {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);

      &:hover {
        background: var(--hover-bg);
        color: var(--text-primary);
      }
    }
  }
</style>
