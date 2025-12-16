import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ai-fab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-fab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiFabComponent {}
