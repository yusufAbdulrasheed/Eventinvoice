import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Footer from "./Footer";

const TITLES = [
  { match: /^\/dashboard/, title: "Dashboard" },
  { match: /^\/inventory/, title: "Inventory" },
  { match: /^\/invoices/, title: "Invoices" },
  { match: /^\/clients/, title: "Clients" },
  { match: /^\/reports/, title: "Reports" },
];

function pageTitle(pathname) {
  const found = TITLES.find((t) => t.match.test(pathname));
  return found ? found.title : "Generous Event";
}

export default function Layout() {
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  // Close the mobile drawer whenever the route changes
  useEffect(() => setNavOpen(false), [location.pathname]);

  // Lock background scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = navOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [navOpen]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={pageTitle(location.pathname)} onMenuClick={() => setNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-margin-mobile md:p-margin-desktop flex flex-col">
          <div className="max-w-container-max mx-auto w-full flex-1">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
