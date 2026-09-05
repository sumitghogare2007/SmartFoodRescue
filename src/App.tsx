import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Toaster } from 'react-hot-toast';

import AppLayout from './components/layout/AppLayout';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';

import AdminDashboard from './pages/dashboard/AdminDashboard';
import DonorDashboard from './pages/dashboard/DonorDashboard';
import NGODashboard from './pages/dashboard/NGODashboard';
import VolunteerDashboard from './pages/dashboard/VolunteerDashboard';

import DonationsPage from './pages/donations/DonationsPage';
import NewDonation from './pages/donations/NewDonation';
import DonationDetail from './pages/donations/DonationDetail';
import PickupsPage from './pages/pickups/PickupsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authUser, loading } = useAuth();
  
  if (loading) return null;
  if (!authUser) return <Navigate to="/auth/login" replace />;
  
  return <>{children}</>;
};

const DashboardRouter = () => {
  const { authUser } = useAuth();
  
  switch (authUser?.userType) {
    case 'ADMIN': return <AdminDashboard />;
    case 'DONOR': return <DonorDashboard />;
    case 'NGO': return <NGODashboard />;
    case 'VOLUNTEER': return <VolunteerDashboard />;
    default: return <Navigate to="/auth/login" />;
  }
};

const App = () => {
  return (
    <Router>
      <NotificationProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            
            <Route path="/auth">
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
            </Route>

            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<DashboardRouter />} />
              
              <Route path="donations">
                <Route index element={<DonationsPage />} />
                <Route path="new" element={<NewDonation />} />
                <Route path=":id" element={<DonationDetail />} />
              </Route>

              <Route path="pickups">
                <Route index element={<PickupsPage />} />
              </Route>
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster 
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#fff',
                color: '#1a202c',
                border: '1px solid #e2e8f0'
              }
            }}
          />
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
};

export default App;
