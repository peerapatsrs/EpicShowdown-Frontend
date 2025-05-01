<script lang="ts">
  export let show = false;
  export let imageUrl = '';
  export let imageAlt = '';
  export let onClose: () => void;
</script>

{#if show}
  <div 
    class="fixed inset-0 bg-black/80 flex items-center justify-center z-50" 
    on:click={onClose} 
    on:keydown={(e) => e.key === 'Escape' && onClose()}
    role="dialog" 
    aria-modal="true"
    tabindex="0"
  >
    <div class="relative max-w-4xl max-h-[90vh] mx-4" on:click|stopPropagation={() => {}} role="presentation">
      <button 
        class="absolute -top-10 right-0 text-white hover:text-[#ff6b2b] transition-colors"
        on:click={onClose}
        aria-label="ปิดรูปภาพ"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <img 
        src={imageUrl} 
        alt={imageAlt}
        class="max-w-full max-h-[80vh] object-contain rounded-lg"
      />
    </div>
  </div>
{/if} 