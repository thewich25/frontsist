import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';

const Sidebar = ({ onLogout, onNavigate }) => (
  <div className="p-0" style={{ minHeight: '100vh' }}>
    <div className="p-3 fw-bold border-bottom">Menú</div>
    <ul className="list-group list-group-flush">
      <Link to="/admin" className="list-group-item list-group-item-action" onClick={onNavigate}>
        <i className="bi bi-speedometer2 me-2"></i> Dashboard
      </Link>
      <Link to="/admin/gestion-unificada" className="list-group-item list-group-item-action" onClick={onNavigate}>
        <i className="bi bi-diagram-3-fill me-2"></i> Gestión Unificada
      </Link>
      <Link to="/admin/geolocalizacion" className="list-group-item list-group-item-action" onClick={onNavigate}>
        <i className="bi bi-geo-alt me-2"></i> Geolocalización
      </Link>
      <button onClick={onLogout} className="list-group-item list-group-item-action text-danger">
        <i className="bi bi-box-arrow-right me-2"></i> Cerrar sesión
      </button>
    </ul>
  </div>
);

const AdminLayout = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('role');
    navigate('/');
  };

  return (
    <div className={`d-flex ${sidebarOpen ? 'sidebar-open' : ''}`} style={{ minHeight: '100vh' }}>
      <div className="bg-light border-end" style={{ width: '260px' }}>
        <Sidebar onLogout={handleLogout} onNavigate={() => setSidebarOpen(false)} />
      </div>
      <div className="sidebar-overlay d-lg-none" onClick={() => setSidebarOpen(false)}></div>
      <div className="flex-grow-1 p-4">
        <button className="btn btn-outline-secondary d-lg-none mb-3" onClick={() => setSidebarOpen((v)=>!v)}>
          <i className="bi bi-list"></i>
        </button>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;