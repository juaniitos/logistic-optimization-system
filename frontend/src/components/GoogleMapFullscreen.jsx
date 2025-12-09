import { useEffect, useRef, useState } from 'react'
import { Spin, Alert } from 'antd'

function GoogleMapFullscreen({ warehouses, routeResult }) {
  const mapRef = useRef(null)
  const googleMapRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isMounted, setIsMounted] = useState(false)

  // Marcar como montado después del primer render
  useEffect(() => {
    setIsMounted(true)
    return () => {
      setIsMounted(false)
      googleMapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!isMounted || !warehouses || warehouses.length === 0 || !routeResult) {
      return
    }

    // Esperar un poco para asegurar que el DOM esté listo
    const timer = setTimeout(() => {
      loadGoogleMaps()
    }, 300)

    return () => clearTimeout(timer)
  }, [isMounted, warehouses, routeResult])

  const loadGoogleMaps = () => {
    if (!mapRef.current) {
      console.log('Esperando a que el contenedor esté listo...')
      setTimeout(loadGoogleMaps, 100)
      return
    }

    if (window.google && window.google.maps) {
      initializeMap()
      return
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      // Si ya existe, esperar a que esté completamente cargado
      const checkGoogle = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogle)
          initializeMap()
        }
      }, 100)

      setTimeout(() => {
        clearInterval(checkGoogle)
        if (!window.google || !window.google.maps) {
          setError('Google Maps no se cargó correctamente')
          setIsLoading(false)
        }
      }, 5000)
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCGtuNu7T2DFyRY1AkQre2mvvmjC0HH_rE&loading=async`
    script.async = true
    script.onload = () => {
      setTimeout(initializeMap, 100)
    }
    script.onerror = () => {
      console.error('Error al cargar Google Maps')
      setError('No se pudo cargar Google Maps')
      setIsLoading(false)
    }
    
    document.head.appendChild(script)
  }

  const initializeMap = () => {
    if (!mapRef.current) {
      console.log('MapRef no disponible, reintentando...')
      setTimeout(() => {
        if (mapRef.current) {
          initializeMap()
        } else {
          setError('El contenedor del mapa no está disponible')
          setIsLoading(false)
        }
      }, 200)
      return
    }

    if (!window.google || !window.google.maps) {
      console.log('Google Maps API no disponible')
      setError('Google Maps API no cargó correctamente')
      setIsLoading(false)
      return
    }

    try {
      // Centro del mapa en la primera bodega
      const center = {
        lat: warehouses[0].latitude,
        lng: warehouses[0].longitude
      }

      // Crear mapa
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 11,
        center: center,
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      })

      googleMapRef.current = map

      // Colores para las rutas
      const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2']

      // Dibujar rutas
      if (routeResult.routes && Array.isArray(routeResult.routes)) {
        // Múltiples rutas (Genetic Algorithm)
        routeResult.routes.forEach((route, routeIdx) => {
          const color = colors[routeIdx % colors.length]
          const warehouseIndices = route.warehouse_indices || route.warehouses || []

          // Si hay geometría real, usarla
          if (route.geometry && route.geometry.length > 0) {
            const path = route.geometry.map(coord => ({
              lat: coord[0],
              lng: coord[1]
            }))

            new window.google.maps.Polyline({
              path: path,
              geodesic: true,
              strokeColor: color,
              strokeOpacity: 0.8,
              strokeWeight: 4,
              map: map
            })
          } else {
            // Línea recta entre bodegas
            const path = warehouseIndices
              .map(idx => warehouses[idx])
              .filter(w => w)
              .map(w => ({ lat: w.latitude, lng: w.longitude }))

            if (path.length > 0) {
              new window.google.maps.Polyline({
                path: path,
                geodesic: true,
                strokeColor: color,
                strokeOpacity: 0.8,
                strokeWeight: 4,
                map: map
              })
            }
          }

          // Marcadores en las bodegas
          warehouseIndices.forEach((warehouseIdx, idx) => {
            const warehouse = warehouses[warehouseIdx]
            if (warehouse) {
              const marker = new window.google.maps.Marker({
                position: { lat: warehouse.latitude, lng: warehouse.longitude },
                map: map,
                title: warehouse.name,
                label: {
                  text: `${idx + 1}`,
                  color: 'white',
                  fontWeight: 'bold'
                },
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 12,
                  fillColor: color,
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2
                }
              })

              // InfoWindow
              const infoWindow = new window.google.maps.InfoWindow({
                content: `
                  <div style="padding: 8px;">
                    <strong>${warehouse.name}</strong><br/>
                    Vehículo: ${route.vehicle_id}<br/>
                    Orden: ${idx + 1}
                  </div>
                `
              })

              marker.addListener('click', () => {
                infoWindow.open(map, marker)
              })
            }
          })
        })
      } else if (routeResult.route && Array.isArray(routeResult.route)) {
        // Ruta única (Simulated Annealing o 2-opt)
        const color = colors[0]

        // Si hay geometría real, usarla
        if (routeResult.geometry && routeResult.geometry.length > 0) {
          const path = routeResult.geometry.map(coord => ({
            lat: coord[0],
            lng: coord[1]
          }))

          new window.google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: color,
            strokeOpacity: 0.8,
            strokeWeight: 4,
            map: map
          })
        } else {
          // Línea recta entre bodegas
          const path = routeResult.route
            .map(idx => warehouses[idx])
            .filter(w => w)
            .map(w => ({ lat: w.latitude, lng: w.longitude }))

          if (path.length > 0) {
            new window.google.maps.Polyline({
              path: path,
              geodesic: true,
              strokeColor: color,
              strokeOpacity: 0.8,
              strokeWeight: 4,
              map: map
            })
          }
        }

        // Marcadores
        routeResult.route.forEach((warehouseIdx, idx) => {
          const warehouse = warehouses[warehouseIdx]
          if (warehouse) {
            const marker = new window.google.maps.Marker({
              position: { lat: warehouse.latitude, lng: warehouse.longitude },
              map: map,
              title: warehouse.name,
              label: {
                text: `${idx + 1}`,
                color: 'white',
                fontWeight: 'bold'
              },
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: color,
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2
              }
            })

            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div style="padding: 8px;">
                  <strong>${warehouse.name}</strong><br/>
                  Orden: ${idx + 1}
                </div>
              `
            })

            marker.addListener('click', () => {
              infoWindow.open(map, marker)
            })
          }
        })
      }

      // Ajustar vista para incluir todos los marcadores
      const bounds = new window.google.maps.LatLngBounds()
      warehouses.forEach(warehouse => {
        bounds.extend({ lat: warehouse.latitude, lng: warehouse.longitude })
      })
      map.fitBounds(bounds)

      setIsLoading(false)
    } catch (err) {
      console.error('Error al inicializar el mapa:', err)
      setError('Error al inicializar el mapa')
      setIsLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Contenedor del mapa - siempre renderizado */}
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          minHeight: '500px',
          visibility: (!error && !isLoading) ? 'visible' : 'hidden'
        }}
      />
      
      {/* Overlays condicionales */}
      {error && (
        <div style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
          padding: 20
        }}>
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
          />
        </div>
      )}

      {isLoading && !error && (
        <div style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#f0f2f5'
        }}>
          <Spin size="large" tip="Cargando mapa de Google..." />
        </div>
      )}
    </div>
  )
}

export default GoogleMapFullscreen
