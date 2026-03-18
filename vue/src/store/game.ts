import create from 'zustand'
import GameWebSocket, { ConnectionState } from '../utils/websocket'

// 连接状态枚举 (从 WebSocket 导入)
export { ConnectionState }

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
  timestamp: number
}

// 游戏状态接口
interface GameState {
  // 连接状态
  connectionState: ConnectionState
  connectionError: string | null
  webSocket: GameWebSocket | null

  // 玩家信息
  player: Player | null

  // 聊天消息
  chatMessages: ChatMessage[]

  // Actions
  setConnectionState: (state: ConnectionState) => void
  setConnectionError: (error: string | null) => void
  updatePlayer: (player: Partial<Player>) => void
  setPlayer: (player: Player | null) => void
  addChatMessage: (message: ChatMessage) => void

  // WebSocket 连接
  connectToServer: (url: string) => Promise<void>
  disconnectFromServer: () => void

  // 游戏操作
  login: (playerId: string, token: string) => void
  sendChat: (roomId: string, content: string) => void
}

// 创建 store
export const useGameStore = create<GameState>((set, get) => ({
  // 初始状态
  connectionState: ConnectionState.Disconnected,
  connectionError: null,
  webSocket: null,
  player: null,
  chatMessages: [],

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

  connectToServer: async (url: string) => {
    try {
      const ws = new GameWebSocket(url)

      // 监听事件
      ws.on('connecting', () => {
        set({ connectionState: ConnectionState.Connecting, connectionError: null })
      })

      ws.on('connected', () => {
        set({ connectionState: ConnectionState.Connected, connectionError: null })
        console.log('Connected to server')
      })

      ws.on('disconnected', () => {
        set({ connectionState: ConnectionState.Disconnected })
        console.log('Disconnected from server')
      })

      ws.on('error', (error: any) => {
        set({ connectionState: ConnectionState.Error, connectionError: error.message })
        console.error('WebSocket error:', error)
      })

      // 监听游戏消息
      ws.on('login', (data: any) => {
        console.log('Login response:', data)
        if (data.ok) {
          set({
            player: {
              id: 'player_001',
              name: '传伟哥',
              level: 1,
              experience: 0,
              health: 100,
              maxHealth: 100,
              energy: 100,
              maxEnergy: 100
            }
          })
        } else {
          set({ connectionError: data.message })
        }
      })

      ws.on('chat', (data: any) => {
        set((state) => ({
          chatMessages: [
            ...state.chatMessages,
            {
              fromPlayerId: data.from_player_id,
              content: data.content,
              timestamp: Date.now()
            }
          ]
        }))
      })

      ws.on('heartbeat', (data: any) => {
        console.log('Heartbeat:', data)
      })

      // 连接
      await ws.connect()
      set({ webSocket: ws })
    } catch (error: any) {
      console.error('Failed to connect:', error)
      set({ connectionState: ConnectionState.Error, connectionError: error.message })
    }
  },

  disconnectFromServer: () => {
    const { webSocket } = get()
    if (webSocket) {
      webSocket.disconnect()
      set({
        webSocket: null,
        connectionState: ConnectionState.Disconnected,
        player: null
      })
    }
  },

  login: (playerId: string, token: string) => {
    const { webSocket } = get()
    if (webSocket) {
      webSocket.login(playerId, token)
    }
  },

  sendChat: (roomId: string, content: string) => {
    const { webSocket } = get()
    if (webSocket) {
      webSocket.sendChat(roomId, content)
    }
  }
}))

export default useGameStore
