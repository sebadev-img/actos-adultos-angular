import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActoDisponibleDto, CargoDisponibleDto } from '../../../../models/acto-disponible.model';
import { Turno, Revista } from '../../../../models/cargo.model';

export interface DetalleCargoDialogData {
  acto: ActoDisponibleDto;
  cargo: CargoDisponibleDto;
}

@Component({
  selector: 'app-detalle-cargo-dialog',
  standalone: true,
  imports: [DatePipe, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './detalle-cargo-dialog.html',
  styleUrl: './detalle-cargo-dialog.scss'
})
export class DetalleCargoDialog {
  readonly data = inject<DetalleCargoDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<DetalleCargoDialog>);

  readonly dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  getNombreTurno(turno: Turno): string {
    return ({ [Turno.MANANA]: 'Mañana', [Turno.TARDE]: 'Tarde', [Turno.VESPERTINO]: 'Vespertino' } as Record<number,string>)[turno] ?? 'No especificado';
  }
  getNombreRevista(revista: Revista): string {
    return ({ [Revista.TITULAR]: 'Titular', [Revista.INTERINO]: 'Interino', [Revista.SUPLENTE]: 'Suplente' } as Record<number,string>)[revista] ?? 'No especificada';
  }
  cerrar(): void { this.ref.close(); }
}
