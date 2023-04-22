import { createApp } from 'vue';
import './style.css';
import Ui from '@mostro-web/mostro-ui';
import App from './App.vue';

const app = createApp(App);
app.use(Ui);
app.mount('#app');
