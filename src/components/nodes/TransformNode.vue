<script setup lang="ts">
  import { computed } from 'vue'

  import { Handle, Position } from '@vue-flow/core'

  import { TransformIcon } from '../../assets/icons'
  import type { TransformNodeConfig } from '../../types/workflow'

  const props = defineProps<{
    id: string
    data: {
      label: string
      config: TransformNodeConfig
      nodeType: string
    }
    selected: boolean
  }>()

  const operationLabel = computed(() => {
    const config = props.data.config
    switch (config.operation) {
      case 'uppercase':
        return `${config.field} → UPPERCASE`
      case 'lowercase':
        return `${config.field} → lowercase`
      case 'append':
        return `${config.field} + "${config.value}"`
      case 'prepend':
        return `"${config.value}" + ${config.field}`
      case 'multiply':
        return `${config.field} × ${config.value}`
      case 'add':
        return `${config.field} + ${config.value}`
      case 'replace':
        return `${config.field} = "${config.value}"`
      default:
        return config.operation
    }
  })
</script>

<template>
  <div class="node transform-node" :class="{ selected }">
    <Handle type="target" :position="Position.Left" class="handle handle-target" />
    <div class="node-header">
      <div class="node-icon">
        <TransformIcon :size="16" />
      </div>
      <span class="node-title">{{ data.label }}</span>
    </div>
    <div class="node-content">
      <div class="operation-preview">{{ operationLabel }}</div>
    </div>
    <Handle type="source" :position="Position.Right" class="handle handle-source" />
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

  .transform-node {
    --node-bg: linear-gradient(135deg, #2d1b4e 0%, #1a0f30 100%);
    --node-border: #7c3aed;
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
    background: rgba(124, 58, 237, 0.5);
    border-radius: 6px;
    color: #a78bfa;
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

  .operation-preview {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.6);
    font-family: 'Monaco', 'Consolas', monospace;
    background: rgba(0, 0, 0, 0.2);
    padding: 6px 8px;
    border-radius: 4px;
  }

  .handle {
    width: 12px;
    height: 12px;
    border: 2px solid #fff;
    border-radius: 50%;
  }

  .handle-target {
    left: -6px;
    background: #a78bfa;
  }

  .handle-source {
    right: -6px;
    background: #a78bfa;
  }
</style>
