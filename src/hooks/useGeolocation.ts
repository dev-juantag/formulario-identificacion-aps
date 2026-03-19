'use client'

import { useState, useCallback } from 'react'

export const useGeolocation = () => {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const capture = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada por el navegador')
      return
    }

    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setError(null)
        setLoading(false)
      },
      (err) => {
        setError('No se pudo capturar la ubicación. Verifique los permisos.')
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  return { coords, error, loading, capture }
}
