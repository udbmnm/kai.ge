import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import App from './App.vue'
import VueCropper from 'vue-cropper'
Vue.use(VueCropper)
Vue.use(ElementUI)

new Vue({
  el: '#app',
  render: h => h(App)
})
