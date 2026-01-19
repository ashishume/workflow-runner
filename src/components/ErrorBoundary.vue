<script setup lang="ts">
  import { onErrorCaptured, ref } from 'vue'

  import { AlertCircleIcon } from '../assets/icons'
  import { useToast } from '../composables/useToast'

  export interface ErrorBoundaryProps {
    onError?: (error: Error, instance: unknown, info: string) => void
  }

  const props = withDefaults(defineProps<ErrorBoundaryProps>(), {
    onError: undefined,
  })

  const error = ref<Error | null>(null)
  const errorInfo = ref<string>('')
  const toast = useToast()

  onErrorCaptured((err: Error, instance: unknown, info: string) => {
    error.value = err
    errorInfo.value = info

    // Call custom error handler if provided
    if (props.onError) {
      props.onError(err, instance, info)
    } else {
      // Default error handling
      console.error('ErrorBoundary caught an error:', err, info)
      toast.error(`An error occurred: ${err.message}`)
    }

    // Return false to prevent the error from propagating
    return false
  })

  const resetError = () => {
    error.value = null
    errorInfo.value = ''
  }
</script>

<template>
  <div v-if="error" class="error-boundary">
    <div class="error-content">
      <AlertCircleIcon :size="48" class="error-icon" />
      <h2 class="error-title">Something went wrong</h2>
      <p class="error-message">{{ error?.message || 'An unexpected error occurred' }}</p>
      <details v-if="errorInfo" class="error-details">
        <summary class="error-summary">Error Details</summary>
        <pre class="error-stack">{{ errorInfo }}</pre>
      </details>
      <button class="error-reset" @click="resetError">Try Again</button>
    </div>
  </div>
  <slot v-else />
</template>

<style scoped lang="scss">
  .error-boundary {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    padding: 40px 20px;
  }

  .error-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    max-width: 500px;
    gap: 16px;
  }

  .error-icon {
    color: var(--status-error);
    margin-bottom: 8px;
  }

  .error-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .error-message {
    margin: 0;
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.5;
  }

  .error-details {
    width: 100%;
    margin-top: 8px;
    text-align: left;
  }

  .error-summary {
    font-size: 12px;
    color: var(--text-tertiary);
    cursor: pointer;
    padding: 8px;
    background: var(--card-bg);
    border-radius: 4px;
    margin-bottom: 8px;

    &:hover {
      background: var(--hover-bg);
    }
  }

  .error-stack {
    font-size: 11px;
    font-family: 'JetBrains Mono', 'Monaco', 'Consolas', monospace;
    color: var(--text-secondary);
    background: var(--input-bg);
    padding: 12px;
    border-radius: 4px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
    margin: 0;
  }

  .error-reset {
    margin-top: 8px;
    padding: 10px 20px;
    background: var(--accent-color);
    border: none;
    border-radius: 8px;
    color: var(--text-on-light);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: color-mix(in srgb, var(--accent-color) 80%, white);
    }
  }
</style>
