<script lang="ts">
	import { auth } from '$lib/stores/auth';
	import { onMount } from 'svelte';
	let currentSlide = 0;
	let isUserMenuOpen = false;
	let isMainMenuOpen = false;

	const slides = [
		{
			image: '/images/tournament-winners.png',
			alt: 'ผู้ชนะการแข่งขัน - อันดับ 1 Taro, อันดับ 2 Misaki, อันดับ 3 Akira'
		},
		{
			image: '/images/secure-qr-payment.png',
			alt: 'Esports Tournament'
		},
		{
			image: '/images/secure.png',
			alt: 'Charity Run'
		}
	];

	onMount(() => {
		const interval = setInterval(() => {
			currentSlide = (currentSlide + 1) % slides.length;
		}, 3000); // เปลี่ยนสไลด์ทุก 3 วินาที

		return () => clearInterval(interval);
	});
</script>


	<!-- Hero Section -->
	<div class="relative">
		<div class="container mx-auto px-4 py-16">
			<div class="flex flex-col items-center justify-center gap-8 lg:flex-row">
				<!-- Left Content -->
				<div class="flex-1">
					<div class="mb-8">
						<h2 class="mb-2 text-4xl font-bold text-white">ค้นหากิจกรรม</h2>
						<p class="text-lg text-gray-400">ค้นหากิจกรรมที่คุณสนใจเพื่อส่งกำลังใจและของขวัญ</p>
					</div>
					<div class="space-y-4">
						<div>
							<input
								type="text"
								placeholder="ชื่อกิจกรรม หรือ ชื่อผู้จัด"
								class="w-full rounded-lg bg-[#251f35] px-6 py-4 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-[#ff6b2b]"
							/>
						</div>
						<div>
							<select
								class="w-full rounded-lg bg-[#251f35] px-6 py-4 text-white outline-none focus:ring-2 focus:ring-[#ff6b2b]"
							>
								<option value="">ทุกประเภท</option>
								<option value="game">เกม</option>
								<option value="sport">กีฬา</option>
								<option value="music">ดนตรี</option>
								<option value="other">อื่นๆ</option>
							</select>
						</div>
						<button
							class="w-full rounded-lg bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] px-8 py-4 font-medium text-white transition hover:from-[#ff8f59] hover:to-[#ff2a90]"
						>
							ค้นหากิจกรรม
						</button>
					</div>
				</div>

				<!-- Right Content - Hero Image -->
				<div class="relative flex-1">
					<div class="relative h-[400px] overflow-hidden rounded-lg">
						{#each slides as slide, i}
							<div
								class="absolute left-0 top-0 h-full w-full transition-opacity duration-500"
								style="opacity: {currentSlide === i ? '1' : '0'}"
							>
								<img
									src={slide.image}
									alt={slide.alt}
									class="h-full w-full object-cover shadow-2xl"
								/>
								<div
									class="absolute inset-0 bg-gradient-to-t from-[#1a1625]/20 to-transparent opacity-75"
								></div>
							</div>
						{/each}

						<!-- Slide Indicators -->
						<div
							class="absolute bottom-4 left-1/2 flex -translate-x-1/2 transform gap-2"
						>
							{#each slides as _, i}
								<button
									class="h-2 w-2 rounded-full transition-all {currentSlide === i
										? 'bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] w-6'
										: 'bg-white/50 hover:bg-white/75'}"
									on:click={() => (currentSlide = i)}
									aria-label="Go to slide {i + 1}"
								></button>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Popular Activities Section -->
	<div class="container mx-auto px-4 py-16">
		<div class="mb-8 flex items-center justify-between">
			<div>
				<h2 class="mb-2 text-3xl font-bold text-white">กิจกรรมยอดนิยม</h2>
				<p class="text-gray-400">กิจกรรมที่ได้รับความนิยมสูงสุดในขณะนี้</p>
			</div>
			<a
				href="/activities"
				class="rounded-full border-2 border-[#ff6b2b] px-6 py-2 text-[#ff6b2b] transition hover:bg-gradient-to-r hover:from-[#ff6b2b] hover:to-[#ee0979] hover:text-white"
			>
				ดูทั้งหมด
			</a>
		</div>

		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
			<!-- Activity Card 1 -->
			<div class="overflow-hidden rounded-lg bg-[#251f35] shadow-lg">
				<div class="relative">
					<img
						src="https://placehold.co/400x300"
						alt="Activity"
						class="h-48 w-full object-cover"
					/>
					<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-4">
						<span class="rounded-full bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] px-3 py-1 text-sm text-white"
							>เกม</span
						>
					</div>
				</div>
				<div class="p-4">
					<h3 class="mb-2 text-lg font-semibold text-white">การแข่งขัน ROV Tournament</h3>
					<p class="mb-4 text-sm text-gray-400">โดย Gaming Thailand</p>
					<div class="flex items-center justify-between">
						<span class="text-[#ff6b2b]">฿100 - ฿1,000</span>
						<button
							class="rounded-full bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] px-4 py-1 text-sm text-white hover:from-[#ff8f59] hover:to-[#ff2a90]"
							>สนับสนุน</button
						>
					</div>
				</div>
			</div>

			<!-- Activity Card 2 -->
			<div class="overflow-hidden rounded-lg bg-[#251f35] shadow-lg">
				<div class="relative">
					<img
						src="https://placehold.co/400x300"
						alt="Activity"
						class="h-48 w-full object-cover"
					/>
					<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-4">
						<span class="rounded-full bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] px-3 py-1 text-sm text-white"
							>กีฬา</span
						>
					</div>
				</div>
				<div class="p-4">
					<h3 class="mb-2 text-lg font-semibold text-white">แข่งขันฟุตบอลการกุศล</h3>
					<p class="mb-4 text-sm text-gray-400">โดย Sports For All</p>
					<div class="flex items-center justify-between">
						<span class="text-[#ff6b2b]">฿50 - ฿500</span>
						<button
							class="rounded-full bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] px-4 py-1 text-sm text-white hover:from-[#ff8f59] hover:to-[#ff2a90]"
							>สนับสนุน</button
						>
					</div>
				</div>
			</div>

			<!-- Activity Card 3 -->
			<div class="overflow-hidden rounded-lg bg-[#251f35] shadow-lg">
				<div class="relative">
					<img
						src="https://placehold.co/400x300"
						alt="Activity"
						class="h-48 w-full object-cover"
					/>
					<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-4">
						<span class="rounded-full bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] px-3 py-1 text-sm text-white"
							>ดนตรี</span
						>
					</div>
				</div>
				<div class="p-4">
					<h3 class="mb-2 text-lg font-semibold text-white">คอนเสิร์ตการกุศล</h3>
					<p class="mb-4 text-sm text-gray-400">โดย Music For Life</p>
					<div class="flex items-center justify-between">
						<span class="text-[#ff6b2b]">฿200 - ฿2,000</span>
						<button
							class="rounded-full bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] px-4 py-1 text-sm text-white hover:from-[#ff8f59] hover:to-[#ff2a90]"
							>สนับสนุน</button
						>
					</div>
				</div>
			</div>

			<!-- Activity Card 4 -->
			<div class="overflow-hidden rounded-lg bg-[#251f35] shadow-lg">
				<div class="relative">
					<img
						src="https://placehold.co/400x300"
						alt="Activity"
						class="h-48 w-full object-cover"
					/>
					<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-4">
						<span class="rounded-full bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] px-3 py-1 text-sm text-white"
							>เกม</span
						>
					</div>
				</div>
				<div class="p-4">
					<h3 class="mb-2 text-lg font-semibold text-white">PUBG Mobile Championship</h3>
					<p class="mb-4 text-sm text-gray-400">โดย ESports TH</p>
					<div class="flex items-center justify-between">
						<span class="text-[#ff6b2b]">฿150 - ฿1,500</span>
						<button
							class="rounded-full bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] px-4 py-1 text-sm text-white hover:from-[#ff8f59] hover:to-[#ff2a90]"
							>สนับสนุน</button
						>
					</div>
				</div>
			</div>

			<!-- Activity Card 5 -->
			<div class="overflow-hidden rounded-lg bg-[#251f35] shadow-lg">
				<div class="relative">
					<img
						src="https://placehold.co/400x300"
						alt="Activity"
						class="h-48 w-full object-cover"
					/>
					<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-4">
						<span class="rounded-full bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] px-3 py-1 text-sm text-white"
							>อื่นๆ</span
						>
					</div>
				</div>
				<div class="p-4">
					<h3 class="mb-2 text-lg font-semibold text-white">งานวิ่งการกุศล</h3>
					<p class="mb-4 text-sm text-gray-400">โดย Run For Life</p>
					<div class="flex items-center justify-between">
						<span class="text-[#ff6b2b]">฿300 - ฿3,000</span>
						<button
							class="rounded-full bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] px-4 py-1 text-sm text-white hover:from-[#ff8f59] hover:to-[#ff2a90]"
							>สนับสนุน</button
						>
					</div>
				</div>
			</div>
		</div>
	</div>

<style>
	/* Add any custom styles here */
</style>
