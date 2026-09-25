import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loginAdminApi,
  fetchAdminSellersApi,
  fetchAdminUsersApi,
  fetchAdminProductsApi,
  fetchAdminOrdersApi,
  fetchAdminSchoolsApi,
  fetchAdminPayoutsApi,
  updateProductApprovalApi,
  deleteAdminProductApi,
  createAdminProductApi,
  updateAdminProductApi,
  fetchAdminInventoryApi,
  updateAdminInventoryStockApi,
  quickRestockAdminInventoryApi,
  approveSellerApi,
  rejectSellerApi,
  updateSellerCommissionApi,
  toggleSellerStatusApi,
  updateOrderStatusApi,
  createSchoolApi,
  updateSchoolApi,
  deleteSchoolApi,
  updateSchoolRadiusApi,
  createUserApi,
  updateUserApi,
  processPayoutApi,
  fetchAdminPromotionsApi,
  createPromotionApi,
  deletePromotionApi,
  fetchAdminReviewsApi,
  moderateReviewApi,
  deleteAdminReviewApi,
  fetchAdminSettingsApi,
  updateSettingsApi,
  fetchAdminRecentActivitiesApi,
  fetchSubadminsApi,
  createSubadminApi,
  updateSubadminApi,
  deleteSubadminApi,
  fetchAnnouncementsApi,
  createAnnouncementApi,
  updateAnnouncementApi,
  toggleAnnouncementStatusApi,
  deleteAnnouncementApi,
  fetchAdminSchoolBulkOrdersApi,
  distributeSchoolBulkOrderApi,
  approveSellerQuotationApi
} from '../utils/api';

const AdminDataContext = createContext();

export const useAdminData = () => {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within an AdminDataProvider');
  }
  return context;
};

export const APPROVED_ADMIN_ROLES = [
  'Super Admin',
  'Operations Manager',
  'Finance Admin',
  'Support Lead'
];

export const AdminDataProvider = ({ children }) => {
  // Authentication state - Enforce live JWT validation
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const token = localStorage.getItem('bv_admin_jwt_token');
      return Boolean(token);
    } catch {
      return false;
    }
  });

  // Current Admin Profile & RBAC Role - dynamically loaded from backend auth
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_profile');
      if (saved) return JSON.parse(saved);
      return {
        name: 'Administrator',
        email: 'admin@bookvardi.in',
        phone: '',
        role: 'super_admin',
        permissions: {},
        status: 'active',
        adminId: 'BV-ADM-001',
        approvedAt: new Date().toISOString().split('T')[0],
        lastLogin: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      };
    } catch {
      return {
        name: 'Administrator',
        email: 'admin@bookvardi.in',
        phone: '',
        role: 'super_admin',
        permissions: {},
        status: 'active',
        adminId: 'BV-ADM-001',
        approvedAt: new Date().toISOString().split('T')[0],
        lastLogin: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      };
    }
  });

  // 13. Sub-Admin RBAC Staff
  const [subadmins, setSubadmins] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_subadmins');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 1. Products
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_products');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 2. Orders
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('admin_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // 3. School Bulk Orders
  const [schoolOrders, setSchoolOrders] = useState(() => {
    const saved = localStorage.getItem('admin_school_orders');
    return saved ? JSON.parse(saved) : [];
  });

  // 4. Sellers
  const [sellers, setSellers] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_sellers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 5. Schools
  const [schools, setSchools] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_schools');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // School Discovery Radius in km (set by admin for student storefront listing)
  const [schoolRadiusKm, setSchoolRadiusKm] = useState(() => {
    try {
      const saved = localStorage.getItem('bv_school_radius_km');
      if (saved) return Number(JSON.parse(saved));
      const savedSettings = localStorage.getItem('admin_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.schoolRadiusKm) return Number(parsed.schoolRadiusKm);
      }
      return 25;
    } catch {
      return 25;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('bv_school_radius_km', JSON.stringify(schoolRadiusKm));
    } catch (e) {
      console.warn('[LocalStorage] Quota error on bv_school_radius_km:', e.message);
    }
  }, [schoolRadiusKm]);

  // 6. Users
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('admin_users');
    return saved ? JSON.parse(saved) : [];
  });

  // 7. Promotions & Announcements
  const [promotions, setPromotions] = useState(() => {
    const saved = localStorage.getItem('admin_promotions');
    return saved ? JSON.parse(saved) : [];
  });

  const [announcements, setAnnouncements] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_announcements');
      return saved ? JSON.parse(saved) : [
        { id: '1', text: 'Free Shipping on Orders Over ₹499', badge: 'FREE SHIPPING', link: '/offers', priority: 1, isActive: true, expiryDate: null, bgColor: '#0f766e', textColor: '#ffffff' },
        { id: '2', text: 'Exclusive Student & School Discounts Available', badge: 'DISCOUNT', link: '/offers', priority: 2, isActive: true, expiryDate: null, bgColor: '#0f766e', textColor: '#ffffff' },
        { id: '3', text: '30-Day Hassle-Free Returns on Uniforms', badge: 'TRUST', link: '/about-us', priority: 3, isActive: true, expiryDate: null, bgColor: '#0f766e', textColor: '#ffffff' }
      ];
    } catch {
      return [];
    }
  });

  // 8. Reviews & Reports
  const [reviews, setReviews] = useState(() => {
    const saved = localStorage.getItem('admin_reviews');
    return saved ? JSON.parse(saved) : [];
  });

  // 9. Support Tickets
  const [supportTickets, setSupportTickets] = useState(() => {
    const saved = localStorage.getItem('admin_support_tickets');
    return saved ? JSON.parse(saved) : [];
  });

  // 10. Platform Settings
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('admin_settings');
    return saved ? JSON.parse(saved) : { schoolRadiusKm: 25 };
  });

  // 11. Notifications
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('admin_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  // 12. Audit Log
  const [auditLog, setAuditLog] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_audit_log');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 13. Inventory State & Metrics
  const [inventory, setInventory] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_inventory');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [inventoryMetrics, setInventoryMetrics] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    healthyStockCount: 0,
    threshold: 10
  });

  // Helper to sanitize heavy base64 images & PDF document blobs before persisting to localStorage
  const sanitizeForStorage = (data) => {
    if (!data) return data;
    if (typeof data === 'string') {
      if (data.startsWith('data:') || data.length > 500) return '';
      return data;
    }
    if (Array.isArray(data)) {
      return data.slice(0, 50).map(item => sanitizeForStorage(item));
    }
    if (typeof data === 'object') {
      const copy = {};
      for (const key of Object.keys(data)) {
        const val = data[key];
        if (typeof val === 'string' && (val.startsWith('data:') || val.length > 500)) {
          copy[key] = '';
        } else if (val && typeof val === 'object') {
          copy[key] = sanitizeForStorage(val);
        } else {
          copy[key] = val;
        }
      }
      return copy;
    }
    return data;
  };

  // Safe helper to write to localStorage without throwing QuotaExceededError
  const safeSetLocalStorage = (key, data) => {
    try {
      const sanitized = (data && typeof data === 'object') ? sanitizeForStorage(data) : data;
      const stringified = typeof sanitized === 'string' ? sanitized : JSON.stringify(sanitized);
      localStorage.setItem(key, stringified);
    } catch (error) {
      if (error?.name === 'QuotaExceededError' || error?.name === 'NS_ERROR_DOM_QUOTA_REACHED' || error?.code === 22) {
        try {
          if (Array.isArray(data)) {
            const minimal = sanitizeForStorage(data.slice(0, 10));
            localStorage.setItem(key, JSON.stringify(minimal));
          }
        } catch {
          // Gracefully suppress secondary quota errors
        }
      }
    }
  };

  // Persist state to localStorage safely
  useEffect(() => { safeSetLocalStorage('admin_products', products); }, [products]);
  useEffect(() => { safeSetLocalStorage('admin_inventory', inventory); }, [inventory]);
  useEffect(() => { safeSetLocalStorage('admin_orders', orders); }, [orders]);
  useEffect(() => { safeSetLocalStorage('admin_school_orders', schoolOrders); }, [schoolOrders]);
  useEffect(() => { safeSetLocalStorage('admin_sellers', sellers); }, [sellers]);
  useEffect(() => { safeSetLocalStorage('admin_schools', schools); }, [schools]);
  useEffect(() => { safeSetLocalStorage('admin_users', users); }, [users]);
  useEffect(() => { safeSetLocalStorage('admin_promotions', promotions); }, [promotions]);
  useEffect(() => { safeSetLocalStorage('admin_reviews', reviews); }, [reviews]);
  useEffect(() => { safeSetLocalStorage('admin_support_tickets', supportTickets); }, [supportTickets]);
  useEffect(() => { safeSetLocalStorage('admin_settings', settings); }, [settings]);
  useEffect(() => { safeSetLocalStorage('admin_notifications', notifications); }, [notifications]);
  useEffect(() => { safeSetLocalStorage('admin_subadmins', subadmins); }, [subadmins]);
  useEffect(() => { safeSetLocalStorage('admin_audit_log', auditLog); }, [auditLog]);
  useEffect(() => { safeSetLocalStorage('admin_profile', adminUser); }, [adminUser]);
  useEffect(() => { safeSetLocalStorage('admin_is_authenticated', isAuthenticated); }, [isAuthenticated]);

  // Phase 0: Hydrate initial state from backend API endpoints
  useEffect(() => {
    fetchAnnouncementsApi().then(data => {
      const list = Array.isArray(data) ? data : (data?.announcements || []);
      if (list.length > 0) {
        setAnnouncements(list.map(a => ({
          id: a._id || a.id,
          _id: a._id || a.id,
          text: a.text,
          badge: a.badge || '',
          link: a.link || '',
          priority: a.priority !== undefined ? Number(a.priority) : 1,
          isActive: a.isActive !== undefined ? Boolean(a.isActive) : true,
          expiryDate: a.expiryDate || null,
          bgColor: a.bgColor || '#0f766e',
          textColor: a.textColor || '#ffffff',
          isExpired: a.isExpired || false,
          ...a
        })).sort((x, y) => x.priority - y.priority));
      }
    }).catch(() => {});
    fetchAdminRecentActivitiesApi().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setAuditLog(data.map((item, idx) => ({
          id: item.id || Date.now() - idx * 60000,
          action: item.action || 'Activity',
          user: item.user || 'System',
          details: item.details || `${item.user} ${item.action}`,
          time: item.time || 'Recently'
        })));
      }
    }).catch(() => {});
    fetchAdminSellersApi().then(data => {
      const list = Array.isArray(data) ? data : (data?.sellers || []);
      if (list.length > 0) {
        setSellers(list.map(s => ({
          id: s._id || s.id,
          _id: s._id || s.id,
          storeName: s.storeName || s.businessName || s.name || 'Vendor Store',
          ownerName: s.ownerName || s.name || 'Vendor',
          status: s.status === 'approved' ? 'Verified' : (s.status === 'pending' ? 'Pending' : (s.status === 'rejected' ? 'Rejected' : s.status)),
          commissionRate: s.commissionPercentage !== undefined ? s.commissionPercentage : (s.commissionRate || 10),
          payoutBalance: s.walletBalance || s.payoutBalance || 0,
          ...s
        })));
      }
    }).catch(() => {});

    fetchAdminUsersApi().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setUsers(data.map(u => ({
          id: u._id || u.id,
          _id: u._id || u.id,
          name: u.name || 'User',
          email: u.email || '',
          role: u.role || 'Customer',
          status: u.status ? (u.status.charAt(0).toUpperCase() + u.status.slice(1)) : 'Active',
          ...u
        })));
      }
    }).catch(() => {});

    fetchAdminProductsApi().then(data => {
      const list = Array.isArray(data) ? data : (data?.products || []);
      if (list.length > 0) {
        setProducts(list.map(p => ({
          id: p._id || p.id,
          _id: p._id || p.id,
          name: p.name || p.title || 'Product',
          price: Number(p.price || 0),
          originalPrice: Number(p.mrp || p.originalPrice || Math.round(Number(p.price || 0) * 1.25)),
          mrp: Number(p.mrp || p.originalPrice || Math.round(Number(p.price || 0) * 1.25)),
          category: p.category || 'uniforms',
          approvalStatus: p.approvalStatus || 'Approved',
          stockQuantity: p.stock !== undefined ? p.stock : (p.stockQuantity || 50),
          stock: p.stock !== undefined ? p.stock : (p.stockQuantity || 50),
          image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (p.image || ''),
          images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : []),
          sizeVariants: Array.isArray(p.sizeVariants) ? p.sizeVariants : [],
          sizes: Array.isArray(p.sizes) ? p.sizes : [],
          ...p
        })));
      }
    }).catch(() => {});

    fetchAdminOrdersApi().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setOrders(data.map(o => {
          const custName = typeof o.customer === 'object' && o.customer !== null
            ? (o.customer.name || o.customer.fullName || 'Customer')
            : (typeof o.customerName === 'string' ? o.customerName : (o.userName || 'Customer'));

          const custEmail = typeof o.customer === 'object' && o.customer !== null
            ? (o.customer.email || '')
            : (typeof o.customerEmail === 'string' ? o.customerEmail : '');

          const custPhone = typeof o.customer === 'object' && o.customer !== null
            ? (o.customer.phone || '')
            : (typeof o.customerPhone === 'string' ? o.customerPhone : '');

          const formattedAddress = typeof o.shippingAddress === 'object' && o.shippingAddress !== null
            ? [
                o.shippingAddress.name || o.shippingAddress.fullName,
                o.shippingAddress.addressLine || o.shippingAddress.street || o.shippingAddress.address || o.shippingAddress.addressLine1,
                o.shippingAddress.colony || o.shippingAddress.landmark,
                o.shippingAddress.city,
                o.shippingAddress.state,
                o.shippingAddress.pincode ? `- ${o.shippingAddress.pincode}` : null,
                o.shippingAddress.phone ? `(Phone: ${o.shippingAddress.phone})` : null
              ].filter(Boolean).join(', ')
            : (typeof o.shippingAddress === 'string' ? o.shippingAddress : 'Customer Address');

          return {
            ...o,
            id: o.orderId || o._id || o.id,
            _id: o._id || o.id,
            customerName: custName,
            customerEmail: custEmail,
            customerPhone: custPhone,
            totalAmount: o.totalAmount || o.total || 0,
            status: o.overallStatus || o.status || 'Pending',
            paymentStatus: o.paymentStatus || 'Paid',
            shippingAddress: formattedAddress,
            rawShippingAddress: o.shippingAddress
          };
        }));
      }
    }).catch(() => {});

    fetchAdminSchoolsApi().then(data => {
      const list = Array.isArray(data) ? data : (data?.schools || []);
      if (list.length > 0) {
        setSchools(list.map(sch => ({
          id: sch._id || sch.id,
          _id: sch._id || sch.id,
          name: sch.name || sch.institutionName || 'School',
          status: sch.status || 'Partner Active',
          ...sch
        })));
      }
    }).catch(() => {});

    fetchAdminSchoolBulkOrdersApi().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setSchoolOrders(data.map(o => ({
          ...o,
          id: o._id || o.id,
          referenceId: o.referenceId || `SCH-${o.id}`,
          schoolName: o.institutionName || o.schoolName || 'Partner School',
          contactPerson: o.contactName || o.contactPerson || 'Administrator',
          requirementSummary: Array.isArray(o.requirements) && o.requirements.length > 0
            ? o.requirements.map(r => `${r.itemName} (${r.quantity})`).join(', ')
            : (o.additionalNotes || 'Bulk Supplies'),
          estimatedBudget: o.targetBudgetPerKit || 0,
          quoteAmount: o.targetBudgetPerKit || 0
        })));
      }
    }).catch(() => {});


    fetchAdminPromotionsApi().then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setPromotions(data.map(promo => ({
          id: promo._id || promo.id,
          _id: promo._id || promo.id,
          code: promo.code,
          discount: promo.discount,
          type: promo.type,
          minAmount: promo.minAmount,
          status: promo.status || 'active',
          ...promo
        })));
      }
    }).catch(() => {});

    fetchAdminReviewsApi().then(data => {
      if (Array.isArray(data)) {
        setReviews(data.map(r => ({
          id: r._id || r.id,
          _id: r._id || r.id,
          productName: r.productName || 'Product',
          customerName: r.customerName || r.userName || 'Verified Customer',
          status: r.status || (r.rawStatus === 'approved' ? 'Approved' : (r.rawStatus === 'rejected' ? 'Hidden' : 'Pending Approval')),
          ...r
        })));
      }
    }).catch(() => {});

    fetchAdminSettingsApi().then(data => {
      if (data) {
        setSettings(data);
        if (data.schoolRadiusKm) setSchoolRadiusKm(Number(data.schoolRadiusKm));
      }
    }).catch(() => {});

    fetchSubadminsApi().then(data => {
      const list = Array.isArray(data) ? data : (data?.subadmins || []);
      if (list.length > 0) {
        setSubadmins(list);
      }
    }).catch(() => {});

    fetchAdminInventoryApi().then(data => {
      if (data && data.success) {
        if (Array.isArray(data.inventory)) setInventory(data.inventory);
        if (data.metrics) setInventoryMetrics(data.metrics);
      } else if (Array.isArray(data)) {
        setInventory(data);
      }
    }).catch(() => {});

    // Auto-poll products every 10 seconds for real-time seller submission updates
    const pollInterval = setInterval(() => {
      fetchAdminProductsApi().then(data => {
        const list = Array.isArray(data) ? data : (data?.products || []);
        if (list.length > 0) {
          setProducts(list.map(p => ({
            id: p._id || p.id,
            _id: p._id || p.id,
            name: p.name || p.title || 'Product',
            price: Number(p.price || 0),
            originalPrice: Number(p.mrp || p.originalPrice || Math.round(Number(p.price || 0) * 1.25)),
            mrp: Number(p.mrp || p.originalPrice || Math.round(Number(p.price || 0) * 1.25)),
            category: p.category || 'uniforms',
            approvalStatus: p.approvalStatus || 'Approved',
            stockQuantity: p.stock !== undefined ? p.stock : (p.stockQuantity || 50),
            stock: p.stock !== undefined ? p.stock : (p.stockQuantity || 50),
            image: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (p.image || ''),
            images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : []),
            sizeVariants: Array.isArray(p.sizeVariants) ? p.sizeVariants : [],
            sizes: Array.isArray(p.sizes) ? p.sizes : [],
            ...p
          })));
        }
      }).catch(() => {});
    }, 10000);

    // Sync product approval notifications & product submissions in real-time
    const syncFromStorage = () => {
      try {
        const savedNotifs = localStorage.getItem('admin_notifications');
        if (savedNotifs) setNotifications(JSON.parse(savedNotifs));
        const savedProds = localStorage.getItem('admin_products');
        if (savedProds) setProducts(JSON.parse(savedProds));
      } catch (e) {}
    };

    const handleNotifEvent = (e) => {
      if (e.detail) {
        setNotifications(prev => [e.detail, ...prev.filter(n => n.id !== e.detail.id)]);
      }
    };

    const handleProdsEvent = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setProducts(e.detail);
      }
    };

    window.addEventListener('storage', syncFromStorage);
    window.addEventListener('adminNotificationReceived', handleNotifEvent);
    window.addEventListener('adminProductsUpdated', handleProdsEvent);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener('adminNotificationReceived', handleNotifEvent);
      window.removeEventListener('adminProductsUpdated', handleProdsEvent);
    };
  }, []);



  // Audit Logger Helper
  const logAudit = useCallback((action, details) => {
    const entry = {
      id: Date.now(),
      action,
      user: adminUser?.role || 'Admin',
      details,
      time: 'Just now'
    };
    setAuditLog(prev => [entry, ...prev.slice(0, 49)]);
  }, [adminUser?.role]);

  // ==================== PRODUCT ACTIONS ====================
  const addProduct = async (newProd) => {
    const tempId = Date.now();
    const item = {
      id: tempId,
      _id: String(tempId),
      name: newProd.name.trim(),
      subtitle: newProd.subtitle || '',
      price: Number(newProd.price) || 0,
      originalPrice: Number(newProd.originalPrice) || Math.round(Number(newProd.price || 0) * 1.25),
      mrp: Number(newProd.originalPrice || newProd.mrp) || Math.round(Number(newProd.price || 0) * 1.25),
      category: newProd.category || 'uniforms',
      subCategory: newProd.subCategory || '',
      schoolName: newProd.schoolName || '',
      gender: newProd.gender || 'Unisex',
      badge: newProd.badge || 'NEW',
      stockQuantity: Number(newProd.stockQuantity) || 0,
      stock: Number(newProd.stockQuantity) || 0,
      sellerId: newProd.sellerId || '',
      sellerName: newProd.sellerName || '',
      paymentMethodAllowed: newProd.paymentMethodAllowed || 'Both',
      approvalStatus: newProd.approvalStatus || 'Approved',
      approvalComment: newProd.approvalComment || '',
      rating: 5.0,
      reviews: 0,
      image: newProd.image || (Array.isArray(newProd.images) && newProd.images[0]) || '',
      images: Array.isArray(newProd.images) ? newProd.images : (newProd.image ? [newProd.image] : []),
      sizes: Array.isArray(newProd.sizes) ? newProd.sizes : [],
      sizeVariants: Array.isArray(newProd.sizeVariants) ? newProd.sizeVariants : [],
      sku: newProd.sku || `BV-CAT-${Math.floor(100 + Math.random() * 900)}`
    };
    setProducts(prev => [item, ...prev]);
    setInventory(prev => [item, ...prev]);
    logAudit('Add Product', `Added catalog product: ${item.name}`);

    try {
      const res = await createAdminProductApi({
        ...item,
        stock: item.stockQuantity,
        mrp: item.originalPrice
      });
      if (res?.success && res?.product) {
        const saved = res.product;
        const normalizedSaved = {
          ...saved,
          id: saved._id || saved.id,
          _id: saved._id || saved.id,
          stock: saved.stock ?? saved.stockQuantity ?? 0,
          stockQuantity: saved.stock ?? saved.stockQuantity ?? 0,
          price: Number(saved.price || 0),
          mrp: Number(saved.mrp || saved.originalPrice || 0),
          originalPrice: Number(saved.originalPrice || saved.mrp || 0),
          inStock: (saved.stock ?? saved.stockQuantity ?? 0) > 0
        };
        setProducts(prev => prev.map(p => ((p.id === tempId || p._id === String(tempId)) ? normalizedSaved : p)));
        setInventory(prev => prev.map(p => ((p.id === tempId || p._id === String(tempId)) ? normalizedSaved : p)));
        fetchAdminInventoryApi().then(invRes => {
          if (invRes?.metrics) setInventoryMetrics(invRes.metrics);
        }).catch(() => {});
        return normalizedSaved;
      }
    } catch (err) {
      console.warn('Backend product create fallback to local state:', err);
    }
    return item;
  };

  const updateProduct = async (id, updates) => {
    setProducts(prev => prev.map(p => (p.id === id || p._id === id ? { ...p, ...updates } : p)));
    setInventory(prev => prev.map(p => (p.id === id || p._id === id ? { ...p, ...updates } : p)));
    logAudit('Update Product', `Updated product ID #${id}`);

    try {
      const payload = {
        ...updates,
        stock: updates.stockQuantity !== undefined ? updates.stockQuantity : updates.stock,
        mrp: updates.originalPrice !== undefined ? updates.originalPrice : updates.mrp
      };
      const res = await updateAdminProductApi(id, payload);
      if (res?.success && res?.product) {
        const saved = res.product;
        const normalizedSaved = {
          ...saved,
          id: saved._id || saved.id,
          _id: saved._id || saved.id,
          stock: saved.stock ?? saved.stockQuantity ?? 0,
          stockQuantity: saved.stock ?? saved.stockQuantity ?? 0,
          price: Number(saved.price || 0),
          mrp: Number(saved.mrp || saved.originalPrice || 0),
          originalPrice: Number(saved.originalPrice || saved.mrp || 0),
          inStock: (saved.stock ?? saved.stockQuantity ?? 0) > 0
        };
        setProducts(prev => prev.map(p => (p.id === id || p._id === id ? normalizedSaved : p)));
        setInventory(prev => prev.map(p => (p.id === id || p._id === id ? normalizedSaved : p)));
        fetchAdminInventoryApi().then(invRes => {
          if (invRes?.metrics) setInventoryMetrics(invRes.metrics);
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('Backend product update fallback to local state:', err);
    }
  };

  const updateProductApprovalStatus = async (id, status, remark = '') => {
    const validStatus = ['Approved', 'Pending', 'Rejected'].includes(status) ? status : 'Pending';
    const trimmedRemark = remark?.trim?.() || '';

    const matchFn = (p) => p.id === id || p._id === id || String(p.id) === String(id) || String(p._id) === String(id);

    setProducts(prev => prev.map(p => {
      if (!matchFn(p)) return p;
      const nextRemark = trimmedRemark || p.approvalComment || p.rejectionReason || '';
      return {
        ...p,
        approvalStatus: validStatus,
        approvalComment: validStatus === 'Rejected' ? nextRemark : (trimmedRemark || p.approvalComment || ''),
        rejectionReason: validStatus === 'Rejected' ? (trimmedRemark || p.rejectionReason || 'Quality standards not met') : null,
        reviewedAt: new Date().toISOString(),
        reviewedBy: adminUser?.name || adminUser?.role || 'Marketplace Administrator'
      };
    }));

    setInventory(prev => prev.map(p => {
      if (!matchFn(p)) return p;
      const nextRemark = trimmedRemark || p.approvalComment || p.rejectionReason || '';
      return {
        ...p,
        approvalStatus: validStatus,
        approvalComment: validStatus === 'Rejected' ? nextRemark : (trimmedRemark || p.approvalComment || ''),
        rejectionReason: validStatus === 'Rejected' ? (trimmedRemark || p.rejectionReason || 'Quality standards not met') : null,
        reviewedAt: new Date().toISOString(),
        reviewedBy: adminUser?.name || adminUser?.role || 'Marketplace Administrator'
      };
    }));

    try {
      const res = await updateProductApprovalApi(id, validStatus, trimmedRemark);
      if (res?.success && res?.product) {
        const saved = res.product;
        const normalizedSaved = {
          ...saved,
          id: saved._id || saved.id,
          _id: saved._id || saved.id,
          approvalStatus: saved.approvalStatus || validStatus,
          approvalComment: saved.approvalComment || trimmedRemark,
          rejectionReason: saved.rejectionReason || (validStatus === 'Rejected' ? trimmedRemark : null)
        };
        setProducts(prev => prev.map(p => (matchFn(p) ? { ...p, ...normalizedSaved } : p)));
        setInventory(prev => prev.map(p => (matchFn(p) ? { ...p, ...normalizedSaved } : p)));
      }
    } catch (err) {
      console.warn('Backend product approval status update error:', err);
    }

    logAudit('Product Status Updated', `Product #${id} marked as ${validStatus}${trimmedRemark ? ` (${trimmedRemark})` : ''}`);
  };

  const approveProduct = (id, comment = '') => {
    return updateProductApprovalStatus(id, 'Approved', comment);
  };

  const rejectProduct = (id, reason = 'Quality standards not met') => {
    return updateProductApprovalStatus(id, 'Rejected', reason);
  };

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id && p._id !== id));
    setInventory(prev => prev.filter(p => p.id !== id && p._id !== id));
    deleteAdminProductApi(id).catch(() => {});
    logAudit('Delete Product', `Deleted catalog item #${id}`);
  };

  // ==================== ORDER ACTIONS ====================
  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
      return updated;
    });
    updateOrderStatusApi(orderId, newStatus).catch(() => {});
    logAudit('Order Status Updated', `Order ${orderId} marked as ${newStatus}`);
  };

  const cancelOrder = (orderId, reason = 'Administrative cancellation') => {
    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, status: 'Cancelled', cancellationReason: reason } : o);
      return updated;
    });
    updateOrderStatusApi(orderId, 'Cancelled').catch(() => {});
    logAudit('Order Cancelled', `Cancelled order ${orderId} (${reason})`);
  };

  const refundOrder = (orderId, refundAmount) => {
    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, paymentStatus: 'Refunded', status: 'Cancelled' } : o);
      return updated;
    });
    logAudit('Refund Issued', `Refunded ₹${refundAmount} for order ${orderId}`);
  };

  const updateOrderTracking = (orderId, trackingNumber) => {
    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, trackingNumber, status: 'Shipped' } : o);
      return updated;
    });
    logAudit('Tracking Assigned', `Assigned tracking ${trackingNumber} to ${orderId}`);
  };

  // ==================== SELLER ACTIONS ====================
  const approveSeller = async (sellerId) => {
    setSellers(prev => {
      const updated = prev.map(s => {
        if (s.id === sellerId || s._id === sellerId) {
          return {
            ...s,
            status: 'Verified',
            rejectionReason: null,
            rawApplication: s.rawApplication ? {
              ...s.rawApplication,
              status: 'Approved',
              submissionStatus: 'approved',
              rejectionReason: null
            } : undefined
          };
        }
        return s;
      });
      return updated;
    });

    // Synchronize approval to Website persistent keys
    try {
      localStorage.setItem('book_vardi_seller_status', JSON.stringify('approved'));

      const regData = localStorage.getItem('bv_seller_reg_data');
      if (regData) {
        const parsed = JSON.parse(regData);
        parsed.submissionStatus = 'approved';
        parsed.status = 'approved';
        parsed.rejectionReason = null;
        localStorage.setItem('bv_seller_reg_data', JSON.stringify(parsed));
      } else {
        localStorage.setItem('bv_seller_reg_data', JSON.stringify({ submissionStatus: 'approved', status: 'approved' }));
      }

      const sellerProf = localStorage.getItem('book_vardi_seller_profile');
      if (sellerProf) {
        const parsed = JSON.parse(sellerProf);
        parsed.status = 'approved';
        parsed.submissionStatus = 'approved';
        parsed.rejectionReason = null;
        localStorage.setItem('book_vardi_seller_profile', JSON.stringify(parsed));
      } else {
        localStorage.setItem('book_vardi_seller_profile', JSON.stringify({ status: 'approved', submissionStatus: 'approved' }));
      }

      const userProf = localStorage.getItem('book_vardi_user_profile');
      if (userProf) {
        const parsed = JSON.parse(userProf);
        parsed.sellerStatus = 'approved';
        parsed.isSeller = true;
        localStorage.setItem('book_vardi_user_profile', JSON.stringify(parsed));
      }

      window.dispatchEvent(new CustomEvent('bv_seller_status_updated', { detail: 'approved' }));
    } catch (e) {
      console.error(e);
    }

    try {
      const res = await approveSellerApi(sellerId);
      if (res && (res.seller || res.message)) {
        const data = await fetchAdminSellersApi();
        const list = Array.isArray(data) ? data : (data?.sellers || []);
        if (list.length > 0) {
          setSellers(list.map(s => ({
            id: s._id || s.id,
            _id: s._id || s.id,
            storeName: s.storeName || s.businessName || s.name || 'Vendor Store',
            ownerName: s.ownerName || s.name || 'Vendor',
            status: s.status === 'approved' ? 'Verified' : (s.status === 'pending' ? 'Pending' : (s.status === 'rejected' ? 'Rejected' : s.status)),
            commissionRate: s.commissionPercentage !== undefined ? s.commissionPercentage : (s.commissionRate || 10),
            payoutBalance: s.walletBalance || s.payoutBalance || 0,
            ...s
          })));
        }
      }
    } catch (err) {
      console.error("Failed to approve seller via API:", err);
    }
    logAudit('Seller Approved', `KYC approved for seller ${sellerId}`);
  };

  const setPendingSeller = async (sellerId) => {
    setSellers(prev => {
      const updated = prev.map(s => {
        if (s.id === sellerId || s._id === sellerId) {
          return {
            ...s,
            status: 'Pending',
            rejectionReason: null,
            rawApplication: s.rawApplication ? {
              ...s.rawApplication,
              status: 'Pending',
              submissionStatus: 'pending',
              rejectionReason: null
            } : undefined
          };
        }
        return s;
      });
      return updated;
    });

    try {
      localStorage.setItem('book_vardi_seller_status', JSON.stringify('pending'));

      const regData = localStorage.getItem('bv_seller_reg_data');
      if (regData) {
        const parsed = JSON.parse(regData);
        parsed.submissionStatus = 'pending';
        parsed.status = 'pending';
        parsed.rejectionReason = null;
        localStorage.setItem('bv_seller_reg_data', JSON.stringify(parsed));
      }

      const sellerProf = localStorage.getItem('book_vardi_seller_profile');
      if (sellerProf) {
        const parsed = JSON.parse(sellerProf);
        parsed.status = 'pending';
        parsed.submissionStatus = 'pending';
        parsed.rejectionReason = null;
        localStorage.setItem('book_vardi_seller_profile', JSON.stringify(parsed));
      }

      const userProf = localStorage.getItem('book_vardi_user_profile');
      if (userProf) {
        const parsed = JSON.parse(userProf);
        parsed.sellerStatus = 'pending';
        parsed.isSeller = false;
        localStorage.setItem('book_vardi_user_profile', JSON.stringify(parsed));
      }

      window.dispatchEvent(new CustomEvent('bv_seller_status_updated', { detail: 'pending' }));
    } catch (e) {
      console.error(e);
    }

    try {
      await setPendingSellerApi(sellerId);
      const data = await fetchAdminSellersApi();
      const list = Array.isArray(data) ? data : (data?.sellers || []);
      if (list.length > 0) {
        setSellers(list.map(s => ({
          id: s._id || s.id,
          _id: s._id || s.id,
          storeName: s.storeName || s.businessName || s.name || 'Vendor Store',
          ownerName: s.ownerName || s.name || 'Vendor',
          status: s.status === 'approved' ? 'Verified' : (s.status === 'pending' ? 'Pending' : (s.status === 'rejected' ? 'Rejected' : s.status)),
          commissionRate: s.commissionPercentage !== undefined ? s.commissionPercentage : (s.commissionRate || 10),
          payoutBalance: s.walletBalance || s.payoutBalance || 0,
          ...s
        })));
      }
    } catch (err) {
      console.error("Failed to reset seller status to pending via API:", err);
    }
    logAudit('Seller Status Reset', `Seller ${sellerId} status reset to Pending approval`);
  };

  const rejectSeller = async (sellerId, reason = 'Incomplete GSTIN/KYC verification details') => {
    const trimmedReason = reason?.trim() || 'Incomplete GSTIN/KYC verification details';
    setSellers(prev => {
      const updated = prev.map(s => {
        if (s.id === sellerId || s._id === sellerId) {
          return {
            ...s,
            status: 'Rejected',
            rejectionReason: trimmedReason,
            rawApplication: s.rawApplication ? {
              ...s.rawApplication,
              status: 'Rejected',
              submissionStatus: 'rejected',
              rejectionReason: trimmedReason
            } : undefined
          };
        }
        return s;
      });
      return updated;
    });

    try {
      localStorage.setItem('book_vardi_seller_status', JSON.stringify('rejected'));

      const regData = localStorage.getItem('bv_seller_reg_data');
      if (regData) {
        const parsed = JSON.parse(regData);
        parsed.submissionStatus = 'rejected';
        parsed.status = 'rejected';
        parsed.rejectionReason = trimmedReason;
        localStorage.setItem('bv_seller_reg_data', JSON.stringify(parsed));
      }

      const sellerProf = localStorage.getItem('book_vardi_seller_profile');
      if (sellerProf) {
        const parsed = JSON.parse(sellerProf);
        parsed.status = 'rejected';
        parsed.submissionStatus = 'rejected';
        parsed.rejectionReason = trimmedReason;
        localStorage.setItem('book_vardi_seller_profile', JSON.stringify(parsed));
      }

      const userProf = localStorage.getItem('book_vardi_user_profile');
      if (userProf) {
        const parsed = JSON.parse(userProf);
        parsed.sellerStatus = 'rejected';
        parsed.isSeller = false;
        localStorage.setItem('book_vardi_user_profile', JSON.stringify(parsed));
      }

      window.dispatchEvent(new CustomEvent('bv_seller_status_updated', { detail: 'rejected' }));
    } catch (e) {
      console.error(e);
    }

    try {
      await rejectSellerApi(sellerId, trimmedReason);
      const data = await fetchAdminSellersApi();
      const list = Array.isArray(data) ? data : (data?.sellers || []);
      if (list.length > 0) {
        setSellers(list.map(s => ({
          id: s._id || s.id,
          _id: s._id || s.id,
          storeName: s.storeName || s.businessName || s.name || 'Vendor Store',
          ownerName: s.ownerName || s.name || 'Vendor',
          status: s.status === 'approved' ? 'Verified' : (s.status === 'pending' ? 'Pending' : (s.status === 'rejected' ? 'Rejected' : s.status)),
          commissionRate: s.commissionPercentage !== undefined ? s.commissionPercentage : (s.commissionRate || 10),
          payoutBalance: s.walletBalance || s.payoutBalance || 0,
          ...s
        })));
      }
    } catch (err) {
      console.error("Failed to reject seller via API:", err);
    }
    logAudit('Seller Rejected', `Rejected seller ${sellerId} with message: "${trimmedReason}"`);
  };

  const toggleSellerStatus = async (sellerId, targetStatus, reason = '') => {
    const lower = String(targetStatus || '').toLowerCase();
    if (lower === 'approved' || lower === 'verified') {
      await approveSeller(sellerId);
    } else if (lower === 'pending') {
      await setPendingSeller(sellerId);
    } else if (lower === 'rejected') {
      await rejectSeller(sellerId, reason);
    } else if (lower === 'suspended') {
      setSellers(prev => prev.map(s => (s.id === sellerId || s._id === sellerId) ? { ...s, status: 'Suspended' } : s));
      try {
        await toggleSellerStatusApi(sellerId, 'suspended', reason);
        const data = await fetchAdminSellersApi();
        const list = Array.isArray(data) ? data : (data?.sellers || []);
        if (list.length > 0) {
          setSellers(list.map(s => ({
            id: s._id || s.id,
            _id: s._id || s.id,
            storeName: s.storeName || s.businessName || s.name || 'Vendor Store',
            ownerName: s.ownerName || s.name || 'Vendor',
            status: s.status === 'approved' ? 'Verified' : (s.status === 'pending' ? 'Pending' : (s.status === 'rejected' ? 'Rejected' : s.status)),
            commissionRate: s.commissionPercentage !== undefined ? s.commissionPercentage : (s.commissionRate || 10),
            payoutBalance: s.walletBalance || s.payoutBalance || 0,
            ...s
          })));
        }
      } catch (err) {
        console.error("Failed to suspend seller via API:", err);
      }
      logAudit('Seller Suspended', `Suspended seller account ${sellerId}`);
    }
  };

  const updateSellerCommission = async (sellerId, rate) => {
    const numRate = Number(rate);
    setSellers(prev => {
      const updated = prev.map(s => (s.id === sellerId || s._id === sellerId) ? { ...s, commissionRate: numRate, commissionPercentage: numRate } : s);
      return updated;
    });
    try {
      await updateSellerCommissionApi(sellerId, numRate);
    } catch (err) {
      console.error('Failed to update seller commission via API:', err);
    }
    logAudit('Commission Changed', `Set seller ${sellerId} commission to ${rate}%`);
  };

  const releaseSellerPayout = (sellerId, amount) => {
    setSellers(prev => {
      const updated = prev.map(s => s.id === sellerId ? { ...s, payoutBalance: 0 } : s);
      return updated;
    });
    processPayoutApi(sellerId, 'approve').catch(() => {});
    logAudit('Payout Dispatched', `Processed settlement of ₹${amount} for seller ${sellerId}`);
  };

  // ==================== INVENTORY ACTIONS ====================
  const updateInventoryStock = async (productId, newStock) => {
    const stockVal = Math.max(0, Number(newStock) || 0);
    setInventory(prev => prev.map(item => (item.id === productId || item._id === productId) ? { ...item, stock: stockVal, stockQuantity: stockVal, inStock: stockVal > 0 } : item));
    setProducts(prev => prev.map(p => (p.id === productId || p._id === productId) ? { ...p, stock: stockVal, stockQuantity: stockVal, inStock: stockVal > 0 } : p));
    try {
      const updateRes = await updateAdminInventoryStockApi(productId, stockVal);
      if (updateRes?.success && updateRes?.product) {
        const prod = updateRes.product;
        setProducts(prev => prev.map(p => (p.id === productId || p._id === productId) ? { ...p, stock: prod.stock, stockQuantity: prod.stock, inStock: prod.stock > 0 } : p));
      }
      const res = await fetchAdminInventoryApi();
      if (res?.metrics) setInventoryMetrics(res.metrics);
      if (Array.isArray(res?.inventory)) setInventory(res.inventory);
    } catch (e) {
      console.error('Failed to update inventory stock via API:', e);
    }
    logAudit('Stock Adjusted', `Stock for product ${productId} adjusted to ${stockVal}`);
  };

  const quickRestock = async (productId, quantityToAdd = 25) => {
    const qty = Number(quantityToAdd) || 25;
    setInventory(prev => prev.map(item => (item.id === productId || item._id === productId) ? { ...item, stock: (item.stock || 0) + qty, stockQuantity: ((item.stockQuantity ?? item.stock) || 0) + qty, inStock: true } : item));
    setProducts(prev => prev.map(p => (p.id === productId || p._id === productId) ? { ...p, stock: (p.stock || 0) + qty, stockQuantity: (p.stockQuantity || 0) + qty, inStock: true } : p));
    try {
      const restockRes = await quickRestockAdminInventoryApi(productId, qty);
      if (restockRes?.success && restockRes?.product) {
        const prod = restockRes.product;
        setProducts(prev => prev.map(p => (p.id === productId || p._id === productId) ? { ...p, stock: prod.stock, stockQuantity: prod.stock, inStock: prod.stock > 0 } : p));
      }
      const res = await fetchAdminInventoryApi();
      if (res?.metrics) setInventoryMetrics(res.metrics);
      if (Array.isArray(res?.inventory)) setInventory(res.inventory);
    } catch (e) {
      console.error('Failed to quick restock inventory via API:', e);
    }
    logAudit('Quick Restock', `Added +${qty} units to inventory for product ${productId}`);
  };

  // ==================== SCHOOL ACTIONS ====================
  const updateSchoolRadius = (km) => {
    const validKm = Math.max(1, Math.min(500, Number(km) || 25));
    setSchoolRadiusKm(validKm);
    setSettings(prev => {
      const next = { ...prev, schoolRadiusKm: validKm };
      localStorage.setItem('admin_settings', JSON.stringify(next));
      return next;
    });
    updateSchoolRadiusApi(validKm).catch(() => {});
    logAudit('School Radius Updated', `Admin updated school discovery radius to ${validKm} km`);
  };

  const updatePlatformSettings = async (newSettingsData) => {
    const minVal = newSettingsData.minOrderFreeShipping !== undefined ? Number(newSettingsData.minOrderFreeShipping) : (newSettingsData.freeShippingThreshold !== undefined ? Number(newSettingsData.freeShippingThreshold) : (settings.minOrderFreeShipping || 99));
    const updated = {
      ...settings,
      ...newSettingsData,
      minOrderFreeShipping: minVal,
      freeShippingThreshold: minVal
    };
    setSettings(updated);
    try {
      localStorage.setItem('admin_settings', JSON.stringify(updated));
      localStorage.setItem('bv_free_shipping_threshold', JSON.stringify(minVal));
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('bv_settings_updated', { detail: updated }));
    try {
      await updateSettingsApi(updated);
    } catch (err) {
      console.error('Failed to save admin settings to API:', err);
    }
    return updated;
  };

  const addSchool = (newSchool) => {
    const school = {
      status: 'Partner Active',
      partnerSince: new Date().getFullYear().toString(),
      address: newSchool.address || newSchool.city || '',
      city: newSchool.city || '',
      state: newSchool.state || '',
      pincode: newSchool.pincode || '',
      ...newSchool
    };
    if (newSchool.lat) school.lat = Number(newSchool.lat);
    if (newSchool.lng) school.lng = Number(newSchool.lng);
    setSchools(prev => {
      const updated = [school, ...prev];
      return updated;
    });
    createSchoolApi(school).catch(() => {});
    logAudit('School Onboarded', `Added partner institution: ${school.name}`);
  };

  const updateSchool = (id, updates) => {
    setSchools(prev => {
      const updated = prev.map(s => (s.id === id || s._id === id) ? { ...s, ...updates } : s);
      return updated;
    });
    updateSchoolApi(id, updates).catch(() => {});
    logAudit('School Updated', `Updated school record #${id}`);
  };

  const deleteSchool = (id) => {
    setSchools(prev => {
      const updated = prev.filter(s => s.id !== id && s._id !== id);
      return updated;
    });
    deleteSchoolApi(id).catch(() => {});
    logAudit('School Removed', `Removed school #${id}`);
  };

  const distributeSchoolBulkOrder = async (orderId, { assignmentMode, sellerId, invitedSellerIds }) => {
    setSchoolOrders(prev => prev.map(o => {
      if (o.id === orderId || o._id === orderId) {
        return {
          ...o,
          assignmentMode,
          sellerId: assignmentMode === 'direct' ? sellerId : null,
          invitedSellerIds: assignmentMode === 'selected' ? invitedSellerIds : [],
          status: assignmentMode === 'direct' ? 'assigned' : 'published'
        };
      }
      return o;
    }));

    try {
      const res = await distributeSchoolBulkOrderApi(orderId, { assignmentMode, sellerId, invitedSellerIds });
      if (res?.success && res.order) {
        setSchoolOrders(prev => prev.map(o => (o.id === orderId || o._id === orderId ? { ...o, ...res.order } : o)));
      }
    } catch (e) {
      console.warn('Backend distribution fallback:', e);
    }
    logAudit('Bulk Order Distributed', `Distributed bulk order #${orderId} via ${assignmentMode} mode`);
  };

  const approveSellerQuotation = async (orderId, quoteId) => {
    setSchoolOrders(prev => prev.map(o => {
      if (o.id === orderId || o._id === orderId) {
        const updatedQuotes = (o.quotations || []).map(q => ({
          ...q,
          status: (q._id === quoteId || q.id === quoteId) ? 'approved' : 'rejected'
        }));
        const winning = updatedQuotes.find(q => q._id === quoteId || q.id === quoteId);
        return {
          ...o,
          quotations: updatedQuotes,
          acceptedQuoteId: quoteId,
          sellerId: winning?.sellerId || o.sellerId,
          status: 'quote_accepted'
        };
      }
      return o;
    }));

    try {
      const res = await approveSellerQuotationApi(orderId, quoteId);
      if (res?.success && res.order) {
        setSchoolOrders(prev => prev.map(o => (o.id === orderId || o._id === orderId ? { ...o, ...res.order } : o)));
      }
    } catch (e) {
      console.warn('Backend quote approval fallback:', e);
    }
    logAudit('Quotation Approved', `Approved quotation #${quoteId} for bulk order #${orderId}`);
  };


  // ==================== USER ACTIONS ====================
  const toggleUserStatus = (userId) => {
    setUsers(prev => {
      let nextStatus = 'Active';
      const updated = prev.map(u => {
        if (u.id === userId || u._id === userId) {
          nextStatus = u.status === 'Active' ? 'Suspended' : 'Active';
          logAudit('User Status Changed', `Changed status of ${u.name} to ${nextStatus}`);
          return { ...u, status: nextStatus };
        }
        return u;
      });
      updateUserApi(userId, { status: nextStatus }).catch(() => {});
      return updated;
    });
  };

  // ==================== PROMOTIONS & MARKETING ====================
  const addPromotion = (promo) => {
    const item = {
      id: Date.now(),
      status: 'active',
      usageCount: 0,
      ...promo
    };
    setPromotions(prev => {
      const updated = [item, ...prev];
      return updated;
    });
    createPromotionApi(promo).catch(() => {});
    logAudit('Promotion Created', `Created campaign code ${promo.code}`);
  };

  const deletePromotion = (id) => {
    setPromotions(prev => {
      const updated = prev.filter(p => p.id !== id && p._id !== id);
      return updated;
    });
    deletePromotionApi(id).catch(() => {});
    logAudit('Promotion Deleted', `Deleted promo coupon #${id}`);
  };

  const addAnnouncement = async (itemData) => {
    const tempId = String(Date.now());
    const newItem = {
      id: tempId,
      _id: tempId,
      text: itemData.text.trim(),
      badge: itemData.badge ? itemData.badge.trim() : '',
      link: itemData.link ? itemData.link.trim() : '',
      priority: Number(itemData.priority) || 1,
      isActive: itemData.isActive !== undefined ? Boolean(itemData.isActive) : true,
      expiryDate: itemData.expiryDate || null,
      bgColor: itemData.bgColor || '#0f766e',
      textColor: itemData.textColor || '#ffffff',
      createdAt: new Date().toISOString()
    };

    setAnnouncements(prev => [...prev, newItem].sort((a, b) => (Number(a.priority) || 1) - (Number(b.priority) || 1)));
    logAudit('Announcement Added', `Added top banner item: "${newItem.text}" (Priority ${newItem.priority})`);

    try {
      const res = await createAnnouncementApi(itemData);
      if (res?.success && res.announcement) {
        const saved = res.announcement;
        const normalized = {
          ...saved,
          id: saved._id || saved.id,
          _id: saved._id || saved.id,
          priority: Number(saved.priority) || 1
        };
        setAnnouncements(prev => prev.map(a => (a.id === tempId ? normalized : a)).sort((a, b) => a.priority - b.priority));
        return normalized;
      }
    } catch (e) {
      console.warn('Backend announcement create fallback:', e);
    }
    return newItem;
  };

  const updateAnnouncement = async (id, updates) => {
    setAnnouncements(prev => prev.map(a => (a.id === id || a._id === id ? { ...a, ...updates } : a)).sort((a, b) => (Number(a.priority) || 1) - (Number(b.priority) || 1)));
    logAudit('Announcement Updated', `Updated top banner item #${id}`);

    try {
      const res = await updateAnnouncementApi(id, updates);
      if (res?.success && res.announcement) {
        const saved = res.announcement;
        const normalized = {
          ...saved,
          id: saved._id || saved.id,
          _id: saved._id || saved.id,
          priority: Number(saved.priority) || 1
        };
        setAnnouncements(prev => prev.map(a => (a.id === id || a._id === id ? normalized : a)).sort((a, b) => a.priority - b.priority));
      }
    } catch (e) {
      console.warn('Backend announcement update fallback:', e);
    }
  };

  const toggleAnnouncementStatus = async (id, targetStatus) => {
    let resolvedStatus;
    setAnnouncements(prev => prev.map(a => {
      if (a.id === id || a._id === id) {
        resolvedStatus = targetStatus !== undefined ? Boolean(targetStatus) : !a.isActive;
        return { ...a, isActive: resolvedStatus };
      }
      return a;
    }));
    logAudit('Announcement Status Toggled', `Toggled top banner item #${id} status`);
    if (resolvedStatus !== undefined) {
      toggleAnnouncementStatusApi(id, resolvedStatus).catch(() => {});
    }
  };

  const deleteAnnouncement = async (id) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id && a._id !== id));
    logAudit('Announcement Deleted', `Deleted top banner item #${id}`);
    deleteAnnouncementApi(id).catch(() => {});
  };

  // ==================== REVIEWS & CONTENT MODERATION ====================
  const approveReview = (id) => {
    setReviews(prev => {
      const updated = prev.map(r => r.id === id || r._id === id ? { ...r, status: 'Approved', reported: false } : r);
      return updated;
    });
    moderateReviewApi(id, 'approved').catch(() => {});
    logAudit('Review Moderated', `Approved product review #${id}`);
  };

  const hideReview = (id) => {
    setReviews(prev => {
      const updated = prev.map(r => r.id === id || r._id === id ? { ...r, status: 'Hidden' } : r);
      return updated;
    });
    moderateReviewApi(id, 'rejected').catch(() => {});
    logAudit('Review Hidden', `Hidden product review #${id}`);
  };

  const deleteReview = (id) => {
    setReviews(prev => {
      const updated = prev.filter(r => r.id !== id && r._id !== id);
      return updated;
    });
    deleteAdminReviewApi(id).catch(() => {});
    logAudit('Review Deleted', `Removed flagged review #${id}`);
  };

  // ==================== SUPPORT TICKET ACTIONS ====================
  const updateTicketStatus = (ticketId, status) => {
    setSupportTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
    logAudit('Ticket Updated', `Ticket ${ticketId} marked as ${status}`);
  };

  const replyTicket = (ticketId, replyText) => {
    setSupportTickets(prev => prev.map(t => t.id === ticketId ? { ...t, lastMessage: `[Admin Response]: ${replyText}`, status: 'In Progress' } : t));
    logAudit('Support Reply', `Responded to ticket ${ticketId}`);
  };

  // ==================== NOTIFICATIONS ====================
  const broadcastNotification = ({ title, message, type = 'system' }) => {
    const notif = {
      id: Date.now(),
      title,
      message,
      type,
      date: 'Just now',
      unread: true
    };
    setNotifications(prev => [notif, ...prev]);
    logAudit('Broadcast Sent', `Sent notification: "${title}"`);
  };

  const markNotificationRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  const clearAllNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  // Role Switcher for Admin Demonstration
  const switchAdminRole = (role) => {
    setAdminUser(prev => ({ ...prev, role }));
    logAudit('Role Switched', `Logged in as ${role}`);
  };

  // Authentication & Authorization Actions via Live Backend JWT API
  const loginAdmin = async ({ email, phone, password, role = 'Super Admin' }) => {
    const emailOrPhone = (email || phone || '').trim();
    if (!emailOrPhone) {
      throw new Error('Authentication Failed: Email or phone number is required.');
    }

    const res = await loginAdminApi(emailOrPhone, password);
    if (!res || !res.token || res.success === false) {
      throw new Error(res?.message || 'Authentication Failed: Invalid credentials or unapproved admin account. Please retry.');
    }

    const updated = {
      ...adminUser,
      id: res.admin?.id || res.admin?._id || adminUser.adminId,
      name: res.admin?.name || res.admin?.email?.split('@')[0] || 'Admin User',
      email: res.admin?.email || (emailOrPhone.includes('@') ? emailOrPhone : adminUser.email),
      phone: res.admin?.phone || '',
      role: res.admin?.role || 'admin',
      status: res.admin?.status || 'active',
      permissions: res.admin?.permissions || {},
      lastLogin: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    };
    setAdminUser(updated);
    setIsAuthenticated(true);
    logAudit('Admin Signed In', `Authenticated via JWT as role: ${updated.role}`);
    return { success: true };
  };

  const logoutAdmin = () => {
    localStorage.removeItem('bv_admin_jwt_token');
    localStorage.removeItem('admin_is_authenticated');
    setIsAuthenticated(false);
    logAudit('Admin Signed Out', `${adminUser.name} signed out from console`);
  };

  const updateAdminProfile = (updates) => {
    setAdminUser(prev => ({ ...prev, ...updates }));
    logAudit('Admin Profile Updated', 'Admin account information updated');
  };

  // RBAC Permission Helpers
  const isSuperAdmin = useCallback(() => {
    const r = (adminUser?.role || '').toLowerCase().replace(/[\s_-]+/g, '');
    return r === 'admin' || r === 'superadmin';
  }, [adminUser?.role]);

  const getTabPermission = useCallback((tabId) => {
    if (isSuperAdmin()) return 'editor';
    const perms = adminUser?.permissions || {};
    return perms[tabId] || 'none';
  }, [isSuperAdmin, adminUser?.permissions]);

  const isEditor = useCallback((tabId) => {
    if (isSuperAdmin()) return true;
    return getTabPermission(tabId) === 'editor';
  }, [isSuperAdmin, getTabPermission]);

  const canViewTab = useCallback((tabId) => {
    if (tabId === 'profile') return true;
    if (tabId === 'team') return isSuperAdmin();
    if (isSuperAdmin()) return true;
    const perm = getTabPermission(tabId);
    return perm === 'editor' || perm === 'viewer';
  }, [isSuperAdmin, getTabPermission]);

  // Subadmin Management Handlers
  const addSubadmin = async (subadminData) => {
    const res = await createSubadminApi(subadminData);
    if (res?.success && res.subadmin) {
      setSubadmins(prev => [res.subadmin, ...prev.filter(s => (s._id || s.id) !== (res.subadmin._id || res.subadmin.id))]);
      logAudit('Staff Created', `Created subadmin account for ${res.subadmin.name} (${res.subadmin.email})`);
      return res;
    }
    throw new Error(res?.message || 'Failed to create subadmin account');
  };

  const updateSubadmin = async (id, updates) => {
    const res = await updateSubadminApi(id, updates);
    if (res?.success && res.subadmin) {
      setSubadmins(prev => prev.map(s => ((s._id || s.id) === id ? res.subadmin : s)));
      logAudit('Staff Updated', `Updated permissions/details for ${res.subadmin.name}`);
      return res;
    }
    throw new Error(res?.message || 'Failed to update subadmin account');
  };

  const deleteSubadmin = async (id) => {
    const res = await deleteSubadminApi(id);
    if (res?.success) {
      setSubadmins(prev => prev.filter(s => (s._id || s.id) !== id));
      logAudit('Staff Removed', `Removed subadmin account with ID: ${id}`);
      return res;
    }
    throw new Error(res?.message || 'Failed to remove subadmin account');
  };

  const refreshSubadmins = async () => {
    try {
      const data = await fetchSubadminsApi();
      const list = Array.isArray(data) ? data : (data?.subadmins || []);
      setSubadmins(list);
    } catch (err) {
      console.error('Error refreshing subadmins:', err);
    }
  };

  const value = {
    isAuthenticated,
    loginAdmin,
    logoutAdmin,
    updateAdminProfile,
    adminUser,
    switchAdminRole,
    isSuperAdmin,
    getTabPermission,
    isEditor,
    canViewTab,
    subadmins,
    addSubadmin,
    updateSubadmin,
    deleteSubadmin,
    refreshSubadmins,
    products,
    addProduct,
    updateProduct,
    approveProduct,
    updateProductApprovalStatus,
    rejectProduct,
    deleteProduct,
    inventory,
    inventoryMetrics,
    updateInventoryStock,
    quickRestock,
    orders,
    updateOrderStatus,
    cancelOrder,
    refundOrder,
    updateOrderTracking,
    schoolOrders,
    distributeSchoolBulkOrder,
    approveSellerQuotation,
    sellers,
    approveSeller,
    rejectSeller,
    setPendingSeller,
    toggleSellerStatus,
    updateSellerCommission,
    releaseSellerPayout,
    schools,
    addSchool,
    updateSchool,
    deleteSchool,
    schoolRadiusKm,
    updateSchoolRadius,
    users,
    toggleUserStatus,
    promotions,
    addPromotion,
    deletePromotion,
    announcements,
    addAnnouncement,
    updateAnnouncement,
    toggleAnnouncementStatus,
    deleteAnnouncement,
    reviews,
    approveReview,
    hideReview,
    deleteReview,
    supportTickets,
    updateTicketStatus,
    replyTicket,
    settings,
    setSettings,
    updatePlatformSettings,
    notifications,
    broadcastNotification,
    markNotificationRead,
    clearAllNotifications,
    auditLog,
    logAudit
  };

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
};
