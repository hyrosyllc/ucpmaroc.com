/**
 * Talent Marketplace Feature - Barrel Export
 */

export {
  MARKETPLACE_SERVICE_CATALOG,
  getMarketplaceAllowedServiceIds,
  setMarketplaceAllowedServiceIds,
  resetMarketplaceAllowedServiceIds,
  getMarketplaceServiceDefinitions,
  getServiceLabel,
  getServiceIcon,
} from './serviceCatalog';

// Components
export { default as ActorCard } from './components/ActorCard';
export type { Actor } from './components/ActorCard';
export { default as TalentCard } from './components/TalentCard';
export { default as ServiceOfferCard } from './components/ServiceOfferCard';
export { default as QuoteCalculatorModal } from './components/QuoteCalculatorModal';
export { default as OrderDetailsModal } from './components/OrderDetailsModal';
export { default as RecordingModal } from './components/RecordingModal';

// Pages
export { default as ActorDashboardPage } from './pages/ActorDashboardPage';
export { default as ActorProfilePage } from './pages/ActorProfilePage';
export { default as FavoriteActorsPage } from './pages/FavoriteActorsPage';
export { default as DashboardLibrary } from './pages/DashboardLibrary';
export { default as DashboardDemos } from './pages/DashboardDemos';
export { default as MyShortlistPage } from './pages/MyShortlistPage';
export { default as DashboardProfile } from './pages/DashboardProfile';
export { default as DashboardServices } from './pages/DashboardServices';
export { default as ClientDashboardPage } from './pages/ClientDashboardPage';
export { default as PortfolioPage } from './pages/PortfolioPage';

// Gigs (Orders)
export { default as DashboardOrders } from './pages/DashboardOrders';
export { default as ClientOrderPage } from './pages/ClientOrderPage';

// Payouts
export { default as ActorEarningsPage } from './payouts/pages/ActorEarningsPage';
export { default as ActorPayoutSettingsPage } from './payouts/pages/ActorPayoutSettingsPage';

// Admin