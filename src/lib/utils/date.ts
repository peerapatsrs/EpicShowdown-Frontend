import dayjs from 'dayjs';

export function formatDateThai(date: string, format: string = 'DD/MM/YYYY', isBuddhistYear: boolean = false) {
  if (!date) return '-';
  const d = dayjs(date).tz('Asia/Bangkok').locale('th');
  if (isBuddhistYear) {
    return d.add(543, 'year').format(format);
  }
  return d.format(format);
}

// เพิ่ม plugin ให้ dayjs สามารถเรียกใช้ formatDateThai ได้
// ใช้งาน: dayjs(date).formatDateThai(format, isBuddhistYear)
dayjs.prototype.formatDateThai = function(format = 'DD/MM/YYYY', isBuddhistYear = false) {
  if (!this.isValid()) return '-';
  const d = this.tz('Asia/Bangkok').locale('th');
  if (isBuddhistYear) {
    return d.add(543, 'year').format(format);
  }
  return d.format(format);
};

declare module 'dayjs' {
  interface Dayjs {
    formatDateThai(format?: string, isBuddhistYear?: boolean): string;
  }
}