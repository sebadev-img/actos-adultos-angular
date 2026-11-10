import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ActoService } from '../../services/acto.service';
import { ActoResponseDto, ActoQueryRequest } from '../../models/acto.model';

import { MatDialog } from '@angular/material/dialog';
import { CargoService } from '../../services/cargo.service';

import { CargoResponseDto, Turno } from '../../models/cargo.model';

import { CargoDialog } from './dialogs/cargo-dialog/cargo-dialog';

@Component({
  selector: 'app-gestion-cargos',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './gestion-cargos.html',
  styleUrl: './gestion-cargos.scss',
})
export class GestionCargos implements OnInit {
  private readonly actoService = inject(ActoService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cargoService = inject(CargoService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  displayedColumns: string[] = [
    'numero',
    'descripcion',
    'inicio',
    'fin',
    'puedeCargarCargos',
    'acciones',
  ];

  actos: ActoResponseDto[] = [];
  actoSeleccionado: ActoResponseDto | null = null;

  // Valores editables de los filtros
  search = '';
  puedeCargarCargos: boolean | null = null;

  // Filtros aplicados a la consulta
  appliedSearch = '';
  appliedPuedeCargarCargos: boolean | null = null;

  page = 1;
  pageSize = 10;
  totalItems = 0;

  loading = false;
  errorMessage = '';

  private requestVersion = 0;

  displayedCargoColumns: string[] = [
    'descripcion',
    'orientacion',
    'turno',
    'codigo',
    'curso',
    'division',
    'cargaHoraria',
    'acciones',
  ];

  cargos: CargoResponseDto[] = [];

  cargoPage = 1;
  cargoPageSize = 50;
  cargoTotalItems = 0;

  loadingCargos = false;
  cargoErrorMessage = '';

  private cargoRequestVersion = 0;

  ngOnInit(): void {
    this.cargarActos();
  }

  cargarActos(): void {
    const version = ++this.requestVersion;

    this.loading = true;
    this.errorMessage = '';

    const request: ActoQueryRequest = {
      page: this.page,
      pageSize: this.pageSize,
      search: this.appliedSearch,
      puedeCargarCargos: this.appliedPuedeCargarCargos,
    };

    this.actoService
      .getPaged(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (version === this.requestVersion) {
            this.loading = false;
            this.cdr.markForCheck();
          }
        }),
      )
      .subscribe({
        next: (response) => {
          if (version !== this.requestVersion) return;

          this.actos = response.items;
          this.totalItems = response.totalItems;
          this.page = response.page;
          this.pageSize = response.pageSize;

          this.cdr.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          if (version !== this.requestVersion) return;

          this.actos = [];
          this.totalItems = 0;

          this.errorMessage = error.error?.message ?? 'No se pudo cargar el listado de actos.';

          this.cdr.markForCheck();
        },
      });
  }

  buscar(): void {
    this.appliedSearch = this.search.trim();
    this.appliedPuedeCargarCargos = this.puedeCargarCargos;
    this.page = 1;
    this.actoSeleccionado = null;
    this.cargarActos();
  }

  limpiarFiltros(): void {
    this.search = '';
    this.puedeCargarCargos = null;
    this.buscar();
  }

  cambiarPagina(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.cargarActos();
  }

  verCargos(acto: ActoResponseDto): void {
    this.actoSeleccionado = acto;

    this.cargoPage = 1;
    this.cargoPageSize = 50;

    this.cargos = [];
    this.cargoTotalItems = 0;

    this.cargarCargos();
  }

  cargarCargos(): void {
    if (!this.actoSeleccionado) return;

    const version = ++this.cargoRequestVersion;

    this.loadingCargos = true;
    this.cargoErrorMessage = '';

    this.cargoService
      .getPaged({
        page: this.cargoPage,
        pageSize: this.cargoPageSize,
        actoId: this.actoSeleccionado.id,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (version === this.cargoRequestVersion) {
            this.loadingCargos = false;
            this.cdr.markForCheck();
          }
        }),
      )
      .subscribe({
        next: (response) => {
          if (version !== this.cargoRequestVersion) return;

          this.cargos = response.items;
          this.cargoTotalItems = response.totalItems;
          this.cargoPage = response.page;
          this.cargoPageSize = response.pageSize;

          this.cdr.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          if (version !== this.cargoRequestVersion) return;

          this.cargos = [];

          this.cargoErrorMessage =
            error.error?.message ?? 'No se pudo cargar el listado de cargos.';

          this.cdr.markForCheck();
        },
      });
  }

  cambiarPaginaCargos(event: PageEvent): void {
    this.cargoPage = event.pageIndex + 1;
    this.cargoPageSize = event.pageSize;

    this.cargarCargos();
  }

  agregarCargo(): void {
    const acto = this.actoSeleccionado;

    if (!acto || !acto.puedeCargarCargos) return;

    const ref = this.dialog.open(CargoDialog, {
      width: '850px',
      maxWidth: '95vw',
      maxHeight: '95dvh',
      autoFocus: false,
      disableClose: true,
      data: {
        acto,
        cargo: null,
      },
    });

    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result === true) {
          this.cargoPage = 1;
          this.cargarCargos();
          this.cargarActos();
        }
      });
  }

  editarCargo(cargo: CargoResponseDto): void {
    const acto = this.actoSeleccionado;

    if (!acto || !acto.puedeCargarCargos || cargo.actoId !== acto.id) {
      return;
    }

    const ref = this.dialog.open(CargoDialog, {
      width: '850px',
      maxWidth: '95vw',
      maxHeight: '95dvh',
      autoFocus: false,
      disableClose: true,
      data: {
        acto,
        cargo,
      },
    });

    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result === true) {
          this.cargarCargos();
          this.cargarActos();
        }
      });
  }

  getNombreTurno(turno: Turno): string {
    switch (turno) {
      case Turno.MANANA:
        return 'Mañana';

      case Turno.TARDE:
        return 'Tarde';

      case Turno.VESPERTINO:
        return 'Vespertino';

      default:
        return 'Sin especificar';
    }
  }

  cerrarSeleccion(): void {
    ++this.cargoRequestVersion;

    this.actoSeleccionado = null;
    this.cargos = [];
    this.cargoTotalItems = 0;
    this.cargoErrorMessage = '';
    this.loadingCargos = false;
  }

  verInscriptos(cargo: CargoResponseDto): void {
    this.router.navigate(['/gestion-cargos', cargo.id, 'inscriptos'], {
      state: {
        cargo,
        acto: this.actoSeleccionado,
      },
    });
  }
}
