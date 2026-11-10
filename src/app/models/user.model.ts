export type UserRole = 'admin' | 'institucion' | 'docente';

export interface UserResponseDto {
  id: string;
  email: string;
  userName: string | null;
  emailConfirmed: boolean;
  role: string | null;
  institucionId: number | null;
  institucionNombre: string | null;
}

export interface UserQueryRequest {
  page: number;
  pageSize: number;
  search?: string | null;
  role?: string | null;
  soloDisponiblesInstitucion?: boolean;
}

export interface ChangeUserRoleDto {
  role: UserRole;
}

export interface ChangeUserRoleResponse {
  message: string;
  userId: string;
  role: string;
}

export interface PagedResponse<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
}

export interface UserErrorResponse {
  message: string;
  errors?: string[];
}
