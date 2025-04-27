<script lang="ts">
  import { auth } from "$lib/stores/auth";
  import { authApi } from "$lib/api/auth";
  import { goto } from "$app/navigation";
  import axios from "axios";
  import { fade, fly } from "svelte/transition";

  let email = "";
  let password = "";
  let confirmPassword = "";
  let error = "";
  let loading = false;

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      error = "รหัสผ่านไม่ตรงกัน";
      return;
    }
    loading = true;
    error = "";
    try {
      const { data } = await axios.post("/auth/register", { email, password });
      auth.setAuth(data.accessToken, data.refreshToken);
      goto("/");
    } catch (err: any) {
      error = err.response?.data?.message || "เกิดข้อผิดพลาดในการลงทะเบียน";
      auth.clearAuth();
    } finally {
      loading = false;
    }
  };
</script>

<div
  class="min-h-screen flex items-center justify-center bg-gradient animated-bg overflow-hidden"
>
  <!-- Animated background elements -->
  <div class="absolute inset-0 overflow-hidden">
    <div class="galaxy">
      {#each Array(50) as _, i}
        <div class="star" style="--i:{i}"></div>
      {/each}
    </div>
  </div>

  <!-- Glass card container -->
  <div
    class="relative z-10 w-full max-w-lg p-8 mx-4"
    transition:fly={{ y: 50, duration: 500 }}
  >
    <div
      class="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8"
    >
      <!-- Logo/Brand section -->
      <div class="text-center mb-8">
        <h1
          class="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
        >
          Epic Showdown
        </h1>
        <p class="mt-2 text-gray-300">สร้างบัญชีใหม่เพื่อเริ่มการผจญภัย</p>
      </div>

      {#if error}
        <div
          class="mb-6 rounded-xl bg-red-500/20 border border-red-500/50 p-4"
          transition:fade
        >
          <p class="text-red-200 text-sm">{error}</p>
        </div>
      {/if}

      <form on:submit|preventDefault={handleRegister} class="space-y-6">
        <div class="space-y-2">
          <label for="email" class="text-sm font-medium text-gray-300"
            >อีเมล</label
          >
          <input
            id="email"
            bind:value={email}
            type="email"
            required
            class="w-full px-4 py-3 rounded-xl border-2 border-transparent bg-white/10 placeholder-gray-400 text-white focus:border-purple-500 focus:bg-white/20 transition-all duration-300"
            placeholder="your@email.com"
          />
        </div>

        <div class="space-y-2">
          <label for="password" class="text-sm font-medium text-gray-300"
            >รหัสผ่าน</label
          >
          <input
            id="password"
            bind:value={password}
            type="password"
            required
            class="w-full px-4 py-3 rounded-xl border-2 border-transparent bg-white/10 placeholder-gray-400 text-white focus:border-purple-500 focus:bg-white/20 transition-all duration-300"
            placeholder="••••••••"
          />
        </div>

        <div class="space-y-2">
          <label
            for="confirm-password"
            class="text-sm font-medium text-gray-300">ยืนยันรหัสผ่าน</label
          >
          <input
            id="confirm-password"
            bind:value={confirmPassword}
            type="password"
            required
            class="w-full px-4 py-3 rounded-xl border-2 border-transparent bg-white/10 placeholder-gray-400 text-white focus:border-purple-500 focus:bg-white/20 transition-all duration-300"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          class="w-full py-3 px-6 rounded-xl text-white font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 focus:outline-none focus:ring-4 focus:ring-purple-500/50 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
        >
          {#if loading}
            <div class="flex items-center justify-center">
              <div
                class="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"
              ></div>
              กำลังลงทะเบียน...
            </div>
          {:else}
            ลงทะเบียน
          {/if}
        </button>
      </form>

      <p class="mt-8 text-center text-gray-300">
        มีบัญชีอยู่แล้ว?
        <a
          href="/login"
          class="font-medium text-purple-400 hover:text-purple-300 transition-colors duration-200"
          >เข้าสู่ระบบ</a
        >
      </p>
    </div>
  </div>
</div>

<style>
  .bg-gradient {
    background: radial-gradient(
      circle at top left,
      #2e1065 0%,
      #1e1b4b 50%,
      #0f172a 100%
    );
  }

  .galaxy {
    position: absolute;
    width: 100%;
    height: 100%;
    transform: rotate(45deg);
  }

  .star {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 2px;
    height: 2px;
    background: white;
    border-radius: 50%;
    box-shadow: 0 0 4px 1px white;
    animation: star-animate 5s linear infinite;
    animation-delay: calc(0.1s * var(--i));
  }

  @keyframes star-animate {
    0% {
      transform: translate(0, 0) scale(0);
      opacity: 0;
    }
    50% {
      transform: translate(-200px, -200px) scale(1);
      opacity: 1;
    }
    100% {
      transform: translate(-400px, -400px) scale(0);
      opacity: 0;
    }
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .galaxy {
      display: none;
    }
  }
</style>
