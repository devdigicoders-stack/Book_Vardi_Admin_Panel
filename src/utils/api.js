const SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_BASE_URL = `${SERVER_URL}/admin`;

export function resolveImageUrl(url) {
  if (!url) return '';
  if (typeof url === 'object') {
    url = url.url || url.dataUrl || url.src || '';
  }
  if (typeof url !== 'string' || !url.trim()) return '';
  const cleanUrl = url.trim();
  if (/^https?:\/\//i.test(cleanUrl) || cleanUrl.startsWith('data:') || cleanUrl.startsWith('blob:')) return cleanUrl;
  const backendHost = SERVER_URL.replace(/\/api\/?$/, '');
  const cleanPath = cleanUrl.startsWith('/') ? cleanUrl : `/${cleanUrl}`;
  return `${backendHost}${cleanPath}`;
}

export function parseSizeVariants(product) {
  if (!product) return [];
  let raw = product.sizeVariants ?? product.variants ?? product.size_variants ?? product.sizes;
  let parsed = [];

  if (raw) {
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch {
        if (raw.includes(',')) {
          raw = raw.split(',').map(s => s.trim()).filter(Boolean);
        } else if (raw.trim()) {
          raw = [raw.trim()];
        } else {
          raw = [];
        }
      }
    }

    if (Array.isArray(raw)) {
      parsed = raw.map((v, idx) => {
        if (typeof v === 'string') {
          return {
            id: `var_${idx}_${v}`,
            size: v,
            measureScale: 'size',
            measureValue: v,
            price: Number(product?.price || 0),
            mrp: Number(product?.mrp || product?.originalPrice || 0),
            stock: Number(product?.stockQuantity ?? product?.stock ?? 0),
            stockQuantity: Number(product?.stockQuantity ?? product?.stock ?? 0),
            sku: product?.sku ? `${product.sku}-${v}` : `SKU-${idx + 1}`,
            image: product?.image || (Array.isArray(product?.images) ? product.images[0] : '') || '',
            images: Array.isArray(product?.images) && product.images.length > 0 ? product.images : (product?.image ? [product.image] : [])
          };
        }

        if (typeof v === 'object' && v !== null) {
          const rawImage = v.image || v.imageUrl || v.photo || v.url || (Array.isArray(v.images) && v.images[0]) || product?.image || (Array.isArray(product?.images) && product.images[0]) || '';
          let rawImages = Array.isArray(v.images) && v.images.length > 0 ? v.images : (rawImage ? [rawImage] : []);
          if (typeof rawImages === 'string') {
            try { rawImages = JSON.parse(rawImages); } catch { rawImages = [rawImages]; }
          }

          const sizeVal = String(v.size || v.measureValue || v.name || v.label || v.title || `Variant #${idx + 1}`);
          const priceVal = (v.price !== undefined && v.price !== null && !isNaN(Number(v.price)) && Number(v.price) >= 0)
            ? Number(v.price)
            : Number(product?.price || 0);

          const rawMrp = v.mrp ?? v.originalPrice ?? v.regularPrice ?? v.marketPrice;
          const mrpVal = (rawMrp !== undefined && rawMrp !== null && !isNaN(Number(rawMrp)) && Number(rawMrp) >= 0)
            ? Number(rawMrp)
            : (priceVal > 0 ? Math.round(priceVal * 1.25) : Number(product?.mrp || product?.originalPrice || 0));

          const stockVal = v.stock !== undefined ? Number(v.stock) : (v.stockQuantity !== undefined ? Number(v.stockQuantity) : Number(product?.stockQuantity ?? product?.stock ?? 0));

          return {
            ...v,
            id: v.id || v._id || `var_${idx}_${sizeVal}`,
            size: sizeVal,
            measureValue: sizeVal,
            measureScale: v.measureScale || v.scale || v.scaleUnit || 'size',
            price: priceVal,
            mrp: mrpVal,
            originalPrice: mrpVal,
            stock: stockVal,
            stockQuantity: stockVal,
            sku: v.sku || (product?.sku ? `${product.sku}-${sizeVal}` : `SKU-VAR-${idx + 1}`),
            image: rawImage,
            images: rawImages
          };
        }

        return null;
      }).filter(Boolean);
    }
  }

  // Prepend Base Product if product has variants and base price > 0, and base variant is not already present
  if (parsed.length > 0 && Number(product?.price || 0) > 0) {
    const hasBaseVariant = parsed.some(v => v.isBase || String(v.size || '').toLowerCase().includes('base'));
    if (!hasBaseVariant) {
      const baseMrp = Number(product.mrp || product.originalPrice || product.regularPrice || product.price || 0);
      const baseOption = {
        id: `base_option_${product._id || product.id || '0'}`,
        size: 'Base Product',
        measureScale: product.unit || 'unit',
        measureValue: 'Base Product',
        price: Number(product.price || 0),
        mrp: baseMrp > Number(product.price || 0) ? baseMrp : Number(product.price || 0),
        originalPrice: baseMrp > Number(product.price || 0) ? baseMrp : Number(product.price || 0),
        stock: Number(product.stockQuantity ?? product.stock ?? 0),
        stockQuantity: Number(product.stockQuantity ?? product.stock ?? 0),
        sku: product.sku || `SKU-BASE-${String(product._id || product.id || '').slice(-6).toUpperCase()}`,
        image: product.image || product.imageUrl || (Array.isArray(product.images) ? product.images[0] : '') || '',
        images: Array.isArray(product.images) && product.images.length > 0 ? product.images : (product.image ? [product.image] : []),
        isBase: true
      };
      parsed = [baseOption, ...parsed];
    }
  }

  return parsed;
}

// Helper to get auth headers with token injection
const getAuthHeaders = () => {
  const token = localStorage.getItem('bv_admin_jwt_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

// ==========================================
// 1. Admin Auth API
// ==========================================
export const loginAdminApi = async (emailOrPhone, password) => {
  try {
    const payload = typeof emailOrPhone === 'object' 
      ? emailOrPhone 
      : { email: emailOrPhone, password };

    const res = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('bv_admin_jwt_token', data.token);
    }
    return data;
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ==========================================
// 2. Dashboard & Analytics APIs
// ==========================================
export const fetchAdminDashboardStatsApi = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (error) {
    return null;
  }
};

export const fetchAdminChartDataApi = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/chart-data`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (error) {
    return null;
  }
};

export const fetchAdminRecentActivitiesApi = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/recent-activities`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (error) {
    return null;
  }
};

// ==========================================
// 3. Products Catalog & Approvals APIs (RESTful)
// ==========================================
export const fetchAdminProductsApi = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/products${query ? `?${query}` : ''}`;
    const res = await fetch(url, {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => null);
    console.warn('fetchAdminProductsApi error response:', errData);
    return null;
  } catch (error) {
    console.error('fetchAdminProductsApi request failed:', error);
    return null;
  }
};

export const fetchAdminProductByIdApi = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (error) {
    console.error(`fetchAdminProductByIdApi failed for ${id}:`, error);
    return null;
  }
};

export const updateProductApprovalApi = async (id, status, remark = '') => {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${id}/approval`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, remark })
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const createAdminProductApi = async (productData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateAdminProductApi = async (id, productData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteAdminProductApi = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ==========================================
// 4. Inventory & Stock Management APIs (RESTful)
// ==========================================
export const fetchAdminInventoryApi = async (params = {}) => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/inventory${query ? `?${query}` : ''}`;
    const res = await fetch(url, {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json().catch(() => null);
    console.warn('fetchAdminInventoryApi error response:', errData);
    return null;
  } catch (error) {
    console.error('fetchAdminInventoryApi request failed:', error);
    return null;
  }
};

export const updateAdminInventoryStockApi = async (id, payload) => {
  try {
    const bodyData = typeof payload === 'number' ? { stock: payload } : (payload || {});
    const res = await fetch(`${API_BASE_URL}/inventory/${id}/stock`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(bodyData)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const quickRestockAdminInventoryApi = async (productId, quantity = 50, variantSize = null) => {
  try {
    const res = await fetch(`${API_BASE_URL}/inventory/quick-restock`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ productId, quantity, variantSize })
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ==========================================
// 4. Sellers Verification & Commission APIs
// ==========================================
export const fetchAdminSellersApi = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/sellers`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    return data.sellers || data;
  } catch (error) {
    return null;
  }
};

export const approveSellerApi = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/sellers/${id}/approve`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const rejectSellerApi = async (id, reason = '') => {
  try {
    const res = await fetch(`${API_BASE_URL}/sellers/${id}/reject`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const setPendingSellerApi = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/sellers/${id}/pending`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateSellerCommissionApi = async (id, rate) => {
  try {
    const res = await fetch(`${API_BASE_URL}/sellers/${id}/commission`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ commissionRate: rate })
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const toggleSellerStatusApi = async (id, status, reason = '') => {
  try {
    const res = await fetch(`${API_BASE_URL}/sellers/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, reason, rejectionReason: reason })
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ==========================================
// 5. Orders & Fulfillment APIs
// ==========================================
export const fetchAdminOrdersApi = async () => {
  try {
    const res = await fetch(`${SERVER_URL}/orders/admin/all`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (error) {
    return null;
  }
};

export const updateOrderStatusApi = async (id, status) => {
  try {
    const res = await fetch(`${SERVER_URL}/orders/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const cancelOrderAdminApi = async (id, reason = '') => {
  try {
    const res = await fetch(`${SERVER_URL}/orders/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: 'Cancelled', cancellationReason: reason })
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ==========================================
// 6. Schools & Geo Discovery APIs
// ==========================================
export const fetchAdminSchoolsApi = async () => {
  try {
    const res = await fetch(`${SERVER_URL}/schools`);
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    return data.schools || data;
  } catch (error) {
    return null;
  }
};

export const createSchoolApi = async (schoolData) => {
  try {
    const res = await fetch(`${SERVER_URL}/schools`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(schoolData)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateSchoolApi = async (id, schoolData) => {
  try {
    const res = await fetch(`${SERVER_URL}/schools/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(schoolData)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteSchoolApi = async (id) => {
  try {
    const res = await fetch(`${SERVER_URL}/schools/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateSchoolRadiusApi = async (radiusKm) => {
  try {
    const res = await fetch(`${API_BASE_URL}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ schoolRadiusKm: radiusKm })
    });
    const data = await res.json();
    localStorage.setItem('bv_school_radius_km', JSON.stringify(radiusKm));
    return data;
  } catch (error) {
    localStorage.setItem('bv_school_radius_km', JSON.stringify(radiusKm));
    return { success: true, radiusKm };
  }
};

// ==========================================
// 7. Users Accounts APIs
// ==========================================
export const fetchAdminUsersApi = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/users`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (error) {
    return null;
  }
};

export const createUserApi = async (userData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateUserApi = async (id, updates) => {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteUserApi = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ==========================================
// 8. Financial Payouts APIs
// ==========================================
export const fetchAdminPayoutsApi = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/payouts`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (error) {
    return null;
  }
};

export const processPayoutApi = async (id, status, note = '') => {
  try {
    const res = await fetch(`${API_BASE_URL}/payouts/${id}/process`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action: status === 'approve' || status === 'processed' ? 'approve' : 'reject', transactionReference: note, rejectionReason: note })
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ==========================================
// 9. Promotions & Marketing APIs
// ==========================================
export const fetchAdminPromotionsApi = async () => {
  try {
    const res = await fetch(`${SERVER_URL}/coupons`);
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (error) {
    return null;
  }
};

export const createPromotionApi = async (promo) => {
  try {
    const res = await fetch(`${SERVER_URL}/coupons`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(promo)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deletePromotionApi = async (id) => {
  try {
    const res = await fetch(`${SERVER_URL}/coupons/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Top Announcement Bar APIs
export const fetchAnnouncementsApi = async () => {
  try {
    const res = await fetch(`${SERVER_URL}/announcements`);
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    return data.announcements || data;
  } catch (error) {
    return null;
  }
};

export const createAnnouncementApi = async (data) => {
  try {
    const res = await fetch(`${SERVER_URL}/announcements`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateAnnouncementApi = async (id, data) => {
  try {
    const res = await fetch(`${SERVER_URL}/announcements/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const toggleAnnouncementStatusApi = async (id, isActive) => {
  try {
    const res = await fetch(`${SERVER_URL}/announcements/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isActive })
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteAnnouncementApi = async (id) => {
  try {
    const res = await fetch(`${SERVER_URL}/announcements/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ==========================================
// 10. Customer Reviews Moderation APIs
// ==========================================
export const fetchAdminReviewsApi = async () => {
  try {
    const res = await fetch(`${SERVER_URL}/reviews`);
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (error) {
    return null;
  }
};

export const moderateReviewApi = async (id, status) => {
  try {
    const res = await fetch(`${SERVER_URL}/reviews/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteAdminReviewApi = async (id) => {
  try {
    const res = await fetch(`${SERVER_URL}/reviews/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ==========================================
// 11. Platform Settings APIs
// ==========================================
export const fetchAdminSettingsApi = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/settings`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('API Error');
    return await res.json();
  } catch (error) {
    const saved = localStorage.getItem('admin_settings');
    return saved ? JSON.parse(saved) : null;
  }
};

export const updateSettingsApi = async (settings) => {
  try {
    const res = await fetch(`${API_BASE_URL}/settings`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    const data = await res.json();
    localStorage.setItem('admin_settings', JSON.stringify(settings));
    return data;
  } catch (error) {
    localStorage.setItem('admin_settings', JSON.stringify(settings));
    return { success: true, settings };
  }
};

// ==========================================
// 12. Sub-Admin RBAC Team APIs
// ==========================================
export const fetchSubadminsApi = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/subadmins`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch subadmins');
    return await res.json();
  } catch (error) {
    return null;
  }
};

export const createSubadminApi = async (subadminData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/subadmins`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(subadminData)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateSubadminApi = async (id, updates) => {
  try {
    const res = await fetch(`${API_BASE_URL}/subadmins/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteSubadminApi = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/subadmins/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ==========================================
// 13. School Bulk Orders & Distribution APIs
// ==========================================
export const fetchAdminSchoolBulkOrdersApi = async () => {
  try {
    const res = await fetch(`${SERVER_URL}/schools/bulk-orders/list`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch bulk orders');
    const data = await res.json();
    return data.orders || data;
  } catch (error) {
    console.error('fetchAdminSchoolBulkOrdersApi error:', error);
    return null;
  }
};

export const distributeSchoolBulkOrderApi = async (id, payload) => {
  try {
    const res = await fetch(`${SERVER_URL}/schools/bulk-orders/${id}/distribute`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const approveSellerQuotationApi = async (id, quoteId) => {
  try {
    const res = await fetch(`${SERVER_URL}/schools/bulk-orders/${id}/approve-quote`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ quoteId })
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: error.message };
  }
};

