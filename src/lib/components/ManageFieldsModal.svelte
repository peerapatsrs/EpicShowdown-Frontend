<script lang="ts">
  import { onMount } from 'svelte';
  import axiosInstance from '$lib/api/axios';
  import { fade, scale } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';
  import Select from '$lib/components/Select.svelte';

  export let show = false;
  export let contestCode: string | undefined;

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
  let allContests: any[] = [];
  let selectedCloneContestCode = '';
  let cloneFieldsPreview: any[] = [];
  let loadingClonePreview = false;
  let cloning = false;
  let selectedCloneContestObj: any = null;

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

  async function loadAllContests() {
    try {
      const { data } = await axiosInstance.get('/Contest');
      allContests = data.filter((c: any) => c.contestCode !== contestCode);
    } catch (e) {
      // ไม่ต้องแสดง error
    }
  }

  async function previewCloneFields(contestCode: string) {
    loadingClonePreview = true;
    try {
      const { data } = await axiosInstance.get(`/Contest/${contestCode}/fields`);
      cloneFieldsPreview = data;
    } catch (e) {
      cloneFieldsPreview = [];
    } finally {
      loadingClonePreview = false;
    }
  }

  async function cloneFieldsFromSelected() {
    if (!selectedCloneContestObj || !cloneFieldsPreview.length) return;
    cloning = true;
    error = '';
    try {
      for (const f of cloneFieldsPreview) {
        const payload = { ...f };
        delete payload.id;
        delete payload.createdAt;
        delete payload.updatedAt;
        await axiosInstance.post(`/Contest/${contestCode}/fields`, payload);
      }
      await loadFields();
      selectedCloneContestCode = '';
      cloneFieldsPreview = [];
    } catch (e) {
      error = 'โคลนฟิลด์ไม่สำเร็จ';
    } finally {
      cloning = false;
    }
  }

  function openAdd() {
    editingFieldId = null;
    let maxOrder = 0;
    if (fields && fields.length > 0) {
      maxOrder = Math.max(...fields.map(f => Number(f.order) || 0));
    }
    form = { name: '', type: '', description: '', isRequired: false, defaultValue: '', order: maxOrder + 1 };
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

  $: if (show && fields.length === 0) {
    loadAllContests();
  }

  $: if (selectedCloneContestCode) {
    previewCloneFields(selectedCloneContestCode);
  } else {
    cloneFieldsPreview = [];
  }

  $: selectedCloneContestObj = allContests.find(c => c.contestCode === selectedCloneContestCode);
</script>

{#if show}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" transition:fade={{ duration: 200 }}>
    <div class="bg-[#2a2440] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col p-0 shadow-2xl" transition:scale={{ duration: 200 }}>
      <div class="flex items-center gap-3 px-8 pt-8 pb-2">
        <svg class="w-7 h-7 text-[#ff6b2b]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
        <h3 class="text-2xl font-bold text-white">จัดการฟิลด์ผู้เข้าร่วม</h3>
      </div>
      <div class="flex-1 overflow-y-auto px-8 pb-2" style="min-height:0;">
        {#if error}
          <div class="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400">{error}</div>
        {/if}
        {#if fields.length === 0}
          <div class="mb-6 p-4 bg-[#251f35] rounded-xl border border-[#332d4d] shadow flex flex-col gap-2">
            <div class="text-white/90 font-medium mb-1">ยังไม่มีฟิลด์ในกิจกรรมนี้</div>
            <div class="text-white/70 mb-2">คุณสามารถโคลนฟิลด์จากกิจกรรมอื่นได้</div>
            <div class="mb-2 flex items-center gap-2">
              <label for="selectedCloneContestCode" class="text-white/70">เลือกกิจกรรมต้นทาง:</label>
              <Select
                bind:value={selectedCloneContestCode}
                options={allContests.map(c => ({ value: c.contestCode, label: c.name }))}
                placeholder="-- เลือกกิจกรรม --"
                className="min-w-[180px]"
                id={'selectedCloneContestCode'}
              />
            </div>
            {#if loadingClonePreview}
              <div class="text-white/60">กำลังโหลดตัวอย่างฟิลด์...</div>
            {:else if cloneFieldsPreview.length > 0 && selectedCloneContestCode !== ''}
              <div class="mb-2 text-white/80 font-medium">ตัวอย่างฟิลด์ที่จะโคลน:</div>
              <ul class="mb-2 bg-[#332d4d] rounded-lg p-3 text-white/90">
                {#each cloneFieldsPreview as f, i}
                  <li class="py-1 border-b border-[#251f35] last:border-0 flex items-center gap-2">
                    <span class="font-semibold">{i + 1}.</span> <span>{f.name}</span> <span class="text-xs text-gray-400">({f.type})</span> {#if f.isRequired}<span class="text-red-400 ml-1">*</span>{/if}
                  </li>
                {/each}
              </ul>
              <button class="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold hover:scale-105 transition-all shadow" on:click={cloneFieldsFromSelected} disabled={cloning}>โคลนฟิลด์จากกิจกรรมนี้</button>
            {/if}
          </div>
        {/if}
        <div class="flex flex-col md:flex-row gap-8">
          <div class="flex-1">
            {#if loading}
              <div class="text-white/60">กำลังโหลด...</div>
            {:else if fields.length === 0}
              <div class="text-white/60">ยังไม่มีฟิลด์</div>
            {:else}
              <div class="overflow-x-auto">
                <table class="w-full text-white/90 bg-[#251f35] rounded-xl shadow border border-[#332d4d]">
                  <thead>
                    <tr class="bg-[#332d4d] text-white/80">
                      <th class="py-2 px-2 text-center">#</th>
                      <th class="py-2 px-2 text-center">เลื่อน</th>
                      <th class="py-2 px-2 text-left">ชื่อฟิลด์</th>
                      <th class="py-2 px-2 text-left">ชนิด</th>
                      <th class="py-2 px-2 text-center">จำเป็น</th>
                      <th class="py-2 px-2 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each fields as field, i}
                      <tr class="border-b border-[#332d4d] last:border-0 hover:bg-[#332d4d]/40">
                        <td class="py-2 px-2 text-center font-semibold">{i + 1}</td>
                        <td class="py-2 px-2 text-center">
                          <div class="flex flex-col items-center gap-1">
                            <button aria-label="เลื่อนขึ้น" class="rounded-full p-1 bg-[#1a1625] hover:bg-[#ff6b2b] text-gray-400 hover:text-white transition disabled:opacity-40" title="เลื่อนขึ้น" on:click={() => moveFieldUp(i)} disabled={i === 0}><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7"/></svg></button>
                            <button aria-label="เลื่อนลง" class="rounded-full p-1 bg-[#1a1625] hover:bg-[#ff6b2b] text-gray-400 hover:text-white transition disabled:opacity-40" title="เลื่อนลง" on:click={() => moveFieldDown(i)} disabled={i === fields.length - 1}><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg></button>
                          </div>
                        </td>
                        <td class="py-2 px-2">{field.name}</td>
                        <td class="py-2 px-2">{field.type}</td>
                        <td class="py-2 px-2 text-center">{#if field.isRequired}<span class="text-red-400 font-bold">*</span>{:else}-{/if}</td>
                        <td class="py-2 px-2 text-center">
                          <div class="flex items-center justify-center gap-2">
                            <button aria-label="แก้ไข" class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#ff6b2b]/20 transition" title="แก้ไข" on:click={() => openEdit(field)}>
                              <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 3.487a2.25 2.25 0 1 1 3.182 3.182L7.5 19.213l-4 1 1-4 12.362-12.726z"/></svg>
                            </button>
                            <button aria-label="ลบ" class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#ff6b2b]/20 transition" title="ลบ" on:click={() => deleteField(field.id)}>
                              <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
              {#if orderChanged}
                <div class="flex justify-end mt-2">
                  <button class="px-5 py-2 rounded-xl bg-gradient-to-r from-green-500 to-green-700 text-white font-semibold hover:scale-105 transition-all shadow" on:click={updateAllFieldOrders}>อัปเดตลำดับ</button>
                </div>
              {/if}
            {/if}
          </div>
          <div class="flex-1">
            <div class="bg-[#251f35] rounded-xl p-5 border border-[#332d4d] shadow">
              <h4 class="text-white/90 font-semibold mb-3 flex items-center gap-2"><svg class="w-5 h-5 text-[#ff6b2b]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg> {editingFieldId ? 'แก้ไขฟิลด์' : 'เพิ่มฟิลด์'}</h4>
              <form class="space-y-3" on:submit|preventDefault={saveField}>
                <div>
                  <label for="fieldName" class="block text-white/80 mb-1">ชื่อฟิลด์</label>
                  <input id="fieldName" class="w-full rounded-lg bg-[#1a1625] text-white p-3 border border-gray-700 focus:border-[#ff6b2b]" bind:value={form.name} required />
                </div>
                <div>
                  <label for="fieldType" class="block text-white/80 mb-1">ชนิด</label>
                  <select id="fieldType" class="w-full rounded-lg bg-[#1a1625] text-white p-3 border border-gray-700 focus:border-[#ff6b2b]" bind:value={form.type} required>
                    <option value="">-- เลือกชนิด --</option>
                    {#each fieldTypes as t}
                      <option value={t}>{t}</option>
                    {/each}
                  </select>
                </div>
                <div>
                  <label for="fieldDescription" class="block text-white/80 mb-1">รายละเอียด</label>
                  <input id="fieldDescription" class="w-full rounded-lg bg-[#1a1625] text-white p-3 border border-gray-700 focus:border-[#ff6b2b]" bind:value={form.description} />
                </div>
                <div>
                  <label for="fieldDefaultValue" class="block text-white/80 mb-1">ค่าตั้งต้น</label>
                  <input id="fieldDefaultValue" class="w-full rounded-lg bg-[#1a1625] text-white p-3 border border-gray-700 focus:border-[#ff6b2b]" bind:value={form.defaultValue} />
                </div>
                <div>
                  <label for="fieldOrder" class="block text-white/80 mb-1">ลำดับ</label>
                  <input id="fieldOrder" type="number" min="1" class="w-full rounded-lg bg-[#1a1625] text-white p-3 border border-gray-700 focus:border-[#ff6b2b]" bind:value={form.order} />
                </div>
                <div class="flex items-center gap-2">
                  <input type="checkbox" id="isRequired" bind:checked={form.isRequired} class="accent-[#ff6b2b]" />
                  <label for="isRequired" class="text-white/80">จำเป็นต้องกรอก</label>
                </div>
                <div class="flex gap-2 mt-2">
                  <button type="submit" class="px-5 py-2 rounded-xl bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] text-white font-semibold hover:scale-105 transition-all shadow" disabled={saving}>{editingFieldId ? 'บันทึก' : 'เพิ่ม'}</button>
                  <button type="button" class="px-5 py-2 rounded-xl bg-gray-500/80 text-white font-semibold hover:scale-105 transition-all shadow" on:click={openAdd} disabled={saving}>ล้าง</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-4 pt-4 bg-[#2a2440] sticky bottom-0 left-0 right-0 z-10 px-8 pb-6 border-t border-[#332d4d] rounded-b-2xl">
        <button type="button" class="px-6 py-3 rounded-xl border-2 border-gray-500 text-gray-300 hover:bg-[#1a1625] cursor-pointer transition-colors text-lg flex items-center gap-2" on:click={handleClose} disabled={saving}><svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg> ปิด</button>
      </div>
    </div>
  </div>
{/if} 