<template>
  <div>
    <main class="pt-28 pb-20 bg-[#191022] text-white min-h-screen px-6">
      <article class="max-w-2xl mx-auto">
        <NuxtLink to="/" class="text-[#7f13ec] text-sm hover:underline">← Retour à l'accueil</NuxtLink>

        <h1 class="text-3xl lg:text-4xl font-bold mt-6 mb-3">Nous contacter</h1>
        <p class="text-gray-400 mb-10">
          Une question sur le fonctionnement, votre abonnement, le paiement Mobile Money ou la suppression de vos
          données ? Écrivez-nous, nous répondons rapidement.
        </p>

        <div class="space-y-4">
          <a
            href="mailto:timecutproject@gmail.com"
            class="flex items-center gap-4 bg-[#1e1333] border border-[#7f13ec]/20 hover:border-[#7f13ec] rounded-2xl p-5 transition"
          >
            <div class="w-11 h-11 rounded-xl bg-[#7f13ec]/20 flex items-center justify-center shrink-0">
              <Icon name="lucide:mail" class="w-5 h-5 text-[#7f13ec]" />
            </div>
            <div>
              <p class="text-white font-medium">Support par e-mail</p>
              <p class="text-gray-400 text-sm">timecutproject@gmail.com</p>
            </div>
          </a>

          <div class="flex items-center gap-4 bg-[#1e1333] border border-[#7f13ec]/20 rounded-2xl p-5">
            <div class="w-11 h-11 rounded-xl bg-[#7f13ec]/20 flex items-center justify-center shrink-0">
              <Icon name="lucide:shield-check" class="w-5 h-5 text-[#7f13ec]" />
            </div>
            <div>
              <p class="text-white font-medium">Confidentialité & suppression des données</p>
              <p class="text-gray-400 text-sm">
                Demandez la suppression de votre compte ou de vos vidéos — voir notre
                <NuxtLink to="/confidentialite" class="text-[#7f13ec] hover:underline">politique de confidentialité</NuxtLink>.
              </p>
            </div>
          </div>
        </div>
      </article>
    </main>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'landingpage' })
</script>
