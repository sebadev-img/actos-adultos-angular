export interface OrientacionResponseDto {
  id: number;
  descripcion: string;
  fechaCreacion: string;
  creadoPor: string | null;
  fechaActualizacion: string | null;
  actualizadoPor: string | null;
}

export interface OrientacionCreateDto {
  descripcion: string;
}

export interface OrientacionUpdateDto extends OrientacionCreateDto {}

export interface OrientacionQueryRequest {
  page: number;
  pageSize: number;
  search?: string | null;
}

export interface OrientacionApiResponse {
  message: string;
  orientacion: OrientacionResponseDto | null;
}

export interface OrientacionDeleteResponse {
  message: string;
}

export interface PagedResponse<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
}
