import { useState, useCallback } from 'react'
import api from '../../../../lib/api'

const isDev = import.meta.env.DEV
const debug = {
  log: isDev ? console.log.bind(console) : () => {},
  error: isDev ? console.error.bind(console) : () => {}
}

/**
 * Hook para manejar la gestión de órdenes de fabricación
 * Encapsula la lógica de selección, inicio, fin y edición de fechas
 */
export function useOrderManagement(selectedLine, refetchOrders, refetchRecipe) {
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [editingDates, setEditingDates] = useState(null)
  const [dateEdit, setDateEdit] = useState({ start: '', end: '' })
  const [tempDates, setTempDates] = useState({})
  const [updatingOrder, setUpdatingOrder] = useState(null)

  const handleSelectOrder = useCallback((order) => {
    setSelectedOrder(order)
  }, [])

  const handleStartFinish = useCallback(async (orderNumber, action, onSuccess, onError) => {
    if (!selectedLine) return

    try {
      setUpdatingOrder(orderNumber)

      const sapCode = selectedLine.sap_code || selectedLine.code || selectedLine.line || ''
      const headers = {
        'Content-Type': 'application/json',
        'Factory': selectedLine.factory,
        'ProdLine': selectedLine.line,
        'SapCode': sapCode,
        'SapRequest': 'false',
        'OrderNumber': orderNumber,
        'StartFinish': action
      }

      await api.get('/sap/orders/startFinish', { headers })

      // Recargar órdenes
      await refetchOrders()

      // Si se inició la orden, seleccionarla y cargar receta
      if (action === 'Start') {
        setTimeout(async () => {
          await refetchOrders()
          if (refetchRecipe) {
            setTimeout(() => refetchRecipe(), 200)
          }
        }, 500)
      } else if (action === 'Finish') {
        // Si se finalizó, limpiar selección si era la orden seleccionada
        if (selectedOrder && selectedOrder.OrderNumber === orderNumber) {
          setSelectedOrder(null)
        }
      }

      if (onSuccess) {
        onSuccess(`Orden ${action === 'Start' ? 'iniciada' : 'finalizada'} exitosamente`)
      }
    } catch (err) {
      debug.error(`Error ${action} order:`, err)
      if (onError) {
        onError(`Error al ${action === 'Start' ? 'iniciar' : 'finalizar'} la orden`)
      }
    } finally {
      setUpdatingOrder(null)
    }
  }, [selectedLine, selectedOrder, refetchOrders, refetchRecipe])

  const handleEditDates = useCallback((order) => {
    setEditingDates(order.OrderNumber)
    const startDate = order.StarteddAt ? new Date(order.StarteddAt).toISOString().slice(0, 16) : ''
    const endDate = order.FinishedAt ? new Date(order.FinishedAt).toISOString().slice(0, 16) : ''
    setDateEdit({ start: startDate, end: endDate })
  }, [])

  const handleIniciar = useCallback((orderNumber, onSuccess, onError) => {
    if (!dateEdit.start) {
      if (onError) onError('Por favor, completa la fecha de inicio')
      return
    }

    setTempDates(prev => ({
      ...prev,
      [orderNumber]: {
        ...prev[orderNumber],
        start: dateEdit.start,
        end: prev[orderNumber]?.end || dateEdit.end || ''
      }
    }))

    setEditingDates(null)
    setDateEdit({ start: '', end: '' })

    if (onSuccess) {
      onSuccess('✅ Fecha de inicio guardada temporalmente. Selecciona la orden para ver receta y componentes.')
    }
  }, [dateEdit])

  const handleFin = useCallback((orderNumber, onSuccess) => {
    if (!dateEdit.end) {
      if (onSuccess) onSuccess('Por favor, completa la fecha de fin')
      return
    }

    setTempDates(prev => ({
      ...prev,
      [orderNumber]: {
        ...prev[orderNumber],
        start: prev[orderNumber]?.start || dateEdit.start || '',
        end: dateEdit.end
      }
    }))

    setEditingDates(null)
    setDateEdit({ start: '', end: '' })

    if (onSuccess) {
      onSuccess('✅ Fecha de fin guardada temporalmente.')
    }
  }, [dateEdit])

  const handleCancelEditDates = useCallback(() => {
    setEditingDates(null)
    setDateEdit({ start: '', end: '' })
  }, [])

  const handleSaveAll = useCallback(async (onSuccess, onError) => {
    if (!selectedLine || !selectedOrder) {
      if (onError) onError('Por favor, selecciona una línea y una orden')
      return
    }

    try {
      setUpdatingOrder(selectedOrder.OrderNumber)

      const orderNumber = selectedOrder.OrderNumber
      const tempOrderDates = tempDates[orderNumber]

      if (!tempOrderDates || !tempOrderDates.start || !tempOrderDates.end) {
        if (onError) onError('Por favor, completa las fechas de inicio y fin antes de guardar')
        setUpdatingOrder(null)
        return
      }

      const sapCode = selectedLine.sap_code || selectedLine.code || selectedLine.line || ''
      const headers = {
        'Content-Type': 'application/json',
        'Factory': selectedLine.factory,
        'ProdLine': selectedLine.line,
        'SapCode': sapCode,
        'SapRequest': 'false',
        'OrderNumber': orderNumber,
        'StarteddAt': new Date(tempOrderDates.start).toISOString(),
        'FinishedAt': new Date(tempOrderDates.end).toISOString()
      }

      await api.get('/sap/orders/update', { headers })

      // Recargar órdenes
      await refetchOrders()

      // Limpiar fechas temporales
      setTempDates(prev => {
        const newTempDates = { ...prev }
        delete newTempDates[orderNumber]
        return newTempDates
      })

      setUpdatingOrder(null)

      if (onSuccess) {
        onSuccess('✅ Todo guardado exitosamente: fechas y asignaciones de componentes')
      }
    } catch (err) {
      debug.error('Error saving all:', err)
      if (onError) onError('Error al guardar. Por favor, intenta nuevamente.')
      setUpdatingOrder(null)
    }
  }, [selectedLine, selectedOrder, tempDates, refetchOrders])

  return {
    selectedOrder,
    editingDates,
    dateEdit,
    tempDates,
    updatingOrder,
    handleSelectOrder,
    handleStartFinish,
    handleEditDates,
    handleIniciar,
    handleFin,
    handleCancelEditDates,
    handleSaveAll,
    setDateEdit
  }
}
