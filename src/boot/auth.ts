import { boot } from 'quasar/wrappers';
import { useUserStore } from 'src/stores/user.store';

export default boot(({ router, store }) => {
  // Use the Pinia store instance provided by Quasar
  const userStore = useUserStore(store);

  // Note: Depending on when initialize() is called, you might want to call it here
  // to ensure state is loaded from localStorage before the first route evaluation.
  userStore.initialize();

  router.beforeEach((to, from, next) => {
    // Check if route requires authentication
    const requiresAuth = to.meta.requiresAuth;

    // Check if the user is authenticated
    const isAuthenticated = userStore.isLoggedIn;

    if (requiresAuth && !isAuthenticated) {
      // User is not authenticated, redirect to login page
      next({ name: 'login', query: { redirect: to.fullPath } });
    } else if (requiresAuth && isAuthenticated) {
      // Route requires auth and user is logged in
      const allowedRoles = to.meta.roles;
      const userRole = userStore.userRole;

      if (allowedRoles && userRole) {
        // Check if the user's role is included in the allowed roles for this route
        if (allowedRoles.includes(userRole)) {
          next(); // Authorized
        } else {
          // Unauthorized, redirect to home or an unauthorized page
          // Currently redirecting to home page
          next('/');
        }
      } else {
        // No specific roles required or user has no role, proceed
        next();
      }
    } else {
      // Public route, proceed
      // Optional: Prevent logged in users from visiting login/register
      if (isAuthenticated && (to.name === 'login' || to.name === 'register')) {
        next('/');
      } else {
        next();
      }
    }
  });
});
