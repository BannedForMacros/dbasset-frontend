/* eslint-disable @typescript-eslint/no-unused-expressions */
'use client';

import { useState } from 'react';
import { MdAdd, MdDelete, MdPerson, MdAutoFixHigh, MdTouchApp, MdInput, MdCheckCircle, MdWarning } from 'react-icons/md';

interface Assignment {
  inicio: number;
  fin: number;
  codResponsable?: number;
  nombreResponsable?: string;
}

interface Person { 
  id: number; 
  name: string; 
  subtitle?: string; 
}

interface AssignmentManagerProps {
  totalItems: number;
  persons: Person[];
  assignments: Assignment[];
  onAssignmentsChange: (assignments: Assignment[]) => void;
  selectedRows: Set<number>;
  title: string;
  mode: 'responsable' | 'inventariador';
}

export default function AssignmentManager({
  totalItems,
  persons,
  assignments,
  onAssignmentsChange,
  selectedRows
}: AssignmentManagerProps) {
  const [strategy, setStrategy] = useState<'selected' | 'manual' | 'equal'>(
    selectedRows.size > 0 ? 'selected' : 'manual'
  );
  
  const [range, setRange] = useState({ start: 1, end: totalItems });
  const [selectedPerson, setSelectedPerson] = useState('');
  const [personsForEqual, setPersonsForEqual] = useState<Set<number>>(new Set());

  const formatRange = (i: number, f: number) => i === f ? `Fila ${i}` : `Filas ${i} al ${f}`;

  const handleManualAdd = () => {
    if (!selectedPerson) return;
    const person = persons.find(p => p.id === Number(selectedPerson))!;
    onAssignmentsChange([...assignments, {
      inicio: range.start,
      fin: range.end,
      codResponsable: person.id,
      nombreResponsable: person.name
    }]);
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
        newRanges.push({ inicio: s, fin: e, codResponsable: personId, nombreResponsable: person.name });
        s = sorted[i]; e = sorted[i];
      }
    }
    newRanges.push({ inicio: s, fin: e, codResponsable: personId, nombreResponsable: person.name });
    onAssignmentsChange([...assignments, ...newRanges]);
  };

  const handleEqualDistribution = () => {
    if (personsForEqual.size === 0) return;
    
    const assignedIds = new Set<number>();
    assignments.forEach(a => { for (let i = a.inicio; i <= a.fin; i++) assignedIds.add(i); });
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
        const push = (start: number, end: number) => {
          newAsigs.push({ inicio: start, fin: end, codResponsable: personId, nombreResponsable: person.name });
        };
        for (let i = 1; i < indices.length; i++) {
          if (indices[i] === last + 1) last = indices[i];
          else { push(s, last); s = indices[i]; last = indices[i]; }
        }
        push(s, last);
      }
      currentIdx += count;
    });

    onAssignmentsChange([...assignments, ...newAsigs]);
    setPersonsForEqual(new Set()); 
  };

  return (
    <div className="bg-gray-100 rounded-xl p-4 border-2 border-gray-300 shadow-md flex flex-col gap-4">
      
      {/* 1. BOTONES DE ESTRATEGIA (¡Ahora sí parecen botones siempre!) */}
      <div className="flex flex-col sm:flex-row gap-3 bg-gray-200 p-2 rounded-xl border border-gray-300">
        <button
          onClick={() => setStrategy('selected')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all text-sm border-2 ${
            strategy === 'selected' 
              ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-[1.02]' 
              : 'bg-white text-gray-700 border-gray-300 shadow-sm hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          <MdTouchApp size={20} /> Asignar lo Seleccionado ({selectedRows.size})
        </button>

        <button
          onClick={() => setStrategy('manual')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all text-sm border-2 ${
            strategy === 'manual' 
              ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-[1.02]' 
              : 'bg-white text-gray-700 border-gray-300 shadow-sm hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          <MdInput size={20} /> Asignar por Rango (1 al 10)
        </button>

        <button
          onClick={() => setStrategy('equal')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-all text-sm border-2 ${
            strategy === 'equal' 
              ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-[1.02]' 
              : 'bg-white text-gray-700 border-gray-300 shadow-sm hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          <MdAutoFixHigh size={20} /> Repartir por igual
        </button>
      </div>

      {/* 2. ÁREA DE EJECUCIÓN */}
      <div className="bg-white rounded-lg p-5 border border-gray-300 min-h-[100px] flex items-center">
        
        {strategy === 'selected' && (
          <div className="w-full">
            {selectedRows.size === 0 ? (
              <div className="text-center p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg shadow-sm">
                <p className="text-yellow-800 font-bold flex items-center justify-center gap-2 text-sm sm:text-base">
                  <MdWarning size={24} /> Primero debes marcar una o más casillas en la tabla de arriba.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-bold text-gray-700 mb-3">¿A quién le asignamos estas {selectedRows.size} filas?</p>
                <div className="flex flex-wrap gap-3">
                  {persons.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleQuickAssign(p.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-2 border-blue-300 rounded-lg text-blue-800 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm font-bold"
                    >
                      <MdPerson size={20} /> {p.name}
                    </button>
                  ))}
                  {persons.length === 0 && <p className="text-gray-500 italic">No hay responsables agregados.</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {strategy === 'manual' && (
          <div className="w-full">
            <p className="text-sm font-bold text-gray-700 mb-3">Escribe desde qué número hasta qué número quieres asignar:</p>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">1. Elige a la persona</label>
                <select 
                  value={selectedPerson} 
                  onChange={e => setSelectedPerson(e.target.value)}
                  className="w-full p-3 bg-white border-2 border-gray-300 rounded-lg text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                >
                  <option value="">Selecciona aquí...</option>
                  {persons.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="w-24">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block text-center">Desde fila</label>
                <input type="number" value={range.start} onChange={e => setRange({...range, start: +e.target.value})} className="w-full p-3 border-2 border-gray-300 rounded-lg text-center font-bold text-gray-700 focus:border-blue-600 outline-none" />
              </div>
              <div className="w-24">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block text-center">Hasta fila</label>
                <input type="number" value={range.end} onChange={e => setRange({...range, end: +e.target.value})} className="w-full p-3 border-2 border-gray-300 rounded-lg text-center font-bold text-gray-700 focus:border-blue-600 outline-none" />
              </div>
              <button 
                onClick={handleManualAdd}
                disabled={!selectedPerson}
                className="p-3 bg-blue-600 text-white rounded-lg border-2 border-blue-700 hover:bg-blue-700 disabled:bg-gray-300 disabled:border-gray-400 disabled:text-gray-500 transition-all font-bold flex items-center gap-2"
              >
                <MdAdd size={24} /> Asignar
              </button>
            </div>
          </div>
        )}

        {strategy === 'equal' && (
          <div className="w-full">
            <p className="text-sm font-bold text-gray-700 mb-3">Selecciona a 2 o más personas para repartir los ítems que faltan:</p>
            <div className="flex flex-wrap gap-3 mb-4">
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
                    className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg font-bold transition-all shadow-sm ${
                      isSelected 
                        ? 'bg-blue-100 border-blue-600 text-blue-800' 
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-400'}`}>
                      {isSelected && <MdCheckCircle size={16} />}
                    </div>
                    {p.name}
                  </button>
                )
              })}
            </div>
            
            <button 
              onClick={handleEqualDistribution}
              disabled={personsForEqual.size < 2}
              className="w-full p-3 bg-green-600 text-white rounded-lg border-2 border-green-700 hover:bg-green-700 disabled:bg-gray-300 disabled:border-gray-400 disabled:text-gray-500 transition-all font-bold text-lg flex justify-center items-center gap-2 shadow-md"
            >
              <MdAutoFixHigh size={24} /> 
              {personsForEqual.size < 2 
                ? 'Selecciona al menos 2 personas arriba' 
                : `Repartir entre estas ${personsForEqual.size} personas`}
            </button>
          </div>
        )}
      </div>

      {/* 3. HISTORIAL DE ASIGNACIONES */}
      {assignments.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-gray-300 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-black text-gray-800 uppercase">Lo que has asignado hasta ahora:</p>
            <button 
              onClick={() => onAssignmentsChange([])} 
              className="text-xs text-red-600 hover:underline font-bold"
            >
              Borrar Todo
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">
            {assignments.map((a, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-lg min-w-[200px]">
                <div>
                  <p className="text-xs font-black text-blue-700">{formatRange(a.inicio, a.fin)}</p>
                  <p className="text-sm font-bold text-gray-800 truncate max-w-[150px]">{a.nombreResponsable}</p>
                </div>
                <button 
                  onClick={() => onAssignmentsChange(assignments.filter((_, i) => i !== idx))}
                  className="p-1.5 bg-white border border-red-200 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors"
                  title="Eliminar asignación"
                >
                  <MdDelete size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}