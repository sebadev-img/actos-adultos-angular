export interface PostulanteAddOrUpdateDto {
  dni: number;
  nombres: string;
  apellidos: string;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  altura?: string | null;
  depto?: string | null;
  ciudadId: number;
}

export interface PostulanteResponseDto {
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

  usuarioId: string;

  fechaCreacion: string;
  fechaActualizacion: string | null;

  creadoPor: string | null;
  actualizadoPor: string | null;
}

export interface PostulanteAddOrUpdateResponse {
  message: string;
  postulante: PostulanteResponseDto;
}

export interface PostulanteErrorResponse {
  message: string;
  code?: string;
}

export interface PostulanteQueryRequest {
  page: number;
  pageSize: number;
  search?: string | null;
  ciudadId?: number | null;
}

export interface PagedResponse<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
}
