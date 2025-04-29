<script lang="ts">
  import { onMount } from 'svelte';
  import { authApi } from '$lib/api/auth';
  import { startRegistration } from '@simplewebauthn/browser';

  let passkeys: any[] = [];
  let loading = false;
  let error = '';
  let success = '';

  const fetchPasskeys = async () => {
    loading = true;
    error = '';
    try {
      const response = await authApi.getPasskeys();
      passkeys = response.data;
    } catch (err: any) {
      error = err.response?.data?.message || 'ไม่สามารถดึงข้อมูล Passkey ได้';
    } finally {
      loading = false;
    }
  };

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
      await fetchPasskeys();
    } catch (err: any) {
      console.error(err);
      error = err.response?.data?.message || err.message || 'ลงทะเบียน Passkey ผิดพลาด';
    } finally {
      loading = false;
    }
  };

  const deletePasskey = async (passKeyId: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบ Passkey นี้?')) return;
    
    loading = true;
    error = success = '';
    try {
      await authApi.deletePasskey(passKeyId);
      success = 'ลบ Passkey สำเร็จ';
      await fetchPasskeys();
    } catch (err: any) {
      error = err.response?.data?.message || 'ไม่สามารถลบ Passkey ได้';
    } finally {
      loading = false;
    }
  };

  onMount(fetchPasskeys);
</script>

<div class="container mx-auto px-4 py-8">
  <div class="max-w-4xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white mb-2">จัดการ Passkey</h1>
      <p class="text-gray-400">Passkey ช่วยให้คุณเข้าสู่ระบบได้อย่างปลอดภัยโดยไม่ต้องใช้รหัสผ่าน</p>
    </div>

    {#if error}
      <div class="mb-6 rounded-lg bg-red-900/50 p-4 text-red-200">
        {error}
      </div>
    {/if}

    {#if success}
      <div class="mb-6 rounded-lg bg-green-900/50 p-4 text-green-200">
        {success}
      </div>
    {/if}

    <div class="bg-[#251f35] rounded-xl p-6 mb-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-semibold text-white mb-2">เพิ่ม Passkey ใหม่</h2>
          <p class="text-gray-400">เพิ่ม Passkey เพื่อเพิ่มความสะดวกในการเข้าสู่ระบบ</p>
        </div>
        <button
          class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] px-6 py-3 text-white font-medium transition-transform hover:scale-105 disabled:opacity-50"
          on:click={addPasskey}
          disabled={loading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
          </svg>
          เพิ่ม Passkey
        </button>
      </div>
    </div>

    <div class="bg-[#251f35] rounded-xl p-6">
      <h2 class="text-xl font-semibold text-white mb-6">Passkey ที่ลงทะเบียนไว้</h2>
      
      {#if loading && !passkeys.length}
        <div class="text-center py-8">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-[#ff6b2b] border-t-transparent mx-auto mb-4"></div>
          <p class="text-gray-400">กำลังโหลดข้อมูล...</p>
        </div>
      {:else if !passkeys.length}
        <div class="text-center py-8 text-gray-400">
          <p>ยังไม่มี Passkey ที่ลงทะเบียนไว้</p>
        </div>
      {:else}
        <div class="space-y-4">
          {#each passkeys as passkey}
            <div class="flex items-center justify-between p-4 bg-[#1a1625] rounded-lg">
              <div>
                <p class="text-white font-medium">{passkey.name || 'Passkey'}</p>
                <p class="text-sm text-gray-400">ลงทะเบียนเมื่อ {new Date(passkey.createdAt).toLocaleDateString('th-TH')}</p>
              </div>
              <button
                class="text-red-400 hover:text-red-300 transition-colors p-2"
                on:click={() => deletePasskey(passkey.id)}
                disabled={loading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div> 