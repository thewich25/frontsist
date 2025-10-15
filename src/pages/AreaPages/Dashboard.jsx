import { useState, useEffect } from 'react';
import api from '../../services/api';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({
    trabajadores: 0,
    roles: 0,
    tareasHoy: 0
  });

  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }

    // Aquí puedes cargar las estadísticas desde el backend
    loadStats();
  }, []);

  const loadStats = async () => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('userData'));

    try {
      const trab = await api.get(`/trabajadores/personal-area/${userData.id}`);
      if (trab?.data?.data) setStats(prev => ({ ...prev, trabajadores: trab.data.data.length }));
      const roles = await api.get(`/roles/area/${userData.id_area_laboral}`);
      if (roles?.data?.data) setStats(prev => ({ ...prev, roles: roles.data.data.length }));
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Dashboard</h2>
          <p className="text-muted mb-0">Bienvenido, {userData?.nombre_completo}</p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-subtitle mb-2">Trabajadores</h6>
                  <h2 className="card-title mb-0">{stats.trabajadores}</h2>
                </div>
                <div>
                  <i className="bi bi-people fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-subtitle mb-2">Roles Activos</h6>
                  <h2 className="card-title mb-0">{stats.roles}</h2>
                </div>
                <div>
                  <i className="bi bi-tags fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="card-subtitle mb-2">Tareas Hoy</h6>
                  <h2 className="card-title mb-0">{stats.tareasHoy}</h2>
                </div>
                <div>
                  <i className="bi bi-clipboard-check fs-1"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información del área */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Información del Área
              </h5>
            </div>
            <div className="card-body">
              <dl className="row mb-0">
                <dt className="col-sm-3">Área:</dt>
                <dd className="col-sm-9">{userData?.area_descripcion}</dd>

                <dt className="col-sm-3">Encargado:</dt>
                <dd className="col-sm-9">{userData?.nombre_completo}</dd>

                <dt className="col-sm-3">Usuario:</dt>
                <dd className="col-sm-9">@{userData?.username}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

