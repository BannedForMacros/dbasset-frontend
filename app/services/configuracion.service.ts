import api from './api';

const RESOURCE = '/configuracion-campos';

export interface CampoConfig {
  id: number;
  nombreCampoBd: string;   // 'codActivo', 'serie'
  etiquetaUsuario: string; // 'Código de Barras', 'Nro Serie'
  esVisible: boolean;
  esObligatorio: boolean;
  orden: number;
  codEmpresa?: number; // ✅ Agregar esto
}

export const configuracionService = {
  obtenerCampos: async (): Promise<CampoConfig[]> => {
    const response = await api.get<CampoConfig[]>(RESOURCE);
    console.log('🔧 Campos obtenidos:', response.data); // ✅ Debug
    return response.data;
  }
};