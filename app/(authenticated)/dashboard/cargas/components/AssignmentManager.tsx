/* eslint-disable @typescript-eslint/no-unused-expressions */
'use client';

import { useState } from 'react';
import { MdAdd, MdClose, MdPerson, MdAutoFixHigh, MdTouchApp, MdLinearScale, MdCheck, MdWarning } from 'react-icons/md';
import Select from '@/app/components/Select';
import { Boton } from '@/app/components/rfid/ui';
import { AvisoPaso } from './PasoEncabezado';

/* Un mismo componente sirve para custodios e inventariadores; según el modo
   la asignación lleva codResponsable/nombreResponsable o codInventariador/nombre. */
interface Assignment {
  inicio: number;
  fin: number;
  codResponsable?: number;
  nombreResponsable?: string;
  codInventariador?: number;
  nombre?: string;
}

interface Person {
  id: number;
  name: string;
  subtitle?: string;
}

interface AssignmentManagerProps {
  totalItems: number;
  persons: Person[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assignments: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAssignmentsChange: (assignments: any[]) => void;
  selectedRows: Set<number>;
  title: string;
  mode: 'responsable' | 'inventariador';
}

export default function AssignmentManager({
  totalItems,
  persons,
  assignments,
  onAssignmentsChange,
  selectedRows,
  title,
  mode
}: AssignmentManagerProps) {
  const [strategy, setStrategy] = useState<'selected' | 'manual' | 'equal'>(
    selectedRows.size > 0 && selectedRows.size < totalItems ? 'selected' : 'manual'
  );

  const [range, setRange] = useState({ start: 1, end: totalItems });
  const [selectedPerson, setSelectedPerson] = useState('');
  const [personsForEqual, setPersonsForEqual] = useState<Set<number>>(new Set());

  const personas = mode === 'responsable' ? 'custodios' : 'inventariadores';
  const formatRange = (i: number, f: number) => i === f ? `Fila ${i}` : `Filas ${i} a ${f}`;
  const nombreDe = (a: Assignment) => a.nombreResponsable ?? a.nombre ?? '';

  const crear = (inicio: number, fin: number, person: Person): Assignment =>
    mode === 'responsable'
      ? { inicio, fin, codResponsable: person.id, nombreResponsable: person.name }
      : { inicio, fin, codInventariador: person.id, nombre: person.name };

  const rangoValido = range.start >= 1 && range.end <= totalItems && range.start <= range.end;

  const handleManualAdd = () => {
    if (!selectedPerson || !rangoValido) return;
    const person = persons.find(p => p.id === Number(selectedPerson))!;
    onAssignmentsChange([...assignments, crear(range.start, range.end, person)]);
    setSelectedPerson('');
  };

  const handleQuickAssign = (personId: number) => {
    if (selectedRows.size === 0) return;
    const person = persons.find(p => p.id === personId)!;
    const sorted = Array.from(selectedRows).sort((a, b) => a - b).map(i => i + 1);

    const newRanges: Assignment[] = [];
    let s = sorted[0], e = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === e + 1) e = sorted[i];
      else {
        newRanges.push(crear(s, e, person));
        s = sorted[i]; e = sorted[i];
      }
    }
    newRanges.push(crear(s, e, person));
    onAssignmentsChange([...assignments, ...newRanges]);
  };

  const handleEqualDistribution = () => {
    if (personsForEqual.size === 0) return;

    const assignedIds = new Set<number>();
    assignments.forEach((a: Assignment) => { for (let i = a.inicio; i <= a.fin; i++) assignedIds.add(i); });
    const unassigned = Array.from({ length: totalItems }, (_, i) => i + 1).filter(idx => !assignedIds.has(idx));

    if (unassigned.length === 0) {
      alert("¡Ya no hay filas pendientes por asignar!");
      return;
    }

    const selectedArray = Array.from(personsForEqual);
    const perPerson = Math.floor(unassigned.length / selectedArray.length);
    const remainder = unassigned.length % selectedArray.length;

    const newAsigs: Assignment[] = [];
    let currentIdx = 0;

    selectedArray.forEach((personId, idx) => {
      const person = persons.find(p => p.id === personId)!;
      const count = perPerson + (idx < remainder ? 1 : 0);
      const indices = unassigned.slice(currentIdx, currentIdx + count);

      if (indices.length > 0) {
        let s = indices[0], last = indices[0];
        for (let i = 1; i < indices.length; i++) {
          if (indices[i] === last + 1) last = indices[i];
          else { newAsigs.push(crear(s, last, person)); s = indices[i]; last = indices[i]; }
        }
        newAsigs.push(crear(s, last, person));
      }
      currentIdx += count;
    });

    onAssignmentsChange([...assignments, ...newAsigs]);
    setPersonsForEqual(new Set());
  };

  const sinPersonas = persons.length === 0 && (
    <p className="text-sm italic" style={{ color: '#94a3b8' }}>No hay {personas} registrados.</p>
  );

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#fff', border: '1.5px solid #e2e8f0' }}>
      <div className="tabla-barra">
        <h4 className="font-semibold" style={{ color: '#0f172a' }}>{title}</h4>
        <div className="segmentado">
          <button type="button" data-activo={strategy === 'selected'} onClick={() => setStrategy('selected')}>
            <MdTouchApp size={15} /> Filas seleccionadas ({selectedRows.size})
          </button>
          <button type="button" data-activo={strategy === 'manual'} onClick={() => setStrategy('manual')}>
            <MdLinearScale size={15} /> Por rango
          </button>
          <button type="button" data-activo={strategy === 'equal'} onClick={() => setStrategy('equal')}>
            <MdAutoFixHigh size={15} /> Repartir por igual
          </button>
        </div>
      </div>

      <div className="p-5">
        {strategy === 'selected' && (
          selectedRows.size === 0 ? (
            <AvisoPaso tono="alerta" icono={<MdWarning size={18} />}>
              Marque una o más filas en la tabla de arriba y luego elija a quién asignarlas.
            </AvisoPaso>
          ) : (
            <div>
              <p className="text-sm mb-3" style={{ color: '#64748b' }}>
                Asignar las <b style={{ color: '#0f172a' }}>{selectedRows.size} filas seleccionadas</b> a:
              </p>
              <div className="flex flex-wrap gap-2">
                {persons.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleQuickAssign(p.id)}
                    className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full text-sm font-semibold transition-colors"
                    style={{ border: '1.5px solid #e2e8f0', color: '#1e4786', backgroundColor: '#fff' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#1e4786'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#1e4786'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#1e4786'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                  >
                    <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(30,71,134,0.08)' }}>
                      <MdPerson size={15} />
                    </span>
                    {p.name}
                  </button>
                ))}
                {sinPersonas}
              </div>
            </div>
          )
        )}

        {strategy === 'manual' && (
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[220px]">
              <Select
                label={mode === 'responsable' ? 'Custodio' : 'Inventariador'}
                value={selectedPerson}
                onChange={v => setSelectedPerson(v)}
                placeholder="Seleccionar persona"
                options={persons.map(p => ({ value: p.id, label: p.name }))}
              />
            </div>
            <label className="flex flex-col gap-1.5 w-28">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>Desde fila</span>
              <input type="number" min={1} max={totalItems} value={range.start}
                onChange={e => setRange({ ...range, start: +e.target.value })}
                className="input-suave text-center font-semibold" />
            </label>
            <label className="flex flex-col gap-1.5 w-28">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>Hasta fila</span>
              <input type="number" min={1} max={totalItems} value={range.end}
                onChange={e => setRange({ ...range, end: +e.target.value })}
                className="input-suave text-center font-semibold" />
            </label>
            <Boton onClick={handleManualAdd} disabled={!selectedPerson || !rangoValido}>
              <MdAdd size={18} /> Asignar
            </Boton>
            {!rangoValido && (
              <p className="w-full text-xs" style={{ color: '#dc2626' }}>El rango debe estar entre 1 y {totalItems}.</p>
            )}
          </div>
        )}

        {strategy === 'equal' && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: '#64748b' }}>
              Elija dos o más personas; las filas que faltan se reparten en partes iguales.
            </p>
            <div className="flex flex-wrap gap-2">
              {persons.map(p => {
                const isSelected = personsForEqual.has(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      const newSet = new Set(personsForEqual);
                      isSelected ? newSet.delete(p.id) : newSet.add(p.id);
                      setPersonsForEqual(newSet);
                    }}
                    className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full text-sm font-semibold transition-colors"
                    style={{
                      border: `1.5px solid ${isSelected ? '#1e4786' : '#e2e8f0'}`,
                      backgroundColor: isSelected ? 'rgba(30,71,134,0.06)' : '#fff',
                      color: isSelected ? '#1e4786' : '#475569',
                    }}
                  >
                    <span className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: isSelected ? '#1e4786' : '#f1f5f9', color: isSelected ? '#fff' : '#94a3b8' }}>
                      {isSelected ? <MdCheck size={15} /> : <MdPerson size={15} />}
                    </span>
                    {p.name}
                  </button>
                );
              })}
              {sinPersonas}
            </div>
            <Boton onClick={handleEqualDistribution} disabled={personsForEqual.size < 2}>
              <MdAutoFixHigh size={17} />
              {personsForEqual.size < 2
                ? 'Seleccione al menos 2 personas'
                : `Repartir entre ${personsForEqual.size} personas`}
            </Boton>
          </div>
        )}
      </div>

      {/* Asignaciones realizadas */}
      {assignments.length > 0 && (
        <div className="px-5 py-4" style={{ borderTop: '1px solid #f1f5f9', backgroundColor: '#fafafa' }}>
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748b' }}>
              Asignaciones ({assignments.length})
            </p>
            <button
              onClick={() => onAssignmentsChange([])}
              className="text-xs font-semibold hover:underline"
              style={{ color: '#dc2626' }}
            >
              Quitar todas
            </button>
          </div>

          <div className="flex flex-wrap gap-2 max-h-[132px] overflow-y-auto">
            {assignments.map((a: Assignment, idx: number) => (
              <div key={idx} className="flex items-center gap-2 pl-3 pr-1.5 py-1.5 rounded-xl"
                style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold" style={{ color: '#1e4786' }}>{formatRange(a.inicio, a.fin)}</p>
                  <p className="text-sm font-medium truncate max-w-[170px]" style={{ color: '#0f172a' }}>{nombreDe(a)}</p>
                </div>
                <button
                  onClick={() => onAssignmentsChange(assignments.filter((_: Assignment, i: number) => i !== idx))}
                  className="p-1 rounded-lg transition-colors hover:bg-red-50"
                  style={{ color: '#ef4444' }}
                  title="Quitar asignación"
                >
                  <MdClose size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
