'use client';

import { useRouter } from 'next/navigation';
import { MdWarning } from 'react-icons/md';
import UbicacionSelector from '../UbicacionSelector';
import { Local } from '../../../../../services/local.service';
import { Area } from '../../../../../services/area.service';
import { Oficina } from '../../../../../services/oficina.service';

interface Step4UbicacionProps {
  locales: Local[];
  areas: Area[];
  oficinas: Oficina[];
  onUbicacionComplete: (local: number, area: number, oficina: number) => void;
}

export default function Step4Ubicacion({ 
  locales, 
  areas, 
  oficinas, 
  onUbicacionComplete 
}: Step4UbicacionProps) {
  const router = useRouter();

  // ✅ Validar si faltan datos
  const faltaLocal = locales.length === 0;
  const faltaArea = areas.length === 0;
  const faltaOficina = oficinas.length === 0;

  const tieneProblemas = faltaLocal || faltaArea || faltaOficina;

  const handleIrAConfiguracion = () => {
    if (confirm('Se cancelará el proceso de carga actual. ¿Desea continuar?')) {
      router.push('/dashboard/config-organizacional');
    }
  };

  if (tieneProblemas) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <MdWarning className="text-red-600 shrink-0 mt-1" size={32} />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-800 mb-2">
                ⚠️ Configuración Incompleta
              </h3>
              <p className="text-red-700 mb-4">
                No puede continuar porque su empresa no tiene configurada la estructura organizacional completa:
              </p>
              
              <ul className="space-y-2 mb-6">
                {faltaLocal && (
                  <li className="flex items-center gap-2 text-red-700">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <strong>Locales/Sedes:</strong> No tiene ningún local registrado
                  </li>
                )}
                {faltaArea && (
                  <li className="flex items-center gap-2 text-red-700">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <strong>Áreas:</strong> No tiene ninguna área registrada
                  </li>
                )}
                {faltaOficina && (
                  <li className="flex items-center gap-2 text-red-700">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <strong>Oficinas:</strong> No tiene ninguna oficina registrada
                  </li>
                )}
              </ul>

              <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-4">
                <p className="text-sm text-amber-800">
                  <strong>Nota:</strong> Para importar activos, debe tener al menos:
                  <br/>• 1 Local/Sede
                  <br/>• 1 Área
                  <br/>• 1 Oficina
                </p>
              </div>

              <button
                onClick={handleIrAConfiguracion}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-bold transition flex items-center justify-center gap-2"
              >
                Ir a Configuración Organizacional
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <UbicacionSelector
        locales={locales}
        areas={areas}
        oficinas={oficinas}
        onUbicacionComplete={onUbicacionComplete}
      />
    </div>
  );
}