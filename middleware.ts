import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isPublicAuthPage = createRouteMatcher([
  "/",
  "/signin",
]);

const isProtectedRoute = createRouteMatcher([
  "/dashboard",
  "/inspector",
  "/server",
  "/admin",        // ✅ ADD THIS
]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const isAuthenticated = await convexAuth.isAuthenticated();

  // Logged-in users should NEVER see landing or signin
  if (isPublicAuthPage(request) && isAuthenticated) {
    return nextjsMiddlewareRedirect(request, "/dashboard");
  }

  // Logged-out users cannot access protected routes
  if (isProtectedRoute(request) && !isAuthenticated) {
    return nextjsMiddlewareRedirect(request, "/");
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
