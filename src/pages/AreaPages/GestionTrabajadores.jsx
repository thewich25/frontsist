import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useDialog } from '../../hooks/useDialog.jsx';

const GestionTrabajadores = () => {
  // Obtener datos del usuario logueado
  const { alert, confirm } = useDialog();
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const token = localStorage.getItem('token');

  // Estados principales
  const [roles, setRoles] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  
  // Estados de carga
  const [loading, setLoading] = useState(true);
  
  // Estados de modales
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showTrabajadorModal, setShowTrabajadorModal] = useState(false);
  
  // Estados de edición
  const [editingRole, setEditingRole] = useState(null);
  const [editingTrabajador, setEditingTrabajador] = useState(null);
  
  // Estados de formularios
  const [roleForm, setRoleForm] = useState({
    descripcion: '',
    id_area_laboral: userData.id_area_laboral || ''
  });
  
  const [trabajadorForm, setTrabajadorForm] = useState({
    username: '',
    password: '',
    nombre_completo: '',
    id_personal_area: userData.id || '',
    id_area_laboral: userData.id_area_laboral || '',
    roles_ids: []
  });

  // Cargar roles del área
  const loadRoles = useCallback(async () => {
    try {
      const res = await api.get(`/roles/area/${userData.id_area_laboral}`);
      const data = res?.data;
      setRoles(data.data || data || []);
    } catch (err) {
      console.error('Error cargando roles:', err);
    }
  }, [token, userData.id_area_laboral]);

  // Cargar trabajadores asignados al encargado
  const loadTrabajadores = useCallback(async () => {
    try {
      const res = await api.get(`/trabajadores/personal-area/${userData.id}`);
      const data = res?.data;
      setTrabajadores(data.data || data || []);
    } catch (err) {
      console.error('Error cargando trabajadores:', err);
    }
  }, [token, userData.id]);

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        await Promise.all([loadRoles(), loadTrabajadores()]);
      } catch (err) {
        console.error('Error cargando datos:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [loadRoles, loadTrabajadores]);

  // Funciones para manejar formularios
  const handleRoleFormChange = (e) => {
    const { name, value } = e.target;
    setRoleForm(prev => ({ ...prev, [name]: value }));
  };

  const handleTrabajadorFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'roles_ids') {
      const selectedRoles = Array.from(e.target.selectedOptions, option => parseInt(option.value));
      setTrabajadorForm(prev => ({ ...prev, [name]: selectedRoles }));
    } else {
      setTrabajadorForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Funciones para abrir modales
  const openRoleModal = (role = null) => {
    setEditingRole(role);
    setRoleForm(role ? {
      descripcion: role.descripcion,
      id_area_laboral: role.id_area_laboral.toString()
    } : {
      descripcion: '',
      id_area_laboral: userData.id_area_laboral.toString()
    });
    setShowRoleModal(true);
  };

  const openTrabajadorModal = (trabajador = null) => {
    setEditingTrabajador(trabajador);
    setTrabajadorForm(trabajador ? {
      username: trabajador.username,
      password: '',
      nombre_completo: trabajador.nombre_completo,
      id_personal_area: trabajador.id_personal_area.toString(),
      id_area_laboral: trabajador.id_area_laboral.toString(),
      roles_ids: trabajador.roles_ids || []
    } : {
      username: '',
      password: '',
      nombre_completo: '',
      id_personal_area: userData.id.toString(),
      id_area_laboral: userData.id_area_laboral.toString(),
      roles_ids: []
    });
    setShowTrabajadorModal(true);
  };

  // Funciones para guardar
  const saveRole = async (e) => {
    e.preventDefault();
    
    try {
      const payload = { ...roleForm, id_area_laboral: parseInt(roleForm.id_area_laboral) };
      const result = editingRole
        ? (await api.put(`/roles/${editingRole.id}`, payload)).data
        : (await api.post('/roles', payload)).data;
      await loadRoles();
      setShowRoleModal(false);
      await alert(result.message || 'Operación exitosa');
    } catch (err) {
      await alert(err.message || 'Ocurrió un error');
    }
  };

  const saveTrabajador = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingTrabajador ? `/trabajadores/${editingTrabajador.id}` : '/trabajadores';
      // Preparar datos para enviar
      const dataToSend = {
        username: trabajadorForm.username,
        nombre_completo: trabajadorForm.nombre_completo,
        id_personal_area: parseInt(userData.id),
        id_area_laboral: parseInt(userData.id_area_laboral),
        roles_ids: trabajadorForm.roles_ids
      };
      
      // Solo incluir password si se proporcionó
      if (!editingTrabajador || trabajadorForm.password) {
        dataToSend.password = trabajadorForm.password;
      }
      
      const result = editingTrabajador
        ? (await api.put(url, dataToSend)).data
        : (await api.post(url, dataToSend)).data;
      await loadTrabajadores();
      setShowTrabajadorModal(false);
      await alert(result.message || 'Operación exitosa');
    } catch (err) {
      await alert(err.message || 'Ocurrió un error');
    }
  };

  // Funciones para eliminar
  const deleteRole = async (id) => {
    if (!(await confirm('¿Estás seguro de que quieres eliminar este rol?'))) return;
    
    try {
      const result = (await api.delete(`/roles/${id}`)).data;
      await loadRoles();
      await alert(result.message || 'Rol eliminado');
    } catch (err) {
      await alert(err.message || 'Ocurrió un error');
    }
  };

  const deleteTrabajador = async (id) => {
    if (!(await confirm('¿Estás seguro de que quieres eliminar este trabajador?'))) return;
    
    try {
      const result = (await api.delete(`/trabajadores/${id}`)).data;
      await loadTrabajadores();
      await alert(result.message || 'Trabajador eliminado');
    } catch (err) {
      await alert(err.message || 'Ocurrió un error');
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
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2>Gestión de Trabajadores</h2>
              <p className="text-muted mb-0">Área: {userData.area_descripcion}</p>
            </div>
          </div>

          {/* Información del encargado */}
          <div className="card bg-light mb-4">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <i className="bi bi-person-circle fs-1 me-3"></i>
                <div>
                  <h6 className="mb-1">Encargado del Área</h6>
                  <p className="mb-0"><strong>{userData.nombre_completo}</strong> (@{userData.username})</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pestañas para Roles y Trabajadores */}
          <ul className="nav nav-tabs mb-3" id="managementTabs" role="tablist">
            <li className="nav-item" role="presentation">
              <button 
                className="nav-link active" 
                id="roles-tab" 
                data-bs-toggle="tab" 
                data-bs-target="#roles-content" 
                type="button" 
                role="tab"
              >
                <i className="bi bi-tags me-2"></i>Roles
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button 
                className="nav-link" 
                id="trabajadores-tab" 
                data-bs-toggle="tab" 
                data-bs-target="#trabajadores-content" 
                type="button" 
                role="tab"
              >
                <i className="bi bi-people me-2"></i>Trabajadores
              </button>
            </li>
          </ul>

          <div className="tab-content" id="managementTabContent">
            {/* Pestaña Roles */}
            <div className="tab-pane fade show active" id="roles-content" role="tabpanel">
              <div className="card">
                <div className="card-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Roles del Área</h5>
                    <button 
                      className="btn btn-info btn-sm"
                      onClick={() => openRoleModal()}
                    >
                      <i className="bi bi-plus me-1"></i>Agregar Rol
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  {roles.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted">Crea roles para poder asignarlos a los trabajadores</p>
                      <button 
                        className="btn btn-info"
                        onClick={() => openRoleModal()}
                      >
                        <i className="bi bi-plus me-2"></i>Crear Primer Rol
                      </button>
                    </div>
                  ) : (
                    <div className="row">
                      {roles.map(role => (
                        <div key={role.id} className="col-md-4 mb-3">
                          <div className="card h-100">
                            <div className="card-body">
                              <h6 className="card-title">{role.descripcion}</h6>
                              <div className="btn-group btn-group-sm">
                                <button 
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => openRoleModal(role)}
                                  title="Editar rol"
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button 
                                  className="btn btn-outline-danger btn-sm"
                                  onClick={() => deleteRole(role.id)}
                                  title="Eliminar rol"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pestaña Trabajadores */}
            <div className="tab-pane fade" id="trabajadores-content" role="tabpanel">
              <div className="card">
                <div className="card-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Mis Trabajadores</h5>
                    <button 
                      className="btn btn-warning btn-sm"
                      onClick={() => openTrabajadorModal()}
                      disabled={roles.length === 0}
                    >
                      <i className="bi bi-plus me-1"></i>Agregar Trabajador
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  {roles.length === 0 ? (
                    <div className="alert alert-warning">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      Primero debes crear <strong>roles</strong> antes de agregar trabajadores.
                    </div>
                  ) : trabajadores.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted">No hay trabajadores asignados</p>
                      <button 
                        className="btn btn-warning"
                        onClick={() => openTrabajadorModal()}
                      >
                        <i className="bi bi-plus me-2"></i>Agregar Primer Trabajador
                      </button>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead className="table-dark">
                          <tr>
                            <th>Username</th>
                            <th>Nombre Completo</th>
                            <th>Roles Asignados</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trabajadores.map(trabajador => (
                            <tr key={trabajador.id}>
                              <td>
                                <span className="badge bg-secondary">
                                  @{trabajador.username}
                                </span>
                              </td>
                              <td>{trabajador.nombre_completo}</td>
                              <td>
                                <span className="badge bg-info">
                                  {trabajador.roles_asignados || 'Sin roles'}
                                </span>
                              </td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  <button 
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => openTrabajadorModal(trabajador)}
                                    title="Editar trabajador"
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </button>
                                  <button 
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => deleteTrabajador(trabajador.id)}
                                    title="Eliminar trabajador"
                                  >
                                    <i className="bi bi-trash"></i>
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
        </div>
      </div>

      {/* Modal Rol */}
      {showRoleModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingRole ? 'Editar Rol' : 'Nuevo Rol'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowRoleModal(false)}></button>
              </div>
              <form onSubmit={saveRole}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Descripción del Rol *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="descripcion"
                      value={roleForm.descripcion}
                      onChange={handleRoleFormChange}
                      placeholder="Ej: Desarrollador Frontend"
                      required
                    />
                  </div>
                  <input type="hidden" name="id_area_laboral" value={roleForm.id_area_laboral} />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowRoleModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingRole ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Trabajador */}
      {showTrabajadorModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingTrabajador ? 'Editar Trabajador' : 'Nuevo Trabajador'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowTrabajadorModal(false)}></button>
              </div>
              <form onSubmit={saveTrabajador} autoComplete="off">
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Usuario (Username) *</label>
                      <input
                        type="text"
                        className="form-control"
                        name="username"
                        value={trabajadorForm.username}
                        onChange={handleTrabajadorFormChange}
                        placeholder=""
                        autoComplete="off"
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Contraseña {editingTrabajador ? '' : '*'}
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        name="password"
                        value={trabajadorForm.password}
                        onChange={handleTrabajadorFormChange}
                        placeholder={editingTrabajador ? '' : ''}
                        autoComplete="new-password"
                        required={!editingTrabajador}
                      />
                      {editingTrabajador && (
                        <small className="text-muted">Dejar en blanco para mantener la contraseña actual</small>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Nombre Completo *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="nombre_completo"
                      value={trabajadorForm.nombre_completo}
                      onChange={handleTrabajadorFormChange}
                      placeholder=""
                      autoComplete="off"
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Roles (Mantén Ctrl para seleccionar múltiples) *</label>
                    <select
                      className="form-select"
                      name="roles_ids"
                      multiple
                      size="5"
                      value={trabajadorForm.roles_ids}
                      onChange={handleTrabajadorFormChange}
                      style={{ minHeight: '120px' }}
                    >
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.descripcion}
                        </option>
                      ))}
                    </select>
                    <div className="form-text">
                      <i className="bi bi-info-circle me-1"></i>
                      Mantén presionado Ctrl (o Cmd en Mac) para seleccionar múltiples roles
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowTrabajadorModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingTrabajador ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionTrabajadores;

