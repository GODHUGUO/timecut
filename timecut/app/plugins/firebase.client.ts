import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { isSupported, getAnalytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyCsM_r0geZmV32BKCyhoG_Ytzbj0PmFbFA",
  authDomain: "timecut-627db.firebaseapp.com",
  projectId: "timecut-627db",
  storageBucket: "timecut-627db.firebasestorage.app",
  messagingSenderId: "700478845504",
  appId: "1:700478845504:web:d489489f156fccf692a5a5",
  measurementId: "G-WNCBS15P07"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)

// ✅ Analytics uniquement si le navigateur le supporte
isSupported().then(supported => {
  if (supported) getAnalytics(app)
})

export default defineNuxtPlugin(() => {
  return {
    provide: { auth }
  }
})