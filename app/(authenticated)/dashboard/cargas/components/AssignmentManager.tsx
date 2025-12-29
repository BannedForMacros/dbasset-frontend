'use client';

import { useState } from 'react';
import { MdAdd, MdDelete, MdCheckCircle, MdLightbulb, MdEdit, MdFilterList, MdPerson } from 'react-icons/md';
import PersonSelector from './PersonSelector';

// ✅ Interfaces separadas y bien tipadas
interface ResponsableAssignment {
  inicio: number;
  fin: number;
  codResponsable?: number;
  nombreResponsable?: string;
}

interface InventariadorAssignment {
  inicio: number;
  fin: number;
  codInventariador?: number;
  nombreInventariador?: string;
}

type Assignment = ResponsableAssignment | InventariadorAssignment;

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
  selectedRows,
  title,
  mode
}: AssignmentManagerProps) {
  const [strategy, setStrategy] = useState<'equal' | 'manual' | 'selected'>('selected');
  const [selectedPersons, setSelectedPersons] = useState<Set<number>>(new Set());
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(totalItems);
  const [selectedPerson, setSelectedPerson] = useState('');

  // Calcular filas asignadas
  const assignedRows = new Set<number>();
  assignments.forEach(assignment => {
    for (let i = assignment.inicio; i <= assignment.fin; i++) {
      assignedRows.add(i);
    }
  });

  const unassignedCount = totalItems - assignedRows.size;

  const formatRange = (inicio: number, fin: number): string => {
    return inicio === fin ? `#${inicio}` : `#${inicio}-${fin}`;
  };

  // ✅ Helper para obtener el nombre según el modo
  const getPersonName = (assignment: Assignment): string => {
    if (mode === 'responsable') {
      return (assignment as ResponsableAssignment).nombreResponsable || '';
    } else {
      return (assignment as InventariadorAssignment).nombreInventariador || '';
    }
  };

  // MODO 1: Distribución Equitativa
  const handleEqualDistribution = () => {
    if (selectedPersons.size === 0) {
      alert('⚠️ Seleccione al menos una persona');
      return;
    }

    const unassignedIndices = Array.from({ length: totalItems }, (_, i) => i + 1)
      .filter(idx => !assignedRows.has(idx));

    if (unassignedIndices.length === 0) {
      alert('⚠️ No hay ítems pendientes');
      return;
    }

    const selectedArray = Array.from(selectedPersons);
    const itemsPerPerson = Math.floor(unassignedIndices.length / selectedArray.length);
    const remainder = unassignedIndices.length % selectedArray.length;

    const newAssignments: Assignment[] = [];
    let currentIndex = 0;

    selectedArray.forEach((personId, idx) => {
      const person = persons.find(p => p.id === personId)!;
      const count = itemsPerPerson + (idx < remainder ? 1 : 0);
      
      const assignedIndices = unassignedIndices.slice(currentIndex, currentIndex + count);
      
      if (assignedIndices.length > 0) {
        let rangeStart = assignedIndices[0];
        let rangeEnd = assignedIndices[0];
        
        for (let i = 1; i < assignedIndices.length; i++) {
          if (assignedIndices[i] === rangeEnd + 1) {
            rangeEnd = assignedIndices[i];
          } else {
            if (mode === 'responsable') {
              newAssignments.push({
                inicio: rangeStart,
                fin: rangeEnd,
                codResponsable: personId,
                nombreResponsable: person.name
              });
            } else {
              newAssignments.push({
                inicio: rangeStart,
                fin: rangeEnd,
                codInventariador: personId,
                nombreInventariador: person.name
              });
            }
            rangeStart = assignedIndices[i];
            rangeEnd = assignedIndices[i];
          }
        }
        
        if (mode === 'responsable') {
          newAssignments.push({
            inicio: rangeStart,
            fin: rangeEnd,
            codResponsable: personId,
            nombreResponsable: person.name
          });
        } else {
          newAssignments.push({
            inicio: rangeStart,
            fin: rangeEnd,
            codInventariador: personId,
            nombreInventariador: person.name
          });
        }
      }

      currentIndex += count;
    });

    onAssignmentsChange([...assignments, ...newAssignments]);
    setSelectedPersons(new Set());
  };

  // MODO 2: Rango Manual
  const handleManualRange = () => {
    if (!selectedPerson) {
      alert('⚠️ Seleccione una persona');
      return;
    }

    const person = persons.find(p => p.id === Number(selectedPerson))!;
    
    const newAssignment: Assignment = mode === 'responsable' 
      ? {
          inicio: rangeStart,
          fin: rangeEnd,
          codResponsable: person.id,
          nombreResponsable: person.name
        }
      : {
          inicio: rangeStart,
          fin: rangeEnd,
          codInventariador: person.id,
          nombreInventariador: person.name
        };

    onAssignmentsChange([...assignments, newAssignment]);
    
    // Buscar siguiente rango disponible
    let nextStart = rangeEnd + 1;
    while (nextStart <= totalItems && assignedRows.has(nextStart)) {
      nextStart++;
    }
    if (nextStart <= totalItems) {
      setRangeStart(nextStart);
      setRangeEnd(totalItems);
    }
    setSelectedPerson('');
  };

  // MODO 3: Filas Seleccionadas
  const handleSelectedRows = (personId: number) => {
    if (selectedRows.size === 0) {
      alert('⚠️ No hay filas seleccionadas');
      return;
    }

    const person = persons.find(p => p.id === personId)!;
    const sortedIndices = Array.from(selectedRows).sort((a, b) => a - b).map(i => i + 1);

    // Crear rangos consecutivos
    const ranges: { inicio: number; fin: number }[] = [];
    let rangeStartIdx = sortedIndices[0];
    let rangeEndIdx = sortedIndices[0];

    for (let i = 1; i < sortedIndices.length; i++) {
      if (sortedIndices[i] === rangeEndIdx + 1) {
        rangeEndIdx = sortedIndices[i];
      } else {
        ranges.push({ inicio: rangeStartIdx, fin: rangeEndIdx });
        rangeStartIdx = sortedIndices[i];
        rangeEndIdx = sortedIndices[i];
      }
    }
    ranges.push({ inicio: rangeStartIdx, fin: rangeEndIdx });

    const newAssignments: Assignment[] = ranges.map(range => 
      mode === 'responsable'
        ? {
            inicio: range.inicio,
            fin: range.fin,
            codResponsable: personId,
            nombreResponsable: person.name
          }
        : {
            inicio: range.inicio,
            fin: range.fin,
            codInventariador: personId,
            nombreInventariador: person.name
          }
    );

    onAssignmentsChange([...assignments, ...newAssignments]);
  };

  const handleDeleteAssignment = (index: number) => {
    if (confirm('¿Eliminar esta asignación?')) {
      onAssignmentsChange(assignments.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">{title}</h3>

      {/* Estado Global */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-xs font-bold text-blue-600 mb-1">TOTAL</p>
          <p className="text-2xl font-bold text-gray-800">{totalItems}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-xs font-bold text-green-600 mb-1">ASIGNADOS</p>
          <p className="text-2xl font-bold text-gray-800">{assignedRows.size}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-xs font-bold text-gray-600 mb-1">PENDIENTES</p>
          <p className="text-2xl font-bold text-gray-800">{unassignedCount}</p>
        </div>
      </div>

      {/* Barra de Progreso */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex justify-between text-xs font-bold text-gray-600 mb-2">
          <span>Progreso</span>
          <span>{Math.round((assignedRows.size / totalItems) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${(assignedRows.size / totalItems) * 100}%` }}
          />
        </div>
      </div>

      {/* Tabla de Asignaciones */}
      {assignments.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b flex items-center gap-2">
            <MdCheckCircle className="text-blue-600" size={20} />
            <h4 className="font-bold text-gray-800">Asignaciones Realizadas</h4>
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
              {assignments.length}
            </span>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Rango</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Cantidad</th>
                  <th className="px-4 py-3 text-left font-bold text-gray-600">Persona</th>
                  <th className="px-4 py-3 text-right font-bold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assignments.map((assignment, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono text-blue-600 font-bold">
                      {formatRange(assignment.inicio, assignment.fin)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {assignment.fin - assignment.inicio + 1} ítems
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-800">
                      {getPersonName(assignment)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteAssignment(idx)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition"
                      >
                        <MdDelete size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selector de Estrategia */}
      <div className="border-t-2 border-gray-200 pt-6">
        <h4 className="font-bold text-lg text-gray-800 mb-4">Nueva Asignación</h4>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => setStrategy('equal')}
            disabled={unassignedCount === 0}
            className={`p-4 rounded-lg border-2 transition flex flex-col items-center gap-2 ${
              strategy === 'equal'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-200 disabled:opacity-40'
            }`}
          >
            <MdLightbulb size={24} className={strategy === 'equal' ? 'text-blue-600' : 'text-gray-400'} />
            <span className={`font-bold text-sm ${strategy === 'equal' ? 'text-blue-700' : 'text-gray-600'}`}>
              Distribución Equitativa
            </span>
          </button>

          <button
            onClick={() => setStrategy('manual')}
            disabled={unassignedCount === 0}
            className={`p-4 rounded-lg border-2 transition flex flex-col items-center gap-2 ${
              strategy === 'manual'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-200 disabled:opacity-40'
            }`}
          >
            <MdEdit size={24} className={strategy === 'manual' ? 'text-blue-600' : 'text-gray-400'} />
            <span className={`font-bold text-sm ${strategy === 'manual' ? 'text-blue-700' : 'text-gray-600'}`}>
              Rango Manual
            </span>
          </button>

          <button
            onClick={() => setStrategy('selected')}
            disabled={selectedRows.size === 0}
            className={`p-4 rounded-lg border-2 transition flex flex-col items-center gap-2 ${
              strategy === 'selected'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-200 disabled:opacity-40'
            }`}
          >
            <MdFilterList size={24} className={strategy === 'selected' ? 'text-blue-600' : 'text-gray-400'} />
            <span className={`font-bold text-sm ${strategy === 'selected' ? 'text-blue-700' : 'text-gray-600'}`}>
              Filas Seleccionadas
            </span>
            {selectedRows.size > 0 && (
              <span className="text-xs text-blue-600">{selectedRows.size} marcadas</span>
            )}
          </button>
        </div>

        {/* MODO 1: Equitativa */}
        {strategy === 'equal' && (
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800">
              Seleccione personas para dividir automáticamente los {unassignedCount} ítems pendientes
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {persons.map(person => (
                <div
                  key={person.id}
                  onClick={() => {
                    const newSet = new Set(selectedPersons);
                    if (newSet.has(person.id)) newSet.delete(person.id);
                    else newSet.add(person.id);
                    setSelectedPersons(newSet);
                  }}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                    selectedPersons.has(person.id)
                      ? 'bg-blue-50 border-blue-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPersons.has(person.id)}
                    onChange={() => {}}
                    className="w-5 h-5 rounded"
                  />
                  <MdPerson className="text-blue-600" size={24} />
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{person.name}</p>
                    {person.subtitle && <p className="text-xs text-gray-500">{person.subtitle}</p>}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleEqualDistribution}
              disabled={selectedPersons.size === 0}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <MdAdd size={20} />
              Distribuir Equitativamente
            </button>
          </div>
        )}

        {/* MODO 2: Manual */}
        {strategy === 'manual' && (
          <div className="bg-blue-50 p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-600 mb-1 block">Desde</label>
                <input
                  type="number"
                  min={1}
                  max={totalItems}
                  value={rangeStart}
                  onChange={(e) => setRangeStart(Number(e.target.value))}
                  className="w-full p-2 text-center font-bold bg-white rounded-lg border-2 border-blue-300"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-600 mb-1 block">Hasta</label>
                <input
                  type="number"
                  min={rangeStart}
                  max={totalItems}
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(Number(e.target.value))}
                  className="w-full p-2 text-center font-bold bg-white rounded-lg border-2 border-blue-300"
                />
              </div>
              <div className="col-span-6">
                <label className="text-xs font-bold text-gray-600 mb-1 block">Persona</label>
                <select
                  value={selectedPerson}
                  onChange={(e) => setSelectedPerson(e.target.value)}
                  className="w-full p-2 bg-white rounded-lg border border-gray-300"
                >
                  <option value="">-- Seleccionar --</option>
                  {persons.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.subtitle ? `(${p.subtitle})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <button
                  onClick={handleManualRange}
                  className="w-full p-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
                >
                  <MdAdd size={24} className="mx-auto" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODO 3: Seleccionadas */}
        {strategy === 'selected' && (
          <PersonSelector
            title={`Asignar ${selectedRows.size} filas seleccionadas`}
            persons={persons}
            onSelect={handleSelectedRows}
            selectedRows={selectedRows}
          />
        )}
      </div>
    </div>
  );
}