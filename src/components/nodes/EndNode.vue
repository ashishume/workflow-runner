<script setup lang="ts">
  import { Handle, Position } from '@vue-flow/core'

  import { StopIcon } from '../../assets/icons'
  import type { EndNodeConfig } from '../../types/workflow'

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
  <div class="node end-node" :class="{ selected }">
    <Handle type="target" :position="Position.Left" class="handle handle-target" />
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

  .end-node {
    --node-bg: linear-gradient(
      135deg,
      var(--node-end-gradient-start) 0%,
      var(--node-end-gradient-end) 100%
    );
    --node-border: var(--node-end-border);
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
    background: var(--node-end-icon-bg);
    border-radius: 6px;
    color: var(--node-end-primary);
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

  .end-label {
    font-size: 11px;
    color: var(--text-secondary);
    font-style: italic;
  }

  .handle {
    width: 12px;
    height: 12px;
    border: 2px solid var(--text-on-dark);
    border-radius: 50%;
  }

  .handle-target {
    left: -6px;
    background: var(--node-end-primary);
  }
</style>
