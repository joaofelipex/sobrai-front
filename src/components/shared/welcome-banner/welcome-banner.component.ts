import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-welcome-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './welcome-banner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeBannerComponent {
  userName = input.required<string>();
  companyName = input.required<string>();
}
