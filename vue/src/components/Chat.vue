<template>
  <div class="chat-panel">
    <div class="chat-header">
      <h3>聊天</h3>
      <div class="room-info">房间: {{ roomId }}</div>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <div
        v-for="(msg, index) in chatMessages"
        :key="index"
        class="message"
        :class="{ 'own-message': msg.fromPlayerId === playerId }"
      >
        <div class="message-sender">{{ msg.fromPlayerId }}</div>
        <div class="message-content">{{ msg.content }}</div>
        <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
      </div>

      <div v-if="chatMessages.length === 0" class="empty-state">
        暂无消息
      </div>
    </div>

    <div class="chat-input">
      <input
        v-model="newMessage"
        type="text"
        placeholder="输入消息..."
        @keyup.enter="sendMessage"
        :disabled="!canSend"
      />
      <button
        @click="sendMessage"
        :disabled="!canSend"
        class="send-btn"
      >
        发送
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useGameStore } from '../store/game'

const props = defineProps<{
  roomId?: string
}>()

const gameStore = useGameStore()

const newMessage = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

const roomId = computed(() => props.roomId || 'lobby')
const playerId = computed(() => gameStore.player?.id || '')
const connectionState = computed(() => gameStore.connectionState)
const chatMessages = computed(() => gameStore.chatMessages)

const canSend = computed(() => {
  return (
    connectionState.value === 'connected' &&
    newMessage.value.trim() !== '' &&
    playerId.value !== ''
  )
})

const sendMessage = () => {
  if (!canSend.value) return

  gameStore.sendChat(roomId.value, newMessage.value)
  newMessage.value = ''
}

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 自动滚动到底部
watch(chatMessages, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}, { deep: true })
</script>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.chat-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.room-info {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.message {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 80%;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  animation: fadeIn 0.3s ease;
}

.message.own-message {
  align-self: flex-end;
  background: rgba(102, 126, 234, 0.2);
  border-color: rgba(102, 126, 234, 0.3);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-sender {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.message-content {
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}

.message-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  text-align: right;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
}

.chat-input {
  display: flex;
  gap: 10px;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.4);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.chat-input input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);
  color: white;
  font-size: 14px;
  transition: all 0.2s;
}

.chat-input input:focus {
  outline: none;
  border-color: rgba(102, 126, 234, 0.5);
  background: rgba(0, 0, 0, 0.5);
}

.chat-input input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>
