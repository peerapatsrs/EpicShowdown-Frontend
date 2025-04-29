<script lang="ts">
	import '../app.css';

	import { auth } from '$lib/stores/auth';
	import { page } from '$app/stores';
	import { clickOutside } from '$lib/actions/clickOutside';

	let isUserMenuOpen = false;
	let isMainMenuOpen = false;


	const mainMenuItems = [
		{ label: 'หน้าแรก', href: '/' },
		{ label: 'กิจกรรมทั้งหมด', href: '/activities' },
		{ label: 'กิจกรรมของฉัน', href: '/my-activities' },
		{ label: 'การสนับสนุนของฉัน', href: '/my-supports' }
	];

	const mainMenuNoAuthItems = [
		{ label: 'วิธีการใช้งาน', href: '/how-to' }
	];

	const handleLogout = () => {
		auth.clearAuth();
		window.location.href = '/login';
	};

	const userMenuItems = [
		{ label: 'ข้อมูลส่วนตัว', href: '/profile' },
		{ label: 'การตั้งค่า', href: '/settings' },
		{ label: 'จัดการ Passkey', href: '/passkeys' },
		{ label: 'ออกจากระบบ', action: handleLogout }
	];

	function closeMenus() {
		isUserMenuOpen = false;
		isMainMenuOpen = false;
	}

	// เช็คว่าเป็นหน้า login หรือ register หรือไม่
	$: isAuthPage = $page.url.pathname === '/login' || $page.url.pathname === '/register';
</script>

<div class="relative min-h-screen bg-[#1a1625]">
{#if !isAuthPage}
	<!-- Header/Navigation -->
	<header class="fixed top-0 left-0 right-0 z-50 bg-[#251f35] py-4">
		<div class="container mx-auto flex items-center justify-between px-4">
			<div class="flex items-center gap-8">
				<div class="text-2xl font-bold text-[#ff6b2b]">Epic Showdown</div>

				<!-- Main Menu Button (Mobile) -->
				<button
					class="lg:hidden rounded-full p-2 text-white hover:bg-[#1a1625]"
					on:click={() => (isMainMenuOpen = !isMainMenuOpen)}
					aria-label="เปิด/ปิดเมนูหลัก"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
				</button>

				<!-- Main Menu (Desktop) -->
				<nav class="hidden lg:block">
					<ul class="flex items-center gap-6">
						{#if $auth.isAuthenticated}
							{#each mainMenuItems as item}
								<li>
									<a
										href={item.href}
										class="text-gray-300 transition hover:text-[#ff6b2b]"
										on:click={closeMenus}
									>
										{item.label}
									</a>
								</li>
							{/each}
						{/if}
						{#each mainMenuNoAuthItems as item}
							<li>
								<a
									href={item.href}
									class="text-gray-300 transition hover:text-[#ff6b2b]"
									on:click={closeMenus}
								>
									{item.label}
								</a>
							</li>
						{/each}
					</ul>
				</nav>
			</div>

			{#if $auth.isAuthenticated}
				<!-- User Menu -->
				<div
					class="relative"
					use:clickOutside
					on:clickoutside={() => (isUserMenuOpen = false)}
				>
					<button
						class="flex items-center gap-2 rounded-full bg-[#1a1625] px-4 py-2 text-white transition hover:bg-[#2a2535]"
						on:click={() => (isUserMenuOpen = !isUserMenuOpen)}
					>
						<div class="h-8 w-8 overflow-hidden rounded-full bg-gradient-to-r from-[#ff6b2b] to-[#ee0979]">
							<img
								src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${'guest'}`}
								alt="User Avatar"
								class="h-full w-full object-cover"
							/>
						</div>
						<span class="hidden sm:inline">{'Guest'}</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 transition {isUserMenuOpen ? 'rotate-180' : ''}"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>

					{#if isUserMenuOpen}
						<div
							class="absolute right-0 mt-2 w-48 rounded-lg bg-[#251f35] py-2 shadow-xl ring-1 ring-black/5"
						>
							{#each userMenuItems as item}
								{#if item.href}
									<a
										href={item.href}
										class="block px-4 py-2 text-sm text-gray-300 transition hover:bg-[#1a1625] hover:text-[#ff6b2b]"
										on:click={closeMenus}
									>
										{item.label}
									</a>
								{:else}
									<button
										class="block w-full px-4 py-2 text-left text-sm text-gray-300 transition hover:bg-[#1a1625] hover:text-[#ff6b2b]"
										on:click={() => {
											if (item.action) item.action();
											closeMenus();
										}}
									>
										{item.label}
									</button>
								{/if}
							{/each}
						</div>
					{/if}
				</div>
			{:else}
				<a
					href="/login"
					class="rounded-full bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] px-6 py-2 text-white transition hover:from-[#ff8f59] hover:to-[#ff2a90]"
				>
					เข้าสู่ระบบ
				</a>
			{/if}
		</div>

		<!-- Main Menu (Mobile) -->
		{#if isMainMenuOpen}
			<nav class="border-t border-[#1a1625] bg-[#251f35] px-4 py-2 lg:hidden">
				<ul class="space-y-2">
					{#each mainMenuItems as item}
						<li>
							<a
								href={item.href}
								class="block rounded-lg px-4 py-2 text-gray-300 transition hover:bg-[#1a1625] hover:text-[#ff6b2b]"
								on:click={closeMenus}
							>
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			</nav>
		{/if}
	</header>
{/if}

<!-- Main Content -->
<main class="{!isAuthPage ? 'pt-24' : ''}">
	<slot />
</main>
</div>

<style>
	/* Add any custom styles here */
</style>
