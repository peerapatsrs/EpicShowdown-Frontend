<script lang="ts">
  import type { SortConfig } from '$lib/types/table';
  import { sortItems } from '$lib/utils/sorting';
  import { getImage } from '$lib/utils/image';
  import ImageModal from './ImageModal.svelte';
  
  export let items: any[] = [];
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
  export let loading = false;
  export let showActions = false;
  export let sortConfig: SortConfig = { key: '', direction: null };
  export let onEdit: ((item: any, triggerEl?: HTMLElement) => void) | undefined = undefined;
  export let onDelete: ((item: any, triggerEl?: HTMLElement) => void) | undefined = undefined;

  export let processingRowId: string | null = null;

  let imagePreview: { [key: string]: string } = {};
  let showImageModal = false;
  let selectedImage = '';
  let selectedImageAlt = '';

  // คำนวณข้อมูลที่เรียงลำดับแล้ว
  $: sortedItems = sortConfig.direction ? sortItems(items, sortConfig) : items;

  // ฟังก์ชันจัดการการคลิกที่หัวตาราง
  function handleSort(key: string) {
    if (sortConfig.key === key) {
      sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    } else {
      sortConfig.direction = 'asc';
    }
    sortConfig.key = key;
  }

  // ฟังก์ชันสำหรับสร้าง URL รูปภาพสำรอง
  function getFallbackImageUrl(name: string) {
    const text = encodeURIComponent('No Image');
    return `https://placehold.co/200x200/2a2440/ff6b2b.png?text=${text}`;
  }

  // ฟังก์ชันจัดการเมื่อรูปภาพโหลดไม่สำเร็จ
  function handleImageError(event: Event, name: string) {
    const img = event.target as HTMLImageElement;
    img.src = getFallbackImageUrl(name);
  }

  // เพิ่มฟังก์ชันสำหรับโหลดรูปภาพ
  async function loadImage(fileName: string | undefined | boolean, key: string): Promise<void> {
    if (!fileName || typeof fileName !== 'string') return;
    
    try {
      const imageData = await getImage(fileName);
      if (imageData) {
        imagePreview[key] = imageData;
      } else {
        imagePreview[key] = getFallbackImageUrl(key);
      }
    } catch (error) {
      console.error('Error loading image:', error);
      imagePreview[key] = getFallbackImageUrl(key);
    }
  }

  // โหลดรูปภาพเมื่อ items เปลี่ยน
  $: {
    for (const item of items) {
      for (const field of fields) {
        if (field.type === 'image' && item[field.key]) {
          loadImage(item[field.key], `${item.code}_${field.key}`);
        }
      }
    }
  }

  function openImageModal(imageUrl: string, alt: string) {
    selectedImage = imageUrl;
    selectedImageAlt = alt;
    showImageModal = true;
  }

  function closeImageModal() {
    showImageModal = false;
    selectedImage = '';
    selectedImageAlt = '';
  }
</script>

{#if loading}
  <div class="flex items-center justify-center py-8">
    <div class="animate-spin rounded-full h-12 w-12 border-4 border-[#ff6b2b] border-t-transparent"></div>
  </div>
{:else}
  <div class="overflow-x-auto">
    <table class="w-full">
      <thead>
        <tr class="text-left border-b border-gray-700">
          {#each fields as field}
            <th 
              class="px-6 py-3 text-[#ff6b2b] cursor-pointer hover:bg-[#332d4d] transition-colors group"
              on:click={() => handleSort(field.key)}
            >
              <div class="flex items-center gap-2">
                {field.label}
                <div class="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    class="h-3 w-3 {sortConfig.key === field.key && sortConfig.direction === 'asc' ? 'text-[#ff6b2b]' : 'text-gray-400'}" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
                  </svg>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    class="h-3 w-3 {sortConfig.key === field.key && sortConfig.direction === 'desc' ? 'text-[#ff6b2b]' : 'text-gray-400'}" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
            </th>
          {/each}
          {#if showActions}
            <th class="px-6 py-3 text-[#ff6b2b]">จัดการ</th>
          {/if}
        </tr>
      </thead>
      <tbody>
        {#each sortedItems as item}
          <tr class="border-b border-gray-700/50 hover:bg-[#332d4d]">
            {#if processingRowId === item.code}
              <td colspan={fields.length + (showActions ? 1 : 0)} class="text-center py-4">
                <div class="animate-spin rounded-full h-8 w-8 border-4 border-[#ff6b2b] border-t-transparent mx-auto"></div>
              </td>
            {:else}
              {#each fields as field}
                <td class="px-6 py-4">
                  {#if field.type === 'boolean'}
                    <span class={`px-3 py-1 rounded-full text-sm ${item[field.key] ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {item[field.key] 
                        ? (field.booleanLabels?.true || 'Yes')
                        : (field.booleanLabels?.false || 'No')}
                    </span>
                  {:else if field.type === 'image'}
                    <button
                      class="cursor-pointer hover:opacity-80 transition-opacity"
                      on:click={() => openImageModal(imagePreview[`${item.code}_${field.key}`] || getFallbackImageUrl(item.name), item.name)}
                      aria-label="ดูรูปภาพขนาดใหญ่"
                    >
                      <img 
                        src={imagePreview[`${item.code}_${field.key}`] || getFallbackImageUrl(item.name)} 
                        alt={item.name} 
                        width="48"
                        height="48"
                        class="h-12 w-12 object-cover rounded-lg"
                        on:error={(e) => handleImageError(e, item.name)}
                      />
                    </button>
                  {:else}
                    <span class="text-white">{item[field.key]}</span>
                  {/if}
                </td>
              {/each}
              {#if showActions}
                <td class="px-6 py-4">
                  <div class="flex gap-2">
                    <button
                      class="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg"
                      on:click={(e) => onEdit?.(item, e.currentTarget)}
                      aria-label="แก้ไข"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      class="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                      on:click={(e) => onDelete?.(item, e.currentTarget)}
                      aria-label="ลบ"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </td>
              {/if}
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
    {#if items.length === 0}
      <div class="text-center py-8 text-gray-400">
        <slot name="empty">
          ไม่มีข้อมูล
        </slot>
      </div>
    {/if}
  </div>

  <ImageModal 
    show={showImageModal}
    imageUrl={selectedImage}
    imageAlt={selectedImageAlt}
    onClose={closeImageModal}
  />
{/if} 