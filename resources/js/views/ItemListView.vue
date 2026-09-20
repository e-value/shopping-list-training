<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { listItems, createItem, deleteItem } from '../api/items'
import type { Item } from '../types/item'

const items = ref<Item[]>([])
const newName = ref<string>('')
const newQuantity = ref<number>(1)

async function loadItems() {
  const response = await listItems()
  items.value = response.data
}

async function addItem() {
  if (!newName.value) return
  await createItem({ product_name: newName.value, quantity: newQuantity.value })
  newName.value = ''
  newQuantity.value = 1
  await loadItems()
}

async function removeItem(item: Item) {
  if (!confirm(`「${item.product_name}」を削除しますか？`)) return
  await deleteItem(item.id)
  await loadItems()
}

onMounted(loadItems)
</script>

<template>
  <div class="space-y-6">
    <section class="bg-white rounded-2xl shadow-sm border border-pink-100 p-5">
      <h2 class="text-lg font-semibold mb-3 text-pink-700">
        アイテムを追加
      </h2>
      <form @submit.prevent="addItem" class="flex gap-2">
        <input
          v-model="newName"
          type="text"
          placeholder="商品名"
          class="flex-1 px-3 py-2 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 placeholder-pink-300"
        />
        <input
          v-model.number="newQuantity"
          type="number"
          min="1"
          class="w-20 px-3 py-2 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300"
        />
        <button
          type="submit"
          class="px-5 py-2 bg-rose-300 text-white font-semibold rounded-xl hover:bg-rose-400 transition-colors shadow-sm"
        >
          追加
        </button>
      </form>
    </section>

    <section class="bg-white rounded-2xl shadow-sm border border-pink-100">
      <h2 class="text-lg font-semibold p-5 border-b border-pink-100 text-pink-700">
        🗒️ リスト
      </h2>
      <ul v-if="items.length" class="divide-y divide-pink-100">
        <li
          v-for="item in items"
          :key="item.id"
          class="flex items-center justify-between px-5 py-3 hover:bg-pink-50 transition-colors"
        >
          <div>
            <router-link
              :to="`/items/${item.id}`"
              class="font-medium text-gray-700 hover:text-pink-600 hover:underline"
            >
              {{ item.product_name }}
            </router-link>
            <span class="ml-2 text-sm text-pink-500">× {{ item.quantity }}</span>
          </div>
          <button
            @click="removeItem(item)"
            class="px-3 py-1 text-sm text-rose-400 hover:bg-rose-50 rounded-lg transition-colors"
          >
            削除
          </button>
        </li>
      </ul>
      <p v-else class="p-5 text-pink-300 text-center">
        アイテムがありません 🐒
      </p>
    </section>
  </div>
</template>
