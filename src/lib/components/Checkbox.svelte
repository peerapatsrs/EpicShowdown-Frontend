<script lang="ts">
  export let onChange: (e: Event) => void = () => {};
  export let label: string = '';
  export let labelB: string = '';
  export let id: string = "status-checkbox";
  export let disabled: boolean = false;
  export let checked: boolean = false;
</script>

<div class="flex items-center">
  {#if label !== ''}
    <span class="text-white/80 mr-2">{label}</span>
  {/if}
  <input
    id={id}
    type="checkbox"
    on:change={onChange}
    bind:checked={checked}
    disabled={disabled}
    class="w-4 h-4 text-[#ff6b2b] bg-[#2a2440] border-[#ff6b2b] rounded-sm focus:ring-2 focus:ring-[#ff6b2b] transition-all"
  />
  {#if labelB !== ''}
    <span class="text-white/80 mr-2">{labelB}</span>
  {/if}
</div> 