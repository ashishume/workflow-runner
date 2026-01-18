<script setup lang="ts">
  import { computed } from 'vue'

  import { Handle, Position } from '@vue-flow/core'

  import { PlayIcon } from '../../assets/icons'
  import type { StartNodeConfig } from '../../types/workflow'

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
  <div class="node start-node" :class="{ selected }">
    <div class="node-header">
      <div class="node-icon">
        <PlayIcon :size="16" />
      </div>
      <span class="node-title">{{ data.label }}</span>
    </div>
    <div class="node-content">
      <div class="payload-preview">{{ payloadPreview }}</div>
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

  .start-node {
    --node-bg: linear-gradient(
      135deg,
      var(--node-start-gradient-start) 0%,
      var(--node-start-gradient-end) 100%
    );
    --node-border: var(--node-start-border);
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
    background: var(--node-start-icon-bg);
    border-radius: 6px;
    color: var(--node-start-primary);
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

  .payload-preview {
    font-size: 11px;
    color: var(--text-secondary);
    font-family: 'Monaco', 'Consolas', monospace;
    background: var(--overlay-darkest);
    padding: 6px 8px;
    border-radius: 4px;
    word-break: break-all;
  }

  .handle {
    width: 12px;
    height: 12px;
    background: var(--node-start-primary);
    border: 2px solid var(--text-on-dark);
    border-radius: 50%;
  }

  .handle-source {
    right: -6px;
  }
</style>
