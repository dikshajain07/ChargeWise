import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { SoundProvider } from './contexts/SoundContext';
import { AuthProvider } from './contexts/AuthContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { GarageProvider } from './contexts/GarageContext';
import { ProgressProvider } from './contexts/ProgressContext';
import { PlannerProvider } from './contexts/PlannerContext';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Home } from './pages/Home';
import { Stations } from './pages/Stations';
import { RoutePlanner } from './pages/RoutePlanner';
import { MissionControl } from './pages/MissionControl';
import { Sandbox } from './pages/Sandbox';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Welcome } from './pages/Welcome';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { NotFound } from './pages/NotFound';

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <SoundProvider>
          <AuthProvider>
            <PreferencesProvider>
              <GarageProvider>
                <ProgressProvider>
                  <PlannerProvider>
                    <Routes>
                      <Route element={<AppShell />}>
                        <Route index element={<Home />} />
                        <Route path="stations" element={<Stations />} />
                        <Route path="route" element={<RoutePlanner />} />
                        <Route path="mission-control" element={<MissionControl />} />
                        <Route path="sandbox" element={<Sandbox />} />
                        <Route path="login" element={<Login />} />
                        <Route path="signup" element={<Signup />} />
                        <Route path="forgot-password" element={<ForgotPassword />} />
                        <Route path="reset-password" element={<ResetPassword />} />
                        <Route path="welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
                        <Route path="onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                        <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        <Route path="*" element={<NotFound />} />
                      </Route>
                    </Routes>
                  </PlannerProvider>
                </ProgressProvider>
              </GarageProvider>
            </PreferencesProvider>
          </AuthProvider>
        </SoundProvider>
      </ThemeProvider>
    </BrowserRouter>);

}