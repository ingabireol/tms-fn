import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import { useBookings } from '@hooks/useBookings';
import { useMovies } from '@hooks/useMovies';
import { useGetTheatres } from '@hooks/useTheatres';
import { useGetAllUsers } from '@hooks/useUsers';
import { formatDate, formatCurrency } from '@utils/formatUtils';
import LoadingSpinner from '@components/common/LoadingSpinner';
import DataSeeder from '@components/admin/DataSeeder';
import {
  ResponsiveContainer,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import {
UserIcon,
FilmIcon,
BuildingStorefrontIcon,
TicketIcon,
ChartBarIcon,
ArrowTrendingUpIcon,
ArrowTrendingDownIcon,
ClockIcon
} from '@heroicons/react/24/outline';

const AdminDashboardPage = () => {
const { user } = useAuth();
const [totalStats, setTotalStats] = useState({
  totalUsers: 0,
  totalMovies: 0,
  totalTheatres: 0,
  totalBookings: 0
});
const [bookingStats, setBookingStats] = useState({
  completed: 0,
  pending: 0,
  cancelled: 0
});
const [isLoading, setIsLoading] = useState(true);

// Use the correct hooks for admin data
const { useGetAllBookings } = useBookings();
const { 
  data: bookingsData = [], 
  isLoading: isLoadingBookings 
} = useGetAllBookings();

// Get movies
const { useGetMovies } = useMovies();
const { 
  data: moviesData = [], 
  isLoading: isLoadingMovies 
} = useGetMovies();

// Get theatres
const { 
  data: theatresData = [], 
  isLoading: isLoadingTheatres 
} = useGetTheatres();

// Get users
const { 
  data: usersData = [], 
  isLoading: isLoadingUsers 
} = useGetAllUsers();

// Process data when it's loaded
useEffect(() => {
  if (!isLoadingBookings && !isLoadingMovies && !isLoadingTheatres && !isLoadingUsers) {
    console.log('Processing dashboard data...');
    console.log('Bookings data:', bookingsData);
    console.log('Movies data:', moviesData);
    console.log('Theatres data:', theatresData);
    console.log('Users data:', usersData);

    // Calculate total stats
    setTotalStats({
      totalUsers: Array.isArray(usersData) ? usersData.length : 0,
      totalMovies: Array.isArray(moviesData) ? moviesData.length : 0,
      totalTheatres: Array.isArray(theatresData) ? theatresData.length : 0,
      totalBookings: Array.isArray(bookingsData) ? bookingsData.length : 0
    });
    
    // Calculate booking stats
    if (Array.isArray(bookingsData) && bookingsData.length > 0) {
      const completed = bookingsData.filter(b => 
        b.paymentStatus === 'COMPLETED'
      ).length;
      
      const pending = bookingsData.filter(b => 
        b.paymentStatus === 'PENDING'
      ).length;
      
      const cancelled = bookingsData.filter(b => 
        b.paymentStatus === 'CANCELLED' || b.paymentStatus === 'REFUNDED'
      ).length;
      
      console.log('Booking stats:', { completed, pending, cancelled });
      
      setBookingStats({
        completed,
        pending,
        cancelled
      });
    } else {
      console.log('No bookings data available');
      setBookingStats({
        completed: 0,
        pending: 0,
        cancelled: 0
      });
    }
    
    setIsLoading(false);
  }
}, [bookingsData, moviesData, theatresData, usersData, isLoadingBookings, isLoadingMovies, isLoadingTheatres, isLoadingUsers]);

// Recent bookings (last 5)
const recentBookings = Array.isArray(bookingsData) && bookingsData.length > 0
  ? [...bookingsData]
      .sort((a, b) => {
        const dateA = new Date(a.bookingTime || a.createdAt || 0);
        const dateB = new Date(b.bookingTime || b.createdAt || 0);
        return dateB - dateA;
      })
      .slice(0, 5)
  : [];

// Popular movies (films with most bookings)
const getPopularMovies = () => {
  if (!Array.isArray(bookingsData) || !Array.isArray(moviesData) || 
      bookingsData.length === 0 || moviesData.length === 0) {
    return moviesData.slice(0, 5); // Return first 5 movies if no booking data
  }
  
  // Count bookings per movie
  const movieBookingCounts = bookingsData.reduce((acc, booking) => {
    const movieId = booking.movieId;
    if (movieId) {
      if (!acc[movieId]) acc[movieId] = 0;
      acc[movieId]++;
    }
    return acc;
  }, {});
  
  console.log('Movie booking counts:', movieBookingCounts);
  
  // Sort movies by booking count and get top 5
  return moviesData
    .map(movie => ({
      ...movie,
      bookingCount: movieBookingCounts[movie.id] || 0
    }))
    .sort((a, b) => b.bookingCount - a.bookingCount)
    .slice(0, 5);
};

const popularMovies = getPopularMovies();

// Chart data: bookings per day (last 7 days)
const bookingsPerDay = useMemo(() => {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  return days.map(day => ({
    date: day.slice(5),
    bookings: Array.isArray(bookingsData)
      ? bookingsData.filter(b => {
          const bd = new Date(b.bookingTime || b.createdAt || 0).toISOString().split('T')[0];
          return bd === day;
        }).length
      : 0
  }));
}, [bookingsData]);

// Chart data: revenue by movie (top 5)
const revenueByMovie = useMemo(() => {
  if (!Array.isArray(bookingsData) || bookingsData.length === 0) return [];
  const totals = bookingsData.reduce((acc, b) => {
    if (b.paymentStatus === 'COMPLETED' && b.movieTitle) {
      acc[b.movieTitle] = (acc[b.movieTitle] || 0) + (b.totalAmount || 0);
    }
    return acc;
  }, {});
  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, revenue]) => ({ name: name.length > 15 ? name.slice(0, 14) + '…' : name, revenue: Math.round(revenue * 100) / 100 }));
}, [bookingsData]);

// Loading state
if (isLoading) {
  return (
    <div className="flex justify-center items-center h-64">
      <LoadingSpinner />
    </div>
  );
}

return (
  <div>
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="text-gray-600">Welcome back, {user?.username || 'Admin'}</p>
    </div>
    
    {/* Stats Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Users */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <UserIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500">Total Users</h2>
            <p className="text-2xl font-bold text-gray-900">{totalStats.totalUsers}</p>
          </div>
        </div>
        <div className="mt-4">
          <Link 
            to="/admin/users"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all users
          </Link>
        </div>
      </div>
      
      {/* Movies */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <FilmIcon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500">Total Movies</h2>
            <p className="text-2xl font-bold text-gray-900">{totalStats.totalMovies}</p>
          </div>
        </div>
        <div className="mt-4">
          <Link 
            to="/admin/movies"
            className="text-sm text-green-600 hover:text-green-700"
          >
            View all movies
          </Link>
        </div>
      </div>
      
      {/* Theatres */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="rounded-full bg-purple-100 p-3 mr-4">
            <BuildingStorefrontIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500">Total Theatres</h2>
            <p className="text-2xl font-bold text-gray-900">{totalStats.totalTheatres}</p>
          </div>
        </div>
        <div className="mt-4">
          <Link 
            to="/admin/theatres"
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            View all theatres
          </Link>
        </div>
      </div>
      
      {/* Bookings */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="rounded-full bg-yellow-100 p-3 mr-4">
            <TicketIcon className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500">Total Bookings</h2>
            <p className="text-2xl font-bold text-gray-900">{totalStats.totalBookings}</p>
          </div>
        </div>
        <div className="mt-4">
          <Link 
            to="/admin/bookings"
            className="text-sm text-yellow-600 hover:text-yellow-700"
          >
            View all bookings
          </Link>
        </div>
      </div>
    </div>
    
    {/* Booking Status Stats */}
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Booking Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Completed Bookings */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="rounded-full bg-green-100 p-2 mr-3">
              <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Completed</h3>
              <p className="text-xl font-bold text-gray-900">{bookingStats.completed}</p>
            </div>
          </div>
        </div>
        
        {/* Pending Bookings */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="rounded-full bg-yellow-100 p-2 mr-3">
              <ClockIcon className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Pending</h3>
              <p className="text-xl font-bold text-gray-900">{bookingStats.pending}</p>
            </div>
          </div>
        </div>
        
        {/* Cancelled Bookings */}
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="rounded-full bg-red-100 p-2 mr-3">
              <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Cancelled</h3>
              <p className="text-xl font-bold text-gray-900">{bookingStats.cancelled}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bookings per day — line chart */}
      {bookingsPerDay.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Bookings — Last 7 Days</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={bookingsPerDay} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="bookings" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Bookings" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
    
    {/* Recent Bookings & Popular Movies */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Recent Bookings */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Bookings</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {recentBookings.length > 0 ? recentBookings.map(booking => (
            <div key={booking.id} className="px-6 py-4">
              <div className="flex justify-between mb-1">
                <h3 className="font-medium text-gray-900">
                  {booking.movieTitle || 'Unknown Movie'}
                </h3>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  booking.paymentStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  booking.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {booking.paymentStatus || 'Unknown'}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                <p>{booking.username || 'Unknown User'} • {formatDate(booking.bookingTime || booking.createdAt)}</p>
                <p>
                  {formatCurrency(booking.totalAmount || 0)} • 
                  {Array.isArray(booking.bookedSeats) 
                    ? booking.bookedSeats.length 
                    : (booking.bookedSeats ? Array.from(booking.bookedSeats).length : 0)
                  } seats
                </p>
              </div>
            </div>
          )) : (
            <div className="px-6 py-8 text-center text-gray-500">
              <TicketIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p>No recent bookings found.</p>
              {!isLoadingBookings && (
                <p className="text-xs mt-1">Try creating some test bookings to see data here.</p>
              )}
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <Link 
            to="/admin/bookings"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all bookings
          </Link>
        </div>
      </div>
      
      {/* Popular Movies */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Popular Movies</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {popularMovies.length > 0 ? popularMovies.map(movie => (
            <div key={movie.id} className="px-6 py-4 flex items-center">
              <div className="flex-shrink-0 h-16 w-12 bg-gray-200 rounded overflow-hidden mr-4">
                {movie.posterUrl || movie.posterImageUrl ? (
                  <img 
                    src={movie.posterUrl || movie.posterImageUrl} 
                    alt={movie.title} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <FilmIcon className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{movie.title}</h3>
                <p className="text-sm text-gray-500">
                  {movie.bookingCount || 0} bookings
                </p>
              </div>
              <div className="ml-4">
                <Link 
                  to={`/admin/movies/${movie.id}`}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  View
                </Link>
              </div>
            </div>
          )) : (
            <div className="px-6 py-8 text-center text-gray-500">
              <FilmIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p>No movies found.</p>
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <Link 
            to="/admin/movies"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all movies
          </Link>
        </div>
      </div>
    </div>
    
    {/* Revenue by Movie chart */}
    {revenueByMovie.length > 0 && (
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Revenue by Movie (Top 5)</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={revenueByMovie} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
            <Tooltip formatter={v => [`$${v}`, 'Revenue']} />
            <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue ($)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )}

    {/* Data Seeder Component for Development */}
    {process.env.NODE_ENV === 'development' && (
      <div className="mb-8">
        <DataSeeder />
      </div>
    )}
    
    {/* Debug Information (remove in production) */}
    {process.env.NODE_ENV === 'development' && (
      <div className="bg-gray-100 rounded-lg p-4 mt-8">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Info:</h3>
        <div className="text-xs text-gray-600 space-y-1">
          <p>Bookings loading: {isLoadingBookings.toString()}</p>
          <p>Users loading: {isLoadingUsers.toString()}</p>
          <p>Bookings count: {Array.isArray(bookingsData) ? bookingsData.length : 'Not array'}</p>
          <p>Users count: {Array.isArray(usersData) ? usersData.length : 'Not array'}</p>
          <p>Movies count: {Array.isArray(moviesData) ? moviesData.length : 'Not array'}</p>
          <p>Theatres count: {Array.isArray(theatresData) ? theatresData.length : 'Not array'}</p>
        </div>
      </div>
    )}
  </div>
);
};

export default AdminDashboardPage;