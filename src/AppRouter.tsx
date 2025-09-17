import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import App from './App';

const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: <App />
      }
    ]
  },
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/register',
    element: <RegisterPage />
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />
  }
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}