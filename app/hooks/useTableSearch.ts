import { useState, useMemo } from 'react';

export function useTableSearch<T>(data: T[]) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    const lowerTerm = searchTerm.toLowerCase();

    return data.filter((item) => {
      // ✅ CORRECCIÓN: Usamos 'unknown' y luego 'Record' para evitar el error 'any'
      const itemValues = Object.values(item as unknown as Record<string, unknown>);
      
      return itemValues.some((val) => 
        String(val).toLowerCase().includes(lowerTerm)
      );
    });
  }, [data, searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    filteredData
  };
}