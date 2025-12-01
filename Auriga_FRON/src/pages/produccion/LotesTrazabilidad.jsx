import { useState, useRef, useEffect, useMemo } from 'react'
import { Card } from '../../components/ui/Card'
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Download, X, Package, GitBranch, Search, Filter } from 'lucide-react'
import { api } from '../../lib/api'
import { useLanguage } from '../../context/LanguageContext'
import * as XLSX from 'xlsx'

export default function LotesTrazabilidad() {
  const { t } = useLanguage()
  
  // Obtener fábrica seleccionada desde localStorage para el filtro por defecto
  const defaultFactory = useMemo(() => {
    const saved = localStorage.getItem('selectedFactory')
    return saved && saved !== 'CX' ? saved : ''
  }, [])
  
  const [file, setFile] = useState(null)
  const [data, setData] = useState([])
  const [columns, setColumns] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [previewData, setPreviewData] = useState([])
  const fileInputRef = useRef(null)
  
  const [activeTab, setActiveTab] = useState('import')
  const [batches, setBatches] = useState([])
  const [traceability, setTraceability] = useState([])
  const [loadingBatches, setLoadingBatches] = useState(false)
  const [loadingTraceability, setLoadingTraceability] = useState(false)
  
  const [filters, setFilters] = useState({
    factory: defaultFactory,
    materialCode: '',
    batchNumber: '',
    orderNumber: ''
  })

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setMessage({ type: '', text: '' })
      processExcelFile(selectedFile)
    }
  }

  const processExcelFile = (file) => {
    setLoading(true)
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'binary' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: ''
        })
        
        if (jsonData.length === 0) {
          setMessage({ type: 'error', text: 'El archivo Excel está vacío' })
          setLoading(false)
          return
        }
        
        const headers = jsonData[0].map(h => String(h).trim()).filter(h => h)
        const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== ''))
        
        setColumns(headers)
        
        const processedData = rows.map((row, index) => {
          const obj = { _rowIndex: index + 2 }
          headers.forEach((header, colIndex) => {
            obj[header] = row[colIndex] !== undefined ? String(row[colIndex]).trim() : ''
          })
          return obj
        })
        
        setData(processedData)
        setPreviewData(processedData.slice(0, 10))
        setMessage({ 
          type: 'success', 
          text: `Archivo procesado: ${processedData.length} registros encontrados, ${headers.length} columnas` 
        })
      } catch (error) {
        console.error('Error processing Excel:', error)
        setMessage({ type: 'error', text: `Error al procesar el archivo: ${error.message}` })
      } finally {
        setLoading(false)
      }
    }
    
    reader.onerror = () => {
      setMessage({ type: 'error', text: 'Error al leer el archivo' })
      setLoading(false)
    }
    
    reader.readAsBinaryString(file)
  }

  const handleUpload = async () => {
    if (!data || data.length === 0) {
      setMessage({ type: 'error', text: 'No hay datos para subir' })
      return
    }

    setUploading(true)
    setMessage({ type: '', text: '' })

    try {
      const result = await api.post('/batch/import', {
        data: data,
        columns: columns,
        filename: file?.name || 'mb51.xlsx'
      })

      setMessage({ 
        type: 'success', 
        text: `✅ ${result.message || `Se importaron ${result.count || data.length} registros exitosamente`}` 
      })
      
      if (activeTab === 'batches') {
        loadBatches()
      } else if (activeTab === 'traceability') {
        loadTraceability()
      }
      
      setTimeout(() => {
        setFile(null)
        setData([])
        setPreviewData([])
        setColumns([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }, 3000)
    } catch (error) {
      console.error('Error uploading data:', error)
      setMessage({ 
        type: 'error', 
        text: `Error al subir los datos: ${error.message}` 
      })
    } finally {
      setUploading(false)
    }
  }

  const handleClear = () => {
    setFile(null)
    setData([])
    setPreviewData([])
    setColumns([])
    setMessage({ type: '', text: '' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const loadBatches = async () => {
    setLoadingBatches(true)
    try {
      const params = new URLSearchParams()
      if (filters.factory) params.append('factory', filters.factory)
      if (filters.materialCode) params.append('material_code', filters.materialCode)
      if (filters.batchNumber) params.append('batch_number', filters.batchNumber)
      if (filters.orderNumber) params.append('order_number', filters.orderNumber)

      const data = await api.get(`/batch/list?${params.toString()}`)
      setBatches(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading batches:', error)
      setMessage({ type: 'error', text: `Error al cargar lotes: ${error.message}` })
    } finally {
      setLoadingBatches(false)
    }
  }

  const loadTraceability = async () => {
    setLoadingTraceability(true)
    try {
      const params = new URLSearchParams()
      if (filters.factory) params.append('factory', filters.factory)
      if (filters.materialCode) params.append('material_code', filters.materialCode)

      const data = await api.get(`/batch/traceability?${params.toString()}`)
      setTraceability(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading traceability:', error)
      setMessage({ type: 'error', text: `Error al cargar trazabilidad: ${error.message}` })
    } finally {
      setLoadingTraceability(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'batches') {
      loadBatches()
    } else if (activeTab === 'traceability') {
      loadTraceability()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'batches') {
      loadBatches()
    } else if (activeTab === 'traceability') {
      loadTraceability()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.factory, filters.materialCode, filters.batchNumber, filters.orderNumber])

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-blue-400" />
              {t.produccion?.lotesTrazabilidad?.title || 'Lotes y Trazabilidad'}
            </h1>
            <p className="text-gray-400">
              {t.produccion?.lotesTrazabilidad?.description || 'Importa y visualiza datos de lotes y trazabilidad desde archivos Excel (MB51)'}
            </p>
          </div>
        </div>

        <div className="flex gap-2 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('import')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'import'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            {t.common?.import || 'Importar'}
          </button>
          <button
            onClick={() => setActiveTab('batches')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'batches'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Package className="w-4 h-4 inline mr-2" />
            {t.produccion?.lotesTrazabilidad?.batches || 'Lotes'} ({batches.length})
          </button>
          <button
            onClick={() => setActiveTab('traceability')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'traceability'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <GitBranch className="w-4 h-4 inline mr-2" />
            {t.produccion?.lotesTrazabilidad?.traceability || 'Trazabilidad'} ({traceability.length})
          </button>
        </div>

        {activeTab === 'import' && (
          <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-600 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                  <Upload className="w-6 h-6 text-gray-400" />
                  <div className="flex-1">
                    <span className="text-white font-medium">
                      {file ? file.name : 'Seleccionar archivo Excel (.xlsx, .xls)'}
                    </span>
                    <p className="text-sm text-gray-400 mt-1">
                      {file ? 'Click para cambiar el archivo' : 'Click para seleccionar un archivo'}
                    </p>
                  </div>
                </div>
              </label>
              {file && (
                <button
                  onClick={handleClear}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  {t.common?.clear || 'Limpiar'}
                </button>
              )}
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-blue-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t.common?.processing || 'Procesando archivo...'}</span>
              </div>
            )}

            {message.text && (
              <div className={`p-4 rounded-lg flex items-center gap-2 ${
                message.type === 'success' 
                  ? 'bg-green-500/10 border border-green-500/50 text-green-400'
                  : 'bg-red-500/10 border border-red-500/50 text-red-400'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            {data.length > 0 && (
              <div className="flex gap-3">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t.common?.uploading || 'Subiendo...'}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      {t.common?.import || 'Importar'} {data.length} {t.common?.records || 'registros'}
                    </>
                  )}
                </button>
                <div className="px-4 py-2 bg-gray-800 rounded-lg text-gray-300 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{data.length} {t.common?.records || 'registros'} • {columns.length} {t.common?.columns || 'columnas'}</span>
                </div>
              </div>
            )}
          </div>
        </Card>
        )}

        {activeTab === 'import' && previewData.length > 0 && (
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {t.common?.preview || 'Vista Previa'} ({previewData.length} {t.common?.of || 'de'} {data.length} {t.common?.records || 'registros'})
              </h2>
              {previewData.length < data.length && (
                <span className="text-sm text-gray-400">
                  {t.common?.showingFirst || 'Mostrando primeras'} {previewData.length} {t.common?.rows || 'filas'}
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-800">
                    {columns.map((col, idx) => (
                      <th
                        key={idx}
                        className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
                    >
                      {columns.map((col, colIdx) => (
                        <td
                          key={colIdx}
                          className="px-4 py-3 text-sm text-gray-300"
                        >
                          {row[col] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeTab === 'batches' && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-white">{t.common?.filters || 'Filtros'}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">{t.common?.factory || 'Fábrica'}</label>
                  <input
                    type="text"
                    value={filters.factory}
                    onChange={(e) => setFilters({ ...filters, factory: e.target.value })}
                    placeholder="Ej: CXC"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">{t.produccion?.lotesTrazabilidad?.materialCode || 'Código Material'}</label>
                  <input
                    type="text"
                    value={filters.materialCode}
                    onChange={(e) => setFilters({ ...filters, materialCode: e.target.value })}
                    placeholder={t.produccion?.lotesTrazabilidad?.materialCode || 'Código material'}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">{t.produccion?.lotesTrazabilidad?.batchNumber || 'Número de Lote'}</label>
                  <input
                    type="text"
                    value={filters.batchNumber}
                    onChange={(e) => setFilters({ ...filters, batchNumber: e.target.value })}
                    placeholder={t.produccion?.lotesTrazabilidad?.batchNumber || 'Número de lote'}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">{t.produccion?.lotesTrazabilidad?.orderNumber || 'Orden de Fabricación'}</label>
                  <input
                    type="text"
                    value={filters.orderNumber}
                    onChange={(e) => setFilters({ ...filters, orderNumber: e.target.value })}
                    placeholder={t.produccion?.lotesTrazabilidad?.orderNumber || 'Orden'}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">{t.produccion?.lotesTrazabilidad?.batches || 'Lotes'}</h2>
                <button
                  onClick={loadBatches}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Loader2 className={`w-4 h-4 ${loadingBatches ? 'animate-spin' : ''}`} />
                  {t.common?.refresh || 'Actualizar'}
                </button>
              </div>
              
              {loadingBatches ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                </div>
              ) : batches.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t.common?.noData || 'No hay lotes disponibles'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-800">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">{t.produccion?.lotesTrazabilidad?.batch || 'Lote'}</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">{t.produccion?.lotesTrazabilidad?.material || 'Material'}</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">{t.common?.description || 'Descripción'}</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">{t.common?.quantity || 'Cantidad'}</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">{t.common?.unit || 'Unidad'}</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">{t.produccion?.lotesTrazabilidad?.movementType || 'Tipo Movimiento'}</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">{t.common?.factory || 'Fábrica'}</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">{t.produccion?.lotesTrazabilidad?.orderNumber || 'Orden Fabricación'}</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">{t.common?.date || 'Fecha'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batches.map((batch) => (
                        <tr key={batch.ID} className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-300">{batch.BatchNumber || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-300 font-mono">{batch.MaterialCode || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-300">{batch.MaterialName || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-300">{batch.Quantity || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-300">{batch.Unit || '-'}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded ${
                              batch.MovementType?.includes('Alta') 
                                ? 'bg-green-500/20 text-green-400' 
                                : batch.MovementType?.includes('Eliminación')
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-gray-700 text-gray-300'
                            }`}>
                              {batch.MovementType || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300 font-semibold">{batch.Factory || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-300 font-mono">{batch.OrderNumber || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-400">{formatDate(batch.DocumentDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'traceability' && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-semibold text-white">{t.common?.filters || 'Filtros'}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">{t.common?.factory || 'Fábrica'}</label>
                  <input
                    type="text"
                    value={filters.factory}
                    onChange={(e) => setFilters({ ...filters, factory: e.target.value })}
                    placeholder="Ej: CXC"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">{t.produccion?.lotesTrazabilidad?.materialCode || 'Código Material'}</label>
                  <input
                    type="text"
                    value={filters.materialCode}
                    onChange={(e) => setFilters({ ...filters, materialCode: e.target.value })}
                    placeholder={t.produccion?.lotesTrazabilidad?.materialCode || 'Código material'}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">{t.produccion?.lotesTrazabilidad?.traceability || 'Trazabilidad'}</h2>
                <button
                  onClick={loadTraceability}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Loader2 className={`w-4 h-4 ${loadingTraceability ? 'animate-spin' : ''}`} />
                  {t.common?.refresh || 'Actualizar'}
                </button>
              </div>
              
              {loadingTraceability ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                </div>
              ) : traceability.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t.common?.noData || 'No hay datos de trazabilidad disponibles'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-800">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">{t.produccion?.lotesTrazabilidad?.material || 'Material'}</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">{t.common?.description || 'Descripción'}</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">{t.common?.quantity || 'Cantidad'}</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">{t.produccion?.lotesTrazabilidad?.movementType || 'Tipo Movimiento'}</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">{t.common?.factory || 'Fábrica'}</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">{t.produccion?.lotesTrazabilidad?.orderNumber || 'Orden Fabricación'}</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">{t.produccion?.lotesTrazabilidad?.sourceBatch || 'Lote Origen'}</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">{t.produccion?.lotesTrazabilidad?.destinationBatch || 'Lote Destino'}</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700">{t.common?.date || 'Fecha'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {traceability.map((trace) => (
                        <tr key={trace.ID} className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-300 font-mono">{trace.MaterialCode || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-300">{trace.MaterialName || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-300">{trace.Quantity || '-'}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded ${
                              trace.MovementType?.includes('Alta') 
                                ? 'bg-green-500/20 text-green-400' 
                                : trace.MovementType?.includes('Eliminación')
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-gray-700 text-gray-300'
                            }`}>
                              {trace.MovementType || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300 font-semibold">{trace.Factory || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-300 font-mono">{trace.OrderNumber || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-300">{trace.SourceBatch || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-300">{trace.DestinationBatch || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-400">{formatDate(trace.DocumentDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
