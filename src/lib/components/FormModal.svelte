<script lang="ts">
  export let show = false;
  export let title: string;
  export let loading = false;
  export let fields: {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'url' | 'boolean' | 'image';
    required?: boolean;
    booleanLabels?: {
      true: string;
      false: string;
    };
  }[] = [];
  export let formData: { [key: string]: string | boolean } = {};

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  function handleSubmit() {
    dispatch('submit');
  }

  function handleClose() {
    dispatch('close');
  }
</script>

{#if show}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-[#2a2440] rounded-xl p-6 w-full max-w-md">
      <h3 class="text-xl font-bold text-white mb-4">{title}</h3>
      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        {#each fields as field}
          <div>
            <label for={field.key} class="block text-gray-400 mb-2">{field.label}</label>
            {#if field.type === 'textarea'}
              <textarea
                id={field.key}
                bind:value={formData[field.key]}
                class="w-full bg-[#1a1625] rounded-xl px-4 py-3 text-white border border-gray-700 focus:border-[#ff6b2b] focus:ring-1 focus:ring-[#ff6b2b]"
                rows="3"
                required={field.required}
              ></textarea>
            {:else if field.type === 'boolean'}
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={field.key}
                  bind:checked={formData[field.key] as boolean}
                  class="rounded border-gray-700 text-[#ff6b2b] focus:ring-[#ff6b2b]"
                />
                <label for={field.key} class="text-gray-400">{field.label}</label>
              </div>
            {:else}
              <input
                type={field.type === 'image' ? 'url' : field.type}
                id={field.key}
                bind:value={formData[field.key]}
                class="w-full bg-[#1a1625] rounded-xl px-4 py-3 text-white border border-gray-700 focus:border-[#ff6b2b] focus:ring-1 focus:ring-[#ff6b2b]"
                required={field.required}
              />
            {/if}
          </div>
        {/each}
        <div class="flex justify-end gap-4 pt-4">
          <button
            type="button"
            class="px-6 py-3 rounded-xl border-2 border-gray-500 text-gray-300 hover:bg-[#1a1625]"
            on:click={handleClose}
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            class="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] text-white font-medium"
            disabled={loading}
          >
            {loading ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if} 