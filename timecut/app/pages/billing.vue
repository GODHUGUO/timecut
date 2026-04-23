<template>
  <div class="space-y-6 pb-10">
    <div>
      <h1 class="text-2xl font-bold text-white">Facturation et abonnement</h1>
      <p class="text-gray-400 text-sm mt-1">Gérez votre abonnement et consultez votre quota du mois.</p>
    </div>

    <!-- Bandeau succès paiement -->
    <div v-if="paymentSuccess" class="flex items-center gap-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl px-5 py-4 text-sm font-medium">
      <Icon name="lucide:check-circle" class="w-5 h-5 shrink-0" />
      Paiement confirmé ! Votre abonnement a été activé avec succès.
    </div>

    <div class="bg-[#1e1333] border border-[#7f13ec]/20 rounded-2xl p-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="flex items-start gap-4">
          <div
            class="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
            :class="{
              'bg-gray-700': currentPlan === 'free',
              'bg-[#7f13ec]/60': currentPlan === 'starter',
              'bg-[#7f13ec]': currentPlan === 'pro',
            }"
          >
            <Icon name="lucide:sparkles" class="w-7 h-7 text-white" />
          </div>

          <div class="flex-1">
            <p class="text-[#7f13ec] text-xs font-semibold uppercase tracking-widest mb-1">Plan actuel</p>
            <h2 class="text-white text-xl font-bold">{{ currentPlanDetails.name }}</h2>
            <p class="text-gray-400 text-sm mt-0.5">
              {{ currentPlanDetails.monthlyPriceLabel }}
              <span v-if="currentPlan !== 'free' && renewalDateLabel"> • Renouvellement le {{ renewalDateLabel }}</span>
            </p>
            <p class="text-gray-500 text-xs mt-2">
              {{ subscription?.minutesRemaining || 0 }} min restantes sur {{ subscription?.minutesIncluded || currentPlanDetails.minutes }} min.
            </p>

            <div class="flex gap-3 mt-4">
              <button
                v-if="currentPlan !== 'pro'"
                @click="updatePlanSelection(currentPlan === 'free' ? 'starter' : 'pro')"
                :disabled="isUpdatingPlan || isPaying"
                class="px-4 py-2 bg-[#7f13ec] hover:bg-[#9333ea] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ isPaying ? 'Redirection...' : isUpdatingPlan ? 'Mise à jour...' : 'Upgrader' }}
              </button>
              <button
                v-if="currentPlan !== 'free'"
                @click="updatePlanSelection('free')"
                class="px-4 py-2 border border-[#7f13ec]/30 text-gray-300 hover:text-white text-sm rounded-lg transition-colors"
              >
                Revenir au gratuit
              </button>
            </div>
          </div>
        </div>

        <div class="bg-[#2a1a44] rounded-xl p-4">
          <div class="flex items-center justify-between mb-3">
            <p class="text-white text-sm font-medium">Minutes utilisées ce mois</p>
            <span class="text-[#7f13ec] text-sm font-bold">{{ usagePercent }}%</span>
          </div>
          <div class="w-full h-2.5 bg-[#3d2460] rounded-full overflow-hidden mb-3">
            <div
              class="h-full rounded-full transition-all duration-700"
              :class="usagePercent >= 90 ? 'bg-red-500' : 'bg-linear-to-r from-[#7f13ec] to-[#a855f7]'"
              :style="{ width: `${usagePercent}%` }"
            />
          </div>
          <p class="text-gray-400 text-xs">
            <span class="text-white font-semibold">{{ subscription?.minutesUsed || 0 }} / {{ subscription?.minutesIncluded || currentPlanDetails.minutes }} min</span>
            utilisées ce mois-ci.
          </p>
          <p v-if="usagePercent >= 90" class="text-red-400 text-xs mt-2 flex items-center gap-1">
            <Icon name="lucide:alert-triangle" class="w-3 h-3" />
            Quota presque épuisé, pensez à changer de plan.
          </p>
        </div>
      </div>
    </div>

    <div class="bg-[#1e1333] border border-[#7f13ec]/20 rounded-2xl p-6">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-8 h-8 rounded-lg bg-[#7f13ec]/20 flex items-center justify-center">
          <Icon name="lucide:layers" class="w-4 h-4 text-[#7f13ec]" />
        </div>
        <h3 class="text-white font-semibold text-base">Changer de plan</h3>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="key in planKeys"
          :key="key"
          class="rounded-xl p-5 border-2 transition-all flex flex-col"
          :class="currentPlan === key
            ? 'border-[#7f13ec] bg-[#7f13ec]/10'
            : 'border-[#7f13ec]/10 bg-[#2a1a44] hover:border-[#7f13ec]/30'"
        >
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-white font-semibold text-sm">{{ plans[key].name }}</h4>
            <span v-if="currentPlan === key" class="text-xs px-2 py-0.5 bg-[#7f13ec] text-white rounded-full">Actuel</span>
          </div>
          <p class="text-2xl font-bold text-white mb-1">{{ plans[key].price }}</p>
          <p class="text-gray-500 text-xs mb-4">{{ plans[key].minutes }} min / mois</p>
          <ul class="space-y-2 mb-5 flex-1">
            <li
              v-for="feature in plans[key].features"
              :key="feature.label"
              class="flex items-center gap-2 text-xs"
              :class="feature.included ? 'text-gray-300' : 'text-gray-600'"
            >
              <Icon
                :name="feature.included ? 'lucide:check' : 'lucide:x'"
                class="w-3.5 h-3.5 shrink-0"
                :class="feature.included ? 'text-[#7f13ec]' : 'text-gray-700'"
              />
              {{ feature.label }}
            </li>
          </ul>
          <button
            v-if="currentPlan !== key"
            @click="updatePlanSelection(key)"
            :disabled="isUpdatingPlan || isPaying"
            class="w-full py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :class="key === 'pro'
              ? 'bg-[#7f13ec] hover:bg-[#9333ea] text-white'
              : key === 'starter'
                ? 'bg-[#7f13ec]/40 hover:bg-[#7f13ec]/60 text-white'
                : 'border border-gray-600 text-gray-400 hover:text-white'"
          >
            {{ isPaying ? 'Redirection...' : isUpdatingPlan ? 'Mise à jour...' : key === 'free' ? 'Choisir gratuit' : 'Choisir ce plan' }}
          </button>
          <div v-else class="w-full py-2 text-center text-xs text-[#7f13ec] font-medium">
            Plan actuel ✓
          </div>
        </div>
      </div>
    </div>

    <div v-if="currentPlan !== 'free'" class="bg-[#1e1333] border border-[#7f13ec]/20 rounded-2xl p-6">
      <div class="flex items-center gap-3 mb-5">
        <div class="w-8 h-8 rounded-lg bg-[#7f13ec]/20 flex items-center justify-center">
          <Icon name="lucide:receipt" class="w-4 h-4 text-[#7f13ec]" />
        </div>
        <h3 class="text-white font-semibold text-base">Historique des factures</h3>
      </div>

      <div class="grid grid-cols-3 px-4 pb-3 border-b border-[#7f13ec]/10">
        <span class="text-gray-500 text-xs uppercase tracking-widest">Date</span>
        <span class="text-gray-500 text-xs uppercase tracking-widest">Montant</span>
        <span class="text-gray-500 text-xs uppercase tracking-widest">Statut</span>
      </div>

      <div
        v-for="(invoice, index) in invoices"
        :key="index"
        class="grid grid-cols-3 items-center px-4 py-4 border-b border-[#7f13ec]/10 last:border-0 hover:bg-[#7f13ec]/5 rounded-xl transition-colors"
      >
        <span class="text-gray-300 text-sm">{{ invoice.date }}</span>
        <span class="text-white text-sm font-medium">{{ invoice.amount }}</span>
        <span>
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
            {{ invoice.status }}
          </span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { PLAN_CATALOG, PLAN_ORDER } from '../utils/plans'

definePageMeta({
  layout: 'dashboard',
})

const route = useRoute()

const { subscription, currentPlan, currentPlanDetails, refreshSubscription, changePlan } = useSubscription()
const { isPaying, createCheckout } = usePayment()

const plans = PLAN_CATALOG
const planKeys = PLAN_ORDER
const isUpdatingPlan = ref(false)
const paymentSuccess = computed(() => route.query.payment === 'success')

const usagePercent = computed(() => {
  if (!subscription.value) return 0
  return Math.min(
    Math.round((subscription.value.minutesUsed / subscription.value.minutesIncluded) * 100),
    100,
  )
})

const renewalDateLabel = computed(() => {
  if (!subscription.value?.billingPeriodEnd) return ''
  return new Date(subscription.value.billingPeriodEnd).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
})

const invoices = computed(() => {
  if (currentPlan.value === 'free') return []

  const amount = `${currentPlanDetails.value.price.replace('€', '')} €`
  return [
    { date: '12 mars 2026', amount, status: 'Payé' },
    { date: '12 févr. 2026', amount, status: 'Payé' },
    { date: '12 janv. 2026', amount, status: 'Payé' },
  ]
})

const updatePlanSelection = async (plan) => {
  if (plan === currentPlan.value || isUpdatingPlan.value || isPaying.value) return

  // Plan gratuit : changement direct
  if (plan === 'free') {
    try {
      isUpdatingPlan.value = true
      await changePlan(plan)
    } catch (error) {
      console.error('Erreur changement de plan :', error)
      alert("Impossible de mettre à jour l'abonnement pour le moment.")
    } finally {
      isUpdatingPlan.value = false
    }
    return
  }

  // Plan payant : redirection vers LeekPay
  try {
    await createCheckout(plan)
  } catch (error) {
    console.error('Erreur paiement :', error)
    alert("Impossible d'initier le paiement. Veuillez réessayer.")
  }
}

onMounted(async () => {
  try {
    await refreshSubscription()
    // Nettoyer l'URL après retour de paiement
    if (route.query.payment === 'success') {
      navigateTo('/billing', { replace: true })
    }
  } catch (error) {
    console.error('Erreur chargement abonnement :', error)
  }
})
</script>
