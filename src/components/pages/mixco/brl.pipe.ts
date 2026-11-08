import { Pipe, PipeTransform } from '@angular/core';

/** Formata número como reais (R$ 1.234,56). */
@Pipe({ name: 'brl', standalone: true })
export class BrlPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return (value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}
