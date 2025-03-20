import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.tsx';
import './fonts.jsx';
import Register from './pages/Register.tsx';
import Login from './pages/Login.tsx';
import Panel from './pages/Panel.tsx';
import { SettingsLayout, Settings } from './pages/panel/Settings.tsx';
import Profile from './pages/panel/settings/Profile.tsx';
import Xbox from './pages/panel/settings/profile/Xbox.tsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/register',
        element: <Register />,
      },
      {
        path: '/panel',
        element: <Panel />,
        children: [
          {
            path: 'settings',
            element: <SettingsLayout />,
            children: [
              {
                path: '',
                element: <Settings />,
              },
              {
                path: 'profile',
                element: <Profile />,
              },
              {
                path: 'profile/xbox',
                element: <Xbox />,
              },
            ],
          },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
