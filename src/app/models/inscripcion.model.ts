import { Revista, Turno } from './cargo.model';

export enum EstadoInscripcion {
  INSCRIPCION = 0,
  ASIGNADO = 1,
}

export enum Caracter {
  DOCENTE = 0,
  HABILITANTE = 1,
  SUPLETORIO = 2,
  EXCLUSION = 3,
}

export interface InscripcionCreateDto {
  cargoId: number;
}

export interface InscripcionResponseDto {
  id: number;
  cargoId: number;
  postulanteId: number;

  estadoInscripcion: EstadoInscripcion;

  puntajeJunta: number | null;
  caracter: Caracter | null;

  fechaCreacion: string;
}

export interface InscripcionCreateResponse {
  message: string;
  inscripcion: InscripcionResponseDto;
  datosJuntaDisponibles: boolean;
}

export interface PostulanteInscripcionDto {
  id: number;

  dni: number;

  nombres: string;
  apellidos: string;
  nombreCompleto: string;

  email: string | null;
  telefono: string | null;

  direccion: string | null;
  altura: string | null;
  depto: string | null;

  ciudadId: number;
  ciudadNombre: string;
}

export interface CargoInscripcionDto {
  id: number;

  actoId: number;
  actoNumero: string;
  actoDescripcion: string;

  institucionId: number;
  institucionNombre: string;

  orientacionId: number;
  orientacionDescripcion: string;

  descripcion: string;

  codigo: number;
  numeroLlamado: number;

  turno: Turno;
  revista: Revista;

  curso: number;
  division: string;

  plazaSUNA: string;
  cargaHoraria: string;
  codigoJunta: string;
}

export interface InscripcionListadoDto {
  id: number;

  estadoInscripcion: EstadoInscripcion;
  fechaAsignacion: string | null;

  puntajeJunta: number | null;
  caracter: Caracter | null;

  fechaCreacion: string;

  postulante: PostulanteInscripcionDto;
  cargo: CargoInscripcionDto;
}

export interface PagedResponse<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
}

export interface AsignarInscripcionDto {
  inscripcionId: number;
}

export interface AsignarInscripcionResponseDto {
  id: number;
  cargoId: number;
  postulanteId: number;
  estadoInscripcion: EstadoInscripcion;
  fechaAsignacion: string | null;
}

export interface AsignarInscripcionResponse {
  message: string;
  inscripcion: AsignarInscripcionResponseDto;
}
