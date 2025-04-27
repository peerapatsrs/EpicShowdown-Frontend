<script lang="ts">
  import { auth } from "$lib/stores/auth";
  import { authApi } from "$lib/api/auth";
  import { goto } from "$app/navigation";
  import { startAuthentication } from "@simplewebauthn/browser";
  import axios from "axios";

  let email = "";
  let password = "";
  let error = "";
  let loading = false;

  const handleLogin = async () => {
    try {
      loading = true;
      error = "";

      const response = await authApi.login({
        email,
        password,
      });
      const { accessToken, refreshToken } = response;
      auth.setAuth(accessToken, refreshToken);
      goto("/");
    } catch (err: any) {
      error = err.response?.data?.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
      auth.clearAuth();
    } finally {
      loading = false;
    }
  };

  const handlePasskeyLogin = async () => {
    try {
      loading = true;
      error = "";

      // Clear any existing auth state
      auth.clearAuth();

      // Generate a random challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      // Get credential from browser
      const credential = await navigator.credentials.get({
        mediation: "optional",
        publicKey: {
          challenge,
          rpId: window.location.hostname,
          userVerification: "preferred",
        },
      });

      if (!credential || !credential.id) {
        throw new Error("ไม่พบ Passkey ในอุปกรณ์นี้");
      }

      // Get authentication options with credential ID
      const response = await authApi.getPasskeyAuthenticationOptions(
        credential.id
      );
      if (!response) {
        throw new Error("ไม่สามารถรับข้อมูล Passkey ได้");
      }

      console.log("Raw response:", response);

      // Store original options for verification
      const originalOptions = response.options || JSON.stringify(response);

      // Parse the options from the response
      let parsedOptions;
      if (typeof response.options === "string") {
        parsedOptions = JSON.parse(response.options);
      } else if (typeof response === "string") {
        parsedOptions = JSON.parse(response);
      } else {
        parsedOptions = response.options || response;
      }

      console.log("Parsed authentication options:", parsedOptions);

      // Start the authentication process with correct format
      const authResponse = await startAuthentication({
        optionsJSON: {
          ...parsedOptions,
          challenge: parsedOptions.challenge,
          allowCredentials: parsedOptions.allowCredentials || [],
          rpId: parsedOptions.rpId,
          timeout: parsedOptions.timeout,
          userVerification: parsedOptions.userVerification,
        },
      });

      console.log("Authentication response:", authResponse);

      // Prepare verification data according to backend model
      const verificationData = {
        id: authResponse.id,
        rawId: authResponse.rawId,
        authenticatorData: authResponse.response.authenticatorData,
        clientDataJSON: authResponse.response.clientDataJSON,
        signature: authResponse.response.signature,
        userHandle: authResponse.response.userHandle,
        response: JSON.stringify(authResponse.response),
        options: originalOptions,
      };

      console.log("Verification request:", {
        ...verificationData,
        authenticatorData:
          verificationData.authenticatorData.substring(0, 50) + "...",
        clientDataJSON:
          verificationData.clientDataJSON.substring(0, 50) + "...",
        signature: verificationData.signature.substring(0, 50) + "...",
      });

      // Verify the authentication
      const verifyResponse =
        await authApi.verifyPasskeyAuthentication(verificationData);
      const { accessToken, refreshToken } = verifyResponse;
      auth.setAuth(accessToken, refreshToken);
      goto("/");
    } catch (err: any) {
      console.error("Passkey login error:", err);
      error =
        err.response?.data?.message ||
        "เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Passkey";
      auth.clearAuth();
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
