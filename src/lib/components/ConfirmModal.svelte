<script lang="ts">
  export let show = false;
  export let title = 'ยืนยันการลบ';
  export let message: string;
  export let loading = false;
  export let confirmText = 'ลบ';
  export let confirmButtonClass = 'bg-red-500 hover:bg-red-600';

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  import { fade, scale } from 'svelte/transition';

  function handleConfirm() {
    dispatch('confirm');
  }

  function handleClose() {
    dispatch('close');
  }
</script>

{#if show}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" transition:fade={{ duration: 200 }}>
    <div class="bg-[#2a2440] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col p-0 shadow-2xl" transition:scale={{ duration: 200 }}>
      <h3 class="text-2xl font-bold text-white px-8 pt-8 pb-2">{title}</h3>
      <div class="flex-1 px-8 pb-2">
        <p class="text-gray-400 mb-4">{message}</p>
      </div>
      <div class="flex justify-end gap-4 pt-4 bg-[#2a2440] sticky bottom-0 left-0 right-0 z-10 px-8 pb-6 border-t border-[#332d4d] rounded-b-2xl">
        <button
          type="button"
          class="px-6 py-3 rounded-xl border-2 border-gray-500 text-gray-300 hover:bg-[#1a1625] cursor-pointer transition-colors text-lg"
          on:click={handleClose}
          disabled={loading}
        >
          ยกเลิก
        </button>
        <button
          class="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold cursor-pointer transition-all hover:from-red-400 hover:to-red-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 text-lg"
          on:click={handleConfirm}
          disabled={loading}
        >
          {loading ? 'กำลัง' + confirmText + '...' : confirmText}
        </button>
      </div>
    </div>
  </div>
{/if} 