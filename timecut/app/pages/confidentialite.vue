<template>
  <div>
    <main class="pt-28 pb-20 bg-[#191022] text-white min-h-screen px-6">
      <article class="max-w-3xl mx-auto">
        <NuxtLink to="/" class="text-[#7f13ec] text-sm hover:underline">← Retour à l'accueil</NuxtLink>

        <h1 class="text-3xl lg:text-4xl font-bold mt-6 mb-2">Politique de confidentialité</h1>
        <p class="text-gray-500 text-sm mb-10">Dernière mise à jour : {{ lastUpdated }}</p>

        <div class="space-y-8 text-gray-300 leading-relaxed">

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">1. Qui sommes-nous ?</h2>
            <p>
              TimeCut est un service en ligne qui transforme vos vidéos longues en clips courts
              sous-titrés. La présente politique explique quelles données nous collectons, pourquoi,
              et comment vous gardez le contrôle sur vos contenus.
            </p>
            <p class="mt-2">
              Responsable du traitement : <span class="text-white"></span>
              <a href="mailto:timecutproject@gmail.com" class="text-[#7f13ec] hover:underline">timecutproject@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">2. Les données que nous collectons</h2>
            <ul class="space-y-2 list-disc list-inside">
              <li><span class="text-white">Compte :</span> adresse e-mail et identifiant d'authentification.</li>
              <li><span class="text-white">Vidéos importées :</span> les fichiers que vous uploadez pour générer vos clips.</li>
              <li><span class="text-white">Contenus générés :</span> clips, transcriptions et sous-titres produits à partir de vos vidéos.</li>
              <li><span class="text-white">Données de facturation :</span> plan choisi et historique de paiement (le paiement est traité de manière sécurisée par notre prestataire de paiement).</li>
              <li><span class="text-white">Données d'usage :</span> minutes consommées, projets créés, afin de gérer votre quota.</li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">3. Comment nous utilisons vos vidéos</h2>
            <p>
              Pour fonctionner, TimeCut s'appuie sur des services d'intelligence artificielle tiers qui
              transcrivent et traduisent l'audio de vos vidéos. Vos vidéos sont utilisées
              <span class="text-white">uniquement</span> pour fournir le service : extraction de l'audio,
              transcription, traduction des sous-titres et découpage en clips.
            </p>
            <p class="mt-2 bg-[#1e1333] border border-[#7f13ec]/30 rounded-xl p-4">
              <span class="text-white font-medium">TimeCut n'entraîne aucun modèle d'intelligence artificielle
              avec vos vidéos</span>, et nos prestataires d'IA n'utilisent pas les contenus transmis via leur
              interface (API) pour entraîner leurs modèles. Nous ne partageons ni ne vendons vos vidéos à des
              tiers à des fins publicitaires. Vous restez propriétaire de l'intégralité de vos contenus.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">4. Conservation et suppression de vos fichiers</h2>
            <ul class="space-y-2 list-disc list-inside">
              <li>
                <span class="text-white">Fichiers temporaires de traitement</span> (audio extrait, fichiers
                intermédiaires) : supprimés automatiquement de nos serveurs dès la fin du traitement.
              </li>
              <li>
                <span class="text-white">Vidéo source</span> : conservée uniquement le temps de générer vos clips,
                puis <span class="text-white">supprimée automatiquement dès que vos clips sont prêts</span>. Nous ne
                conservons pas votre vidéo d'origine.
              </li>
            </ul>
            <p class="mt-2">
              Pour supprimer votre compte et l'ensemble de vos données, écrivez-nous à
              <a href="mailto:timecutproject@gmail.com" class="text-[#7f13ec] hover:underline">timecutproject@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">5. Vos droits</h2>
            <p>
              Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de suppression et de
              portabilité de vos données, ainsi que d'un droit d'opposition. Pour exercer ces droits, contactez-nous à
              <a href="mailto:timecutproject@gmail.com" class="text-[#7f13ec] hover:underline">timecutproject@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">6. Sécurité</h2>
            <p>
              Les accès à votre compte sont protégés par authentification. Les transferts de fichiers sont chiffrés
              (HTTPS). Nous limitons l'accès interne aux données au strict nécessaire.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">7. Modifications</h2>
            <p>
              Cette politique peut évoluer. En cas de changement important, nous vous en informerons. La date de
              dernière mise à jour figure en haut de cette page.
            </p>
          </section>

        </div>
      </article>
    </main>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'landingpage' })

const lastUpdated = '5 juin 2026'
</script>
