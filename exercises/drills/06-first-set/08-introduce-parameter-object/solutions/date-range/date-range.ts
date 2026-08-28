const MS_PER_DAY = 86_400_000;
const DAYS_PER_WEEK = 7;

/** A closed interval of calendar days: both ends are inside it. */
export class DateRange {
  readonly from: string;
  readonly to: string;

  constructor(from: string, to: string) {
    this.from = from;
    this.to = to;
  }

  includes(date: string): boolean {
    return date >= this.from && date <= this.to;
  }

  get days(): number {
    return (Date.parse(this.to) - Date.parse(this.from)) / MS_PER_DAY + 1;
  }

  get weeks(): number {
    return this.days / DAYS_PER_WEEK;
  }
}

/** The whole of one calendar month, from `yyyy-mm`. */
export function monthOf(month: string): DateRange {
  const year = Number(month.slice(0, 4));
  const ordinal = Number(month.slice(5, 7));
  const lastDay = new Date(Date.UTC(year, ordinal, 0));
  return new DateRange(`${month}-01`, lastDay.toISOString().slice(0, 10));
}
