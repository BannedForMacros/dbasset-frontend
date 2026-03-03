'use client';

import { useState, useEffect, useCallback } from 'react';
import { MdClose, MdSave, MdInsertDriveFile, MdBusiness, MdLayers, MdMeetingRoom, MdPerson } from 'react-icons/md';
import Select from '@/app/components/Select';
import { Activo } from '@/app/services/activo.service';
import { Carga } from '@/app/services/carga.service';
import { Local } from '@/app/services/local.service';
import { Area } from '@/app/services/area.service';
import { Oficina } from '@/app/services/oficina.service';
import { Responsable } from '@/app/services/responsable.service';
import { Estado } from '@/app/services/estado.service';

interface ActivoConCarga extends Activo {
  detalleCarga?: { carga?: Carga };
}

export interface FormData {
  codActivo: string; codInterno: string; descripcion: string; marca: string;
  modelo: string; serie: string; color: string; anio: string;
  fechaCompra: string; codCarga: string; codLocal: string;
  codArea: string; codOficina: string; codResponsable: string; codEstado: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: FormData, editingId: number | null) => Promise<void>;
  editingActivo?: ActivoConCarga | null;
  cargas: Carga[];
  locales: Local[];
  areas: Area[];
  oficinas: Oficina[];
  responsables: Responsable[];
  estados: Estado[];
}

const initialForm: FormData = {
  codActivo: '', codInterno: '', descripcion: '', marca: '', modelo: '',
  serie: '', color: '', anio: '', fechaCompra: '', codCarga: '',
  codLocal: '', codArea: '', codOficina: '', codResponsable: '', codEstado: ''
};

export default function ModalActivo({
  open, onClose, onSave, editingActivo,
  cargas, locales, areas, oficinas, responsables, estados
}: Props) {
  const [formData, setFormData] = useState<FormData>(initialForm);
  const [saving, setSaving] = useState(false);

  // ✅ Fix: useCallback para estabilizar la función, sin setState directo en effect
  const resetForm = useCallback(() => {
    if (editingActivo) {
      setFormData({
        codActivo:      editingActivo.codActivo,
        codInterno:     editingActivo.codInterno || '',
        descripcion:    editingActivo.descripcion,
        marca:          editingActivo.marca || '',
        modelo:         editingActivo.modelo || '',
        serie:          editingActivo.serie || '',
        color:          editingActivo.color || '',
        anio:           editingActivo.anio || '',
        fechaCompra:    editingActivo.fechaCompra || '',
        codCarga:       editingActivo.detalleCarga?.carga?.codCarga?.toString() || '',
        codLocal:       (editingActivo.local as Local)?.codLocal?.toString() || '',
        codArea:        (editingActivo.area as Area)?.codArea?.toString() || '',
        codOficina:     (editingActivo.oficina as Oficina)?.codOficina?.toString() || '',
        codResponsable: (editingActivo.responsable as Responsable)?.codResponsable?.toString() || '',
        codEstado:      (editingActivo.estado as Estado)?.codEstado?.toString() || '',
      });
    } else {
      setFormData(initialForm);
    }
  }, [editingActivo]);

  // ✅ Fix: solo se ejecuta cuando open cambia a true
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) resetForm();
  }, [open, resetForm]);

  const set = (key: keyof FormData) => (val: string) =>
    setFormData(p => ({ ...p, [key]: val }));

  const areasParaForm    = formData.codLocal ? areas.filter(a => (a.local as Local)?.codLocal === Number(formData.codLocal)) : [];
  const oficinasParaForm = formData.codArea  ? oficinas.filter(o => (o.area as Area)?.codArea === Number(formData.codArea))  : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codCarga || !formData.codLocal || !formData.codArea ||
        !formData.codOficina || !formData.codResponsable || !formData.codEstado) {
      alert('Complete los campos obligatorios (*).');
      return;
    }
    setSaving(true);
    await onSave(formData, editingActivo?.id ?? null);
    setSaving(false);
  };

  if (!open) return null;

  const inputCls = "w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all duration-150";
  const inputStyle: React.CSSProperties = { border: '1.5px solid #e2e8f0', backgroundColor: '#fff', color: '#0f172a' };
  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#1e4786';
    e.target.style.boxShadow   = '0 0 0 3px rgba(30,71,134,0.08)';
  };
  const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#e2e8f0';
    e.target.style.boxShadow   = 'none';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-4xl my-8 rounded-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: '#fff', boxShadow: '0 25px 60px rgba(0,0,0,0.15)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #003366 0%, #1e4786 100%)' }}
        >
          <div>
            <h3 className="font-bold text-lg text-white">
              {editingActivo ? 'Editar Activo' : 'Registrar Nuevo Activo'}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Complete la ficha técnica del bien
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.7)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <MdClose size={22} />
          </button>
        </div>

        {/* Form */}
        <form id="form-activo" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Carga */}
          <div
            className="p-4 rounded-xl"
            style={{ backgroundColor: 'rgba(30,71,134,0.04)', border: '1.5px solid rgba(30,71,134,0.15)' }}
          >
            <Select
              label="Carga de Inventario"
              icon={<MdInsertDriveFile size={14} />}
              required
              value={formData.codCarga}
              onChange={set('codCarga')}
              placeholder="-- Seleccionar Carga --"
              options={cargas.map(c => ({ value: c.codCarga!, label: `#${c.codCarga} · ${c.descripcion} (${c.fecha})` }))}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* COLUMNA 1 */}
            <div className="space-y-4">
              <SectionBox title="Identificación">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Código <Req /></FieldLabel>
                    <input
                      required
                      value={formData.codActivo}
                      onChange={e => set('codActivo')(e.target.value)}
                      onFocus={inputFocus} onBlur={inputBlur}
                      placeholder="ACT-001"
                      className={inputCls}
                      style={{ ...inputStyle, fontFamily: 'monospace' }}
                    />
                  </div>
                  <div>
                    <FieldLabel>Código Interno</FieldLabel>
                    <input
                      value={formData.codInterno}
                      onChange={e => set('codInterno')(e.target.value)}
                      onFocus={inputFocus} onBlur={inputBlur}
                      className={inputCls}
                      style={{ ...inputStyle, fontFamily: 'monospace' }}
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Descripción <Req /></FieldLabel>
                  <input
                    required
                    value={formData.descripcion}
                    onChange={e => set('descripcion')(e.target.value)}
                    onFocus={inputFocus} onBlur={inputBlur}
                    placeholder="Laptop HP ProBook 450"
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>
              </SectionBox>

              <SectionBox title="Detalles Técnicos">
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ['marca',   'Marca',  ''],
                    ['modelo',  'Modelo', ''],
                    ['serie',   'Serie',  'monospace'],
                    ['color',   'Color',  ''],
                    ['anio',    'Año',    ''],
                  ] as [keyof FormData, string, string][]).map(([k, lbl, ff]) => (
                    <div key={String(k)}>
                      <FieldLabel>{lbl}</FieldLabel>
                      <input
                        value={formData[k]}
                        onChange={e => set(k)(e.target.value)}
                        onFocus={inputFocus} onBlur={inputBlur}
                        className={inputCls}
                        style={{ ...inputStyle, fontFamily: ff || 'inherit' }}
                      />
                    </div>
                  ))}
                  <div>
                    <FieldLabel>F. Compra</FieldLabel>
                    <input
                      type="date"
                      value={formData.fechaCompra}
                      onChange={e => set('fechaCompra')(e.target.value)}
                      onFocus={inputFocus} onBlur={inputBlur}
                      className={inputCls}
                      style={inputStyle}
                    />
                  </div>
                </div>
              </SectionBox>
            </div>

            {/* COLUMNA 2 */}
            <div className="space-y-4">
              <SectionBox title="Ubicación Física" accent="blue">
                <Select
                  label="Local" icon={<MdBusiness size={14} />} required
                  value={formData.codLocal} placeholder="-- Seleccionar --"
                  onChange={(v: string) => {
                    setFormData(p => ({ ...p, codLocal: v, codArea: '', codOficina: '' }));
                  }}
                  options={locales.map(l => ({ value: l.codLocal!, label: l.nombreLocal }))}
                />
                <Select
                  label="Área" icon={<MdLayers size={14} />} required
                  value={formData.codArea}
                  placeholder={formData.codLocal ? '-- Seleccionar --' : '-- Primero Local --'}
                  disabled={!formData.codLocal}
                  onChange={(v: string) => {
                    setFormData(p => ({ ...p, codArea: v, codOficina: '' }));
                  }}
                  options={areasParaForm.map(a => ({ value: a.codArea!, label: a.nombreArea }))}
                />
                <Select
                  label="Oficina" icon={<MdMeetingRoom size={14} />} required
                  value={formData.codOficina}
                  placeholder={formData.codArea ? '-- Seleccionar --' : '-- Primero Área --'}
                  disabled={!formData.codArea}
                  onChange={set('codOficina')}
                  options={oficinasParaForm.map(o => ({ value: o.codOficina!, label: o.nombreOficina }))}
                />
              </SectionBox>

              <SectionBox title="Asignación" accent="teal">
                <Select
                  label="Custodio" icon={<MdPerson size={14} />} required
                  value={formData.codResponsable} placeholder="-- Seleccionar --"
                  onChange={set('codResponsable')}
                  options={responsables.map(r => ({ value: r.codResponsable!, label: r.nombreResponsable }))}
                />
                <Select
                  label="Estado" required
                  value={formData.codEstado} placeholder="-- Seleccionar --"
                  onChange={set('codEstado')}
                  options={estados.map(e => ({ value: e.codEstado!, label: e.nombreEstado }))}
                />
              </SectionBox>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div
          className="flex justify-end gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid #f1f5f9', backgroundColor: '#fafafa' }}
        >
          <button
            type="button" onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ border: '1.5px solid #e2e8f0', color: '#64748b', backgroundColor: '#fff' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#fff')}
          >
            Cancelar
          </button>
          <button
            type="submit" form="form-activo" disabled={saving}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 text-white transition-all"
            style={{ backgroundColor: saving ? '#94a3b8' : '#1e4786', cursor: saving ? 'not-allowed' : 'pointer' }}
            onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#163564'; }}
            onMouseLeave={e => { if (!saving) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1e4786'; }}
          >
            <MdSave size={18} />
            {saving ? 'Guardando...' : (editingActivo ? 'Actualizar' : 'Guardar')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-componentes ── */

function SectionBox({
  title, children, accent,
}: {
  title: string;
  children: React.ReactNode;
  accent?: 'blue' | 'teal';
}) {
  const bg     = accent === 'blue' ? 'rgba(30,71,134,0.03)'  : accent === 'teal' ? 'rgba(34,196,161,0.03)'  : '#fafafa';
  const border = accent === 'blue' ? 'rgba(30,71,134,0.12)'  : accent === 'teal' ? 'rgba(34,196,161,0.2)'   : '#f1f5f9';
  return (
    <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: bg, border: `1.5px solid ${border}` }}>
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>{title}</p>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#64748b' }}>
      {children}
    </label>
  );
}

function Req() {
  return <span style={{ color: '#ef4444' }}> *</span>;
}