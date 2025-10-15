import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Rectangle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { apiService } from '../../services/api';
import { useDialog } from '../../hooks/useDialog.jsx';

const WorkerDashboard = () => {
  const { alert } = useDialog();
  const [asignaciones, setAsignaciones] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState(null); // [lat, lng]
  const [markingId, setMarkingId] = useState(null);
  const [accuracy, setAccuracy] = useState(null); // en metros
  const [selectedId, setSelectedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAssignment, setModalAssignment] = useState(null);

  const userData = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('userData') || '{}'); } catch { return {}; }
  }, []);

  useEffect(() => {
    let watchId;
    const load = async () => {
      try {
        setLoading(true);
        // Asignaciones del trabajador actual
        const res = await apiService.getAsignaciones({ trabajadorId: userData.id });
        const data = res?.data?.data || res?.data || [];
        const arr = Array.isArray(data) ? data : [];
        setAsignaciones(arr);
        // Asistencias del trabajador
        try {
          const resAsis = await apiService.getAsistencias({ trabajadorId: userData.id });
          const dataAsis = resAsis?.data?.data || [];
          setAsistencias(Array.isArray(dataAsis) ? dataAsis : []);
        } catch {}
        if (!selectedId && arr.length > 0) {
          setSelectedId(arr[0].id);
        }
      } catch (e) {
        console.error('Error cargando asignaciones del trabajador:', e);
      } finally {
        setLoading(false);
      }
    };

    load();

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => console.warn('Geoloc error:', err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
      );
    }

    return () => {
      if (watchId && navigator.geolocation) navigator.geolocation.clearWatch(watchId);
    };
  }, [userData.id]);

  const selectedAssignment = () => asignaciones.find((x) => x.id === selectedId) || null;
  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const getTodayAsistenciasByAsignacion = (asignacionId) => {
    const key = todayKey();
    return (asistencias || []).filter((r) => {
      if (r.id_asignacion !== asignacionId) return false;
      const dt = new Date(r.fecha_hora);
      const k = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
      return k === key;
    });
  };
  const hasEntradaHoy = (asignacionId) => getTodayAsistenciasByAsignacion(asignacionId).some((r) => r.tipo !== 'salida');
  const hasSalidaHoy = (asignacionId) => getTodayAsistenciasByAsignacion(asignacionId).some((r) => r.tipo === 'salida');
  const getAssignmentCenter = (a) => {
    if (!a || !a.geometry) return null;
    const g = a.geometry;
    if (g.type === 'circle' && Array.isArray(g.center)) return g.center;
    if (g.type === 'rectangle' && Array.isArray(g.start) && Array.isArray(g.end)) {
      const lat = (parseFloat(g.start[0]) + parseFloat(g.end[0])) / 2;
      const lng = (parseFloat(g.start[1]) + parseFloat(g.end[1])) / 2;
      return [lat, lng];
    }
    return null;
  };
  const selectedGeometryCenter = () => getAssignmentCenter(selectedAssignment());
  const centerMap = () => getAssignmentCenter(isModalOpen ? modalAssignment : selectedAssignment()) || position || [-16.5, -68.15];

  const mapRef = useRef(null);
  const [mapKey, setMapKey] = useState(0);
  const watchIdRef = useRef(null);
  const clearWatchTimeoutRef = useRef(null);
  const flyTo = (coords, zoom = 17) => {
    if (mapRef.current && coords) {
      mapRef.current.flyTo(coords, zoom, { duration: 0.8 });
    }
  };

  const handleVerUbicacion = () => {};

  const handleVerMiUbicacion = () => {
    // Intento 1: Leaflet locate (setView automático)
    if (mapRef.current && mapRef.current.locate) {
      try {
        mapRef.current.locate({ setView: true, maxZoom: 19, enableHighAccuracy: true, watch: false });
      } catch {}
    }

    // Intento 2: API Geolocation con alta precisión
    if (navigator.geolocation) {
      // limpiar watch previo
      if (watchIdRef.current) {
        try { navigator.geolocation.clearWatch(watchIdRef.current); } catch {}
        watchIdRef.current = null;
      }
      if (clearWatchTimeoutRef.current) {
        clearTimeout(clearWatchTimeoutRef.current);
        clearWatchTimeoutRef.current = null;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const p = [pos.coords.latitude, pos.coords.longitude];
          setPosition(p);
          setAccuracy(pos.coords.accuracy ?? null);
          flyTo(p, 19);
          // pequeño invalidate para asegurar render
          setTimeout(() => { try { mapRef.current && mapRef.current.invalidateSize(); } catch {} }, 120);
        },
        (err) => {
          console.warn('Geoloc error:', err);
          // Fallback: iniciar watch para obtener primer fix y luego parar
          try {
            watchIdRef.current = navigator.geolocation.watchPosition(
              (p2) => {
                const p = [p2.coords.latitude, p2.coords.longitude];
                setPosition(p);
                setAccuracy(p2.coords.accuracy ?? null);
                flyTo(p, 19);
                if (watchIdRef.current) {
                  try { navigator.geolocation.clearWatch(watchIdRef.current); } catch {}
                  watchIdRef.current = null;
                }
              },
              () => {},
              { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
            );
          } catch {}
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      );

      // Mantener un watch por unos segundos para mejorar precisión y seguir al usuario
      try {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const p = [pos.coords.latitude, pos.coords.longitude];
            setPosition(p);
            setAccuracy(pos.coords.accuracy ?? null);
            flyTo(p, 19);
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
        );
        clearWatchTimeoutRef.current = setTimeout(() => {
          if (watchIdRef.current) {
            try { navigator.geolocation.clearWatch(watchIdRef.current); } catch {}
            watchIdRef.current = null;
          }
        }, 15000); // seguir 15s para refinar precisión
      } catch {}
    }
  };

  const handleVerLugar = () => {
    const c = getAssignmentCenter(isModalOpen ? modalAssignment : selectedAssignment());
    if (c) {
      flyTo(c, 17);
    }
  };

  // Recentrar cuando cambie la asignación seleccionada o la posición
  useEffect(() => {
    const c = selectedGeometryCenter() || position;
    if (c && mapRef.current) {
      mapRef.current.setView(c, 16, { animate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, position?.[0], position?.[1]]);

  // Invalidate size after map is mounted or when selection changes to ensure proper rendering
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        try { mapRef.current.invalidateSize(); } catch {}
      }, 150);
    }
  }, [selectedId]);

  // Limpiar watches en desmontaje
  useEffect(() => () => {
    if (watchIdRef.current) {
      try { navigator.geolocation.clearWatch(watchIdRef.current); } catch {}
      watchIdRef.current = null;
    }
    if (clearWatchTimeoutRef.current) {
      clearTimeout(clearWatchTimeoutRef.current);
      clearWatchTimeoutRef.current = null;
    }
  }, []);

  // Utilidades de geocerca
  const toRad = (v) => (v * Math.PI) / 180;
  const distanceMeters = (a, b) => {
    if (!a || !b) return Infinity;
    const R = 6371000; // radio tierra en m
    const dLat = toRad(b[0] - a[0]);
    const dLng = toRad(b[1] - a[1]);
    const lat1 = toRad(a[0]);
    const lat2 = toRad(b[0]);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  const insideRectangle = (p, start, end) => {
    if (!p || !start || !end) return false;
    const minLat = Math.min(start[0], end[0]);
    const maxLat = Math.max(start[0], end[0]);
    const minLng = Math.min(start[1], end[1]);
    const maxLng = Math.max(start[1], end[1]);
    return p[0] >= minLat && p[0] <= maxLat && p[1] >= minLng && p[1] <= maxLng;
  };

  const isInsideAssignment = (a) => {
    if (!position || !a?.geometry) return false;
    const g = a.geometry;
    if (g.type === 'circle') {
      return distanceMeters(position, g.center) <= (g.radius || 0);
    }
    if (g.type === 'rectangle') {
      return insideRectangle(position, g.start, g.end);
    }
    return false;
  };

  const ensurePosition = () => new Promise((resolve, reject) => {
    if (position) return resolve(position);
    if (!navigator.geolocation) return reject(new Error('Geolocalización no disponible'));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = [pos.coords.latitude, pos.coords.longitude];
        setPosition(p);
        resolve(p);
      },
      (err) => reject(err),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );
  });

  const handleMarcar = async (a, tipo = 'entrada') => {
    try {
      setMarkingId(a.id);
      const p = await ensurePosition();
      if (!isInsideAssignment(a)) {
        await alert('Debes estar dentro del área asignada para marcar asistencia.');
        return;
      }
      await apiService.marcarAsistencia({ id_asignacion: a.id, lat: p[0], lng: p[1], tipo });
      // refrescar asistencias para actualizar botones
      try {
        const resAsis = await apiService.getAsistencias({ trabajadorId: userData.id });
        const dataAsis = resAsis?.data?.data || [];
        setAsistencias(Array.isArray(dataAsis) ? dataAsis : []);
      } catch {}
      await alert(`Asistencia de ${tipo === 'salida' ? 'salida' : 'entrada'} registrada correctamente.`);
    } catch (e) {
      console.error('Error al marcar asistencia:', e);
      await alert('No se pudo marcar asistencia.');
    } finally {
      setMarkingId(null);
    }
  };

  const handleActualizarUbicacion = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = [pos.coords.latitude, pos.coords.longitude];
        setPosition(p);
        setAccuracy(pos.coords.accuracy ?? null);
        try { flyTo(p, 19); } catch {}
        setTimeout(() => { try { mapRef.current && mapRef.current.invalidateSize(); } catch {} }, 120);
      },
      (err) => console.warn('Geoloc error:', err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  };

  // Al abrir modal: forzar remount del mapa, centrar e invalidar tamaño
  useEffect(() => {
    if (isModalOpen) {
      setMapKey((k) => k + 1);
      const c = centerMap();
      if (c && mapRef.current) {
        try { mapRef.current.setView(c, 16, { animate: false }); } catch {}
      }
      handleActualizarUbicacion();
      setTimeout(() => { try { mapRef.current && mapRef.current.invalidateSize(); } catch {} }, 150);
      setTimeout(() => { try { mapRef.current && mapRef.current.invalidateSize(); } catch {} }, 400);
    }
  }, [isModalOpen]);

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Dashboard - Panel de Trabajador</h2>
      </div>

      {loading ? (
        <div className="text-center text-muted py-4">Cargando...</div>
      ) : asignaciones.length === 0 ? (
        <div className="text-center text-muted py-4">No tienes asignaciones pendientes</div>
      ) : (
        <div className="row">
          {asignaciones.map((a) => {
            const diasText = String(a.dias || '')
              .split(',').map((d) => d.trim()).filter(Boolean).join(', ');
            const ubicacionText = a.ubicacion_descripcion ? `${a.ubicacion_nombre} — ${a.ubicacion_descripcion}` : a.ubicacion_nombre;
            const inside = isInsideAssignment(a);
            return (
              <div className="col-lg-6 mb-3" key={a.id}>
                <div className="card h-100">
                  <div className="card-header d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-bold">{ubicacionText}</div>
                      <div className="text-muted small">Días: {diasText}</div>
                      <div className="text-muted small">Horario: {(a.hora_entrada || '').slice(0,5)} - {(a.hora_salida || '').slice(0,5)}</div>
                    </div>
                    <span className={`badge ${inside ? 'bg-success' : 'bg-secondary'}`}>{inside ? 'Dentro' : 'Fuera'}</span>
                  </div>
                  <div className="card-body d-flex justify-content-end">
                    <button className="btn btn-sm btn-primary" onClick={() => { setSelectedId(a.id); setModalAssignment(a); setIsModalOpen(true); }}>
                      <i className="bi bi-map me-1"></i>Ver mapa
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title mb-0"><i className="bi bi-geo-alt me-2"></i>{modalAssignment?.ubicacion_nombre}</h5>
                  <div className="small text-muted">
                    Días: {String(modalAssignment?.dias || '').split(',').map((d) => d.trim()).filter(Boolean).join(', ')} · Horario: {(modalAssignment?.hora_entrada || '').slice(0,5)} - {(modalAssignment?.hora_salida || '').slice(0,5)}
                  </div>
                </div>
                <button type="button" className="btn-close" onClick={() => { setIsModalOpen(false); setModalAssignment(null); }} aria-label="Close"></button>
              </div>
              <div className="modal-body" style={{ minHeight: 300 }}>
                <div style={{ height: 480, width: '100%' }}>
                  <MapContainer key={mapKey} center={centerMap()} zoom={16} maxZoom={20} whenCreated={(map)=> (mapRef.current = map)} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {position && (
                      <Marker position={position}>
                        <Popup>Tu ubicación actual</Popup>
                      </Marker>
                    )}
                    {position && accuracy && (
                      <Circle center={position} radius={Math.max(accuracy, 10)} pathOptions={{ color: '#3388ff' }} />
                    )}
                    {modalAssignment?.geometry?.type === 'circle' && (
                      <Circle center={modalAssignment.geometry.center} radius={modalAssignment.geometry.radius} pathOptions={{ color: isInsideAssignment(modalAssignment) ? 'green' : 'red' }} />
                    )}
                    {modalAssignment?.geometry?.type === 'rectangle' && (
                      <Rectangle bounds={[modalAssignment.geometry.start, modalAssignment.geometry.end]} pathOptions={{ color: isInsideAssignment(modalAssignment) ? 'green' : 'red' }} />
                    )}
                  </MapContainer>
                </div>
              </div>
              <div className="modal-footer d-flex justify-content-between align-items-center">
                <div className="small text-muted">
                  {accuracy ? `Precisión: ±${Math.round(accuracy)} m` : 'Precisión desconocida'}
                </div>
                <div className="flex-grow-1 text-center">
                  <span className={`badge ${isInsideAssignment(modalAssignment) ? 'bg-success' : 'bg-secondary'}`}>
                    {isInsideAssignment(modalAssignment) ? 'Dentro del área' : 'Fuera del área'}
                  </span>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-outline-secondary" onClick={handleActualizarUbicacion}>
                    <i className="bi bi-arrow-clockwise me-1"></i>Actualizar ubicación
                  </button>
                  {!hasEntradaHoy(modalAssignment?.id) && (
                    <button className="btn btn-success" disabled={!isInsideAssignment(modalAssignment) || markingId === modalAssignment?.id} onClick={() => handleMarcar(modalAssignment, 'entrada')}>
                      {markingId === modalAssignment?.id ? 'Marcando...' : 'Marcar entrada'}
                    </button>
                  )}
                  {hasEntradaHoy(modalAssignment?.id) && !hasSalidaHoy(modalAssignment?.id) && (
                    <button className="btn btn-warning" disabled={!isInsideAssignment(modalAssignment) || markingId === modalAssignment?.id} onClick={() => handleMarcar(modalAssignment, 'salida')}>
                      {markingId === modalAssignment?.id ? 'Marcando...' : 'Marcar salida'}
                    </button>
                  )}
                  {hasEntradaHoy(modalAssignment?.id) && hasSalidaHoy(modalAssignment?.id) && (
                    <span className="badge bg-secondary align-self-center">Asistencia del día completa</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;
