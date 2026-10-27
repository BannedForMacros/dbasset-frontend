'use client';

import { useRouter } from 'next/navigation';
import { MdWarning, MdSettings } from 'react-icons/md';
import UbicacionSelector from '../UbicacionSelector';
import { Local } from '../../../../../services/local.service';
import { Area } from '../../../../../services/area.service';
import { Oficina } from '../../../../../services/oficina.service';
import { Boton } from '@/app/components/rfid/ui';

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

  // Validar si faltan datos
  const faltantes = [
    locales.length === 0 && 'No hay ningún local registrado',
    areas.length === 0 && 'No hay ninguna área registrada',
    oficinas.length === 0 && 'No hay ninguna oficina registrada',
  ].filter(Boolean) as string[];

  const handleIrAConfiguracion = () => {
    if (confirm('Se cancelará el proceso de carga actual. ¿Desea continuar?')) {
      router.push('/dashboard/config-organizacional');
    }
  };

  if (faltantes.length > 0) {
    return (
      <div className="max-w-xl mx-auto rounded-2xl p-6 text-center"
        style={{ backgroundColor: '#fff', border: '1.5px solid rgba(239,68,68,0.25)' }}>
        <div className="mx-auto mb-4 w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#dc2626' }}>
          <MdWarning size={26} />
        </div>
        <h3 className="text-lg font-bold" style={{ color: '#0f172a' }}>Falta configurar la estructura organizacional</h3>
        <p className="text-sm mt-1 mb-4" style={{ color: '#64748b' }}>
          Para importar activos se necesita al menos un local, un área y una oficina.
        </p>
        <ul className="text-sm space-y-1.5 mb-5 inline-block text-left">
          {faltantes.map(f => (
            <li key={f} className="flex items-center gap-2" style={{ color: '#b91c1c' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#ef4444' }} /> {f}
            </li>
          ))}
        </ul>
        <div className="flex justify-center">
          <Boton onClick={handleIrAConfiguracion}><MdSettings size={17} /> Ir a la configuración</Boton>
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
