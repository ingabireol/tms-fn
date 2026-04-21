// src/App.jsx - Updated routes with search page
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@contexts/AuthContext';
import { ToastProvider } from '@contexts/ToastContext';

import MainLayout from '@layouts/MainLayout';
import AdminLayout from '@layouts/AdminLayout';
import ProtectedRoute from '@components/routing/ProtectedRoute';
import RoleBasedRoute from '@components/routing/RoleBasedRoute';

// Public Pages
import Home from '@pages/public/Home';
import MoviesPage from '@pages/public/Movies';
import MovieDetailsPage from '@pages/public/MovieDetails';
import SearchResultsPage from '@pages/public/SearchResults'; // New search results page
import LoginPage from '@pages/auth/Login';
import RegisterPage from '@pages/auth/Register';
import TwoFactorAuthPage from '@pages/auth/TwoFactorAuth';
import ForgotPasswordPage from '@pages/auth/ForgotPassword';
import ResetPasswordPage from '@pages/auth/ResetPassword';
import AboutPage from '@pages/public/About';
import ContactPage from '@pages/public/Contact';
import NotFoundPage from '@pages/public/NotFound';

// User Pages
import ProfilePage from '@pages/user/Profile';
import BookingsPage from '@pages/user/Bookings';
import BookingDetailsPage from '@pages/user/BookingDetails';
import SeatSelectionPage from '@pages/user/SeatSelection';
import CheckoutPage from '@pages/user/Checkout';

// Admin Pages
import AdminDashboardPage from '@pages/admin/Dashboard';

// Admin Movies Pages
import { 
  SimplifiedList as AdminMoviesPage,
  CreateMovie as AdminMoviesCreatePage,
  EditMovie as AdminMoviesEditPage,
  ViewMovie as AdminMoviesViewPage
} from '@pages/admin/Movies/index';

// Admin Theatres Pages
import { 
  TheatreList as AdminTheatresPage,
  CreateTheatre as AdminTheatresCreatePage,
  EditTheatre as AdminTheatresEditPage,
  ViewTheatre as AdminTheatresViewPage,
  ManageSeats as AdminTheatresManageSeatsPage
} from '@pages/admin/Theatres/index';

// Admin Screenings Pages
import ScreeningsPage from '@pages/admin/Screenings/Screenings';
import AdminScreeningsCreatePage from '@pages/admin/Screenings/Create';
import AdminScreeningsEditPage from '@pages/admin/Screenings/Edit';
import AdminScreeningsViewPage from '@pages/admin/Screenings/View';

// Admin Bookings Pages
import AdminBookingsPage from '@pages/admin/Bookings';

// Admin Reports Page
import AdminReportsPage from '@pages/admin/Reports';

// Admin Users Pages
import { 
  UserList as AdminUsersPage,
  CreateUser as AdminUsersCreatePage,
  EditUser as AdminUsersEditPage,
  ViewUser as AdminUsersViewPage
} from '@pages/admin/Users/index';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

// Create router
const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <NotFoundPage />,
    children: [
      // Public routes
      { index: true, element: <Home /> },
      { path: 'movies', element: <MoviesPage /> },
      { path: 'movies/:id', element: <MovieDetailsPage /> },
      { path: 'search', element: <SearchResultsPage /> }, // New search route
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'two-factor-auth', element: <TwoFactorAuthPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'contact', element: <ContactPage /> },
      
      // Protected user routes
      { 
        path: 'profile', 
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        )
      },
      { 
        path: 'bookings', 
        element: (
          <ProtectedRoute>
            <BookingsPage />
          </ProtectedRoute>
        )
      },
      { 
        path: 'bookings/:id', 
        element: (
          <ProtectedRoute>
            <BookingDetailsPage />
          </ProtectedRoute>
        )
      },
      { 
        path: 'screening/:id/seats', 
        element: (
          <ProtectedRoute>
            <SeatSelectionPage />
          </ProtectedRoute>
        )
      },
      { 
        path: 'checkout/:screeningId', 
        element: (
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        )
      }
    ]
  },
  // Admin routes
  {
    path: '/admin',
    element: (
      <RoleBasedRoute roles={['ROLE_ADMIN', 'ROLE_MANAGER']}>
        <AdminLayout />
      </RoleBasedRoute>
    ),
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      
      // Movie management routes
      { path: 'movies', element: <AdminMoviesPage /> },
      { path: 'movies/create', element: <AdminMoviesCreatePage /> },
      { path: 'movies/:id', element: <AdminMoviesViewPage /> },
      { path: 'movies/:id/edit', element: <AdminMoviesEditPage /> },
      
      // Theatre management routes
      { path: 'theatres', element: <AdminTheatresPage /> },
      { path: 'theatres/create', element: <AdminTheatresCreatePage /> },
      { path: 'theatres/:id', element: <AdminTheatresViewPage /> },
      { path: 'theatres/:id/edit', element: <AdminTheatresEditPage /> },
      { path: 'theatres/:id/seats', element: <AdminTheatresManageSeatsPage /> },
      { path: 'theatres/:id/screens/:screenNumber/seats', element: <AdminTheatresManageSeatsPage /> },
      
      // Screening management routes
      { path: 'screenings', element: <ScreeningsPage /> },
      { path: 'screenings/create', element: <AdminScreeningsCreatePage /> },
      { path: 'screenings/:id', element: <AdminScreeningsViewPage /> },
      { path: 'screenings/:id/edit', element: <AdminScreeningsEditPage /> },
      
      // Booking management routes
      { path: 'bookings', element: <AdminBookingsPage /> },

      // Reports
      { path: 'reports', element: <AdminReportsPage /> },
      
      // User management routes
      { 
        path: 'users', 
        element: (
          <RoleBasedRoute roles={['ROLE_ADMIN']}>
            <AdminUsersPage />
          </RoleBasedRoute>
        )
      },
      { 
        path: 'users/create', 
        element: (
          <RoleBasedRoute roles={['ROLE_ADMIN']}>
            <AdminUsersCreatePage />
          </RoleBasedRoute>
        )
      },
      { 
        path: 'users/:id', 
        element: (
          <RoleBasedRoute roles={['ROLE_ADMIN']}>
            <AdminUsersViewPage />
          </RoleBasedRoute>
        )
      },
      { 
        path: 'users/:id/edit', 
        element: (
          <RoleBasedRoute roles={['ROLE_ADMIN']}>
            <AdminUsersEditPage />
          </RoleBasedRoute>
        )
      }
    ]
  },
  // Fallback route
  {
    path: '*',
    element: <NotFoundPage />
  }
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
      {/* Only show React Query Devtools in development */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default App;