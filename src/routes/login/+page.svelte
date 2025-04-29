<script lang="ts">
  import { auth } from "$lib/stores/auth";
  import { authApi } from "$lib/api/auth";
  import { goto } from "$app/navigation";
  import { startAuthentication } from "@simplewebauthn/browser";

  let email = "";
  let password = "";
  let error = "";
  let loading = false;

  async function handleLogin() {
    loading = true; error = "";
    try {
      const { accessToken, refreshToken } = await authApi.login({ email, password });
      auth.setAuth(accessToken, refreshToken);
      goto("/");
    } catch (e: any) {
      error = e.response?.data?.message || "เข้าสู่ระบบไม่สำเร็จ";
      auth.clearAuth();
    } finally {
      loading = false;
    }
  }

  async function handlePasskeyLogin() {
    loading = true; error = ""; auth.clearAuth();
    try {
      let opts = (await authApi.getPasskeyAuthenticationOptions()).options;
      if (typeof opts === "string") opts = JSON.parse(opts);
      const authResp = await startAuthentication({ optionsJSON: opts });
      const verifyReq = {
        id: authResp.id,
        rawId: authResp.rawId,
        authenticatorData: authResp.response.authenticatorData,
        clientDataJSON: authResp.response.clientDataJSON,
        signature: authResp.response.signature,
        userHandle: authResp.response.userHandle,
        options: JSON.stringify(opts),
      };
      const { accessToken, refreshToken } = await authApi.verifyPasskeyAuthentication(verifyReq);
      auth.setAuth(accessToken, refreshToken);
      goto("/");
    } catch (e: any) {
      error = e.message || "Passkey login ผิดพลาด";
    } finally {
      loading = false;
    }
  }
</script>

<div class="flex min-h-screen items-center justify-center bg-[#1a1625] px-4">
  <div class="w-full max-w-md overflow-hidden rounded-2xl bg-[#251f35] p-8 shadow-2xl">
    <div class="text-center">
      <h1 class="mb-2 text-3xl font-bold text-white">เข้าสู่ระบบ</h1>
      <p class="text-gray-400">เข้าสู่ระบบเพื่อเริ่มต้นการสนับสนุนกิจกรรม</p>
    </div>

    {#if error}
      <div class="mt-4 rounded-lg bg-red-900/50 p-3 text-red-200">
        {error}
      </div>
    {/if}

    <form on:submit|preventDefault={handleLogin} class="mt-8 space-y-6">
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
      </div>

      <div class="space-y-4">
        <button
          type="submit"
          class="w-full rounded-lg bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] px-8 py-4 font-medium text-white transition hover:from-[#ff8f59] hover:to-[#ff2a90] disabled:opacity-50"
          disabled={loading}
        >
          {#if loading}กำลังเข้าสู่ระบบ...{:else}เข้าสู่ระบบด้วยรหัสผ่าน{/if}
        </button>
        <button
          type="button"
          on:click={handlePasskeyLogin}
          class="w-full rounded-lg bg-[#1a1625] px-8 py-4 font-medium text-white ring-1 ring-[#ff6b2b] transition hover:bg-[#ff6b2b] disabled:opacity-50"
          disabled={loading}
        >
          {#if loading}กำลังเข้าสู่ระบบ...{:else}เข้าสู่ระบบด้วย Passkey{/if}
        </button>
      </div>
    </form>

    <p class="mt-6 text-center text-sm text-gray-400">
      ยังไม่มีบัญชี?
      <a
        href="/register"
        class="font-medium text-[#ff6b2b] transition hover:text-[#ff8f59] hover:underline"
        >ลงทะเบียน</a
      >
    </p>
  </div>
</div>