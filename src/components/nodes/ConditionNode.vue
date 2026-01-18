<script setup lang="ts">
  import { computed } from 'vue'

  import { Handle, Position } from '@vue-flow/core'

  import { BranchIcon } from '../../assets/icons'
  import type { ConditionNodeConfig } from '../../types/workflow'

  const props = defineProps<{
    id: string
    data: {
      label: string
      config: ConditionNodeConfig
      nodeType: string
    }
    selected: boolean
  }>()

  const conditionLabel = computed(() => {
    const config = props.data.config
    const opLabels: Record<string, string> = {
      equals: '==',
      notEquals: '!=',
      contains: 'contains',
      greaterThan: '>',
      lessThan: '<',
      greaterThanOrEqual: '>=',
      lessThanOrEqual: '<=',
      isEmpty: 'is empty',
      isNotEmpty: 'is not empty',
      isEven: 'is even',
      isOdd: 'is odd',
      isDivisibleBy: '% =',
    }

    // Operators that don't need a value
    if (['isEmpty', 'isNotEmpty', 'isEven', 'isOdd'].includes(config.operator)) {
      return `${config.field} ${opLabels[config.operator]}`
    }
    // Special display for divisibility
    if (config.operator === 'isDivisibleBy') {
      return `${config.field} % ${config.value} == 0`
    }
    return `${config.field} ${opLabels[config.operator]} "${config.value}"`
  })
</script>

<template>
  <div class="node condition-node" :class="{ selected }">
    <Handle type="target" :position="Position.Left" class="handle handle-target" />
    <div class="node-header">
      <div class="node-icon">
        <BranchIcon :size="16" />
      </div>
      <span class="node-title">{{ data.label }}</span>
    </div>
    <div class="node-content">
      <div class="condition-preview">{{ conditionLabel }}</div>
    </div>
    <div class="output-handles">
      <div class="output-handle-wrapper true-handle">
        <span class="handle-label">True</span>
        <Handle
          id="true"
          type="source"
          :position="Position.Right"
          class="handle handle-source handle-true"
        />
      </div>
      <div class="output-handle-wrapper false-handle">
        <span class="handle-label">False</span>
        <Handle
          id="false"
          type="source"
          :position="Position.Right"
          class="handle handle-source handle-false"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .node {
    background: var(--node-bg, var(--card-bg));
    border: 2px solid var(--node-border, var(--border-color));
    border-radius: 12px;
    min-width: 200px;
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

  .condition-node {
    --node-bg: linear-gradient(
      135deg,
      var(--node-condition-gradient-start) 0%,
      var(--node-condition-gradient-end) 100%
    );
    --node-border: var(--node-condition-border);
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
    background: var(--node-condition-icon-bg);
    border-radius: 6px;
    color: var(--node-condition-primary);
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

  .condition-preview {
    font-size: 11px;
    color: var(--text-secondary);
    font-family: 'Monaco', 'Consolas', monospace;
    background: var(--overlay-darkest);
    padding: 6px 8px;
    border-radius: 4px;
  }

  .output-handles {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px 14px 12px;
  }

  .output-handle-wrapper {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    position: relative;
  }

  .handle-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .true-handle .handle-label {
    color: var(--status-success);
  }

  .false-handle .handle-label {
    color: var(--status-error);
  }

  .handle {
    width: 12px;
    height: 12px;
    border: 2px solid var(--text-on-dark);
    border-radius: 50%;
    position: relative !important;
    transform: none !important;
    right: auto !important;
    top: auto !important;
  }

  .handle-target {
    left: -6px;
    background: var(--node-condition-primary);
    position: absolute !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
  }

  .handle-true {
    background: var(--status-success);
  }

  .handle-false {
    background: var(--status-error);
  }
</style>
