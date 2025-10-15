import { useState } from 'react';
import api from '../../services/api';

const MiInformacion = () => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const token = localStorage.getItem('token');
  
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validaciones
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setMessage({ type: 'danger', text: 'Todos los campos son requeridos' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'danger', text: 'Las contraseñas nuevas no coinciden' });
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.put('/trabajadores/change-password', {
        id: userData.id,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      setMessage({ type: 'success', text: 'Contraseña cambiada exitosamente' });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowChangePassword(false);
    } catch (err) {
      setMessage({ type: 'danger', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid">
      <h2 className="mb-4">Mi Información</h2>

      {/* Tarjeta de Información Personal */}
      <div className="row">
        <div className="col-md-8 mx-auto">
          <div className="card mb-4 border-primary">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-person-circle me-2"></i>
                Información Personal
              </h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="text-muted small mb-1">Nombre Completo</label>
                  <p className="fs-5 fw-bold mb-0">{userData.nombre_completo}</p>
                </div>
                <div className="col-md-6">
                  <label className="text-muted small mb-1">Usuario</label>
                  <p className="fs-5 fw-bold mb-0">@{userData.username}</p>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="text-muted small mb-1">Área de Trabajo</label>
                  <p className="fs-5 fw-bold mb-0">
                    <i className="bi bi-building me-2 text-info"></i>
                    {userData.area_descripcion}
                  </p>
                </div>
                <div className="col-md-6">
                  <label className="text-muted small mb-1">Encargado del Área</label>
                  <p className="fs-5 fw-bold mb-0">
                    <i className="bi bi-person-check me-2 text-success"></i>
                    {userData.encargado_nombre}
                  </p>
                </div>
              </div>

              <div className="row">
                <div className="col-md-12">
                  <label className="text-muted small mb-1">Rol(es) Asignado(s)</label>
                  <p className="fs-5 fw-bold mb-0">
                    <i className="bi bi-award me-2 text-warning"></i>
                    {userData.roles_asignados || 'Sin rol asignado'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta de Seguridad */}
          <div className="card border-warning">
            <div className="card-header bg-warning">
              <h5 className="mb-0">
                <i className="bi bi-shield-lock me-2"></i>
                Seguridad
              </h5>
            </div>
            <div className="card-body">
              {!showChangePassword ? (
                <div className="text-center py-3">
                  <i className="bi bi-lock fs-1 text-warning mb-3"></i>
                  <p className="text-muted mb-3">
                    Puedes cambiar tu contraseña en cualquier momento para mantener tu cuenta segura.
                  </p>
                  <button 
                    className="btn btn-warning btn-lg"
                    onClick={() => setShowChangePassword(true)}
                  >
                    <i className="bi bi-key me-2"></i>
                    Cambiar Contraseña
                  </button>
                </div>
              ) : (
                <div>
                  <h6 className="mb-3">Cambiar Contraseña</h6>
                  
                  {message.text && (
                    <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
                      {message.text}
                      <button 
                        type="button" 
                        className="btn-close" 
                        onClick={() => setMessage({ type: '', text: '' })}
                      ></button>
                    </div>
                  )}

                  <form onSubmit={handleSubmitPassword}>
                    <div className="mb-3">
                      <label htmlFor="currentPassword" className="form-label">
                        Contraseña Actual *
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        id="currentPassword"
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Ingresa tu contraseña actual"
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="newPassword" className="form-label">
                        Nueva Contraseña *
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        id="newPassword"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="Ingresa tu nueva contraseña"
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="confirmPassword" className="form-label">
                        Confirmar Nueva Contraseña *
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="Confirma tu nueva contraseña"
                        required
                      />
                    </div>

                    <div className="d-flex gap-2">
                      <button 
                        type="submit" 
                        className="btn btn-success"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Cambiando...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-circle me-2"></i>
                            Guardar Cambios
                          </>
                        )}
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowChangePassword(false);
                          setPasswordForm({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                          });
                          setMessage({ type: '', text: '' });
                        }}
                      >
                        <i className="bi bi-x-circle me-2"></i>
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiInformacion;
