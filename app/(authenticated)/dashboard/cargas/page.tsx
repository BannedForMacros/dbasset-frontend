/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect, useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  MdAdd, MdArrowForward, MdArrowBack, MdClose, MdCheck, MdInbox, MdVisibility,
  MdLocalShipping, MdInventory2, MdPendingActions, MdTaskAlt, MdUploadFile,
} from 'react-icons/md';

import { cargaService, Carga, UbicacionUnica } from '../../../services/carga.service';
import { responsableService, Responsable } from '../../../services/responsable.service';
import { inventariadorService, Inventariador } from '../../../services/inventariador.service';
import { configuracionService, CampoConfig } from '../../../services/configuracion.service';
import { localService, Local } from '../../../services/local.service';
import { areaService, Area } from '../../../services/area.service';
import { oficinaService, Oficina } from '../../../services/oficina.service';
import { authService } from '../../../services/auth.service';

import IconButton from '@/app/components/IconButton';
import { PageHeader, Boton, Pastilla, Indicador, Buscador, TablaVacia, COLORES } from '@/app/components/rfid/ui';

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
  nombre?: string;
}

interface Person {
  id: number;
  name: string;
  subtitle?: string;
}

export default function CargasPage() {
  const [cargas, setCargas] = useState<Carga[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

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
  // Modo de ubicación elegido explícitamente en el paso de mapeo:
  // 'unica' = una sola ubicación para toda la carga | 'excel' = viene en columnas del Excel
  const [modoUbicacion, setModoUbicacion] = useState<'excel' | 'unica' | null>(null);
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
    setModoUbicacion(null);
    setUbicacionUnica(null);
    setResponsableAssignments([]);
    setInventariadorAssignments([]);
    setSelectedRows(new Set());
    setSelectedCarga(null);
  };

  // Carga los catálogos que necesita el wizard (campos del activo, responsables,
  // inventariadores, ubicaciones). Se usa en AMBOS puntos de entrada del wizard
  // (botón "Nueva Carga" y botón "Continuar proceso"), para que los campos del
  // activo SIEMPRE estén disponibles en el paso de mapeo.
  const cargarDatosWizard = async () => {
    const campos = await configuracionService.obtenerCampos();
    console.log('📋 Campos RAW del backend:', campos.length, campos);
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
      name: i.nombre,
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
  };

  const iniciarWizard = async () => {
    try {
      await cargarDatosWizard();
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

  // Cambio explícito del modo de ubicación. Si elige "única", limpiamos cualquier
  // mapeo de columnas de ubicación para evitar ambigüedad.
  const handleModoUbicacionChange = (modo: 'excel' | 'unica') => {
    setModoUbicacion(modo);
    if (modo === 'unica') {
      setMapeo(prev => {
        const m = { ...prev };
        delete m['cod_local'];
        delete m['cod_area'];
        delete m['cod_oficina'];
        return m;
      });
    }
  };

  const handleStep3Next = () => {
    const faltantes = camposDinamicos.filter(c => c.esObligatorio && !mapeo[c.nombreCampoBd]);

    if (faltantes.length > 0) {
      showToast('error', 'Campos obligatorios sin mapear', faltantes.map(f => f.etiquetaUsuario).join(', '));
      return;
    }

    // El usuario DEBE elegir explícitamente cómo asignar la ubicación
    if (!modoUbicacion) {
      showToast('warning', 'Elige cómo asignar la ubicación', 'Una sola ubicación para toda la carga, o desde columnas del Excel');
      return;
    }

    if (modoUbicacion === 'excel') {
      const tieneUbicacionCompleta = !!mapeo['cod_local'] && !!mapeo['cod_area'] && !!mapeo['cod_oficina'];
      if (!tieneUbicacionCompleta) {
        showToast('error', 'Ubicación incompleta', 'Debes mapear Local, Área y Oficina, o elegir "una sola ubicación"');
        return;
      }
      setNeedsUbicacion(false);
      setSelectedRows(new Set(excelData.map((_, i) => i)));
      setWizardStep(5);
    } else {
      // 'unica' -> se asigna la ubicación única en el paso 4
      setNeedsUbicacion(true);
      setWizardStep(4);
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

  const continuarCarga = async (carga: Carga) => {
    try {
      await cargarDatosWizard();
      setSelectedCarga(carga);
      setWizardStep(carga.estado?.trim() === 'C' ? 2 : 5);
      setShowWizard(true);
    } catch (error) {
      showToast('error', 'Error al cargar los datos de la carga');
    }
  };

  const ESTADOS: Record<string, { label: string; tono: 'neutro' | 'marca' | 'ok' }> = {
    C: { label: 'Creada', tono: 'neutro' },
    A: { label: 'En proceso', tono: 'marca' },
    T: { label: 'Terminada', tono: 'ok' },
  };

  const renderEstado = (estado: string) => {
    const info = ESTADOS[estado?.trim()] || ESTADOS.C;
    return <Pastilla texto={info.label} tono={info.tono} />;
  };

  const cuenta = (e: string) => cargas.filter(c => (c.estado?.trim() || 'C') === e).length;

  const cargasVisibles = cargas.filter(c => {
    if (filtroEstado && (c.estado?.trim() || 'C') !== filtroEstado) return false;
    if (!busqueda.trim()) return true;
    const t = busqueda.toLowerCase();
    return c.descripcion?.toLowerCase().includes(t) || String(c.codCarga).includes(t) || c.fecha?.includes(t);
  });

  const getWizardSteps = () => {
    const steps = [
      { num: 1, label: 'Descripción' },
      { num: 2, label: 'Archivo' },
      { num: 3, label: 'Mapeo' }
    ];

    if (needsUbicacion) {
      steps.push({ num: 4, label: 'Ubicación' });
    }

    steps.push(
      { num: needsUbicacion ? 5 : 4, label: 'Custodios' },
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

  const pasos = getWizardSteps();
  const pasoActual = getAdjustedStep();
  const pasoActualInfo = pasos.find(p => p.num === pasoActual);
  const posicionPaso = Math.max(1, pasos.findIndex(p => p.num === pasoActual) + 1);
  const esPasoResponsables = (wizardStep === 4 && !needsUbicacion) || (wizardStep === 5 && needsUbicacion);
  const esPasoInventariadores = (wizardStep === 5 && !needsUbicacion) || (wizardStep === 6 && needsUbicacion);
  const esPasoConfirmar = (wizardStep === 6 && !needsUbicacion) || (wizardStep === 7 && needsUbicacion);

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

      <PageHeader
        titulo="Cargas de inventario"
        subtitulo="Importa activos desde Excel y asigna custodios e inventariadores"
        icono={<MdLocalShipping size={15} />}
        acciones={<Boton onClick={iniciarWizard}><MdAdd size={19} /> Nueva carga</Boton>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Indicador etiqueta="Cargas" valor={loading ? '—' : cargas.length} icono={<MdInventory2 size={22} />} tono="marca" />
        <Indicador etiqueta="En proceso" valor={loading ? '—' : cuenta('A')} icono={<MdPendingActions size={22} />} tono="alerta" />
        <Indicador etiqueta="Terminadas" valor={loading ? '—' : cuenta('T')} icono={<MdTaskAlt size={22} />} tono="acento" />
        <Indicador etiqueta="Sin archivo" valor={loading ? '—' : cuenta('C')} icono={<MdUploadFile size={22} />} tono="neutro" />
      </div>

      <div className="tabla-marco">
        <div className="tabla-barra">
          <Buscador valor={busqueda} onCambio={setBusqueda} placeholder="Buscar por descripción, código o fecha…" />
          <div className="segmentado">
            {[['', 'Todas'], ['A', 'En proceso'], ['T', 'Terminadas'], ['C', 'Creadas']].map(([v, l]) => (
              <button key={v} type="button" data-activo={filtroEstado === v} onClick={() => setFiltroEstado(v)}>{l}</button>
            ))}
          </div>
        </div>

        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th className="col-acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TablaVacia columnas={5} texto="Cargando cargas…" />
              ) : cargasVisibles.length === 0 ? (
                <TablaVacia
                  columnas={5}
                  icono={<MdInbox size={40} />}
                  texto={cargas.length === 0 ? 'No hay cargas registradas' : 'No hay cargas con ese filtro'}
                  detalle={cargas.length === 0 ? 'Crea una nueva carga para importar activos desde Excel' : undefined}
                />
              ) : (
                cargasVisibles.map((carga) => {
                  const estado = carga.estado?.trim();
                  return (
                    <tr key={carga.codCarga}>
                      <td><span className="codigo">#{carga.codCarga}</span></td>
                      <td className="font-semibold">{carga.descripcion}</td>
                      <td className="col-tenue whitespace-nowrap">{carga.fecha}</td>
                      <td>{renderEstado(carga.estado || 'C')}</td>
                      <td className="col-acciones">
                        <div className="flex items-center justify-end gap-1.5">
                          {(estado === 'A' || estado === 'T') && (
                            <IconButton variant="view" icon={<MdVisibility size={17} />} title="Ver detalle"
                              onClick={() => handleVerDetalles(carga)} />
                          )}
                          {estado !== 'T' ? (
                            <Boton pequeno variante="exito" title="Continuar proceso" onClick={() => continuarCarga(carga)}>
                              Continuar <MdArrowForward size={14} />
                            </Boton>
                          ) : (
                            <span className="text-xs px-2" style={{ color: COLORES.tenue }}>Completada</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && cargas.length > 0 && (
          <div className="tabla-pie">
            <span>
              {cargasVisibles.length === cargas.length
                ? `${cargas.length} carga${cargas.length !== 1 ? 's' : ''}`
                : `${cargasVisibles.length} de ${cargas.length} cargas`}
            </span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-overlay-in"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-6xl rounded-2xl overflow-hidden flex flex-col max-h-[95vh] animate-fade-up"
            style={{ backgroundColor: '#fff', boxShadow: '0 25px 60px rgba(0,0,0,0.15)' }}>

            <div className="px-6 pt-4 pb-5 shrink-0" style={{ background: 'linear-gradient(135deg, #003366 0%, #1e4786 100%)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {selectedCarga?.descripcion || 'Nueva carga'}
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    Paso {posicionPaso} de {pasos.length} · {pasoActualInfo?.label}
                  </p>
                </div>
                <button
                  onClick={() => setShowWizard(false)}
                  className="p-2 rounded-lg transition-colors hover:bg-white/10"
                  style={{ color: 'rgba(255,255,255,0.7)' }}
                  aria-label="Cerrar"
                >
                  <MdClose size={22} />
                </button>
              </div>

              {/* Indicador de pasos */}
              <div className="flex items-center">
                {pasos.map((step, idx) => {
                  const hecho = pasoActual > step.num;
                  const actual = pasoActual === step.num;
                  return (
                    <div key={step.num} className="flex items-center flex-1 last:flex-none">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors"
                          style={{
                            backgroundColor: hecho ? '#22c4a1' : actual ? '#fff' : 'rgba(255,255,255,0.12)',
                            color: hecho ? '#fff' : actual ? '#1e4786' : 'rgba(255,255,255,0.6)',
                          }}>
                          {hecho ? <MdCheck size={16} /> : idx + 1}
                        </div>
                        <span className="text-xs font-semibold whitespace-nowrap hidden md:inline"
                          style={{ color: actual ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                          {step.label}
                        </span>
                      </div>
                      {idx < pasos.length - 1 && (
                        <div className="h-0.5 flex-1 mx-3 rounded-full"
                          style={{ backgroundColor: hecho ? '#22c4a1' : 'rgba(255,255,255,0.15)' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: '#f8fafc' }}>
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
                  modoUbicacion={modoUbicacion}
                  onModoChange={handleModoUbicacionChange}
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

              {esPasoResponsables && (
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

              {esPasoInventariadores && (
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

              {esPasoConfirmar && selectedCarga && (
                <Step7Confirmacion
                  carga={selectedCarga}
                  totalRegistros={excelData.length}
                  responsableAssignments={responsableAssignments}
                  inventariadorAssignments={inventariadorAssignments}
                />
              )}
            </div>

            <div className="flex items-center justify-between gap-3 px-6 py-4 shrink-0"
              style={{ borderTop: '1px solid #f1f5f9', backgroundColor: '#fff' }}>
              <div>
                {wizardStep > 1 && (
                  <Boton variante="secundario" onClick={() => setWizardStep(wizardStep - 1)} disabled={uploading}>
                    <MdArrowBack size={17} /> Atrás
                  </Boton>
                )}
              </div>

              <div className="flex gap-2">
                <Boton variante="secundario" onClick={() => setShowWizard(false)} disabled={uploading}>
                  Cancelar
                </Boton>

                {wizardStep === 1 && (
                  <Boton onClick={handleStep1Next}>Continuar <MdArrowForward size={17} /></Boton>
                )}

                {wizardStep === 3 && (
                  <Boton onClick={handleStep3Next}>Continuar <MdArrowForward size={17} /></Boton>
                )}

                {wizardStep === 4 && needsUbicacion && (
                  <Boton onClick={handleStep4Next} disabled={!ubicacionUnica}>Continuar <MdArrowForward size={17} /></Boton>
                )}

                {esPasoResponsables && (
                  <Boton onClick={handleStep5Next}>Continuar <MdArrowForward size={17} /></Boton>
                )}

                {esPasoInventariadores && (
                  <Boton onClick={handleStep6Next}>Revisar <MdArrowForward size={17} /></Boton>
                )}

                {esPasoConfirmar && (
                  <Boton onClick={handleConfirmarTodo} disabled={uploading || inventariadorAssignments.length === 0}>
                    {uploading ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Procesando…
                      </>
                    ) : (
                      <>
                        <MdCheck size={18} />
                        Confirmar e importar
                      </>
                    )}
                  </Boton>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
