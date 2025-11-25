import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

/**
 * Layout component con Sidebar y TopBar según el diseño de la imagen
 */
const Layout = () => {
  const location = useLocation();
  
  // No mostrar sidebar y topbar en login
  const showLayout = location.pathname !== '/login' && !location.pathname.startsWith('/auth/');

  if (!showLayout) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        <TopBar />
        <main className="flex-1 overflow-y-auto pt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

