import { Component, inject } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface PerfilResultDialogData {
  type: 'success' | 'error';
  title: string;
  message: string;
}

@Component({
  selector: 'app-perfil-result-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './perfil-result-dialog.html',
  styleUrl: './perfil-result-dialog.scss',
})
export class PerfilResultDialog {
  readonly data = inject<PerfilResultDialogData>(MAT_DIALOG_DATA);

  private readonly dialogRef = inject(MatDialogRef<PerfilResultDialog>);

  close(): void {
    this.dialogRef.close();
  }
}
