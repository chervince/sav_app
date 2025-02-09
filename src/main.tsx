import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LoginPage } from './pages/LoginPage';
import { AuthLayout } from './components/AuthLayout';
import { TicketList } from './pages/TicketList';
import { Navigation } from './components/Navigation';
import App from './App';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/',
        element: (
          <>
            <Navigation />
            <App />
          </>
        ),
      },
      {
        path: '/tickets',
        element: (
          <>
            <Navigation />
            <TicketList />
          </>
        ),
      },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
    <Toaster position="top-right" />
  </StrictMode>
);