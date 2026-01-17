<script setup lang="ts">
import { ref, computed, markRaw } from 'vue'
import { VueFlow, useVueFlow, MarkerType } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { useWorkflowStore } from '../stores/workflow'
import type { NodeType } from '../types/workflow'
import StartNode from './nodes/StartNode.vue'
import TransformNode from './nodes/TransformNode.vue'
import ConditionNode from './nodes/ConditionNode.vue'
import EndNode from './nodes/EndNode.vue'
import { ArrowDownIcon, PlusRectIcon, AlertCircleIcon } from '../assets/icons'

const store = useWorkflowStore()

// Toast notification for connection errors
const connectionError = ref<string | null>(null)
const showConnectionError = (message: string) => {
  connectionError.value = message
  setTimeout(() => {
    connectionError.value = null
  }, 3000)
}

const { onConnect, onNodesChange, onEdgesChange, onNodeDragStop } = useVueFlow()

// Custom node types - using any for Vue Flow compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: any = {
  start: markRaw(StartNode),
  transform: markRaw(TransformNode),
  condition: markRaw(ConditionNode),
  end: markRaw(EndNode)
}

// Computed nodes and edges for VueFlow
const nodes = computed(() => 
  store.nodes.map(node => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: node.data,
    selected: store.selectedNodeId === node.id
  }))
)

const edges = computed(() => 
  store.edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    animated: edge.animated,
    style: { stroke: '#00d4ff', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#00d4ff'
    }
  }))
)

// Handle connection between nodes
onConnect((params) => {
  const result = store.addEdge(params.source, params.target, params.sourceHandle || undefined, params.targetHandle || undefined)
  if (!result.success && result.error) {
    showConnectionError(result.error)
  }
})

// Handle node changes (selection, removal)
onNodesChange((changes) => {
  changes.forEach(change => {
    if (change.type === 'select' && change.selected) {
      store.selectNode(change.id)
    } else if (change.type === 'remove') {
      store.removeNode(change.id)
    }
  })
})

// Handle edge changes (removal)
onEdgesChange((changes) => {
  changes.forEach(change => {
    if (change.type === 'remove') {
      store.removeEdge(change.id)
    }
  })
})

// Handle node drag stop
onNodeDragStop((event) => {
  const updates = event.nodes.map(node => ({
    id: node.id,
    position: node.position
  }))
  store.updateNodePositions(updates)
})

// Drag and drop handling
const isDragOver = ref(false)

const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  isDragOver.value = true
}

const onDragLeave = () => {
  isDragOver.value = false
}

const onDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  const type = event.dataTransfer?.getData('application/workflow-node') as NodeType
  if (!type) return
  
  // Get the canvas bounds
  const canvas = (event.target as HTMLElement).closest('.vue-flow')
  if (!canvas) return
  
  const bounds = canvas.getBoundingClientRect()
  
  // Calculate position relative to canvas, accounting for viewport
  const position = {
    x: (event.clientX - bounds.left - store.viewport.x) / store.viewport.zoom,
    y: (event.clientY - bounds.top - store.viewport.y) / store.viewport.zoom
  }
  
  // Snap to grid (optional)
  position.x = Math.round(position.x / 20) * 20
  position.y = Math.round(position.y / 20) * 20
  
  store.addNode(type, position)
}

// Handle viewport change
const onMoveEnd = (event: { flowTransform: { x: number; y: number; zoom: number } }) => {
  store.updateViewport({
    x: event.flowTransform.x,
    y: event.flowTransform.y,
    zoom: event.flowTransform.zoom
  })
}

// Handle pane click (deselect)
const onPaneClick = () => {
  store.selectNode(null)
}

// Node click handler
const onNodeClick = ({ node }: { node: { id: string } }) => {
  store.selectNode(node.id)
}

// MiniMap node color
const nodeColor = (node: { type?: string }) => {
  switch (node.type) {
    case 'start': return '#4ade80'
    case 'transform': return '#a78bfa'
    case 'condition': return '#fbbf24'
    case 'end': return '#f87171'
    default: return '#94a3b8'
  }
}
</script>

<template>
  <div 
    class="workflow-canvas"
    :class="{ 'drag-over': isDragOver }"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :node-types="nodeTypes"
      :default-viewport="{ x: 0, y: 0, zoom: 1 }"
      :min-zoom="0.2"
      :max-zoom="2"
      :snap-to-grid="true"
      :snap-grid="[20, 20]"
      :connection-line-style="{ stroke: '#00d4ff', strokeWidth: 2 }"
      :default-edge-options="{ animated: true }"
      fit-view-on-init
      @move-end="onMoveEnd"
      @pane-click="onPaneClick"
      @node-click="onNodeClick"
    >
      <Background 
        :gap="20" 
        :size="1" 
        pattern-color="var(--grid-color)"
      />
      <Controls 
        position="bottom-left"
        :show-interactive="false"
      />
      <MiniMap 
        position="bottom-right"
        :node-color="nodeColor"
        :node-stroke-width="3"
        pannable
        zoomable
      />
      
      <!-- Drop zone overlay -->
      <div v-if="isDragOver" class="drop-overlay">
        <div class="drop-indicator">
          <ArrowDownIcon :size="40" />
          <span>Drop node here</span>
        </div>
      </div>
    </VueFlow>
    
    <!-- Empty state -->
    <div v-if="nodes.length === 0" class="empty-state">
      <div class="empty-content">
        <PlusRectIcon :size="48" :stroke-width="1.5" />
        <h3>Start Building Your Workflow</h3>
        <p>Drag nodes from the palette on the left to begin</p>
      </div>
    </div>
    
    <!-- Connection error toast -->
    <Transition name="toast">
      <div v-if="connectionError" class="connection-error-toast">
        <AlertCircleIcon :size="16" />
        <span>{{ connectionError }}</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.workflow-canvas {
  flex: 1;
  position: relative;
  background: var(--canvas-bg);
  overflow: hidden;
}

.workflow-canvas.drag-over {
  background: color-mix(in srgb, var(--accent-color) 5%, var(--canvas-bg));
}

.drop-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 212, 255, 0.05);
  border: 2px dashed var(--accent-color);
  pointer-events: none;
  z-index: 100;
}

.drop-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--accent-color);
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.drop-indicator span {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: var(--text-tertiary);
}

.empty-content svg {
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-content h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-secondary);
}

.empty-content p {
  margin: 8px 0 0;
  font-size: 14px;
}

/* Connection error toast */
.connection-error-toast {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(248, 113, 113, 0.95);
  color: #fff;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>

<style>
/* Vue Flow overrides */
.vue-flow {
  background: transparent !important;
}

.vue-flow__minimap {
  background: var(--panel-bg) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 8px !important;
}

.vue-flow__controls {
  background: var(--panel-bg) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 8px !important;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2) !important;
}

.vue-flow__controls-button {
  background: transparent !important;
  border: none !important;
  border-bottom: 1px solid var(--border-color) !important;
  color: var(--text-secondary) !important;
  transition: all 0.2s ease !important;
}

.vue-flow__controls-button:hover {
  background: var(--hover-bg) !important;
  color: var(--text-primary) !important;
}

.vue-flow__controls-button:last-child {
  border-bottom: none !important;
}

.vue-flow__controls-button svg {
  fill: currentColor !important;
}

.vue-flow__edge-path {
  stroke: var(--accent-color) !important;
}

.vue-flow__edge.selected .vue-flow__edge-path {
  stroke: #fff !important;
}

.vue-flow__arrowhead polyline {
  stroke: var(--accent-color) !important;
  fill: var(--accent-color) !important;
}

.vue-flow__connection-line {
  stroke: var(--accent-color) !important;
  stroke-dasharray: 5 5 !important;
}
</style>
