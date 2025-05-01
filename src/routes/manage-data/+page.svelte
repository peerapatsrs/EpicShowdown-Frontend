<script lang="ts">
  import { onMount } from 'svelte';
  import axiosInstance from '$lib/api/axios';
  import type { SortConfig } from '$lib/types/table';
  import DataTable from '$lib/components/DataTable.svelte';
  import FormModal from '$lib/components/FormModal.svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';
  import Select from '$lib/components/Select.svelte';

  interface DataType {
    id: string;
    name: string;
    endpoint: string;
    fields: Field[];
  }

  interface Field {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'url' | 'boolean' | 'image';
    required?: boolean;
    booleanLabels?: {
      true: string;
      false: string;
    };
  }

  interface FormData {
    [key: string]: string | boolean;
  }

  // กำหนดโครงสร้างข้อมูลแต่ละประเภท
  const dataTypes: DataType[] = [
    {
      id: 'gift',
      name: 'ของรางวัล',
      endpoint: '/Gift',
      fields: [
        { key: 'name', label: 'ชื่อ', type: 'text', required: true },
        { key: 'description', label: 'คำอธิบาย', type: 'textarea' },
        { key: 'imageUrl', label: 'URL รูปภาพ', type: 'image' },
        { 
          key: 'isActive', 
          label: 'สถานะ', 
          type: 'boolean',
          booleanLabels: {
            true: 'เปิดใช้งาน',
            false: 'ปิดใช้งาน'
          }
        }
      ]
    }
    // สามารถเพิ่มประเภทข้อมูลอื่นๆ ที่มีฟิลด์ต่างกันได้
  ];

  let selectedType: DataType = dataTypes[0];
  let items: any[] = [];
  let filteredItems: any[] = [];
  let searchTerm = '';
  let loading = false;
  let error = '';
  let success = '';
  let sortConfig: SortConfig = { key: '', direction: null };
  let showActions = true;

  // สถานะสำหรับ modal
  let showAddModal = false;
  let showEditModal = false;
  let showDeleteModal = false;
  let currentItem: any = null;

  // ฟอร์มสำหรับเพิ่ม/แก้ไขข้อมูล
  let form: FormData = {};

  // ฟังก์ชันสำหรับกรองข้อมูล
  function filterItems(items: any[], term: string) {
    if (!term) return items;
    const searchLower = term.toLowerCase();
    return items.filter(item => {
      // ค้นหาจากทุกฟิลด์ที่เป็น text หรือ textarea
      return selectedType.fields
        .filter(field => ['text', 'textarea'].includes(field.type))
        .some(field => 
          item[field.key]?.toString().toLowerCase().includes(searchLower)
        );
    });
  }

  $: {
    const filtered = filterItems(items, searchTerm);
    filteredItems = filtered;
  }

  // โหลดข้อมูลตามประเภทที่เลือก
  async function loadData() {
    loading = true;
    error = success = '';
    try {
      const { data } = await axiosInstance.get(selectedType.endpoint);
      items = data;
    } catch (e) {
      error = 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
      console.error(e);
    } finally {
      loading = false;
    }
  }

  // เพิ่มข้อมูลใหม่
  async function addItem() {
    loading = true;
    error = success = '';
    try {
      const response = await axiosInstance.post(selectedType.endpoint, form);
      success = 'เพิ่มข้อมูลสำเร็จ';
      showAddModal = false;
      await loadData();
      resetForm();
    } catch (e) {
      error = 'เกิดข้อผิดพลาดในการเพิ่มข้อมูล';
      console.error(e);
    } finally {
      loading = false;
    }
  }

  // แก้ไขข้อมูล
  async function editItem() {
    if (!currentItem) return;
    loading = true;
    error = success = '';
    try {
      if (!form) {
        throw new Error('Invalid form data');
      }
      const formData = form;
      await axiosInstance.put(`${selectedType.endpoint}/${currentItem.code}`, formData);
      success = 'แก้ไขข้อมูลสำเร็จ';
      showEditModal = false;
      await loadData();
      resetForm();
    } catch (e) {
      error = 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล';
      console.error(e);
    } finally {
      loading = false;
    }
  }

  // ลบข้อมูล
  async function deleteItem() {
    if (!currentItem) return;
    loading = true;
    error = success = '';
    try {
      await axiosInstance.delete(`${selectedType.endpoint}/${currentItem.code}`);
      await loadData(); // โหลดข้อมูลใหม่ก่อน
      success = 'ลบข้อมูลสำเร็จ';
      showDeleteModal = false; // ปิด modal หลังจากลบสำเร็จ
      currentItem = null;
    } catch (e) {
      error = 'เกิดข้อผิดพลาดในการลบข้อมูล';
      console.error(e);
    } finally {
      loading = false;
    }
  }

  // รีเซ็ตฟอร์มตามโครงสร้างของประเภทข้อมูลที่เลือก
  function resetForm() {
    form = selectedType.fields.reduce<FormData>((acc, field) => {
      acc[field.key] = field.type === 'boolean' ? true : '';
      return acc;
    }, {} as FormData);
    currentItem = null;
  }

  // เปิด modal แก้ไข
  function openEditModal(item: any) {
    currentItem = item;
    form = selectedType.fields.reduce<FormData>((acc, field) => {
      acc[field.key] = item[field.key];
      return acc;
    }, {} as FormData);
    showEditModal = true;
  }

  // เปิด modal ลบ
  function openDeleteModal(item: any) {
    currentItem = item;
    showDeleteModal = true;
  }

  // โหลดข้อมูลเมื่อเปิดหน้าหรือเปลี่ยนประเภทข้อมูล
  $: if (selectedType) {
    resetForm();
    loadData();
  }

  onMount(loadData);
</script>

<div class="min-h-screen bg-gradient-to-b from-[#1a1625] to-[#251f35] py-12">
  <div class="container mx-auto px-4">
    <div class="bg-[#2a2440] rounded-2xl shadow-2xl overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] p-8">
        <h2 class="text-3xl font-bold text-white mb-2">จัดการข้อมูลหลัก</h2>
        <p class="text-white/80">จัดการข้อมูลพื้นฐานของระบบ</p>
      </div>

      <!-- Content -->
      <div class="p-8">
        {#if error}
          <div class="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">{error}</div>
        {/if}
        {#if success}
          <div class="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">{success}</div>
        {/if}

        <!-- ส่วนค้นหาและตัวเลือกประเภทข้อมูล -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div class="flex-1 w-full md:w-auto relative">
            <div class="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="ค้นหาจากชื่อหรือคำอธิบาย..."
              bind:value={searchTerm}
              class="w-full bg-[#1a1625] text-white rounded-xl pl-12 pr-4 py-3 border border-gray-700 focus:border-[#ff6b2b] focus:ring-1 focus:ring-[#ff6b2b]"
            />
          </div>
          <div class="flex gap-4 w-full md:w-auto">
            <Select
              bind:value={selectedType}
              options={dataTypes.map(type => ({ value: type, label: type.name }))}
            />
            <button
              class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] px-6 py-3 text-white font-medium transition-all hover:scale-105 hover:shadow-lg hover:shadow-[#ff6b2b]/20"
              on:click={() => {
                resetForm();
                showAddModal = true;
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
              เพิ่มข้อมูล
            </button>
          </div>
        </div>

        <!-- ตารางแสดงข้อมูล -->
        {#if loading}
          <div class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-[#ff6b2b] border-t-transparent"></div>
          </div>
        {:else}
          <DataTable
            items={filteredItems}
            fields={selectedType.fields}
            {loading}
            {sortConfig}
            {showActions}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
          >
            <div slot="empty">
              {searchTerm ? 'ไม่พบข้อมูลที่ค้นหา' : 'ไม่มีข้อมูล'}
            </div>
          </DataTable>
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- Modal เพิ่มข้อมูล -->
<FormModal
  show={showAddModal || showEditModal}
  title={showAddModal ? 'เพิ่มข้อมูล' : 'แก้ไขข้อมูล'}
  {loading}
  fields={selectedType.fields}
  bind:formData={form}
  onSubmit={showAddModal ? addItem : editItem}
  onClose={() => {
    showAddModal = false;
    showEditModal = false;
    resetForm();
  }}
/>

<!-- Modal ยืนยันการลบ -->
<ConfirmModal
  show={showDeleteModal}
  message={`คุณต้องการลบ "${currentItem?.name}" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`}
  {loading}
  on:confirm={deleteItem}
  on:close={() => {
    showDeleteModal = false;
    currentItem = null;
  }}
/> 