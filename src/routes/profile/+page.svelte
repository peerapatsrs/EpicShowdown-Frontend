<script lang="ts">
import { onMount } from 'svelte';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import axiosInstance from '$lib/api/axios';
import { authApi } from '$lib/api/auth';
import { startRegistration } from '@simplewebauthn/browser';
import 'flatpickr/dist/flatpickr.css';
import { isAuthenticated } from '$lib/stores/auth';
import FormModal from '$lib/components/FormModal.svelte';
import type { FormField } from '$lib/types/form';
import locale from 'dayjs/locale/th';

// เพิ่ม plugin สำหรับจัดการ timezone
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(buddhistEra);
dayjs.tz.setDefault('Asia/Bangkok');

let profile = {
  id: 0,
  email: '',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  phoneNumber: '',
  address: ''
};
let loading = false;
let error = '';
let success = '';
let editMode = false;
let passwordMode = false;
let passkeyMode = false;
let showEditModal = false;

let form: { [key: string]: string | boolean } = {};
let passwordForm = {
  currentPassword: '',
  newPassword: ''
};

const editFields: FormField[] = [
  { key: 'firstName', label: 'ชื่อ', type: 'text', required: true },
  { key: 'lastName', label: 'นามสกุล', type: 'text', required: true },
  { key: 'dateOfBirth', label: 'วันเกิด', type: 'date', maxDate: dayjs().format('YYYY-MM-DD') },
  { key: 'phoneNumber', label: 'เบอร์โทรศัพท์', type: 'text' },
  { key: 'address', label: 'ที่อยู่', type: 'textarea' }
];

async function fetchProfile() {
  isAuthenticated;
  loading = true;
  error = success = '';
  try {
    const { data } = await axiosInstance.get('/Profile/me');
    profile = { ...data };
    // แปลงวันที่จาก UTC เป็นเวลาไทย
    form = Object.fromEntries(
      editFields.map(f => [
        f.key,
        f.key === 'dateOfBirth'
          ? (typeof data.dateOfBirth !== 'boolean' && typeof data.dateOfBirth === 'string' && !['true','false'].includes(data.dateOfBirth) && data.dateOfBirth.trim() !== '' ? dayjs(data.dateOfBirth).tz('Asia/Bangkok').format('YYYY-MM-DD') : '')
          : (data[f.key as keyof typeof data] !== undefined && data[f.key as keyof typeof data] !== null ? String(data[f.key as keyof typeof data]) : '')
      ])
    );
  } catch (e: any) {
    error = e.response?.data?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
  } finally {
    loading = false;
  }
}

async function updateProfile() {
  loading = true;
  error = success = '';
  try {
    // แปลงวันที่จากเวลาไทยเป็น UTC ก่อนส่งไปหลังบ้าน
    const { data } = await axiosInstance.put('/Profile/update', {
      firstName: form.firstName,
      lastName: form.lastName,
      dateOfBirth: form.dateOfBirth ? dayjs(form.dateOfBirth.toString()).tz('Asia/Bangkok').utc().format() : null,
      phoneNumber: form.phoneNumber,
      address: form.address
    });
    success = 'อัปเดตข้อมูลสำเร็จ';
    editMode = false;
    await fetchProfile();
  } catch (e: any) {
    error = e.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล';
  } finally {
    loading = false;
  }
}

async function changePassword() {
  loading = true;
  error = success = '';
  try {
    const { data } = await axiosInstance.put('/Profile/change-password', passwordForm);
    success = 'เปลี่ยนรหัสผ่านสำเร็จ';
    passwordMode = false;
    passwordForm = { currentPassword: '', newPassword: '' };
  } catch (e: any) {
    error = e.response?.data?.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน';
  } finally {
    loading = false;
  }
}

const addPasskey = async () => {
  loading = true;
  error = success = '';
  try {
    const resp = await authApi.getPasskeyRegisterOptions();
    let options: any = typeof resp.options === 'string' ? JSON.parse(resp.options) : resp.options;
    options.authenticatorSelection = {
      ...options.authenticatorSelection,
      residentKey: 'required',
      requireResidentKey: true
    };
    const regResp = await startRegistration({ optionsJSON: options });
    await authApi.verifyPasskeyRegistration({
      id: regResp.id,
      rawId: regResp.rawId,
      attestationObject: regResp.response.attestationObject,
      clientDataJSON: regResp.response.clientDataJSON,
      options: JSON.stringify(options)
    });
    success = 'Passkey ลงทะเบียนสำเร็จ';
  } catch (err: any) {
    console.error(err);
    error = err.response?.data?.message || err.message || 'ลงทะเบียน Passkey ผิดพลาด';
  } finally {
    loading = false;
  }
};

function openEditModal() {
  showEditModal = true;
  error = success = '';
  form = Object.fromEntries(
    editFields.map(f => [
      f.key,
      f.key === 'dateOfBirth'
        ? (typeof profile.dateOfBirth !== 'boolean' && typeof profile.dateOfBirth === 'string' && !['true','false'].includes(profile.dateOfBirth) && profile.dateOfBirth.trim() !== '' ? dayjs(profile.dateOfBirth).format('YYYY-MM-DD') : '')
        : (profile[f.key as keyof typeof profile] !== undefined && profile[f.key as keyof typeof profile] !== null ? String(profile[f.key as keyof typeof profile]) : '')
    ])
  );
}

function closeEditModal() {
  showEditModal = false;
}

onMount(fetchProfile);
</script>

<div class="min-h-screen bg-gradient-to-b from-[#1a1625] to-[#251f35] py-12">
  <div class="container mx-auto px-4 max-w-4xl">
    <div class="bg-[#2a2440] rounded-2xl shadow-2xl overflow-hidden">
      <!-- Header Section -->
      <div class="bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] p-8">
        <h2 class="text-3xl font-bold text-white mb-2">ข้อมูลส่วนตัว</h2>
        <p class="text-white/80">จัดการข้อมูลส่วนตัวของคุณ</p>
      </div>

      <!-- Content Section -->
      <div class="p-8">
        {#if loading}
          <div class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-4 border-[#ff6b2b] border-t-transparent"></div>
          </div>
        {:else}
          {#if error}
            <div class="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">{error}</div>
          {/if}
          {#if success}
            <div class="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">{success}</div>
          {/if}

          {#if !editMode && !passwordMode && !passkeyMode}
            <div class="grid md:grid-cols-2 gap-8 mb-8">
              <div class="space-y-6">
                <div class="bg-[#332d4d] rounded-xl p-6">
                  <h3 class="text-[#ff6b2b] text-lg font-semibold mb-4">ข้อมูลพื้นฐาน</h3>
                  <div class="space-y-4">
                    <div>
                      <p class="text-gray-400 text-sm mb-1">อีเมล</p>
                      <p class="text-white font-medium">{profile.email}</p>
                    </div>
                    <div>
                      <p class="text-gray-400 text-sm mb-1">ชื่อ-นามสกุล</p>
                      <p class="text-white font-medium">{profile.firstName} {profile.lastName}</p>
                    </div>
                    <div>
                      <p class="text-gray-400 text-sm mb-1">วันเกิด</p>
                      <p class="text-white font-medium">
                        {#if profile.dateOfBirth}
                          {dayjs(profile.dateOfBirth).tz('Asia/Bangkok').locale('th').format('D MMMM BBBB')}
                        {:else}
                          -
                        {/if}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="space-y-6">
                <div class="bg-[#332d4d] rounded-xl p-6">
                  <h3 class="text-[#ff6b2b] text-lg font-semibold mb-4">ข้อมูลติดต่อ</h3>
                  <div class="space-y-4">
                    <div>
                      <p class="text-gray-400 text-sm mb-1">เบอร์โทรศัพท์</p>
                      <p class="text-white font-medium">{profile.phoneNumber || '-'}</p>
                    </div>
                    <div>
                      <p class="text-gray-400 text-sm mb-1">ที่อยู่</p>
                      <p class="text-white font-medium">{profile.address || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-wrap gap-4">
              <button
                class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] px-6 py-3 text-white font-medium transition-transform hover:scale-105"
                on:click={openEditModal}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                แก้ไขข้อมูล
              </button>
              <button
                class="flex items-center gap-2 rounded-xl border-2 border-[#ff6b2b] px-6 py-3 text-[#ff6b2b] font-medium transition-all hover:bg-gradient-to-r hover:from-[#ff6b2b] hover:to-[#ee0979] hover:text-white"
                on:click={() => { passwordMode = true; error = success = ''; }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                </svg>
                เปลี่ยนรหัสผ่าน
              </button>
              <button
                class="flex items-center gap-2 rounded-xl border-2 border-[#ff6b2b] px-6 py-3 text-[#ff6b2b] font-medium transition-all hover:bg-gradient-to-r hover:from-[#ff6b2b] hover:to-[#ee0979] hover:text-white"
                on:click={() => { passkeyMode = true; error = success = ''; }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clip-rule="evenodd" />
                </svg>
                จัดการ Passkey
              </button>
            </div>
          {:else if editMode}
            <!-- ลบฟอร์มเดิมออก -->
          {:else if passwordMode}
            <form class="space-y-6" on:submit|preventDefault={changePassword}>
              <div>
                <label for="currentPassword" class="block text-gray-400 mb-2 font-medium">รหัสผ่านปัจจุบัน</label>
                <input
                  id="currentPassword"
                  type="password"
                  class="w-full rounded-xl bg-[#1a1625] px-4 py-3 text-white border border-gray-700 focus:border-[#ff6b2b] focus:ring-1 focus:ring-[#ff6b2b] transition-colors"
                  bind:value={passwordForm.currentPassword}
                  required
                />
              </div>

              <div>
                <label for="newPassword" class="block text-gray-400 mb-2 font-medium">รหัสผ่านใหม่</label>
                <input
                  id="newPassword"
                  type="password"
                  class="w-full rounded-xl bg-[#1a1625] px-4 py-3 text-white border border-gray-700 focus:border-[#ff6b2b] focus:ring-1 focus:ring-[#ff6b2b] transition-colors"
                  bind:value={passwordForm.newPassword}
                  required
                />
              </div>

              <div class="flex flex-wrap gap-4 pt-4">
                <button
                  type="submit"
                  class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] px-6 py-3 text-white font-medium transition-transform hover:scale-105"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                  เปลี่ยนรหัสผ่าน
                </button>
                <button
                  type="button"
                  class="flex items-center gap-2 rounded-xl border-2 border-gray-500 px-6 py-3 text-gray-300 font-medium hover:bg-[#1a1625] transition-colors"
                  on:click={() => {
                    passwordMode = false;
                    error = success = '';
                    passwordForm = { currentPassword: '', newPassword: '' };
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                  ยกเลิก
                </button>
              </div>
            </form>
          {:else if passkeyMode}
            <div class="space-y-6">
              <div class="bg-[#332d4d] rounded-xl p-6">
                <h3 class="text-[#ff6b2b] text-lg font-semibold mb-4">จัดการ Passkey</h3>
                <p class="text-gray-400 mb-6">Passkey ช่วยให้คุณเข้าสู่ระบบได้อย่างปลอดภัยโดยไม่ต้องใช้รหัสผ่าน</p>
                
                <button
                  class="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] px-6 py-3 text-white font-medium transition-transform hover:scale-105"
                  on:click={addPasskey}
                  disabled={loading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
                  </svg>
                  เพิ่ม Passkey
                </button>
              </div>

              <div class="flex justify-end">
                <button
                  type="button"
                  class="flex items-center gap-2 rounded-xl border-2 border-gray-500 px-6 py-3 text-gray-300 font-medium hover:bg-[#1a1625] transition-colors"
                  on:click={() => {
                    passkeyMode = false;
                    error = success = '';
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                  ย้อนกลับ
                </button>
              </div>
            </div>
          {/if}
        {/if}
      </div>
    </div>
  </div>
</div>

<FormModal
  show={showEditModal}
  title="แก้ไขข้อมูลส่วนตัว"
  {loading}
  fields={editFields}
  bind:formData={form}
  onSubmit={updateProfile}
  onClose={closeEditModal}
/>

<style>
:global(.flatpickr-calendar) {
  background: #2a2440 !important;
  border: 1px solid #3d3654 !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3) !important;
}

:global(.flatpickr-months) {
  background: linear-gradient(to right, #ff6b2b, #ee0979) !important;
  border-radius: 0.5rem 0.5rem 0 0 !important;
  padding: 0.5rem !important;
}

:global(.flatpickr-month) {
  color: white !important;
}

:global(.flatpickr-weekday) {
  color: #ff6b2b !important;
  font-weight: 600 !important;
}

:global(.flatpickr-day) {
  color: white !important;
  border-radius: 0.5rem !important;
}

:global(.flatpickr-day:hover) {
  background: #3d3654 !important;
}

:global(.flatpickr-day.selected) {
  background: linear-gradient(to right, #ff6b2b, #ee0979) !important;
  border: none !important;
}

:global(.flatpickr-day.today) {
  border: 2px solid #ff6b2b !important;
}

:global(.flatpickr-current-month) {
  padding: 0 !important;
}

:global(.flatpickr-monthDropdown-months) {
  background: transparent !important;
  color: white !important;
}

:global(.flatpickr-monthDropdown-month) {
  background: #2a2440 !important;
  color: white !important;
}

:global(.flatpickr-monthDropdown-month:hover) {
  background: #3d3654 !important;
}

:global(.numInputWrapper:hover) {
  background: transparent !important;
}

:global(.numInput),
:global(.cur-year) {
  color: white !important;
}

:global(.flatpickr-day.disabled) {
  color: #666 !important;
}

/* เพิ่ม styles สำหรับ datepicker */
:global(.datepicker-overlay) {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 40;
}
</style> 