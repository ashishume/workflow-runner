<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { EndNodeConfig } from '../../types/workflow'
import { StopIcon } from '../../assets/icons'

defineProps<{
  id: string
  data: {
    label: string
    config: EndNodeConfig
    nodeType: string
  }
  selected: boolean
}>()
</script>

<template>
  <div 
    class="node end-node"
    :class="{ selected }"
  >
    <Handle 
      type="target" 
      :position="Position.Left" 
      class="handle handle-target"
    />
    <div class="node-header">
      <div class="node-icon">
        <StopIcon :size="16" />
      </div>
      <span class="node-title">{{ data.label }}</span>
    </div>
    <div class="node-content">
      <div class="end-label">Workflow ends here</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.node {
  background: var(--node-bg, #1a1a2e);
  border: 2px solid var(--node-border, #16213e);
  border-radius: 12px;
  min-width: 180px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4);
    transform: translateY(-2px);
  }

  &.selected {
    border-color: var(--accent-color, #00d4ff);
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.3);
  }
}

.end-node {
  --node-bg: linear-gradient(135deg, #4a1c2e 0%, #2d101b 100%);
  --node-border: #dc2626;
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
  background: rgba(220, 38, 38, 0.5);
  border-radius: 6px;
  color: #f87171;
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

.end-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

.handle {
  width: 12px;
  height: 12px;
  border: 2px solid #fff;
  border-radius: 50%;
}

.handle-target {
  left: -6px;
  background: #f87171;
}
</style>
