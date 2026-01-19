<script setup lang="ts">
  import { computed, defineAsyncComponent, onMounted } from 'vue'

  import ErrorBoundary from './components/ErrorBoundary.vue'
  import LHSNodePalette from './components/LHSNodePalette.vue'
  import ToastContainer from './components/ToastContainer.vue'
  import WorkflowCanvas from './components/WorkflowCanvas.vue'
  import { useWorkflowStore } from './stores/workflow'

  // Lazy load heavy components
  const RHSConfigPanel = defineAsyncComponent(() => import('./components/RHSConfigPanel.vue'))
  const ExecutionLogs = defineAsyncComponent(() => import('./components/ExecutionLogs.vue'))
  const Toolbar = defineAsyncComponent(() => import('./components/Toolbar.vue'))

  const store = useWorkflowStore()

  const isDarkMode = computed(() => store.isDarkMode)
  const hasSelectedNode = computed(() => store.selectedNodeId !== null)

  // Try to load auto-saved workflow on mount
  onMounted(() => {
    store.loadAutoSave()
  })
</script>

<template>
  <ErrorBoundary>
    <div class="app" :class="{ 'dark-mode': isDarkMode }">
      <Suspense>
        <Toolbar />
        <template #fallback>
          <div class="loading-placeholder">Loading toolbar...</div>
        </template>
      </Suspense>
      <div class="main-content">
        <ErrorBoundary>
          <LHSNodePalette />
        </ErrorBoundary>
        <div class="canvas-container">
          <ErrorBoundary>
            <WorkflowCanvas />
          </ErrorBoundary>
          <Suspense>
            <ExecutionLogs />
            <template #fallback>
              <div class="loading-placeholder">Loading logs...</div>
            </template>
          </Suspense>
        </div>
        <Suspense v-if="hasSelectedNode">
          <RHSConfigPanel />
          <template #fallback>
            <div class="loading-placeholder">Loading config panel...</div>
          </template>
        </Suspense>
      </div>
    </div>
  </ErrorBoundary>

  <!-- Global Toast Container -->
  <ToastContainer />
</template>

<style scoped lang="scss">
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }

  .main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .canvas-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .loading-placeholder {
    padding: 8px 16px;
    font-size: 12px;
    color: var(--text-tertiary);
    text-align: center;
  }
</style>
