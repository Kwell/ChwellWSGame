// WebSocket 服务类
// 处理与 ChwellCore 的通信
import { EventEmitter } from 'events'
import * as protobuf from './protobuf'

// 消息类型
export enum MessageType {
  Login = 'C2S_Login',
  Chat = 'C2S_Chat',
  Heartbeat = 'C2S_Heartbeat'
}

// 连接状态
export enum ConnectionState {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
  Reconnecting = 'reconnecting',
  Error = 'error'
}

// WebSocket 服务
export class GameWebSocket extends EventEmitter {
  private ws: WebSocket | null = null
  private url: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  private heartbeatInterval: NodeJS.Timeout | null = null
  private heartbeatIntervalMs = 30000 // 30秒心跳
  private protobufInitialized = false

  constructor(url: string) {
    super()
    this.url = url
  }

  // 连接服务器
  async connect(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // 初始化 Protobuf
        if (!this.protobufInitialized) {
          await protobuf.initProtobuf()
          this.protobufInitialized = true
        }

        this.ws = new WebSocket(this.url)
        this.ws.binaryType = 'arraybuffer'

        this.ws.onopen = () => {
          console.log('WebSocket connected to:', this.url)
          this.emit('connected')
          this.startHeartbeat()
          this.reconnectAttempts = 0
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.ws.onclose = () => {
          console.log('WebSocket disconnected')
          this.stopHeartbeat()
          this.emit('disconnected')
          this.attemptReconnect()
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.emit('error', error)
          reject(error)
        }

        this.emit('connecting')
      } catch (error) {
        console.error('Failed to connect:', error)
        reject(error)
      }
    })
  }

  // 断开连接
  disconnect(): void {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.emit('disconnected')
  }

  // 发送消息
  send(type: MessageType, data: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected')
      return
    }

    try {
      // 编码为 Protobuf
      const encoded = protobuf.encodeMessage(type, data)
      this.ws.send(encoded)
      console.log('Sent:', type, data)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  // 登录
  login(playerId: string, token: string): void {
    this.send(MessageType.Login, {
      player_id: playerId,
      token
    })
  }

  // 发送聊天消息
  sendChat(roomId: string, content: string): void {
    this.send(MessageType.Chat, {
      room_id: roomId,
      content
    })
  }

  // 发送心跳
  sendHeartbeat(): void {
    this.send(MessageType.Heartbeat, {
      timestamp_ms: Date.now()
    })
  }

  // 处理接收到的消息
  private handleMessage(data: ArrayBuffer): void {
    try {
      // 解码 Protobuf 消息
      const message = protobuf.decodeMessage(new Uint8Array(data))
      console.log('Received:', message)

      // 根据消息类型分发事件
      if (message.S2C_Login) {
        this.emit('login', message.S2C_Login)
      } else if (message.S2C_Chat) {
        this.emit('chat', {
          fromPlayerId: message.S2C_Chat.from_player_id,
          content: message.S2C_Chat.content
        })
      } else if (message.S2C_Heartbeat) {
        this.emit('heartbeat', message.S2C_Heartbeat)
      }
    } catch (error) {
      console.error('Failed to handle message:', error)
    }
  }

  // 开始心跳
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat()
    }, this.heartbeatIntervalMs)
  }

  // 停止心跳
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // 尝试重连
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached')
      this.emit('error', new Error('Max reconnect attempts reached'))
      return
    }

    this.reconnectAttempts++
    console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)

    setTimeout(() => {
      this.connect()
    }, this.reconnectDelay)
  }
}

export default GameWebSocket
