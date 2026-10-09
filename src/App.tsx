import { BrowserRouter } from 'react-router-dom';
import { I18nProvider } from '@/i18n';
import { ToastProvider } from '@/components/ui/Toast';
import { SessionProvider } from '@/app/session';
import { AppRoutes } from '@/app/routes';

/**
 * EV Gate CPMS.
 *
 * Built on the EV Gate Design System foundation — see CLAUDE.md. The providers
 * are the foundation's plus the product's session; the routes are the
 * product's. `/design-system` stays mounted deliberately.
 */
export function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <SessionProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </SessionProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}
