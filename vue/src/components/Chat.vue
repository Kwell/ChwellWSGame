<template>
  <div class="chat-component">
    <div class="chat-header">
      <h3>聊天室</h3>
      <span class="room-id">{{ roomId }}</span>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <div
        v-for="(message, index) in messages"
        :key="index"
        class="message"
        :class="{ 'own': message.fromPlayerId === playerId }"
      >
        <div class="message-header">
          <span class="player-name">{{ message.fromPlayerId }}</span>
          <span class="message-time">{{ formatTime(message.timestamp) }}</span>
        </div>
        <div class="message-content">{{ message.content }}</div>
      </div>

      <div v-if="messages.length === 0" class="empty-message">
        暂无消息，开始聊天吧！
      </div>
    </div>

    <div class="chat-input">
      <input
        v-model="inputMessage"
        type="text"
        placeholder="输入消息..."
        @keyup.enter="sendMessage"
        :disabled="!isConnected"
      />
      <button
        @click="sendMessage"
        :disabled="!isConnected || !inputMessage.trim()"
        class="send-button"
      >
        发送
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useGameStore } from '../store/game'

interface ChatMessage {
  fromPlayerId: string
  content: string
  timestamp: number
}

const props = defineProps<{
  roomId: string
}>()

const gameStore = useGameStore()
const messages = ref<ChatMessage[]>([])
const inputMessage = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

const playerId = computed(() => gameStore.player?.id || 'Guest')
const isConnected = computed(() => gameStore.connectionState === 'connected')

// 发送消息
const sendMessage = () => {
  if (!inputMessage.value.trim() || !isConnected.value) return

  // 发送到后端
  // TODO: 集成真实的 WebSocket 服务
  console.log('Sending message:', inputMessage.value)

  // 添加本地消息（临时）
  addLocalMessage(playerId.value, inputMessage.value)

  inputMessage.value = ''
}

// 添加本地消息
const addLocalMessage = (fromPlayerId: string, content: string) => {
  messages.value.push({
    fromPlayerId,
    content,
    timestamp: Date.now()
  })

  scrollToBottom()
}

// 格式化时间
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 监听聊天消息
onMounted(() => {
  // TODO: 监听真实的 WebSocket 聊天事件
  console.log('Chat component mounted for room:', props.roomId)
})

onUnmounted(() => {
  // TODO: 清理事件监听
  console.log('Chat component unmounted')
})
</script>

<style scoped>
.chat-component {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  height: 100%;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.chat-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.room-id {
  padding: 4px 12px;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 12px;
  font-size: 12px;
  color: #60a5fa;
  font-weight: 500;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 80%;
}

.message.own {
  align-self: flex-end;
}

.message-header {
  display: flex;
  gap: 8px;
  font-size: 12px;
}

.player-name {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.message-time {
  color: rgba(255, 255, 255, 0.5);
}

.message-content {
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  word-wrap: break-word;
  line-height: 1.5;
}

.message.own .message-content {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.3);
}

.empty-message {
  text-align: center;
  padding: 40px;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

.chat-input {
  display: flex;
  gap: 10px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.chat-input input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 14px;
}

.chat-input input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.chat-input input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-button {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s, opacity 0.2s;
}

.send-button:hover:not(:disabled) {
  transform: scale(1.05);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
