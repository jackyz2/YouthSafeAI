// src/components/Layout.tsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';

const Layout: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <header className="mb-8">
        <Navigation />
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="mt-12 text-center text-gray-500">
        &copy; {new Date().getFullYear()} YouthSafeAgent. All rights reserved.
      </footer>
    </div>
  );
};

export default Layout;
