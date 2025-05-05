<script lang="ts">
  import { onMount } from 'svelte';
  import axiosInstance from '$lib/api/axios';
  import { fade, scale } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';

  export let show = false;
  export let contestCode: string;

  const dispatch = createEventDispatcher();

  let fields: any[] = [];
  let fieldTypes: any[] = [];
  let loading = false;
  let error = '';
  let form = {
    name: '',
    type: '',
    description: '',
    isRequired: false,
    defaultValue: '',
    order: 1
  };
  let editingFieldId: number | null = null;
  let saving = false;
  let orderChanged = false;

  async function loadFields() {
    loading = true;
    error = '';
    try {
      const { data } = await axiosInstance.get(`/Contest/${contestCode}/fields`);
      fields = data;
    } catch (e) {
      error = 'โหลดฟิลด์ไม่สำเร็จ';
    } finally {
      loading = false;
    }
  }

  async function loadFieldTypes() {
    try {
      const { data } = await axiosInstance.get('/Contest/field-types');
      fieldTypes = data;
    } catch (e) {
      error = 'โหลดชนิดฟิลด์ไม่สำเร็จ';
    }
  }

  function openAdd() {
    editingFieldId = null;
    form = { name: '', type: '', description: '', isRequired: false, defaultValue: '', order: fields.length + 1 };
  }

  function openEdit(field: any) {
    editingFieldId = field.id;
    form = { ...field };
  }

  async function saveField() {
    saving = true;
    error = '';
    try {
      if (editingFieldId) {
        await axiosInstance.put(`/Contest/${contestCode}/fields/${editingFieldId}`, form);
      } else {
        await axiosInstance.post(`/Contest/${contestCode}/fields`, form);
      }
      await loadFields();
      openAdd();
    } catch (e) {
      error = 'บันทึกฟิลด์ไม่สำเร็จ';
    } finally {
      saving = false;
    }
  }

  async function deleteField(id: number) {
    if (!confirm('ยืนยันการลบฟิลด์นี้?')) return;
    try {
      await axiosInstance.delete(`/Contest/${contestCode}/fields/${id}`);
      await loadFields();
    } catch (e) {
      error = 'ลบฟิลด์ไม่สำเร็จ';
    }
  }

  function moveFieldUp(index: number) {
    if (index === 0) return;
    [fields[index - 1], fields[index]] = [fields[index], fields[index - 1]];
    fields = fields.map((f, i) => ({ ...f, order: i + 1 }));
    orderChanged = true;
  }

  function moveFieldDown(index: number) {
    if (index === fields.length - 1) return;
    [fields[index], fields[index + 1]] = [fields[index + 1], fields[index]];
    fields = fields.map((f, i) => ({ ...f, order: i + 1 }));
    orderChanged = true;
  }

  async function updateAllFieldOrders() {
    error = '';
    try {
      for (const f of fields) {
        await axiosInstance.put(`/Contest/${contestCode}/fields/${f.id}`, { ...f, order: f.order });
      }
      orderChanged = false;
      await loadFields();
    } catch (e) {
      error = 'อัปเดตลำดับไม่สำเร็จ';
    }
  }

  function handleClose() {
    dispatch('close');
  }

  onMount(() => {
    if (show) {
      loadFields();
      loadFieldTypes();
      openAdd();
    }
  });

  $: if (show) {
    // reload fields when modal is opened
    loadFields();
    loadFieldTypes();
    openAdd();
  }
</script>

{#if show}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" transition:fade={{ duration: 200 }}>
    <div class="bg-[#2a2440] rounded-xl p-6 w-full max-w-2xl min-h-[400px]" transition:scale={{ duration: 200 }}>
      <h3 class="text-xl font-bold text-white mb-4">จัดการฟิลด์ผู้เข้าร่วม</h3>
      {#if error}
        <div class="mb-2 text-red-400">{error}</div>
      {/if}
      <div class="flex flex-col md:flex-row gap-6">
        <div class="flex-1">
          <h4 class="text-white/80 mb-2">รายการฟิลด์</h4>
          {#if loading}
            <div class="text-white/60">กำลังโหลด...</div>
          {:else if fields.length === 0}
            <div class="text-white/60">ยังไม่มีฟิลด์</div>
          {:else}
            <ul class="divide-y divide-[#332d4d]">
              {#each fields as field, i}
                <li class="py-2 flex items-center gap-2">
                  <div class="flex flex-col gap-1 mr-2">
                    <button class="text-gray-400 hover:text-white" title="เลื่อนขึ้น" on:click={() => moveFieldUp(i)} disabled={i === 0}>▲</button>
                    <button class="text-gray-400 hover:text-white" title="เลื่อนลง" on:click={() => moveFieldDown(i)} disabled={i === fields.length - 1}>▼</button>
                  </div>
                  <div class="flex-1">
                    <div class="text-white font-medium">{i + 1}. {field.name} <span class="text-xs text-gray-400">({field.type})</span></div>
                    <div class="text-xs text-gray-400">{field.description}</div>
                  </div>
                  <button class="text-blue-400 hover:underline" on:click={() => openEdit(field)}>แก้ไข</button>
                  <button class="text-red-400 hover:underline" on:click={() => deleteField(field.id)}>ลบ</button>
                </li>
              {/each}
            </ul>
            {#if orderChanged}
              <div class="flex justify-end mt-2">
                <button class="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-green-700 text-white font-medium hover:scale-105 transition-all" on:click={updateAllFieldOrders}>อัปเดตลำดับ</button>
              </div>
            {/if}
          {/if}
        </div>
        <div class="flex-1">
          <h4 class="text-white/80 mb-2">{editingFieldId ? 'แก้ไขฟิลด์' : 'เพิ่มฟิลด์'}</h4>
          <form class="space-y-2" on:submit|preventDefault={saveField}>
            <div>
              <label for="fieldName" class="block text-white/80 mb-1">ชื่อฟิลด์</label>
              <input id="fieldName" class="w-full rounded bg-[#251f35] text-white p-2 border border-gray-700" bind:value={form.name} required />
            </div>
            <div>
              <label for="fieldType" class="block text-white/80 mb-1">ชนิด</label>
              <select id="fieldType" class="w-full rounded bg-[#251f35] text-white p-2 border border-gray-700" bind:value={form.type} required>
                <option value="">-- เลือกชนิด --</option>
                {#each fieldTypes as t}
                  <option value={t}>{t}</option>
                {/each}
              </select>
            </div>
            <div>
              <label for="fieldDescription" class="block text-white/80 mb-1">รายละเอียด</label>
              <input id="fieldDescription" class="w-full rounded bg-[#251f35] text-white p-2 border border-gray-700" bind:value={form.description} />
            </div>
            <div>
              <label for="fieldDefaultValue" class="block text-white/80 mb-1">ค่าตั้งต้น</label>
              <input id="fieldDefaultValue" class="w-full rounded bg-[#251f35] text-white p-2 border border-gray-700" bind:value={form.defaultValue} />
            </div>
            <div>
              <label for="fieldOrder" class="block text-white/80 mb-1">ลำดับ</label>
              <input id="fieldOrder" type="number" min="1" class="w-full rounded bg-[#251f35] text-white p-2 border border-gray-700" bind:value={form.order} />
            </div>
            <div class="flex items-center gap-2">
              <input type="checkbox" id="isRequired" bind:checked={form.isRequired} class="accent-[#ff6b2b]" />
              <label for="isRequired" class="text-white/80">จำเป็นต้องกรอก</label>
            </div>
            <div class="flex gap-2 mt-2">
              <button type="submit" class="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] text-white font-medium hover:scale-105 transition-all" disabled={saving}>{editingFieldId ? 'บันทึก' : 'เพิ่ม'}</button>
              <button type="button" class="px-4 py-2 rounded-xl bg-gray-500/80 text-white font-medium hover:scale-105 transition-all" on:click={openAdd} disabled={saving}>ล้าง</button>
            </div>
          </form>
        </div>
      </div>
      <div class="flex justify-end mt-6">
        <button type="button" class="px-6 py-2 rounded-xl border-2 border-gray-500 text-gray-300 hover:bg-[#1a1625] cursor-pointer transition-colors" on:click={handleClose} disabled={saving}>ปิด</button>
      </div>
    </div>
  </div>
{/if} 