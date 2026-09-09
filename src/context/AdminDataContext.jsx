import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ALL_PRODUCTS,
  ORDERS as MOCK_ORDERS,
  SCHOOL_ORDERS as MOCK_SCHOOL_ORDERS,
  SELLERS as MOCK_SELLERS,
  SCHOOLS as MOCK_SCHOOLS,
  USERS as MOCK_USERS,
  USERS,
  PROMOTIONS as MOCK_PROMOTIONS,
  REVIEWS as MOCK_REVIEWS,
  SUPPORT_TICKETS as MOCK_SUPPORT_TICKETS,
  PLATFORM_SETTINGS as MOCK_SETTINGS,
  NOTIFICATIONS as MOCK_NOTIFICATIONS
} from '../data/mockData';
import { pushPlatformSync, usePlatformSyncListener } from '../utils/syncBridge';

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
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_is_authenticated');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  // Current Admin Profile & RBAC Role
  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem('admin_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Aaditya Yadav',
      email: 'admin@bookvardi.in',
      phone: '+91 98765 43210',
      role: 'Super Admin', // Super Admin, Operations Manager, Finance Admin, Support Lead
      adminId: 'BV-ADM-001',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      approvedAt: '2024-06-15',
      lastLogin: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    };
  });

  // 1. Products
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map(p => {
          if (!p.approvalStatus) {
            const mock = ALL_PRODUCTS.find(m => m.id === p.id);
            return {
              ...p,
              approvalStatus: mock?.approvalStatus || (p.id === 3 || p.id === 4 ? 'Pending' : 'Approved'),
              approvalComment: mock?.approvalComment || p.approvalComment || '',
              rejectionReason: mock?.rejectionReason || p.rejectionReason || null
            };
          }
          return p;
        });
      }
      return ALL_PRODUCTS;
    } catch {
      return ALL_PRODUCTS;
    }
  });

  // 2. Orders
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('admin_orders');
    return saved ? JSON.parse(saved) : MOCK_ORDERS;
  });

  // 3. School Bulk Orders
  const [schoolOrders, setSchoolOrders] = useState(() => {
    const saved = localStorage.getItem('admin_school_orders');
    return saved ? JSON.parse(saved) : MOCK_SCHOOL_ORDERS;
  });

  // 4. Sellers
  const [sellers, setSellers] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_sellers');
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = parsed.map(s => {
          const mockMatch = MOCK_SELLERS.find(m => m.id === s.id);
          if (mockMatch && (!s.rawApplication || Object.keys(s.rawApplication).length < 5)) {
            return { ...mockMatch, ...s, rawApplication: mockMatch.rawApplication };
          }
          return s;
        });
        MOCK_SELLERS.forEach(m => {
          if (!merged.some(s => s.id === m.id)) {
            merged.push(m);
          }
        });
        return merged;
      }
      return MOCK_SELLERS;
    } catch {
      return MOCK_SELLERS;
    }
  });

  // 5. Schools
  const [schools, setSchools] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_schools');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map(s => {
          const mock = MOCK_SCHOOLS.find(m => m.id === s.id || m.name === s.name);
          return {
            ...s,
            lat: s.lat !== undefined ? Number(s.lat) : (mock?.lat || 28.6139),
            lng: s.lng !== undefined ? Number(s.lng) : (mock?.lng || 77.2090),
            address: s.address || mock?.address || s.city,
            pincode: s.pincode || mock?.pincode || '110001'
          };
        });
      }
      return MOCK_SCHOOLS;
    } catch {
      return MOCK_SCHOOLS;
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
      return MOCK_SETTINGS.schoolRadiusKm || 25;
    } catch {
      return 25;
    }
  });

  useEffect(() => {
    localStorage.setItem('bv_school_radius_km', JSON.stringify(schoolRadiusKm));
  }, [schoolRadiusKm]);

  // 6. Users
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('admin_users');
    return saved ? JSON.parse(saved) : MOCK_USERS;
  });

  // 7. Promotions
  const [promotions, setPromotions] = useState(() => {
    const saved = localStorage.getItem('admin_promotions');
    return saved ? JSON.parse(saved) : MOCK_PROMOTIONS;
  });

  // 8. Reviews & Reports
  const [reviews, setReviews] = useState(() => {
    const saved = localStorage.getItem('admin_reviews');
    return saved ? JSON.parse(saved) : MOCK_REVIEWS;
  });

  // 9. Support Tickets
  const [supportTickets, setSupportTickets] = useState(() => {
    const saved = localStorage.getItem('admin_support_tickets');
    return saved ? JSON.parse(saved) : MOCK_SUPPORT_TICKETS;
  });

  // 10. Platform Settings
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('admin_settings');
    return saved ? JSON.parse(saved) : MOCK_SETTINGS;
  });

  // 11. Notifications
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('admin_notifications');
    return saved ? JSON.parse(saved) : MOCK_NOTIFICATIONS;
  });

  // 12. Audit Log
  const [auditLog, setAuditLog] = useState(() => {
    const saved = localStorage.getItem('admin_audit_log');
    return saved ? JSON.parse(saved) : [
      { id: 1, action: 'Platform Launch', user: 'System', details: 'Book Vardi operations initiated', time: '1 day ago' },
      { id: 2, action: 'Vendor Approved', user: 'Super Admin', details: 'Vardi Uniforms Pvt Ltd verified', time: '5 hours ago' },
      { id: 3, action: 'Payout Dispatched', user: 'Finance Admin', details: 'Batch #B-991 released to HDFC', time: '2 hours ago' }
    ];
  });

  // Persist to localStorage
  useEffect(() => { localStorage.setItem('admin_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('admin_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('admin_school_orders', JSON.stringify(schoolOrders)); }, [schoolOrders]);
  useEffect(() => { localStorage.setItem('admin_sellers', JSON.stringify(sellers)); }, [sellers]);
  useEffect(() => { localStorage.setItem('admin_schools', JSON.stringify(schools)); }, [schools]);
  useEffect(() => { localStorage.setItem('admin_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('admin_promotions', JSON.stringify(promotions)); }, [promotions]);
  useEffect(() => { localStorage.setItem('admin_reviews', JSON.stringify(reviews)); }, [reviews]);
  useEffect(() => { localStorage.setItem('admin_support_tickets', JSON.stringify(supportTickets)); }, [supportTickets]);
  useEffect(() => { localStorage.setItem('admin_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('admin_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('admin_audit_log', JSON.stringify(auditLog)); }, [auditLog]);
  useEffect(() => { localStorage.setItem('admin_profile', JSON.stringify(adminUser)); }, [adminUser]);
  useEffect(() => { localStorage.setItem('admin_is_authenticated', JSON.stringify(isAuthenticated)); }, [isAuthenticated]);

  // Subscribe to real-time sync across user and seller portals
  usePlatformSyncListener((incoming) => {
    if (!incoming) return;
    if (incoming.products) setProducts(incoming.products);
    if (incoming.orders) setOrders(incoming.orders);
    if (incoming.schoolOrders) setSchoolOrders(incoming.schoolOrders);
    if (incoming.sellers) setSellers(incoming.sellers);
    if (incoming.schools) setSchools(incoming.schools);
    if (incoming.users) setUsers(incoming.users);
    if (incoming.promotions) setPromotions(incoming.promotions);
    if (incoming.reviews) setReviews(incoming.reviews);
    if (incoming.schoolRadiusKm) setSchoolRadiusKm(Number(incoming.schoolRadiusKm));
  });

  // Audit Logger Helper
  const logAudit = useCallback((action, details) => {
    const entry = {
      id: Date.now(),
      action,
      user: adminUser.role,
      details,
      time: 'Just now'
    };
    setAuditLog(prev => [entry, ...prev.slice(0, 49)]);
  }, [adminUser.role]);

  // ==================== PRODUCT ACTIONS ====================
  const addProduct = (newProd) => {
    const item = {
      id: Date.now(),
      name: newProd.name.trim(),
      subtitle: newProd.subtitle || '',
      price: Number(newProd.price),
      originalPrice: Number(newProd.originalPrice) || Math.round(Number(newProd.price) * 1.25),
      category: newProd.category || 'uniforms',
      badge: newProd.badge || 'NEW',
      stockQuantity: Number(newProd.stockQuantity) || 50,
      sellerId: newProd.sellerId || 'SEL-101',
      sellerName: newProd.sellerName || 'Direct Marketplace',
      approvalStatus: newProd.approvalStatus || 'Approved',
      approvalComment: newProd.approvalComment || '',
      rating: 5.0,
      reviews: 0,
      image: newProd.image || 'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=500&auto=format&fit=crop&q=80',
      images: Array.isArray(newProd.images) ? newProd.images : (newProd.image ? [newProd.image] : []),
      sku: newProd.sku || `BV-CAT-${Math.floor(100 + Math.random() * 900)}`
    };
    setProducts(prev => {
      const updated = [item, ...prev];
      pushPlatformSync({ products: updated });
      return updated;
    });
    logAudit('Add Product', `Added catalog product: ${item.name}`);
    return item;
  };

  const updateProduct = (id, updates) => {
    setProducts(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      pushPlatformSync({ products: updated });
      return updated;
    });
    logAudit('Update Product', `Updated product ID #${id}`);
  };

  const approveProduct = (id, comment = '') => {
    const trimmedComment = comment?.trim?.() || '';
    setProducts(prev => {
      const updated = prev.map(p => p.id === id ? {
        ...p,
        approvalStatus: 'Approved',
        approvalComment: trimmedComment || p.approvalComment || '',
        rejectionReason: null
      } : p);
      pushPlatformSync({ products: updated });
      return updated;
    });
    logAudit('Approve Product', `Approved product catalog item #${id}${trimmedComment ? ` (${trimmedComment})` : ''}`);
  };

  const updateProductApprovalStatus = (id, status, remark = '') => {
    const validStatus = ['Approved', 'Pending', 'Rejected'].includes(status) ? status : 'Pending';
    const trimmedRemark = remark?.trim?.() || '';

    setProducts(prev => {
      const updated = prev.map(p => {
        if (p.id !== id) return p;

        const nextRemark = trimmedRemark || p.approvalComment || p.rejectionReason || '';

        return {
          ...p,
          approvalStatus: validStatus,
          approvalComment: validStatus === 'Rejected' ? nextRemark : (trimmedRemark || p.approvalComment || ''),
          rejectionReason: validStatus === 'Rejected' ? (trimmedRemark || p.rejectionReason || 'Quality standards not met') : null,
          reviewedAt: new Date().toISOString(),
          reviewedBy: adminUser?.name || adminUser?.role || 'Marketplace Administrator'
        };
      });
      pushPlatformSync({ products: updated });
      return updated;
    });

    logAudit('Product Status Updated', `Product #${id} marked as ${validStatus}${trimmedRemark ? ` (${trimmedRemark})` : ''}`);
  };

  const rejectProduct = (id, reason = 'Quality standards not met') => {
    const trimmedReason = reason?.trim?.() || '';
    const finalReason = trimmedReason || 'Quality standards not met';
    setProducts(prev => {
      const updated = prev.map(p => p.id === id ? {
        ...p,
        approvalStatus: 'Rejected',
        rejectionReason: finalReason,
        approvalComment: finalReason
      } : p);
      pushPlatformSync({ products: updated });
      return updated;
    });
    logAudit('Reject Product', `Rejected product #${id} (${finalReason})`);
  };

  const deleteProduct = (id) => {
    setProducts(prev => {
      const updated = prev.filter(p => p.id !== id);
      pushPlatformSync({ products: updated });
      return updated;
    });
    logAudit('Delete Product', `Deleted catalog item #${id}`);
  };

  // ==================== ORDER ACTIONS ====================
  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
      pushPlatformSync({ orders: updated });
      return updated;
    });
    logAudit('Order Status Updated', `Order ${orderId} marked as ${newStatus}`);
  };

  const cancelOrder = (orderId, reason = 'Administrative cancellation') => {
    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, status: 'Cancelled', cancellationReason: reason } : o);
      pushPlatformSync({ orders: updated });
      return updated;
    });
    logAudit('Order Cancelled', `Cancelled order ${orderId} (${reason})`);
  };

  const refundOrder = (orderId, refundAmount) => {
    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, paymentStatus: 'Refunded', status: 'Cancelled' } : o);
      pushPlatformSync({ orders: updated });
      return updated;
    });
    logAudit('Refund Issued', `Refunded ₹${refundAmount} for order ${orderId}`);
  };

  const updateOrderTracking = (orderId, trackingNumber) => {
    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, trackingNumber, status: 'Shipped' } : o);
      pushPlatformSync({ orders: updated });
      return updated;
    });
    logAudit('Tracking Assigned', `Assigned tracking ${trackingNumber} to ${orderId}`);
  };

  // ==================== SELLER ACTIONS ====================
  const approveSeller = (sellerId) => {
    setSellers(prev => {
      const updated = prev.map(s => {
        if (s.id === sellerId) {
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
      pushPlatformSync({ sellers: updated });
      return updated;
    });
    logAudit('Seller Approved', `KYC approved for seller ${sellerId}`);
  };

  const rejectSeller = (sellerId, reason = 'Incomplete GSTIN/KYC') => {
    setSellers(prev => {
      const updated = prev.map(s => {
        if (s.id === sellerId) {
          return {
            ...s,
            status: 'Rejected',
            rejectionReason: reason,
            rawApplication: s.rawApplication ? {
              ...s.rawApplication,
              status: 'Rejected',
              submissionStatus: 'rejected',
              rejectionReason: reason
            } : undefined
          };
        }
        return s;
      });
      pushPlatformSync({ sellers: updated });
      return updated;
    });
    logAudit('Seller Rejected', `Rejected seller ${sellerId}: ${reason}`);
  };

  const updateSellerCommission = (sellerId, rate) => {
    setSellers(prev => {
      const updated = prev.map(s => s.id === sellerId ? { ...s, commissionRate: Number(rate) } : s);
      pushPlatformSync({ sellers: updated });
      return updated;
    });
    logAudit('Commission Changed', `Set seller ${sellerId} commission to ${rate}%`);
  };

  const releaseSellerPayout = (sellerId, amount) => {
    setSellers(prev => {
      const updated = prev.map(s => s.id === sellerId ? { ...s, payoutBalance: 0 } : s);
      pushPlatformSync({ sellers: updated });
      return updated;
    });
    logAudit('Payout Dispatched', `Processed settlement of ₹${amount} for seller ${sellerId}`);
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
    pushPlatformSync({ schoolRadiusKm: validKm });
    logAudit('School Radius Updated', `Admin updated school discovery radius to ${validKm} km`);
  };

  const addSchool = (newSchool) => {
    const school = {
      id: `SCH-${String(schools.length + 1).padStart(3, '0')}`,
      status: 'Partner Active',
      partnerSince: '2026',
      lat: Number(newSchool.lat) || 28.6139,
      lng: Number(newSchool.lng) || 77.2090,
      address: newSchool.address || newSchool.city || 'Delhi NCR',
      pincode: newSchool.pincode || '110001',
      ...newSchool
    };
    setSchools(prev => {
      const updated = [school, ...prev];
      pushPlatformSync({ schools: updated, schoolRadiusKm });
      return updated;
    });
    logAudit('School Onboarded', `Added partner institution: ${school.name}`);
  };

  const updateSchool = (id, updates) => {
    setSchools(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, ...updates } : s);
      pushPlatformSync({ schools: updated });
      return updated;
    });
    logAudit('School Updated', `Updated school record #${id}`);
  };

  const deleteSchool = (id) => {
    setSchools(prev => {
      const updated = prev.filter(s => s.id !== id);
      pushPlatformSync({ schools: updated });
      return updated;
    });
    logAudit('School Removed', `Removed school #${id}`);
  };

  // ==================== USER ACTIONS ====================
  const toggleUserStatus = (userId) => {
    setUsers(prev => {
      const updated = prev.map(u => {
        if (u.id === userId) {
          const nextStatus = u.status === 'Active' ? 'Suspended' : 'Active';
          logAudit('User Status Changed', `Changed status of ${u.name} to ${nextStatus}`);
          return { ...u, status: nextStatus };
        }
        return u;
      });
      pushPlatformSync({ users: updated });
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
      pushPlatformSync({ promotions: updated });
      return updated;
    });
    logAudit('Promotion Created', `Created campaign code ${promo.code}`);
  };

  const deletePromotion = (id) => {
    setPromotions(prev => {
      const updated = prev.filter(p => p.id !== id);
      pushPlatformSync({ promotions: updated });
      return updated;
    });
    logAudit('Promotion Deleted', `Deleted promo coupon #${id}`);
  };

  // ==================== REVIEWS & CONTENT MODERATION ====================
  const approveReview = (id) => {
    setReviews(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, status: 'Approved', reported: false } : r);
      pushPlatformSync({ reviews: updated });
      return updated;
    });
    logAudit('Review Moderated', `Approved product review #${id}`);
  };

  const hideReview = (id) => {
    setReviews(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, status: 'Hidden' } : r);
      pushPlatformSync({ reviews: updated });
      return updated;
    });
    logAudit('Review Hidden', `Hidden product review #${id}`);
  };

  const deleteReview = (id) => {
    setReviews(prev => {
      const updated = prev.filter(r => r.id !== id);
      pushPlatformSync({ reviews: updated });
      return updated;
    });
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

  // Authentication & Authorization Actions
  const loginAdmin = ({ email, role = 'Super Admin' }) => {
    const matchedUser = USERS.find((u) => u.email?.toLowerCase() === email?.toLowerCase());
    if (matchedUser) {
      if (!matchedUser.isAdmin || matchedUser.adminStatus !== 'approved') {
        throw new Error(`Access Denied: Account '${matchedUser.name}' does not have an approved admin role in Book Vardi mockData.`);
      }
      role = matchedUser.adminRole || matchedUser.role || role;
    } else if (!APPROVED_ADMIN_ROLES.includes(role)) {
      throw new Error('Access Denied: You do not possess an approved administrative role.');
    }

    const updated = {
      ...adminUser,
      name: matchedUser?.name || adminUser.name,
      email: email || adminUser.email,
      role: role,
      lastLogin: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    };
    setAdminUser(updated);
    setIsAuthenticated(true);
    logAudit('Admin Signed In', `Authenticated as approved role: ${role}`);
    return { success: true };
  };

  const logoutAdmin = () => {
    setIsAuthenticated(false);
    logAudit('Admin Signed Out', `${adminUser.name} signed out from console`);
  };

  const updateAdminProfile = (updates) => {
    setAdminUser(prev => ({ ...prev, ...updates }));
    logAudit('Admin Profile Updated', 'Admin account information updated');
  };

  const value = {
    isAuthenticated,
    loginAdmin,
    logoutAdmin,
    updateAdminProfile,
    adminUser,
    switchAdminRole,
    products,
    addProduct,
    updateProduct,
    approveProduct,
    updateProductApprovalStatus,
    rejectProduct,
    deleteProduct,
    orders,
    updateOrderStatus,
    cancelOrder,
    refundOrder,
    updateOrderTracking,
    schoolOrders,
    sellers,
    approveSeller,
    rejectSeller,
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
    reviews,
    approveReview,
    hideReview,
    deleteReview,
    supportTickets,
    updateTicketStatus,
    replyTicket,
    settings,
    setSettings,
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
