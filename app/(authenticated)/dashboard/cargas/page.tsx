'use client';

import { useEffect, useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { MdAdd, MdArrowForward, MdClose, MdCheck, MdInbox, MdVisibility } from 'react-icons/md';

import { cargaService, Carga, UbicacionUnica } from '../../../services/carga.service';
import { responsableService, Responsable } from '../../../services/responsable.service';
import { inventariadorService, Inventariador } from '../../../services/inventariador.service';
import { configuracionService, CampoConfig } from '../../../services/configuracion.service';
import { localService, Local } from '../../../services/local.service';
import { areaService, Area } from '../../../services/area.service';
import { oficinaService, Oficina } from '../../../services/oficina.service';

import Toast from './components/Toast';
import CargaDetalleModal from './components/CargaDetalleModal';
import Step1Descripcion from './components/WizardSteps/Step1Descripcion';
import Step2CargarExcel from './components/WizardSteps/Step2CargarExcel';
import Step3Mapeo from './components/WizardSteps/Step3Mapeo';
import Step4Ubicacion from './components/WizardSteps/Step4Ubicacion';
import Step5AsignacionResponsables from './components/WizardSteps/Step5AsignacionResponsables';
import Step6AsignacionInventariadores from './components/WizardSteps/Step6AsignacionInventariadores';
import Step7Confirmacion from './components/WizardSteps/Step7Confirmacion';

type ExcelRow = Record<string, string | number | boolean | null | undefined>;

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

interface Person {
  id: number;
  name: string;
  subtitle?: string;
}

export default function CargasPage() {
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [loading, setLoading] = useState(true);

  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedCarga, setSelectedCarga] = useState<Carga | null>(null);

  const [descripcion, setDescripcion] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);

  const [camposDinamicos, setCamposDinamicos] = useState<CampoConfig[]>([]);
  const [mapeo, setMapeo] = useState<Record<string, string>>({});

  const [needsUbicacion, setNeedsUbicacion] = useState(false);
  const [ubicacionUnica, setUbicacionUnica] = useState<UbicacionUnica | null>(null);
  const [locales, setLocales] = useState<Local[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [oficinas, setOficinas] = useState<Oficina[]>([]);

  const [responsables, setResponsables] = useState<Person[]>([]);
  const [inventariadores, setInventariadores] = useState<Person[]>([]);
  const [responsableAssignments, setResponsableAssignments] = useState<ResponsableAssignment[]>([]);
  const [inventariadorAssignments, setInventariadorAssignments] = useState<InventariadorAssignment[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string; details?: string } | null>(null);

  // Estado para modal de detalles
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [cargaSeleccionadaDetalle, setCargaSeleccionadaDetalle] = useState<Carga | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await cargaService.listarTodas();
      setCargas(data.sort((a, b) => (b.codCarga || 0) - (a.codCarga || 0)));
    } catch (error) {
      showToast('error', 'Error al cargar las cargas');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string, details?: string) => {
    setToast({ type, message, details });
  };

  const resetWizard = () => {
    setWizardStep(1);
    setDescripcion('');
    setSelectedFile(null);
    setExcelHeaders([]);
    setExcelData([]);
    setMapeo({});
    setNeedsUbicacion(false);
    setUbicacionUnica(null);
    setResponsableAssignments([]);
    setInventariadorAssignments([]);
    setSelectedRows(new Set());
    setSelectedCarga(null);
  };

  const iniciarWizard = async () => {
    try {
      const campos = await configuracionService.obtenerCampos();
      setCamposDinamicos(campos.filter(c => c.esVisible));

      const [resps, invs] = await Promise.all([
        responsableService.listarActivos(),
        inventariadorService.listarActivos()
      ]);

      setResponsables(resps.map(r => ({
        id: r.codResponsable!,
        name: r.nombreResponsable,
        subtitle: r.cargo
      })));

      setInventariadores(invs.map(i => ({
        id: i.codInventariador!,
        name: i.nombreInventariador,
        subtitle: i.dni
      })));

      const [locs, ars, offs] = await Promise.all([
        localService.listarActivos(),
        areaService.listarActivos(),
        oficinaService.listarActivos()
      ]);

      setLocales(locs);
      setAreas(ars);
      setOficinas(offs);

      resetWizard();
      setShowWizard(true);
    } catch (error) {
      showToast('error', 'Error al inicializar');
    }
  };

  const handleStep1Next = async () => {
    if (!descripcion.trim()) {
      showToast('warning', 'Descripción requerida');
      return;
    }

    try {
      const nuevaCarga = await cargaService.crear(descripcion);
      setSelectedCarga(nuevaCarga);
      setWizardStep(2);
      showToast('success', 'Carga creada', `"${descripcion}"`);
    } catch (error) {
      showToast('error', 'Error al crear la carga');
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      showToast('error', 'Archivo no válido');
      return;
    }

    setSelectedFile(file);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

      if (jsonData.length === 0) {
        showToast('error', 'Excel vacío');
        return;
      }

      const headers = jsonData[0] as string[];
      const rows: ExcelRow[] = jsonData.slice(1).map((row: unknown[]) => {
        const obj: ExcelRow = {};
        headers.forEach((h, i) => { 
          obj[h] = row[i] as string | number | boolean | null | undefined;
        });
        return obj;
      }).filter(row => Object.values(row).some(v => v !== undefined && v !== ''));

      setExcelHeaders(headers);
      setExcelData(rows);

      const autoMap: Record<string, string> = {};
      camposDinamicos.forEach(campo => {
        const palabraClave = campo.etiquetaUsuario.toLowerCase().split(' ')[0];
        const match = headers.find(h => 
          h.toLowerCase().includes(palabraClave) || 
          palabraClave.includes(h.toLowerCase())
        );
        if (match) autoMap[campo.nombreCampoBd] = match;
      });
      setMapeo(autoMap);

      showToast('success', 'Excel cargado', `${rows.length} registros`);
      setWizardStep(3);
    } catch (error) {
      showToast('error', 'Error al leer el archivo');
    }
  };

  const handleStep3Next = () => {
    const faltantes = camposDinamicos.filter(c => c.esObligatorio && !mapeo[c.nombreCampoBd]);
    
    if (faltantes.length > 0) {
      showToast('error', 'Campos obligatorios sin mapear', faltantes.map(f => f.etiquetaUsuario).join(', '));
      return;
    }

    const tieneLocal = !!mapeo['cod_local'];
    const tieneArea = !!mapeo['cod_area'];
    const tieneOficina = !!mapeo['cod_oficina'];

    const tieneUbicacionCompleta = tieneLocal && tieneArea && tieneOficina;

    if (!tieneUbicacionCompleta) {
      setNeedsUbicacion(true);
      setWizardStep(4);
    } else {
      setNeedsUbicacion(false);
      setSelectedRows(new Set(excelData.map((_, i) => i)));
      setWizardStep(5);
    }
  };

  const handleUbicacionComplete = useCallback((local: number, area: number, oficina: number) => {
    setUbicacionUnica({ codLocalUnico: local, codAreaUnica: area, codOficinaUnica: oficina });
  }, []);

  const handleStep4Next = () => {
    if (!ubicacionUnica) {
      showToast('warning', 'Complete la ubicación');
      return;
    }
    setSelectedRows(new Set(excelData.map((_, i) => i)));
    setWizardStep(5);
  };

  const handleStep5Next = () => {
    if (responsableAssignments.length === 0) {
      const confirmar = confirm(
        '⚠️ No ha asignado ningún responsable.\n\n' +
        'Puede continuar y asignarlos posteriormente, pero se recomienda hacerlo ahora.\n\n' +
        '¿Desea continuar sin responsables?'
      );
      if (!confirmar) return;
    }

    setSelectedRows(new Set(excelData.map((_, i) => i)));
    setWizardStep(6);
  };

  const handleStep6Next = () => {
    const inventariadorRows = new Set<number>();
    inventariadorAssignments.forEach(assignment => {
      for (let i = assignment.inicio; i <= assignment.fin; i++) {
        inventariadorRows.add(i);
      }
    });

    const unassignedInventariadores = excelData.length - inventariadorRows.size;

    if (unassignedInventariadores > 0) {
      alert(
        `❌ No puede continuar\n\n` +
        `Debe asignar inventariadores a TODOS los ítems.\n` +
        `Faltan ${unassignedInventariadores} ítems por asignar.`
      );
      return;
    }

    setWizardStep(7);
  };

const handleConfirmarTodo = async () => {
  if (!selectedCarga?.codCarga || !selectedFile) return;

  setUploading(true);

  try {
    const resImport = await cargaService.subirArchivoConMapeo(
      selectedCarga.codCarga,
      selectedFile,
      mapeo,
      camposDinamicos,
      ubicacionUnica || undefined
    );

    const allAssignments = [
      ...responsableAssignments.map(a => ({
        inicio: a.inicio,
        fin: a.fin,
        codResponsable: a.codResponsable,
        codInventariador: undefined
      })),
      ...inventariadorAssignments.map(a => ({
        inicio: a.inicio,
        fin: a.fin,
        codResponsable: undefined,
        codInventariador: a.codInventariador
      }))
    ];

    const mergedMap = new Map<string, { codResponsable?: number; codInventariador?: number }>();
    allAssignments.forEach(assignment => {
      for (let i = assignment.inicio; i <= assignment.fin; i++) {
        const key = `${i}`;
        const current = mergedMap.get(key) || {};
        if (assignment.codResponsable) current.codResponsable = assignment.codResponsable;
        if (assignment.codInventariador) current.codInventariador = assignment.codInventariador;
        mergedMap.set(key, current);
      }
    });

    const finalAssignments: { inicio: number; fin: number; codResponsable?: number; codInventariador?: number }[] = [];
    let currentRange: { inicio: number; fin: number; codResponsable?: number; codInventariador?: number } | null = null;

    Array.from(mergedMap.entries())
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .forEach(([key, value]) => {
        const num = Number(key);
        if (!currentRange) {
          currentRange = { inicio: num, fin: num, ...value };
        } else if (
          num === currentRange.fin + 1 &&
          value.codResponsable === currentRange.codResponsable &&
          value.codInventariador === currentRange.codInventariador
        ) {
          currentRange.fin = num;
        } else {
          finalAssignments.push(currentRange);
          currentRange = { inicio: num, fin: num, ...value };
        }
      });

    if (currentRange) finalAssignments.push(currentRange);

    if (finalAssignments.length > 0) {
      await cargaService.distribuir(selectedCarga.codCarga, finalAssignments);
    }

    // ✅ VERIFICAR EL ESTADO ACTUALIZADO DESDE EL BACKEND
    const cargaActualizada = await cargaService.obtenerPorId(selectedCarga.codCarga);
    console.log('Estado de la carga:', cargaActualizada.estado); // Para debugging

    showToast('success', '¡Completado!', `${resImport.totalProcesados} registros importados`);
    setShowWizard(false);
    cargarDatos();

  } catch (error) {
    showToast('error', 'Error en el proceso');
  } finally {
    setUploading(false);
  }
};

  const handleVerDetalles = (carga: Carga) => {
    setCargaSeleccionadaDetalle(carga);
    setShowDetalleModal(true);
  };

  const renderEstado = (estado: string) => {
    const estadoMap: Record<string, { label: string; color: string }> = {
      C: { label: 'Creada', color: 'bg-gray-100 text-gray-700 border-gray-200' },
      A: { label: 'Asignada', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      T: { label: 'Terminada', color: 'bg-green-100 text-green-800 border-green-200' }
    };

    const info = estadoMap[estado?.trim()] || estadoMap.C;

    return (
      <span className={`inline-flex items-center gap-1 ${info.color} px-3 py-1 rounded-full text-xs font-bold border`}>
        <span className="w-2 h-2 bg-current rounded-full"></span>
        {info.label}
      </span>
    );
  };

  const getWizardSteps = () => {
    const steps = [
      { num: 1, label: 'Descripción' },
      { num: 2, label: 'Cargar Excel' },
      { num: 3, label: 'Mapeo' }
    ];

    if (needsUbicacion) {
      steps.push({ num: 4, label: 'Ubicación' });
    }

    steps.push(
      { num: needsUbicacion ? 5 : 4, label: 'Responsables' },
      { num: needsUbicacion ? 6 : 5, label: 'Inventariadores' },
      { num: needsUbicacion ? 7 : 6, label: 'Confirmar' }
    );

    return steps;
  };

  const getAdjustedStep = () => {
    if (wizardStep <= 3) return wizardStep;
    if (!needsUbicacion && wizardStep > 3) return wizardStep + 1;
    return wizardStep;
  };

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          details={toast.details}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Cargas</h1>
          <p className="text-gray-600 mt-1">Administración de cargas de inventario</p>
        </div>
        <button
          onClick={iniciarWizard}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-lg font-bold"
        >
          <MdAdd size={22} /> Nueva Carga
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-left">Código</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-left">Descripción</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-left">Fecha</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-left">Estado</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                      <span className="text-gray-500">Cargando...</span>
                    </div>
                  </td>
                </tr>
              ) : cargas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center text-gray-500">
                      <MdInbox size={48} className="mb-3 text-gray-300"/> 
                      <p className="font-medium">No hay cargas registradas</p>
                      <p className="text-sm text-gray-400 mt-1">Crea una nueva carga</p>
                    </div>
                  </td>
                </tr>
              ) : (
                cargas.map((carga) => (
                  <tr key={carga.codCarga} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-bold text-blue-600">
                        #{carga.codCarga}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{carga.descripcion}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{carga.fecha}</span>
                    </td>
                    <td className="px-6 py-4">
                      {renderEstado(carga.estado || 'C')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {(carga.estado?.trim() === 'A' || carga.estado?.trim() === 'T') && (
                          <button
                            onClick={() => handleVerDetalles(carga)}
                            className="p-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition"
                            title="Ver detalles"
                          >
                            <MdVisibility size={20} />
                          </button>
                        )}
                        
                        {carga.estado?.trim() !== 'T' && (
                          <button 
                            onClick={() => {
                              setSelectedCarga(carga);
                              setWizardStep(carga.estado?.trim() === 'C' ? 2 : 5);
                              setShowWizard(true);
                            }}
                            className="p-2 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition"
                            title="Continuar proceso"
                          >
                            <MdArrowForward size={20} />
                          </button>
                        )}

                        {carga.estado?.trim() === 'T' && (
                          <span className="text-sm text-gray-500 italic px-3">
                            Completada
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {!loading && cargas.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t text-xs text-gray-500 text-right">
            Total: {cargas.length}
          </div>
        )}
      </div>

      {/* Modal de Detalles */}
      {showDetalleModal && cargaSeleccionadaDetalle && (
        <CargaDetalleModal
          codCarga={cargaSeleccionadaDetalle.codCarga!}
          descripcion={cargaSeleccionadaDetalle.descripcion}
          onClose={() => {
            setShowDetalleModal(false);
            setCargaSeleccionadaDetalle(null);
          }}
        />
      )}

      {/* Modal Wizard */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[95vh]">
            
            <div className="bg-blue-600 px-6 py-5 rounded-t-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Proceso de Carga</h2>
                <button
                  onClick={() => setShowWizard(false)}
                  className="text-white/80 hover:text-white"
                >
                  <MdClose size={24} />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                {getWizardSteps().map((step, idx) => (
                  <div key={step.num} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        getAdjustedStep() >= step.num ? 'bg-white text-blue-600' : 'bg-blue-400 text-white'
                      }`}>
                        {getAdjustedStep() > step.num ? <MdCheck size={24} /> : step.num}
                      </div>
                      <span className="text-xs text-white mt-1 font-medium">{step.label}</span>
                    </div>
                    {idx < getWizardSteps().length - 1 && (
                      <div className={`h-1 flex-1 mx-2 rounded ${
                        getAdjustedStep() > step.num ? 'bg-white' : 'bg-blue-400'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {wizardStep === 1 && (
                <Step1Descripcion
                  descripcion={descripcion}
                  onDescripcionChange={setDescripcion}
                  onNext={handleStep1Next}
                />
              )}

              {wizardStep === 2 && (
                <Step2CargarExcel
                  selectedFile={selectedFile}
                  onFileSelect={handleFileSelect}
                />
              )}

              {wizardStep === 3 && (
                <Step3Mapeo
                  campos={camposDinamicos}
                  excelHeaders={excelHeaders}
                  mapeo={mapeo}
                  onMapeoChange={(campo, columna) => setMapeo({ ...mapeo, [campo]: columna })}
                  onCampoToggle={(id, key) => {
                    setCamposDinamicos(prev => prev.map(c => 
                      c.id === id ? { ...c, [key]: !c[key] } : c
                    ));
                  }}
                />
              )}

              {wizardStep === 4 && needsUbicacion && (
                <Step4Ubicacion
                  locales={locales}
                  areas={areas}
                  oficinas={oficinas}
                  onUbicacionComplete={handleUbicacionComplete}
                />
              )}

              {((wizardStep === 4 && !needsUbicacion) || (wizardStep === 5 && needsUbicacion)) && (
                <Step5AsignacionResponsables
                  excelData={excelData}
                  responsables={responsables}
                  assignments={responsableAssignments}
                  onAssignmentsChange={setResponsableAssignments}
                  selectedRows={selectedRows}
                  onRowToggle={(idx) => {
                    const newSet = new Set(selectedRows);
                    if (newSet.has(idx)) newSet.delete(idx);
                    else newSet.add(idx);
                    setSelectedRows(newSet);
                  }}
                  onSelectAll={() => setSelectedRows(new Set(excelData.map((_, i) => i)))}
                  onDeselectAll={() => setSelectedRows(new Set())}
                />
              )}

              {((wizardStep === 5 && !needsUbicacion) || (wizardStep === 6 && needsUbicacion)) && (
                <Step6AsignacionInventariadores
                  excelData={excelData}
                  inventariadores={inventariadores}
                  assignments={inventariadorAssignments}
                  onAssignmentsChange={setInventariadorAssignments}
                  selectedRows={selectedRows}
                  onRowToggle={(idx) => {
                    const newSet = new Set(selectedRows);
                    if (newSet.has(idx)) newSet.delete(idx);
                    else newSet.add(idx);
                    setSelectedRows(newSet);
                  }}
                  onSelectAll={() => setSelectedRows(new Set(excelData.map((_, i) => i)))}
                  onDeselectAll={() => setSelectedRows(new Set())}
                  responsableAssignments={responsableAssignments}
                />
              )}

              {((wizardStep === 6 && !needsUbicacion) || (wizardStep === 7 && needsUbicacion)) && selectedCarga && (
                <Step7Confirmacion
                  carga={selectedCarga}
                  totalRegistros={excelData.length}
                  responsableAssignments={responsableAssignments}
                  inventariadorAssignments={inventariadorAssignments}
                />
              )}
            </div>

            <div className="border-t bg-gray-50 px-6 py-4 flex justify-between rounded-b-xl">
              <div>
                {wizardStep > 1 && (
                  <button
                    onClick={() => setWizardStep(wizardStep - 1)}
                    disabled={uploading}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition disabled:opacity-50"
                  >
                    ← Atrás
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowWizard(false)}
                  disabled={uploading}
                  className="px-6 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition disabled:opacity-50"
                >
                  Cancelar
                </button>

                {wizardStep === 1 && (
                  <button
                    onClick={handleStep1Next}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg transition flex items-center gap-2"
                  >
                    Continuar <MdArrowForward />
                  </button>
                )}

                {wizardStep === 3 && (
                  <button
                    onClick={handleStep3Next}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg transition flex items-center gap-2"
                  >
                    Continuar <MdArrowForward />
                  </button>
                )}

                {wizardStep === 4 && needsUbicacion && (
                  <button
                    onClick={handleStep4Next}
                    disabled={!ubicacionUnica}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg transition disabled:opacity-50 flex items-center gap-2"
                  >
                    Continuar <MdArrowForward />
                  </button>
                )}

                {((wizardStep === 4 && !needsUbicacion) || (wizardStep === 5 && needsUbicacion)) && (
                  <button
                    onClick={handleStep5Next}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg transition flex items-center gap-2"
                  >
                    Continuar <MdArrowForward />
                  </button>
                )}

                {((wizardStep === 5 && !needsUbicacion) || (wizardStep === 6 && needsUbicacion)) && (
                  <button
                    onClick={handleStep6Next}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg transition flex items-center gap-2"
                  >
                    Revisar <MdArrowForward />
                  </button>
                )}

                {((wizardStep === 6 && !needsUbicacion) || (wizardStep === 7 && needsUbicacion)) && (
                  <button
                    onClick={handleConfirmarTodo}
                    disabled={uploading || inventariadorAssignments.length === 0}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-lg transition disabled:opacity-50 flex items-center gap-2 text-lg"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <MdCheck size={24} />
                        Confirmar e Importar
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}