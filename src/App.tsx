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
// --- LAYOUT IMPORTS ---
import AdminDashboardLayout from "./layouts/AdminDashboardLayout";
import ActorDashboardLayout from "./layouts/ActorDashboardLayout";
// --- LAZY LOADED PORTFOLIO ARCHITECTURE ---
const PortfolioLayout = lazy(() => import("@/features/portfolio-builder/layouts/PortfolioLayout"));
const PortfolioHome = lazy(() => import("@/features/portfolio-builder/pages/PortfolioHome"));
const DynamicPage = lazy(() => import("@/features/portfolio-builder/pages/DynamicPage"));

// --- LAZY LOADED MAIN PAGES ---
const HomePage = lazy(() => import("./pages/HomePage"));

// --- STANDARD IMPORTS ---
import PrivacyPolicyPage from "./components/PrivacyPolicy.tsx";
import ContactUsPage from "./pages/ContactUsPage";
import TermsofService from "./components/TermsofService.tsx";
import TermsandConditions from "./components/TermsandConditions.tsx";
import VoiceOverLandingPage from "./pages/VoiceOverLandingPage";
import {
  AdminDashboardPage,
  AdminOrderDetailPage,
  AdminActorListPage,
  AdminClientListPage,
  AdminThemesPage,
  AdminPayoutsPage,
  AdminDomainListPage,
  AdminDomainOrderDetailPage
} from "@/features/admin-core";

// --- DASHBOARD IMPORTS ---
import {
  ActorDashboardPage,
  ActorProfilePage,
  FavoriteActorsPage,
  DashboardLibrary,
  DashboardDemos,
  DashboardOrders,
  ActorEarningsPage,
  ActorPayoutSettingsPage,
  MyShortlistPage,
  DashboardProfile,
  DashboardServices,
  ClientDashboardPage,
  ClientOrderPage,
  PortfolioPage,
} from "@/features/talent-marketplace";
import { ActorLoginPage, ActorSignUpPage, ClientAuthPage, CreateProfilePromptPage } from "@/features/auth";
import { MessagesPage, AdminChatSheet } from "@/features/messaging";
import {
  DomainMarketplace,
  DomainCheckout,
  DomainThankYouPage,
  DomainOrderPage,
} from "@/features/domain-marketplace";
import {
  AnalyticsPage,
  OrdersPage,
  LeadsPage,
  FormsPage,
  ProOrderDetailPage,
  PaymentsPage,
  StripeCallbackPage,
} from "@/features/ecommerce";
import { SettingsPage } from "@/features/portfolio-builder";
const CustomersPage = lazy(() => import("@/features/ecommerce/pages/CustomersPage"));
const ReviewsPage = lazy(() => import("@/features/ecommerce/pages/ReviewsPage.tsx"));
const CustomerLoginPage = lazy(() => import("@/features/ecommerce/pages/CustomerLoginPage"));
const CustomerDashboardLayout = lazy(() => import("@/layouts/CustomerDashboardLayout"));
const CustomerDashboardOverview = lazy(() => import("@/features/ecommerce/pages/CustomerDashboardOverview"));
const CustomerOrdersPage = lazy(() => import("@/features/ecommerce/pages/CustomerOrdersPage"));
const CustomerOrderDetailPage = lazy(() => import("@/features/ecommerce/pages/CustomerOrderDetailPage"));
const CustomerMessagesPage = lazy(() => import("@/features/ecommerce/pages/CustomerMessagesPage"));

// --- E-COMMERCE PUBLIC PAGES ---
import {
  ProductsPage,
  CollectionsPage,
  ShippingRatesPage,
  CouponsPage,
  MarketsPage,
  PublicShopPage,
  PublicProductPage,
  PublicCheckoutPage,
  PublicThankYouPage,
} from "@/features/ecommerce";
import CheckoutLayout from "./themes/modern/CheckoutLayout.tsx";
import ThankYouLayout from "./themes/modern/ThankYouLayout.tsx";
import {
  BuilderPreview,
  PortfolioBuilderPage
} from "@/features/portfolio-builder";
import {
  ThemeStudioPage,
  DeveloperHubPage,
  StudioPreview
} from "@/features/theme-studio";

// Define main domains globally
const MAIN_DOMAINS = [
  "ucpmaroc.com",
  "www.ucpmaroc.com",
  "localhost",
  "127.0.0.1",
  "symmetrical-acorn-697wxxq4r74j3jpj-5173.app.github.dev",
    "psychic-cod-r74vrp5xx9gq2ppr7-5173.app.github.dev",
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
                    <Route path="login" element={<CustomerLoginPage />} />
                    <Route path="dashboard" element={<CustomerDashboardLayout />}>
                      <Route index element={<CustomerDashboardOverview />} />
                      <Route path="orders" element={<CustomerOrdersPage />} />
                      <Route path="orders/:id" element={<CustomerOrderDetailPage />} />
                      <Route path="messages" element={<CustomerMessagesPage />} />
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
                      <Route path="login" element={<CustomerLoginPage />} />
                      <Route path="dashboard" element={<CustomerDashboardLayout />}>
                        <Route index element={<CustomerDashboardOverview />} />
                        <Route path="orders" element={<CustomerOrdersPage />} />
                        <Route path="orders/:id" element={<CustomerOrderDetailPage />} />
                        <Route path="messages" element={<CustomerMessagesPage />} />
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

                      <Route path="orders" element={<OrdersPage />} />
                      <Route path="orders/:id" element={<ProOrderDetailPage />} />
                      <Route path="leads" element={<LeadsPage />} />
                      <Route path="settings" element={<SettingsPage />} />
                      <Route path="products" element={<ProductsPage />} />
                      <Route path="collections" element={<CollectionsPage />} />
                      <Route path="shipping" element={<ShippingRatesPage />} />
                      <Route path="coupons" element={<CouponsPage />} />
                      <Route path="forms" element={<FormsPage />} />
                      <Route path="markets" element={<MarketsPage />} />
                      <Route path="payments" element={<PaymentsPage />} />
                      <Route path="customers" element={<CustomersPage />} />
                      <Route path="reviews" element={<ReviewsPage />} />
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
