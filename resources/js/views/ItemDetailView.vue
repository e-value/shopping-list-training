<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getItem, deleteItem } from '../api/items'
import type { Item } from '../types/item'    // ← 追加

const route = useRoute()
const router = useRouter()
const item = ref<Item | null>(null)           // ← ref(null) → ref<Item | null>(null) に変更

async function loadItem() {
  const response = await getItem(Number(route.params.id))
  item.value = response.data
}

async function remove() {
  if (!item.value) return   
  if (!confirm(`「${item.value.product_name}」を削除しますか？`)) return
  await deleteItem(item.value.id)
  router.push('/')
}

onMounted(loadItem)
</script>

<template>
  <div v-if="item" class="space-y-4">
    <router-link to="/" class="inline-block text-pink-500 hover:underline text-sm">
      ← リストに戻る
    </router-link>

    <section class="bg-white rounded-2xl shadow-sm border border-pink-100 p-6">
      <h2 class="text-2xl font-bold text-pink-700 mb-1">
        {{ item.product_name }}
      </h2>
      <p class="text-sm text-pink-400 mb-5">「{{ item.product_name }}」の詳細</p>

      <dl class="space-y-2 text-sm">
        <div class="flex">
          <dt class="w-24 text-pink-500">数量</dt>
          <dd>{{ item.quantity }}</dd>
        </div>
        <div class="flex">
          <dt class="w-24 text-pink-500">メモ</dt>
          <dd>{{ item.memo || '—' }}</dd>
        </div>
        <div class="flex">
          <dt class="w-24 text-pink-500">購入済み</dt>
          <dd>{{ item.purchased ? '✅' : '⬜' }}</dd>
        </div>
      </dl>

      <button
        @click="remove"
        class="mt-6 px-4 py-2 text-sm text-rose-400 hover:bg-rose-50 rounded-lg transition-colors"
      >
        「{{ item.product_name }}」を削除する
      </button>
    </section>
  </div>
  <p v-else class="p-5 text-pink-300 text-center">読み込み中…</p>
</template>
