// src/api/bookings.js
import apiClient from './client';

/**
 * Booking API service with robust error handling
 * Handles all booking-related operations
 */
const bookingApi = {
  /**
   * Get user's bookings
   * @returns {Promise<Array>} List of user's bookings
   */
  getUserBookings: async () => {
    try {
      const response = await apiClient.get('/bookings');
      
      // Normalize response data
      const responseData = response.data || {};
      
      // Check for different response formats
      const bookingsData = responseData.data || responseData;
      
      return Array.isArray(bookingsData) ? bookingsData : [];
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      throw error;
    }
  },

  /**
   * Get all bookings (Admin only)
   * @returns {Promise<Array>} List of all bookings
   */
  getAllBookings: async () => {
    try {
      // Try admin endpoint first
      try {
        const response = await apiClient.get('/admin/bookings');
        const responseData = response.data || {};
        const bookingsData = responseData.data || responseData;
        return Array.isArray(bookingsData) ? bookingsData : [];
      } catch (primaryError) {
        // Try alternative endpoint
        console.warn('Primary admin endpoint failed, trying alternative:', primaryError);
        const response = await apiClient.get('/bookings/admin/all');
        const responseData = response.data || {};
        const bookingsData = responseData.data || responseData;
        return Array.isArray(bookingsData) ? bookingsData : [];
      }
    } catch (error) {
      console.error('Error fetching all bookings:', error);
      throw error;
    }
  },

  /**
   * Get a booking by ID
   * @param {number|string} id - Booking ID
   * @returns {Promise<Object>} Booking details
   */
  getBookingById: async (id) => {
    try {
      const response = await apiClient.get(`/bookings/${id}`);
      
      // Normalize response data
      const responseData = response.data || {};
      
      // Check for different response formats
      return responseData.data || responseData;
    } catch (error) {
      console.error(`Error fetching booking with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get booked seats for a screening
   * @param {number|string} screeningId - Screening ID
   * @returns {Promise<Array>} List of booked seats
   */
  getBookedSeatsByScreeningId: async (screeningId) => {
    try {
      // Try different possible endpoints
      let response;
      try {
        // Try primary endpoint
        response = await apiClient.get(`/bookings/screening/${screeningId}/seats`);
      } catch (primaryError) {
        console.warn('Primary endpoint failed, trying alternative:', primaryError);
        // Try alternative endpoint
        response = await apiClient.get(`/screenings/${screeningId}/booked-seats`);
      }
      
      // Normalize response data
      const responseData = response.data || {};
      
      // Check for different response formats
      const seatsData = responseData.data || responseData;
      
      // Different APIs might return different formats
      if (Array.isArray(seatsData)) {
        return seatsData;
      } else if (seatsData.seats && Array.isArray(seatsData.seats)) {
        return seatsData.seats;
      } else if (seatsData.bookedSeats && Array.isArray(seatsData.bookedSeats)) {
        return seatsData.bookedSeats;
      } else if (typeof seatsData === 'object') {
        // Try to extract from object keys if it's a map of seat IDs
        return Object.keys(seatsData).filter(key => key.match(/^[A-Z][0-9]+$/));
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching booked seats for screening ${screeningId}:`, error);
      return [];
    }
  },

  /**
   * Get seating layout for a screening
   * @param {number|string} screeningId - Screening ID
   * @returns {Promise<Object>} Seating layout
   */
  getSeatingLayout: async (screeningId) => {
    try {
      // Try different possible endpoints
      let response;
      try {
        // Try primary endpoint
        response = await apiClient.get(`/screenings/${screeningId}/layout`);
      } catch (primaryError) {
        console.warn('Primary endpoint failed, trying alternative:', primaryError);
        
        // Try to get theatre and screen info from the screening
        const screeningResponse = await apiClient.get(`/screenings/${screeningId}`);
        const screening = screeningResponse.data.data || screeningResponse.data;
        
        if (screening && screening.theatreId && screening.screenNumber) {
          // Try alternative endpoint with theatre and screen
          response = await apiClient.get(`/admin/seats/theatre/${screening.theatreId}/screen/${screening.screenNumber}`);
        } else {
          throw new Error('Could not retrieve theatre and screen information');
        }
      }
      
      // Normalize response data
      const responseData = response.data || {};
      
      // Check for different response formats
      const layoutData = responseData.data || responseData;
      
      // Different APIs might return different formats
      // Process data to return in a consistent format
      if (layoutData.rows && Array.isArray(layoutData.rows)) {
        // Standard format with rows array
        return layoutData;
      } else if (Array.isArray(layoutData)) {
        // Alternative format with array of seat objects - convert to rows
        const seatsByRow = layoutData.reduce((acc, seat) => {
          const rowName = seat.rowName || (typeof seat.id === 'string' ? seat.id.charAt(0) : null);
          
          if (rowName) {
            if (!acc[rowName]) {
              acc[rowName] = {
                seats: [],
                priceMultiplier: seat.priceMultiplier || 1.0,
                seatType: seat.seatType || 'STANDARD'
              };
            }
            
            acc[rowName].seats.push(seat);
          }
          
          return acc;
        }, {});
        
        // Convert to layout format
        const rows = Object.entries(seatsByRow).map(([name, rowData]) => ({
          name,
          seatsCount: rowData.seats.length,
          priceMultiplier: rowData.priceMultiplier,
          seatType: rowData.seatType
        }));
        
        return {
          rows,
          basePrice: 10.99 // Assume a default base price
        };
      } else if (typeof layoutData === 'object') {
        // Check if it's organized by row names (A, B, C, etc.)
        const rowKeys = Object.keys(layoutData).filter(key => key.match(/^[A-Z]$/));
        
        if (rowKeys.length > 0) {
          // Convert to rows format
          const rows = rowKeys.map(name => {
            const rowData = layoutData[name];
            return {
              name,
              seatsCount: rowData.seatsCount || 10,
              priceMultiplier: rowData.priceMultiplier || 1.0,
              seatType: rowData.seatType || 'STANDARD'
            };
          });
          
          return {
            rows,
            basePrice: layoutData.basePrice || 10.99
          };
        }
      }
      
      // Fallback to default layout
      return {
        rows: [
          { name: "A", seatsCount: 8, priceMultiplier: 1.0, seatType: "STANDARD" },
          { name: "B", seatsCount: 8, priceMultiplier: 1.0, seatType: "STANDARD" },
          { name: "C", seatsCount: 8, priceMultiplier: 1.2, seatType: "PREMIUM" }
        ],
        basePrice: 10.99
      };
    } catch (error) {
      console.error(`Error fetching seating layout for screening ${screeningId}:`, error);
      
      // Return a default layout if all attempts fail
      return {
        rows: [
          { name: "A", seatsCount: 8, priceMultiplier: 1.0, seatType: "STANDARD" },
          { name: "B", seatsCount: 8, priceMultiplier: 1.0, seatType: "STANDARD" },
          { name: "C", seatsCount: 8, priceMultiplier: 1.2, seatType: "PREMIUM" }
        ],
        basePrice: 10.99
      };
    }
  },

  /**
   * Calculate total price for selected seats
   * @param {number|string} screeningId - Screening ID
   * @param {Array<string>} selectedSeats - Selected seats
   * @returns {Promise<Object>} Price calculation
   */
  calculatePrice: async (screeningId, selectedSeats) => {
    try {
      const response = await apiClient.post(`/bookings/calculate`, {
        screeningId,
        selectedSeats
      });
      
      // Normalize response data
      const responseData = response.data || {};
      
      // Check for different response formats
      const priceData = responseData.data || responseData;
      
      // Ensure the response has the expected format
      if (!priceData.totalPrice) {
        // Fallback price calculation (10.99 per seat)
        const totalPrice = selectedSeats.length * 10.99;
        
        return {
          basePrice: 10.99,
          totalPrice,
          seats: selectedSeats
        };
      }
      
      return priceData;
    } catch (error) {
      console.error(`Error calculating price for screening ${screeningId}:`, error);
      
      // Fallback price calculation
      const totalPrice = selectedSeats.length * 10.99;
      
      return {
        basePrice: 10.99,
        totalPrice,
        seats: selectedSeats
      };
    }
  },

  /**
   * Create a new booking
   * @param {number|string} screeningId - Screening ID
   * @param {Array<string>} selectedSeats - Selected seats
   * @param {string} paymentMethod - Payment method
   * @returns {Promise<Object>} Created booking
   */
  createBooking: async (screeningId, selectedSeats, paymentMethod) => {
    try {
      // Check for required fields
      if (!screeningId) {
        throw new Error('Screening ID is required');
      }
      
      if (!selectedSeats || selectedSeats.length === 0) {
        throw new Error('Selected seats are required');
      }
      
      if (!paymentMethod) {
        throw new Error('Payment method is required');
      }
      
      // Normalize data based on what the API expects
      const bookingData = {
        screeningId: parseInt(screeningId, 10),
        bookedSeats: selectedSeats,
        paymentMethod
      };
      
      const response = await apiClient.post('/bookings', bookingData);
      
      // Normalize response data
      const responseData = response.data || {};
      
      // Check for different response formats
      return responseData.data || responseData;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  /**
   * Cancel a booking
   * @param {number|string} id - Booking ID
   * @returns {Promise<Object>} Response
   */
  cancelBooking: async (id) => {
    try {
      const response = await apiClient.delete(`/bookings/${id}`);
      
      // Normalize response data
      const responseData = response.data || {};
      
      // Check for different response formats
      return responseData.data || responseData;
    } catch (error) {
      console.error(`Error cancelling booking ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Get booking statistics by status
   * @returns {Promise<Object>} Booking statistics
   */
  getBookingStats: async () => {
    try {
      // Try admin dashboard endpoint first
      try {
        const response = await apiClient.get('/admin/dashboard');
        const dashboardData = response.data?.data || response.data || {};
        
        // Try to extract booking stats from dashboard data
        if (dashboardData.bookingStats) {
          return dashboardData.bookingStats;
        }
        
        // If dashboard data exists but no booking stats, try to calculate from recent bookings
        if (dashboardData.recentBookings && Array.isArray(dashboardData.recentBookings)) {
          const bookings = dashboardData.recentBookings;
          
          const completed = bookings.filter(b => b.paymentStatus === 'COMPLETED').length;
          const pending = bookings.filter(b => b.paymentStatus === 'PENDING').length;
          const cancelled = bookings.filter(b => b.paymentStatus === 'CANCELLED').length;
          
          return { completed, pending, cancelled };
        }
        
        throw new Error('No booking stats found in dashboard data');
      } catch (primaryError) {
        // Try alternative endpoint
        console.warn('Dashboard endpoint failed, trying alternative:', primaryError);
        
        const response = await apiClient.get('/admin/bookings/stats');
        return response.data?.data || response.data;
      }
    } catch (error) {
      console.error('Error fetching booking stats:', error);
      throw error;
    }
  }
};

export default bookingApi;