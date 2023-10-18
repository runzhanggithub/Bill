import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import ElementPlus from 'element-plus'
import zhCn from "element-plus/es/locale/lang/zh-cn";
import axios from './apis/index';

import {
  ElButton,
  ElHeader,
  ElMain,
  ElFooter,
  ElForm,
  ElFormItem,
  ElInput,
  ElCard,
  ElMenu,
  ElSubMenu,
  ElMenuItemGroup,
  ElMenuItem,
  ElContainer,
  ElAside,
  ElMessage
} from 'element-plus'


const app = createApp(App);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
//组件中文
app.use(ElementPlus, {
  locale: zhCn,
})
app.use(ElButton)
  .use(ElHeader)
  .use(ElMain)
  .use(ElFooter)
  .use(ElForm)
  .use(ElFormItem)
  .use(ElInput)
  .use(ElCard)
  .use(ElMenu)
  .use(ElSubMenu)
  .use(ElMenuItemGroup)
  .use(ElMenuItem)
  .use(ElContainer)
  .use(ElAside)
  .use(ElMessage)
app.config.globalProperties.$axios = axios
app.use(router)
app.mount('#app')

