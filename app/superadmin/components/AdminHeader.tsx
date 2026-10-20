'use client';

import { ReactNode } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MdShield, MdArrowBack, MdLogout } from 'react-icons/md';
import { Boton } from '@/app/components/rfid/ui';
import { authService } from '@/app/services/auth.service';

/** Cabecera común de las pantallas de superadministración. */
export default function AdminHeader({ volver, children }: {
  volver?: { href: string; texto: string };
  children?: ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 px-8 py-4" style={{ backgroundColor: '#002a55' }}>
      <div className="flex items-center gap-4">
        <Image src="/db2.png" alt="data_business" width={120} height={44} style={{ objectFit: 'contain' }} priority />
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
          style={{ backgroundColor: 'rgba(34,196,161,0.15)', color: '#22c4a1' }}>
          <MdShield size={14} /> SUPERADMINISTRADOR
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {volver && (
          <Boton variante="secundario" onClick={() => router.push(volver.href)}>
            <MdArrowBack /> {volver.texto}
          </Boton>
        )}
        {children}
        <Boton variante="peligro" onClick={() => authService.logout()}><MdLogout /> Salir</Boton>
      </div>
    </header>
  );
}
