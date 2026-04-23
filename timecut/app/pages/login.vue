<template>
  <div class="min-h-screen bg-[#191022] flex items-center justify-center p-3 sm:p-4">
    <div class="bg-[#191022] w-full max-w-6xl rounded-3xl sm:rounded-[2.5rem] shadow-2xl flex overflow-hidden border border-[#7f13ec]/20 sm:min-h-0">

      <!-- Partie gauche (desktop) -->
      <div class="hidden lg:flex w-1/2 relative p-4 flex-col justify-between overflow-hidden">
        <img
          src="/images/Capture.JPG"
          class="absolute inset-0 w-full h-full object-cover rounded-4xl"
          style="width: calc(100% - 2rem); height: calc(100% - 2rem); margin: 1rem;"
        />
        <div class="absolute inset-0 bg-black/40 rounded-4xl" style="width: calc(100% - 2rem); height: calc(100% - 2rem); margin: 1rem;"></div>

        <div class="relative z-20 flex justify-between items-center text-white p-6">
          <div class="space-x-3 text-sm">
            <button @click="isLogin = true" class="bg-white/10 backdrop-blur-md border px-5 py-2 rounded-full border-white/30 hover:bg-white/20 transition">
              Se connecter
            </button>
            <button @click="isLogin = false" class="bg-white/10 backdrop-blur-md border border-white/30 px-5 py-2 rounded-full hover:bg-white/20 transition">
              S'inscrire
            </button>
          </div>
        </div>

        <div class="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <p class="text-white text-2xl text-center px-6">
            Transformez vos longues vidéos en clips viraux.
          </p>
        </div>
      </div>

      <!-- Partie droite : formulaire -->
      <div class="w-full lg:w-1/2 flex flex-col justify-center py-6 px-4 sm:py-10 sm:px-8">
        <div class="max-w-sm mx-auto w-full">

          <!-- Logo mobile -->
          <div class="lg:hidden text-center mb-4 sm:mb-8">
            <div class="text-2xl sm:text-3xl font-bold">
              <span class="text-white">Time</span><span class="text-[#7f13ec]">Cut</span>
            </div>
            <p class="text-gray-500 text-xs sm:text-sm mt-1">Transformez vos vidéos en clips viraux</p>
          </div>

          <h1 class="text-2xl sm:text-3xl font-bold text-white">
            {{ isLogin ? 'Bon retour !' : 'Créer un compte' }}
          </h1>
          <p class="text-gray-400 text-sm sm:text-base mb-4 sm:mb-7 mt-1">
            {{ isLogin ? 'Connectez-vous pour continuer' : 'Inscrivez-vous gratuitement' }}
          </p>

          <!-- Formulaire principal (login / signup) -->
          <form v-if="!showResetForm" @submit.prevent="handleSubmit" class="space-y-2.5 sm:space-y-4">

            <!-- Prénom + Nom -->
            <div v-if="!isLogin" class="flex gap-2">
              <div class="w-1/2">
                <input
                  v-model="firstName"
                  type="text"
                  placeholder="Prénom"
                  @blur="validateFirstName"
                  class="w-full px-4 py-2.5 sm:px-6 sm:py-4 rounded-xl bg-[#1e1530] border border-[#7f13ec]/20 focus:border-[#7f13ec] outline-none transition text-white placeholder-gray-500 text-sm sm:text-base"
                  :class="{ 'border-red-500': firstNameError }"
                />
                <p v-if="firstNameError" class="text-red-400 text-xs mt-1 px-1">
                  {{ firstNameError }}
                </p>
              </div>
              <div class="w-1/2">
                <input
                  v-model="lastName"
                  type="text"
                  placeholder="Nom"
                  @blur="validateLastName"
                  class="w-full px-4 py-2.5 sm:px-6 sm:py-4 rounded-xl bg-[#1e1530] border border-[#7f13ec]/20 focus:border-[#7f13ec] outline-none transition text-white placeholder-gray-500 text-sm sm:text-base"
                  :class="{ 'border-red-500': lastNameError }"
                />
                <p v-if="lastNameError" class="text-red-400 text-xs mt-1 px-1">
                  {{ lastNameError }}
                </p>
              </div>
            </div>

            <!-- Email -->
            <div>
              <input
                v-model="email"
                type="email"
                placeholder="Email"
                @blur="validateEmail"
                class="w-full px-4 py-2.5 sm:px-6 sm:py-4 rounded-xl bg-[#1e1530] border border-[#7f13ec]/20 focus:border-[#7f13ec] outline-none transition text-white placeholder-gray-500 text-sm sm:text-base"
                :class="{ 'border-red-500': emailError }"
              />
              <p v-if="emailError" class="text-red-400 text-xs mt-1 px-1">
                {{ emailError }}
              </p>
            </div>

            <!-- Mot de passe -->
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Mot de passe"
                @blur="validatePassword"
                class="w-full px-4 py-2.5 sm:px-6 sm:py-4 rounded-xl bg-[#1e1530] border border-[#7f13ec]/20 focus:border-[#7f13ec] outline-none transition text-white placeholder-gray-500 text-sm sm:text-base pr-11"
                :class="{ 'border-red-500': passwordError }"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition"
                @click="showPassword = !showPassword"
              >
                <Icon
                  :name="showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'"
                  class="w-5 h-5"
                />
              </button>
              <p v-if="passwordError" class="text-red-400 text-xs mt-1 px-1">
                {{ passwordError }}
              </p>
            </div>

            <!-- Confirmation mot de passe -->
            <div v-if="!isLogin" class="relative">
              <input
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Confirmer le mot de passe"
                @blur="validateConfirmPassword"
                class="w-full px-4 py-2.5 sm:px-6 sm:py-4 rounded-xl bg-[#1e1530] border border-[#7f13ec]/20 focus:border-[#7f13ec] outline-none transition text-white placeholder-gray-500 text-sm sm:text-base pr-11"
                :class="{ 'border-red-500': confirmError }"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <Icon
                  :name="showConfirmPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'"
                  class="w-5 h-5"
                />
              </button>
              <p v-if="confirmError" class="text-red-400 text-xs mt-1 px-1">
                {{ confirmError }}
              </p>
            </div>

            <div v-if="isLogin" class="text-right px-1">
              <button
                type="button"
                @click="showResetForm = true"
                class="text-[#7f13ec] text-xs font-semibold hover:underline italic"
              >
                Mot de passe oublié ?
              </button>
            </div>

            <!-- Erreur serveur -->
            <p v-if="errorMsg" class="text-red-400 text-sm text-center bg-red-400/10 rounded-lg py-2 px-3">
              {{ errorMsg }}
            </p>

            <div class="flex items-center gap-3 text-gray-400">
              <div class="h-px bg-[#7f13ec]/20 flex-1"></div>
              <span class="text-xs font-bold uppercase tracking-widest">ou</span>
              <div class="h-px bg-[#7f13ec]/20 flex-1"></div>
            </div>

            <!-- Google -->
            <button
              type="button"
              @click="loginWithGoogle"
              :disabled="loading"
              class="w-full flex items-center justify-center gap-2 py-2.5 sm:py-4 border border-[#7f13ec]/20 rounded-xl font-semibold text-white hover:bg-[#7f13ec]/10 transition text-sm sm:text-base disabled:opacity-50"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-4 h-4 sm:w-5 sm:h-5" />
              {{ isLogin ? 'Se connecter avec Google' : "S'inscrire avec Google" }}
            </button>

            <!-- Bouton principal -->
            <button
              type="submit"
              :disabled="loading || !formIsValid"
              class="w-full py-2.5 sm:py-4 bg-[#7f13ec] text-white rounded-xl font-bold text-sm sm:text-base shadow-lg shadow-[#7f13ec]/30 hover:bg-[#a855f7] transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#7f13ec] disabled:active:scale-100"
            >
              <span v-if="loading" class="flex items-center justify-center gap-2">
                <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Chargement...
              </span>
              <span v-else>{{ isLogin ? 'Se connecter' : "S'inscrire" }}</span>
            </button>
          </form>

          <!-- Formulaire "Mot de passe oublié ?" -->
          <div v-else class="space-y-4">
            <h2 class="text-xl font-bold text-white text-center">Réinitialiser le mot de passe</h2>
            <p class="text-gray-400 text-sm text-center">
              Entrez votre email pour recevoir un lien de réinitialisation.
            </p>

            <div>
              <input
                v-model="resetEmail"
                type="email"
                placeholder="Votre email"
                class="w-full px-4 py-2.5 sm:px-6 sm:py-4 rounded-xl bg-[#1e1530] border border-[#7f13ec]/20 focus:border-[#7f13ec] outline-none transition text-white placeholder-gray-500 text-sm sm:text-base"
                :class="{ 'border-red-500': resetEmailError }"
              />
              <p v-if="resetEmailError" class="text-red-400 text-xs mt-1 px-1">
                {{ resetEmailError }}
              </p>
            </div>

            <p v-if="resetSuccess" class="text-green-400 text-sm text-center bg-green-400/10 rounded-lg py-2 px-3">
              {{ resetSuccess }}
            </p>
            <p v-if="resetError" class="text-red-400 text-sm text-center bg-red-400/10 rounded-lg py-2 px-3">
              {{ resetError }}
            </p>

            <button
              @click="sendResetEmail"
              :disabled="resetLoading || !resetEmail.trim()"
              class="w-full py-2.5 sm:py-4 bg-[#7f13ec] text-white rounded-xl font-bold text-sm sm:text-base shadow-lg shadow-[#7f13ec]/30 hover:bg-[#a855f7] transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="resetLoading" class="flex items-center justify-center gap-2">
                <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Envoi en cours...
              </span>
              <span v-else>Envoyer le lien</span>
            </button>

            <button
              @click="showResetForm = false; resetEmail = ''; resetError = ''; resetSuccess = ''"
              class="w-full text-center text-gray-400 hover:text-white text-sm mt-2"
            >
              ← Retour à la connexion
            </button>
          </div>

          <p class="text-center mt-4 sm:mt-8 text-xs sm:text-sm font-medium text-gray-400">
            <span v-if="isLogin && !showResetForm">
              Pas encore de compte ?
              <button @click="isLogin = false" class="text-[#7f13ec] font-bold hover:underline ml-1">S'inscrire</button>
            </span>
            <span v-else-if="!showResetForm">
              Déjà un compte ?
              <button @click="isLogin = true" class="text-[#7f13ec] font-bold hover:underline ml-1">Se connecter</button>
            </span>
          </p>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  sendPasswordResetEmail // ← Ajout important
} from 'firebase/auth'
import { auth } from '../plugins/firebase.client'

const router = useRouter()

const isLogin = ref(true)
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMsg = ref('')

const showPassword = ref(false)
const showConfirmPassword = ref(false)

// ── Reset password ──
const showResetForm = ref(false)
const resetEmail = ref('')
const resetLoading = ref(false)
const resetSuccess = ref('')
const resetError = ref('')
const resetEmailError = ref('')

const validateResetEmail = () => {
  resetEmailError.value = ''
  if (!resetEmail.value.trim()) {
    resetEmailError.value = "L'email est requis"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail.value)) {
    resetEmailError.value = 'Email invalide'
  }
}

const sendResetEmail = async () => {
  validateResetEmail()
  if (resetEmailError.value) return

  resetLoading.value = true
  resetError.value = ''
  resetSuccess.value = ''

  try {
    await sendPasswordResetEmail(auth, resetEmail.value.trim())
    resetSuccess.value = 'Un email de réinitialisation a été envoyé ! Vérifiez votre boîte (et les spams).'
    resetEmail.value = '' // on vide après succès
  } catch (err) {
    resetError.value = getFirebaseError(err.code) || 'Une erreur est survenue. Réessayez.'
  } finally {
    resetLoading.value = false
  }
}

// ── Validations existantes (inchangées) ──
const firstNameError = ref('')
const lastNameError = ref('')
const emailError = ref('')
const passwordError = ref('')
const confirmError = ref('')

const validateFirstName = () => {
  firstNameError.value = !firstName.value.trim() ? 'Le prénom est requis' : ''
}

const validateLastName = () => {
  lastNameError.value = !lastName.value.trim() ? 'Le nom est requis' : ''
}

const validateEmail = () => {
  emailError.value = ''
  if (!email.value.trim()) {
    emailError.value = "L'email est requis"
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    emailError.value = 'Email invalide'
  }
}

const validatePassword = () => {
  passwordError.value = ''
  if (!password.value) {
    passwordError.value = 'Le mot de passe est requis'
  } else if (password.value.length < 8) {
    passwordError.value = 'Minimum 8 caractères'
  }
}

const validateConfirmPassword = () => {
  confirmError.value = ''
  if (!confirmPassword.value) {
    confirmError.value = 'Confirmez votre mot de passe'
  } else if (confirmPassword.value !== password.value) {
    confirmError.value = 'Les mots de passe ne correspondent pas'
  }
}

const formIsValid = computed(() => {
  if (isLogin.value) {
    return email.value.trim() && !emailError.value && password.value && !passwordError.value
  }
  return (
    firstName.value.trim() && !firstNameError.value &&
    lastName.value.trim() && !lastNameError.value &&
    email.value.trim() && !emailError.value &&
    password.value && !passwordError.value &&
    confirmPassword.value && !confirmError.value
  )
})

watch(isLogin, () => {
  firstNameError.value = ''
  lastNameError.value = ''
  emailError.value = ''
  passwordError.value = ''
  confirmError.value = ''
})

// ── Google & Submit ──
const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider()
  try {
    loading.value = true
    errorMsg.value = ''
    await signInWithPopup(auth, provider)
    router.push('/newproject')
  } catch (err) {
    errorMsg.value = getFirebaseError(err.code)
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!isLogin.value) {
    validateFirstName()
    validateLastName()
  }
  validateEmail()
  validatePassword()
  if (!isLogin.value) validateConfirmPassword()

  if (!formIsValid.value) return

  errorMsg.value = ''

  try {
    loading.value = true

    if (isLogin.value) {
      await signInWithEmailAndPassword(auth, email.value, password.value)
    } else {
      const { user } = await createUserWithEmailAndPassword(auth, email.value, password.value)
      await updateProfile(user, {
        displayName: `${firstName.value.trim()} ${lastName.value.trim()}`.trim()
      })
    }

    router.push('/newproject')
  } catch (err) {
    errorMsg.value = getFirebaseError(err.code)
  } finally {
    loading.value = false
  }
}

const getFirebaseError = (code) => {
  const errors = {
    'auth/invalid-email': 'Adresse email invalide.',
    'auth/user-not-found': 'Aucun compte trouvé avec cet email.',
    'auth/wrong-password': 'Mot de passe incorrect.',
    'auth/invalid-credential': 'Email ou mot de passe incorrect.',
    'auth/email-already-in-use': 'Cet email est déjà utilisé.',
    'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
    'auth/too-many-requests': 'Trop de tentatives. Réessaie plus tard.',
    'auth/popup-closed-by-user': 'Connexion Google annulée.',
    'auth/missing-email': 'Veuillez entrer un email.',
    'auth/user-disabled': 'Ce compte a été désactivé.'
  }
  return errors[code] || 'Une erreur est survenue. Réessaie.'
}
</script>