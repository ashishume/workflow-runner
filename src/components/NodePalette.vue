<script setup lang="ts">
  import { ref } from 'vue'

  import {
    BranchIcon,
    ChevronUpIcon,
    CloseIcon,
    DragIcon,
    PlayIcon,
    StopIcon,
    TransformIcon,
  } from '../assets/icons'
  import type { NodeType } from '../types/workflow'
  import { NODE_TYPE_CONFIGS } from '../utils/nodeConfig'

  const emit = defineEmits<{
    dragStart: [type: NodeType, event: DragEvent]
  }>()

  // Use centralized node configurations
  const nodes = NODE_TYPE_CONFIGS

  const draggedNode = ref<NodeType | null>(null)
  const isOpen = ref(true)

  const togglePalette = () => {
    isOpen.value = !isOpen.value
  }

  const onDragStart = (event: DragEvent, nodeType: NodeType) => {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/workflow-node', nodeType)
      event.dataTransfer.effectAllowed = 'move'
    }
    draggedNode.value = nodeType
    emit('dragStart', nodeType, event)
  }

  const onDragEnd = () => {
    draggedNode.value = null
  }
</script>

<template>
  <div class="node-palette" :class="{ collapsed: !isOpen }">
    <div v-if="isOpen" class="palette-content">
      <div class="palette-header">
        <div class="header-content">
          <h2>Nodes</h2>
          <p class="palette-hint">Drag to canvas</p>
        </div>
        <button class="close-btn" @click="togglePalette" title="Close palette">
          <CloseIcon :size="18" />
        </button>
      </div>

      <div class="nodes-list">
        <div
          v-for="node in nodes"
          :key="node.type"
          class="node-item"
          :class="{ dragging: draggedNode === node.type }"
          :style="{ '--node-color': node.colors.primary }"
          draggable="true"
          @dragstart="onDragStart($event, node.type)"
          @dragend="onDragEnd"
        >
          <div class="node-icon">
            <PlayIcon v-if="node.icon === 'play'" :size="20" />
            <TransformIcon v-if="node.icon === 'transform'" :size="20" />
            <BranchIcon v-if="node.icon === 'branch'" :size="20" />
            <StopIcon v-if="node.icon === 'stop'" :size="20" />
          </div>

          <div class="node-info">
            <span class="node-label">{{ node.label }}</span>
            <span class="node-description">{{ node.description }}</span>
          </div>

          <div class="drag-indicator">
            <DragIcon :size="16" />
          </div>
        </div>
      </div>
    </div>

    <button v-else class="reopen-btn" @click="togglePalette" title="Open palette">
      <ChevronUpIcon class="chevron-icon" :size="20" />
      <span>Nodes</span>
    </button>
  </div>
</template>

<style scoped lang="scss">
  .node-palette {
    width: 280px;
    background: var(--panel-bg);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: width 0.3s ease;

    &.collapsed {
      width: 60px;
    }
  }

  .palette-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
  }

  .palette-header {
    padding: 20px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;

    .header-content {
      flex: 1;
    }

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.3px;
    }
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;

    &:hover {
      background: var(--hover-bg);
      color: var(--text-primary);
    }
  }

  .palette-hint {
    margin: 4px 0 0;
    font-size: 12px;
    color: var(--text-tertiary);
  }

  .reopen-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 100%;
    height: 100%;
    padding: 16px 8px;
    background: transparent;
    border: none;
    border-right: 1px solid var(--border-color);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    writing-mode: vertical-rl;
    text-orientation: mixed;

    &:hover {
      background: var(--hover-bg);
      color: var(--text-primary);
    }

    .chevron-icon {
      transform: rotate(-90deg);
      writing-mode: initial;
      text-orientation: initial;
    }

    span {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 2px;
    }
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

    &:hover {
      border-color: var(--node-color);
      background: var(--card-hover-bg);
      transform: translateX(4px);

      .drag-indicator {
        opacity: 1;
      }
    }

    &:active {
      cursor: grabbing;
    }

    &.dragging {
      opacity: 0.5;
      transform: scale(0.95);
    }
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
</style>
