import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit, ViewChild } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';

import { InstitucionService } from '../../../../services/institucion.service';
import { UserService } from '../../../../services/user.service';

import { InstitucionResponseDto } from '../../../../models/institucion.model';
import { UserResponseDto } from '../../../../models/user.model';

export interface AsignarUsuarioDialogData {
  institucion: InstitucionResponseDto;
}

@Component({
  selector: 'app-asignar-usuario-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatStepperModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatRadioModule,
  ],
  templateUrl: './asignar-usuario-dialog.html',
  styleUrl: './asignar-usuario-dialog.scss',
})
export class AsignarUsuarioDialog implements OnInit {
  private readonly institucionService = inject(InstitucionService);
  private readonly userService = inject(UserService);
  private readonly dialogRef = inject(MatDialogRef<AsignarUsuarioDialog>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly data = inject<AsignarUsuarioDialogData>(MAT_DIALOG_DATA);

  @ViewChild(MatStepper) stepper?: MatStepper;

  // LISTADO DE USUARIOS DISPONIBLES
  usuarios: UserResponseDto[] = [];

  displayedColumns = ['seleccionar', 'email'];

  usuarioSeleccionado: UserResponseDto | null = null;

  search = '';
  appliedSearch = '';

  page = 1;
  pageSize = 5;
  totalItems = 0;

  loadingUsuarios = false;
  saving = false;
  errorMessage = '';
  listError = '';

  private requestVersion = 0;

  get tieneUsuario(): boolean {
    return !!this.data.institucion.usuarioId;
  }

  ngOnInit(): void {
    if (!this.tieneUsuario) {
      this.cargarUsuarios();
    }
  }

  // OBTENER USUARIOS DISPONIBLES
  cargarUsuarios(): void {
    const version = ++this.requestVersion;

    this.loadingUsuarios = true;
    this.listError = '';

    this.userService
      .getPaged({
        page: this.page,
        pageSize: this.pageSize,
        search: this.appliedSearch,
        role: 'institucion',
        soloDisponiblesInstitucion: true,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (version === this.requestVersion) {
            this.loadingUsuarios = false;
            this.cdr.markForCheck();
          }
        }),
      )
      .subscribe({
        next: (response) => {
          // Ignorar una respuesta anterior si el usuario
          // ya realizó otra búsqueda.
          if (version !== this.requestVersion) return;

          this.usuarios = response.items;
          this.totalItems = response.totalItems;
          this.page = response.page;
          this.pageSize = response.pageSize;

          this.cdr.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          if (version !== this.requestVersion) return;

          this.listError = error.error?.message ?? 'No se pudo cargar el listado de usuarios.';

          this.usuarios = [];
          this.cdr.markForCheck();
        },
      });
  }

  // BUSCAR POR EMAIL
  buscar(): void {
    this.appliedSearch = this.search.trim();
    this.page = 1;
    this.usuarioSeleccionado = null;
    this.cargarUsuarios();
  }

  limpiarBusqueda(): void {
    this.search = '';
    this.buscar();
  }

  // CAMBIO DE PAGINA
  cambiarPagina(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;

    this.usuarioSeleccionado = null;
    this.cargarUsuarios();
  }

  // SELECCIONAR UN USUARIO
  seleccionarUsuario(usuario: UserResponseDto): void {
    this.usuarioSeleccionado = usuario;
    this.errorMessage = '';
  }

  // IR A CONFIRMACION
  siguiente(): void {
    if (!this.usuarioSeleccionado || this.loadingUsuarios) {
      return;
    }

    this.errorMessage = '';
    this.stepper?.next();
  }

  // CONFIRMAR ASIGNACION
  confirmarAsignacion(): void {
    if (this.saving || this.tieneUsuario || !this.usuarioSeleccionado) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    const usuarioId = this.usuarioSeleccionado.id;

    this.institucionService
      .asignarUsuario(this.data.institucion.id, { usuarioId })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.dialogRef.close(true);
        },

        error: (error: HttpErrorResponse) => {
          if (error.status === 409) {
            this.errorMessage =
              error.error?.message ?? 'El usuario ya está asignado a otra institución.';
          } else {
            this.errorMessage = error.error?.message ?? 'No se pudo asignar el usuario.';
          }

          this.cdr.markForCheck();
        },
      });
  }

  // QUITAR USUARIO EXISTENTE
  confirmarDesasignacion(): void {
    if (this.saving || !this.tieneUsuario) return;

    this.saving = true;
    this.errorMessage = '';

    this.institucionService
      .quitarUsuario(this.data.institucion.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.dialogRef.close(true);
        },

        error: (error: HttpErrorResponse) => {
          this.errorMessage = error.error?.message ?? 'No se pudo quitar el usuario.';

          this.cdr.markForCheck();
        },
      });
  }

  cancelar(): void {
    if (!this.saving) {
      this.dialogRef.close(false);
    }
  }
}
