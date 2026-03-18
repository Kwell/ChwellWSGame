// Protobuf 编解码工具
import protobuf from 'protobufjs/light'

// 协议包名
const packageName = 'chwell.game'

// Protocol Buffer 定义（内联以避免 import .proto 的问题）
const protoDefinition = `
syntax = "proto3";

package chwell.game;

// 登录请求/响应
message C2S_Login {
  string player_id = 1;
  string token     = 2;
}

message S2C_Login {
  bool   ok       = 1;
  string message  = 2;
}

// 聊天请求/响应
message C2S_Chat {
  string room_id  = 1;
  string content  = 2;
}

message S2C_Chat {
  string from_player_id = 1;
  string content        = 2;
}

// 心跳
message C2S_Heartbeat {
  int64 timestamp_ms = 1;
}

message S2C_Heartbeat {
  int64 timestamp_ms = 1;
}
`

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

// 解码消息 - 需要知道消息类型名
export function decodeMessage(typeName: string, data: Uint8Array): any {
  if (!root) {
    throw new Error('Protobuf not initialized. Call initProtobuf() first.')
  }

  try {
    const messageType = messageTypes[typeName]
    if (!messageType) {
      throw new Error(`Unknown message type: ${typeName}`)
    }

    const decoded = messageType.decode(data)
    return messageType.toObject(decoded)
  } catch (error) {
    console.error(`Failed to decode message (${typeName}):`, error)
    throw error
  }
}

// 编码消息（带类型前缀）
export function encodeMessageWithType(typeName: string, data: any): Uint8Array {
  if (!root) {
    throw new Error('Protobuf not initialized. Call initProtobuf() first.')
  }

  try {
    const messageType = messageTypes[typeName]
    if (!messageType) {
      throw new Error(`Unknown message type: ${typeName}`)
    }

    // 编码消息内容
    const message = messageType.create(data)
    const content = messageType.encode(message).finish()

    // 创建带类型前缀的消息: [type_len][type_name][content_len][content]
    const typeNameBytes = new TextEncoder().encode(typeName)
    const typeLen = typeNameBytes.length
    const contentLen = content.length

    const result = new Uint8Array(4 + typeLen + 4 + contentLen)
    let offset = 0

    // 类型长度
    result[offset++] = (typeLen >> 24) & 0xFF
    result[offset++] = (typeLen >> 16) & 0xFF
    result[offset++] = (typeLen >> 8) & 0xFF
    result[offset++] = typeLen & 0xFF

    // 类型名称
    result.set(typeNameBytes, offset)
    offset += typeLen

    // 内容长度
    result[offset++] = (contentLen >> 24) & 0xFF
    result[offset++] = (contentLen >> 16) & 0xFF
    result[offset++] = (contentLen >> 8) & 0xFF
    result[offset++] = contentLen & 0xFF

    // 内容
    result.set(content, offset)

    return result
  } catch (error) {
    console.error('Failed to encode message with type:', error)
    throw error
  }
}

// 解码带类型前缀的消息
export function decodeMessageWithType(data: Uint8Array): { typeName: string; data: any } {
  if (data.length < 8) {
    throw new Error('Invalid message: too short')
  }

  let offset = 0

  // 读取类型长度
  const typeLen = (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3]
  offset += 4

  if (data.length < 8 + typeLen) {
    throw new Error('Invalid message: incomplete type name')
  }

  // 读取类型名称
  const typeName = new TextDecoder().decode(data.subarray(offset, offset + typeLen))
  offset += typeLen

  // 读取内容长度
  const contentLen = (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3]
  offset += 4

  if (data.length < offset + contentLen) {
    throw new Error('Invalid message: incomplete content')
  }

  // 解码内容
  const content = decodeMessage(typeName, data.subarray(offset, offset + contentLen))

  return { typeName, data: content }
}

// 导出消息类型映射
export { messageTypeMap }
