<script lang="ts">
  import { auth } from "$lib/stores/auth";
  import { authApi } from "$lib/api/auth";
  import { startRegistration } from "@simplewebauthn/browser";
  import type {
    PublicKeyCredentialCreationOptionsJSON,
    RegistrationResponseJSON,
  } from "@simplewebauthn/types";

  let error = "";
  let success = "";
  let loading = false;

  const handleLogout = async () => {
    try {
      auth.clearAuth();
      window.location.href = "/login";
    } catch (err: any) {
      console.error("ไม่สามารถออกจากระบบได้:", err);
    }
  };

  const handleAddPasskey = async () => {
    try {
      loading = true;
      error = "";
      success = "";

      // Get registration options
      const optionsResponse = await authApi.getPasskeyRegisterOptions();
      console.log("Raw options response:", optionsResponse);

      // Parse nested options structure and ensure correct format
      let parsedOptions: PublicKeyCredentialCreationOptionsJSON;
      if (typeof optionsResponse === "string") {
        parsedOptions = JSON.parse(optionsResponse);
      } else if (
        optionsResponse.options &&
        typeof optionsResponse.options === "string"
      ) {
        const optionsString = optionsResponse.options;
        parsedOptions = JSON.parse(optionsString);
      } else {
        parsedOptions = optionsResponse.options || optionsResponse;
      }

      // Store the original options for verification
      const originalOptions =
        optionsResponse.options || JSON.stringify(parsedOptions);
      console.log("Original options:", originalOptions);

      console.log("Registration options:", {
        rp: parsedOptions.rp,
        user: parsedOptions.user,
        challenge: parsedOptions.challenge,
        pubKeyCredParams: parsedOptions.pubKeyCredParams,
      });

      // Start the registration process with the new API format
      const regResponse = await startRegistration({
        optionsJSON: {
          ...parsedOptions,
          authenticatorSelection: {
            ...parsedOptions.authenticatorSelection,
            residentKey: "required",
            requireResidentKey: true,
          },
          challenge: parsedOptions.challenge,
          user: {
            ...parsedOptions.user,
            id: parsedOptions.user.id,
          },
        },
      });
      console.log("Registration response:", regResponse);

      // Prepare verification data according to backend model
      const verificationData = {
        id: regResponse.id,
        rawId: regResponse.rawId,
        attestationObject: regResponse.response.attestationObject,
        clientDataJSON: regResponse.response.clientDataJSON,
        options: originalOptions,
      };

      console.log("Verification request:", {
        url: "/Auth/passkey/register/verify",
        data: {
          ...verificationData,
          attestationObject:
            verificationData.attestationObject.substring(0, 50) + "...",
          clientDataJSON:
            verificationData.clientDataJSON.substring(0, 50) + "...",
        },
      });

      // Verify the registration
      const verificationResult =
        await authApi.verifyPasskeyRegistration(verificationData);
      console.log("Verification result:", verificationResult);

      success = "เพิ่ม Passkey สำเร็จ";
    } catch (err: any) {
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        data: err.response?.data,
        url: err.response?.config?.url,
        method: err.response?.config?.method,
      });
      error =
        err.response?.data?.message ||
        err.message ||
        "เกิดข้อผิดพลาดในการเพิ่ม Passkey";
    } finally {
      loading = false;
    }
  };
</script>

<div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-7xl mx-auto">
    <div class="text-center">
      <h1 class="text-3xl font-bold text-gray-900 sm:text-4xl">
        ยินดีต้อนรับสู่ Epic Showdown
      </h1>
      <p class="mt-3 text-xl text-gray-500 sm:mt-4">
        แพลตฟอร์มการแข่งขันที่จะทำให้คุณสนุกและตื่นเต้น
      </p>
    </div>

    {#if $auth.isAuthenticated}
      <div class="mt-10">
        <div class="bg-white shadow sm:rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-medium leading-6 text-gray-900">
                จัดการ Passkey
              </h3>
              <button
                type="button"
                on:click={handleLogout}
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                ออกจากระบบ
              </button>
            </div>
            <div class="mt-2 max-w-xl text-sm text-gray-500">
              <p>เพิ่ม Passkey เพื่อเข้าสู่ระบบได้ง่ายขึ้นในครั้งต่อไป</p>
            </div>

            {#if error}
              <div class="mt-4 rounded-md bg-red-50 p-4">
                <div class="text-sm text-red-700">{error}</div>
              </div>
            {/if}

            {#if success}
              <div class="mt-4 rounded-md bg-green-50 p-4">
                <div class="text-sm text-green-700">{success}</div>
              </div>
            {/if}

            <div class="mt-5">
              <button
                type="button"
                on:click={handleAddPasskey}
                disabled={loading}
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {#if loading}
                  กำลังดำเนินการ...
                {:else}
                  เพิ่ม Passkey
                {/if}
              </button>
            </div>
          </div>
        </div>
      </div>
    {:else}
      <div class="mt-10 flex justify-center">
        <a
          href="/login"
          class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          เข้าสู่ระบบ
        </a>
      </div>
    {/if}
  </div>
</div>
