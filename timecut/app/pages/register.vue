<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4 md:p-8">
    <div class="bg-white w-full max-w-6xl min-h-175 rounded-[2.5rem] shadow-2xl flex overflow-hidden">
      
      <div class="hidden lg:flex w-1/2 relative p-10 flex-col justify-between overflow-hidden group">
        <img 
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop" 
          class="absolute inset-0 w-full h-full object-cover rounded-4xl m-4  "
          style="width: calc(100% - 2rem); height: calc(100% - 2rem);"
        />
        <div class="absolute inset-0 bg-black/20 rounded-4xl m-4" style="width: calc(100% - 2rem); height: calc(100% - 2rem);"></div>

        <div class="relative z-10 flex justify-between items-center text-white">
        
          <div class="space-x-6 text-sm">
            <button class="hover:underline">Sign Up</button>
            <button class="bg-white/10 backdrop-blur-md border border-white/30 px-6 py-2 rounded-full hover:bg-white/20 transition">Join Us</button>
          </div>
        </div>

     
      </div>

      <div class="w-full lg:w-1/2 p-8 md:p-16 flex flex-col justify-between">
        <div class="flex justify-between items-center mb-12">
          <span class="text-2xl font-black tracking-tighter text-gray-800 uppercase">UISOCIAL</span>
          <button class="flex items-center gap-2 border border-gray-200 px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-50">
            🇺🇸 EN <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>

        <div class="max-w-md mx-auto w-full">
          <h1 class="text-5xl font-black text-gray-900 mb-2">Hi Designer</h1>
          <p class="text-gray-400 mb-10 font-medium">Welcome to UISOCIAL</p>

          <form @submit.prevent class="space-y-4">
            <div>
              <input 
                type="email" 
                placeholder="Email" 
                class="w-full px-6 py-4 rounded-xl bg-gray-50 border border-gray-100 focus:border-red-400 focus:ring-0 outline-none transition"
              />
            </div>
            <div>
              <input 
                type="password" 
                placeholder="Password" 
                class="w-full px-6 py-4 rounded-xl bg-gray-50 border border-gray-100 focus:border-red-400 focus:ring-0 outline-none transition"
              />
            </div>
            <div class="text-right px-1">
              <a href="#" class="text-red-400 text-xs font-semibold hover:underline italic">Forgot password?</a>
            </div>

            <div class="py-4 flex items-center gap-4 text-gray-300">
              <div class="h-px bg-gray-200 flex-1"></div>
              <span class="text-xs font-bold uppercase tracking-widest">or</span>
              <div class="h-px bg-gray-200 flex-1"></div>
            </div>

            <button class="w-full flex items-center justify-center gap-3 py-4 border border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-5 h-5" />
              Login with Google
            </button>

            <button class="w-full py-4 bg-[#f14336] text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-600 transition-all transform active:scale-95">
              Login
            </button>
          </form>

          <p class="text-center mt-8 text-sm font-medium text-gray-500">
            Don't have an account? <a href="#" class="text-red-400 font-bold hover:underline">Sign up</a>
          </p>
        </div>

        <div class="flex justify-center gap-6 text-gray-400 mt-12">
          <a href="#" class="hover:text-gray-900 transition"><i class="fab fa-facebook-f text-lg"></i></a>
          <a href="#" class="hover:text-gray-900 transition"><i class="fab fa-twitter text-lg"></i></a>
          <a href="#" class="hover:text-gray-900 transition"><i class="fab fa-linkedin-in text-lg"></i></a>
          <a href="#" class="hover:text-gray-900 transition"><i class="fab fa-instagram text-lg"></i></a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Optionnel : Import de FontAwesome pour les icones du bas si tu ne les as pas */
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');

input::placeholder {
  font-weight: 500;
  color: #9ca3af;
}
</style>