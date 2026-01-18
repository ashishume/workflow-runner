<script setup lang="ts">
  import { CloseIcon } from '../assets/icons'

  export interface ConfirmModalProps {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    confirmVariant?: 'primary' | 'danger'
  }

  const props = withDefaults(defineProps<ConfirmModalProps>(), {
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmVariant: 'primary',
  })

  const emit = defineEmits<{
    confirm: []
    cancel: []
  }>()

  const handleConfirm = () => {
    emit('confirm')
  }

  const handleCancel = () => {
    emit('cancel')
  }

  const handleOverlayClick = () => {
    emit('cancel')
  }
</script>

<template>
  <Teleport to="body">
    <div class="modal-overlay" @click="handleOverlayClick">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>{{ title }}</h2>
          <button class="close-btn" @click="handleCancel">
            <CloseIcon :size="20" />
          </button>
        </div>
        <div class="modal-body">
          <p>{{ message }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn secondary" @click="handleCancel">
            {{ cancelText }}
          </button>
          <button
            class="btn"
            :class="confirmVariant"
            @click="handleConfirm"
          >
            {{ confirmText }}
          </button>
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
    max-width: 400px;
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
    padding: 20px;

    p {
      margin: 0;
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.6;
    }
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

    &.primary {
      background: var(--accent-color);
      border: none;
      color: var(--text-on-light);

      &:hover {
        background: color-mix(in srgb, var(--accent-color) 80%, white);
      }
    }

    &.danger {
      background: var(--status-error);
      border: none;
      color: var(--text-on-dark);

      &:hover {
        background: var(--status-error-border);
      }
    }

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
