// Protobuf 编解码工具
import protobuf from 'protobufjs/light'
import gameProto from '../../../proto/game.proto'

// 协议包名
const packageName = 'chwell.game'

// 消息类型映射
const messageTypeMap = {
  C2S_Login: 'C2S_Login',
  S2C_Login: 'S2C_Login',
  C2S_Chat: 'C2S_Chat',
  S2C_Chat: 'S2C_Chat',
  C2S_Heartbeat: 'C2S_Heartbeat',
  S2C_Heartbeat: 'S2C_Heartbeat'
}

// 根类型实例
let root: protobuf.Root | null = null
let messageTypes: Record<string, protobuf.Type> = {}

// 初始化 Protobuf
export async function initProtobuf(): Promise<void> {
  if (root) {
    return // 已经初始化
  }

  try {
    // 解析 .proto 文件
    root = await protobuf.parse(gameProto).root

    // 获取所有消息类型
    for (const [key, typeName] of Object.entries(messageTypeMap)) {
      messageTypes[key] = root.lookupType(`${packageName}.${typeName}`)
    }

    console.log('Protobuf initialized:', Object.keys(messageTypes))
  } catch (error) {
    console.error('Failed to initialize Protobuf:', error)
    throw error
  }
}

// 编码消息
export function encodeMessage(typeName: string, data: any): Uint8Array {
  if (!root) {
    throw new Error('Protobuf not initialized. Call initProtobuf() first.')
  }

  const messageType = messageTypes[typeName]
  if (!messageType) {
    throw new Error(`Unknown message type: ${typeName}`)
  }

  try {
    const message = messageType.create(data)
    const encoded = messageType.encode(message).finish()
    return encoded
  } catch (error) {
    console.error('Failed to encode message:', error)
    throw error
  }
}

// 解码消息
export function decodeMessage(data: Uint8Array): any {
  if (!root) {
    throw new Error('Protobuf not initialized. Call initProtobuf() first.')
  }

  try {
    // 尝试解析为任何已知消息类型
    for (const [typeName, messageType] of Object.entries(messageTypes)) {
      try {
        const decoded = messageType.decode(data)
        return {
          [typeName]: messageType.toObject(decoded)
        }
      } catch (error) {
        // 继续尝试下一个类型
        continue
      }
    }

    throw new Error('Failed to decode message: unknown type')
  } catch (error) {
    console.error('Failed to decode message:', error)
    throw error
  }
}

// 导出消息类型映射
export { messageTypeMap }
