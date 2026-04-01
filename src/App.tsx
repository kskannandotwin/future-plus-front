import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage/LoginPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import MembersPage from './pages/MembersPage/MembersPage';
import MonthlyProfitPage from './pages/MonthlyProfitPage/MonthlyProfitPage';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Dashboard Route */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/members" 
          element={
            <ProtectedRoute>
              <MembersPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/member-profit/:id" 
          element={
            <ProtectedRoute>
              <MonthlyProfitPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Default Redirect to Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Fallback for unknown routes */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
