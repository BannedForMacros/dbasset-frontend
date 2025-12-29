'use client';

import { useRef } from 'react';
import { MdCloudUpload, MdInsertDriveFile, MdCheckCircle } from 'react-icons/md';

interface Step2CargarExcelProps {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
}

export default function Step2CargarExcel({ selectedFile, onFileSelect }: Step2CargarExcelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <MdCloudUpload className="text-blue-600 mx-auto mb-4" size={64} />
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Cargar Archivo Excel</h3>
        <p className="text-gray-600">Seleccione el archivo con los datos del inventario</p>
      </div>

      <div
        className="border-4 border-dashed border-gray-300 rounded-lg p-16 text-center hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer group"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
          accept=".xlsx,.xls"
          className="hidden"
        />
        <MdInsertDriveFile className="text-gray-400 group-hover:text-blue-600 mx-auto mb-4" size={80} />
        <p className="text-xl font-bold text-gray-700 group-hover:text-blue-600 mb-2">
          Click para seleccionar archivo
        </p>
        <p className="text-sm text-gray-500">Formatos: .xlsx, .xls</p>
      </div>

      {selectedFile && (
        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200 flex items-center gap-3">
          <MdCheckCircle className="text-green-600" size={24} />
          <div className="flex-1">
            <p className="font-bold text-green-800">{selectedFile.name}</p>
            <p className="text-xs text-green-600">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}