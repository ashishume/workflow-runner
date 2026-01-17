<script setup lang="ts">
  import { computed, ref } from 'vue'

  import { ChevronUpIcon, ClockIcon, TerminalIcon } from '../assets/icons'
  import { useWorkflowStore } from '../stores/workflow'
  import { getNodeColor } from '../utils/nodeConfig'

  const store = useWorkflowStore()

  const isExpanded = ref(true)

  const logs = computed(() => store.executionLogs)
  const isExecuting = computed(() => store.isExecuting)

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const formatPayload = (payload: Record<string, unknown>) => {
    try {
      return JSON.stringify(payload, null, 2)
    } catch {
      return '{}'
    }
  }

  // Use centralized node color config
  const getLogNodeColor = (nodeType: string) => {
    return getNodeColor(nodeType)
  }

  const toggleExpanded = () => {
    isExpanded.value = !isExpanded.value
  }

  const clearLogs = () => {
    store.clearExecutionLogs()
  }
</script>

<template>
  <div class="execution-logs" :class="{ expanded: isExpanded, 'has-logs': logs.length > 0 }">
    <div class="logs-header" @click="toggleExpanded">
      <div class="header-left">
        <TerminalIcon :size="18" />
        <h3>Execution Logs</h3>
        <span v-if="logs.length > 0" class="log-count">{{ logs.length }}</span>
        <span v-if="isExecuting" class="executing-badge">
          <span class="pulse"></span>
          Running...
        </span>
      </div>
      <div class="header-right">
        <button v-if="logs.length > 0" class="clear-btn" @click.stop="clearLogs">Clear</button>
        <ChevronUpIcon class="expand-icon" :class="{ rotated: isExpanded }" :size="18" />
      </div>
    </div>

    <div class="logs-content" v-show="isExpanded">
      <div v-if="logs.length === 0" class="empty-state">
        <ClockIcon :size="32" />
        <p>No execution logs yet</p>
        <span>Run the workflow to see logs</span>
      </div>

      <div v-else class="logs-list">
        <div
          v-for="(log, index) in logs"
          :key="`${log.nodeId}-${log.timestamp}`"
          class="log-entry"
          :class="log.status"
        >
          <div class="log-timeline">
            <div class="timeline-dot" :style="{ background: getLogNodeColor(log.nodeType) }"></div>
            <div v-if="index < logs.length - 1" class="timeline-line"></div>
          </div>

          <div class="log-content">
            <div class="log-header">
              <span
                class="node-badge"
                :style="{
                  background: `color-mix(in srgb, ${getLogNodeColor(log.nodeType)} 20%, transparent)`,
                  color: getLogNodeColor(log.nodeType),
                }"
              >
                {{ log.nodeName }}
              </span>
              <span class="log-time">{{ formatTimestamp(log.timestamp) }}</span>
            </div>

            <div v-if="log.message" class="log-message">
              {{ log.message }}
            </div>

            <div class="log-data">
              <div class="data-section">
                <span class="data-label">Input:</span>
                <pre class="data-value">{{ formatPayload(log.input) }}</pre>
              </div>
              <div class="data-section">
                <span class="data-label">Output:</span>
                <pre class="data-value">{{ formatPayload(log.output) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .execution-logs {
    background: var(--panel-bg);
    border-top: 1px solid var(--border-color);
    overflow: hidden;
    transition: all 0.3s ease;
  }

  .logs-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover {
      background: var(--hover-bg);
    }
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text-secondary);

    h3 {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }

  .log-count {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    background: var(--accent-color);
    color: #000;
    border-radius: 10px;
  }

  .executing-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #4ade80;
    font-weight: 500;
  }

  .pulse {
    width: 8px;
    height: 8px;
    background: #4ade80;
    border-radius: 50%;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(0.8);
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .clear-btn {
    font-size: 11px;
    padding: 4px 10px;
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: var(--hover-bg);
      color: var(--text-primary);
    }
  }

  .expand-icon {
    color: var(--text-secondary);
    transition: transform 0.3s ease;

    &.rotated {
      transform: rotate(180deg);
    }
  }

  .logs-content {
    max-height: 300px;
    overflow-y: auto;
    padding: 0 20px 20px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px;
    color: var(--text-tertiary);
    text-align: center;

    svg {
      margin-bottom: 12px;
      opacity: 0.5;
    }

    p {
      margin: 0;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary);
    }

    span {
      margin-top: 4px;
      font-size: 12px;
    }
  }

  .logs-list {
    display: flex;
    flex-direction: column;
  }

  .log-entry {
    display: flex;
    gap: 12px;

    &.error .log-message {
      background: rgba(248, 113, 113, 0.1);
      color: #f87171;
    }
  }

  .log-timeline {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 20px;
    flex-shrink: 0;
  }

  .timeline-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
    border: 2px solid var(--panel-bg);
    box-shadow: 0 0 0 2px var(--border-color);
    margin-top: 6px;
  }

  .timeline-line {
    flex: 1;
    width: 2px;
    background: var(--border-color);
    margin: 4px 0;
  }

  .log-content {
    flex: 1;
    padding-bottom: 16px;
  }

  .log-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .node-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 4px;
  }

  .log-time {
    font-size: 11px;
    color: var(--text-tertiary);
    font-family: 'JetBrains Mono', 'Monaco', 'Consolas', monospace;
  }

  .log-message {
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 8px;
    padding: 6px 10px;
    background: var(--card-bg);
    border-radius: 4px;
  }

  .log-data {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .data-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .data-label {
    font-size: 10px;
    font-weight: 600;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .data-value {
    margin: 0;
    font-size: 11px;
    font-family: 'JetBrains Mono', 'Monaco', 'Consolas', monospace;
    color: var(--text-secondary);
    background: var(--input-bg);
    padding: 8px 10px;
    border-radius: 4px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }
</style>
