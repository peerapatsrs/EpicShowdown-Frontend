<script lang="ts">
  export let value: any;
  export let options: { value: any; label: string }[] = [];
  export let placeholder = '';
  export let className = '';
  export let id: string | undefined;
</script>

<div class="relative flex-1 md:flex-none">
  <select
    id={id}
    bind:value
    class="appearance-none w-full bg-[#1a1625] text-white rounded-xl pl-4 pr-10 py-3 border border-gray-700 focus:border-[#ff6b2b] focus:ring-1 focus:ring-[#ff6b2b] cursor-pointer select-none {className}"
    style="-webkit-appearance: none !important; -moz-appearance: none !important; appearance: none !important; background-image: none !important;"
  >
    {#if placeholder}
      <option value={undefined}>{placeholder}</option>
    {/if}
    {#each options as option}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
  <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#ff6b2b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </div>
</div> 