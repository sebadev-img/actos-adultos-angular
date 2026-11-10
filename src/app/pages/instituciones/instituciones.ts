import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';

import { InstitucionService } from '../../services/institucion.service';
import { CiudadService } from '../../services/ciudad.service';

import { InstitucionResponseDto, InstitucionQueryRequest } from '../../models/institucion.model';

import { Ciudad } from '../../models/ciudad.model';

import { InstitucionDialog } from './dialogs/institucion-dialog/institucion-dialog';
import { AsignarUsuarioDialog } from './dialogs/asignar-usuario-dialog/asignar-usuario-dialog';

@Component({
  selector: 'app-instituciones',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './instituciones.html',
  styleUrl: './instituciones.scss',
})
export class Instituciones implements OnInit {
  private readonly institucionService = inject(InstitucionService);
  private readonly ciudadService = inject(CiudadService);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  displayedColumns: string[] = ['descripcion', 'ciudad', 'usuario', 'acciones'];

  instituciones: InstitucionResponseDto[] = [];
  ciudades: Ciudad[] = [];

  search = '';
  ciudadId: number | null = null;
  tieneUsuario: boolean | null = null;

  filtros: InstitucionQueryRequest = {
    page: 1,
    pageSize: 10,
  };

  page = 1;
  pageSize = 10;
  totalItems = 0;

  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.cargarCiudades();
    this.cargarInstituciones();
  }

  cargarCiudades(): void {
    this.ciudadService
      .getCiudades()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.ciudades = response;
          this.cdr.markForCheck();
        },
        error: () => {
          console.error('No se pudieron cargar las ciudades.');
        },
      });
  }

  cargarInstituciones(): void {
    this.loading = true;
    this.errorMessage = '';

    const request: InstitucionQueryRequest = {
      ...this.filtros,
      page: this.page,
      pageSize: this.pageSize,
    };

    this.institucionService
      .getPaged(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          this.instituciones = response.items;
          this.totalItems = response.totalItems;
          this.page = response.page;
          this.pageSize = response.pageSize;
          this.cdr.markForCheck();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage =
            error.error?.message ?? 'No se pudo cargar el listado de instituciones.';
          this.cdr.markForCheck();
        },
      });
  }

  buscar(): void {
    this.page = 1;

    this.filtros = {
      page: 1,
      pageSize: this.pageSize,
      search: this.search.trim(),
      ciudadId: this.ciudadId,
      tieneUsuario: this.tieneUsuario,
    };

    this.cargarInstituciones();
  }

  limpiarFiltros(): void {
    this.search = '';
    this.ciudadId = null;
    this.tieneUsuario = null;
    this.buscar();
  }

  cambiarPagina(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.cargarInstituciones();
  }

  agregar(): void {
    const ref = this.dialog.open(InstitucionDialog, {
      width: '520px',
      maxWidth: '95vw',
      autoFocus: false,
      data: { institucion: null },
    });

    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result === true) {
          this.page = 1;
          this.cargarInstituciones();
        }
      });
  }

  editar(institucion: InstitucionResponseDto): void {
    const ref = this.dialog.open(InstitucionDialog, {
      width: '520px',
      maxWidth: '95vw',
      autoFocus: false,
      data: { institucion },
    });

    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result === true) {
          this.cargarInstituciones();
        }
      });
  }

  gestionarUsuario(institucion: InstitucionResponseDto): void {
    const ref = this.dialog.open(AsignarUsuarioDialog, {
      width: '700px',
      maxWidth: '95vw',
      autoFocus: false,
      disableClose: true,
      data: { institucion },
    });

    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result === true) {
          this.cargarInstituciones();
        }
      });
  }
}
