<template>
  <header class="fixed top-0 left-0 w-full z-50 bg-[#191022] backdrop-blur-sm border-b border-[#7f13ec]/20">
    <div class="container mx-auto px-6 py-4 flex items-center justify-between">
      <!-- Logo -->
      
      <div class="text-2xl font-bold">
        <img src="/icons/logopng.png" alt="TimeCut Logo" class="w-10 h-10 inline-block mr-2" />
        <span class="text-white">Time</span><span class="text-[#7f13ec]">Cut</span>
      </div>

      <!-- Navigation desktop -->
      <nav class="hidden md:flex space-x-8 text-gray-200">
        <a href="#features" class="hover:text-[#7f13ec] transition">Fonctionnalités</a>
        <a href="#how-it-works" class="hover:text-[#7f13ec] transition">Comment ça marche</a>
        <a href="#pricing" class="hover:text-[#7f13ec] transition">Tarifs</a>
      </nav>

      <!-- CTA desktop -->
      <NuxtLink
        v-if="user"
        to="/newproject"
        class="hidden md:block bg-[#7f13ec] hover:bg-[#a855f7] text-white px-6 py-2 rounded-full font-semibold transition"
      >
        Dashboard
      </NuxtLink>
      <NuxtLink
        v-else
        to="/login"
        class="hidden md:block bg-[#7f13ec] hover:bg-[#a855f7] text-white px-6 py-2 rounded-full font-semibold transition"
      >
        Essayer gratuitement
      </NuxtLink>

      <!-- Hamburger -->
      <button @click="menuOpen = !menuOpen" class="md:hidden text-white focus:outline-none">
        <svg v-if="!menuOpen" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Mobile menu -->
    <div v-if="menuOpen" class="md:hidden bg-[#191022] border-t border-[#7f13ec]/20 px-6 py-4 space-y-4">
      <nav class="flex flex-col space-y-3">
        <a @click="menuOpen = false" href="#features" class="text-gray-200 hover:text-[#7f13ec] transition py-2">Fonctionnalités</a>
        <a @click="menuOpen = false" href="#how-it-works" class="text-gray-200 hover:text-[#7f13ec] transition py-2">Comment ça marche</a>
        <a @click="menuOpen = false" href="#pricing" class="text-gray-200 hover:text-[#7f13ec] transition py-2">Tarifs</a>
      </nav>

      <!-- CTA mobile -->
      <NuxtLink
        v-if="user"
        to="/newproject"
        @click="menuOpen = false"
        class="block bg-[#7f13ec] hover:bg-[#a855f7] text-white px-6 py-2 rounded-full font-semibold transition text-center"
      >
        Dashboard
      </NuxtLink>
      <NuxtLink
        v-else
        to="/login"
        @click="menuOpen = false"
        class="block bg-[#7f13ec] hover:bg-[#a855f7] text-white px-6 py-2 rounded-full font-semibold transition text-center"
      >
        Essayer gratuitement
      </NuxtLink>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../plugins/firebase.client'

const menuOpen = ref(false)
const user = ref(null)

let unsubscribe = null

onMounted(() => {
  // Firebase écoute en temps réel l'état de connexion
  unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser
  })
})

onUnmounted(() => {
  // On arrête l'écoute quand le composant est détruit
  if (unsubscribe) unsubscribe()
})
</script>