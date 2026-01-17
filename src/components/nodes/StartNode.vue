<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { computed } from 'vue'
import type { StartNodeConfig } from '../../types/workflow'
import { PlayIcon } from '../../assets/icons'

const props = defineProps<{
  id: string
  data: {
    label: string
    config: StartNodeConfig
    nodeType: string
  }
  selected: boolean
}>()

const payloadPreview = computed(() => {
  try {
    const str = JSON.stringify(props.data.config.payload)
    return str.length > 30 ? str.substring(0, 30) + '...' : str
  } catch {
    return '{}'
  }
})
</script>

<template>
  <div 
    class="node start-node"
    :class="{ selected }"
  >
    <div class="node-header">
      <div class="node-icon">
        <PlayIcon :size="16" />
      </div>
      <span class="node-title">{{ data.label }}</span>
    </div>
    <div class="node-content">
      <div class="payload-preview">{{ payloadPreview }}</div>
    </div>
    <Handle 
      type="source" 
      :position="Position.Right" 
      class="handle handle-source"
    />
  </div>
</template>

<style scoped>
.node {
  background: var(--node-bg, #1a1a2e);
  border: 2px solid var(--node-border, #16213e);
  border-radius: 12px;
  min-width: 180px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.node:hover {
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4);
  transform: translateY(-2px);
}

.node.selected {
  border-color: var(--accent-color, #00d4ff);
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
}

.start-node {
  --node-bg: linear-gradient(135deg, #1a472a 0%, #0d3320 100%);
  --node-border: #2d8a4e;
  background: var(--node-bg);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.node-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: rgba(45, 138, 78, 0.5);
  border-radius: 6px;
  color: #4ade80;
}

.node-title {
  font-weight: 600;
  color: #fff;
  font-size: 13px;
  letter-spacing: 0.3px;
}

.node-content {
  padding: 10px 14px;
}

.payload-preview {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  font-family: 'Monaco', 'Consolas', monospace;
  background: rgba(0, 0, 0, 0.2);
  padding: 6px 8px;
  border-radius: 4px;
  word-break: break-all;
}

.handle {
  width: 12px;
  height: 12px;
  background: #4ade80;
  border: 2px solid #fff;
  border-radius: 50%;
}

.handle-source {
  right: -6px;
}
</style>
