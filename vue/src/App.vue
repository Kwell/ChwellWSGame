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
          <input
            v-model="serverUrl"
            type="text"
            placeholder="ws://localhost:8080"
            @keyup.enter="connect"
          />
          <button @click="connect">连接</button>
        </div>
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

        <!-- 断开连接按钮 -->
        <button @click="disconnect" class="disconnect-btn">断开连接</button>

        <!-- 聊天组件 -->
        <div class="chat-container">
          <Chat room-id="room_001" />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGameStore, ConnectionState } from './store/game'

const gameStore = useGameStore()

const serverUrl = ref('ws://localhost:8080')

const connectionState = computed(() => gameStore.connectionState)
const connectionError = computed(() => gameStore.connectionError)
const player = computed(() => gameStore.player)

const connectionClass = computed(() => ({
  disconnected: connectionState.value === ConnectionState.Disconnected,
  connecting: connectionState.value === ConnectionState.Connecting,
  connected: connectionState.value === ConnectionState.Connected,
  reconnecting: connectionState.value === ConnectionState.Reconnecting,
  error: connectionState.value === ConnectionState.Error
}))

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

const healthPercent = computed(() => {
  if (!player.value) return 0
  return (player.value.health / player.value.maxHealth) * 100
})

const energyPercent = computed(() => {
  if (!player.value) return 0
  return (player.value.energy / player.value.maxEnergy) * 100
})

const connect = () => {
  gameStore.connectToServer(serverUrl.value)
}

const disconnect = () => {
  gameStore.disconnectFromServer()
}
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
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
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
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.panel {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.panel h2 {
  margin: 0 0 20px 0;
  font-size: 24px;
  font-weight: 600;
}

.input-group {
  display: flex;
  gap: 10px;
}

.input-group input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);
  color: white;
  font-size: 16px;
}

.input-group input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.input-group button {
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

.input-group button:hover {
  transform: scale(1.05);
}

.error {
  margin-top: 10px;
  padding: 10px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 6px;
  color: #f87171;
  font-size: 14px;
}

.game-ui {
  width: 100%;
  max-width: 400px;
}

.hud {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.player-info {
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.label {
  color: rgba(255, 255, 255, 0.7);
}

.value {
  font-weight: 500;
}

.health-bar,
.energy-bar {
  position: relative;
  height: 24px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 10px;
}

.bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 12px;
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
  font-size: 12px;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.disconnect-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 6px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #f87171;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.disconnect-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: rgba(239, 68, 68, 0.6);
}

.chat-container {
  margin-top: 20px;
  height: 400px;
}
</style>
