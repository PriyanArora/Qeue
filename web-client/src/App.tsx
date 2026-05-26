import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { EventDetailPage } from './pages/EventDetailPage';
import { EventListPage } from './pages/EventListPage';
import {
  AnalyticsPage,
  CheckInPage,
  EditEventPage,
  NewEventPage,
  OrganizerAttendeesPage,
  OrganizerEventsPage,
  SessionsPage,
  SpeakersPage,
  SurveysPage
} from './pages/OrganizerPages';
import { MyRegistrationsPage } from './pages/MyRegistrationsPage';
import { ProtectedRoute } from './routes/ProtectedRoute';

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/events" replace />} />
        <Route path="/events" element={<EventListPage />} />
        <Route path="/events/:eventId" element={<EventDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute role="ORGANIZER" />}>
          <Route path="/organizer/events" element={<OrganizerEventsPage />} />
          <Route path="/organizer/events/new" element={<NewEventPage />} />
          <Route path="/organizer/events/:eventId/edit" element={<EditEventPage />} />
          <Route path="/organizer/events/:eventId/attendees" element={<OrganizerAttendeesPage />} />
          <Route path="/organizer/events/:eventId/check-in" element={<CheckInPage />} />
          <Route path="/organizer/events/:eventId/analytics" element={<AnalyticsPage />} />
          <Route path="/organizer/events/:eventId/speakers" element={<SpeakersPage />} />
          <Route path="/organizer/events/:eventId/sessions" element={<SessionsPage />} />
          <Route path="/organizer/events/:eventId/surveys" element={<SurveysPage />} />
        </Route>

        <Route element={<ProtectedRoute role="ATTENDEE" />}>
          <Route path="/me/registrations" element={<MyRegistrationsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/events" replace />} />
      </Route>
    </Routes>
  );
}
