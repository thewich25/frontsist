import { useState, useEffect } from 'react';

const RegistroAsistencia = () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const token = localStorage.getItem('token');
  
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [registroHoy, setRegistroHoy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    cargarRegistroHoy();
  }, []);

  const cargarRegistroHoy = async () => {
    // Por ahora simulamos la carga
    // En una implementación real, harías una petición al backend
    const registroGuardado = localStorage.getItem(`asistencia_${userData.id}_${new Date().toLocaleDateString()}`);
    if (registroGuardado) {
      setRegistroHoy(JSON.parse(registroGuardado));
    }
  };

  const marcarAsistencia = async (tipo) => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const ahora = new Date();
      const registro = {
        id_trabajador: userData.id,
        fecha: ahora.toLocaleDateString('es-ES'),
        hora: ahora.toLocaleTimeString('es-ES'),
        tipo: tipo, // 'entrada' o 'salida'
        timestamp: ahora.toISOString()
      };

      // Por ahora guardamos en localStorage
      // En una implementación real, enviarías esto al backend
      const key = `asistencia_${userData.id}_${ahora.toLocaleDateString()}`;
      const registroActual = JSON.parse(localStorage.getItem(key) || '{}');
      
      if (tipo === 'entrada') {
        registroActual.entrada = registro;
      } else {
        registroActual.salida = registro;
      }
      
      localStorage.setItem(key, JSON.stringify(registroActual));
      setRegistroHoy(registroActual);
      
      setMessage({
        type: 'success',
        text: `${tipo === 'entrada' ? 'Entrada' : 'Salida'} registrada exitosamente a las ${registro.hora}`
      });
    } catch (err) {
      setMessage({
        type: 'danger',
        text: 'Error al registrar asistencia'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="container-fluid">
      <h2 className="mb-4">Registro de Asistencia</h2>

      {/* Reloj */}
      <div className="card mb-4 bg-dark text-white">
        <div className="card-body text-center py-4">
          <h1 className="display-4 fw-bold mb-2">{formatTime(currentDateTime)}</h1>
          <p className="fs-5 mb-0 text-capitalize">{formatDate(currentDateTime)}</p>
        </div>
      </div>

      {/* Mensajes */}
      {message.text && (
        <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
          <i className={`bi bi-${message.type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
        </div>
      )}

      {/* Botones de Registro */}
      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="card border-success h-100">
            <div className="card-body text-center p-4">
              <i className="bi bi-arrow-right-circle text-success" style={{ fontSize: '4rem' }}></i>
              <h3 className="mt-3">Marcar Entrada</h3>
              <p className="text-muted">Registra tu hora de llegada</p>
              <button 
                className="btn btn-success btn-lg px-5"
                onClick={() => marcarAsistencia('entrada')}
                disabled={loading || registroHoy?.entrada}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Registrando...
                  </>
                ) : registroHoy?.entrada ? (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    Ya registrada
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-right-circle me-2"></i>
                    Marcar Entrada
                  </>
                )}
              </button>
              {registroHoy?.entrada && (
                <div className="mt-3">
                  <span className="badge bg-success fs-6">
                    Entrada: {registroHoy.entrada.hora}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card border-danger h-100">
            <div className="card-body text-center p-4">
              <i className="bi bi-arrow-left-circle text-danger" style={{ fontSize: '4rem' }}></i>
              <h3 className="mt-3">Marcar Salida</h3>
              <p className="text-muted">Registra tu hora de salida</p>
              <button 
                className="btn btn-danger btn-lg px-5"
                onClick={() => marcarAsistencia('salida')}
                disabled={loading || !registroHoy?.entrada || registroHoy?.salida}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Registrando...
                  </>
                ) : registroHoy?.salida ? (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    Ya registrada
                  </>
                ) : !registroHoy?.entrada ? (
                  <>
                    <i className="bi bi-lock me-2"></i>
                    Marca entrada primero
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-left-circle me-2"></i>
                    Marcar Salida
                  </>
                )}
              </button>
              {registroHoy?.salida && (
                <div className="mt-3">
                  <span className="badge bg-danger fs-6">
                    Salida: {registroHoy.salida.hora}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resumen del día */}
      <div className="card">
        <div className="card-header bg-info text-white">
          <h5 className="mb-0">
            <i className="bi bi-calendar-day me-2"></i>
            Resumen del Día
          </h5>
        </div>
        <div className="card-body">
          {!registroHoy ? (
            <p className="text-muted text-center py-4">
              <i className="bi bi-info-circle me-2"></i>
              No hay registros para el día de hoy. Marca tu entrada para comenzar.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Trabajador</th>
                    <th>Área</th>
                    <th>Entrada</th>
                    <th>Salida</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>{userData.nombre_completo}</strong>
                      <br />
                      <small className="text-muted">@{userData.username}</small>
                    </td>
                    <td>{userData.area_descripcion}</td>
                    <td>
                      {registroHoy.entrada ? (
                        <span className="badge bg-success">
                          <i className="bi bi-check-circle me-1"></i>
                          {registroHoy.entrada.hora}
                        </span>
                      ) : (
                        <span className="badge bg-secondary">No registrada</span>
                      )}
                    </td>
                    <td>
                      {registroHoy.salida ? (
                        <span className="badge bg-danger">
                          <i className="bi bi-check-circle me-1"></i>
                          {registroHoy.salida.hora}
                        </span>
                      ) : (
                        <span className="badge bg-secondary">No registrada</span>
                      )}
                    </td>
                    <td>
                      {registroHoy.salida ? (
                        <span className="badge bg-dark">Jornada Completa</span>
                      ) : registroHoy.entrada ? (
                        <span className="badge bg-primary">En Turno</span>
                      ) : (
                        <span className="badge bg-warning">Pendiente</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Nota informativa */}
      <div className="alert alert-warning mt-4">
        <i className="bi bi-exclamation-triangle me-2"></i>
        <strong>Importante:</strong> Recuerda marcar tu entrada al llegar y tu salida al terminar tu jornada laboral.
      </div>
    </div>
  );
};

export default RegistroAsistencia;


