<template>
   <footer class="bg-[#191022] border-t border-[#7f13ec]/20 py-12">
    <div class="container mx-auto px-6 ">
      
      <!-- Grid -->
      <div class="grid gap-10 text-gray-300 max-w-5xl mx-auto text-center md:text-left md:grid-cols-3 ">
        
        <!-- Colonne 1 -->
        <div class="space-y-3">
          <h4 class="text-white font-bold text-lg">TimeCut</h4>
          <p class="text-sm">
            Transformez vos longues vidéos en clips courts pour les réseaux sociaux.
          </p>
        </div>

        <!-- Colonne 2 -->
        <div class="space-y-3">
          <h4 class="text-white font-semibold">Produit</h4>
          <ul class="space-y-2 text-sm">
            <li><a href="#features" class="hover:text-[#7f13ec]">Fonctionnalités</a></li>
            <li><a href="#pricing" class="hover:text-[#7f13ec]">Tarifs</a></li>
          </ul>
        </div>

        <!-- Colonne 3 -->
        <div class="space-y-3">
          <h4 class="text-white font-semibold">Connexion</h4>
          <ul class="space-y-2 text-sm">
            <li> <NuxtLink to="/login" class="hover:text-[#7f13ec]">Se connecter</NuxtLink></li>
          </ul>
        </div>

      </div>

      <!-- Copyright -->
      <div class="border-t border-gray-800 mt-10 pt-6 text-center text-sm text-gray-400">
        © {{ currentYear }} TimeCut. Tous droits réservés.
      </div>

    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'

// Année dynamique
const currentYear = computed(() => new Date().getFullYear())
</script>