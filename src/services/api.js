import axios from 'axios';

// Configuración base de Axios (dinámica por host/red)
const ENV_BASE = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_BASE_URL : undefined;
const API_PORT = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_PORT) ? import.meta.env.VITE_API_PORT : 3000;
const PROTOCOL = typeof window !== 'undefined' ? (window.location.protocol || 'http:') : 'http:';
const HOSTNAME = typeof window !== 'undefined' ? (window.location.hostname || 'localhost') : 'localhost';
const HOST_BASE = `${PROTOCOL}//${HOSTNAME}:${API_PORT}/api`;
const API_BASE_URL = ENV_BASE || HOST_BASE;

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para requests
api.interceptors.request.use(
    (config) => {
        // Agregar el token de autenticación cuando esté disponible
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para responses
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Manejar error de autenticación
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Funciones de la API
export const apiService = {
    // Health check
    healthCheck: () => api.get('/health'),
    
    // Autenticación Admin
    adminLogin: (credentials) => api.post('/admin/login', credentials),
    adminMe: () => api.get('/admin/me'),
    
    // Áreas Laborales
    getAreas: () => api.get('/areas'),
    getArea: (id) => api.get(`/areas/${id}`),
    createArea: (areaData) => api.post('/areas', areaData),
    updateArea: (id, areaData) => api.put(`/areas/${id}`, areaData),
    deleteArea: (id) => api.delete(`/areas/${id}`),
    
    // Personal de Área
    getPersonalArea: () => api.get('/personal-area'),
    getPersonalAreaById: (id) => api.get(`/personal-area/${id}`),
    getPersonalByArea: (areaId) => api.get(`/personal-area/area/${areaId}`),
    createPersonalArea: (personalData) => api.post('/personal-area', personalData),
    updatePersonalArea: (id, personalData) => api.put(`/personal-area/${id}`, personalData),
    deletePersonalArea: (id) => api.delete(`/personal-area/${id}`),
    
    // Personal (trabajadores)
    getPersonal: () => api.get('/personal'),
    getPersonalById: (id) => api.get(`/personal/${id}`),
    createPersonal: (personalData) => api.post('/personal', personalData),
    updatePersonal: (id, personalData) => api.put(`/personal/${id}`, personalData),
    deletePersonal: (id) => api.delete(`/personal/${id}`),
    
    // Roles
    getRoles: () => api.get('/roles'),
    getRole: (id) => api.get(`/roles/${id}`),
    getRolesByArea: (areaId) => api.get(`/roles/area/${areaId}`),
    getRolesByPersonalArea: (personalAreaId) => api.get(`/roles/personal-area/${personalAreaId}`),
    createRole: (roleData) => api.post('/roles', roleData),
    updateRole: (id, roleData) => api.put(`/roles/${id}`, roleData),
    deleteRole: (id) => api.delete(`/roles/${id}`),
    
    // Trabajadores
    getTrabajadores: () => api.get('/trabajadores'),
    getTrabajador: (id) => api.get(`/trabajadores/${id}`),
    getTrabajadoresByArea: (areaId) => api.get(`/trabajadores/area/${areaId}`),
    getTrabajadoresByPersonalArea: (personalAreaId) => api.get(`/trabajadores/personal-area/${personalAreaId}`),
    createTrabajador: (trabajadorData) => api.post('/trabajadores', trabajadorData),
    updateTrabajador: (id, trabajadorData) => api.put(`/trabajadores/${id}`, trabajadorData),
    deleteTrabajador: (id) => api.delete(`/trabajadores/${id}`),
    
    // Ubicaciones Geográficas
    getUbicaciones: () => api.get('/ubicaciones'),
    getUbicacion: (id) => api.get(`/ubicaciones/${id}`),
    createUbicacion: (ubicacionData) => api.post('/ubicaciones', ubicacionData),
    updateUbicacion: (id, ubicacionData) => api.put(`/ubicaciones/${id}`, ubicacionData),
    deleteUbicacion: (id) => api.delete(`/ubicaciones/${id}`),

    // Asignaciones de Control
    getAsignaciones: (params) => api.get('/asignaciones', { params }),
    createAsignacion: (payload) => api.post('/asignaciones', payload),
    updateAsignacion: (id, payload) => api.put(`/asignaciones/${id}`, payload),
    deleteAsignacion: (id) => api.delete(`/asignaciones/${id}`),

    // Asistencias de Control
    getAsistencias: (params) => api.get('/asistencias', { params }),
    marcarAsistencia: (payload) => api.post('/asistencias', payload),
};

export default api;