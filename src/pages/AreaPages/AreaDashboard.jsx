import { useState, useEffect } from 'react';

const AreaDashboard = () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const token = localStorage.getItem('token');
  
  const [stats, setStats] = useState({
    totalRoles: 0,
    totalTrabajadores: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Cargar roles
        const rolesResponse = await fetch(
          `http://localhost:3000/api/roles/area/${userData.id_area_laboral}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        const rolesData = await rolesResponse.json();
        
        // Cargar trabajadores
        const trabajadoresResponse = await fetch(
          `http://localhost:3000/api/trabajadores/personal-area/${userData.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        const trabajadoresData = await trabajadoresResponse.json();
        
        setStats({
          totalRoles: rolesData.data?.length || 0,
          totalTrabajadores: trabajadoresData.data?.length || 0
        });
      } catch (err) {
        console.error('Error cargando estadísticas:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadStats();
  }, [token, userData.id_area_laboral, userData.id]);

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
    <div className="container-fluid">
      <h2 className="mb-4">Dashboard - Panel de Área</h2>
      
      {/* Información del Área */}
      <div className="card mb-4 border-primary">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">
            <i className="bi bi-building me-2"></i>
            {userData.area_descripcion}
          </h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p className="mb-2">
                <strong>Encargado:</strong> {userData.nombre_completo}
              </p>
              <p className="mb-0">
                <strong>Usuario:</strong> @{userData.username}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card h-100 border-info">
            <div className="card-body text-center">
              <i className="bi bi-tags display-1 text-info"></i>
              <h3 className="mt-3">{stats.totalRoles}</h3>
              <p className="text-muted mb-0">Roles Creados</p>
            </div>
          </div>
        </div>
        
        <div className="col-md-6 mb-4">
          <div className="card h-100 border-warning">
            <div className="card-body text-center">
              <i className="bi bi-people display-1 text-warning"></i>
              <h3 className="mt-3">{stats.totalTrabajadores}</h3>
              <p className="text-muted mb-0">Trabajadores Asignados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="bi bi-lightning-fill me-2"></i>
            Acciones Rápidas
          </h5>
        </div>
        <div className="card-body">
          <div className="d-grid gap-2 d-md-flex">
            <a href="/area/gestion-trabajadores" className="btn btn-primary">
              <i className="bi bi-people-fill me-2"></i>
              Ir a Gestión de Trabajadores
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AreaDashboard;

