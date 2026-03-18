<template>
  <div class="chat-message" :class="{ 'own-message': isOwn }">
    <div class="message-header">
      <span class="player-name">{{ playerName }}</span>
      <span class="timestamp">{{ timestamp }}</span>
    </div>
    <div class="message-content">{{ content }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  fromPlayerId: string
  content: string
  currentUserId?: string
  timestamp?: string
}

const props = withDefaults(defineProps<Props>(), {
  currentUserId: '',
  timestamp: () => new Date().toLocaleTimeString()
})

const isOwn = computed(() => props.fromPlayerId === props.currentUserId)

const playerName = computed(() => {
  return isOwn.value ? '我' : props.fromPlayerId
})
</script>

<style scoped>
.chat-message {
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  max-width: 80%;
}

.chat-message.own-message {
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.3);
  margin-left: auto;
}

.chat-message:not(.own-message) {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.player-name {
  font-weight: 500;
}

.timestamp {
  font-size: 11px;
}

.message-content {
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
}
</style>
