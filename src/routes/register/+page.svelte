<script lang="ts">
  import { auth } from "$lib/stores/auth";
  import { authApi } from "$lib/api/auth";
  import { goto } from "$app/navigation";
  import { startRegistration } from "@simplewebauthn/browser";
  import axios from "axios";

  let email = "";
  let password = "";
  let confirmPassword = "";
  let error = "";
  let loading = false;
  let passkeyError = "";

  const setupPasskey = async (token: string) => {
    try {
      // Ensure we have a valid token before proceeding
      if (!token) {
        throw new Error("No authentication token available");
      }

      const options = await authApi.getPasskeyRegisterOptions();
      if (!options) {
        throw new Error("Failed to get passkey registration options");
      }

      const regResponse = await startRegistration(options);
      await authApi.verifyPasskeyRegistration(regResponse);

      return true;
    } catch (err: any) {
      console.error("Passkey setup error:", err);
      passkeyError =
        err.response?.data?.message || "ไม่สามารถตั้งค่า Passkey ได้";
      return false;
    }
  };

  const handleRegister = async () => {
    try {
      if (password !== confirmPassword) {
        error = "รหัสผ่านไม่ตรงกัน";
        return;
      }

      loading = true;
      error = "";
      passkeyError = "";

      // Step 1: Register user
      const response = await axios.post("/auth/register", { email, password });
      const { accessToken, refreshToken } = response.data;

      // Step 2: Set auth state with new tokens
      auth.setAuth(accessToken, refreshToken);

      // Step 3: Setup passkey
      await setupPasskey(accessToken);

      // Redirect regardless of passkey setup result
      goto("/");
    } catch (err: any) {
      error = err.response?.data?.message || "เกิดข้อผิดพลาดในการลงทะเบียน";
      auth.clearAuth(); // Clear any partial auth state on error
    } finally {
      loading = false;
    }
  };
</script>

<div
  class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
>
  <div class="max-w-md w-full space-y-8">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        ลงทะเบียน
      </h2>
    </div>
    <form class="mt-8 space-y-6" on:submit|preventDefault={handleRegister}>
      {#if error}
        <div class="rounded-md bg-red-50 p-4">
          <div class="text-sm text-red-700">{error}</div>
        </div>
      {/if}
      {#if passkeyError}
        <div class="rounded-md bg-yellow-50 p-4">
          <div class="text-sm text-yellow-700">
            {passkeyError}
            <br />
            <span class="text-xs"
              >คุณสามารถตั้งค่า Passkey ได้ภายหลังในหน้าโปรไฟล์</span
            >
          </div>
        </div>
      {/if}
      <div class="rounded-md shadow-sm -space-y-px">
        <div>
          <label for="email" class="sr-only">อีเมล</label>
          <input
            bind:value={email}
            id="email"
            name="email"
            type="email"
            required
            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="อีเมล"
          />
        </div>
        <div>
          <label for="password" class="sr-only">รหัสผ่าน</label>
          <input
            bind:value={password}
            id="password"
            name="password"
            type="password"
            required
            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="รหัสผ่าน"
          />
        </div>
        <div>
          <label for="confirmPassword" class="sr-only">ยืนยันรหัสผ่าน</label>
          <input
            bind:value={confirmPassword}
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="ยืนยันรหัสผ่าน"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {#if loading}
            กำลังลงทะเบียน...
          {:else}
            ลงทะเบียน
          {/if}
        </button>
      </div>

      <div class="text-sm text-center">
        <a
          href="/login"
          class="font-medium text-indigo-600 hover:text-indigo-500"
        >
          มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
        </a>
      </div>
    </form>
  </div>
</div>
