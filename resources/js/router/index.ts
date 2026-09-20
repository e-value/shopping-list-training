import { createRouter, createWebHistory } from 'vue-router';
import ItemListView from '../views/ItemListView.vue';
import ItemDetailView from '../views/ItemDetailView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'items.index', component: ItemListView },
    { path: '/items/:id', name: 'items.show', component: ItemDetailView },
  ],
});

export default router;
