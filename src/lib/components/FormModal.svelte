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

  let imagePreview: { [key: string]: string } = {};
  let imageFiles: { [key: string]: File } = {};
  let stringFormData: { [key: string]: string } = {};

  export let onSubmit: (() => void) | undefined = undefined;
  export let onClose: (() => void) | undefined = undefined;

  $: {
    // แปลงค่า formData เป็น string สำหรับ input fields
    stringFormData = Object.entries(formData).reduce((acc, [key, value]) => {
      acc[key] = typeof value === 'string' ? value : '';
      return acc;
    }, {} as { [key: string]: string });
  }

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (onSubmit) onSubmit();
  }

  function handleClose() {
    // รีเซ็ตค่า preview และไฟล์รูปภาพ
    imagePreview = {};
    imageFiles = {};
    if (onClose) onClose();
  }

  function handleImageChange(event: Event, fieldKey: string) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // ตรวจสอบว่าเป็นไฟล์รูปภาพ
      if (!file.type.startsWith('image/')) {
        alert('กรุณาอัพโหลดไฟล์รูปภาพเท่านั้น');
        return;
      }

      // สร้าง URL สำหรับ preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          imagePreview[fieldKey] = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);

      // เก็บไฟล์ไว้สำหรับส่งข้อมูล
      imageFiles[fieldKey] = file;
      // อัพเดท formData เพื่อให้ required validation ทำงาน
      formData[fieldKey] = file.name;
    }
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
                      src={imagePreview[field.key] || (formData[field.key]?.toString() || '')}
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