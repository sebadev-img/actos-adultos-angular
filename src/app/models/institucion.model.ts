// RESPUESTA DE INSTITUCIÓN
export interface InstitucionResponseDto {
  id: number;
  descripcion: string;

  ciudadId: number;
  ciudadNombre: string;

  usuarioId: string | null;
  usuarioEmail: string | null;

  fechaCreacion: string;
  fechaActualizacion: string | null;

  creadoPor: string | null;
  actualizadoPor: string | null;
}

// CREAR INSTITUCIÓN
export interface InstitucionCreateDto {
  descripcion: string;
  ciudadId: number;
}

// ACTUALIZAR INSTITUCIÓN
export interface InstitucionUpdateDto extends InstitucionCreateDto {}

// FILTROS Y PAGINACIÓN
export interface InstitucionQueryRequest {
  page: number;
  pageSize: number;
  search?: string | null;
  ciudadId?: number | null;
  tieneUsuario?: boolean | null;
}

// ASIGNAR USUARIO
export interface AsignarUsuarioDto {
  usuarioId: string;
}

// RESPUESTA PAGINADA
export interface PagedResponse<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
}

// RESPUESTA ACTUALIZACIÓN
export interface InstitucionUpdateResponse {
  message: string;
  institucion: InstitucionResponseDto;
}

// RESPUESTA MENSAJE
export interface InstitucionMessageResponse {
  message: string;
}

// RESPUESTA DE MI INSTITUCIÓN
export interface MiInstitucionResponseDto {
  id: number;
  descripcion: string;
  ciudadId: number;
  ciudadNombre: string;
}

export interface InstitucionSelectDto {
  id: number;
  descripcion: string;
}
