<script lang="ts">
	import { auth } from '$lib/stores/auth';
	import { authApi } from '$lib/api/auth';
	import { startRegistration } from '@simplewebauthn/browser';

	let error = '';
	let success = '';
	let loading = false;

	function decodeBase64UrlToUint8Array(input: string): Uint8Array {
		let b64 = input.replace(/-/g, '+').replace(/_/g, '/');
		const pad = b64.length % 4;
		if (pad) b64 += '='.repeat(4 - pad);
		const str = window.atob(b64);
		return Uint8Array.from(str, (c) => c.charCodeAt(0));
	}

	function toUint8Array(value: any): Uint8Array {
		if (value instanceof Uint8Array) return value;
		if (value instanceof ArrayBuffer) return new Uint8Array(value);
		if (Array.isArray(value)) return new Uint8Array(value);
		if (typeof value === 'string') return decodeBase64UrlToUint8Array(value);
		throw new Error(`Invalid format for challenge/user.id: ${typeof value}`);
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

	const handleLogout = () => {
		auth.clearAuth();
		window.location.href = '/login';
	};
</script>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 to-pink-100 p-4"
>
	<div
		class="w-full max-w-xl overflow-hidden rounded-2xl border border-gray-200 bg-white/70 shadow-xl backdrop-blur-md"
	>
		<div class="px-8 py-6">
			<header class="mb-6 text-center">
				<h1
					class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-4xl font-extrabold text-transparent"
				>
					Epic Showdown n
				</h1>
				<p class="mt-2 text-gray-700">จัดการ Passkey &amp; Logout ง่ายดาย</p>
			</header>

			{#if $auth.isAuthenticated}
				<!-- Passkey Section -->
				<section class="space-y-4">
					<div class="flex items-center justify-between">
						<h2 class="text-2xl font-semibold text-gray-800">เพิ่ม Passkey</h2>
						<button
							on:click={handleLogout}
							class="rounded-lg bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
						>
							ออกจากระบบ
						</button>
					</div>

					<!-- Messages -->
					{#if error}
						<div class="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
							{error}
						</div>
					{/if}
					{#if success}
						<div class="rounded-lg border border-green-200 bg-green-50 p-3 text-green-700">
							{success}
						</div>
					{/if}

					<!-- Action Button -->
					<div class="text-center">
						<button
							on:click={addPasskey}
							disabled={loading}
							class="inline-flex items-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-medium text-white shadow-md transition-transform hover:-translate-y-0.5 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
						>
							{#if loading}
								<svg class="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24">
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									/>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
									/>
								</svg>
								กำลังดำเนินการ...
							{:else}
								เพิ่ม Passkey
							{/if}
						</button>
					</div>
				</section>
			{:else}
				<div class="py-12 text-center">
					<p class="mb-4 text-gray-600">กรุณาเข้าสู่ระบบก่อนใช้งาน</p>
					<a
						href="/login"
						class="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 px-8 py-3 text-white shadow-lg transition hover:from-indigo-600 hover:to-purple-600"
					>
						เข้าสู่ระบบ
					</a>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	/* Custom scroll for wide cards */
	.horizontal-scroll::-webkit-scrollbar {
		height: 6px;
	}
	.horizontal-scroll::-webkit-scrollbar-thumb {
		background-color: rgba(100, 100, 100, 0.4);
		border-radius: 3px;
	}
</style>
