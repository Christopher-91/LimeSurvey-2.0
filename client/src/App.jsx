import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Navbar } from './components/Navbar.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { AdminDashboard } from './pages/AdminDashboard.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { ResultsStats } from './pages/ResultsStats.jsx';
import { SurveyBuilder } from './pages/SurveyBuilder.jsx';
import { SurveyList } from './pages/SurveyList.jsx';
import { SurveyTaking } from './pages/SurveyTaking.jsx';
import { VoterDashboard } from './pages/VoterDashboard.jsx';

export const App = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <main style={{ flex: 1, paddingBottom: '40px' }}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/surveys/:id/take" element={<SurveyTaking />} />

                {/* Voter Protected Routes */}
                <Route
                  path="/voter/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['voter']}>
                      <VoterDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Protected Routes */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/surveys"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                      <SurveyList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/surveys/new"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                      <SurveyBuilder />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/surveys/:id/edit"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                      <SurveyBuilder />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/surveys/:id/statistics"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                      <ResultsStats />
                    </ProtectedRoute>
                  }
                />

                {/* 404 Fallback */}
                <Route
                  path="*"
                  element={
                    <div className="ls-container" style={{ textAlign: 'center', padding: '100px 0' }}>
                      <div className="ls-card ls-empty-state">
                        <i className="ri-compass-3-line ls-empty-icon" />
                        <h2>404 — Page Not Found</h2>
                        <p style={{ margin: '10px 0 20px 0' }}>The requested resource does not exist.</p>
                        <a href="/" className="ls-btn ls-btn-primary">
                          Back to Home
                        </a>
                      </div>
                    </div>
                  }
                />
              </Routes>
            </main>
          </div>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};
