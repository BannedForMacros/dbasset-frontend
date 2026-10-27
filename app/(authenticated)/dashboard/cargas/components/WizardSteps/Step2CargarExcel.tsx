'use client';

import { useRef, useState } from 'react';
import { MdCloudUpload, MdCheckCircle, MdTableChart } from 'react-icons/md';
import { PasoEncabezado, AvisoPaso } from '../PasoEncabezado';

interface Step2CargarExcelProps {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
}

export default function Step2CargarExcel({ selectedFile, onFileSelect }: Step2CargarExcelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <PasoEncabezado
        icono={<MdTableChart size={24} />}
        titulo="Archivo Excel de activos"
        descripcion="La primera fila debe tener los nombres de las columnas; cada fila siguiente es un activo."
      />

      <div
        role="button"
        tabIndex={0}
        className="rounded-2xl p-12 text-center cursor-pointer transition-all"
        style={{
          backgroundColor: arrastrando ? 'rgba(34,196,161,0.06)' : '#fff',
          border: `2px dashed ${arrastrando ? '#22c4a1' : '#cbd5e1'}`,
        }}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          const archivo = e.dataTransfer.files?.[0];
          if (archivo) onFileSelect(archivo);
        }}
        onMouseEnter={(e) => { if (!arrastrando) e.currentTarget.style.borderColor = '#1e4786'; }}
        onMouseLeave={(e) => { if (!arrastrando) e.currentTarget.style.borderColor = '#cbd5e1'; }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
          accept=".xlsx,.xls"
          className="hidden"
        />
        <div className="mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: 'rgba(30,71,134,0.08)', color: '#1e4786' }}>
          <MdCloudUpload size={30} />
        </div>
        <p className="font-semibold" style={{ color: '#0f172a' }}>
          Arrastre el archivo aquí o <span style={{ color: '#1e4786', textDecoration: 'underline' }}>búsquelo en su equipo</span>
        </p>
        <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Formatos admitidos: .xlsx y .xls</p>
      </div>

      {selectedFile && (
        <AvisoPaso tono="ok" icono={<MdCheckCircle size={20} />}>
          <p className="font-semibold" style={{ color: '#0f172a' }}>{selectedFile.name}</p>
          <p className="text-xs" style={{ color: '#64748b' }}>{(selectedFile.size / 1024).toFixed(1)} KB</p>
        </AvisoPaso>
      )}
    </div>
  );
}
