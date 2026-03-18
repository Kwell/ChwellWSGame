import create from 'zustand'
import GameWebSocket, { ConnectionState } from '../utils/websocket'

// 登录请求
export interface LoginRequest {
  playerId: string
  token: string
}

// 聊天请求
export interface ChatRequest {
  roomId: string
  content: string
}

// 玩家信息
export interface Player {
  id: string
  name: string
  level: number
  experience: number
  health: number
  maxHealth: number
  energy: number
  maxEnergy: number
}

// 聊天消息
export interface ChatMessage {
  fromPlayerId: string
  content: string
}

// 游戏状态接口
interface GameState {
  // WebSocket 实例
  ws: GameWebSocket | null

  // 连接状态
  connectionState: ConnectionState
  connectionError: string | null

  // 玩家信息
  player: Player | null

  // 聊天消息
  chatMessages: ChatMessage[]

  // 登录信息
  loginInfo: LoginRequest | null

  // Actions
  setConnectionState: (state: ConnectionState) => void
  setConnectionError: (error: string | null) => void
  updatePlayer: (player: Partial<Player>) => void
  setPlayer: (player: Player | null) => void
  addChatMessage: (message: ChatMessage) => void

  // 连接/断开
  connectToServer: (url: string) => Promise<void>
  disconnectFromServer: () => void

  // 游戏操作
  login: (playerId: string, token: string) => void
  sendChat: (roomId: string, content: string) => void
}

// 创建 store
export const useGameStore = create<GameState>((set, get) => ({
  // 初始状态
  ws: null,
  connectionState: ConnectionState.Disconnected,
  connectionError: null,
  player: null,
  chatMessages: [],
  loginInfo: null,

  // Actions
  setConnectionState: (state) => set({ connectionState: state }),
  setConnectionError: (error) => set({ connectionError: error }),

  updatePlayer: (updates) =>
    set((state) => ({
      player: state.player ? { ...state.player, ...updates } : null
    })),

  setPlayer: (player) => set({ player }),

  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message]
    })),

  // 连接到服务器
  connectToServer: async (url: string) => {
    try {
      set({ connectionState: ConnectionState.Connecting, connectionError: null })

      // 创建 WebSocket 实例
      const ws = new GameWebSocket(url)

      // 监听连接事件
      ws.on('connected', () => {
        console.log('Connected to server')
        set({ connectionState: ConnectionState.Connected })
      })

      ws.on('disconnected', () => {
        console.log('Disconnected from server')
        set({
          connectionState: ConnectionState.Disconnected,
          player: null,
          chatMessages: []
        })
      })

      ws.on('error', (error: Error) => {
        console.error('WebSocket error:', error)
        set({
          connectionState: ConnectionState.Error,
          connectionError: error.message
        })
      })

      ws.on('login', (response: { ok: boolean; message: string }) => {
        console.log('Login response:', response)
        if (response.ok) {
          // 登录成功，设置玩家信息
          const loginInfo = get().loginInfo
          if (loginInfo) {
            set({
              player: {
                id: loginInfo.playerId,
                name: loginInfo.playerId, // 暂时使用 playerId 作为 name
                level: 1,
                experience: 0,
                health: 100,
                maxHealth: 100,
                energy: 100,
                maxEnergy: 100
              }
            })
          }
        } else {
          set({
            connectionError: response.message
          })
        }
      })

      ws.on('chat', (message: ChatMessage) => {
        console.log('Received chat:', message)
        get().addChatMessage(message)
      })

      ws.on('heartbeat', (response: { timestamp_ms: number }) => {
        console.log('Heartbeat response:', response)
      })

      // 连接
      await ws.connect()

      set({ ws })
    } catch (error) {
      console.error('Failed to connect:', error)
      set({
        connectionState: ConnectionState.Error,
        connectionError: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  },

  // 断开连接
  disconnectFromServer: () => {
    const { ws } = get()
    if (ws) {
      ws.disconnect()
      set({
        ws: null,
        connectionState: ConnectionState.Disconnected,
        player: null,
        chatMessages: [],
        loginInfo: null
      })
    }
  },

  // 登录
  login: (playerId: string, token: string) => {
    const { ws } = get()
    if (!ws) {
      console.error('WebSocket not connected')
      return
    }

    set({ loginInfo: { playerId, token } })
    ws.login(playerId, token)
  },

  // 发送聊天
  sendChat: (roomId: string, content: string) => {
    const { ws } = get()
    if (!ws) {
      console.error('WebSocket not connected')
      return
    }

    ws.sendChat(roomId, content)
  }
}))

export default useGameStore
