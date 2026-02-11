export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  ssr: true,

  modules: ["@nuxtjs/tailwindcss"],

  runtimeConfig: {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    resendApiKey: process.env.RESEND_API_KEY,
    wooWebhookSecret: process.env.WOO_WEBHOOK_SECRET,
  },

  app: {
    head: {
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
          media: "print",
          onload: "this.media='all'",
        },
      ],
      script: [
        {
          innerHTML: `(function(){try{var t=document.cookie.match(/theme=([^;]+)/);var s=t?t[1]:localStorage.getItem('theme');if(s!=='light'){document.documentElement.classList.add('dark')}}catch(e){}})();`,
          tagPosition: "head",
        },
      ],
    },
  },

  routeRules: {
    "/": { prerender: true },
  },

  nitro: {
    compressPublicAssets: true,
    minify: true,
  },

  css: ["~/assets/css/main.css"],
});
