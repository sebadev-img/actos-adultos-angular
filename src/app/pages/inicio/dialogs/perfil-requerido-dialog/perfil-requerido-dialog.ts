import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-perfil-requerido-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './perfil-requerido-dialog.html',
  styleUrl: './perfil-requerido-dialog.scss',
})
export class PerfilRequeridoDialog {
  private readonly dialogRef = inject(MatDialogRef<PerfilRequeridoDialog>);
  private readonly router = inject(Router);

  cerrar(): void {
    this.dialogRef.close();
  }

  irAPostulante(): void {
    this.dialogRef.close();

    this.router.navigate(['/postulante']);
  }
}
