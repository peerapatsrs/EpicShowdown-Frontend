<script lang="ts">
  import { auth } from "$lib/stores/auth";
  import { authApi } from "$lib/api/auth";
  import { goto } from "$app/navigation";

  let email = "";
  let password = "";
  let confirmPassword = "";
  let error = "";
  let loading = false;

  async function handleRegister() {
    if (password !== confirmPassword) {
      error = "รหัสผ่านไม่ตรงกัน";
      return;
    }
    loading = true;
    error = "";
    try {
      const { accessToken, refreshToken } = await authApi.register({ email, password });
      auth.setAuth(accessToken, refreshToken);
      goto("/");
    } catch (e: any) {
      error = e.response?.data?.message || "ลงทะเบียนไม่สำเร็จ";
      auth.clearAuth();
    } finally {
      loading = false;
    }
  }
</script>

<div class="flex min-h-screen items-center justify-center bg-[#1a1625] px-4">
  <div class="w-full max-w-md overflow-hidden rounded-2xl bg-[#251f35] p-8 shadow-2xl">
    <div class="text-center">
      <h1 class="mb-2 text-3xl font-bold text-white">สร้างบัญชีใหม่</h1>
      <p class="text-gray-400">สร้างบัญชีเพื่อเริ่มต้นการสนับสนุนกิจกรรมที่คุณชื่นชอบ</p>
    </div>

    {#if error}
      <div class="mt-4 rounded-lg bg-red-900/50 p-3 text-red-200">
        {error}
      </div>
    {/if}

    <form on:submit|preventDefault={handleRegister} class="mt-8 space-y-6">
      <div class="space-y-4">
        <div>
          <input
            type="email"
            bind:value={email}
            placeholder="อีเมล"
            class="w-full rounded-lg bg-[#1a1625] px-6 py-4 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#ff6b2b]"
            required
          />
        </div>
        <div>
          <input
            type="password"
            bind:value={password}
            placeholder="รหัสผ่าน"
            class="w-full rounded-lg bg-[#1a1625] px-6 py-4 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#ff6b2b]"
            required
          />
        </div>
        <div>
          <input
            type="password"
            bind:value={confirmPassword}
            placeholder="ยืนยันรหัสผ่าน"
            class="w-full rounded-lg bg-[#1a1625] px-6 py-4 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#ff6b2b]"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        class="w-full rounded-lg bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] px-8 py-4 font-medium text-white transition hover:from-[#ff8f59] hover:to-[#ff2a90] disabled:opacity-50"
        disabled={loading}
      >
        {#if loading}กำลังลงทะเบียน...{:else}ลงทะเบียน{/if}
      </button>
    </form>

    <p class="mt-6 text-center text-sm text-gray-400">
      มีบัญชีอยู่แล้ว?
      <a
        href="/login"
        class="font-medium text-[#ff6b2b] transition hover:text-[#ff8f59] hover:underline"
        >เข้าสู่ระบบ</a
      >
    </p>
  </div>
</div>