import api from './api';

const RESOURCE = '/inventariador-v2/carga-firmas';

export interface CargaFirma {
  id?: number;
  codCarga?: number;
  codLocal?: number;
  codArea?: number;
  codOficina?: number;
  codResponsable?: number;
  firma?: string; // base64
  nombreResponsable?: string;
  nombreOficina?: string;
}

export const cargaFirmaService = {
  listarPorCarga: async (codCarga: number): Promise<CargaFirma[]> => {
    const response = await api.get<CargaFirma[]>(`${RESOURCE}/por-carga/${codCarga}`);
    return response.data;
  },
};