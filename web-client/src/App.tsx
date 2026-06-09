import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { RequireAuth } from './components/layout/RequireAuth';
import { LoadingBlock } from './components/ui/States';

const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const BrowseEventsPage = lazy(() => import('./pages/BrowseEventsPage').then((m) => ({ default: m.BrowseEventsPage })));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage').then((m) => ({ default: m.EventDetailPage })));
const EventRegisterPage = lazy(() => import('./pages/EventRegisterPage').then((m) => ({ default: m.EventRegisterPage })));
const EventSurveyPage = lazy(() => import('./pages/EventSurveyPage').then((m) => ({ default: m.EventSurveyPage })));
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('./pages/auth/SignupPage').then((m) => ({ default: m.SignupPage })));
const NotFoundPage = lazy(() => import('./pages/StatusPages').then((m) => ({ default: m.NotFoundPage })));
const ForbiddenPage = lazy(() => import('./pages/StatusPages').then((m) => ({ default: m.ForbiddenPage })));

const MyRegistrationsPage = lazy(() => import('./pages/attendee/MyRegistrationsPage').then((m) => ({ default: m.MyRegistrationsPage })));

const OrganizerDashboardPage = lazy(() => import('./pages/organizer/OrganizerDashboardPage').then((m) => ({ default: m.OrganizerDashboardPage })));
const EventCreatePage = lazy(() => import('./pages/organizer/EventCreatePage').then((m) => ({ default: m.EventCreatePage })));
const EventManageLayout = lazy(() => import('./pages/organizer/EventManageLayout').then((m) => ({ default: m.EventManageLayout })));
const OverviewTab = lazy(() => import('./pages/organizer/tabs/OverviewTab').then((m) => ({ default: m.OverviewTab })));
const EventEditTab = lazy(() => import('./pages/organizer/tabs/EventEditTab').then((m) => ({ default: m.EventEditTab })));
const RegistrationTab = lazy(() => import('./pages/organizer/tabs/RegistrationTab').then((m) => ({ default: m.RegistrationTab })));
const AgendaTab = lazy(() => import('./pages/organizer/tabs/AgendaTab').then((m) => ({ default: m.AgendaTab })));
const AttendeesTab = lazy(() => import('./pages/organizer/tabs/AttendeesTab').then((m) => ({ default: m.AttendeesTab })));
const CheckInTab = lazy(() => import('./pages/organizer/tabs/CheckInTab').then((m) => ({ default: m.CheckInTab })));
const AnalyticsTab = lazy(() => import('./pages/organizer/tabs/AnalyticsTab').then((m) => ({ default: m.AnalyticsTab })));
const SurveysTab = lazy(() => import('./pages/organizer/tabs/SurveysTab').then((m) => ({ default: m.SurveysTab })));

export function App() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Routes>
        {/* Auth screens use their own full-bleed layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Everything else shares the site header/footer chrome */}
        <Route element={<AppLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="events" element={<BrowseEventsPage />} />
          <Route path="events/:eventId" element={<EventDetailPage />} />
          <Route path="events/:eventId/survey" element={<EventSurveyPage />} />
          <Route path="forbidden" element={<ForbiddenPage />} />

          {/* Attendee-only */}
          <Route element={<RequireAuth role="ATTENDEE" />}>
            <Route path="events/:eventId/register" element={<EventRegisterPage />} />
            <Route path="my/registrations" element={<MyRegistrationsPage />} />
          </Route>

          {/* Organizer-only */}
          <Route element={<RequireAuth role="ORGANIZER" />}>
            <Route path="organizer" element={<OrganizerDashboardPage />} />
            <Route path="organizer/events/new" element={<EventCreatePage />} />
            <Route path="organizer/events/:eventId" element={<EventManageLayout />}>
              <Route index element={<OverviewTab />} />
              <Route path="details" element={<EventEditTab />} />
              <Route path="registration" element={<RegistrationTab />} />
              <Route path="agenda" element={<AgendaTab />} />
              <Route path="attendees" element={<AttendeesTab />} />
              <Route path="check-in" element={<CheckInTab />} />
              <Route path="analytics" element={<AnalyticsTab />} />
              <Route path="surveys" element={<SurveysTab />} />
            </Route>
          </Route>

          <Route path="404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
