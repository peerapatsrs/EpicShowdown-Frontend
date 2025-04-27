<script lang="ts">
  import { auth } from "$lib/stores/auth";
  import { authApi } from "$lib/api/auth";
  import { goto } from "$app/navigation";
  import { startAuthentication } from "@simplewebauthn/browser";
  import type { PassKeyAuthenticationRequest } from "$lib/types/auth";

  let email = "";
  let password = "";
  let error = "";
  let loading = false;

  const handleLogin = async () => {
    loading = true;
    error = "";
    try {
      const { accessToken, refreshToken } = await authApi.login({
        email,
        password,
      });
      auth.setAuth(accessToken, refreshToken);
      goto("/");
    } catch (err: any) {
      error = err.response?.data?.message || "เข้าสู่ระบบไม่สำเร็จ";
      auth.clearAuth();
    } finally {
      loading = false;
    }
  };

  const handlePasskeyLogin = async () => {
    loading = true;
    error = "";
    auth.clearAuth();
    try {
      // 1. ดึง options จากเซิร์ฟเวอร์
      let options = await authApi
        .getPasskeyAuthenticationOptions()
        .then((res) => res.options);
      if (typeof options === "string") {
        options = JSON.parse(options);
      }
      // 3. เรียกสแกนแค่ครั้งเดียว
      const authResp = await startAuthentication({ optionsJSON: options });
      // 4. เตรียมข้อมูล verify และส่งไป backend
      const verifyReq: PassKeyAuthenticationRequest = {
        id: authResp.id,
        rawId: authResp.rawId,
        authenticatorData: authResp.response.authenticatorData,
        clientDataJSON: authResp.response.clientDataJSON,
        signature: authResp.response.signature,
        userHandle: authResp.response.userHandle,
        options: JSON.stringify(options),
      };
      const { accessToken, refreshToken } =
        await authApi.verifyPasskeyAuthentication(verifyReq);
      auth.setAuth(accessToken, refreshToken);
      goto("/");
    } catch (err: any) {
      error = err.message || "Passkey login ผิดพลาด";
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
        เข้าสู่ระบบ
      </h2>
    </div>
    <form class="mt-8 space-y-6" on:submit|preventDefault={handleLogin}>
      {#if error}
        <div class="rounded-md bg-red-50 p-4">
          <div class="text-sm text-red-700">{error}</div>
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
            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="รหัสผ่าน"
          />
        </div>
      </div>

      <div class="space-y-3">
        <button
          type="submit"
          disabled={loading}
          class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {#if loading}
            กำลังเข้าสู่ระบบ...
          {:else}
            เข้าสู่ระบบด้วยรหัสผ่าน
          {/if}
        </button>

        <button
          type="button"
          on:click={handlePasskeyLogin}
          disabled={loading}
          class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          {#if loading}
            กำลังเข้าสู่ระบบ...
          {:else}
            เข้าสู่ระบบด้วย Passkey
          {/if}
        </button>
      </div>

      <div class="text-sm text-center">
        <a
          href="/register"
          class="font-medium text-indigo-600 hover:text-indigo-500"
        >
          ยังไม่มีบัญชี? ลงทะเบียน
        </a>
      </div>
    </form>
  </div>
</div>
