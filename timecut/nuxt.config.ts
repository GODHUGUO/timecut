import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ['./app/assets/css/main.css'],
  devServer: {
    port: 3001,
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:3000',
    },
  },
  modules: [
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@vite-pwa/nuxt',
  ],

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

pwa: {
  registerType: 'autoUpdate', // Met à jour le SW automatiquement sans demander l'utilisateur

  manifest: {
    name: 'TimeCut',
    short_name: 'TimeCut',
    description: 'TimeCut - Your Ultimate video cutter',
    theme_color: '#191022',        // Couleur de la barre de statut mobile 
    background_color: '#191022',   // Couleur du splash screen
    display: 'standalone',         // Cache la barre du navigateur → look app native
    orientation: 'portrait',       // Bloque en mode portrait
    scope: '/',
    start_url: '/',                // Page de démarrage quand on ouvre l'app

    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      }
    ]
  },

  workbox: {
    navigateFallback: '/',
    globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'], // Fichiers mis en cache offline
  },

  devOptions: {
    enabled: true,
    type: 'module',
  },
},
 app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/png', href: 'icons/icon-192x192.png' }
      ]
    }
  },
  
});
