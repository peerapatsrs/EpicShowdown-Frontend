<script lang="ts">
import { onMount, createEventDispatcher } from 'svelte';
import axiosInstance from '$lib/api/axios';
import { fade, scale } from 'svelte/transition';
import FormModal from './FormModal.svelte';
import type { FormField } from '$lib/types/form';
import { getImage } from '$lib/utils/image';

export let show = false;
export let contestCode: string = '';
const dispatch = createEventDispatcher();

let contestants: {id: number, fieldValues: {fieldName: string, value: string}[], fieldValueImages: {fieldName: string, value: string}[]}[] = [];
let loading = false;
let error = '';
let showFormModal = false;
let formMode: 'add' | 'edit' = 'add';
let formData: any = {};
let editingContestantId: number | null = null;
let saving = false;

let fields: FormField[] = [];
let loadingFields = false;

// เพิ่ม state สำหรับ index ของสไลด์แต่ละ contestant
let imageIndexes: Record<number, number> = {};
let imagePreviews: Record<string, string> = {};

//await getImage(fileName);

function isImage(fv: any){
  let field = fields.find((f: any) => f.key === fv.fieldName)
  return field?.type.toLowerCase() === 'image';
}

async function loadContestants() {
  contestants = [];
  if (!contestCode) return;
  loading = true;
  error = '';
  try {
    const { data } = await axiosInstance.get(`/Contest/${contestCode}/contestants`);
    console.log('data:', data);
    data.forEach((ct: any) => {
      ct.fieldValueImages = ct.fieldValues.filter((fv: any) => isImage(fv));
      ct.fieldValues = ct.fieldValues.filter((fv: any) => !isImage(fv));
      loadContestantImages(ct);
      contestants.push(ct);
      // กำหนด index เริ่มต้น
      if (imageIndexes[ct.id] === undefined) imageIndexes[ct.id] = 0;
    });
  } catch (e) {
    console.error('Error loading contestants:', e);
    error = 'โหลดข้อมูลผู้เข้าร่วมไม่สำเร็จ';
  } finally {
    loading = false;
  }
}

async function loadFields() {
  if (!contestCode) return;
  loadingFields = true;
  try {
    const { data } = await axiosInstance.get(`/Contest/${contestCode}/fields`);
    fields = data.map((e: any) => ({
      key: e.name,
      label: e.name,
      type: e.type.trim().toLowerCase(),
      required: !!e.isRequired
    })) as FormField[];
  } catch (e) {
    fields = [];
  } finally {
    loadingFields = false;
  }
}

function openAdd() {
  formMode = 'add';
  editingContestantId = null;
  formData = {};
  for (const f of fields) {
    formData[f.key] = '';
  }
  showFormModal = true;
}

function openEdit(contestant: any) {
  formMode = 'edit';
  editingContestantId = contestant.id;
  formData = {};
  for (const f of fields) {
    const found = contestant.fieldValues.find((fv: any) => fv.fieldName === f.key);
    formData[f.key] = found ? found.value : '';
  }
  showFormModal = true;
}

async function handleSubmit() {
  saving = true;
  error = '';
  const payload = {
    fieldValues: fields.map(f => ({ fieldName: f.key, value: formData[f.key] }))
  };
  try {
    if (formMode === 'add') {
      await axiosInstance.post(`/Contest/${contestCode}/contestants`, payload);
    } else if (formMode === 'edit' && editingContestantId) {
      await axiosInstance.put(`/Contest/${contestCode}/contestants/${editingContestantId}`, { id: editingContestantId, ...payload });
    }
    await loadContestants();
    showFormModal = false;
  } catch (e) {
    error = 'บันทึกข้อมูลไม่สำเร็จ';
  } finally {
    saving = false;
  }
}

async function handleDelete(contestant: any) {
  if (!confirm('ยืนยันการลบผู้เข้าร่วมนี้?')) return;
  try {
    await axiosInstance.delete(`/Contest/${contestCode}/contestants/${contestant.id}`);
    await loadContestants();
  } catch (e) {
    error = 'ลบข้อมูลไม่สำเร็จ';
  }
}

function handleClose() {
  dispatch('close');
}

// โหลดรูปภาพแบบ async และเก็บ base64
async function loadContestantImages(contestant: any) {
  if (!contestant.fieldValueImages) return;
  for (const img of contestant.fieldValueImages) {
    const key = `${contestant.id}_${img.fieldName}`;
    if (!imagePreviews[key]) {
      imagePreviews[key] = await getImage(img.value);
    }
  }
  console.log('imagePreviews:', imagePreviews);
}

function prevImage(contestantId: number, images: any[]) {
  if (!images.length) return;
  imageIndexes[contestantId] = (imageIndexes[contestantId] - 1 + images.length) % images.length;
}
function nextImage(contestantId: number, images: any[]) {
  if (!images.length) return;
  imageIndexes[contestantId] = (imageIndexes[contestantId] + 1) % images.length;
}

onMount(() => {
  if (show) {
    loadFields();
    loadContestants();
  }
});

$: if (show) {
  loadFields();
  loadContestants();
}
</script>

{#if show}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" transition:fade={{ duration: 200 }}>
    <div class="bg-[#2a2440] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col p-0 shadow-2xl" transition:scale={{ duration: 200 }}>
      <div class="flex items-center gap-3 px-8 pt-8 pb-2">
        <svg class="w-7 h-7 text-[#ff6b2b]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
        <h3 class="text-2xl font-bold text-white">จัดการผู้เข้าร่วม</h3>
      </div>
      <div class="flex-1 overflow-y-auto px-8 pb-2" style="min-height:0;">
        {#if error}
          <div class="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400">{error}</div>
        {/if}
        <div class="flex justify-end mb-4">
          <button class="px-5 py-2 rounded-xl bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] text-white font-semibold hover:scale-105 transition-all shadow" on:click={openAdd} disabled={loadingFields || loading}>เพิ่มผู้เข้าร่วม</button>
        </div>
        {#if loading || loadingFields}
          <div class="text-white/60">กำลังโหลด...</div>
        {:else if contestants.length === 0}
          <div class="text-white/60">ยังไม่มีผู้เข้าร่วม</div>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {#each contestants as contestant, i}
              {#key contestant.id}
                <div class="relative bg-[#251f35] rounded-xl shadow border border-[#332d4d] p-5 flex flex-row gap-4 min-h-[140px]">
                  <div class="absolute top-3 right-3 flex gap-2 z-10">
                    <button aria-label="แก้ไข" class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#ff6b2b]/20 transition" title="แก้ไข" on:click={() => openEdit(contestant)}>
                      <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 3.487a2.25 2.25 0 1 1 3.182 3.182L7.5 19.213l-4 1 1-4 12.362-12.726z"/></svg>
                    </button>
                    <button aria-label="ลบ" class="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#ff6b2b]/20 transition" title="ลบ" on:click={() => handleDelete(contestant)}>
                      <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                  <!-- รูปภาพซ้าย -->
                  <div class="flex-shrink-0 w-[80px] md:w-[100px] h-[120px] md:h-[140px] flex flex-col items-center justify-center relative">
                    {#if contestant.fieldValueImages.length > 0}
                      { @const idx = imageIndexes[contestant.id] ?? 0 }
                      <div class="w-full h-[80px] md:h-[110px] flex items-center justify-center bg-[#1a1625] rounded-lg overflow-hidden">
                        {#if contestant.fieldValueImages[idx]}
                          <img
                            src={imagePreviews[`${contestant.id}_${contestant.fieldValueImages[idx].fieldName}`]}
                            alt="รูปภาพผู้เข้าร่วม"
                            class="object-contain w-full h-full"
                          />
                        {:else}
                          <div class="w-full h-full flex items-center justify-center text-gray-500">กำลังโหลด...</div>
                        {/if}
                      </div>
                      <div class="flex justify-center items-center gap-2 mt-2">
                        <button aria-label="กดเพื่อดูรูปภาพก่อน" type="button" class="w-6 h-6 flex items-center justify-center rounded-full bg-[#332d4d] text-white hover:bg-[#ff6b2b] transition disabled:opacity-40" on:click={() => prevImage(contestant.id, contestant.fieldValueImages)} disabled={contestant.fieldValueImages.length <= 1}>
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
                        </button>
                        <div class="text-xs text-white/70">{(imageIndexes[contestant.id] ?? 0) + 1} / {contestant.fieldValueImages.length}</div>
                        <button aria-label="กดเพื่อดูรูปภาพถัดไป" type="button" class="w-6 h-6 flex items-center justify-center rounded-full bg-[#332d4d] text-white hover:bg-[#ff6b2b] transition disabled:opacity-40" on:click={() => nextImage(contestant.id, contestant.fieldValueImages)} disabled={contestant.fieldValueImages.length <= 1}>
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
                        </button>
                      </div>
                    {:else}
                      <div class="w-full h-[80px] md:h-[110px] flex items-center justify-center bg-[#1a1625] rounded-lg text-gray-500">ไม่มีรูป</div>
                    {/if}
                  </div>
                  <!-- ข้อมูลขวา -->
                  <div class="flex-1 min-w-0 flex flex-col justify-center pl-4">
                    <div class="font-bold text-lg text-white truncate mb-1">{contestant.fieldValues[0]?.value ?? 'ไม่ระบุชื่อ'}</div>
                    <ul class="text-white/80 text-sm space-y-1 max-h-[180px] overflow-y-auto pr-2">
                      {#each fields as f, idx}
                        {#if idx !== 0 && f.type !== 'image' && f.key !== 'รูปภาพ'}
                          <li><span class="font-semibold">{f.key}:</span> {contestant.fieldValues.find((fv: any) => fv.fieldName === f.key)?.value ?? '-'}</li>
                        {/if}
                      {/each}
                    </ul>
                  </div>
                </div>
              {/key}
            {/each}
          </div>
        {/if}
      </div>
      <div class="flex justify-end gap-4 pt-4 bg-[#2a2440] sticky bottom-0 left-0 right-0 z-10 px-8 pb-6 border-t border-[#332d4d] rounded-b-2xl">
        <button type="button" class="px-6 py-3 rounded-xl border-2 border-gray-500 text-gray-300 hover:bg-[#1a1625] cursor-pointer transition-colors text-lg flex items-center gap-2" on:click={handleClose} disabled={saving}><svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg> ปิด</button>
      </div>
    </div>
  </div>
  <FormModal
    show={showFormModal}
    title={formMode === 'add' ? 'เพิ่มผู้เข้าร่วม' : 'แก้ไขผู้เข้าร่วม'}
    loading={saving}
    fields={fields.map(f => ({ key: f.key, label: f.label, type: f.type, required: f.required }))}
    formData={formData}
    onSubmit={handleSubmit}
    onClose={() => showFormModal = false}
  />
{/if} 