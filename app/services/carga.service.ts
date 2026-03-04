import api from './api';
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

export interface RangoDistribucion {
  inicio: number;
  fin: number;
  codResponsable?: number;
  codInventariador?: number;
}

export interface UbicacionUnica {
  codLocalUnico: number;
  codAreaUnica: number;
  codOficinaUnica: number;
}

// ✅ NUEVA INTERFAZ: Para el detalle de carga
export interface DetalleCarga {
  id: number; // ✅ Agregar esta línea
  idDetalle?: number; // Opcional, por si acaso
  codActivo?: string;
  inventariado?: string;
  fechainventario?: string;   // ← AGREGAR
  obs?: string;               // ← AGREGAR
  modificado?: number;          // ← AGREGAR
  codEstado?: number;
  activo?: {
    codActivo?: string;
    descripcion?: string;
    oficina?: {
      codOficina?: number;
      nombreOficina?: string;
    };
  };
  responsable?: {
    codResponsable?: number;
    nombreResponsable?: string;
  };
  inventariador?: {
    codInventariador?: number;
    nombre?: string;
  };
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

  asignar: async (codCarga: number, codUsuario: number): Promise<void> => {
    await api.post(`${RESOURCE}/${codCarga}/asignar/${codUsuario}`);
  },

  subirArchivoConMapeo: async (
    codCarga: number,
    archivo: File,
    mapeo: Record<string, string>,
    configuracion: CampoConfig[],
    ubicacionUnica?: UbicacionUnica
  ): Promise<CargaMasivaResponse> => {
    const formData = new FormData();
    formData.append('file', archivo);
    formData.append('mapeo', JSON.stringify(mapeo));
    formData.append('configuracion', JSON.stringify(configuracion));

    if (ubicacionUnica) {
      formData.append('codLocalUnico', ubicacionUnica.codLocalUnico.toString());
      formData.append('codAreaUnica', ubicacionUnica.codAreaUnica.toString());
      formData.append('codOficinaUnica', ubicacionUnica.codOficinaUnica.toString());
    }

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

  obtenerConteo: async (codCarga: number): Promise<number> => {
    const response = await api.get<{ total: number }>(`${RESOURCE}/${codCarga}/conteo`);
    return response.data.total;
  },

  distribuir: async (codCarga: number, distribuciones: RangoDistribucion[]): Promise<void> => {
    await api.post(`${RESOURCE}/${codCarga}/distribuir`, distribuciones);
  },

  // ✅ CORREGIDO: Tipo específico en lugar de any[]
  obtenerDetalle: async (codCarga: number): Promise<DetalleCarga[]> => {
    const response = await api.get<DetalleCarga[]>(`${RESOURCE}/${codCarga}/detalle`);
    return response.data;
  },

  obtenerPorId: async (codCarga: number): Promise<Carga> => {
    const response = await api.get<Carga>(`${RESOURCE}/${codCarga}`);
    return response.data;
  }

  
};