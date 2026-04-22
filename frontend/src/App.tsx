import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import OMDashboard from './pages/office-manager/OMDashboard'
import OMAppointmentsPage from './pages/office-manager/OMAppointmentsPage'
import OMRequestsPage from './pages/office-manager/OMRequestsPage'
import OMDentistsPage from './pages/office-manager/OMDentistsPage'
import OMPatientsPage from './pages/office-manager/OMPatientsPage'
import OMSurgeriesPage from './pages/office-manager/OMSurgeriesPage'
import OMBillsPage from './pages/office-manager/OMBillsPage'
import DentistAppointmentsPage from './pages/dentist/DentistAppointmentsPage'
import PatientAppointmentsPage from './pages/patient/PatientAppointmentsPage'
import PatientBillsPage from './pages/patient/PatientBillsPage'
import PatientRequestPage from './pages/patient/PatientRequestPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute allowedRoles={['OFFICE_MANAGER']} />}>
        <Route path="/om" element={<OMDashboard />} />
        <Route path="/om/appointments" element={<OMAppointmentsPage />} />
        <Route path="/om/requests" element={<OMRequestsPage />} />
        <Route path="/om/dentists" element={<OMDentistsPage />} />
        <Route path="/om/patients" element={<OMPatientsPage />} />
        <Route path="/om/surgeries" element={<OMSurgeriesPage />} />
        <Route path="/om/bills" element={<OMBillsPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['DENTIST']} />}>
        <Route path="/dentist" element={<DentistAppointmentsPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}>
        <Route path="/patient" element={<PatientAppointmentsPage />} />
        <Route path="/patient/bills" element={<PatientBillsPage />} />
        <Route path="/patient/request" element={<PatientRequestPage />} />
      </Route>
    </Routes>
  )
}
