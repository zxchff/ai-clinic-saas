import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login", // If they aren't logged in, send them here
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    // Also protect the API routes for dashboard actions if we add them later
  ],
};
