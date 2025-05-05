<script lang="ts">
import { onMount } from 'svelte';
import axiosInstance from '$lib/api/axios';
import { fade, scale } from 'svelte/transition';
import ConfirmModal from '$lib/components/ConfirmModal.svelte';
import { isAuthenticated } from '$lib/stores/auth';
import DatePicker from '$lib/components/DatePicker.svelte';
import ManageFieldsModal from '$lib/components/ManageFieldsModal.svelte';
import ManageContestantsModal from '$lib/components/ManageContestantsModal.svelte';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import { formatDateThai } from '$lib/utils/date';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(buddhistEra);
dayjs.tz.setDefault('Asia/Bangkok');

interface Contest {
  contestCode: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  giftStartDate: string;
  giftEndDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  displayTemplateCode: string;
  contestants: any[];
  fields: any[];
}

interface FormData {
  [key: string]: string | boolean;
}

const fields = [
  { key: 'name', label: 'ชื่อกิจกรรม', type: 'text', required: true },
  { key: 'description', label: 'คำอธิบาย', type: 'textarea', required: true },
  { key: 'startDate', label: 'วันเริ่มกิจกรรม', type: 'date', required: true },
  { key: 'endDate', label: 'วันสิ้นสุดกิจกรรม', type: 'date', required: true },
  { key: 'giftStartDate', label: 'วันเริ่มส่งของขวัญ', type: 'date', required: true, tableShow:false },
  { key: 'giftEndDate', label: 'วันสิ้นสุดส่งของขวัญ', type: 'date', required: true, tableShow:false },
  { key: 'displayTemplateCode', label: 'Display Template', type: 'guid', required: true },
  { key: 'isActive', label: 'สถานะ', type: 'boolean', booleanLabels: { true: '✔', false: '✘' } }
] as const;

const descriptionIndex = fields.findIndex(f => f.key === 'description');

let items: Contest[] = [];
let filteredItems: Contest[] = [];
let searchTerm = '';
let loading = false;
let error = '';
let success = '';

let showAddModal = false;
let showEditModal = false;
let showDeleteModal = false;
let currentItem: Contest | null = null;
let form: FormData = {};
let processingRowId: string | null = null;
let selectedItem: Contest | null = null;
let mode: 'view' | 'edit' | 'add' = 'view';
let displayTemplates: { code: string, name: string }[] = [];
let showAdvancedFilter = false;
let filterName = '';
let filterStartDate = '';
let filterEndDate = '';
let filterGiftStartDate = '';
let filterGiftEndDate = '';
let filterStartDateOperator: 'eq' | 'gt' | 'lt' = 'eq';
let filterEndDateOperator: 'eq' | 'gt' | 'lt' = 'eq';
let filterGiftStartDateOperator: 'eq' | 'gt' | 'lt' = 'eq';
let filterGiftEndDateOperator: 'eq' | 'gt' | 'lt' = 'eq';
let isAdvancedFilterActive = false;
let showManageFieldsModal = false;
let showManageContestantsModal = false;

function filterItems(items: Contest[], term: string) {
  if (!term) return items;
  const searchLower = term.toLowerCase();
  return items.filter(item =>
    item.name.toLowerCase().includes(searchLower) ||
    item.description.toLowerCase().includes(searchLower)
  );
}

function applyAdvancedFilter() {
  filteredItems = items.filter(item => {
    const nameMatch = !filterName || item.name.toLowerCase().includes(filterName.toLowerCase());
    let startDateMatch = true;
    let endDateMatch = true;
    if (filterStartDate) {
      if (filterStartDateOperator === 'eq') {
        startDateMatch = item.startDate === filterStartDate;
      } else if (filterStartDateOperator === 'gt') {
        startDateMatch = item.startDate > filterStartDate;
      } else if (filterStartDateOperator === 'lt') {
        startDateMatch = item.startDate < filterStartDate;
      }
    }
    if (filterEndDate) {
      if (filterEndDateOperator === 'eq') {
        endDateMatch = item.endDate === filterEndDate;
      } else if (filterEndDateOperator === 'gt') {
        endDateMatch = item.endDate > filterEndDate;
      } else if (filterEndDateOperator === 'lt') {
        endDateMatch = item.endDate < filterEndDate;
      }
    }
    const giftStartDateMatch = !filterGiftStartDate || (item.giftStartDate && item.giftStartDate >= filterGiftStartDate);
    const giftEndDateMatch = !filterGiftEndDate || (item.giftEndDate && item.giftEndDate <= filterGiftEndDate);
    return nameMatch && startDateMatch && endDateMatch && giftStartDateMatch && giftEndDateMatch;
  });
  isAdvancedFilterActive = true;
  showAdvancedFilter = false;
}

function resetAdvancedFilter() {
  filterName = '';
  filterStartDate = '';
  filterEndDate = '';
  filterGiftStartDate = '';
  filterGiftEndDate = '';
  filteredItems = filterItems(items, searchTerm);
  isAdvancedFilterActive = false;
  showAdvancedFilter = false;
}

$: if (!isAdvancedFilterActive) {
  filteredItems = filterItems(items, searchTerm);
}

function normalizePayloadFields(payload: any) {
  ['startDate', 'endDate', 'giftStartDate', 'giftEndDate', 'displayTemplateCode'].forEach(key => {
    if (payload[key] === '') payload[key] = null;
  });
  return payload;
}

async function loadData() {
  loading = true;
  error = success = '';
  try {
    const { data } = await axiosInstance.get('/Contest');
    items = data;
  } catch (e) {
    error = 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
    console.error(e);
  } finally {
    loading = false;
  }
}

function handleAddClick() {
  resetForm();
  selectedItem = null;
  mode = 'add';
}

async function handleAddSubmit() {
  processingRowId = 'new';
  error = success = '';
  try {
    const payload = { ...form };
    delete payload.isActive;
    normalizePayloadFields(payload);
    const response = await axiosInstance.post('/Contest', payload);
    success = 'เพิ่มกิจกรรมสำเร็จ';
    items = [response.data, ...items];
    selectedItem = response.data;
    mode = 'view';
    resetForm();
  } catch (e) {
    error = 'เกิดข้อผิดพลาดในการเพิ่มกิจกรรม';
    console.error(e);
  } finally {
    processingRowId = null;
  }
}

function handleCancel() {
    resetForm();
    selectedItem = null;
}

async function editItem() {
  showEditModal = false;
  if (!currentItem) return;
  const code = currentItem?.contestCode;
  if (!code) return;
  processingRowId = code;
  error = success = '';
  try {
    const payload = { ...form };
    delete payload.isActive;
    const response = await axiosInstance.put(`/Contest/${code}`, payload);
    success = 'แก้ไขกิจกรรมสำเร็จ';
    items = items.map(item =>
      item.contestCode === code ? response.data : item
    );
    resetForm();
  } catch (e) {
    error = 'เกิดข้อผิดพลาดในการแก้ไขกิจกรรม';
    console.error(e);
  } finally {
    processingRowId = null;
    handleCancel()
  }
}

async function deleteItem() {
  showDeleteModal = false;
  if (!currentItem) return;
  const code = currentItem?.contestCode;
  if (!code) return;
  processingRowId = code;
  error = success = '';
  try {
    await axiosInstance.delete(`/Contest/${code}`);
    items = items.filter(item => item.contestCode !== code);
    success = 'ลบกิจกรรมสำเร็จ';
    currentItem = null;
  } catch (e) {
    error = 'เกิดข้อผิดพลาดในการลบกิจกรรม';
    console.error(e);
  } finally {
    processingRowId = null;
  }
}

function resetForm() {
  form = fields.reduce<FormData>((acc, field) => {
    acc[field.key] = field.type === 'boolean' ? true : '';
    return acc;
  }, {} as FormData);
  currentItem = null;
}

function selectItem(item: Contest) {
  selectedItem = item;
  openEditPanel(item);
}

function openEditPanel(item: Contest) {
  currentItem = item;
  form = fields.reduce<FormData>((acc, field) => {
    if (field.key in item) {
      const value = item[field.key as keyof Contest];
      if (Array.isArray(value)) {
        acc[field.key] = '';
      } else {
        acc[field.key] = value ?? '';
      }
    }
    return acc;
  }, {} as FormData);
}

function openDeleteModal(item: Contest) {
  currentItem = item;
  showDeleteModal = true;
}

onMount(async () => {
  isAuthenticated;
  await loadData();
  try {
    const { data } = await axiosInstance.get('/DisplayTemplate');
    displayTemplates = data;
  } catch (e) {
    console.error('โหลด DisplayTemplate ไม่สำเร็จ', e);
  }
});
</script>

<div class="min-h-screen bg-gradient-to-b from-[#1a1625] to-[#251f35] py-12">
  <div class="container mx-auto px-4">
    <div class="bg-[#2a2440] rounded-2xl shadow-2xl overflow-hidden">
      <div class="bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] p-8">
        <h2 class="text-3xl font-bold text-white mb-2">กิจกรรมของฉัน</h2>
        <p class="text-white/80">จัดการกิจกรรมที่คุณสร้าง</p>
      </div>
      <div class="p-8">
        {#if error}
          <div class="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">{error}</div>
        {/if}
        {#if success}
          <div class="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">{success}</div>
        {/if}
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div class="flex-1 w-full md:w-auto relative">
            <input
              type="text"
              placeholder="ค้นหาจากชื่อหรือคำอธิบาย..."
              bind:value={searchTerm}
              class="w-full bg-[#1a1625] text-white rounded-xl pl-4 pr-4 py-3 border border-gray-700 focus:border-[#ff6b2b] focus:ring-1 focus:ring-[#ff6b2b]"
            />
          </div>
          <button
            class="flex items-center gap-2 rounded-xl px-6 py-3 text-white font-medium transition-all hover:scale-105 hover:shadow-lg hover:shadow-[#ff6b2b]/20
              {isAdvancedFilterActive
                ? 'bg-gradient-to-r from-green-500 to-green-700'
                : 'bg-gradient-to-r from-[#ff6b2b] to-[#ee0979]'}"
            on:click={() => showAdvancedFilter = true}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-5.414 5.414A2 2 0 0014 13.586V19a1 1 0 01-1.447.894l-4-2A1 1 0 018 17v-3.414a2 2 0 00-.586-1.414L2 6.707A1 1 0 012 6V4z" />
            </svg>
            ฟิลเตอร์
            {#if isAdvancedFilterActive}
              <span class="ml-2 inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" title="กำลังฟิลเตอร์"></span>
            {/if}
          </button>
        </div>
        <div class="flex flex-col md:flex-row gap-8">
          <!-- ซ้าย: รายชื่อกิจกรรม -->
          <div class="w-full md:w-1/3">
            <div class="bg-[#1a1625] rounded-xl p-4 h-full">
              {#if filteredItems.length === 0}
                <div class="text-white/60 text-center py-8">{searchTerm ? 'ไม่พบกิจกรรมที่ค้นหา' : 'ยังไม่มีกิจกรรม'}</div>
              {:else}
                <ul>
                  {#each filteredItems as item}
                    <li class="mb-2">
                      <button
                        class="w-full text-left px-4 py-3 rounded-lg transition-all font-medium text-white hover:bg-[#ff6b2b]/20 focus:bg-[#ff6b2b]/30 border border-transparent focus:outline-none {selectedItem && selectedItem.contestCode === item.contestCode ? 'bg-[#ff6b2b]/30 border-[#ff6b2b]' : ''}"
                        on:click={() => { selectItem(item); mode = 'view'; }}
                      >
                        <div class="truncate" title={item.name}>{item.name}</div>
                        <div class="text-xs text-white/50 truncate" title={item.description}>{item.description}</div>
                        <div class="text-xs text-white/40 mt-1" style="color: {
                          dayjs().isBefore(dayjs(item.startDate), 'day')
                            ? '#2563eb' // blue
                            : dayjs().isAfter(dayjs(item.endDate), 'day')
                              ? '#ef4444' // red
                              : '#22c55e' // green
                        }">
                          {dayjs(item.startDate).formatDateThai('DD/MM/YYYY', true)} - {dayjs(item.endDate).formatDateThai('DD/MM/YYYY', true)}
                        </div>
                      </button>
                    </li>
                  {/each}
                </ul>
              {/if}
              <div class="flex flex-col gap-4 mt-8">
                <button
                  class="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] px-5 py-2 text-white font-medium transition-all hover:scale-105 hover:shadow-lg hover:shadow-[#ff6b2b]/20 shadow-md"
                  on:click={handleAddClick}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
                  </svg>
                  เพิ่มกิจกรรม
                </button>
              </div>
            </div>
          </div>
          <!-- ขวา: รายละเอียดกิจกรรม -->
          <div class="w-full md:w-2/3">
            <div class="bg-[#1a1625] rounded-xl p-6 min-h-[300px]">
              {#if mode === 'add'}
                <!-- ฟอร์มเพิ่มกิจกรรม -->
                <form on:submit|preventDefault={handleAddSubmit} class="space-y-4">
                  <div>
                    <label for="name" class="block text-white/80 mb-1">ชื่อกิจกรรม</label>
                    <input id="name" type="text" class="w-full rounded-lg bg-[#251f35] text-white p-2 border border-gray-700 focus:border-[#ff6b2b]" bind:value={form.name} />
                  </div>
                  <div>
                    <label for="description" class="block text-white/80 mb-1">คำอธิบาย</label>
                    <textarea id="description" class="w-full rounded-lg bg-[#251f35] text-white p-2 border border-gray-700 focus:border-[#ff6b2b]" bind:value={form.description}></textarea>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label for="startDate" class="block text-white/80 mb-1">วันเริ่มกิจกรรม</label>
                      <DatePicker id="startDate" bind:value={form.startDate as string} placeholder="วันเริ่มกิจกรรม" />
                    </div>
                    <div>
                      <label for="endDate" class="block text-white/80 mb-1">วันสิ้นสุดกิจกรรม</label>
                      <DatePicker id="endDate" bind:value={form.endDate as string} placeholder="วันสิ้นสุดกิจกรรม" />
                    </div>
                    <div>
                      <label for="giftStartDate" class="block text-white/80 mb-1">วันเริ่มส่งของขวัญ</label>
                      <DatePicker id="giftStartDate" bind:value={form.giftStartDate as string} placeholder="วันเริ่มส่งของขวัญ" />
                    </div>
                    <div>
                      <label for="giftEndDate" class="block text-white/80 mb-1">วันสิ้นสุดส่งของขวัญ</label>
                      <DatePicker id="giftEndDate" bind:value={form.giftEndDate as string} placeholder="วันสิ้นสุดส่งของขวัญ" />
                    </div>
                  </div>
                  <div>
                    <label for="displayTemplateCode" class="block text-white/80 mb-1">Display Template</label>
                    <select
                      id="displayTemplateCode"
                      class="w-full rounded-lg bg-[#251f35] text-white p-2 border border-gray-700 focus:border-[#ff6b2b]"
                      bind:value={form.displayTemplateCode}
                    >
                      <option value="">-- เลือก Template --</option>
                      {#each displayTemplates as tpl}
                        <option value={tpl.code}>{tpl.name}</option>
                      {/each}
                    </select>
                  </div>
                  <div>
                    <label for="isActive" class="block text-white/80 mb-1">สถานะ</label>
                    <input id="isActive" type="checkbox" checked={!!form.isActive} class="accent-[#ff6b2b]" />
                  </div>
                  <div class="flex gap-4 mt-6">
                    <button type="submit" class="px-6 py-2 rounded-xl bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] text-white font-medium hover:scale-105 transition-all" disabled={processingRowId !== null}>บันทึก</button>
                    <button type="button" class="px-6 py-2 rounded-xl bg-gray-500/80 text-white font-medium hover:scale-105 transition-all" on:click={handleCancel} disabled={processingRowId !== null}>ยกเลิก</button>
                  </div>
                </form>
              {:else if selectedItem}
                <!-- รายละเอียดกิจกรรม/แก้ไข -->
                <form on:submit|preventDefault={editItem} class="space-y-4">
                  <div>
                    <label for="name" class="block text-white/80 mb-1">ชื่อกิจกรรม</label>
                    <input id="name" type="text" class="w-full rounded-lg bg-[#251f35] text-white p-2 border border-gray-700 focus:border-[#ff6b2b]" bind:value={form.name} />
                  </div>
                  <div>
                    <label for="description" class="block text-white/80 mb-1">คำอธิบาย</label>
                    <textarea id="description" class="w-full rounded-lg bg-[#251f35] text-white p-2 border border-gray-700 focus:border-[#ff6b2b]" bind:value={form.description}></textarea>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label for="startDate" class="block text-white/80 mb-1">วันเริ่มกิจกรรม</label>
                      <DatePicker id="startDate" bind:value={form.startDate as string} placeholder="เลือกวันที่" />
                    </div>
                    <div>
                      <label for="endDate" class="block text-white/80 mb-1">วันสิ้นสุดกิจกรรม</label>
                      <DatePicker id="endDate" bind:value={form.endDate as string} placeholder="เลือกวันที่" />
                    </div>
                    <div>
                      <label for="giftStartDate" class="block text-white/80 mb-1">วันเริ่มส่งของขวัญ</label>
                      <DatePicker id="giftStartDate" bind:value={form.giftStartDate as string} placeholder="เลือกวันที่" />
                    </div>
                    <div>
                      <label for="giftEndDate" class="block text-white/80 mb-1">วันสิ้นสุดส่งของขวัญ</label>
                      <DatePicker id="giftEndDate" bind:value={form.giftEndDate as string} placeholder="เลือกวันที่" />
                    </div>
                  </div>
                  <div>
                    <label for="displayTemplateCode" class="block text-white/80 mb-1">Display Template</label>
                    <select
                      id="displayTemplateCode"
                      class="w-full rounded-lg bg-[#251f35] text-white p-2 border border-gray-700 focus:border-[#ff6b2b]"
                      bind:value={form.displayTemplateCode}
                    >
                      <option value="">-- เลือก Template --</option>
                      {#each displayTemplates as tpl}
                        <option value={tpl.code}>{tpl.name}</option>
                      {/each}
                    </select>
                  </div>
                  <div>
                    <label for="isActive" class="block text-white/80 mb-1">สถานะ</label>
                    <input id="isActive" type="checkbox" checked={!!form.isActive} class="accent-[#ff6b2b]" />
                  </div>
                  <div class="flex gap-4 mt-6">
                    <button type="submit" class="px-6 py-2 rounded-xl bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] text-white font-medium hover:scale-105 transition-all" disabled={processingRowId !== null}>แก้ไข</button>
                    <button type="button" class="px-6 py-2 rounded-xl bg-red-500/80 text-white font-medium hover:scale-105 transition-all" on:click={() => { if (selectedItem) openDeleteModal(selectedItem); }} disabled={processingRowId !== null}>ลบกิจกรรม</button>
                    <button type="button" class="px-6 py-2 rounded-xl bg-blue-500/80 text-white font-medium hover:scale-105 transition-all" on:click={() => showManageFieldsModal = true} disabled={processingRowId !== null}>จัดการฟิลด์ผู้เข้าร่วม</button>
                    <button type="button" class="px-6 py-2 rounded-xl bg-green-500/80 text-white font-medium hover:scale-105 transition-all" on:click={() => showManageContestantsModal = true} disabled={processingRowId !== null}>จัดการผู้เข้าร่วม</button>
                  </div>
                </form>
              {:else}
                <div class="text-white/60 text-center py-16">เลือกกิจกรรมเพื่อดูรายละเอียด</div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

{#if showAdvancedFilter}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" transition:fade={{ duration: 200 }}>
    <div class="bg-[#2a2440] rounded-xl w-full max-w-md max-h-[90vh] flex flex-col p-0" transition:scale={{ duration: 200 }}>
      <h3 class="text-xl font-bold text-white mb-4 px-6 pt-6">ฟิลเตอร์</h3>
      <div class="flex-1 overflow-y-auto px-6" style="min-height:0;">
        <form class="space-y-4 pb-4" on:submit|preventDefault={applyAdvancedFilter}>
          <div>
            <label for="filterName" class="block text-white/80 mb-1">ค้นหาชื่อกิจกรรม</label>
            <input id="filterName" type="text" class="w-full rounded-lg bg-[#251f35] text-white p-2 border border-gray-700 focus:border-[#ff6b2b]" placeholder="ชื่อกิจกรรม..." bind:value={filterName} />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="filterStartDate" class="block text-white/80 mb-1">วันที่เริ่ม</label>
              <div class="flex gap-2 items-center filter-operator">
                <select id="filterStartDateOperator" bind:value={filterStartDateOperator} class="rounded bg-[#251f35] text-white border border-gray-700 px-2 py-1">
                  <option value="eq">=</option>
                  <option value="gt">&gt;</option>
                  <option value="lt">&lt;</option>
                </select>
                <DatePicker id="filterStartDate" placeholder="เลือกวันที่" bind:value={filterStartDate} />
              </div>
            </div>
            <div>
              <label for="filterEndDate" class="block text-white/80 mb-1">วันที่สิ้นสุด</label>
              <div class="flex gap-2 items-center filter-operator">
                <select id="filterEndDateOperator" bind:value={filterEndDateOperator} class="rounded bg-[#251f35] text-white border border-gray-700 px-2 py-1">
                  <option value="eq">=</option>
                  <option value="gt">&gt;</option>
                  <option value="lt">&lt;</option>
                </select>
                <DatePicker id="filterEndDate" placeholder="เลือกวันที่" bind:value={filterEndDate} />
              </div>
            </div>
            <div>
              <label for="filterGiftStartDate" class="block text-white/80 mb-1">วันที่เริ่มส่งของขวัญ</label>
              <div class="flex gap-2 items-center filter-operator">
                <select id="filterGiftStartDateOperator" bind:value={filterGiftStartDateOperator} class="rounded bg-[#251f35] text-white border border-gray-700 px-2 py-1">
                  <option value="eq">=</option>
                  <option value="gt">&gt;</option>
                  <option value="lt">&lt;</option>
                </select>
                <DatePicker id="filterGiftStartDate" placeholder="เลือกวันที่" bind:value={filterGiftStartDate} />
              </div>
            </div>
            <div>
              <label for="filterGiftEndDate" class="block text-white/80 mb-1">วันที่สิ้นสุดส่งของขวัญ</label>
              <div class="flex gap-2 items-center filter-operator">
                <select id="filterGiftEndDateOperator" bind:value={filterGiftEndDateOperator} class="rounded bg-[#251f35] text-white border border-gray-700 px-2 py-1">
                  <option value="eq">=</option>
                  <option value="gt">&gt;</option>
                  <option value="lt">&lt;</option>
                </select>
                <DatePicker id="filterGiftEndDate" placeholder="เลือกวันที่" bind:value={filterGiftEndDate} />
              </div>
            </div>
          </div>
        </form>
      </div>
      <div class="flex justify-end gap-4 pt-4 bg-[#2a2440] sticky bottom-0 left-0 right-0 z-10 px-6 pb-6 border-t border-[#332d4d]">
        <button type="button" class="px-6 py-3 rounded-xl border-2 border-gray-500 text-gray-300 hover:bg-[#1a1625] cursor-pointer transition-colors" on:click={resetAdvancedFilter}>เคลียร์</button>
        <button type="button" class="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] text-white font-medium cursor-pointer transition-all hover:from-[#ff8f59] hover:to-[#ff2a90] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60" on:click={applyAdvancedFilter}>ยืนยัน</button>
      </div>
    </div>
  </div>
{/if}

<ManageFieldsModal show={showManageFieldsModal} contestCode={selectedItem?.contestCode ?? ''} on:close={() => showManageFieldsModal = false} />
<ManageContestantsModal show={showManageContestantsModal} contestCode={selectedItem?.contestCode ?? ''} on:close={() => showManageContestantsModal = false} />

<ConfirmModal
  show={showDeleteModal}
  title="ยืนยันการลบกิจกรรม"
  message="คุณต้องการลบกิจกรรมนี้หรือไม่?"
  loading={processingRowId !== null}
  on:confirm={deleteItem}
  on:close={() => {
    showDeleteModal = false;
    currentItem = null;
  }}
/> 

<style>
    .filter-operator select {
        -webkit-appearance: none !important; -moz-appearance: none !important; appearance: none !important; background-image: none !important;
    }
    .filter-operator select option {
        background-color: #251f35;
        color: #fff;
        border: 1px solid #332d4d;
        border-radius: 4px;
        padding: 4px 8px;
    }
</style>