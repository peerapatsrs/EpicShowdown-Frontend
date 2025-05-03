<script lang="ts">
  import dayjs from 'dayjs';
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { clickOutside } from '$lib/actions/clickOutside';
  import { portal } from 'svelte-portal';

  export let value: string = '';
  export let placeholder: string = 'เลือกวันที่';
  export let maxDate: string = '';
  export let minDate: string = '';
  export let buttonClass: string = '';
  export let useBuddhistYear: boolean = true;

  const dispatch = createEventDispatcher();
  
  let showDatePicker = false;
  let showMonthDropdown = false;
  let showYearDropdown = false;
  let tempDate = '';
  let inputEl: HTMLButtonElement | null = null;
  let popupEl: HTMLDivElement | null = null;
  let popupLeft = 0;
  let popupTop = 0;
  let popupDirection = 'bottom'; // 'bottom' | 'top'

  function toggleDatePicker() {
    showDatePicker = !showDatePicker;
    if (showDatePicker) {
      tempDate = value;
      setTimeout(updatePopupPosition, 0);
    }
  }

  function handleDateSelect(date: string) {
    tempDate = date;
    value = tempDate;
    dispatch('change', { value: tempDate });
    showDatePicker = false;
  }

  function applyDate() {
    value = tempDate;
    dispatch('change', { value: tempDate });
    showDatePicker = false;
  }

  function getYearRange() {
    const maxYear = maxDate ? dayjs(maxDate).year() : dayjs().year();
    const minYear = minDate ? dayjs(minDate).year() : maxYear - 100;
    const years = [];
    for (let i = maxYear; i >= minYear; i--) {
      years.push(useBuddhistYear ? i + 543 : i);
    }
    return years;
  }

  function generateCalendarDays() {
    const currentDate = tempDate ? dayjs(tempDate) : dayjs();
    const startOfMonth = currentDate.startOf('month');
    const startDay = startOfMonth.day();
    const daysInMonth = currentDate.daysInMonth();
    
    const days = [];
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }

  function formatDisplayDate(date: string) {
    if (!date) return placeholder;
    const d = dayjs(date);
    const year = useBuddhistYear ? d.year() + 543 : d.year();
    return `${d.locale('th').format('D MMMM')} ${year}`;
  }

  $: isDateDisabled = (date: string) => {
    if (maxDate && dayjs(date).isAfter(dayjs(maxDate))) return true;
    if (minDate && dayjs(date).isBefore(dayjs(minDate))) return true;
    return false;
  };

  function updatePopupPosition() {
    if (inputEl && popupEl) {
      const rect = inputEl.getBoundingClientRect();
      let popupHeight = popupEl.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < popupHeight.height && spaceAbove > popupHeight.height) {
        // แสดงด้านบน (ขอบล่าง popup ห่างขอบบนฟิลด์ 4px)
        popupDirection = 'top';
        popupLeft = rect.left;
        popupTop = (rect.bottom - rect.height) - popupHeight.height - 12;
      } else {
        // แสดงด้านล่าง (ขอบบน popup ห่างขอบล่างฟิลด์ 4px)
        popupDirection = 'bottom';
        popupLeft = rect.left;
        popupTop = rect.bottom - 4;
      }
    }
  }

  // เพิ่ม event listener สำหรับ scroll/resize
  let scrollHandler: () => void;
  let resizeHandler: () => void;

  $: {
    if (showDatePicker) {
      updatePopupPosition();
      scrollHandler = () => updatePopupPosition();
      resizeHandler = () => updatePopupPosition();
      window.addEventListener('scroll', scrollHandler, true);
      window.addEventListener('resize', resizeHandler);
    } else {
      window.removeEventListener('scroll', scrollHandler, true);
      window.removeEventListener('resize', resizeHandler);
    }
  }

  onDestroy(() => {
    window.removeEventListener('scroll', scrollHandler, true);
    window.removeEventListener('resize', resizeHandler);
  });
</script>

<div class="relative">
  <button
    bind:this={inputEl}
    type="button"
    class="w-full flex items-center justify-between rounded-xl bg-[#1a1625] px-4 py-3 text-white border border-gray-700 focus:border-[#ff6b2b] focus:ring-1 focus:ring-[#ff6b2b] transition-colors {buttonClass}"
    on:click={() => { toggleDatePicker(); }}
    aria-label={placeholder}
  >
    <span class="text-left">{formatDisplayDate(value)}</span>
    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  </button>

  {#if showDatePicker}
    <div use:portal bind:this={popupEl} class="fixed z-[300] mt-2 p-4 bg-[#2a2440] rounded-xl shadow-xl border border-gray-700 w-[320px]"
      style="left: {popupLeft}px; top: {popupTop}px;"
      use:clickOutside on:clickoutside={() => showDatePicker = false}>
      <div class="flex items-center justify-between mb-4">
        <button
          type="button"
          class="p-2 hover:bg-[#3d3654] rounded-lg transition-colors"
          on:click={() => tempDate = dayjs(tempDate || value || undefined).subtract(1, 'month').format('YYYY-MM-DD')}
          aria-label="เดือนก่อนหน้า"
        >
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div class="flex items-center gap-2 relative">
          <div class="relative">
            <button
              type="button"
              class="text-white font-medium hover:text-[#ff6b2b] transition-colors"
              on:click={() => {
                showMonthDropdown = !showMonthDropdown;
                showYearDropdown = false;
              }}
            >
              {dayjs(tempDate || value || undefined).locale('th').format('MMMM')}
            </button>
            
            {#if showMonthDropdown}
              <div class="absolute top-full left-0 mt-1 bg-[#2a2440] border border-gray-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                {#each Array.from({ length: 12 }, (_, i) => dayjs().month(i).format('MMMM')) as month, i}
                  <button
                    type="button"
                    class="block w-full px-4 py-2 text-left text-white hover:bg-[#3d3654] transition-colors"
                    on:click={() => {
                      tempDate = dayjs(tempDate || value || undefined).month(i).format('YYYY-MM-DD');
                      showMonthDropdown = false;
                    }}
                  >
                    {month}
                  </button>
                {/each}
              </div>
            {/if}
          </div>

          <div class="relative">
            <button
              type="button"
              class="text-white font-medium hover:text-[#ff6b2b] transition-colors"
              on:click={() => {
                showYearDropdown = !showYearDropdown;
                showMonthDropdown = false;
              }}
            >
              {useBuddhistYear ? dayjs(tempDate || value || undefined).year() + 543 : dayjs(tempDate || value || undefined).year()}
            </button>
            
            {#if showYearDropdown}
              <div class="absolute top-full right-0 mt-1 bg-[#2a2440] border border-gray-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                {#each getYearRange() as year}
                  <button
                    type="button"
                    class="block w-full px-4 py-2 text-left text-white hover:bg-[#3d3654] transition-colors"
                    on:click={() => {
                      const adjustedYear = useBuddhistYear ? year - 543 : year;
                      tempDate = dayjs(tempDate || value || undefined).year(adjustedYear).format('YYYY-MM-DD');
                      showYearDropdown = false;
                    }}
                  >
                    {year}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        </div>

        <button
          type="button"
          class="p-2 hover:bg-[#3d3654] rounded-lg transition-colors"
          on:click={() => tempDate = dayjs(tempDate || value || undefined).add(1, 'month').format('YYYY-MM-DD')}
          aria-label="เดือนถัดไป"
        >
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div class="grid grid-cols-7 gap-1 mb-4">
        {#each ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'] as day}
          <div class="text-center text-sm text-[#ff6b2b] font-medium">{day}</div>
        {/each}
      </div>

      <div class="grid grid-cols-7 gap-1">
        {#each generateCalendarDays() as day}
          {#if day === null}
            <div class="h-8">
            </div>
          {:else}
            {@const currentDate = dayjs(tempDate || value || undefined).date(day).format('YYYY-MM-DD')}
            {@const isSelected = currentDate === (tempDate || value)}
            {@const isToday = currentDate === dayjs().format('YYYY-MM-DD')}
            {@const disabled = isDateDisabled(currentDate)}
            <button
              type="button"
              class="h-8 rounded-lg text-sm font-medium transition-colors
              {isSelected ? 'bg-gradient-to-r from-[#ff6b2b] to-[#ee0979] text-white' : ''}
              {isToday && !isSelected ? 'border-2 border-[#ff6b2b] text-white' : 'text-gray-300'}
              {!isSelected && !isToday ? 'hover:bg-[#3d3654]' : ''}
              {disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}"
              disabled={disabled}
              on:click={() => !disabled && handleDateSelect(currentDate)}
            >
              {day}
            </button>
          {/if}
        {/each}
      </div>

      <div class="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-700">
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors cursor-pointer"
          on:click={() => { value = ''; dispatch('change', { value: '' }); showDatePicker = false; }}
        >
          ล้างค่า
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  /* เพิ่ม styles สำหรับ datepicker */
  :global(.datepicker-overlay) {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 40;
  }
</style> 