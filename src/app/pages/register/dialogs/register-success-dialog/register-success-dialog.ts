import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface RegisterSuccessDialogData {
  email: string;
}

@Component({
  selector: 'app-register-success-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './register-success-dialog.html',
  styleUrl: './register-success-dialog.scss',
})
export class RegisterSuccessDialog {
  private readonly router = inject(Router);

  private readonly dialogRef = inject(MatDialogRef<RegisterSuccessDialog>);

  readonly data = inject<RegisterSuccessDialogData>(MAT_DIALOG_DATA);

  goToLogin(): void {
    this.dialogRef.close();
    this.router.navigate(['/login']);
  }

  close(): void {
    this.dialogRef.close();
  }
}
