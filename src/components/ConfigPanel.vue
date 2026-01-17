<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useWorkflowStore } from '../stores/workflow'
import type { 
  StartNodeConfig, 
  TransformNodeConfig, 
  ConditionNodeConfig,
  TransformOperation,
  ConditionOperator 
} from '../types/workflow'
import { CloseIcon, ClockIcon, TrashIcon } from '../assets/icons'

const store = useWorkflowStore()

const selectedNode = computed(() => store.selectedNode)

// Local state for editing
const localLabel = ref('')
const localPayload = ref('')
const localOperation = ref<TransformOperation>('uppercase')
const localField = ref('')
const localValue = ref('')
const localOperator = ref<ConditionOperator>('equals')
const localConditionValue = ref('')
const localConditionField = ref('')

const payloadError = ref('')

// Transform operations
const transformOperations: { value: TransformOperation; label: string }[] = [
  { value: 'uppercase', label: 'To Uppercase' },
  { value: 'lowercase', label: 'To Lowercase' },
  { value: 'append', label: 'Append Text' },
  { value: 'prepend', label: 'Prepend Text' },
  { value: 'multiply', label: 'Multiply Number' },
  { value: 'add', label: 'Add Number' },
  { value: 'replace', label: 'Replace Value' }
]

// Condition operators
const conditionOperators: { value: ConditionOperator; label: string }[] = [
  { value: 'equals', label: 'Equals' },
  { value: 'notEquals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'greaterThan', label: 'Greater Than' },
  { value: 'lessThan', label: 'Less Than' },
  { value: 'greaterThanOrEqual', label: 'Greater Than or Equal' },
  { value: 'lessThanOrEqual', label: 'Less Than or Equal' },
  { value: 'isEmpty', label: 'Is Empty' },
  { value: 'isNotEmpty', label: 'Is Not Empty' },
  { value: 'isEven', label: 'Is Even Number' },
  { value: 'isOdd', label: 'Is Odd Number' },
  { value: 'isDivisibleBy', label: 'Is Divisible By' }
]

// Watch for selected node changes
watch(selectedNode, (node) => {
  if (node) {
    localLabel.value = node.data.label
    
    switch (node.data.nodeType) {
      case 'start': {
        const config = node.data.config as StartNodeConfig
        localPayload.value = JSON.stringify(config.payload, null, 2)
        payloadError.value = ''
        break
      }
      case 'transform': {
        const config = node.data.config as TransformNodeConfig
        localOperation.value = config.operation
        localField.value = config.field
        localValue.value = String(config.value || '')
        break
      }
      case 'condition': {
        const config = node.data.config as ConditionNodeConfig
        localConditionField.value = config.field
        localOperator.value = config.operator
        localConditionValue.value = String(config.value || '')
        break
      }
    }
  }
}, { immediate: true })

// Update handlers
const updateLabel = () => {
  if (selectedNode.value) {
    store.updateNodeLabel(selectedNode.value.id, localLabel.value)
  }
}

const updateStartPayload = () => {
  if (selectedNode.value) {
    try {
      const payload = JSON.parse(localPayload.value)
      store.updateNodeConfig(selectedNode.value.id, { payload })
      payloadError.value = ''
    } catch {
      payloadError.value = 'Invalid JSON format'
    }
  }
}

const updateTransformConfig = () => {
  if (selectedNode.value) {
    store.updateNodeConfig(selectedNode.value.id, {
      operation: localOperation.value,
      field: localField.value,
      value: localValue.value
    })
  }
}

const updateConditionConfig = () => {
  if (selectedNode.value) {
    store.updateNodeConfig(selectedNode.value.id, {
      field: localConditionField.value,
      operator: localOperator.value,
      value: localConditionValue.value
    })
  }
}

const deleteNode = () => {
  if (selectedNode.value) {
    store.removeNode(selectedNode.value.id)
  }
}

const closePanel = () => {
  store.selectNode(null)
}
</script>

<template>
  <div class="config-panel" v-if="selectedNode">
    <div class="panel-header">
      <div class="header-content">
        <h2>Configure Node</h2>
        <span class="node-type-badge" :class="selectedNode.data.nodeType">
          {{ selectedNode.data.nodeType }}
        </span>
      </div>
      <button class="close-btn" @click="closePanel">
        <CloseIcon :size="20" />
      </button>
    </div>
    
    <div class="panel-content">
      <!-- Common: Label -->
      <div class="form-group">
        <label>Node Label</label>
        <input 
          type="text" 
          v-model="localLabel"
          @change="updateLabel"
          placeholder="Enter node label"
        />
      </div>
      
      <!-- Start Node Config -->
      <template v-if="selectedNode.data.nodeType === 'start'">
        <div class="form-group">
          <label>Input Payload (JSON)</label>
          <textarea 
            v-model="localPayload"
            @change="updateStartPayload"
            rows="8"
            placeholder='{"message": "Hello World"}'
          ></textarea>
          <span v-if="payloadError" class="error-text">{{ payloadError }}</span>
          <span class="hint-text">Enter the initial data to pass through the workflow</span>
        </div>
      </template>
      
      <!-- Transform Node Config -->
      <template v-if="selectedNode.data.nodeType === 'transform'">
        <div class="form-group">
          <label>Field to Transform</label>
          <input 
            type="text" 
            v-model="localField"
            @change="updateTransformConfig"
            placeholder="e.g., message"
          />
        </div>
        
        <div class="form-group">
          <label>Operation</label>
          <select v-model="localOperation" @change="updateTransformConfig">
            <option 
              v-for="op in transformOperations" 
              :key="op.value" 
              :value="op.value"
            >
              {{ op.label }}
            </option>
          </select>
        </div>
        
        <div class="form-group" v-if="['append', 'prepend', 'multiply', 'add', 'replace'].includes(localOperation)">
          <label>Value</label>
          <input 
            :type="['multiply', 'add'].includes(localOperation) ? 'number' : 'text'"
            v-model="localValue"
            @change="updateTransformConfig"
            :placeholder="['multiply', 'add'].includes(localOperation) ? '0' : 'Enter value'"
          />
        </div>
      </template>
      
      <!-- Condition Node Config -->
      <template v-if="selectedNode.data.nodeType === 'condition'">
        <div class="form-group">
          <label>Field to Check</label>
          <input 
            type="text" 
            v-model="localConditionField"
            @change="updateConditionConfig"
            placeholder="e.g., message"
          />
        </div>
        
        <div class="form-group">
          <label>Condition</label>
          <select v-model="localOperator" @change="updateConditionConfig">
            <option 
              v-for="op in conditionOperators" 
              :key="op.value" 
              :value="op.value"
            >
              {{ op.label }}
            </option>
          </select>
        </div>
        
        <div class="form-group" v-if="!['isEmpty', 'isNotEmpty', 'isEven', 'isOdd'].includes(localOperator)">
          <label>Compare Value</label>
          <input 
            type="text"
            v-model="localConditionValue"
            @change="updateConditionConfig"
            placeholder="Value to compare"
          />
        </div>
        
        <div class="condition-info">
          <div class="branch-indicator true-branch">
            <span class="indicator"></span>
            <span>True → Right output</span>
          </div>
          <div class="branch-indicator false-branch">
            <span class="indicator"></span>
            <span>False → Bottom output</span>
          </div>
        </div>
      </template>
      
      <!-- End Node Config -->
      <template v-if="selectedNode.data.nodeType === 'end'">
        <div class="end-info">
          <ClockIcon :size="40" />
          <p>This node marks the end of a workflow branch.</p>
          <p class="sub-info">The final payload will be displayed in the execution logs when the workflow runs.</p>
        </div>
      </template>
    </div>
    
    <div class="panel-footer">
      <button class="delete-btn" @click="deleteNode">
        <TrashIcon :size="16" />
        Delete Node
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.config-panel {
  width: 320px;
  background: var(--panel-bg);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);

  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.node-type-badge {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: 4px;
  letter-spacing: 0.5px;

  &.start {
    background: rgba(74, 222, 128, 0.2);
    color: #4ade80;
  }

  &.transform {
    background: rgba(167, 139, 250, 0.2);
    color: #a78bfa;
  }

  &.condition {
    background: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
  }

  &.end {
    background: rgba(248, 113, 113, 0.2);
    color: #f87171;
  }
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--hover-bg);
    color: var(--text-primary);
  }
}

.panel-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  input,
  select,
  textarea {
    padding: 10px 12px;
    background: var(--input-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 13px;
    font-family: inherit;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      border-color: var(--accent-color);
      box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1);
    }

    &::placeholder {
      color: var(--text-tertiary);
    }
  }

  textarea {
    font-family: 'Monaco', 'Consolas', monospace;
    resize: vertical;
    min-height: 100px;
  }
}

.error-text {
  font-size: 11px;
  color: #f87171;
}

.hint-text {
  font-size: 11px;
  color: var(--text-tertiary);
}

.condition-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: var(--card-bg);
  border-radius: 8px;
  margin-top: 8px;
}

.branch-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);

  .indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
}

.true-branch .indicator {
  background: #4ade80;
}

.false-branch .indicator {
  background: #f87171;
}

.end-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px;
  color: var(--text-secondary);

  svg {
    margin-bottom: 16px;
    color: #f87171;
  }

  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
  }

  .sub-info {
    margin-top: 8px;
    font-size: 12px;
    color: var(--text-tertiary);
  }
}

.panel-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px;
  background: rgba(248, 113, 113, 0.1);
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: 8px;
  color: #f87171;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(248, 113, 113, 0.2);
    border-color: #f87171;
  }
}
</style>
