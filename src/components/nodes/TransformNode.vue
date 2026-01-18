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
    background: var(--node-bg, var(--card-bg));
    border: 2px solid var(--node-border, var(--border-color));
    border-radius: 12px;
    min-width: 180px;
    box-shadow: var(--shadow-md);
    transition: all 0.2s ease;

    &:hover {
      box-shadow: var(--shadow-lg);
      transform: translateY(-2px);
    }

    &.selected {
      border-color: var(--accent-color);
      box-shadow: 0 0 20px var(--connection-glow);
    }
  }

  .transform-node {
    --node-bg: linear-gradient(
      135deg,
      var(--node-transform-gradient-start) 0%,
      var(--node-transform-gradient-end) 100%
    );
    --node-border: var(--node-transform-border);
    background: var(--node-bg);
  }

  .node-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--overlay-light);
  }

  .node-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: var(--node-transform-icon-bg);
    border-radius: 6px;
    color: var(--node-transform-primary);
  }

  .node-title {
    font-weight: 600;
    color: var(--text-on-dark);
    font-size: 13px;
    letter-spacing: 0.3px;
  }

  .node-content {
    padding: 10px 14px;
  }

  .operation-preview {
    font-size: 11px;
    color: var(--text-secondary);
    font-family: 'Monaco', 'Consolas', monospace;
    background: var(--overlay-darkest);
    padding: 6px 8px;
    border-radius: 4px;
  }

  .handle {
    width: 12px;
    height: 12px;
    border: 2px solid var(--text-on-dark);
    border-radius: 50%;
  }

  .handle-target {
    left: -6px;
    background: var(--node-transform-primary);
  }

  .handle-source {
    right: -6px;
    background: var(--node-transform-primary);
  }
</style>
