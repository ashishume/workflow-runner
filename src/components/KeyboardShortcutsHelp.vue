<script setup lang="ts">
  import { CloseIcon } from '../assets/icons'

  const emit = defineEmits<{
    close: []
  }>()

  const shortcuts = [
    {
      category: 'General',
      items: [
        { keys: ['Ctrl', 'Z'], description: 'Undo last action' },
        { keys: ['Ctrl', 'Y'], description: 'Redo last action' },
        { keys: ['Ctrl', 'A'], description: 'Select all nodes' },
        { keys: ['Delete'], description: 'Delete selected node(s)' },
        { keys: ['Escape'], description: 'Deselect nodes / Close modals' },
      ],
    },
    {
      category: 'Workflow',
      items: [
        { keys: ['Ctrl', 'E'], description: 'Export workflow' },
        { keys: ['Ctrl', 'I'], description: 'Import workflow' },
        { keys: ['Ctrl', 'C'], description: 'Copy selected node(s)' },
        { keys: ['Ctrl', 'V'], description: 'Paste copied node(s)' },
      ],
    },
  ]

  const formatKeys = (keys: string[]) => {
    return keys.map((key) => {
      // Format special keys
      if (key === 'Ctrl') return 'Ctrl'
      if (key === 'Shift') return 'Shift'
      if (key === 'Alt') return 'Alt'
      if (key === 'Meta') return '⌘'
      if (key === 'Delete') return 'Del'
      if (key === 'Backspace') return '⌫'
      if (key === 'Escape') return 'Esc'
      if (key === '?') return '?'
      return key.toUpperCase()
    })
  }

  const handleOverlayClick = () => {
    emit('close')
  }
</script>

<template>
  <Teleport to="body">
    <div class="modal-overlay" @click="handleOverlayClick">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>Keyboard Shortcuts</h2>
          <button class="close-btn" @click="emit('close')">
            <CloseIcon :size="20" />
          </button>
        </div>
        <div class="modal-body">
          <div v-for="category in shortcuts" :key="category.category" class="shortcut-category">
            <h3 class="category-title">{{ category.category }}</h3>
            <div class="shortcut-list">
              <div v-for="(item, index) in category.items" :key="index" class="shortcut-item">
                <div class="shortcut-keys">
                  <kbd v-for="(key, keyIndex) in formatKeys(item.keys)" :key="keyIndex" class="key">
                    {{ key }}
                  </kbd>
                </div>
                <span class="shortcut-description">{{ item.description }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn secondary" @click="emit('close')">Close</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: var(--overlay-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }

  .modal {
    background: var(--panel-bg);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-lg);
    animation: scaleIn 0.2s ease;
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color);

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
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

  .modal-body {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .shortcut-category {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .category-title {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .shortcut-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .shortcut-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 10px 12px;
    background: var(--card-bg);
    border-radius: 8px;
    transition: background 0.2s ease;

    &:hover {
      background: var(--hover-bg);
    }
  }

  .shortcut-keys {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .key {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
    height: 28px;
    padding: 0 8px;
    background: var(--input-bg);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    font-family: 'JetBrains Mono', 'Monaco', 'Consolas', monospace;
    color: var(--text-primary);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .shortcut-description {
    font-size: 13px;
    color: var(--text-secondary);
    text-align: right;
    flex: 1;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid var(--border-color);
  }

  .btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &.secondary {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);

      &:hover {
        background: var(--hover-bg);
        color: var(--text-primary);
      }
    }
  }
</style>
