import axios from 'axios';
import { getApiBaseUrl } from './base-url';

/** Respuesta de error del API: conserva el código para distinguir, p. ej., un 404. */
export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  // La sesión es una cookie httpOnly que pone el API
  withCredentials: true,
});

// Interceptor para desempaquetar la respuesta de la El Negocio API
axiosInstance.interceptors.response.use(
  (response) => {
    // La API responde con { success: true, message: "...", data: { ... } }
    if (response.data && typeof response.data.success !== 'undefined') {
      // Si la respuesta indica éxito, devolvemos el payload real en "data"
      if (response.data.success) {
        response.data = response.data.data;
      } else {
        // En caso de que success sea false pero status 200 (poco común, pero por si acaso)
        return Promise.reject(new Error(response.data.message || 'Error en la petición'));
      }
    }
    return response;
  },
  (error) => {
    // Manejo de errores estándar de la API
    if (error.response && error.response.data) {
      const apiError = error.response.data;
      
      // Construir mensaje de error
      let errorMessage = apiError.message || 'Ocurrió un error inesperado.';
      
      if (apiError.error && Array.isArray(apiError.error)) {
        errorMessage += ' Detalles: ' + apiError.error.join(', ');
      }
      
      return Promise.reject(new ApiError(errorMessage, error.response.status));
    }
    return Promise.reject(error);
  }
);
