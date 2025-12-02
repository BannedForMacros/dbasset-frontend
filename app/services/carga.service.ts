import api from './api';
// Asegúrate de que este archivo y la exportación existan
import { CampoConfig } from './configuracion.service'; 

const RESOURCE = '/cargas';

export interface Carga {
  codCarga?: number;
  descripcion: string;
  estado?: string; 
  fecha?: string;
  activo?: boolean;
  codEmpresa?: number;
}

export interface CargaMasivaResponse {
  mensaje: string;
  totalProcesados?: number;
  errores?: string[];
}

// ✅ INTERFAZ ACTUALIZADA PARA LA DISTRIBUCIÓN
// Ahora apunta a 'codResponsable' (tabla Responsable) en lugar de 'codUsuario'
export interface RangoDistribucion {
  inicio: number;
  fin: number;
  codResponsable: number; // <--- CAMBIO AQUÍ
}

export const cargaService = {
  listarTodas: async (): Promise<Carga[]> => {
    const response = await api.get<Carga[]>(RESOURCE);
    return response.data;
  },

  crear: async (descripcion: string): Promise<Carga> => {
    const response = await api.post<Carga>(RESOURCE, { descripcion });
    return response.data;
  },

  // Método Legacy (Asignar la carga completa a un usuario del sistema para inventariar)
  // Se mantiene por si necesitas delegar la tarea de inventario a alguien.
  asignar: async (codCarga: number, codUsuario: number): Promise<void> => {
    await api.post(`${RESOURCE}/${codCarga}/asignar/${codUsuario}`);
  },

  subirArchivoConMapeo: async (
    codCarga: number, 
    archivo: File, 
    mapeo: Record<string, string>,
    configuracion: CampoConfig[] 
  ): Promise<CargaMasivaResponse> => {
    
    const formData = new FormData();
    formData.append('file', archivo);
    formData.append('mapeo', JSON.stringify(mapeo));
    formData.append('configuracion', JSON.stringify(configuracion)); 

    const response = await api.post<CargaMasivaResponse>(
      `${RESOURCE}/${codCarga}/importar-mapeado`, 
      formData, 
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Subiendo: ${percent}%`);
          }
        }
      }
    );
    return response.data;
  },

  // ✅ Obtener conteo de filas (Para la barra de progreso)
  obtenerConteo: async (codCarga: number): Promise<number> => {
    const response = await api.get<{ total: number }>(`${RESOURCE}/${codCarga}/conteo`);
    return response.data.total;
  },

  // ✅ Enviar la distribución por rangos (Asignando Responsables)
  distribuir: async (codCarga: number, distribuciones: RangoDistribucion[]): Promise<void> => {
    await api.post(`${RESOURCE}/${codCarga}/distribuir`, distribuciones);
  }
};