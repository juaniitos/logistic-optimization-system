import { useEffect, useRef, useState } from 'react'
import { Spin } from 'antd'

function GoogleMapSmall({ warehouses, routeResult, height = '500px' }) {
  const mapRef = useRef(null)
  const googleMapRef = useRef(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

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

    const timer = setTimeout(() => {
      loadGoogleMaps()
    }, 200)

    return () => clearTimeout(timer)
  }, [isMounted, warehouses, routeResult])

  const loadGoogleMaps = () => {
    if (!mapRef.current) {
      setTimeout(loadGoogleMaps, 100)
      return
    }

    if (window.google && window.google.maps) {
      initializeMap()
      return
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      const checkGoogle = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogle)
          initializeMap()
        }
      }, 100)

      setTimeout(() => clearInterval(checkGoogle), 5000)
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCGtuNu7T2DFyRY1AkQre2mvvmjC0HH_rE&loading=async`
    script.async = true
    script.onload = () => {
      setTimeout(initializeMap, 100)
    }
    
    document.head.appendChild(script)
  }

  const initializeMap = () => {
    if (!mapRef.current || !window.google || !window.google.maps) {
      setTimeout(() => {
        if (mapRef.current && window.google && window.google.maps) {
          initializeMap()
        }
      }, 200)
      return
    }

    try {
      const center = {
        lat: warehouses[0].latitude,
        lng: warehouses[0].longitude
      }

      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 10,
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

      const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2']

      // Dibujar rutas
      if (routeResult.routes && Array.isArray(routeResult.routes)) {
        routeResult.routes.forEach((route, routeIdx) => {
          const color = colors[routeIdx % colors.length]
          const warehouseIndices = route.warehouse_indices || route.warehouses || []

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
              strokeWeight: 3,
              map: map
            })
          } else {
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
                strokeWeight: 3,
                map: map
              })
            }
          }

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
                  fontWeight: 'bold',
                  fontSize: '10px'
                },
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 8,
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
        const color = colors[0]

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
            strokeWeight: 3,
            map: map
          })
        } else {
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
              strokeWeight: 3,
              map: map
            })
          }
        }

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
                fontWeight: 'bold',
                fontSize: '10px'
              },
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
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

      const bounds = new window.google.maps.LatLngBounds()
      warehouses.forEach(warehouse => {
        bounds.extend({ lat: warehouse.latitude, lng: warehouse.longitude })
      })
      map.fitBounds(bounds)

      setIsLoading(false)
    } catch (err) {
      console.error('Error al inicializar el mapa:', err)
      setIsLoading(false)
    }
  }

  return (
    <div style={{ width: '100%', height: height, position: 'relative' }}>
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          visibility: !isLoading ? 'visible' : 'hidden'
        }}
      />
      
      {isLoading && (
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
          <Spin size="large" />
        </div>
      )}
    </div>
  )
}

export default GoogleMapSmall
