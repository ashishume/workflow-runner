<script setup lang="ts">
  import { computed, markRaw, ref } from 'vue'

  import { useEventListener } from '@vueuse/core'

  import { Background } from '@vue-flow/background'
  import { Controls } from '@vue-flow/controls'
  import { MarkerType, VueFlow, useVueFlow } from '@vue-flow/core'
  import { MiniMap } from '@vue-flow/minimap'

  import { ArrowDownIcon, PlusRectIcon } from '../assets/icons'
  import { useToast } from '../composables/useToast'
  import { useWorkflowStore } from '../stores/workflow'
  import type { NodeType } from '../types/workflow'
  import { getNodeColor } from '../utils/nodeConfig'
  import ConditionNode from './nodes/ConditionNode.vue'
  import EndNode from './nodes/EndNode.vue'
  import StartNode from './nodes/StartNode.vue'
  import TransformNode from './nodes/TransformNode.vue'

  const store = useWorkflowStore()
  const toast = useToast()

  const { onConnect, onNodesChange, onEdgesChange, onNodeDragStop } = useVueFlow()

  // Custom node types - using any for Vue Flow compatibility
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeTypes: any = {
    start: markRaw(StartNode),
    transform: markRaw(TransformNode),
    condition: markRaw(ConditionNode),
    end: markRaw(EndNode),
  }

  // Computed nodes and edges for VueFlow
  const nodes = computed(() =>
    store.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
      selected: store.selectedNodeIds.has(node.id),
    }))
  )

  const edges = computed(() =>
    store.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      animated: edge.animated,
      style: { stroke: 'var(--connection-color)', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: 'var(--connection-color)',
      },
    }))
  )

  // Handle connection between nodes
  onConnect((params) => {
    const result = store.addEdge(
      params.source,
      params.target,
      params.sourceHandle || undefined,
      params.targetHandle || undefined
    )
    if (!result.success && result.error) {
      toast.error(result.error)
    }
  })

  // Handle node changes (selection, removal)
  onNodesChange((changes) => {
    changes.forEach((change) => {
      if (change.type === 'select') {
        // Sync Vue Flow's selection state with our store
        if (change.selected) {
          // Add to selection (multi-select is handled by Vue Flow)
          if (!store.selectedNodeIds.has(change.id)) {
            store.selectedNodeIds.add(change.id)
            // Update selectedNodeId if this is the first/only selection
            if (store.selectedNodeIds.size === 1) {
              store.selectedNodeId = change.id
            } else {
              store.selectedNodeId = null
            }
          }
        } else {
          // Remove from selection
          store.selectedNodeIds.delete(change.id)
          if (store.selectedNodeId === change.id) {
            const remaining = Array.from(store.selectedNodeIds)
            store.selectedNodeId = remaining.length === 1 ? remaining[0] ?? null : null
          }
        }
      } else if (change.type === 'remove') {
        store.removeNode(change.id)
      }
    })
  })

  // Handle edge changes (removal)
  onEdgesChange((changes) => {
    changes.forEach((change) => {
      if (change.type === 'remove') {
        store.removeEdge(change.id)
      }
    })
  })

  // Handle node drag stop
  onNodeDragStop((event) => {
    const updates = event.nodes.map((node) => ({
      id: node.id,
      position: node.position,
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
      y: (event.clientY - bounds.top - store.viewport.y) / store.viewport.zoom,
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
      zoom: event.flowTransform.zoom,
    })
  }

  // Handle pane click (deselect)
  const onPaneClick = () => {
    store.selectNode(null)
  }

  // Node click handler
  const onNodeClick = (nodeMouseEvent: { node: { id: string }; event: MouseEvent | TouchEvent }) => {
    const { node, event } = nodeMouseEvent
    // Handle multi-select with Ctrl/Cmd (only for mouse events)
    if (event instanceof MouseEvent && (event.ctrlKey || event.metaKey)) {
      // Multi-select: toggle this node
      store.toggleNodeSelection(node.id)
    } else {
      // Single select: select only this node
      store.selectNode(node.id)
    }
  }

  // MiniMap node color - using centralized config
  const nodeColor = (node: { type?: string }) => {
    return getNodeColor(node.type ?? '')
  }

  // Handle keyboard shortcuts
  const handleKeydown = (event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return
    }

    // Copy nodes (Ctrl+C / Cmd+C)
    if ((event.metaKey || event.ctrlKey) && event.key === 'c') {
      event.preventDefault()
      const copied = store.copyNodes()
      if (copied) {
        const count = Array.from(store.selectedNodeIds).length || (store.selectedNodeId ? 1 : 0)
        toast.success(`Copied ${count} node${count === 1 ? '' : 's'}`)
      }
      return
    }

    // Paste nodes (Ctrl+V / Cmd+V)
    if ((event.metaKey || event.ctrlKey) && event.key === 'v') {
      event.preventDefault()
      const pasted = store.pasteNodes()
      if (pasted) {
        const count = store.clipboard?.nodes.length || 0
        toast.success(`Pasted ${count} node${count === 1 ? '' : 's'}`)
      } else {
        toast.warning('No nodes in clipboard')
      }
      return
    }

    // Select all nodes (Cmd+A / Ctrl+A)
    if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
      event.preventDefault()
      if (store.nodes.length > 0) {
        store.selectAllNodes()
        toast.info(`Selected ${store.nodes.length} node${store.nodes.length === 1 ? '' : 's'}`)
      }
    }
  }

  // Use vueuse's useEventListener for automatic cleanup
  useEventListener(window, 'keydown', handleKeydown)
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
      :connection-line-style="{ stroke: 'var(--connection-color)', strokeWidth: 2 }"
      :default-edge-options="{ animated: true }"
      fit-view-on-init
      @move-end="onMoveEnd"
      @pane-click="onPaneClick"
      @node-click="onNodeClick"
    >
      <Background :gap="20" :size="1" pattern-color="var(--grid-color)" />
      <Controls position="bottom-left" :show-interactive="false" />
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
  </div>
</template>

<style scoped lang="scss">
  .workflow-canvas {
    flex: 1;
    position: relative;
    background: var(--canvas-bg);
    overflow: hidden;

    &.drag-over {
      background: color-mix(in srgb, var(--accent-color) 5%, var(--canvas-bg));
    }
  }

  .drop-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--connection-glow-light);
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

    span {
      font-size: 14px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  }

  @keyframes bounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
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

    svg {
      margin-bottom: 16px;
      opacity: 0.5;
    }

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--text-secondary);
    }

    p {
      margin: 8px 0 0;
      font-size: 14px;
    }
  }
</style>

<style lang="scss">
  // Vue Flow overrides
  .vue-flow {
    background: transparent !important;

    &__minimap {
      background: var(--panel-bg) !important;
      border: 1px solid var(--border-color) !important;
      border-radius: 8px !important;
    }

    &__controls {
      background: var(--panel-bg) !important;
      border: 1px solid var(--border-color) !important;
      border-radius: 8px !important;
      overflow: hidden;
      box-shadow: var(--shadow-md) !important;
    }

    &__controls-button {
      background: transparent !important;
      border: none !important;
      border-bottom: 1px solid var(--border-color) !important;
      color: var(--text-secondary) !important;
      transition: all 0.2s ease !important;

      &:hover {
        background: var(--hover-bg) !important;
        color: var(--text-primary) !important;
      }

      &:last-child {
        border-bottom: none !important;
      }

      svg {
        fill: currentColor !important;
      }
    }

    &__edge-path {
      stroke: var(--accent-color) !important;
    }

    &__edge.selected &__edge-path {
      stroke: var(--text-on-dark) !important;
    }

    &__arrowhead polyline {
      stroke: var(--accent-color) !important;
      fill: var(--accent-color) !important;
    }

    &__connection-line {
      stroke: var(--accent-color) !important;
      stroke-dasharray: 5 5 !important;
    }
  }
</style>
