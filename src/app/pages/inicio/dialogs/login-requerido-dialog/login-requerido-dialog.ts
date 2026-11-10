import { Component } from '@angular/core';

import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login-requerido-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './login-requerido-dialog.html',
  styleUrl: './login-requerido-dialog.scss',
})
export class LoginRequeridoDialog {}
