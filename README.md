# ChwellWSGame

基于 Cocos Creator + TypeScript + Vue 的 H5 游戏客户端。

## 技术栈

- **游戏引擎**: Cocos Creator (游戏逻辑、渲染、物理)
- **UI 框架**: Vue 3 (用户界面、菜单、弹窗)
- **开发语言**: TypeScript
- **状态管理**: Zustand (轻量级，适合游戏场景)
- **通信**: WebSocket + Protobuf
- **构建工具**: Cocos Creator 构建系统

## 架构

```
┌─────────────────────────────────────────┐
│  Cocos Canvas (游戏画面、角色、场景)      │
│  ├── 游戏逻辑                          │
│  ├── 物理引擎                          │
│  └── 动画系统                          │
└─────────────────────────────────────────┘
                    △
                    │
              Vue Overlay
                    │
┌─────────────────────────────────────────┐
│  Vue UI Layer (HTML/CSS 组件)          │
│  ├── 菜单                             │
│  ├── 弹窗                             │
│  ├── HUD                              │
│  └── 设置面板                          │
│                                       │
│  Zustand Store (全局状态管理)            │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  WebSocket + Protobuf                  │
│  (与 ChwellCore 通信)                  │
└─────────────────────────────────────────┘
```

## 项目结构

```
ChwellWSGame/
├── assets/              # Cocos Creator 资源
│   ├── scenes/        # 游戏场景
│   ├── scripts/       # TypeScript 游戏逻辑
│   ├── prefabs/       # 预制体
│   ├── textures/      # 纹理
│   ├── audio/         # 音频
│   └── ...
├── vue/               # Vue UI 组件
│   ├── src/
│   │   ├── components/  # Vue 组件
│   │   ├── store/       # Zustand store
│   │   ├── utils/       # 工具函数
│   │   └── types/       # TypeScript 类型定义
│   ├── public/          # 静态资源
│   ├── index.html       # HTML 入口
│   ├── package.json     # npm 依赖
│   ├── vite.config.ts   # Vite 配置
│   └── tsconfig.json    # TS 配置
├── proto/             # Protobuf 协议定义（与后端共享）
├── build/             # 构建输出
├── docs/              # 文档
└── README.md
```

## 状态管理选择：Zustand

**为什么选择 Zustand？**

1. **轻量级**: 只有 1KB gzipped，不影响游戏性能
2. **简单 API**: 学习成本低，代码简洁
3. **TypeScript 支持**: 完整的类型推导
4. **性能优秀**: 无需 Provider，订阅精准更新
5. **适合游戏场景**: 快速响应，低延迟

**状态结构（示例）**:

```typescript
// store/game.ts
import create from 'zustand'

interface GameState {
  player: Player
  inventory: Inventory
  connections: ConnectionState
  updatePlayer: (player: Player) => void
  connectToServer: () => void
}

const useGameStore = create<GameState>((set) => ({
  player: null,
  inventory: [],
  connections: 'disconnected',
  updatePlayer: (player) => set({ player }),
  connectToServer: () => { /* WebSocket 连接逻辑 */ }
}))

export default useGameStore
```

## 开发流程

### 1. 初始化 Cocos Creator 项目
```bash
# 使用 Cocos Creator 命令行工具创建项目
# 或者使用 Cocos Creator 编辑器创建
```

### 2. 初始化 Vue 项目
```bash
cd vue
npm create vue@latest
npm install zustand
```

### 3. 集成通信层
```bash
npm install protobufjs @protobufjs/plugin-ts
```

### 4. 同步 Protobuf 协议
```bash
# 从 ChwellCore/proto/ 复制 game.proto
# 生成 TypeScript 代码
```

## 后端连接

- **服务器地址**: 待配置
- **WebSocket URL**: 待配置
- **Protobuf 版本**: 与 ChwellCore 同步

## 开发规范

### 命名规范
- 组件: PascalCase (如 `PlayerHealthBar`)
- 文件: kebab-case (如 `player-health-bar.ts`)
- 变量: camelCase (如 `playerHealth`)

### 代码规范
- 使用 TypeScript 严格模式
- 遵循 ESLint 配置
- 使用 Prettier 格式化

## 构建部署

```bash
# 构建 Vue UI
cd vue
npm run build

# 构建 Cocos Creator 项目
# 使用 Cocos Creator 编辑器构建
```

---

**创建日期**: 2026-03-18
**开发者**: 传伟哥 (游戏后端开发)
