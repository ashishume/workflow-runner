<script setup lang="ts">
import { onMounted, watch, computed } from 'vue'
import { useWorkflowStore } from './stores/workflow'
import Toolbar from './components/Toolbar.vue'
import NodePalette from './components/NodePalette.vue'
import WorkflowCanvas from './components/WorkflowCanvas.vue'
import ConfigPanel from './components/ConfigPanel.vue'
import ExecutionLogs from './components/ExecutionLogs.vue'

const store = useWorkflowStore()

const isDarkMode = computed(() => store.isDarkMode)
const hasSelectedNode = computed(() => store.selectedNodeId !== null)

// Apply dark mode class to body
watch(isDarkMode, (dark) => {
  document.documentElement.classList.toggle('light-mode', !dark)
}, { immediate: true })

// Try to load auto-saved workflow on mount
onMounted(() => {
  store.loadAutoSave()
})
</script>

<template>
  <div class="app" :class="{ 'dark-mode': isDarkMode }">
    <Toolbar />
    <div class="main-content">
      <NodePalette />
      <div class="canvas-container">
        <WorkflowCanvas />
        <ExecutionLogs />
      </div>
      <ConfigPanel v-if="hasSelectedNode" />
    </div>
  </div>
</template>

<style scoped>
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
