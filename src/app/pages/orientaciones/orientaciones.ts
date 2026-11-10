import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';

import { OrientacionService } from '../../services/orientacion.service';
import { OrientacionResponseDto } from '../../models/orientacion.model';

import { OrientacionDialog } from './dialogs/orientacion-dialog/orientacion-dialog';

@Component({
  selector: 'app-orientaciones',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './orientaciones.html',
  styleUrl: './orientaciones.scss',
})
export class Orientaciones implements OnInit {
  private readonly service = inject(OrientacionService);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  displayedColumns: string[] = ['descripcion', 'acciones'];

  orientaciones: OrientacionResponseDto[] = [];

  search = '';
  appliedSearch = '';

  page = 1;
  pageSize = 10;
  totalItems = 0;

  loading = false;
  errorMessage = '';

  private requestVersion = 0;

  ngOnInit(): void {
    this.cargarOrientaciones();
  }

  cargarOrientaciones(): void {
    const version = ++this.requestVersion;

    this.loading = true;
    this.errorMessage = '';

    this.service
      .getPaged({
        page: this.page,
        pageSize: this.pageSize,
        search: this.appliedSearch,
      })
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

          this.orientaciones = response.items;
          this.totalItems = response.totalItems;
          this.page = response.page;
          this.pageSize = response.pageSize;

          this.cdr.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          if (version !== this.requestVersion) return;

          this.orientaciones = [];
          this.errorMessage =
            error.error?.message ?? 'No se pudo cargar el listado de orientaciones.';

          this.cdr.markForCheck();
        },
      });
  }

  buscar(): void {
    this.appliedSearch = this.search.trim();
    this.page = 1;
    this.cargarOrientaciones();
  }

  limpiarBusqueda(): void {
    this.search = '';
    this.appliedSearch = '';
    this.page = 1;
    this.cargarOrientaciones();
  }

  cambiarPagina(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.cargarOrientaciones();
  }

  agregar(): void {
    const ref = this.dialog.open(OrientacionDialog, {
      width: '500px',
      maxWidth: '95vw',
      autoFocus: false,
      data: {
        orientacion: null,
      },
    });

    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result === true) {
          this.page = 1;
          this.cargarOrientaciones();
        }
      });
  }

  editar(orientacion: OrientacionResponseDto): void {
    const ref = this.dialog.open(OrientacionDialog, {
      width: '500px',
      maxWidth: '95vw',
      autoFocus: false,
      data: {
        orientacion,
      },
    });

    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result === true) {
          this.cargarOrientaciones();
        }
      });
  }

  formatearFecha(value: string): string {
    if (!value) return '-';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}
