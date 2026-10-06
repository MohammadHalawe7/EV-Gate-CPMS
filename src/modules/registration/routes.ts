/* Registration route paths. Imported by the router and by any screen that
 * links into the module, so a path is written once. */
export const REGISTRATION_ROUTES = {
  login: '/login',
  forgotPassword: '/forgot-password',
  requestDemo: '/request-demo',
  register: '/register',
  submitted: '/register/submitted',
  status: '/registration-status',
  /* Reserved for the authenticated side, wired when the Companies module lands. */
  internalNew: '/registrations/new',
  queue: '/registrations',
} as const;

export type RegistrationRoute = (typeof REGISTRATION_ROUTES)[keyof typeof REGISTRATION_ROUTES];
