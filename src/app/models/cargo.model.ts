export interface CargoHorarioDto {
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
}

export interface CargoCreateDto {
  actoId: number;
  orientacionId: number;
  turno: Turno;
  descripcion: string;
  codigo: number;
  numeroLLamado: number;
  revista: Revista;
  curso: number;
  division: string;
  plazaSUNA: string;
  cargaHoraria: string;
  codigoJunta: string;
  horarios: CargoHorarioDto[];
}

export interface CargoUpdateDto extends CargoCreateDto {}

export interface CargoResponseDto extends CargoCreateDto {
  id: number;
  actoDescripcion: string;
  institucionId: number;
  institucionNombre: string;
  orientacionDescripcion: string;
  fechaCreacion: string;
  fechaActualizacion: string | null;
}

export interface CargoQueryRequest {
  page: number;
  pageSize: number;
  search?: string | null;
  actoId?: number | null;
  institucionId?: number | null;
  orientacionId?: number | null;
  turno?: number | null;
}

export interface CargoCreateResponse {
  message: string;
  cargoId: number;
}

export interface CargoUpdateResponse {
  message: string;
  cargo: CargoResponseDto | null;
}

export interface PagedResponse<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
}

export enum Turno {
  MANANA = 0,
  TARDE = 1,
  VESPERTINO = 2,
}

export enum Revista {
  TITULAR = 0,
  INTERINO = 1,
  SUPLENTE = 2,
}
