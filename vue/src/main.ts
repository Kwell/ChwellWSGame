import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import Chat from './components/Chat.vue'

// 注册组件
const app = createApp(App)
app.component('Chat', Chat)
app.mount('#app')
