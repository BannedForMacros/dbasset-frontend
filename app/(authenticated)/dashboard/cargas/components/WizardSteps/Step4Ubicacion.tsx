'use client';

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