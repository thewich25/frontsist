import { useState, useEffect } from 'react';
import { useDialog } from '../../hooks/useDialog.jsx';
import api from '../../services/api';

const Trabajadores = () => {
  const { alert } = useDialog();
  const [trabajadores, setTrabajadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const userData = JSON.parse(localStorage.getItem('userData'));

  useEffect(() => {
    loadTrabajadores();
  }, []);

  const loadTrabajadores = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/trabajadores/personal-area/${userData.id}`);
      setTrabajadores(data.data || data || []);
    } catch (error) {
      console.error('Error cargando trabajadores:', error);
      await alert('Error al cargar trabajadores');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2><i className="bi bi-people me-2"></i>Mis Trabajadores</h2>
      </div>

      {trabajadores.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="bi bi-people fs-1 text-muted mb-3 d-block"></i>
            <p className="text-muted">No hay trabajadores asignados a tu área</p>
            <small className="text-muted">Los trabajadores son asignados por el administrador</small>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>ID</th>
                    <th>Nombre Completo</th>
                    <th>Username</th>
                    <th>Roles Asignados</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {trabajadores.map(trabajador => (
                    <tr key={trabajador.id}>
                      <td>{trabajador.id}</td>
                      <td>{trabajador.nombre_completo}</td>
                      <td>
                        <span className="badge bg-secondary">
                          @{trabajador.username}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-info">
                          {trabajador.roles_asignados || 'Sin roles'}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-success">
                          Activo
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trabajadores;

