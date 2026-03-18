<template>
  <div class="app">
    <header class="header">
      <h1>ChwellWSGame</h1>
      <div class="status-indicator" :class="connectionClass">
        {{ connectionText }}
      </div>
    </header>

    <main class="main">
      <!-- 连接面板 -->
      <div v-if="connectionState === ConnectionState.Disconnected" class="panel">
        <h2>连接服务器</h2>
        <div class="input-group">
          <label>服务器地址</label>
          <input
            v-model="serverUrl"
            type="text"
            placeholder="ws://localhost:8080"
            @keyup.enter="connect"
          />
        </div>
        <div class="input-group">
          <label>玩家 ID</label>
          <input
            v-model="playerId"
            type="text"
            placeholder="输入玩家 ID"
            @keyup.enter="connect"
          />
        </div>
        <div class="input-group">
          <label>访问令牌</label>
          <input
            v-model="token"
            type="password"
            placeholder="输入访问令牌"
            @keyup.enter="connect"
          />
        </div>
        <button @click="connect" :disabled="!canConnect" class="connect-btn">
          连接并登录
        </button>
        <div v-if="connectionError" class="error">
          {{ connectionError }}
        </div>
      </div>

      <!-- 游戏主界面 -->
      <div v-else class="game-ui">
        <!-- HUD - 玩家信息 -->
        <div v-if="player" class="hud">
          <div class="player-info">
            <div class="info-row">
              <span class="label">玩家:</span>
              <span class="value">{{ player.name }}</span>
            </div>
            <div class="info-row">
              <span class="label">等级:</span>
              <span class="value">{{ player.level }}</span>
            </div>
            <div class="info-row">
              <span class="label">经验:</span>
              <span class="value">{{ player.experience }}</span>
            </div>
          </div>

          <!-- 生命值条 -->
          <div class="health-bar">
            <div class="bar-fill" :style="{ width: healthPercent + '%' }"></div>
            <span class="bar-text">{{ player.health }} / {{ player.maxHealth }}</span>
          </div>

          <!-- 能量条 -->
          <div class="energy-bar">
            <div class="bar-fill" :style="{ width: energyPercent + '%' }"></div>
            <span class="bar-text">{{ player.energy }} / {{ player.maxEnergy }}</span>
          </div>
        </div>

        <!-- 聊天面板 -->
        <div class="chat-panel">
          <div class="chat-header">
            <h3>聊天室</h3>
            <span class="room-id">房间: main</span>
          </div>
          <div class="chat-messages" ref="chatMessagesRef">
            <div v-if="chatMessages.length === 0" class="no-messages">
              暂无消息
            </div>
            <ChatMessage
              v-for="(msg, index) in chatMessages"
              :key="index"
              :from-player-id="msg.fromPlayerId"
              :content="msg.content"
              :current-user-id="player?.id"
            />
          </div>
          <div class="chat-input">
            <input
              v-model="chatInput"
              type="text"
              placeholder="输入消息..."
              @keyup.enter="sendChat"
              :disabled="!canSendChat"
            />
            <button
              @click="sendChat"
              :disabled="!canSendChat"
              class="send-btn"
            >
              发送
            </button>
          </div>
        </div>

        <!-- 断开连接按钮 -->
        <button @click="disconnect" class="disconnect-btn">断开连接</button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import ChatMessage from './components/ChatMessage.vue'
import { useGameStore, ConnectionState } from './store/game'

const gameStore = useGameStore()

// 表单输入
const serverUrl = ref('ws://localhost:8080')
const playerId = ref('')
const token = ref('')
const chatInput = ref('')

// 聊天消息滚动
const chatMessagesRef = ref<HTMLElement | null>(null)

// Store 状态
const connectionState = computed(() => gameStore.connectionState)
const connectionError = computed(() => gameStore.connectionError)
const player = computed(() => gameStore.player)
const chatMessages = computed(() => gameStore.chatMessages)

// 连接状态样式
const connectionClass = computed(() => ({
  disconnected: connectionState.value === ConnectionState.Disconnected,
  connecting: connectionState.value === ConnectionState.Connecting,
  connected: connectionState.value === ConnectionState.Connected,
  reconnecting: connectionState.value === ConnectionState.Reconnecting,
  error: connectionState.value === ConnectionState.Error
}))

// 连接状态文本
const connectionText = computed(() => {
  const stateMap = {
    [ConnectionState.Disconnected]: '未连接',
    [ConnectionState.Connecting]: '连接中...',
    [ConnectionState.Connected]: '已连接',
    [ConnectionState.Reconnecting]: '重连中...',
    [ConnectionState.Error]: '连接错误'
  }
  return stateMap[connectionState.value]
})

// 属性百分比
const healthPercent = computed(() => {
  if (!player.value) return 0
  return (player.value.health / player.value.maxHealth) * 100
})

const energyPercent = computed(() => {
  if (!player.value) return 0
  return (player.value.energy / player.value.maxEnergy) * 100
})

// 是否可以连接
const canConnect = computed(() => {
  return serverUrl.value.trim() !== '' &&
         playerId.value.trim() !== '' &&
         token.value.trim() !== ''
})

// 是否可以发送聊天
const canSendChat = computed(() => {
  return connectionState.value === ConnectionState.Connected &&
         chatInput.value.trim() !== ''
})

// 连接服务器
const connect = async () => {
  if (!canConnect.value) return

  try {
    await gameStore.connectToServer(serverUrl.value)
    // 连接成功后自动登录
    if (connectionState.value === ConnectionState.Connected) {
      gameStore.login(playerId.value, token.value)
    }
  } catch (error) {
    console.error('Failed to connect:', error)
  }
}

// 断开连接
const disconnect = () => {
  gameStore.disconnectFromServer()
}

// 发送聊天消息
const sendChat = () => {
  if (!canSendChat.value) return

  gameStore.sendChat('main', chatInput.value.trim())
  chatInput.value = ''
}

// 监听聊天消息，自动滚动到底部
watch(chatMessages, () => {
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  })
})
</script>

<style scoped>
.app {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.status-indicator {
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  font-size: 14px;
}

.status-indicator.disconnected {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.status-indicator.connecting,
.status-indicator.reconnecting {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.status-indicator.connected {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.status-indicator.error {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
}

.panel {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 40px;
  max-width: 500px;
  margin: 0 auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.panel h2 {
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.input-group input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);
  color: white;
  font-size: 16px;
  box-sizing: border-box;
}

.input-group input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.connect-btn,
.send-btn {
  width: 100%;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s;
}

.connect-btn:hover:not(:disabled),
.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.connect-btn:disabled,
.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  margin-top: 10px;
  padding: 10px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 6px;
  color: #f87171;
  font-size: 14px;
  text-align: center;
}

.game-ui {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  overflow: hidden;
}

.hud {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  flex-shrink: 0;
}

.player-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.value {
  font-size: 18px;
  font-weight: 500;
}

.health-bar,
.energy-bar {
  position: relative;
  height: 28px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 10px;
}

.bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 14px;
}

.health-bar .bar-fill {
  background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
}

.energy-bar .bar-fill {
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
}

.bar-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 13px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.chat-panel {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.chat-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.room-id {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
}

.no-messages {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
  margin-top: 40px;
}

.chat-input {
  display: flex;
  gap: 10px;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.chat-input input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);
  color: white;
  font-size: 14px;
}

.chat-input input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.disconnect-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #f87171;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  align-self: flex-start;
  flex-shrink: 0;
}

.disconnect-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.6);
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
