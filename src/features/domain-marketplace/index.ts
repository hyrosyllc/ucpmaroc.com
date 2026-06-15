/**
 * Domain Marketplace Feature - Barrel Export
 * Export all public components, pages, types, and services from this feature
 */

// Pages
export { default as DomainMarketplace } from './pages/DomainMarketplace';
export { default as DomainCheckout } from './pages/DomainCheckout';
export { default as DomainThankYouPage } from './pages/DomainThankYouPage';
export { default as DomainOrderPage } from './pages/DomainOrderPage';

// Components
export { ContractDocument } from './components/ContractPDF';
export { default as PaymentModal } from './components/PaymentModal';

// Types
export type { Domain, DomainOrder, PriceData, PaymentModalProps } from './types/domain';

// Services
export * from './services/domainService';
