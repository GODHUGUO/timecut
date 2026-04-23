<template>
  <div>
    <main class="pt-20 bg-[#191022] text-white overflow-x-hidden">

      <!-- ═══════════════════════════════════════
           HERO SECTION
      ═══════════════════════════════════════ -->
      <section class="bg-[#191022] flex px-6 mt-2 min-h-[90vh] items-center">
        <div class="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center w-full">

          <!-- LEFT : Texte et CTA -->
          <div class="text-white space-y-6">
            <h1 class="text-4xl lg:text-5xl font-bold leading-tight">
              <span ref="heroLine1" class="block">D'une longue vidéo à</span>
              <span ref="heroLine2" class="block">plusieurs clips viraux</span>
              <span ref="heroLine3" class="block text-[#7f13ec]"> en quelques clics.</span>
              <!-- <span ref="heroLine4" class="block text-[#7f13ec]">clics.</span> -->
            </h1>

            <p ref="heroSubtitle" class="text-gray-300 max-w-md">
              Découpage automatique, sous-titres traduits dans la langue de votre choix, prêt pour  Reels et Shorts.
            </p>

             <NuxtLink  to="/login"  ref="heroCta" class="flex gap-4" >
              <button class="bg-[#7f13ec] hover:bg-[#a855f7] text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-[0_0_28px_rgba(127,19,236,0.55)]">
                Commencer gratuitement
              </button>
            </NuxtLink>
          </div>

          <!-- RIGHT : Grille d'images -->
          <div class="hidden lg:grid grid-cols-3 grid-rows-2 gap-4 h-155">
            <div ref="heroImg1" class="col-span-2 row-span-2 bg-[#191022] rounded-2xl overflow-hidden border border-[#7f13ec]/20">
              <img src="/images/heroection.webp" alt="Montage vidéo" class="w-full h-full object-cover" />
            </div>
            <div ref="heroImg2" class="bg-[#191022] rounded-2xl overflow-hidden border border-[#7f13ec]/20">
              <img src="/images/hommecontent.webp" alt="Créateur" class="w-full h-full object-cover" />
            </div>
            <div ref="heroImg3" class="bg-[#191022] rounded-2xl overflow-hidden border border-[#7f13ec]/20">
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" alt="Créatrice" class="w-full h-full object-cover" />
            </div>
          </div>

        </div>
      </section>

      <!-- ═══════════════════════════════════════
           FEATURES
      ═══════════════════════════════════════ -->
      <section id="features" class="py-20 px-6 bg-[#191022]/50">
        <div class="container mx-auto">
          <h2 ref="featuresTitle" class="text-4xl font-bold text-center mb-16">Gagnez du temps, publiez plus</h2>
          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

            <div ref="feature1" class="feature-card bg-[#191022] p-8 rounded-2xl border border-[#7f13ec]/20 hover:border-[#7f13ec] transition">
              <Icon name="lucide:scissors" class="text-5xl mb-4 text-[#7f13ec]" />
              <h3 class="text-xl font-semibold mb-3">Découpage automatique</h3>
              <p class="text-gray-400 text-sm">Importez votre vidéo, saisissez la durée des clips, et recevez plusieurs courts prêts à l'emploi.</p>
            </div>

            <!-- <div ref="feature2" class="feature-card bg-[#191022] p-8 rounded-2xl border border-[#7f13ec]/20 hover:border-[#7f13ec] transition">
              <Icon name="lucide:refresh-cw" class="text-5xl mb-4 text-[#7f13ec]" />
              <h3 class="text-xl font-semibold mb-3">Conversion du format</h3>
              <p class="text-gray-400 text-sm">Passez automatiquement du 16:9 (YouTube) au 9:16 (TikTok/Reels) sans perte de qualité.</p>
            </div> -->

            <div ref="feature3" class="feature-card bg-[#191022] p-8 rounded-2xl border border-[#7f13ec]/20 hover:border-[#7f13ec] transition">
              <Icon name="lucide:file-text" class="text-5xl mb-4 text-[#7f13ec]" />
              <h3 class="text-xl font-semibold mb-3">Sous-titres automatiques</h3>
              <p class="text-gray-400 text-sm">L'audio est transcrit et les sous-titres sont directement incrustés  essentiel pour vos vidéos.</p>
            </div>

            <!-- NOUVELLE FEATURE : Traduction des sous-titres -->
            <div ref="feature4" class="feature-card bg-[#191022] p-8 rounded-2xl border border-[#7f13ec]/20 hover:border-[#7f13ec] transition">
              <Icon name="lucide:languages" class="text-5xl mb-4 text-[#7f13ec]" />
              <h3 class="text-xl font-semibold mb-3">Sous-titres traduits</h3>
              <p class="text-gray-400 text-sm">Vidéo en anglais ? Affichez les sous-titres en français, espagnol ou arabe. Touchez un public mondial.</p>
            </div>

          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════
           TRANSLATION SHOWCASE
      ═══════════════════════════════════════ -->
      <section class="py-24 px-6">
        <div class="container mx-auto max-w-5xl">
          <div class="grid lg:grid-cols-2 gap-12 items-center">

            <!-- Texte -->
            <div ref="translateText" class="space-y-6">
              <!-- <span class="bg-[#7f13ec]/20 text-[#7f13ec] px-4 py-1 rounded-full text-sm inline-block font-medium">
                Nouvelle fonctionnalité
              </span> -->
              <h2 class="text-3xl lg:text-4xl font-bold leading-tight">
                Vos vidéos parlent <span class="text-[#7f13ec]">toutes les langues</span>
              </h2>
              <p class="text-gray-400 leading-relaxed">
                Uploadez une vidéo dans n'importe quelle langue. TimeCut détecte automatiquement la langue parlée et vous laisse choisir la langue d'affichage des sous-titres.
              </p>
              <ul class="space-y-3">
                <li class="flex items-center gap-3 text-gray-300">
                  <span class="w-5 h-5 rounded-full bg-[#7f13ec]/20 text-[#7f13ec] flex items-center justify-center text-xs shrink-0">✓</span>
                  Vidéo en anglais → sous-titres en français
                </li>
                <li class="flex items-center gap-3 text-gray-300">
                  <span class="w-5 h-5 rounded-full bg-[#7f13ec]/20 text-[#7f13ec] flex items-center justify-center text-xs shrink-0">✓</span>
                  Vidéo en français → sous-titres en espagnol
                </li>
                <li class="flex items-center gap-3 text-gray-300">
                  <span class="w-5 h-5 rounded-full bg-[#7f13ec]/20 text-[#7f13ec] flex items-center justify-center text-xs shrink-0">✓</span>
                  Détection automatique de la langue source
                </li>
                <!-- <li class="flex items-center gap-3 text-gray-300">
                  <span class="w-5 h-5 rounded-full bg-[#7f13ec]/20 text-[#7f13ec] flex items-center justify-center text-xs shrink-0">✓</span>
                  Plus de 50 langues supportées
                </li> -->
              </ul>
            </div>

            <!-- Illustration -->
            <div ref="translateCard" class="bg-[#1e1333] border border-[#7f13ec]/20 rounded-2xl p-6 space-y-4">
              <div class="flex items-center gap-3 mb-6">
                <div class="w-8 h-8 rounded-lg bg-[#7f13ec]/20 flex items-center justify-center">
                  <Icon name="lucide:languages" class="w-4 h-4 text-[#7f13ec]" />
                </div>
                <p class="text-white font-semibold">Traduction des sous-titres</p>
              </div>

              <!-- Langue source -->
              <div class="bg-[#2a1a44] rounded-xl p-4">
                <p class="text-gray-400 text-xs mb-2 uppercase tracking-widest">Langue de la vidéo</p>
                <div class="flex items-center gap-3">
                  <span class="text-2xl">🇬🇧</span>
                  <div>
                    <p class="text-white font-medium text-sm">English</p>
                    <p class="text-gray-500 text-xs italic">"This is how you grow your audience..."</p>
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-center">
                <Icon name="lucide:arrow-down" class="w-5 h-5 text-[#7f13ec]" />
              </div>

              <!-- Langue de sortie -->
              <div class="bg-[#7f13ec]/10 border border-[#7f13ec]/30 rounded-xl p-4">
                <p class="text-[#7f13ec] text-xs mb-2 uppercase tracking-widest">Sous-titres affichés en</p>
                <div class="flex items-center gap-3">
                  <span class="text-2xl">🇫🇷</span>
                  <div>
                    <p class="text-white font-medium text-sm">Français</p>
                    <p class="text-gray-300 text-xs italic">"Voici comment développer votre audience..."</p>
                  </div>
                </div>
              </div>

              <!-- <p class="text-gray-600 text-xs text-center pt-2">Propulsé par Whisper IA · Précision 95%+</p> -->
            </div>

          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════
           HOW IT WORKS
      ═══════════════════════════════════════ -->
      <section id="how-it-works" class="py-10 px-6 bg-[#191022]/50">
        <div class="container mx-auto max-w-4xl">
          <h2 ref="howTitle" class="text-4xl font-bold text-center mb-16">Comment ça marche ?</h2>
          <div class="space-y-12">

            <div ref="step1" class="flex items-start gap-6">
              <div class="bg-[#7f13ec] text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold shrink-0 shadow-[0_0_20px_rgba(127,19,236,0.4)]">1</div>
              <div>
                <h3 class="text-2xl font-semibold mb-2">Uploader votre vidéo</h3>
                <p class="text-gray-400">Déposez votre fichier (MP4, MOV, etc.) dans n'importe quelle langue.</p>
              </div>
            </div>

            <div ref="step2" class="flex items-start gap-6">
              <div class="bg-[#7f13ec] text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold shrink-0 shadow-[0_0_20px_rgba(127,19,236,0.4)]">2</div>
              <div>
                <h3 class="text-2xl font-semibold mb-2">Paramétrer le découpage</h3>
                <p class="text-gray-400">Saisissez la durée des clips et choisissez la langue des sous-titres</p>
              </div>
            </div>

            <div ref="step3" class="flex items-start gap-6">
              <div class="bg-[#7f13ec] text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold shrink-0 shadow-[0_0_20px_rgba(127,19,236,0.4)]">3</div>
              <div>
                <h3 class="text-2xl font-semibold mb-2">Récupérer vos clips</h3>
                <p class="text-gray-400">Téléchargez vos clips avec sous-titres traduits, prêts à être publiés.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════
           PRICING
      ═══════════════════════════════════════ -->
      <section id="pricing" class="py-24 px-6 bg-[#191022]/50">
        <div class="container mx-auto max-w-5xl">
          <h2 ref="pricingTitle" class="text-4xl font-bold text-center mb-4">Tarifs simples et transparents</h2>
          <p class="text-center text-gray-400 mb-16">Commencez gratuitement, évoluez selon vos besoins.</p>

          <div class="grid md:grid-cols-3 gap-6">

            <!-- Plan Gratuit -->
            <div ref="planFree" class="bg-[#191022] p-8 rounded-2xl border border-[#7f13ec]/20 flex flex-col">
              <div class="flex-1">
                <h3 class="text-xl font-semibold mb-1">Gratuit</h3>
                <p class="text-gray-500 text-sm mb-5">Pour découvrir TimeCut</p>
                <p class="text-4xl font-bold mb-1">0€<span class="text-lg font-normal text-gray-400"> / mois</span></p>
                <!-- <p class="text-gray-600 text-xs mb-6">Sans carte bancaire</p> -->
                <ul class="space-y-3 text-sm mb-8">
                  <li class="flex items-center gap-2 text-gray-300">
                    <span class="w-4 h-4 rounded-full bg-[#7f13ec]/20 text-[#7f13ec] flex items-center justify-center text-[10px] shrink-0">✓</span>
                    10 min / mois
                  </li>
                  <li class="flex items-center gap-2 text-gray-300">
                    <span class="w-4 h-4 rounded-full bg-[#7f13ec]/20 text-[#7f13ec] flex items-center justify-center text-[10px] shrink-0">✓</span>
                    Export dans la qualité d'origine
                  </li>
                  <!-- <li class="flex items-center gap-2 text-gray-400 opacity-40">
                    <span class="w-4 h-4 rounded-full bg-gray-700 flex items-center justify-center text-[10px] shrink-0">✗</span>
                    Sous-titres IA
                  </li> -->
                  <!-- <li class="flex items-center gap-2 text-gray-400 opacity-40">
                    <span class="w-4 h-4 rounded-full bg-gray-700 flex items-center justify-center text-[10px] shrink-0">✗</span>
                    Traduction des sous-titres
                  </li> -->
                  <!-- <li class="flex items-center gap-2 text-gray-400 opacity-40">
                    <span class="w-4 h-4 rounded-full bg-gray-700 flex items-center justify-center text-[10px] shrink-0">✗</span>
                    Traitement prioritaire
                  </li> -->
                </ul>
              </div>
              <button class="w-full bg-transparent border border-[#7f13ec]/30 hover:border-[#7f13ec] text-white py-3 rounded-full font-semibold transition-all duration-300 hover:bg-[#7f13ec]/10">
                Commencer gratuitement
              </button>
            </div>

            <!-- Plan Starter -->
            <div ref="planStarter" class="bg-[#191022] p-8 rounded-2xl border border-[#7f13ec]/40 flex flex-col">
              <div class="flex-1">
                <h3 class="text-xl font-semibold mb-1">Starter</h3>
                <p class="text-gray-500 text-sm mb-5">Pour les créateurs réguliers</p>
                <p class="text-4xl font-bold mb-1">3,99€<span class="text-lg font-normal text-gray-400"> / mois</span></p>
                <p class="text-gray-600 text-xs mb-6">Résiliable à tout moment</p>
                <ul class="space-y-3 text-sm mb-8">
                  <li class="flex items-center gap-2 text-gray-300">
                    <span class="w-4 h-4 rounded-full bg-[#7f13ec]/20 text-[#7f13ec] flex items-center justify-center text-[10px] shrink-0">✓</span>
                    60 min / mois
                  </li>
                  <li class="flex items-center gap-2 text-gray-300">
                    <span class="w-4 h-4 rounded-full bg-[#7f13ec]/20 text-[#7f13ec] flex items-center justify-center text-[10px] shrink-0">✓</span>
                    Sous-titres IA inclus
                  </li>
                  <li class="flex items-center gap-2 text-gray-300">
                    <span class="w-4 h-4 rounded-full bg-[#7f13ec]/20 text-[#7f13ec] flex items-center justify-center text-[10px] shrink-0">✓</span>
                    Traduction des sous-titres
                  </li>
                  <li class="flex items-center gap-2 text-gray-300">
                    <span class="w-4 h-4 rounded-full bg-[#7f13ec]/20 text-[#7f13ec] flex items-center justify-center text-[10px] shrink-0">✓</span>
                    Export dans la qualité d'origine
                  </li>
                  <li class="flex items-center gap-2 text-gray-300">
                    <span class="w-4 h-4 rounded-full bg-[#7f13ec]/20 text-[#7f13ec] flex items-center justify-center text-[10px] shrink-0">✓</span>
                    Recharge possible si quota épuisé
                  </li>
                  <!-- <li class="flex items-center gap-2 text-gray-400 opacity-40">
                    <span class="w-4 h-4 rounded-full bg-gray-700 flex items-center justify-center text-[10px] shrink-0">✗</span>
                    Traitement prioritaire
                  </li> -->
                </ul>
              </div>


              <NuxtLink to="/billing" class="w-full  flex justify-center  bg-[#7f13ec]/80 hover:bg-[#7f13ec] text-white py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(127,19,236,0.4)]">
             <span class="mx-auto">   Choisir Starter </span>
              </NuxtLink>

            </div>

            <!-- Plan Pro -->
            <div ref="planPro" class="bg-[#191022] p-8 rounded-2xl border-2 border-[#7f13ec] flex flex-col relative">
              <div class="absolute top-0 right-8 bg-[#7f13ec] text-white px-4 py-1 rounded-b-xl text-xs font-semibold tracking-wide">
                Populaire
              </div>
              <div class="flex-1">
                <h3 class="text-xl font-semibold mb-1">Pro</h3>
                <p class="text-gray-500 text-sm mb-5">Pour les pros du contenu</p>
                <p class="text-4xl font-bold mb-1">11,99€<span class="text-lg font-normal text-gray-400"> / mois</span></p>
                <p class="text-gray-600 text-xs mb-6">Résiliable à tout moment</p>
                <ul class="space-y-3 text-sm mb-8">
                  <li class="flex items-center gap-2 text-gray-300">
                    <span class="w-4 h-4 rounded-full bg-[#7f13ec]/20 text-[#7f13ec] flex items-center justify-center text-[10px] shrink-0">✓</span>
                    200 min / mois
                  </li>
                  <li class="flex items-center gap-2 text-gray-300">
                    <span class="w-4 h-4 rounded-full bg-[#7f13ec]/20 text-[#7f13ec] flex items-center justify-center text-[10px] shrink-0">✓</span>
                    Sous-titres IA inclus
                  </li>
                  <li class="flex items-center gap-2 text-gray-300">
                    <span class="w-4 h-4 rounded-full bg-[#7f13ec]/20 text-[#7f13ec] flex items-center justify-center text-[10px] shrink-0">✓</span>
                    Traduction des sous-titres
                  </li>
                  <li class="flex items-center gap-2 text-gray-300">
                    <span class="w-4 h-4 rounded-full bg-[#7f13ec]/20 text-[#7f13ec] flex items-center justify-center text-[10px] shrink-0">✓</span>
                    Export dans la qualité d'origine
                  </li>
                  <!-- <li class="flex items-center gap-2 text-gray-300">
                    <span class="w-4 h-4 rounded-full bg-[#7f13ec]/20 text-[#7f13ec] flex items-center justify-center text-[10px] shrink-0">✓</span>
                    Traitement prioritaire 🚀
                  </li> -->
                  <li class="flex items-center gap-2 text-gray-300">
                    <span class="w-4 h-4 rounded-full bg-[#7f13ec]/20 text-[#7f13ec] flex items-center justify-center text-[10px] shrink-0">✓</span>
                    Recharge possible si quota épuisé
                  </li>
                  <!-- <li class="flex items-center gap-2 text-gray-300">
                    <span class="w-4 h-4 rounded-full bg-[#7f13ec]/20 text-[#7f13ec] flex items-center justify-center text-[10px] shrink-0">✓</span>
                    Support prioritaire
                  </li> -->
                </ul>
              </div>
              <NuxtLink to="/billing" class="w-full  flex justify-center  bg-[#7f13ec]/80 hover:bg-[#7f13ec] text-white py-3 rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(127,19,236,0.4)]">
             <span class="mx-auto"> Choisir Pro </span>
              </NuxtLink>
            </div>

          </div>

          <!-- <p class="text-center text-gray-600 text-xs mt-10">
            Les minutes sont comptées sur la durée de la vidéo uploadée. La qualité d'export est identique à celle de la vidéo d'origine. Sans engagement, résiliable à tout moment.
          </p> -->
        </div>
      </section>

      <!-- ═══════════════════════════════════════
           FINAL CTA
      ═══════════════════════════════════════ -->
      <section class="py-16 px-6 text-center">
        <div ref="cta" class="max-w-2xl mx-auto">
          <h2 class="text-4xl font-bold mb-6">Prêt à booster votre présence sur les réseaux ?</h2>
          <p class="text-xl text-gray-300 mb-8">Rejoignez des milliers de créateurs qui gagnent du temps avec TimeCut.</p>
          <NuxtLink to="/login" class="inline-flex"> 
          <button class="bg-[#7f13ec] hover:bg-[#a855f7] text-white text-lg px-12 py-4 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-[0_0_32px_rgba(127,19,236,0.6)]">
            Commencer maintenant
          </button>
          </NuxtLink>

        </div>
      </section>

    </main>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'landingpage' })

import { ref, onMounted } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// ── Hero refs ───────────────────────────────────────
const heroLine1    = ref(null)
const heroLine2    = ref(null)
const heroLine3    = ref(null)
const heroLine4    = ref(null)
const heroSubtitle = ref(null)
const heroCta      = ref(null)
const heroImg1     = ref(null)
const heroImg2     = ref(null)
const heroImg3     = ref(null)

// ── Section refs ────────────────────────────────────
const featuresTitle  = ref(null)
const feature1       = ref(null)
const feature2       = ref(null)
const feature3       = ref(null)
const feature4       = ref(null)
const translateText  = ref(null)
const translateCard  = ref(null)
const howTitle       = ref(null)
const step1          = ref(null)
const step2          = ref(null)
const step3          = ref(null)
const pricingTitle   = ref(null)
const planFree       = ref(null)
const planStarter    = ref(null)
const planPro        = ref(null)
const cta            = ref(null)

onMounted(() => {
  gsap.registerPlugin(ScrollTrigger)

  // ── Hero ──────────────────────────────────────────
  gsap.set([heroLine1.value, heroLine2.value, heroLine3.value, heroLine4.value], { opacity: 0, y: 70 })
  gsap.set(heroSubtitle.value, { opacity: 0, y: 30 })
  gsap.set(heroCta.value,      { opacity: 0, y: 30 })
  gsap.set(heroImg1.value,     { opacity: 0, scale: 0.9, x: 50 })
  gsap.set(heroImg2.value,     { opacity: 0, x: 60, y: -30 })
  gsap.set(heroImg3.value,     { opacity: 0, x: 60, y: 30 })

  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } })
  heroTl.to([heroLine1.value, heroLine2.value, heroLine3.value, heroLine4.value],
    { opacity: 1, y: 0, duration: 0.72, stagger: 0.13, delay: 0.2 })
  heroTl.to(heroSubtitle.value, { opacity: 1, y: 0, duration: 0.6 }, '-=0.3')
  heroTl.to(heroCta.value,      { opacity: 1, y: 0, duration: 0.5 }, '-=0.35')
  heroTl.to(heroImg1.value,     { opacity: 1, scale: 1, x: 0, duration: 1, ease: 'power2.out' }, '-=0.75')
  heroTl.to([heroImg2.value, heroImg3.value],
    { opacity: 1, x: 0, y: 0, duration: 0.6, stagger: 0.15, ease: 'power2.out' }, '-=0.55')

  // ── Features ──────────────────────────────────────
  gsap.fromTo(featuresTitle.value, { opacity: 0, y: 40 },
    { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger: featuresTitle.value, start: 'top 85%' } })

  gsap.fromTo([feature1.value, feature2.value, feature3.value, feature4.value],
    { opacity: 0, y: 60 },
    { opacity: 1, y: 0, duration: 0.7, stagger: 0.18, ease: 'power3.out',
      scrollTrigger: { trigger: feature1.value, start: 'top 85%' } })

  // ── Translation showcase ───────────────────────────
  gsap.fromTo(translateText.value, { opacity: 0, x: -60 },
    { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: translateText.value, start: 'top 85%' } })

  gsap.fromTo(translateCard.value, { opacity: 0, x: 60 },
    { opacity: 1, x: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: translateCard.value, start: 'top 85%' } })

  // ── How it works ──────────────────────────────────
  gsap.fromTo(howTitle.value, { opacity: 0, y: 40 },
    { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger: howTitle.value, start: 'top 85%' } })

  gsap.fromTo([step1.value, step2.value, step3.value],
    { opacity: 0, x: -70 },
    { opacity: 1, x: 0, duration: 0.7, stagger: 0.22, ease: 'power3.out',
      scrollTrigger: { trigger: step1.value, start: 'top 85%' } })

  // ── Pricing ───────────────────────────────────────
  gsap.fromTo(pricingTitle.value, { opacity: 0, y: 40 },
    { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger: pricingTitle.value, start: 'top 85%' } })

  gsap.fromTo([planFree.value, planStarter.value, planPro.value],
    { opacity: 0, y: 60 },
    { opacity: 1, y: 0, duration: 0.7, stagger: 0.15, ease: 'power3.out',
      scrollTrigger: { trigger: planFree.value, start: 'top 85%' } })

  // ── CTA final ─────────────────────────────────────
  gsap.fromTo(cta.value, { opacity: 0, y: 50, scale: 0.94 },
    { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: cta.value, start: 'top 90%' } })
})
</script>

<style scoped>
.feature-card {
  transition: all 0.3s ease;
}
</style>
