/* =============================================================================
 * EV Gate CPMS — routes.
 *
 * Two shells. The public experience (sign-in, registration, tracking) keeps
 * its own layout; everything authenticated mounts inside `AppShell`.
 *
 * Every authenticated route is wrapped in a privilege gate, and the sidebar is
 * generated from the same constants, so a navigation item can never point at
 * something the persona is not allowed to open.
 * ========================================================================== */

import { Navigate, Route, Routes } from 'react-router-dom';
import { DesignSystemPage } from '@/design-system/DesignSystemPage';
import { PublicLayout } from './PublicLayout';
import { AppLayout } from './AppLayout';
import { Require } from './guards';
import { APP_ROUTES } from './navigation';
import { PRIVILEGES } from './session';
import {
  CompanyRegistrationPage,
  ForgotPasswordPage,
  LoginPage,
  RegistrationStatusPage,
  RegistrationSubmittedPage,
  RequestDemoPage,
  REGISTRATION_ROUTES,
} from '@/modules/registration';
import {
  ConnectorsPage,
  DashboardPage,
  HardwareProfileDetailPage,
  HardwareProfilesPage,
  LocationDetailPage,
  LocationsPage,
  OcppCommandsPage,
  OcppConfigurationPage,
  OcppDiagnosticsPage,
  OcppFirmwarePage,
  OcppLayout,
  OcppMonitorPage,
  OcppSmartChargingPage,
  PaymentPolicyPage,
  StationDetailPage,
  StationsPage,
  TariffDetailPage,
  TariffsPage,
} from '@/modules/network';

export function AppRoutes() {
  return (
    <Routes>
      {/* ---- Public ------------------------------------------------------ */}
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

      {/* ---- Authenticated ----------------------------------------------- */}
      <Route element={<AppLayout />}>
        <Route
          path={APP_ROUTES.dashboard}
          element={<Require privileges={[PRIVILEGES.networkView]}><DashboardPage /></Require>}
        />

        <Route
          path={APP_ROUTES.locations}
          element={<Require privileges={[PRIVILEGES.locationsView]}><LocationsPage /></Require>}
        />
        <Route
          path={APP_ROUTES.location()}
          element={<Require privileges={[PRIVILEGES.locationsView]}><LocationDetailPage /></Require>}
        />

        <Route
          path={APP_ROUTES.stations}
          element={<Require privileges={[PRIVILEGES.stationsView]}><StationsPage /></Require>}
        />
        <Route
          path={APP_ROUTES.station()}
          element={<Require privileges={[PRIVILEGES.stationsView]}><StationDetailPage /></Require>}
        />

        <Route
          path={APP_ROUTES.connectors}
          element={<Require privileges={[PRIVILEGES.stationsView]}><ConnectorsPage /></Require>}
        />

        <Route
          path={APP_ROUTES.hardware}
          element={<Require privileges={[PRIVILEGES.catalogueView]}><HardwareProfilesPage /></Require>}
        />
        <Route
          path={APP_ROUTES.hardwareProfile()}
          element={<Require privileges={[PRIVILEGES.catalogueView]}><HardwareProfileDetailPage /></Require>}
        />

        <Route
          path={APP_ROUTES.tariffs}
          element={<Require privileges={[PRIVILEGES.tariffsView]}><TariffsPage /></Require>}
        />
        <Route
          path={APP_ROUTES.tariff()}
          element={<Require privileges={[PRIVILEGES.tariffsView]}><TariffDetailPage /></Require>}
        />
        <Route
          path={APP_ROUTES.payment}
          element={<Require privileges={[PRIVILEGES.paymentsManage]}><PaymentPolicyPage /></Require>}
        />

        <Route
          path={APP_ROUTES.ocpp}
          element={<Require privileges={[PRIVILEGES.ocppView]}><OcppLayout /></Require>}
        >
          <Route index element={<Navigate to={APP_ROUTES.ocppMonitor} replace />} />
          <Route path="monitor" element={<OcppMonitorPage />} />
          <Route path="commands" element={<OcppCommandsPage />} />
          <Route path="configuration" element={<OcppConfigurationPage />} />
          <Route path="smart-charging" element={<OcppSmartChargingPage />} />
          <Route path="firmware" element={<OcppFirmwarePage />} />
          <Route path="diagnostics" element={<OcppDiagnosticsPage />} />
        </Route>
      </Route>

      {/* The foundation's catalogue stays mounted — it is how the next screen
          is checked against what already exists. */}
      <Route path="/design-system" element={<DesignSystemPage />} />

      <Route path="/" element={<Navigate to={APP_ROUTES.dashboard} replace />} />
      <Route path="*" element={<Navigate to={APP_ROUTES.dashboard} replace />} />
    </Routes>
  );
}
