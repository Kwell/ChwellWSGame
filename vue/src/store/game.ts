import create from 'zustand'

// 连接状态枚举
export enum ConnectionState {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
  Reconnecting = 'reconnecting',
  Error = 'error'
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

// 游戏状态接口
interface GameState {
  // 连接状态
  connectionState: ConnectionState
  connectionError: string | null

  // 玩家信息
  player: Player | null

  // Actions
  setConnectionState: (state: ConnectionState) => void
  setConnectionError: (error: string | null) => void
  updatePlayer: (player: Partial<Player>) => void
  setPlayer: (player: Player | null) => void

  // WebSocket 连接
  connectToServer: (url: string) => void
  disconnectFromServer: () => void
}

// 创建 store
export const useGameStore = create<GameState>((set, get) => ({
  // 初始状态
  connectionState: ConnectionState.Disconnected,
  connectionError: null,
  player: null,

  // Actions
  setConnectionState: (state) => set({ connectionState: state }),
  setConnectionError: (error) => set({ connectionError: error }),

  updatePlayer: (updates) =>
    set((state) => ({
      player: state.player ? { ...state.player, ...updates } : null
    })),

  setPlayer: (player) => set({ player }),

  connectToServer: (url: string) => {
    // TODO: 实现 WebSocket 连接逻辑
    console.log('Connecting to:', url)
    set({ connectionState: ConnectionState.Connecting })

    // 临时模拟连接
    setTimeout(() => {
      set({ connectionState: ConnectionState.Connected })
      console.log('Connected to server')
    }, 1000)
  },

  disconnectFromServer: () => {
    // TODO: 实现断开连接逻辑
    console.log('Disconnecting from server')
    set({ connectionState: ConnectionState.Disconnected, player: null })
  }
}))

export default useGameStore
