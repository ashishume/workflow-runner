<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWorkflowStore } from '../stores/workflow'
import type { WorkflowState } from '../types/workflow'

const store = useWorkflowStore()

const isExportModalOpen = ref(false)
const isImportModalOpen = ref(false)
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

// Run workflow
const runWorkflow = () => {
  store.executeWorkflow()
}

// Undo/Redo
const undo = () => store.undo()
const redo = () => store.redo()

// Clear workflow
const clearWorkflow = () => {
  if (confirm('Are you sure you want to clear the workflow?')) {
    store.clearWorkflow()
  }
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
    alert('Copied to clipboard!')
  } catch {
    alert('Failed to copy. Please select and copy manually.')
  }
}

const downloadJson = () => {
  const blob = new Blob([exportedJson.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `workflow-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
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
      importError.value = result.errors.length > 0 
        ? result.errors.join('\n') 
        : 'Invalid workflow structure'
      return
    }
    
    closeImportModal()
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

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
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
}

// Register keyboard shortcuts
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeydown)
}
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <div class="logo">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 3v12"></path>
          <circle cx="18" cy="6" r="3"></circle>
          <circle cx="6" cy="18" r="3"></circle>
          <path d="M18 9a9 9 0 0 1-9 9"></path>
        </svg>
        <span>Workflow Builder</span>
      </div>
      <div v-if="lastSavedText" class="autosave-indicator">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        <span>{{ lastSavedText }}</span>
      </div>
    </div>
    
    <div class="toolbar-center">
      <div class="button-group">
        <button 
          class="toolbar-btn" 
          @click="undo" 
          :disabled="!canUndo"
          title="Undo (Ctrl+Z)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 7v6h6"></path>
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path>
          </svg>
        </button>
        <button 
          class="toolbar-btn" 
          @click="redo" 
          :disabled="!canRedo"
          title="Redo (Ctrl+Y)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 7v6h-6"></path>
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"></path>
          </svg>
        </button>
      </div>
      
      <div class="separator"></div>
      
      <button 
        class="toolbar-btn run-btn" 
        @click="runWorkflow"
        :disabled="isExecuting || !hasNodes"
        title="Run Workflow"
      >
        <svg v-if="!isExecuting" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        <svg v-else class="spinner" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="2" x2="12" y2="6"></line>
          <line x1="12" y1="18" x2="12" y2="22"></line>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
          <line x1="2" y1="12" x2="6" y2="12"></line>
          <line x1="18" y1="12" x2="22" y2="12"></line>
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
        </svg>
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
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <span>Export</span>
        </button>
        <button 
          class="toolbar-btn" 
          @click="openImportModal"
          title="Import Workflow (Ctrl+I)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          <span>Import</span>
        </button>
      </div>
      
      <div class="separator"></div>
      
      <button 
        class="toolbar-btn danger" 
        @click="clearWorkflow"
        :disabled="!hasNodes"
        title="Clear Workflow"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        <span>Clear</span>
      </button>
    </div>
    
    <div class="toolbar-right">
      <button 
        class="toolbar-btn icon-only" 
        @click="toggleDarkMode"
        :title="isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
      >
        <svg v-if="isDarkMode" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      </button>
    </div>
  </div>
  
  <!-- Export Modal -->
  <Teleport to="body">
    <div v-if="isExportModalOpen" class="modal-overlay" @click="closeExportModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>Export Workflow</h2>
          <button class="close-btn" @click="closeExportModal">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <textarea 
            class="json-textarea" 
            :value="exportedJson" 
            readonly
          ></textarea>
        </div>
        <div class="modal-footer">
          <button class="btn secondary" @click="copyToClipboard">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy
          </button>
          <button class="btn primary" @click="downloadJson">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
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
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="file-upload">
            <input 
              type="file" 
              accept=".json"
              @change="handleFileUpload"
              id="file-upload"
            />
            <label for="file-upload" class="file-upload-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
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
          <button 
            class="btn primary" 
            @click="importWorkflow"
            :disabled="!importJson.trim()"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
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
}

.logo span {
  font-weight: 700;
  font-size: 15px;
  color: var(--text-primary);
  letter-spacing: -0.3px;
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
}

.button-group .toolbar-btn {
  border-radius: 0;
  border: none;
}

.button-group .toolbar-btn:not(:last-child) {
  border-right: 1px solid var(--border-color);
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
}

.toolbar-btn:hover:not(:disabled) {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-btn.icon-only {
  padding: 8px;
}

.toolbar-btn.run-btn {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: #000;
  font-weight: 600;
}

.toolbar-btn.run-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--accent-color) 80%, white);
}

.toolbar-btn.danger:hover:not(:disabled) {
  background: rgba(248, 113, 113, 0.1);
  border-color: rgba(248, 113, 113, 0.3);
  color: #f87171;
}

.separator {
  width: 1px;
  height: 24px;
  background: var(--border-color);
  margin: 0 4px;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Modal Styles */
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
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
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
}

.close-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
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
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 12px;
  resize: vertical;
}

.json-textarea:focus {
  outline: none;
  border-color: var(--accent-color);
}

.file-upload {
  display: flex;
  justify-content: center;
}

.file-upload input {
  display: none;
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
}

.file-upload-label:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
}

.divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 16px 0;
  color: var(--text-tertiary);
  font-size: 12px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

.error-text {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #f87171;
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
}

.btn.primary {
  background: var(--accent-color);
  border: none;
  color: #000;
}

.btn.primary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--accent-color) 80%, white);
}

.btn.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn.secondary {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.btn.secondary:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}
</style>
