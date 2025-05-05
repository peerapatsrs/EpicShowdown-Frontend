  <script lang="ts">
  import { getImage, uploadImage } from '$lib/utils/image';
  import { fade, scale } from 'svelte/transition';
  import DatePicker from './DatePicker.svelte';

  export let show = false;
  export let title: string;
  export let loading = false;
  export let fields: {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'url' | 'boolean' | 'image' | 'date';
    required?: boolean;
    booleanLabels?: {
      true: string;
      false: string;
    };
    maxDate?: string;
    minDate?: string;
  }[] = [];
  export let formData: { [key: string]: string | boolean } = {};

  let imagePreview: { [key: string]: string } = {};
  let imageFiles: { [key: string]: File } = {};
  let stringFormData: { [key: string]: string } = {};

  export let onSubmit: (() => void) | undefined = undefined;
  export let onClose: (() => void) | undefined = undefined;

  $: {
    for (const field of fields) {
      if (
        field.type === 'image' &&
        typeof formData[field.key] === 'string' &&
        (formData[field.key] || formData[field.key] === '')
      ) {
        loadImage(formData[field.key], field.key);
      }
    }
    
    stringFormData = Object.entries(formData).reduce((acc, [key, value]) => {
      acc[key] = typeof value === 'string' ? value : '';
      return acc;
    }, {} as { [key: string]: string });
  }

  async function loadImage(fileName: string | undefined | boolean, key: string): Promise<void> {
    if (fileName) {
    const imageData = await getImage(fileName);
    if (imageData) {
      imagePreview[key] = imageData;
      }
    }
    else {
      imagePreview[key] = '';
    }
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();

    // อัพโหลดรูปภาพทั้งหมดก่อน
    for (const [fieldKey, file] of Object.entries(imageFiles)) {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      
      const fileName = await uploadImage(file);
      formData[fieldKey] = fileName;
    }

    if (onSubmit) onSubmit();
  }

  function handleClose() {
    imagePreview = {};
    imageFiles = {};
    if (onClose) onClose();
  }
  

  async function handleImageChange(event: Event, fieldKey: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      if (!file.type.startsWith('image/')) {
        alert('กรุณาอัพโหลดไฟล์รูปภาพเท่านั้น');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          imagePreview[fieldKey] = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);

      imageFiles[fieldKey] = file;
    }
  }

</script>

{#if show}
<form on:submit|preventDefault={handleSubmit}>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" transition:fade={{ duration: 200 }}>
    <div class="bg-[#2a2440] rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col p-0 shadow-2xl" transition:scale={{ duration: 200 }}>
      <h3 class="text-2xl font-bold text-white px-8 pt-8 pb-2">{title}</h3>
      <div class="flex-1 overflow-y-auto px-8 pb-2" style="min-height:0;">
        <div class="space-y-4 pb-4">
          {#each fields as field}
            <div>
              <label for={field.key} class="block text-gray-400 mb-2">{field.label}</label>
              {#if field.type === 'date'}
                <DatePicker
                  id={field.key}
                  bind:value={formData[field.key] as string}
                  placeholder={field.label}
                  maxDate={field.maxDate}
                  minDate={field.minDate}
                />
              {:else if field.type === 'textarea'}
                <textarea
                  id={field.key}
                  bind:value={stringFormData[field.key]}
                  on:input={(e) => formData[field.key] = e.currentTarget.value}
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
              {:else if field.type === 'image'}
                <div class="space-y-2">
                  <input
                    type="file"
                    id={field.key}
                    accept="image/*"
                    on:change={(e) => handleImageChange(e, field.key)}
                    class="w-full bg-[#1a1625] rounded-xl px-4 py-3 text-white border border-gray-700 focus:border-[#ff6b2b] focus:ring-1 focus:ring-[#ff6b2b]"
                    required={field.required && !formData[field.key]}
                  />
                  {#if imagePreview[field.key] || (typeof formData[field.key] === 'string' && formData[field.key])}
                  <div class="relative w-full h-48 bg-[#1a1625] rounded-xl overflow-hidden">
                    <img
                      src={imagePreview[field.key]}
                      alt="Preview"
                      class="w-full h-full object-contain"
                    />
                  </div>
                  {/if}
                </div>
              {:else}
                <input
                  type={field.type}
                  id={field.key}
                  bind:value={stringFormData[field.key]}
                  on:input={(e) => formData[field.key] = e.currentTarget.value}
                  class="w-full bg-[#1a1625] rounded-xl px-4 py-3 text-white border border-gray-700 focus:border-[#ff6b2b] focus:ring-1 focus:ring-[#ff6b2b]"
                  required={field.required}
                />
              {/if}
            </div>
          {/each}
        </div>
      </div>
      <div class="flex justify-end gap-4 pt-4 bg-[#2a2440] sticky bottom-0 left-0 right-0 z-10 px-8 pb-6 border-t border-[#332d4d] rounded-b-2xl">
        <button
          type="button"
          class="px-6 py-3 rounded-xl border-2 border-gray-500 text-gray-300 hover:bg-[#1a1625] cursor-pointer transition-colors text-lg"
          on:click={handleClose}
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          class="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] text-white font-semibold cursor-pointer transition-all hover:from-[#ff8f59] hover:to-[#ff2a90] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 text-lg"
          disabled={loading}
        >
          {loading ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </div>
    </div>
  </div>
</form>
{/if} 