import type { SortConfig } from '$lib/types/table';

export function sortItems<T>(items: T[], config: SortConfig): T[] {
  if (!config.key || !config.direction) return items;

  return [...items].sort((a, b) => {
    const aValue = a[config.key as keyof T];
    const bValue = b[config.key as keyof T];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    // เรียงตามประเภทข้อมูล
    if (typeof aValue === 'boolean') {
      return config.direction === 'asc' 
        ? (aValue === bValue ? 0 : aValue ? -1 : 1)
        : (aValue === bValue ? 0 : aValue ? 1 : -1);
    }

    // เรียงข้อความ
    const compareResult = String(aValue).localeCompare(String(bValue), 'th');
    return config.direction === 'asc' ? compareResult : -compareResult;
  });
} 