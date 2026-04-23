<template>
  <div class="flex flex-col min-h-screen">
   
    <header_site/>
    <slot />  
    <footer_site/>
  </div>
</template>

<script setup>

import header_site from '~/components/header_site.vue'
import footer_site from '~/components/footer_site.vue'



</script>