<script setup lang="ts">
import { ref } from 'vue'
import type { NodeType } from '../types/workflow'

const emit = defineEmits<{
  dragStart: [type: NodeType, event: DragEvent]
}>()

interface NodeItem {
  type: NodeType
  label: string
  description: string
  icon: string
  color: string
}

const nodes: NodeItem[] = [
  {
    type: 'start',
    label: 'Start',
    description: 'Begin workflow with payload',
    icon: 'play',
    color: '#4ade80'
  },
  {
    type: 'transform',
    label: 'Transform',
    description: 'Modify data fields',
    icon: 'transform',
    color: '#a78bfa'
  },
  {
    type: 'condition',
    label: 'If-Else',
    description: 'Conditional branching',
    icon: 'branch',
    color: '#fbbf24'
  },
  {
    type: 'end',
    label: 'End',
    description: 'Terminate workflow',
    icon: 'stop',
    color: '#f87171'
  }
]

const draggedNode = ref<NodeType | null>(null)

const onDragStart = (event: DragEvent, node: NodeItem) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/workflow-node', node.type)
    event.dataTransfer.effectAllowed = 'move'
  }
  draggedNode.value = node.type
  emit('dragStart', node.type, event)
}

const onDragEnd = () => {
  draggedNode.value = null
}
</script>

<template>
  <div class="node-palette">
    <div class="palette-header">
      <h2>Nodes</h2>
      <p class="palette-hint">Drag to canvas</p>
    </div>
    
    <div class="nodes-list">
      <div
        v-for="node in nodes"
        :key="node.type"
        class="node-item"
        :class="{ dragging: draggedNode === node.type }"
        :style="{ '--node-color': node.color }"
        draggable="true"
        @dragstart="onDragStart($event, node)"
        @dragend="onDragEnd"
      >
        <div class="node-icon">
          <!-- Play Icon -->
          <svg v-if="node.icon === 'play'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          
          <!-- Transform Icon -->
          <svg v-if="node.icon === 'transform'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="16 3 21 3 21 8"></polyline>
            <line x1="4" y1="20" x2="21" y2="3"></line>
            <polyline points="21 16 21 21 16 21"></polyline>
            <line x1="15" y1="15" x2="21" y2="21"></line>
            <line x1="4" y1="4" x2="9" y2="9"></line>
          </svg>
          
          <!-- Branch Icon -->
          <svg v-if="node.icon === 'branch'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="6" y1="3" x2="6" y2="15"></line>
            <circle cx="18" cy="6" r="3"></circle>
            <circle cx="6" cy="18" r="3"></circle>
            <path d="M18 9a9 9 0 0 1-9 9"></path>
          </svg>
          
          <!-- Stop Icon -->
          <svg v-if="node.icon === 'stop'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <rect x="9" y="9" width="6" height="6"></rect>
          </svg>
        </div>
        
        <div class="node-info">
          <span class="node-label">{{ node.label }}</span>
          <span class="node-description">{{ node.description }}</span>
        </div>
        
        <div class="drag-indicator">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="5" r="1"></circle>
            <circle cx="9" cy="12" r="1"></circle>
            <circle cx="9" cy="19" r="1"></circle>
            <circle cx="15" cy="5" r="1"></circle>
            <circle cx="15" cy="12" r="1"></circle>
            <circle cx="15" cy="19" r="1"></circle>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.node-palette {
  width: 280px;
  background: var(--panel-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.palette-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.palette-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.3px;
}

.palette-hint {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--text-tertiary);
}

.nodes-list {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  cursor: grab;
  transition: all 0.2s ease;
  position: relative;
}

.node-item:hover {
  border-color: var(--node-color);
  background: var(--card-hover-bg);
  transform: translateX(4px);
}

.node-item:active {
  cursor: grabbing;
}

.node-item.dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.node-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: color-mix(in srgb, var(--node-color) 15%, transparent);
  border-radius: 8px;
  color: var(--node-color);
  flex-shrink: 0;
}

.node-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.node-label {
  font-weight: 600;
  font-size: 13px;
  color: var(--text-primary);
}

.node-description {
  font-size: 11px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.drag-indicator {
  color: var(--text-tertiary);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.node-item:hover .drag-indicator {
  opacity: 1;
}
</style>
