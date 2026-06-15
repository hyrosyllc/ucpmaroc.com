/**
 * Domain Marketplace Service
 * Handles all Supabase queries for domain marketplace feature
 */

import { supabase } from '@/supabaseClient';
import { Domain, DomainOrder } from '../types/domain';

/**
 * Fetch all domains with optional filters
 */
export const fetchDomains = async (filters?: {
  status?: 'available' | 'sold' | 'rented';
  search?: string;
}) => {
  let query = supabase
    .from('store_domains')
    .select('*')
    .order('status', { ascending: true })
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching domains:', error);
    return [];
  }

  // Client-side search if needed
  if (filters?.search) {
    return data.filter(d =>
      d.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
      d.category?.toLowerCase().includes(filters.search!.toLowerCase())
    );
  }

  return data as Domain[];
};

/**
 * Fetch single domain by ID
 */
export const fetchDomainById = async (id: string): Promise<Domain | null> => {
  const { data, error } = await supabase
    .from('store_domains')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching domain:', error);
    return null;
  }

  return data as Domain;
};

/**
 * Fetch all domains with their associated orders
 */
export const fetchDomainsWithOrders = async () => {
  const { data, error } = await supabase
    .from('store_domains')
    .select(`
      *,
      store_orders (
        id,
        buyer_name,
        payment_status,
        created_at
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching domains with orders:', error);
    return [];
  }

  return data;
};

/**
 * Create new domain order
 */
export const createDomainOrder = async (orderData: Partial<DomainOrder>) => {
  const { data, error } = await supabase
    .from('store_orders')
    .insert([orderData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as DomainOrder;
};

/**
 * Fetch order by ID
 */
export const fetchOrderById = async (id: string): Promise<DomainOrder | null> => {
  const { data, error } = await supabase
    .from('store_orders')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching order:', error);
    return null;
  }

  return data as DomainOrder;
};

/**
 * Fetch order with domain details
 */
export const fetchOrderWithDomain = async (id: string) => {
  const { data, error } = await supabase
    .from('store_orders')
    .select('*, store_domains(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching order with domain:', error);
    return null;
  }

  return data;
};

/**
 * Update order signature
 */
export const updateOrderSignature = async (orderId: string, signatureUrl: string) => {
  const { error } = await supabase
    .from('store_orders')
    .update({ signature_url: signatureUrl })
    .eq('id', orderId);

  if (error) {
    throw error;
  }
};

/**
 * Update order nameservers
 */
export const updateOrderNameservers = async (
  orderId: string,
  nameservers: { ns1: string; ns2: string }
) => {
  const { error } = await supabase
    .from('store_orders')
    .update({ nameservers })
    .eq('id', orderId);

  if (error) {
    throw error;
  }
};

/**
 * Create new domain (admin only)
 */
export const createDomain = async (domainData: Partial<Domain>) => {
  const { error } = await supabase
    .from('store_domains')
    .insert([domainData]);

  if (error) {
    throw error;
  }
};

/**
 * Delete domain (admin only)
 */
export const deleteDomain = async (id: string) => {
  const { error } = await supabase
    .from('store_domains')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
};
