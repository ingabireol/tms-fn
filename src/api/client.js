import axios from 'axios';

/**
 * Axios instance configured for the Theatre Management System API
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

/**
 * Request interceptor to add authentication token
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor to handle common errors
 */
apiClient.interceptors.response.use(
  (response) => {
    // Extract data from the response for easier consumption
    // But handle the password reset endpoints specially
    if (response.config.url?.includes('/auth/password/')) {
      // For password reset endpoints, preserve the full response structure
      console.log('Password reset endpoint response:', response.data);
      
      // Check if it's a successful response with data
      if (response.data?.success && response.data?.data) {
        response.data = response.data.data;
      } else if (response.data?.success === false) {
        // Keep error responses as-is for proper error handling
        // Don't extract data for error responses
      }
      // If no success field, assume the response is already in the correct format
    } else if (response.data?.data !== undefined) {
      // For other endpoints, extract data as before
      response.data = response.data.data;
    }
    
    return response;
  },
  (error) => {
    // Handle specific error codes
    const { response } = error;
    
    if (response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      
      // We don't redirect here to avoid coupling with the router
      // Instead, we'll let the auth context handle this
      // window.location.href = '/login';
      
      // Custom error object
      return Promise.reject({
        isAuthError: true,
        status: 401,
        message: response.data?.message || 'Unauthorized access',
        ...error
      });
    }
    
    if (response?.status === 403) {
      // Handle forbidden access
      return Promise.reject({
        isForbiddenError: true,
        status: 403,
        message: response.data?.message || 'Forbidden access',
        ...error
      });
    }
    
    if (response?.status === 404) {
      // Handle not found
      return Promise.reject({
        isNotFoundError: true,
        status: 404,
        message: response.data?.message || 'Resource not found',
        ...error
      });
    }
    
    if (response?.status >= 500) {
      // Handle server errors
      return Promise.reject({
        isServerError: true,
        status: response.status,
        message: response.data?.message || 'Server error occurred',
        ...error
      });
    }
    
    // Generic error handling
    return Promise.reject({
      status: response?.status,
      message: response?.data?.message || error.message || 'An unexpected error occurred',
      ...error
    });
  }
);

export default apiClient;