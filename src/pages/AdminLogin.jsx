import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AdminLogin = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/admin/login', form);
      const data = res?.data;
      if (data?.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', 'admin');
        navigate('/admin');
      } else {
        throw new Error('Respuesta de autenticación inválida');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6 col-xl-5">
            <div className="card shadow border-0">
              <div className="card-header bg-primary text-white text-center">
                <h4 className="mb-0">
                  <i className="bi bi-shield-lock me-2"></i>
                  Acceso Administradores
                </h4>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit} autoComplete="off">
                  <div className="mb-3">
                    <label htmlFor="username" className="form-label">Usuario</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      className="form-control"
                      placeholder=""
                      autoComplete="off"
                      value={form.username}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">Contraseña</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      className="form-control"
                      placeholder=""
                      autoComplete="current-password"
                      value={form.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}
                  <button type="submit" className="btn btn-primary w-100">
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    {loading ? 'Ingresando...' : 'Iniciar sesión'}
                  </button>
                </form>
              </div>
              <div className="card-footer text-center text-muted">
                <small>Sólo personal administrativo autorizado</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;