import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input, Select,
  message, Popconfirm, Row, Col, Statistic, Tooltip, Divider, TimePicker,
  InputNumber, Tabs, Alert, Spin
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined,
  HomeOutlined, ShopOutlined, AimOutlined, PhoneOutlined, UserOutlined,
  ReloadOutlined, SearchOutlined, ClockCircleOutlined, GlobalOutlined,
  CompassOutlined, SaveOutlined
} from '@ant-design/icons'
// Nota: La búsqueda por dirección requiere habilitar Geocoding API en Google Cloud Console
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../services/api'
import dayjs from 'dayjs'

const { Option } = Select

// Componente de mapa para selector de ubicación con búsqueda
const LocationMapSelector = ({ position, onPositionChange, onAddressFound }) => {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerInstanceRef = useRef(null)
  const searchInputRef = useRef(null)
  const [isMapReady, setIsMapReady] = useState(false)
  const [foundAddress, setFoundAddress] = useState('')

  // Geocodificación inversa - obtener dirección desde coordenadas
  const reverseGeocode = useCallback(async (pos) => {
    if (!window.google?.maps?.Geocoder) return

    try {
      const geocoder = new window.google.maps.Geocoder()
      const response = await geocoder.geocode({ location: pos })
      if (response.results && response.results[0]) {
        const address = response.results[0].formatted_address
        setFoundAddress(address)
        if (onAddressFound) {
          onAddressFound(address)
        }
      }
    } catch (error) {
      console.log('Geocodificación no disponible:', error.message)
    }
  }, [onAddressFound])

  const initializeMap = useCallback(() => {
    if (!mapContainerRef.current || !window.google?.maps?.Map || !window.google?.maps?.Marker) {
      return
    }

    const center = position || { lat: -2.1894, lng: -79.8890 }

    const map = new window.google.maps.Map(mapContainerRef.current, {
      zoom: 14,
      center: center,
      mapTypeId: 'roadmap',
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true
    })
    mapInstanceRef.current = map

    const marker = new window.google.maps.Marker({
      position: center,
      map: map,
      draggable: true,
      animation: window.google.maps.Animation.DROP,
      title: 'Arrastra para seleccionar ubicación'
    })
    markerInstanceRef.current = marker

    // Click en el mapa
    map.addListener('click', (e) => {
      const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() }
      marker.setPosition(e.latLng)
      marker.setAnimation(window.google.maps.Animation.BOUNCE)
      setTimeout(() => marker.setAnimation(null), 500)
      onPositionChange(newPos)
      reverseGeocode(newPos)
    })

    // Arrastrar marcador
    marker.addListener('dragend', () => {
      const pos = marker.getPosition()
      const newPos = { lat: pos.lat(), lng: pos.lng() }
      onPositionChange(newPos)
      reverseGeocode(newPos)
    })

    // Configurar autocompletado de Places
    if (searchInputRef.current && window.google.maps.places) {
      const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        componentRestrictions: { country: 'ec' },
        fields: ['formatted_address', 'geometry', 'name']
      })

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (!place.geometry || !place.geometry.location) {
          message.warning('No se encontró la ubicación')
          return
        }

        const newPos = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        }

        map.setCenter(place.geometry.location)
        map.setZoom(17)
        marker.setPosition(place.geometry.location)
        marker.setAnimation(window.google.maps.Animation.BOUNCE)
        setTimeout(() => marker.setAnimation(null), 500)

        onPositionChange(newPos)
        const addr = place.formatted_address || place.name || ''
        setFoundAddress(addr)
        if (onAddressFound) {
          onAddressFound(addr)
        }
      })
    }

    setIsMapReady(true)
  }, [position, onPositionChange, onAddressFound, reverseGeocode])

  // Cargar Google Maps API
  useEffect(() => {
    let isMounted = true
    let checkInterval = null

    const waitForGoogleMaps = () => {
      if (window.google?.maps?.Map && window.google?.maps?.Marker) {
        if (isMounted) {
          initializeMap()
        }
        return true
      }
      return false
    }

    const loadGoogleMaps = () => {
      if (waitForGoogleMaps()) return

      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
      if (existingScript) {
        checkInterval = setInterval(() => {
          if (waitForGoogleMaps()) clearInterval(checkInterval)
        }, 200)
        setTimeout(() => { if (checkInterval) clearInterval(checkInterval) }, 15000)
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCGtuNu7T2DFyRY1AkQre2mvvmjC0HH_rE&libraries=places`
      script.async = true
      script.onload = () => {
        checkInterval = setInterval(() => {
          if (waitForGoogleMaps()) clearInterval(checkInterval)
        }, 100)
      }
      document.head.appendChild(script)
    }

    const timer = setTimeout(loadGoogleMaps, 100)
    return () => {
      isMounted = false
      clearTimeout(timer)
      if (checkInterval) clearInterval(checkInterval)
    }
  }, [initializeMap])

  // Actualizar marcador si la posición cambia externamente
  useEffect(() => {
    if (position && markerInstanceRef.current && mapInstanceRef.current) {
      const currentPos = markerInstanceRef.current.getPosition()
      if (currentPos && (currentPos.lat() !== position.lat || currentPos.lng() !== position.lng)) {
        markerInstanceRef.current.setPosition(position)
        mapInstanceRef.current.setCenter(position)
      }
    }
  }, [position])

  return (
    <div style={{ position: 'relative' }}>
      {/* Campo de búsqueda - Input HTML nativo para compatibilidad con Places Autocomplete */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          border: '1px solid #d9d9d9',
          borderRadius: 8,
          padding: '8px 12px',
          background: '#fff'
        }}>
          <SearchOutlined style={{ color: '#1890ff', marginRight: 8, fontSize: 18 }} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar dirección... (ej: Av. 9 de Octubre, Guayaquil)"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 14,
              padding: '4px 0'
            }}
          />
        </div>
      </div>

      {/* Instrucciones */}
      <Alert
        message="Selecciona la ubicación en el mapa"
        description="Busca una dirección arriba, haz clic en el mapa o arrastra el marcador para seleccionar la ubicación exacta."
        type="info"
        showIcon
        icon={<CompassOutlined />}
        style={{ marginBottom: 12 }}
      />

      {/* Contenedor del mapa */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '400px',
          borderRadius: 12,
          border: '2px solid #1890ff',
          boxShadow: '0 4px 12px rgba(24, 144, 255, 0.15)',
          background: '#f0f2f5'
        }}
      />

      {/* Dirección encontrada */}
      {foundAddress && (
        <div style={{
          marginTop: 12,
          padding: '8px 12px',
          background: '#f6ffed',
          border: '1px solid #b7eb8f',
          borderRadius: 6
        }}>
          <Space>
            <EnvironmentOutlined style={{ color: '#52c41a' }} />
            <span style={{ fontSize: 13 }}>{foundAddress}</span>
          </Space>
        </div>
      )}

      {/* Coordenadas seleccionadas */}
      {position && (
        <div style={{ 
          marginTop: 12, 
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)',
          borderRadius: 8,
          border: '1px solid #91d5ff'
        }}>
          <Row gutter={16} align="middle">
            <Col>
              <EnvironmentOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            </Col>
            <Col flex="auto">
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>Coordenadas seleccionadas</div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>
                {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
              </div>
            </Col>
            <Col>
              <Button 
                type="link" 
                href={`https://www.google.com/maps?q=${position.lat},${position.lng}`}
                target="_blank"
                icon={<GlobalOutlined />}
              >
                Ver en Google Maps
              </Button>
            </Col>
          </Row>
        </div>
      )}

      {!isMapReady && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          zIndex: 10
        }}>
          <Spin size="large" />
          <div style={{ marginTop: 8, color: '#666' }}>Cargando mapa...</div>
        </div>
      )}
    </div>
  )
}

// Componente de mapa de vista general de ubicaciones
const LocationsOverviewMap = ({ locations, onLocationClick }) => {
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const [isMapReady, setIsMapReady] = useState(false)

  useEffect(() => {
    if (!locations || locations.length === 0) return

    let checkInterval = null

    const initMap = () => {
      // Verificar que Google Maps esté completamente cargado
      if (!mapContainerRef.current || !window.google?.maps?.Map || !window.google?.maps?.Marker) {
        checkInterval = setTimeout(initMap, 200)
        return
      }

      const map = new window.google.maps.Map(mapContainerRef.current, {
        zoom: 10,
        center: { lat: locations[0].latitude, lng: locations[0].longitude },
        mapTypeId: 'roadmap',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
      })

      mapInstanceRef.current = map

      const bounds = new window.google.maps.LatLngBounds()

      // Iconos por tipo de ubicación
      const icons = {
        origin: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#52c41a',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        },
        destination: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 7,
          fillColor: '#1890ff',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        },
        warehouse: {
          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
          scale: 1.5,
          fillColor: '#faad14',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 1,
          anchor: new window.google.maps.Point(12, 22)
        }
      }

      locations.forEach((loc) => {
        const position = { lat: loc.latitude, lng: loc.longitude }
        bounds.extend(position)

        const marker = new window.google.maps.Marker({
          position,
          map,
          title: loc.name,
          icon: icons[loc.location_type] || icons.destination
        })

        const typeLabels = {
          origin: 'Punto de Origen',
          destination: 'Punto de Llegada',
          warehouse: 'Bodega'
        }

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 200px;">
              <h4 style="margin: 0 0 8px 0; color: #1890ff;">${loc.name}</h4>
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">
                <strong>Tipo:</strong> ${typeLabels[loc.location_type] || loc.location_type}
              </p>
              ${loc.address ? `<p style="margin: 0 0 4px 0; font-size: 12px;">${loc.address}</p>` : ''}
              ${loc.contact_name ? `<p style="margin: 0 0 4px 0; font-size: 12px;">👤 ${loc.contact_name}</p>` : ''}
              ${loc.contact_phone ? `<p style="margin: 0 0 4px 0; font-size: 12px;">📞 ${loc.contact_phone}</p>` : ''}
              <p style="margin: 8px 0 0 0; font-size: 11px; color: #999;">
                📍 ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}
              </p>
            </div>
          `
        })

        marker.addListener('click', () => {
          infoWindow.open(map, marker)
          if (onLocationClick) onLocationClick(loc)
        })
      })

      map.fitBounds(bounds)
      setIsMapReady(true)
    }

    // Iniciar la carga/inicialización del mapa
    initMap()

    return () => {
      if (checkInterval) clearTimeout(checkInterval)
    }
  }, [locations, onLocationClick])

  return (
    <div style={{ position: 'relative', width: '100%', height: '350px' }}>
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 8,
          border: '1px solid #d9d9d9'
        }}
      />
      {!isMapReady && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f5',
          borderRadius: 8
        }}>
          <Spin size="large" />
          <div style={{ marginTop: 8, color: '#666' }}>Cargando mapa...</div>
        </div>
      )}
    </div>
  )
}

function Locations() {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingLocation, setEditingLocation] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [typeFilter, setTypeFilter] = useState(null)
  const [mapModalVisible, setMapModalVisible] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState(null)
  const [showOverviewMap, setShowOverviewMap] = useState(true)
  const [form] = Form.useForm()

  useEffect(() => {
    loadLocations()
  }, [typeFilter])

  const loadLocations = async () => {
    setLoading(true)
    try {
      const data = await getWarehouses(typeFilter)
      setLocations(data)
    } catch (error) {
      message.error('Error al cargar ubicaciones')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = (locationType = 'warehouse') => {
    setEditingLocation(null)
    form.resetFields()
    form.setFieldValue('location_type', locationType)
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingLocation(record)
    form.setFieldsValue({
      ...record,
      opening_time: record.opening_time ? dayjs(record.opening_time, 'HH:mm') : null,
      closing_time: record.closing_time ? dayjs(record.closing_time, 'HH:mm') : null
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await deleteWarehouse(id)
      message.success('Ubicación eliminada correctamente')
      loadLocations()
    } catch (error) {
      message.error(error.response?.data?.detail || 'Error al eliminar ubicación')
    }
  }

  const handleSubmit = async (values) => {
    try {
      const data = {
        ...values,
        opening_time: values.opening_time ? values.opening_time.format('HH:mm') : null,
        closing_time: values.closing_time ? values.closing_time.format('HH:mm') : null
      }

      if (editingLocation) {
        await updateWarehouse(editingLocation.id, data)
        message.success('Ubicación actualizada correctamente')
      } else {
        await createWarehouse(data)
        message.success('Ubicación creada correctamente')
      }
      setModalVisible(false)
      loadLocations()
    } catch (error) {
      message.error(error.response?.data?.detail || 'Error al guardar ubicación')
    }
  }

  const openMapSelector = () => {
    const lat = form.getFieldValue('latitude')
    const lng = form.getFieldValue('longitude')
    setSelectedPosition({
      lat: lat || -2.1894,
      lng: lng || -79.8890
    })
    setMapModalVisible(true)
  }

  const handlePositionChange = (newPosition) => {
    setSelectedPosition(newPosition)
  }

  const handleAddressFound = (address) => {
    // Auto-rellenar el campo de dirección cuando se encuentra una
    form.setFieldsValue({ address: address })
  }

  const confirmMapSelection = () => {
    if (selectedPosition) {
      form.setFieldsValue({
        latitude: parseFloat(selectedPosition.lat.toFixed(6)),
        longitude: parseFloat(selectedPosition.lng.toFixed(6))
      })
      message.success('Ubicación guardada correctamente')
    }
    setMapModalVisible(false)
  }

  const handleOverviewLocationClick = (location) => {
    // Al hacer clic en una ubicación del mapa de vista general, editar esa ubicación
    handleEdit(location)
  }

  const getTypeTag = (type) => {
    const typeConfig = {
      origin: { color: 'green', icon: <AimOutlined />, text: 'Punto de Origen' },
      destination: { color: 'blue', icon: <EnvironmentOutlined />, text: 'Punto de Llegada' },
      warehouse: { color: 'orange', icon: <ShopOutlined />, text: 'Bodega' }
    }
    const config = typeConfig[type] || { color: 'default', icon: <HomeOutlined />, text: type }
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    )
  }

  const filteredLocations = locations.filter(loc => {
    const searchLower = searchText.toLowerCase()
    return (
      loc.name.toLowerCase().includes(searchLower) ||
      (loc.address && loc.address.toLowerCase().includes(searchLower))
    )
  })

  const stats = {
    total: locations.length,
    origins: locations.filter(l => l.location_type === 'origin').length,
    destinations: locations.filter(l => l.location_type === 'destination').length,
    warehouses: locations.filter(l => l.location_type === 'warehouse').length
  }

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Space>
          <EnvironmentOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Space>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name)
    },
    {
      title: 'Tipo',
      dataIndex: 'location_type',
      key: 'location_type',
      render: (type) => getTypeTag(type),
      filters: [
        { text: 'Punto de Origen', value: 'origin' },
        { text: 'Punto de Llegada', value: 'destination' },
        { text: 'Bodega', value: 'warehouse' }
      ],
      onFilter: (value, record) => record.location_type === value
    },
    {
      title: 'Dirección',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true
    },
    {
      title: 'Coordenadas',
      key: 'coords',
      render: (_, record) => (
        <Tooltip title="Click para ver en mapa">
          <a
            href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12 }}
          >
            {record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}
          </a>
        </Tooltip>
      )
    },
    {
      title: 'Contacto',
      key: 'contact',
      render: (_, record) => (
        <div>
          {record.contact_name && (
            <div><UserOutlined /> {record.contact_name}</div>
          )}
          {record.contact_phone && (
            <div><PhoneOutlined /> {record.contact_phone}</div>
          )}
        </div>
      )
    },
    {
      title: 'Horario',
      key: 'schedule',
      render: (_, record) => (
        record.opening_time && record.closing_time ? (
          <Tag icon={<ClockCircleOutlined />}>
            {record.opening_time} - {record.closing_time}
          </Tag>
        ) : '-'
      )
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="Editar">
            <Button
              type="primary"
              ghost
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
            />
          </Tooltip>
          <Popconfirm
            title="¿Eliminar ubicación?"
            description="Esta acción no se puede deshacer"
            onConfirm={() => handleDelete(record.id)}
            okText="Sí"
            cancelText="No"
          >
            <Tooltip title="Eliminar">
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const tabItems = [
    {
      key: 'all',
      label: 'Todos',
      children: null
    },
    {
      key: 'origin',
      label: (
        <span>
          <AimOutlined /> Orígenes ({stats.origins})
        </span>
      ),
      children: null
    },
    {
      key: 'destination',
      label: (
        <span>
          <EnvironmentOutlined /> Destinos ({stats.destinations})
        </span>
      ),
      children: null
    },
    {
      key: 'warehouse',
      label: (
        <span>
          <ShopOutlined /> Bodegas ({stats.warehouses})
        </span>
      ),
      children: null
    }
  ]

  return (
    <div>
      <h1>📍 Gestión de Ubicaciones</h1>
      <p>Administra puntos de origen, destinos de entrega y bodegas</p>

      {/* Estadísticas */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Ubicaciones"
              value={stats.total}
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Puntos de Origen"
              value={stats.origins}
              prefix={<AimOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Puntos de Llegada"
              value={stats.destinations}
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Bodegas"
              value={stats.warehouses}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Mapa de Vista General de Ubicaciones */}
      {showOverviewMap && locations.length > 0 && (
        <Card
          title={
            <Space>
              <GlobalOutlined style={{ color: '#1890ff' }} />
              <span>Mapa de Ubicaciones</span>
            </Space>
          }
          extra={
            <Button 
              type="text" 
              onClick={() => setShowOverviewMap(false)}
              size="small"
            >
              Ocultar mapa
            </Button>
          }
          style={{ marginBottom: 24 }}
          styles={{ body: { padding: 0, overflow: 'hidden', borderRadius: '0 0 8px 8px' } }}
        >
          <LocationsOverviewMap 
            locations={locations} 
            onLocationClick={handleOverviewLocationClick}
          />
          <div style={{ padding: '12px 16px', background: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
            <Space split={<Divider type="vertical" />}>
              <span><Tag color="green">●</Tag> Puntos de Origen ({stats.origins})</span>
              <span><Tag color="blue">▼</Tag> Puntos de Llegada ({stats.destinations})</span>
              <span><Tag color="orange">📍</Tag> Bodegas ({stats.warehouses})</span>
            </Space>
          </div>
        </Card>
      )}

      {!showOverviewMap && locations.length > 0 && (
        <Button 
          type="dashed" 
          icon={<GlobalOutlined />}
          onClick={() => setShowOverviewMap(true)}
          style={{ marginBottom: 16 }}
        >
          Mostrar mapa de ubicaciones
        </Button>
      )}

      {/* Tabla de Ubicaciones */}
      <Card
        title="Lista de Ubicaciones"
        extra={
          <Space>
            <Input
              placeholder="Buscar..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={loadLocations}
            >
              Actualizar
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleCreate('destination')}
            >
              Nuevo Punto de Llegada
            </Button>
            <Button
              icon={<PlusOutlined />}
              onClick={() => handleCreate('origin')}
            >
              Nuevo Origen
            </Button>
          </Space>
        }
      >
        <Tabs
          items={tabItems}
          onChange={(key) => setTypeFilter(key === 'all' ? null : key)}
          style={{ marginBottom: 16 }}
        />
        
        <Table
          columns={columns}
          dataSource={filteredLocations}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} ubicaciones`
          }}
        />
      </Card>

      {/* Modal de Crear/Editar */}
      <Modal
        title={editingLocation ? 'Editar Ubicación' : 'Nueva Ubicación'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            location_type: 'destination'
          }}
        >
          <Divider orientation="left">Información Básica</Divider>
          
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="name"
                label="Nombre"
                rules={[{ required: true, message: 'El nombre es requerido' }]}
              >
                <Input prefix={<EnvironmentOutlined />} placeholder="Nombre de la ubicación" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="location_type"
                label="Tipo de Ubicación"
                rules={[{ required: true, message: 'El tipo es requerido' }]}
              >
                <Select>
                  <Option value="origin">
                    <AimOutlined /> Punto de Origen
                  </Option>
                  <Option value="destination">
                    <EnvironmentOutlined /> Punto de Llegada
                  </Option>
                  <Option value="warehouse">
                    <ShopOutlined /> Bodega
                  </Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="Dirección"
          >
            <Input.TextArea rows={2} placeholder="Dirección completa" />
          </Form.Item>

          <Divider orientation="left">Ubicación en el Mapa</Divider>

          {/* Botón principal para seleccionar en mapa */}
          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              size="large"
              icon={<EnvironmentOutlined />}
              onClick={openMapSelector}
              style={{ 
                width: '100%', 
                height: 50,
                fontSize: 16,
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                border: 'none'
              }}
            >
              📍 Seleccionar Ubicación en el Mapa
            </Button>
            <div style={{ 
              marginTop: 8, 
              fontSize: 12, 
              color: '#8c8c8c',
              textAlign: 'center'
            }}>
              Haz clic para abrir el mapa interactivo y seleccionar la ubicación exacta
            </div>
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="latitude"
                label="Latitud"
                rules={[{ required: true, message: 'La latitud es requerida' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  step={0.0001}
                  precision={6}
                  placeholder="-2.1894"
                  addonBefore={<CompassOutlined />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="longitude"
                label="Longitud"
                rules={[{ required: true, message: 'La longitud es requerida' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  step={0.0001}
                  precision={6}
                  placeholder="-79.8890"
                  addonBefore={<CompassOutlined />}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Preview de coordenadas si están definidas */}
          <Form.Item noStyle shouldUpdate>
            {({ getFieldValue }) => {
              const lat = getFieldValue('latitude')
              const lng = getFieldValue('longitude')
              if (lat && lng) {
                return (
                  <div style={{
                    padding: '8px 12px',
                    background: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    borderRadius: 6,
                    marginBottom: 16
                  }}>
                    <Space>
                      <EnvironmentOutlined style={{ color: '#52c41a' }} />
                      <span>Ubicación seleccionada:</span>
                      <a 
                        href={`https://www.google.com/maps?q=${lat},${lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver en Google Maps
                      </a>
                    </Space>
                  </div>
                )
              }
              return null
            }}
          </Form.Item>

          <Divider orientation="left">Información de Contacto</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contact_name"
                label="Nombre de Contacto"
              >
                <Input prefix={<UserOutlined />} placeholder="Nombre del contacto" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contact_phone"
                label="Teléfono de Contacto"
              >
                <Input prefix={<PhoneOutlined />} placeholder="0991234567" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Horario de Operación</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="opening_time"
                label="Hora de Apertura"
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="closing_time"
                label="Hora de Cierre"
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="capacity"
                label="Capacidad (m³)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="1000"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>
                Cancelar
              </Button>
              <Button type="primary" htmlType="submit">
                {editingLocation ? 'Actualizar' : 'Crear'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal de Selector de Mapa Mejorado */}
      <Modal
        title={
          <Space>
            <EnvironmentOutlined style={{ color: '#1890ff' }} />
            <span>Seleccionar Ubicación en el Mapa</span>
          </Space>
        }
        open={mapModalVisible}
        onCancel={() => setMapModalVisible(false)}
        onOk={confirmMapSelection}
        width={900}
        okText={
          <Space>
            <SaveOutlined />
            <span>Guardar Ubicación</span>
          </Space>
        }
        cancelText="Cancelar"
        okButtonProps={{ 
          size: 'large',
          disabled: !selectedPosition 
        }}
        cancelButtonProps={{ size: 'large' }}
        styles={{
          body: { padding: '16px 24px' }
        }}
        destroyOnHidden
      >
        <LocationMapSelector
          position={selectedPosition}
          onPositionChange={handlePositionChange}
          onAddressFound={handleAddressFound}
        />
      </Modal>
    </div>
  )
}

export default Locations


