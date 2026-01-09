
import { Injectable, signal } from '@angular/core';

export type Period = 'month' | 'year';

@Injectable({
  providedIn: 'root',
})
export class PeriodService {
  private period = signal<Period>('month');

  getPeriod() {
    return this.period.asReadonly();
  }

  setPeriod(period: Period) {
    this.period.set(period);
  }
}
