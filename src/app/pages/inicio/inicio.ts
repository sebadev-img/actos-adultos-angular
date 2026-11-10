import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { DetalleCargoDialog } from './dialogs/detalle-cargo-dialog/detalle-cargo-dialog';

import { ActoService } from '../../services/acto.service';

import { ActoDisponibleDto, CargoDisponibleDto } from '../../models/acto-disponible.model';

import { Turno, Revista } from '../../models/cargo.model';

import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../services/auth.service';
import { PostulanteService } from '../../services/postulante.service';

import { PostulacionDialog } from './dialogs/postulacion-dialog/postulacion-dialog';
import { PerfilRequeridoDialog } from './dialogs/perfil-requerido-dialog/perfil-requerido-dialog';
import { LoginRequeridoDialog } from './dialogs/login-requerido-dialog/login-requerido-dialog';

interface FiltroOpcion {
  id: number;
  nombre: string;
}

interface ActoFiltrado extends ActoDisponibleDto {
  cargos: CargoDisponibleDto[];
}

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio implements OnInit {
  private readonly actoService = inject(ActoService);
  private readonly authService = inject(AuthService);
  private readonly postulanteService = inject(PostulanteService);

  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  actos: ActoDisponibleDto[] = [];
  actosFiltrados: ActoFiltrado[] = [];
  cargosFiltrados: { acto: ActoDisponibleDto; cargo: CargoDisponibleDto }[] = [];

  instituciones: FiltroOpcion[] = [];
  orientaciones: FiltroOpcion[] = [];

  search = '';
  institucionId: number | null = null;
  orientacionId: number | null = null;
  turno: Turno | null = null;
  revista: Revista | null = null;
  ciudades: string[] = [];

  ciudadNombre: string | null = null;

  private filtroCiudadInicialAplicado = false;

  loading = false;
  errorMessage = '';

  totalCargos = 0;
  totalCargosFiltrados = 0;

  postulandoCargoId: number | null = null;
  readonly Turno = Turno;
  readonly Revista = Revista;

  readonly turnos = [
    { value: Turno.MANANA, label: 'Mañana' },
    { value: Turno.TARDE, label: 'Tarde' },
    { value: Turno.VESPERTINO, label: 'Vespertino' },
  ];

  readonly revistas = [
    //{ value: Revista.TITULAR, label: 'Titular' },
    { value: Revista.INTERINO, label: 'Interino' },
    { value: Revista.SUPLENTE, label: 'Suplente' },
  ];

  readonly diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  ngOnInit(): void {
    this.cargarDisponibles();
  }

  cargarDisponibles(): void {
    this.loading = true;
    this.errorMessage = '';

    this.actoService
      .getDisponibles()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (actos) => {
          this.actos = actos;
          this.totalCargos = actos.reduce((total, acto) => total + acto.cargos.length, 0);

          this.construirOpcionesFiltros();

          if (!this.filtroCiudadInicialAplicado) {
            this.aplicarFiltroCiudadPostulante();
          } else {
            this.aplicarFiltros();
          }

          this.cdr.markForCheck();
        },

        error: (error: HttpErrorResponse) => {
          this.actos = [];
          this.actosFiltrados = [];
          this.cargosFiltrados = [];
          this.totalCargos = 0;
          this.totalCargosFiltrados = 0;

          this.errorMessage =
            error.error?.message ?? 'No se pudieron cargar los cargos disponibles.';

          this.cdr.markForCheck();
        },
      });
  }

  private construirOpcionesFiltros(): void {
    const instituciones = new Map<number, string>();
    const orientaciones = new Map<number, string>();
    const ciudades = new Set<string>();

    for (const acto of this.actos) {
      for (const cargo of acto.cargos) {
        instituciones.set(cargo.institucionId, cargo.institucionNombre);

        orientaciones.set(cargo.orientacionId, cargo.orientacionDescripcion);

        if (cargo.ciudadNombre) {
          ciudades.add(cargo.ciudadNombre);
        }
      }
    }

    this.instituciones = Array.from(instituciones, ([id, nombre]) => ({
      id,
      nombre,
    })).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    this.orientaciones = Array.from(orientaciones, ([id, nombre]) => ({
      id,
      nombre,
    })).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));

    this.ciudades = Array.from(ciudades).sort((a, b) => a.localeCompare(b, 'es'));
  }

  private aplicarFiltroCiudadPostulante(): void {
    this.filtroCiudadInicialAplicado = true;

    // Sin sesión, mostramos todas las ciudades.
    if (!this.authService.isAuthenticated()) {
      this.aplicarFiltros();
      return;
    }

    // Institución no tiene Postulante asociado.
    if (!this.authService.hasRole('docente') && !this.authService.hasRole('admin')) {
      this.aplicarFiltros();
      return;
    }

    this.postulanteService
      .getMiPostulante()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (postulante) => {
          if (postulante?.ciudadNombre) {
            this.ciudadNombre = postulante.ciudadNombre;
          }

          this.aplicarFiltros();
          this.cdr.markForCheck();
        },

        error: () => {
          // Si el usuario no tiene postulante,
          // simplemente mostramos todas las ciudades.
          this.aplicarFiltros();
          this.cdr.markForCheck();
        },
      });
  }

  aplicarFiltros(): void {
    const texto = this.normalizar(this.search);
    const ciudadSeleccionada = this.normalizar(this.ciudadNombre);

    this.actosFiltrados = this.actos
      .map((acto) => {
        const cargos = acto.cargos.filter((cargo) => {
          const coincideTexto =
            !texto ||
            [
              cargo.descripcion,
              cargo.institucionNombre,
              cargo.orientacionDescripcion,
              cargo.codigo.toString(),
              cargo.codigoJunta,
              cargo.plazaSUNA,
              acto.numero,
              acto.descripcion,
            ].some((valor) => this.normalizar(valor).includes(texto));

          const coincideCiudad =
            !ciudadSeleccionada || this.normalizar(cargo.ciudadNombre) === ciudadSeleccionada;

          const coincideInstitucion =
            this.institucionId === null || cargo.institucionId === this.institucionId;

          const coincideOrientacion =
            this.orientacionId === null || cargo.orientacionId === this.orientacionId;

          const coincideTurno = this.turno === null || cargo.turno === this.turno;

          const coincideRevista = this.revista === null || cargo.revista === this.revista;

          return (
            coincideTexto &&
            coincideCiudad &&
            coincideInstitucion &&
            coincideOrientacion &&
            coincideTurno &&
            coincideRevista
          );
        });

        return { ...acto, cargos };
      })
      .filter((acto) => acto.cargos.length > 0);

    this.cargosFiltrados = this.actosFiltrados.flatMap((acto) =>
      acto.cargos.map((cargo) => ({ acto, cargo })),
    );

    this.totalCargosFiltrados = this.actosFiltrados.reduce(
      (total, acto) => total + acto.cargos.length,
      0,
    );
  }

  limpiarFiltros(): void {
    this.search = '';

    this.ciudadNombre = null;
    this.institucionId = null;
    this.orientacionId = null;
    this.turno = null;
    this.revista = null;

    this.aplicarFiltros();
  }

  get filtrosActivos(): boolean {
    return Boolean(
      this.search.trim() ||
      this.ciudadNombre !== null ||
      this.institucionId !== null ||
      this.orientacionId !== null ||
      this.turno !== null ||
      this.revista !== null,
    );
  }

  seleccionarCiudad(ciudad: string | null): void {
    this.ciudadNombre = ciudad;
    this.aplicarFiltros();
  }

  seleccionarTurno(turno: Turno | null): void {
    this.turno = turno;
    this.aplicarFiltros();
  }

  seleccionarRevista(revista: Revista | null): void {
    this.revista = revista;
    this.aplicarFiltros();
  }

  esCiudadSeleccionada(ciudad: string): boolean {
    return this.normalizar(this.ciudadNombre) === this.normalizar(ciudad);
  }

  verDetalle(acto: ActoDisponibleDto, cargo: CargoDisponibleDto): void {
    this.dialog.open(DetalleCargoDialog, {
      width: '720px',
      maxWidth: '95vw',
      maxHeight: '92dvh',
      autoFocus: false,
      data: { acto, cargo },
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
        return 'No especificado';
    }
  }

  getNombreRevista(revista: Revista): string {
    switch (revista) {
      case Revista.TITULAR:
        return 'Titular';
      case Revista.INTERINO:
        return 'Interino';
      case Revista.SUPLENTE:
        return 'Suplente';
      default:
        return 'No especificada';
    }
  }

  getNombreDia(dia: number): string {
    return this.diasSemana[dia] ?? 'Día desconocido';
  }

  private normalizar(valor: string | number | null | undefined): string {
    return String(valor ?? '')
      .toLocaleLowerCase('es')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  postular(cargo: CargoDisponibleDto): void {
    if (!this.authService.isAuthenticated()) {
      this.abrirDialogLoginRequerido();
      return;
    }

    if (!this.authService.hasRole('docente') && !this.authService.hasRole('admin')) {
      this.snackBar.open('Tu usuario no tiene permisos para postularse a cargos.', 'Cerrar', {
        duration: 5000,
      });

      return;
    }

    if (this.postulandoCargoId !== null) {
      return;
    }

    this.postulandoCargoId = cargo.id;

    this.postulanteService
      .getMiPostulante()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.postulandoCargoId = null;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.abrirDialogPostulacion(cargo);
        },

        error: (error: HttpErrorResponse) => {
          if (error.status === 404) {
            this.dialog.open(PerfilRequeridoDialog, {
              width: '480px',
              maxWidth: '94vw',
              autoFocus: false,
            });

            return;
          }

          if (error.status === 401) {
            this.router.navigate(['/login'], {
              queryParams: {
                returnUrl: '/inicio',
              },
            });

            return;
          }

          this.snackBar.open(
            error.error?.message ?? 'No se pudo verificar tu perfil de postulante.',
            'Cerrar',
            {
              duration: 5000,
            },
          );
        },
      });
  }

  private abrirDialogPostulacion(cargo: CargoDisponibleDto): void {
    const dialogRef = this.dialog.open(PostulacionDialog, {
      width: '620px',
      maxWidth: '94vw',
      disableClose: true,
      autoFocus: false,

      data: {
        cargoId: cargo.id,
        cargoDescripcion: cargo.descripcion,
        institucionNombre: cargo.institucionNombre,
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((message: string | undefined) => {
        if (!message) {
          return;
        }

        // La inscripción fue realizada correctamente.
        // Recargar para actualizar estaInscripto.
        this.cargarDisponibles();
      });
  }

  private abrirDialogLoginRequerido(): void {
    const dialogRef = this.dialog.open(LoginRequeridoDialog, {
      width: '460px',
      maxWidth: '94vw',
      autoFocus: false,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((iniciarSesion: boolean) => {
        if (!iniciarSesion) {
          return;
        }

        this.router.navigate(['/login'], {
          queryParams: {
            returnUrl: '/inicio',
          },
        });
      });
  }
}
