export interface ActoResponseDto {
  id: number;
  numero: string;
  descripcion: string;
  inicio: string;
  fin: string;
  esActivo: boolean;
  permiteCargaCargos: boolean;
  puedeCargarCargos: boolean;
  fechaCreacion: string;
  fechaActualizacion: string | null;
  creadoPor: string | null;
  actualizadoPor: string | null;
}

export interface ActoCreateDto {
  numero: string;
  descripcion: string;
  inicio: string;
  fin: string;
  esActivo: boolean;
  permiteCargaCargos: boolean;
}

export interface ActoUpdateDto extends ActoCreateDto {}

export interface ActoQueryRequest {
  page: number;
  pageSize: number;
  search?: string | null;
  fechaDesde?: string | null;
  fechaHasta?: string | null;
  permiteCargaCargos?: boolean | null;
  puedeCargarCargos?: boolean | null;
}

export interface PagedResponse<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
}

export interface ActoUpdateResponse {
  message: string;
  acto: ActoResponseDto | null;
}

export interface ApiMessageResponse {
  message: string;
}
