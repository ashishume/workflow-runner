<script setup lang="ts">
  import { computed, onMounted } from 'vue'

  import RHSConfigPanel from './components/RHSConfigPanel.vue'
  import ExecutionLogs from './components/ExecutionLogs.vue'
  import LHSNodePalette from './components/LHSNodePalette.vue'
  import ToastContainer from './components/ToastContainer.vue'
  import Toolbar from './components/Toolbar.vue'
  import WorkflowCanvas from './components/WorkflowCanvas.vue'
  import { useWorkflowStore } from './stores/workflow'

  const store = useWorkflowStore()

  const isDarkMode = computed(() => store.isDarkMode)
  const hasSelectedNode = computed(() => store.selectedNodeId !== null)

  // Try to load auto-saved workflow on mount
  onMounted(() => {
    store.loadAutoSave()
  })
</script>

<template>
  <div class="app" :class="{ 'dark-mode': isDarkMode }">
    <Toolbar />
    <div class="main-content">
      <LHSNodePalette />
      <div class="canvas-container">
        <WorkflowCanvas />
        <ExecutionLogs />
      </div>
      <RHSConfigPanel v-if="hasSelectedNode" />
    </div>
  </div>

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
</style>
