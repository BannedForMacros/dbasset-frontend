import api from './api';

const RESOURCE = '/cargas';

// Interfaz para el objeto Carga
export interface Carga {
  codCarga?: number;
  descripcion: string;
  estado?: string; // 'C'=Creada, 'A'=Asignada, 'T'=Terminada
  fecha?: string;
  activo?: boolean;
}

// Interfaz para la respuesta de la carga masiva (Adiós 'any')
export interface CargaMasivaResponse {
  mensaje: string;
  totalProcesados?: number;
  errores?: string[];
}

export const cargaService = {
  // Listar todas las cargas
  listarTodas: async (): Promise<Carga[]> => {
    const response = await api.get<Carga[]>(RESOURCE);
    return response.data;
  },

  // Crear una nueva carga
  crear: async (descripcion: string): Promise<Carga> => {
    const response = await api.post<Carga>(RESOURCE, { descripcion });
    return response.data;
  },

  // Asignar carga a un usuario
  asignar: async (codCarga: number, codUsuario: number): Promise<void> => {
    await api.post(`${RESOURCE}/${codCarga}/asignar/${codUsuario}`);
  },

  // Subir archivo Excel/XML (Corregido sin 'any')
  subirArchivo: async (codCarga: number, archivo: File): Promise<CargaMasivaResponse> => {
    const formData = new FormData();
    // 'file' debe coincidir con el nombre del parámetro en tu Controller Java (@RequestParam("file"))
    formData.append('file', archivo); 

    const response = await api.post<CargaMasivaResponse>(
      `${RESOURCE}/${codCarga}/importar`, 
      formData, 
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Subiendo: ${percentCompleted}%`);
          }
        }
      }
    );
    
    return response.data;
  }
};