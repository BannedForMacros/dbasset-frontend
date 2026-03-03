'use client';

import { useRouter, usePathname } from 'next/navigation';
import { authService } from '../services/auth.service';
import { useState } from 'react';
import Image from 'next/image';
import {
  MdDashboard, MdLogout, MdMenu, MdClose,
  MdPeople, MdInfo, MdQrCode, MdLocalShipping, MdSettings, MdSwapHoriz,
  MdExpandMore, MdExpandLess, MdBuild, MdColorLens, MdBrandingWatermark,
  MdAssignmentInd
} from 'react-icons/md';
import { IconType } from 'react-icons';

interface MenuItem {
  name: string;
  path: string;
  icon: IconType;
}

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [mantenedorOpen, setMantenedorOpen] = useState(false);

  const companyInfo = (() => {
    if (typeof window === 'undefined') return { ruc: '', razonSocial: '' };
    const user = authService.getUserData();
    if (user?.empresas && user.currentCompanyId) {
    }
    return { ruc: '', razonSocial: '' };
  })();

  const handleLogout = () => authService.logout();
  const handleChangeCompany = () => router.push('/select-company');

  const menuItems: MenuItem[] = [
    { name: 'Dashboard',       path: '/dashboard',                       icon: MdDashboard     },
    { name: 'Activos',         path: '/dashboard/activos',               icon: MdQrCode        },
    { name: 'Cargas',          path: '/dashboard/cargas',                icon: MdLocalShipping },
    { name: 'Configuración',   path: '/dashboard/config-organizacional', icon: MdSettings      },
    { name: 'Custodios',       path: '/dashboard/responsables',          icon: MdPeople        },
    { name: 'Inventariadores', path: '/dashboard/inventariador',         icon: MdAssignmentInd },
  ];

  const mantenedorItems: MenuItem[] = [
    { name: 'Colores', path: '/dashboard/colores', icon: MdColorLens         },
    { name: 'Marcas',  path: '/dashboard/marcas',  icon: MdBrandingWatermark },
    { name: 'Estados', path: '/dashboard/estados', icon: MdInfo              },
  ];

  const isMantenedorActive = mantenedorItems.some(item => pathname === item.path);

  /* ─── Paleta data_business ─── */
  const c = {
    accent:       '#22c4a1',
    sidebar:      '#002a55',
    border:       'rgba(34,196,161,0.15)',
    activeItem:   'rgba(34,196,161,0.15)',
    hoverItem:    'rgba(255,255,255,0.06)',
    mutedText:    'rgba(255,255,255,0.5)',
    normalText:   'rgba(255,255,255,0.72)',
    sectionLabel: 'rgba(34,196,161,0.55)',
  };

  const navBtn = (isActive: boolean): React.CSSProperties => ({
    color:           isActive ? c.accent : c.normalText,
    backgroundColor: isActive ? c.activeItem : 'transparent',
    borderLeft:      isActive ? `3px solid ${c.accent}` : '3px solid transparent',
  });

  const hoverIn = (el: HTMLButtonElement, bg: string, color: string): void => {
    el.style.backgroundColor = bg;
    el.style.color = color;
  };

  const hoverOut = (el: HTMLButtonElement, isActive: boolean): void => {
    el.style.backgroundColor = isActive ? c.activeItem : 'transparent';
    el.style.color = isActive ? c.accent : c.normalText;
  };

  return (
    <>
      {/* Hamburguesa mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg shadow-lg text-white"
        style={{ backgroundColor: '#1e4786' }}
      >
        {isOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full transition-transform duration-300 z-40 shadow-2xl
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 w-64 flex flex-col`}
        style={{ backgroundColor: c.sidebar }}
      >

        {/* ── HEADER ── */}
        <div className="px-5 py-5" style={{ borderBottom: `1px solid ${c.border}` }}>
          {/* Logo desde /public/db.png */}
          <div className="mb-4">
            <Image
              src="/db2.png"
              alt="data_business"
              width={130}
              height={48}
              style={{ objectFit: 'contain', objectPosition: 'left' }}
              priority
            />
          </div>

          {/* Info empresa */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 text-xs font-bold text-white"
              style={{ backgroundColor: '#1e4786' }}
            >
              DB
            </div>
            <div className="overflow-hidden">
              <p
                className="text-xs font-semibold truncate w-44 text-white"
                title={companyInfo.razonSocial || ''}
                suppressHydrationWarning
              >
                {companyInfo.razonSocial || 'Cargando...'}
              </p>
              <p
                className="text-xs font-mono"
                style={{ color: c.accent, opacity: 0.85 }}
                suppressHydrationWarning
              >
                RUC: {companyInfo.ruc || '---'}
              </p>
            </div>
          </div>
        </div>

        {/* ── NAV ── */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">

          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-widest"
            style={{ color: c.sectionLabel }}>
            Menú principal
          </p>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm font-medium"
                style={navBtn(isActive)}
                onMouseEnter={e => { if (!isActive) hoverIn(e.currentTarget, c.hoverItem, '#fff'); }}
                onMouseLeave={e => { if (!isActive) hoverOut(e.currentTarget, false); }}
              >
                <Icon size={20} style={{ color: isActive ? c.accent : c.mutedText }} />
                <span>{item.name}</span>
              </button>
            );
          })}

          {/* Mantenedor desplegable */}
          <div className="pt-3">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-widest"
              style={{ color: c.sectionLabel }}>
              Configuración
            </p>
            <button
              onClick={() => setMantenedorOpen(!mantenedorOpen)}
              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm font-medium"
              style={navBtn(isMantenedorActive)}
              onMouseEnter={e => { if (!isMantenedorActive) hoverIn(e.currentTarget, c.hoverItem, '#fff'); }}
              onMouseLeave={e => { if (!isMantenedorActive) hoverOut(e.currentTarget, false); }}
            >
              <div className="flex items-center gap-3">
                <MdBuild size={20} style={{ color: isMantenedorActive ? c.accent : c.mutedText }} />
                <span>Mantenedor</span>
              </div>
              {mantenedorOpen
                ? <MdExpandLess size={18} style={{ color: c.mutedText }} />
                : <MdExpandMore size={18} style={{ color: c.mutedText }} />
              }
            </button>

            <div className={`overflow-hidden transition-all duration-300 ${mantenedorOpen ? 'max-h-48' : 'max-h-0'}`}>
              <div className="ml-5 mt-1 space-y-0.5 pl-3" style={{ borderLeft: `1px solid ${c.border}` }}>
                {mantenedorItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => router.push(item.path)}
                      className="w-full flex items-center gap-2 px-2 py-2 rounded-md transition-all duration-150 text-xs font-medium"
                      style={{
                        color:           isActive ? c.accent : c.mutedText,
                        backgroundColor: isActive ? c.activeItem : 'transparent',
                      }}
                      onMouseEnter={e => { if (!isActive) hoverIn(e.currentTarget, c.hoverItem, '#fff'); }}
                      onMouseLeave={e => { if (!isActive) hoverOut(e.currentTarget, false); }}
                    >
                      <Icon size={16} />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>

        {/* ── FOOTER ── */}
        <div className="px-3 py-3 space-y-1" style={{ borderTop: `1px solid ${c.border}` }}>
          <button
            onClick={handleChangeCompany}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-sm"
            style={{ color: c.mutedText }}
            onMouseEnter={e => hoverIn(e.currentTarget, c.hoverItem, c.accent)}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = c.mutedText; }}
          >
            <MdSwapHoriz size={20} />
            <span>Cambiar Empresa</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-sm"
            style={{ color: c.mutedText }}
            onMouseEnter={e => hoverIn(e.currentTarget, 'rgba(239,68,68,0.1)', '#f87171')}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = c.mutedText; }}
          >
            <MdLogout size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* Overlay mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 z-30"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        />
      )}
    </>
  );
}