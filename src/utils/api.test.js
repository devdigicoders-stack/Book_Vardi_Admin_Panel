// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loginAdminApi,
  fetchAdminDashboardStatsApi,
  fetchAdminProductsApi,
  createAdminProductApi,
  updateAdminProductApi,
  updateProductApprovalApi,
  deleteAdminProductApi,
  fetchAdminSellersApi,
  approveSellerApi,
  rejectSellerApi,
  updateSellerCommissionApi,
  fetchAdminOrdersApi,
  updateOrderStatusApi,
  createSchoolApi,
  updateSchoolRadiusApi,
  fetchAdminUsersApi,
  createUserApi,
  updateUserApi,
  processPayoutApi
} from './api';

describe('Admin Panel API Client Utility', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('stores token on successful admin login', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, token: 'mock-jwt-token-123', admin: { email: 'admin@bookvardi.in' } })
    });

    const res = await loginAdminApi('admin@bookvardi.in', 'password123');
    expect(res.token).toBe('mock-jwt-token-123');
    expect(localStorage.getItem('bv_admin_jwt_token')).toBe('mock-jwt-token-123');
  });

  it('fetches admin dashboard stats with authorization header', async () => {
    localStorage.setItem('bv_admin_jwt_token', 'token-abc-99');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, totalRevenue: 150000, activeSellersCount: 42 })
    });

    const data = await fetchAdminDashboardStatsApi();
    expect(data.totalRevenue).toBe(150000);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/admin/dashboard/stats',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token-abc-99'
        })
      })
    );
  });

  it('handles product approval API invocation cleanly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, product: { id: 'P-101', status: 'Approved' } })
    });

    const res = await updateProductApprovalApi('P-101', 'Approved', 'Quality verified');
    expect(res.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/admin/products/P-101/approval',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ status: 'Approved', remark: 'Quality verified' })
      })
    );
  });

  it('handles seller approval and rejection API calls', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'Seller KYC approved' })
    });

    const resApprove = await approveSellerApi('SEL-202');
    expect(resApprove.success).toBe(true);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'Seller rejected' })
    });

    const resReject = await rejectSellerApi('SEL-202', 'Invalid GSTIN');
    expect(resReject.success).toBe(true);
  });

  it('updates school radius and saves to localStorage fallback', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, radiusKm: 30 })
    });

    const res = await updateSchoolRadiusApi(30);
    expect(res.radiusKm).toBe(30);
    expect(localStorage.getItem('bv_school_radius_km')).toBe('30');
  });

  it('processes seller payout requests cleanly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, status: 'Approved' })
    });

    const res = await processPayoutApi('SEL-101', 'approve', 'TXN-9988');
    expect(res.success).toBe(true);
  });

  it('creates admin product with sizeVariants via createAdminProductApi', async () => {
    const mockProductPayload = {
      name: 'Oxford Uniform Shirt',
      category: 'uniforms',
      price: 450,
      sizeVariants: [
        { size: 'M', price: 450, mrp: 599, stock: 25, image: 'https://example.com/m.jpg' },
        { size: 'L', price: 480, mrp: 620, stock: 30, image: 'https://example.com/l.jpg' }
      ]
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, product: { _id: 'prod-999', ...mockProductPayload } })
    });

    const res = await createAdminProductApi(mockProductPayload);
    expect(res.success).toBe(true);
    expect(res.product._id).toBe('prod-999');
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/admin/products',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(mockProductPayload)
      })
    );
  });

  it('updates admin product with sizeVariants via updateAdminProductApi', async () => {
    const updatePayload = {
      price: 499,
      sizeVariants: [
        { size: 'XL', price: 520, mrp: 650, stock: 15, image: 'https://example.com/xl.jpg' }
      ]
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, product: { _id: 'prod-999', ...updatePayload } })
    });

    const res = await updateAdminProductApi('prod-999', updatePayload);
    expect(res.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/admin/products/prod-999',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(updatePayload)
      })
    );
  });
});
