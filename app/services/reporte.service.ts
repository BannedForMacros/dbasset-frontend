import api from './api';
import { Baja } from './baja.service';
import { Transferencia } from './transferencia.service';

export interface AltaReporte {
  idActivo: number;
  codActivo: string;
  descripcion?: string;
  categoria?: string;
  serie?: string;
  epc?: string;
  situacion: string;
  local?: string; area?: string; oficina?: string; responsable?: string;
  fechaAlta: string;
}

export const reporteService = {
  altasBajas: async (desde?: string, hasta?: string): Promise<{ desde: string; hasta: string; altas: AltaReporte[]; bajas: Baja[] }> =>
    (await api.get('/reportes/altas-bajas', { params: { desde, hasta } })).data,

  transferencias: async (desde?: string, hasta?: string, estado?: string): Promise<{ desde: string; hasta: string; transferencias: Transferencia[] }> =>
    (await api.get('/reportes/transferencias', { params: { desde, hasta, estado: estado || undefined } })).data,
};
