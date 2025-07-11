import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  // This function is called ONLY WHEN the user is authenticated.
  function middleware(req) {
    // If the authenticated user tries to access the login page,
    // redirect them to the admin dashboard.
    if (req.nextUrl.pathname === "/admin/login") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    // Otherwise, let them proceed.
    return NextResponse.next();
  },
  {
    callbacks: {
      // This callback determines if the user is authorized to access a page.
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // If the user is trying to access the login page, let them.
        // This is necessary to prevent a redirect loop.
        if (pathname.startsWith("/admin/login")) {
          return true;
        }

        // For any other page under /admin/, a token must exist.
        // If token is null, this returns false, and next-auth will
        // automatically redirect to the `signIn` page defined below.
        return token != null;
      },
    },
    pages: {
      // This is the page to redirect to if the `authorized` callback returns false.
      signIn: "/admin/login",
    },
  }
);

export const config = {
  // This matcher ensures the middleware runs on all admin routes.
  matcher: ["/admin/:path*"],
};
