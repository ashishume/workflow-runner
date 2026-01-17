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
          bg: 'rgba(74, 222, 128, 0.95)',
          color: '#000',
        }
      case 'error':
        return {
          bg: 'rgba(248, 113, 113, 0.95)',
          color: '#fff',
        }
      case 'warning':
        return {
          bg: 'rgba(251, 191, 36, 0.95)',
          color: '#000',
        }
      case 'info':
      default:
        return {
          bg: 'rgba(96, 165, 250, 0.95)',
          color: '#fff',
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
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
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
    background: rgba(0, 0, 0, 0.2);
    border: none;
    border-radius: 4px;
    color: inherit;
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover {
      background: rgba(0, 0, 0, 0.3);
    }
  }
</style>
