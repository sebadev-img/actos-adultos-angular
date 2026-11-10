import { Turno, Revista, CargoHorarioDto } from './cargo.model';

export interface CargoDisponibleDto {
  id: number;

  institucionId: number;
  institucionNombre: string;

  ciudadId: number;
  ciudadNombre: string;

  orientacionId: number;
  orientacionDescripcion: string;

  descripcion: string;
  codigo: number;
  numeroLLamado: number;

  turno: Turno;
  revista: Revista;

  curso: number;
  division: string;
  plazaSUNA: string;
  cargaHoraria: string;
  codigoJunta: string;

  horarios: CargoHorarioDto[];

  estaInscripto: boolean;
}

export interface ActoDisponibleDto {
  id: number;
  numero: string;
  descripcion: string;
  inicio: string;
  fin: string;
  cargos: CargoDisponibleDto[];
}
