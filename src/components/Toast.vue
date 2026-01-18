<script setup lang="ts">
  import { computed } from 'vue'

  import { AlertCircleIcon, CloseIcon } from '../assets/icons'

  export interface ToastProps {
    message: string
    type?: 'success' | 'error' | 'warning' | 'info'
    duration?: number
    dismissible?: boolean
  }

  const props = withDefaults(defineProps<ToastProps>(), {
    type: 'info',
    duration: 3000,
    dismissible: true,
  })

  const emit = defineEmits<{
    dismiss: []
  }>()

  const typeStyles = computed(() => {
    switch (props.type) {
      case 'success':
        return {
          bg: 'var(--toast-success-bg)',
          color: 'var(--toast-success-color)',
        }
      case 'error':
        return {
          bg: 'var(--toast-error-bg)',
          color: 'var(--toast-error-color)',
        }
      case 'warning':
        return {
          bg: 'var(--toast-warning-bg)',
          color: 'var(--toast-warning-color)',
        }
      case 'info':
      default:
        return {
          bg: 'var(--toast-info-bg)',
          color: 'var(--toast-info-color)',
        }
    }
  })

  const dismiss = () => {
    emit('dismiss')
  }
</script>

<template>
  <div
    class="toast"
    :style="{
      '--toast-bg': typeStyles.bg,
      '--toast-color': typeStyles.color,
    }"
    @click="dismissible && dismiss()"
  >
    <AlertCircleIcon :size="16" />
    <span class="toast-message">{{ message }}</span>
    <button v-if="dismissible" class="toast-close" @click.stop="dismiss">
      <CloseIcon :size="14" />
    </button>
  </div>
</template>

<style scoped lang="scss">
  .toast {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: var(--toast-bg);
    color: var(--toast-color);
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    box-shadow: var(--shadow-md);
    cursor: pointer;
    max-width: 400px;
  }

  .toast-message {
    flex: 1;
  }

  .toast-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: var(--overlay-darkest);
    border: none;
    border-radius: 4px;
    color: inherit;
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover {
      background: var(--overlay-darker);
    }
  }
</style>
