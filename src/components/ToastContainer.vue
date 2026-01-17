<script setup lang="ts">
  import { useToast } from '../composables/useToast'
  import Toast from './Toast.vue'

  const { toasts, dismiss } = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast-list">
        <Toast
          v-for="toast in toasts"
          :key="toast.id"
          :message="toast.message"
          :type="toast.type"
          :duration="toast.duration"
          @dismiss="dismiss(toast.id)"
        />
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
  .toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 9999;
    pointer-events: none;

    > * {
      pointer-events: auto;
    }
  }

  // List transitions
  .toast-list-enter-active,
  .toast-list-leave-active {
    transition: all 0.3s ease;
  }

  .toast-list-enter-from {
    opacity: 0;
    transform: translateX(100%);
  }

  .toast-list-leave-to {
    opacity: 0;
    transform: translateX(100%);
  }

  .toast-list-move {
    transition: transform 0.3s ease;
  }
</style>
