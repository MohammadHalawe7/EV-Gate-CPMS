/* =============================================================================
 * EV Gate CPMS — routes.
 *
 * Today the product is the public Registration experience plus the Design
 * System catalogue. The authenticated application mounts under `AppShell` as
 * modules arrive; the placeholder below marks where.
 * ========================================================================== */

import { Navigate, Route, Routes } from 'react-router-dom';
import { DesignSystemPage } from '@/design-system/DesignSystemPage';
import { PublicLayout } from './PublicLayout';
import {
  CompanyRegistrationPage,
  ForgotPasswordPage,
  LoginPage,
  RegistrationStatusPage,
  RegistrationSubmittedPage,
  RequestDemoPage,
  REGISTRATION_ROUTES,
} from '@/modules/registration';

export function AppRoutes() {
  return (
    <Routes>
      {/* Sign-in and password reset carry their own full-bleed split-screen
          shell — no top navigation, because there is one thing to do there. */}
      <Route path={REGISTRATION_ROUTES.login} element={<LoginPage />} />
      <Route path={REGISTRATION_ROUTES.forgotPassword} element={<ForgotPasswordPage />} />

      <Route element={<PublicLayout />}>
        <Route path={REGISTRATION_ROUTES.requestDemo} element={<RequestDemoPage />} />
        <Route path={REGISTRATION_ROUTES.register} element={<CompanyRegistrationPage />} />
        <Route path={REGISTRATION_ROUTES.submitted} element={<RegistrationSubmittedPage />} />
        <Route path={REGISTRATION_ROUTES.status} element={<RegistrationStatusPage />} />
      </Route>

      {/* The foundation's catalogue stays mounted — it is how the next screen
          is checked against what already exists. */}
      <Route path="/design-system" element={<DesignSystemPage />} />

      <Route path="/" element={<Navigate to={REGISTRATION_ROUTES.login} replace />} />
      <Route path="*" element={<Navigate to={REGISTRATION_ROUTES.login} replace />} />
    </Routes>
  );
}
