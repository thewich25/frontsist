import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AreaLogin = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/personal-area/login', form);

      // Guardar token y datos del usuario
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', 'area');
      localStorage.setItem('userData', JSON.stringify(data.user));

      // Redirigir al dashboard de área
      navigate('/area');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-white py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6 col-xl-5">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-secondary text-white text-center">
                <h4 className="mb-0">
                  <i className="bi bi-briefcase me-2"></i>
                  Acceso Encargados de Área
                </h4>
              </div>
              <div className="card-body p-4">
                {error && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                  </div>
                )}
                
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
                      disabled={loading}
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
                      disabled={loading}
                    />
                  </div>
                  <button type="submit" className="btn btn-secondary w-100" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Iniciando sesión...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Iniciar sesión
                      </>
                    )}
                  </button>
                </form>
              </div>
              <div className="card-footer text-center text-muted">
                <small>Acceso para responsables de áreas internas</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AreaLogin;