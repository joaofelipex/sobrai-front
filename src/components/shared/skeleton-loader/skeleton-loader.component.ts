import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="animate-pulse space-y-4">
      <div 
        *ngFor="let i of [].constructor(count); let i = index"
        class="bg-slate-200 dark:bg-slate-700 rounded"
        [ngStyle]="{
          'width': width || '100%',
          'height': height || '1rem',
          'margin-bottom': '0.5rem'
        }"
      ></div>
    </div>
  `,
  styles: []
})
export class SkeletonLoaderComponent {
  @Input() count: number = 1;
  @Input() width: string = '100%';
  @Input() height: string = '1rem';
}
