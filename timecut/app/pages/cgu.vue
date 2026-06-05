<template>
  <div>
    <main class="pt-28 pb-20 bg-[#191022] text-white min-h-screen px-6">
      <article class="max-w-3xl mx-auto">
        <NuxtLink to="/" class="text-[#7f13ec] text-sm hover:underline">← Retour à l'accueil</NuxtLink>

        <h1 class="text-3xl lg:text-4xl font-bold mt-6 mb-2">Conditions générales d'utilisation</h1>
        <p class="text-gray-500 text-sm mb-10">Dernière mise à jour : {{ lastUpdated }}</p>

        <div class="space-y-8 text-gray-300 leading-relaxed">

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">1. Objet</h2>
            <p>
              Les présentes conditions régissent l'utilisation du service TimeCut, qui permet de découper des vidéos
              longues en clips courts, d'y ajouter des sous-titres et de les traduire. En créant un compte, vous
              acceptez ces conditions.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">2. Compte</h2>
            <p>
              Vous êtes responsable de l'exactitude des informations fournies et de la confidentialité de vos
              identifiants. Toute activité réalisée depuis votre compte vous est imputable.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">3. Vos contenus et vos droits</h2>
            <p>
              Vous conservez l'entière propriété des vidéos que vous importez et des clips générés. En utilisant
              TimeCut, vous nous accordez uniquement l'autorisation technique nécessaire au traitement de vos vidéos
              (transcription, traduction, découpage), pour la durée du service.
            </p>
            <p class="mt-2">
              Vous garantissez que vous disposez des droits sur les vidéos que vous importez et que leur contenu ne
              viole aucune loi ni aucun droit de tiers.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">4. Usages interdits</h2>
            <ul class="space-y-2 list-disc list-inside">
              <li>Importer des contenus illégaux, haineux, violents ou portant atteinte aux droits d'autrui.</li>
              <li>Tenter de contourner les quotas, de revendre le service ou d'en perturber le fonctionnement.</li>
            </ul>
            <p class="mt-2">
              En cas de manquement, nous pouvons suspendre ou supprimer votre compte.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">5. Offres et quotas</h2>
            <ul class="space-y-2 list-disc list-inside">
              <li><span class="text-white">Gratuit</span> — 20 min de vidéo traitée par mois.</li>
              <li><span class="text-white">Starter</span> — 4,99 €/mois, 60 min par mois.</li>
              <li><span class="text-white">Pro</span> — 12,99 €/mois, 200 min par mois.</li>
            </ul>
            <p class="mt-2">
              Les minutes sont décomptées sur la durée des vidéos importées. Les quotas se renouvellent chaque mois
              et les minutes non utilisées ne sont pas reportées. En cas de quota épuisé, une recharge peut être
              proposée.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">6. Paiement</h2>
            <p>
              Les abonnements payants sont réglés via notre prestataire de paiement, notamment par
              <span class="text-white">Mobile Money</span>. Le paiement déclenche l'activation du plan correspondant.
              Les conditions de remboursement sont précisées ci-dessous.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">7. Résiliation et remboursement</h2>
            <p>
              Vous pouvez cesser d'utiliser le service à tout moment. Les abonnements et recharges sont
              <span class="text-white">non remboursables</span> : aucun remboursement, total ou partiel, n'est
              effectué, y compris pour les minutes ou périodes d'abonnement non utilisées. Nous vous invitons à
              tester l'offre gratuite avant de souscrire à un plan payant.
            </p>
            <p class="mt-2">
              Pour toute question, vous pouvez nous contacter à
              <a href="mailto:timecutproject@gmail.com" class="text-[#7f13ec] hover:underline">timecutproject@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">8. Disponibilité et responsabilité</h2>
            <p>
              TimeCut est fourni « en l'état ». Nous nous efforçons d'assurer un service fiable mais ne garantissons
              pas une disponibilité ininterrompue ni l'absence d'erreurs dans les sous-titres ou traductions générés
              automatiquement. Notre responsabilité ne saurait être engagée pour un usage non conforme du service.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white mb-3">9. Modifications</h2>
            <p>
              Nous pouvons faire évoluer ces conditions. Les changements importants vous seront communiqués. La
              poursuite de l'utilisation du service vaut acceptation des conditions mises à jour.
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
