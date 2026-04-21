import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';
import useResponsive from '@hooks/useResponsive';
import GlobalSearch from '@components/common/GlobalSearch';

// Icons
import {
  ChartBarIcon,
  FilmIcon,
  TicketIcon,
  UsersIcon,
  BuildingStorefrontIcon,
  CalendarIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowLeftOnRectangleIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline';

const AdminLayout = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Close sidebar when location changes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);
  
  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Handle search navigation
  const handleSearchNavigate = (path) => {
    navigate(path);
    setSidebarOpen(false); // Close sidebar if open
  };
  
  // Navigation items (base items for all admin users)
  const baseNavigationItems = [
    { name: 'Dashboard', to: '/admin', icon: <ChartBarIcon className="w-5 h-5" />, exact: true },
    { name: 'Movies', to: '/admin/movies', icon: <FilmIcon className="w-5 h-5" /> },
    { name: 'Theatres', to: '/admin/theatres', icon: <BuildingStorefrontIcon className="w-5 h-5" /> },
    { name: 'Screenings', to: '/admin/screenings', icon: <CalendarIcon className="w-5 h-5" /> },
    { name: 'Bookings', to: '/admin/bookings', icon: <TicketIcon className="w-5 h-5" /> },
    { name: 'Reports', to: '/admin/reports', icon: <DocumentChartBarIcon className="w-5 h-5" /> },
  ];

  // Add Users menu item only for admin users
  const navigationItems = isAdmin 
    ? [...baseNavigationItems, { name: 'Users', to: '/admin/users', icon: <UsersIcon className="w-5 h-5" /> }]
    : baseNavigationItems;
  
  // Sidebar content
  const sidebarContent = (
    <div className="h-full flex flex-col bg-gray-800">
      {/* Logo */}
      <div className="h-16 bg-gray-900 flex items-center px-4">
        <Link to="/admin" className="flex items-center space-x-2">
          <FilmIcon className="h-8 w-8 text-white" />
          <span className="text-white text-xl font-bold">THMS Admin</span>
        </Link>
      </div>
      
      {/* Admin Search - Sidebar */}
      <div className="p-4 border-b border-gray-700">
        <GlobalSearch
          userRole={user?.role}
          onNavigate={handleSearchNavigate}
          className="w-full"
          placeholder="Search admin content..."
        />
      </div>
      
      {/* Navigation */}
      <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigationItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => 
                `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isActive 
                    ? 'bg-gray-900 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
      
      {/* User info */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-9 w-9 rounded-full bg-gray-700 flex items-center justify-center text-white font-medium">
              {user?.firstName?.charAt(0) || user?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-white">
              {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.username || 'Admin'}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <button
                onClick={handleLogout}
                className="text-xs font-medium text-gray-300 hover:text-white flex items-center transition-colors duration-200"
              >
                <ArrowLeftOnRectangleIcon className="w-4 h-4 mr-1" />
                Logout
              </button>
              <span className="text-gray-500">•</span>
              <Link
                to="/"
                className="text-xs font-medium text-gray-300 hover:text-white flex items-center transition-colors duration-200"
              >
                <HomeIcon className="w-4 h-4 mr-1" />
                View Site
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      {isMobile && (
        <div 
          className={`fixed inset-0 flex z-40 md:hidden transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } transition-transform duration-300 ease-in-out`}
        >
          {/* Overlay */}
          <div 
            className={`fixed inset-0 bg-gray-600 bg-opacity-75 ${
              sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            } transition-opacity duration-300 ease-in-out`}
            onClick={() => setSidebarOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full">
            {/* Close button */}
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            
            {/* Sidebar content */}
            {sidebarContent}
          </div>
          
          {/* Blank column to force sidebar to shrink */}
          <div className="flex-shrink-0 w-14" aria-hidden="true" />
        </div>
      )}
      
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          {sidebarContent}
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="md:hidden px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors duration-200"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex items-center">
              {/* Mobile Search */}
              <div className="md:hidden max-w-md w-full">
                <GlobalSearch
                  userRole={user?.role}
                  onNavigate={handleSearchNavigate}
                  className="w-full"
                  placeholder="Search..."
                />
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {/* Quick Actions */}
              <Link 
                to="/admin/movies/create"
                className="hidden md:inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors duration-200"
              >
                Add Movie
              </Link>
              <Link 
                to="/"
                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200"
              >
                <HomeIcon className="w-4 h-4 mr-1" />
                View Site
              </Link>
            </div>
          </div>
        </div>
        
        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;