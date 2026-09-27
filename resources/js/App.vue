<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen bg-pink-50">
    <header class="bg-gradient-to-r from-pink-100 to-rose-100 border-b border-pink-200">
      <div class="max-w-3xl mx-auto px-4 py-5">
        <h1 class="text-2xl font-bold text-pink-700 tracking-wide">
          🛒 買い物リスト <span class="text-rose-400">🍅</span>
        </h1>
      </div>
    </header>
    <main class="max-w-3xl mx-auto px-4 py-6">
      <router-view />
    </main>
  </div>
</template>
