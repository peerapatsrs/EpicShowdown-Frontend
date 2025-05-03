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
    <div class="bg-[#2a2440] rounded-xl p-6 w-full max-w-md" transition:scale={{ duration: 200 }}>
      <h3 class="text-xl font-bold text-white mb-4">{title}</h3>
      <p class="text-gray-400 mb-4">{message}</p>
      <div class="flex justify-end gap-4">
        <button
          type="button"
          class="px-4 py-2 rounded-xl border-2 border-gray-500 text-gray-300 hover:bg-[#1a1625] cursor-pointer transition-colors"
          on:click={handleClose}
          disabled={loading}
        >
          ยกเลิก
        </button>
        <button
          class="px-4 py-2 rounded-xl text-white font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all {confirmButtonClass}"
          on:click={handleConfirm}
          disabled={loading}
        >
          {loading ? 'กำลัง' + confirmText + '...' : confirmText}
        </button>
      </div>
    </div>
  </div>
{/if} 