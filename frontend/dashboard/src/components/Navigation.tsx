// src/components/Navigation.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { useAuthStore } from '../stores/authStore';
import { Button } from './ui/button';
import { ShieldHalf } from 'lucide-react';

const Navigation: React.FC = () => {
  const { supabaseClient } = useAuthStore();

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
  };

  return (
    // Use sticky positioning so navigation stays at top while scrolling
    <header className="sticky top-0 z-50">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between max-w-7xl mx-auto p-4">
        <div className="flex items-center gap-4">
          <ShieldHalf size={64} className="text-blue-500" />
          <div>
            <h1 className="text-4xl font-extrabold text-gray-800">YouthSafeAgent</h1>
            <p className="text-sm text-gray-500 font-medium">
              Parental Control Dashboard
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <NavigationMenu>
            <NavigationMenuList className="flex gap-2">
              {[
                { name: 'Dashboard', path: '/' },
                { name: 'Risky Event Reports', path: '/reports' },
                { name: 'Conversation History', path: '/conversations' },
                { name: 'Family Management', path: '/family' },
              ].map((page) => (
                <NavigationMenuItem key={page.name}>
                  <NavLink
                    to={page.path}
                    className={({ isActive }) =>
                      `block px-4 py-2 rounded-md border border-gray-200 ${
                        isActive ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 text-gray-800'
                      }`
                    }
                  >
                    {page.name}
                  </NavLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
          <Button onClick={handleLogout} variant="destructive">
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
