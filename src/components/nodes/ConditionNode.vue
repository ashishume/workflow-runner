<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { computed } from 'vue'
import type { ConditionNodeConfig } from '../../types/workflow'
import { BranchIcon } from '../../assets/icons'

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
    'equals': '==',
    'notEquals': '!=',
    'contains': 'contains',
    'greaterThan': '>',
    'lessThan': '<',
    'greaterThanOrEqual': '>=',
    'lessThanOrEqual': '<=',
    'isEmpty': 'is empty',
    'isNotEmpty': 'is not empty',
    'isEven': 'is even',
    'isOdd': 'is odd',
    'isDivisibleBy': '% ='
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
  <div 
    class="node condition-node"
    :class="{ selected }"
  >
    <Handle 
      type="target" 
      :position="Position.Left" 
      class="handle handle-target"
    />
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

<style scoped>
.node {
  background: var(--node-bg, #1a1a2e);
  border: 2px solid var(--node-border, #16213e);
  border-radius: 12px;
  min-width: 200px;
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

.condition-node {
  --node-bg: linear-gradient(135deg, #4a3728 0%, #2d1f16 100%);
  --node-border: #f59e0b;
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
  background: rgba(245, 158, 11, 0.5);
  border-radius: 6px;
  color: #fbbf24;
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

.condition-preview {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  font-family: 'Monaco', 'Consolas', monospace;
  background: rgba(0, 0, 0, 0.2);
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
  color: #4ade80;
}

.false-handle .handle-label {
  color: #f87171;
}

.handle {
  width: 12px;
  height: 12px;
  border: 2px solid #fff;
  border-radius: 50%;
  position: relative !important;
  transform: none !important;
  right: auto !important;
  top: auto !important;
}

.handle-target {
  left: -6px;
  background: #fbbf24;
  position: absolute !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
}

.handle-true {
  background: #4ade80;
}

.handle-false {
  background: #f87171;
}
</style>
