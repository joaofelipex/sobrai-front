import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-ai-fab',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ai-fab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiFabComponent {}
