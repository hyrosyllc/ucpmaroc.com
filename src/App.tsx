import React, { useEffect, Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import emailjs from "@emailjs/browser";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "./supabaseClient";
import { Toaster } from "sonner";
// --- LAYOUTS & COMPONENTS ---
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import AdminDashboardLayout from "./layouts/AdminDashboardLayout"; // 🚀 1. NEW IMPORT
// --- LAZY LOADED PORTFOLIO ARCHITECTURE ---
const PortfolioLayout = lazy(() => import("./layouts/PortfolioLayout"));
const PortfolioHome = lazy(() => import("./pages/PortfolioHome"));
const DynamicPage = lazy(() => import("./pages/DynamicPage"));

// --- LAZY LOADED MAIN PAGES ---
const HomePage = lazy(() => import("./pages/HomePage"));

// --- STANDARD IMPORTS ---
import BuilderPreview from "./pages/dashboard/BuilderPreview";
import PortfolioPage from "./pages/PortfolioPage";
import PrivacyPolicyPage from "./components/PrivacyPolicy.tsx";
import ContactUsPage from "./pages/ContactUsPage";
import TermsofService from "./components/TermsofService.tsx";
import TermsandConditions from "./components/TermsandConditions.tsx";
import VoiceOverLandingPage from "./pages/VoiceOverLandingPage";
import ActorProfilePage from "./pages/ActorProfilePage";
import ActorDashboardPage from "./pages/ActorDashboardPage";
import ClientOrderPage from "./pages/ClientOrderPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ClientAuthPage from "./pages/ClientAuthPage";
import ClientDashboardPage from "./pages/ClientDashboardPage";
import ActorLoginPage from "./pages/ActorLoginPage";
import ActorSignUpPage from "./pages/ActorSignUpPage";
import MyShortlistPage from "./pages/MyShortlistPage";
import AdminOrderDetailPage from "./pages/AdminOrderDetailPage";
import AdminActorListPage from "./pages/AdminActorListPage";
import AdminClientListPage from "./pages/AdminClientListPage";
import CreateProfilePromptPage from "./pages/CreateProfilePromptPage";
import FavoriteActorsPage from "./pages/FavoriteActorsPage";
import MessagesPage from "./pages/MessagesPage";

// --- DASHBOARD IMPORTS ---
import ActorDashboardLayout from "./layouts/ActorDashboardLayout";
import DashboardOrders from "./pages/dashboard/DashboardOrders";
import DashboardProfile from "./pages/dashboard/DashboardProfile";
import DashboardServices from "./pages/dashboard/DashboardServices";
import DashboardDemos from "./pages/dashboard/DashboardDemos";
import DashboardLibrary from "./pages/dashboard/DashboardLibrary";
import ActorEarningsPage from "./pages/dashboard/ActorEarningsPage";
import AdminPayoutsPage from "./pages/AdminPayoutsPage";
import ActorPayoutSettingsPage from "./pages/dashboard/ActorPayoutSettingsPage";
import PortfolioBuilderPage from "./pages/dashboard/PortfolioBuilderPage.tsx";
import AdminDomainListPage from "./pages/AdminDomainListPage";
import DomainMarketplace from "./pages/marketplace/DomainMarketplace";
import DomainCheckout from "./pages/marketplace/DomainCheckout";
import DomainThankYouPage from "./pages/marketplace/DomainThankYouPage";
import AdminDomainOrderDetailPage from "./pages/AdminDomainOrderDetailPage";
import DomainOrderPage from "./pages/marketplace/DomainOrderPage";
import AnalyticsPage from "./pages/dashboard/AnalyticsPage.tsx";
import OrdersPage from "./pages/dashboard/OrdersPage.tsx";
import LeadsPage from "./pages/dashboard/LeadsPage.tsx";
import SettingsPage from "./pages/dashboard/SettingsPage";
import ProductsPage from "./pages/dashboard/ProductsPage";
import CollectionsPage from "./pages/dashboard/CollectionsPage";
import ShippingRatesPage from "./pages/dashboard/ShippingRatesPage";
import CouponsPage from "./pages/dashboard/CouponsPage";
import MarketsPage from "./pages/dashboard/MarketsPage";
import FormsPage from "./pages/dashboard/FormsPage";

// --- E-COMMERCE PUBLIC PAGES ---
import PublicProductPage from "./pages/PublicProductPage";
import PublicShopPage from "./pages/PublicShopPage.tsx";
import PaymentsPage from "./pages/dashboard/PaymentsPage.tsx";
import PublicCheckoutPage from "./pages/PublicCheckoutPage.tsx";
import CheckoutLayout from "./themes/modern/CheckoutLayout.tsx";
import PublicThankYouPage from "./pages/PublicThankYouPage.tsx";
import ThankYouLayout from "./themes/modern/ThankYouLayout.tsx";
import StripeCallbackPage from "./pages/dashboard/StripeCallbackPage.tsx";
import ThemeStudioPage from "./pages/dashboard/ThemeStudioPage.tsx";
import DeveloperHubPage from "./pages/dashboard/DeveloperHubPage.tsx";
import { AdminChatSheet } from "./components/dashboard/AdminChatSheet.tsx";
import AdminThemesPage from "./pages/dashboard/AdminThemesPage.tsx";
import StudioPreview from "./pages/dashboard/StudioPreview.tsx";

// Define main domains globally
const MAIN_DOMAINS = [
  "ucpmaroc.com",
  "www.ucpmaroc.com",
  "localhost",
  "127.0.0.1",
  "symmetrical-acorn-697wxxq4r74j3jpj-5173.app.github.dev",
];

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
});

// --- MAIN WRAPPER LAYOUT COMPONENT ---
const Layout = ({
  children,
  isCustomDomain,
}: {
  children: React.ReactNode;
  isCustomDomain: boolean;
}) => {
  const location = useLocation();

  const hideFooterPaths = [
    "/dashboard",
    "/messages",
    "/client-dashboard",
    "/admin",
    "/pro",
    "/builder-preview",
    "/studio-preview",
  ];
  const hideNavbarPaths = ["/pro", "/builder-preview","/studio-preview", "/dashboard", "/admin"]; // 🚀 2. ADDED /admin TO HIDE MAIN NAVBAR

  const shouldHideFooter =
    isCustomDomain ||
    hideFooterPaths.some((path) => location.pathname.startsWith(path));
  const shouldHideNavbar =
    isCustomDomain ||
    hideNavbarPaths.some((path) => location.pathname.startsWith(path));

  return (
    <>
      {!shouldHideNavbar && <Navbar />}
      <main className={`flex-grow ${shouldHideNavbar ? "" : "pt-0"}`}>
        {children}
      </main>
      {!shouldHideFooter && <Footer />}
    </>
  );
};

function App() {
  useEffect(() => {
    emailjs.init("LOZrhOD88Fa4aQQlz");
  }, []);

  const currentHostname = window.location.hostname;
  const isCustomDomain = !MAIN_DOMAINS.some((domain) =>
    currentHostname.includes(domain)
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ScrollToTop />
        <main className="flex-grow">
          <Layout isCustomDomain={isCustomDomain}>
            <Suspense
              fallback={
                <div className="h-screen flex items-center justify-center bg-background">
                  <Loader2 className="animate-spin w-10 h-10 text-primary" />
                </div>
              }
            >
              <Routes>
                {/* 🚀 ROUTE SPLIT A: CUSTOM DOMAIN VISITORS */}
                {isCustomDomain ? (
                  <Route
                    path="/"
                    element={<PortfolioLayout customDomain={currentHostname} />}
                  >
                    <Route index element={<PortfolioHome />} />
                    <Route path="shop" element={<PublicShopPage />} />
                    <Route
                      path="product/:productSlug"
                      element={<PublicProductPage />}
                    />
                    <Route path="checkout" element={<CheckoutLayout />}>
                      <Route index element={<PublicCheckoutPage />} />
                    </Route>
                    <Route path="thank-you" element={<ThankYouLayout />}>
                      <Route index element={<PublicThankYouPage />} />
                    </Route>
                    <Route path=":pageSlug" element={<DynamicPage />} />
                  </Route>
                ) : (
                  /* 🚀 ROUTE SPLIT B: MAIN PLATFORM VISITORS */
                  <>
                    <Route path="/" element={<HomePage />} />
                    <Route
                      path="/my-favorites"
                      element={<FavoriteActorsPage />}
                    />
                    <Route
                      path="/Voiceover"
                      element={<VoiceOverLandingPage />}
                    />
                    <Route path="/portfolio" element={<PortfolioPage />} />
                    <Route
                      path="/privacy-policy"
                      element={<PrivacyPolicyPage />}
                    />
                    <Route
                      path="/terms-of-service"
                      element={<TermsofService />}
                    />
                    <Route
                      path="/terms-of-conditions"
                      element={<TermsandConditions />}
                    />
                    <Route path="/contact" element={<ContactUsPage />} />

                    <Route path="/pro/:slug" element={<PortfolioLayout />}>
                      <Route index element={<PortfolioHome />} />
                      <Route path="shop" element={<PublicShopPage />} />
                      <Route
                        path="product/:productSlug"
                        element={<PublicProductPage />}
                      />
                      <Route path="checkout" element={<CheckoutLayout />}>
                        <Route index element={<PublicCheckoutPage />} />
                      </Route>
                      <Route path="thank-you" element={<ThankYouLayout />}>
                        <Route index element={<PublicThankYouPage />} />
                      </Route>
                      <Route path=":pageSlug" element={<DynamicPage />} />
                    </Route>

                    <Route
                      path="/dashboard/payments/callback"
                      element={<StripeCallbackPage />}
                    />
                    <Route
                      path="/actor/:actorName"
                      element={<ActorProfilePage />}
                    />
                    <Route path="/actor-login" element={<ActorLoginPage />} />
                    <Route path="/actor-signup" element={<ActorSignUpPage />} />
                    <Route
                      path="/create-profile"
                      element={<CreateProfilePromptPage />}
                    />

                    <Route path="/client-auth" element={<ClientAuthPage />} />
                    <Route
                      path="/client-dashboard"
                      element={<ClientDashboardPage />}
                    />
                    <Route
                      path="/order/:orderId"
                      element={<ClientOrderPage />}
                    />
                    <Route path="/my-shortlist" element={<MyShortlistPage />} />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route
                      path="/messages/:conversationId"
                      element={<MessagesPage />}
                    />
                    <Route
                      path="/builder-preview"
                      element={<BuilderPreview />}
                    />
                    <Route path="/studio-preview" element={<StudioPreview />} />

                    {/* ACTOR DASHBOARD */}
                    <Route path="/dashboard" element={<ActorDashboardLayout />}>
                      <Route index element={<AnalyticsPage />} />
                      <Route path="profile" element={<DashboardProfile />} />
                      <Route path="messages" element={<MessagesPage />} />
                      <Route
                        path="messages/:conversationId"
                        element={<MessagesPage />}
                      />
                      <Route path="services" element={<DashboardServices />} />

                      <Route path="demos" element={<DashboardDemos />} />
                      <Route path="library" element={<DashboardLibrary />} />
                      <Route path="earnings" element={<ActorEarningsPage />} />
                      <Route
                        path="payout-settings"
                        element={<ActorPayoutSettingsPage />}
                      />
                      <Route
                        path="Portfolio"
                        element={<PortfolioBuilderPage />}
                      />
                      <Route path="job-orders" element={<DashboardOrders />} />

                      <Route path="Orders" element={<OrdersPage />} />
                      <Route path="leads" element={<LeadsPage />} />
                      <Route path="settings" element={<SettingsPage />} />
                      <Route path="products" element={<ProductsPage />} />
                      <Route path="collections" element={<CollectionsPage />} />
                      <Route path="shipping" element={<ShippingRatesPage />} />
                      <Route path="coupons" element={<CouponsPage />} />
                      <Route path="forms" element={<FormsPage />} />
                      <Route path="markets" element={<MarketsPage />} />
                      <Route path="payments" element={<PaymentsPage />} />
                      <Route path="studio" element={<ThemeStudioPage />} />
                      <Route
                        path="creator-hub"
                        element={<DeveloperHubPage />}
                      />
                    </Route>

                    {/* 🚀 3. THE NEW ADMIN DASHBOARD ROUTING */}
                    <Route
                      element={<ProtectedRoute allowedRoles={["admin"]} />}
                    >
                      <Route path="/admin" element={<AdminDashboardLayout />}>
                        <Route index element={<AdminDashboardPage />} />
                        <Route
                          path="order/:orderId"
                          element={<AdminOrderDetailPage />}
                        />
                        <Route path="actors" element={<AdminActorListPage />} />
                        <Route
                          path="clients"
                          element={<AdminClientListPage />}
                        />
                        <Route
                          path="domains"
                          element={<AdminDomainListPage />}
                        />
                        <Route
                          path="domains/order/:id"
                          element={<AdminDomainOrderDetailPage />}
                        />
                                                <Route
                          path="themes"
                          element={<AdminThemesPage />}
                        />

                        <Route path="payouts" element={<AdminPayoutsPage />} />
                      </Route>
                    </Route>

                    {/* MARKETPLACE ROUTES */}
                    <Route
                      path="/marketplace/domains"
                      element={<DomainMarketplace />}
                    />
                    <Route
                      path="/marketplace/domains/:id/checkout"
                      element={<DomainCheckout />}
                    />
                    <Route
                      path="/marketplace/order/:id/thank-you"
                      element={<DomainThankYouPage />}
                    />
                    <Route
                      path="/marketplace/order/:id/status"
                      element={<DomainOrderPage />}
                    />
                  </>
                )}
              </Routes>
            </Suspense>
          </Layout>
        </main>
        <AdminChatSheet />
        <Toaster theme="dark" position="bottom-right" />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
