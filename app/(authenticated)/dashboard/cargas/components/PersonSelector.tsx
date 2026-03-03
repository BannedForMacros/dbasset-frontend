'use client';

import { useState } from 'react';
import { MdSearch, MdPerson, MdArrowForward } from 'react-icons/md';

interface Person {
  id: number;
  name: string;
  subtitle?: string;
}

interface PersonSelectorProps {
  title: string;
  persons: Person[];
  onSelect: (personId: number) => void;
  selectedRows?: Set<number>;
}

export default function PersonSelector({ 
  title, 
  persons, 
  onSelect,
  selectedRows
}: PersonSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

const filteredPersons = (persons || []).filter(p => {
  // Usamos una constante para asegurar que siempre haya un string, incluso si name es undefined
  const nombre = p?.name?.toString().toLowerCase() || "";
  const subtitulo = p?.subtitle?.toString().toLowerCase() || "";
  const busqueda = searchTerm.toLowerCase();

  return nombre.includes(busqueda) || subtitulo.includes(busqueda);
});

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-gray-800">{title}</h4>
        {selectedRows && selectedRows.size > 0 && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">
            {selectedRows.size} filas seleccionadas
          </span>
        )}
      </div>
      
      <div className="relative">
        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
        />
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {filteredPersons.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No se encontraron resultados</p>
        ) : (
          filteredPersons.map(person => (
            <button
              key={person.id}
              onClick={() => onSelect(person.id)}
              className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition text-left"
            >
              <MdPerson className="text-blue-600 shrink-0" size={24} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 truncate">{person.name}</p>
                {person.subtitle && (
                  <p className="text-xs text-gray-500 truncate">{person.subtitle}</p>
                )}
              </div>
              <MdArrowForward className="text-gray-400 shrink-0" size={20} />
            </button>
          ))
        )}
      </div>
    </div>
  );
}