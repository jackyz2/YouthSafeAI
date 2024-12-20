import { useEffect, useState } from 'react';

import { ThemeSupa } from "@supabase/auth-ui-shared";

import './App.css';
import Dashboard from './components/dashboard-sample';
import { useAuthStore } from './stores/authStore';
import { Session } from '@supabase/supabase-js';
import AuthComponent from './components/auth';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import Reports from './components/reportpage';
import ReportDetail from './components/reportDetails';
import Conversations from './components/conversationpage';
import Settings from './components/Settings';
import Family from './components/family';
function App() {
  const { supabaseClient } = useAuthStore();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const router = createBrowserRouter([
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <Dashboard /> },
        { path: 'reports', element: <Reports /> },
        { path: 'reports/:id', element: <ReportDetail /> },
        { path: 'conversations', element: <Conversations /> },
        { path: 'family', element: <Family /> },
        { path: 'settings', element: <Settings /> },
        // Add other routes as needed
      ],
    },
  ]);

  return (
    <AuthComponent>
      <RouterProvider router={router} />
    </AuthComponent>
  );
}

export default App;