import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Rectangle, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { apiService } from '../../services/api';
import { useDialog } from '../../hooks/useDialog.jsx';

// Fix para los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Componente para manejar la búsqueda y centrar el mapa
const MapController = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  
  return null;
};

// Componente para manejar eventos del mapa (click y mousemove)
const MapClickHandler = ({ onClick, onMouseMove, drawingMode, isDrawing, isComplete }) => {
  useMapEvents({
    click: (e) => {
      if (drawingMode) {
        onClick(e.latlng);
      }
    },
    mousemove: (e) => {
      if (drawingMode && isDrawing && !isComplete) {
        onMouseMove(e.latlng);
      }
    },
  });
  
  return null;
};

const Geolocalizacion = () => {
  const { alert, confirm } = useDialog();
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState([-16.5000, -68.1500]); // La Paz, Bolivia por defecto
  const [currentLocation, setCurrentLocation] = useState(null);
  const [drawingMode, setDrawingMode] = useState(null); // 'circle', 'rectangle', null
  const [shapes, setShapes] = useState([]);
  const [tempShape, setTempShape] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isComplete, setIsComplete] = useState(false); // Nueva bandera para indicar que el dibujo está completo
  const [startPoint, setStartPoint] = useState(null);
  
  // Estados del modal
  const [showMapModal, setShowMapModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [locationDescription, setLocationDescription] = useState('');
  const [searching, setSearching] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Obtener ubicación actual del usuario
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = [position.coords.latitude, position.coords.longitude];
          setCurrentLocation(location);
          setMapCenter(location);
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
        }
      );
    }
  }, []);

  // Cargar ubicaciones desde la base de datos
  useEffect(() => {
    loadUbicaciones();
  }, []);

  const loadUbicaciones = async () => {
    try {
      const response = await apiService.getUbicaciones();
      if (response.data.success) {
        setShapes(response.data.data);
      }
    } catch (error) {
      console.error('Error cargando ubicaciones:', error);
    }
  };

  // Buscar ubicación usando Nominatim (OpenStreetMap)
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      await alert('Por favor ingresa un lugar para buscar');
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setMapCenter([parseFloat(lat), parseFloat(lon)]);
        await alert(`Ubicación encontrada: ${display_name}`);
      } else {
        await alert('No se encontró la ubicación. Intenta con otro nombre.');
      }
    } catch (error) {
      console.error('Error buscando ubicación:', error);
      await alert('Error al buscar la ubicación');
    } finally {
      setSearching(false);
    }
  };

  // Abrir modal para registrar ubicación
  const openRegisterModal = () => {
    setLocationName('');
    setLocationDescription('');
    setTempShape(null);
    setDrawingMode(null);
    setIsDrawing(false);
    setIsComplete(false);
    setStartPoint(null);
    setShowMapModal(true);
  };

  // Calcular distancia entre dos puntos (en metros)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Manejar click en el mapa
  const handleMapClick = (latlng) => {
    if (!isDrawing && !isComplete) {
      // Primer click - iniciar el dibujo
      // inicio de dibujo
      setIsDrawing(true);
      setIsComplete(false);
      setStartPoint([latlng.lat, latlng.lng]);
      
      if (drawingMode === 'circle') {
        setTempShape({
          type: 'circle',
          center: [latlng.lat, latlng.lng],
          radius: 100, // Radio inicial visible
        });
      } else if (drawingMode === 'rectangle') {
        setTempShape({
          type: 'rectangle',
          start: [latlng.lat, latlng.lng],
          end: [latlng.lat, latlng.lng],
        });
      }
    } else if (isDrawing && !isComplete) {
      // Segundo click - finalizar el dibujo
      // fin de dibujo
      setIsDrawing(false);
      setIsComplete(true); // Marcar como completo para que no se actualice más
    }
  };

  // Manejar movimiento del mouse mientras se dibuja
  const handleMouseMove = (latlng) => {
    // Solo actualizar si estamos dibujando Y no está completo
    if (!isDrawing || !startPoint || isComplete) return;
    
    if (drawingMode === 'circle') {
      const radius = calculateDistance(
        startPoint[0], 
        startPoint[1], 
        latlng.lat, 
        latlng.lng
      );
      setTempShape({
        type: 'circle',
        center: startPoint,
        radius: Math.max(50, radius),
      });
    } else if (drawingMode === 'rectangle') {
      setTempShape({
        type: 'rectangle',
        start: startPoint,
        end: [latlng.lat, latlng.lng],
      });
    }
  };

  // Guardar ubicación
  const saveLocation = async () => {
    if (!locationName.trim()) {
      await alert('Por favor ingresa un nombre para la ubicación');
      return;
    }

    if (!tempShape) {
      await alert('Por favor dibuja un área en el mapa');
      return;
    }

    try {
      const ubicacionData = {
        name: locationName.trim(),
        description: locationDescription.trim(),
        type: tempShape.type,
        center: tempShape.type === 'circle' ? tempShape.center : undefined,
        radius: tempShape.type === 'circle' ? tempShape.radius : undefined,
        start: tempShape.type === 'rectangle' ? tempShape.start : undefined,
        end: tempShape.type === 'rectangle' ? tempShape.end : undefined,
      };

      let response;
      if (editingId) {
        // Actualizar ubicación existente
        response = await apiService.updateUbicacion(editingId, ubicacionData);
        await alert('Ubicación actualizada exitosamente');
      } else {
        // Crear nueva ubicación
        response = await apiService.createUbicacion(ubicacionData);
        await alert('Ubicación registrada exitosamente');
      }
      
      if (response.data.success) {
        // Recargar ubicaciones
        await loadUbicaciones();
        // Cerrar modal y limpiar
        setShowMapModal(false);
        setTempShape(null);
        setDrawingMode(null);
        setIsDrawing(false);
        setIsComplete(false);
        setStartPoint(null);
        setLocationName('');
        setLocationDescription('');
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error guardando ubicación:', error);
      await alert('Error al guardar la ubicación: ' + (error.response?.data?.message || error.message));
    }
  };

  // Cancelar y cerrar modal
  const closeModal = () => {
    setShowMapModal(false);
    setTempShape(null);
    setDrawingMode(null);
    setIsDrawing(false);
    setIsComplete(false);
    setStartPoint(null);
    setLocationName('');
    setLocationDescription('');
    setEditingId(null);
  };

  // Eliminar forma
  const deleteShape = async (id) => {
    if (await confirm('¿Estás seguro de que quieres eliminar esta ubicación?')) {
      try {
        const response = await apiService.deleteUbicacion(id);
        if (response.data.success) {
          await alert('Ubicación eliminada exitosamente');
          // Recargar ubicaciones
          await loadUbicaciones();
        }
      } catch (error) {
        console.error('Error eliminando ubicación:', error);
        await alert('Error al eliminar la ubicación: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  // Activar modo de dibujo
  const startDrawing = (mode) => {
    setDrawingMode(mode);
    setTempShape(null);
    setIsDrawing(false);
    setIsComplete(false);
    setStartPoint(null);
  };

  // Limpiar el dibujo actual
  const clearDrawing = () => {
    setTempShape(null);
    setIsDrawing(false);
    setIsComplete(false);
    setStartPoint(null);
    setDrawingMode(null); // Resetear el modo de dibujo
  };

  // Ver ubicación en el mapa
  const viewLocation = (location) => {
    setSelectedLocation(location);
    
    // Centrar el mapa en la ubicación
    if (location.type === 'circle') {
      setMapCenter(location.center);
    } else {
      // Para rectángulos, centrar en el punto medio
      const centerLat = (location.start[0] + location.end[0]) / 2;
      const centerLng = (location.start[1] + location.end[1]) / 2;
      setMapCenter([centerLat, centerLng]);
    }
    
    setShowViewModal(true);
  };

  // Editar ubicación
  const editLocation = (location) => {
    setEditingId(location.id);
    setLocationName(location.name);
    setLocationDescription(location.description || '');
    
    // Configurar la forma existente
    if (location.type === 'circle') {
      setTempShape({
        type: 'circle',
        center: location.center,
        radius: location.radius
      });
      setDrawingMode('circle');
      setMapCenter(location.center);
    } else {
      setTempShape({
        type: 'rectangle',
        start: location.start,
        end: location.end
      });
      setDrawingMode('rectangle');
      const centerLat = (location.start[0] + location.end[0]) / 2;
      const centerLng = (location.start[1] + location.end[1]) / 2;
      setMapCenter([centerLat, centerLng]);
    }
    
    setIsComplete(true);
    setShowMapModal(true);
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Geolocalización</h2>
            <button 
              className="btn btn-primary btn-lg"
              onClick={openRegisterModal}
            >
              <i className="fas fa-map-marked-alt me-2"></i>
              Registrar Ubicación
            </button>
          </div>

          {/* Lista de ubicaciones registradas */}
          <div className="card">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">
                <i className="fas fa-list me-2"></i>
                Ubicaciones Registradas ({shapes.length})
              </h5>
            </div>
            <div className="card-body">
              {shapes.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-map-marker-alt fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No hay ubicaciones registradas.</p>
                  <p className="text-muted">Haz click en "Registrar Ubicación" para agregar una nueva ubicación.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead className="table-dark">
                      <tr>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Tipo</th>
                        <th>Coordenadas</th>
                        <th>Detalles</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shapes.map(shape => (
                        <tr key={shape.id}>
                          <td className="fw-bold">{shape.name}</td>
                          <td>{shape.description || <span className="text-muted">Sin descripción</span>}</td>
                          <td>
                            <span className={`badge ${shape.type === 'circle' ? 'bg-primary' : 'bg-success'}`}>
                              <i className={`fas fa-${shape.type === 'circle' ? 'circle' : 'square'} me-1`}></i>
                              {shape.type === 'circle' ? 'Círculo' : 'Rectángulo'}
                            </span>
                          </td>
                          <td className="small">
                            {shape.type === 'circle' 
                              ? `${shape.center[0].toFixed(6)}, ${shape.center[1].toFixed(6)}`
                              : `${shape.start[0].toFixed(6)}, ${shape.start[1].toFixed(6)}`
                            }
                          </td>
                          <td>
                            {shape.type === 'circle' 
                              ? <span className="badge bg-info">{shape.radius}m radio</span>
                              : <span className="badge bg-info">Área rectangular</span>
                            }
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              <button 
                                className="btn btn-info btn-sm"
                                onClick={() => viewLocation(shape)}
                                title="Ver en mapa"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              <button 
                                className="btn btn-warning btn-sm"
                                onClick={() => editLocation(shape)}
                                title="Editar"
                              >
                                <i className="fas fa-pencil-alt"></i>
                              </button>
                              <button 
                                className="btn btn-danger btn-sm"
                                onClick={() => deleteShape(shape.id)}
                                title="Eliminar"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para registrar ubicación */}
      {showMapModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl" style={{ maxWidth: '90%' }}>
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="fas fa-map-marked-alt me-2"></i>
                  Registrar Nueva Ubicación
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeModal}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  {/* Panel izquierdo - Formulario */}
                  <div className="col-md-4">
                    <div className="card mb-3">
                      <div className="card-header bg-light">
                        <h6 className="mb-0">
                          <i className="fas fa-info-circle me-2"></i>
                          Información de la Ubicación
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <label className="form-label fw-bold">
                            Nombre de la Ubicación *
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={locationName}
                            onChange={(e) => setLocationName(e.target.value)}
                            placeholder="Ej: Oficina Principal"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-bold">
                            Descripción
                          </label>
                          <textarea
                            className="form-control"
                            rows="3"
                            value={locationDescription}
                            onChange={(e) => setLocationDescription(e.target.value)}
                            placeholder="Describe esta ubicación..."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="card mb-3">
                      <div className="card-header bg-light">
                        <h6 className="mb-0">
                          <i className="fas fa-search me-2"></i>
                          Buscar Lugar
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="input-group mb-2">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="La Paz, Bolivia"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                          />
                          <button 
                            className="btn btn-info"
                            onClick={handleSearch}
                            disabled={searching}
                          >
                            {searching ? (
                              <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                              <i className="fas fa-search"></i>
                            )}
                          </button>
                        </div>
                        {currentLocation && (
                          <small className="text-muted">
                            <i className="fas fa-map-marker-alt me-1"></i>
                            Tu ubicación está marcada
                          </small>
                        )}
                      </div>
                    </div>

                    <div className="card">
                      <div className="card-header bg-light">
                        <h6 className="mb-0">
                          <i className="fas fa-draw-polygon me-2"></i>
                          Dibujar Área
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="d-grid gap-2 mb-3">
                          <button 
                            className={`btn ${drawingMode === 'circle' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => startDrawing('circle')}
                            disabled={drawingMode && drawingMode !== 'circle'}
                          >
                            <i className="fas fa-circle me-2"></i>
                            {drawingMode === 'circle' ? 'Dibujando Círculo' : 'Dibujar Círculo'}
                          </button>
                          <button 
                            className={`btn ${drawingMode === 'rectangle' ? 'btn-success' : 'btn-outline-success'}`}
                            onClick={() => startDrawing('rectangle')}
                            disabled={drawingMode && drawingMode !== 'rectangle'}
                          >
                            <i className="fas fa-square me-2"></i>
                            {drawingMode === 'rectangle' ? 'Dibujando Rectángulo' : 'Dibujar Rectángulo'}
                          </button>
                          
                          {(isDrawing || isComplete) && (
                            <button 
                              className="btn btn-danger"
                              onClick={clearDrawing}
                            >
                              <i className="fas fa-times-circle me-2"></i>
                              Cancelar Dibujo
                            </button>
                          )}
                        </div>

                        {drawingMode && !isDrawing && !tempShape && !isComplete && (
                          <div className="alert alert-info p-2 mb-2">
                            <small>
                              <i className="fas fa-info-circle me-1"></i>
                              <strong>Paso 1:</strong> Haz <strong>1 click</strong> en el mapa para iniciar
                            </small>
                          </div>
                        )}

                        {isDrawing && !isComplete && (
                          <div className="alert alert-warning p-2 mb-2">
                            <small>
                              <i className="fas fa-mouse-pointer me-1"></i>
                              <strong>Paso 2:</strong> Mueve el mouse para ajustar el tamaño
                              <br />
                              <strong>Paso 3:</strong> Haz <strong>otro click</strong> para finalizar
                            </small>
                          </div>
                        )}

                        {tempShape && isComplete && (
                          <div className="alert alert-success p-2 mb-2">
                            <small>
                              <i className="fas fa-check-circle me-1"></i>
                              ¡Área dibujada correctamente!
                              {tempShape.type === 'circle' && (
                                <div className="mt-1">
                                  <strong>Radio:</strong> {tempShape.radius.toFixed(2)} metros
                                </div>
                              )}
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Panel derecho - Mapa */}
                  <div className="col-md-8">
                    <div style={{ height: '600px', width: '100%', border: '2px solid #dee2e6', borderRadius: '5px' }}>
                      <MapContainer
                        center={mapCenter}
                        zoom={13}
                        style={{ 
                          height: '100%', 
                          width: '100%',
                          cursor: drawingMode ? 'crosshair' : 'grab'
                        }}
                        scrollWheelZoom={true}
                        dragging={true}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapController center={mapCenter} />
                        <MapClickHandler 
                          onClick={handleMapClick}
                          onMouseMove={handleMouseMove}
                          drawingMode={drawingMode}
                          isDrawing={isDrawing}
                          isComplete={isComplete}
                        />
                        
                        {/* Marcador de ubicación actual */}
                        {currentLocation && (
                          <Marker position={currentLocation}>
                            <Popup>Tu ubicación actual</Popup>
                          </Marker>
                        )}

                        {/* Forma temporal mientras se dibuja */}
                        {tempShape && tempShape.type === 'circle' && (
                          <Circle
                            center={tempShape.center}
                            radius={tempShape.radius}
                            pathOptions={{ 
                              color: isComplete ? '#28a745' : '#007bff', 
                              fillColor: isComplete ? '#28a745' : '#007bff', 
                              fillOpacity: 0.3,
                              weight: 3
                            }}
                          />
                        )}
                        {tempShape && tempShape.type === 'rectangle' && tempShape.start && tempShape.end && (
                          <Rectangle
                            bounds={[tempShape.start, tempShape.end]}
                            pathOptions={{ 
                              color: isComplete ? '#28a745' : '#007bff', 
                              fillColor: isComplete ? '#28a745' : '#007bff', 
                              fillOpacity: 0.3,
                              weight: 3
                            }}
                          />
                        )}
                      </MapContainer>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  <i className="fas fa-times me-2"></i>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={saveLocation}
                >
                  <i className="fas fa-save me-2"></i>
                  {editingId ? 'Actualizar Ubicación' : 'Guardar Ubicación'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para visualizar ubicación */}
      {showViewModal && selectedLocation && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl" style={{ maxWidth: '90%' }}>
            <div className="modal-content">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  {selectedLocation.name}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowViewModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  {/* Panel izquierdo - Información */}
                  <div className="col-md-4">
                    <div className="card">
                      <div className="card-header bg-light">
                        <h6 className="mb-0">
                          <i className="fas fa-info-circle me-2"></i>
                          Información de la Ubicación
                        </h6>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <strong>Nombre:</strong>
                          <p>{selectedLocation.name}</p>
                        </div>
                        <div className="mb-3">
                          <strong>Descripción:</strong>
                          <p>{selectedLocation.description || <span className="text-muted">Sin descripción</span>}</p>
                        </div>
                        <div className="mb-3">
                          <strong>Tipo:</strong>
                          <p>
                            <span className={`badge ${selectedLocation.type === 'circle' ? 'bg-primary' : 'bg-success'}`}>
                              <i className={`fas fa-${selectedLocation.type === 'circle' ? 'circle' : 'square'} me-1`}></i>
                              {selectedLocation.type === 'circle' ? 'Círculo' : 'Rectángulo'}
                            </span>
                          </p>
                        </div>
                        {selectedLocation.type === 'circle' && (
                          <div className="mb-3">
                            <strong>Radio:</strong>
                            <p>{selectedLocation.radius.toFixed(2)} metros</p>
                          </div>
                        )}
                        <div className="mb-3">
                          <strong>Coordenadas:</strong>
                          {selectedLocation.type === 'circle' ? (
                            <div className="small">
                              <p className="mb-0">Lat: {selectedLocation.center[0].toFixed(6)}</p>
                              <p className="mb-0">Lng: {selectedLocation.center[1].toFixed(6)}</p>
                            </div>
                          ) : (
                            <div className="small">
                              <p className="mb-0"><strong>Esquina 1:</strong></p>
                              <p className="mb-0">Lat: {selectedLocation.start[0].toFixed(6)}</p>
                              <p className="mb-0">Lng: {selectedLocation.start[1].toFixed(6)}</p>
                              <p className="mb-0 mt-2"><strong>Esquina 2:</strong></p>
                              <p className="mb-0">Lat: {selectedLocation.end[0].toFixed(6)}</p>
                              <p className="mb-0">Lng: {selectedLocation.end[1].toFixed(6)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Panel derecho - Mapa */}
                  <div className="col-md-8">
                    <div style={{ height: '500px', width: '100%', border: '2px solid #dee2e6', borderRadius: '5px' }}>
                      <MapContainer
                        center={mapCenter}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapController center={mapCenter} />
                        
                        {/* Mostrar la ubicación */}
                        {selectedLocation.type === 'circle' && (
                          <Circle
                            center={selectedLocation.center}
                            radius={selectedLocation.radius}
                            pathOptions={{ 
                              color: '#17a2b8', 
                              fillColor: '#17a2b8', 
                              fillOpacity: 0.3,
                              weight: 3
                            }}
                          />
                        )}
                        {selectedLocation.type === 'rectangle' && (
                          <Rectangle
                            bounds={[selectedLocation.start, selectedLocation.end]}
                            pathOptions={{ 
                              color: '#17a2b8', 
                              fillColor: '#17a2b8', 
                              fillOpacity: 0.3,
                              weight: 3
                            }}
                          />
                        )}
                      </MapContainer>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowViewModal(false)}
                >
                  <i className="fas fa-times me-2"></i>
                  Cerrar
                </button>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={() => {
                    setShowViewModal(false);
                    editLocation(selectedLocation);
                  }}
                >
                  <i className="fas fa-pencil-alt me-2"></i>
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Geolocalizacion;