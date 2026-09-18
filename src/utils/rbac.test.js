// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchSubadminsApi,
  createSubadminApi,
  updateSubadminApi,
  deleteSubadminApi
} from './api';

describe('Admin Sub-Admin RBAC Utilities & API Client', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('fetches subadmins list from /api/admin/subadmins', async () => {
    localStorage.setItem('bv_admin_jwt_token', 'test-token');
    const mockData = {
      success: true,
      subadmins: [
        {
          _id: 'sub-1',
          name: 'Priya Staff',
          email: 'priya@bookvardi.in',
          role: 'subadmin',
          permissions: { products: 'editor', orders: 'viewer' },
          status: 'active'
        }
      ]
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData
    });

    const res = await fetchSubadminsApi();
    expect(res.subadmins.length).toBe(1);
    expect(res.subadmins[0].name).toBe('Priya Staff');
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/admin/subadmins',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token'
        })
      })
    );
  });

  it('creates a new subadmin account with granular tab permissions', async () => {
    localStorage.setItem('bv_admin_jwt_token', 'super-admin-token');
    const payload = {
      name: 'Rohan Sharma',
      email: 'rohan@bookvardi.in',
      password: 'password123',
      role: 'subadmin',
      status: 'active',
      permissions: {
        products: 'editor',
        inventory: 'editor',
        orders: 'viewer',
        finance: 'none'
      }
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        subadmin: { ...payload, _id: 'sub-2' }
      })
    });

    const res = await createSubadminApi(payload);
    expect(res.success).toBe(true);
    expect(res.subadmin._id).toBe('sub-2');
    expect(res.subadmin.permissions.finance).toBe('none');
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/admin/subadmins',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload)
      })
    );
  });

  it('updates subadmin permissions and status', async () => {
    localStorage.setItem('bv_admin_jwt_token', 'super-admin-token');
    const updates = {
      status: 'suspended',
      permissions: { products: 'viewer', orders: 'none' }
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        subadmin: { _id: 'sub-1', name: 'Priya Staff', ...updates }
      })
    });

    const res = await updateSubadminApi('sub-1', updates);
    expect(res.success).toBe(true);
    expect(res.subadmin.status).toBe('suspended');
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/admin/subadmins/sub-1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(updates)
      })
    );
  });

  it('deletes subadmin account', async () => {
    localStorage.setItem('bv_admin_jwt_token', 'super-admin-token');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Subadmin deleted successfully'
      })
    });

    const res = await deleteSubadminApi('sub-99');
    expect(res.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/admin/subadmins/sub-99',
      expect.objectContaining({
        method: 'DELETE'
      })
    );
  });
});
