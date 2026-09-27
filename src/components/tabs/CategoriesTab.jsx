import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  Tag,
  Boxes,
  Sparkles,
  BookOpen,
  ShoppingBag,
  Footprints,
  Shirt,
  Percent,
  X,
  AlertCircle,
  FolderPlus,
  Check
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import { fetchAdminCategoriesApi, createAdminCategoryApi, updateAdminCategoryApi, deleteAdminCategoryApi } from '../../utils/api';
import { CATEGORY_STRUCTURE } from '../../constants/categories';

export default function CategoriesTab() {
  const { isEditor } = useAdminData();
  const canEdit = isEditor ? isEditor('products') : true;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State for Create / Edit Category
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    gstPercentage: '5',
    icon: 'Package',
    subCategories: []
  });
  const [newSubInput, setNewSubInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Quick Inline Subcategory Input State (catId -> text)
  const [inlineSubInput, setInlineSubInput] = useState({});

  // Fetch Categories from Backend API (or default structure)
  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminCategoriesApi();
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data);
      } else {
        setCategories(CATEGORY_STRUCTURE);
      }
    } catch {
      setCategories(CATEGORY_STRUCTURE);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Filter categories by search term
  const filteredCategories = categories.filter((cat) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const catName = (cat.name || '').toLowerCase();
    const catDesc = (cat.description || '').toLowerCase();
    const subs = Array.isArray(cat.subCategories)
      ? cat.subCategories.map(s => (typeof s === 'string' ? s : s.name).toLowerCase()).join(' ')
      : '';
    return catName.includes(term) || catDesc.includes(term) || subs.includes(term);
  });

  // Total Metrics
  const totalCategories = categories.length;
  const totalSubCategories = categories.reduce((acc, cat) => {
    return acc + (Array.isArray(cat.subCategories) ? cat.subCategories.length : 0);
  }, 0);

  // Open Create Modal
  const handleOpenAdd = () => {
    if (!canEdit) return;
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      description: '',
      gstPercentage: '5',
      icon: 'Package',
      subCategories: []
    });
    setNewSubInput('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (cat) => {
    if (!canEdit) return;
    setEditingCategory(cat);
    const existingSubs = Array.isArray(cat.subCategories)
      ? cat.subCategories.map(s => (typeof s === 'string' ? s : s.name))
      : [];
    setCategoryForm({
      name: cat.name || '',
      description: cat.description || '',
      gstPercentage: cat.gstPercentage !== undefined ? String(cat.gstPercentage) : '5',
      icon: cat.icon || 'Package',
      subCategories: existingSubs
    });
    setNewSubInput('');
    setIsModalOpen(true);
  };

  // Add Subcategory in Modal
  const handleAddSubInModal = () => {
    const trimmed = newSubInput.trim();
    if (!trimmed) return;
    if (!categoryForm.subCategories.includes(trimmed)) {
      setCategoryForm(prev => ({
        ...prev,
        subCategories: [...prev.subCategories, trimmed]
      }));
    }
    setNewSubInput('');
  };

  // Remove Subcategory in Modal
  const handleRemoveSubInModal = (subName) => {
    setCategoryForm(prev => ({
      ...prev,
      subCategories: prev.subCategories.filter(s => s !== subName)
    }));
  };

  // Save Category (Create or Update)
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!categoryForm.name.trim()) return;

    setSubmitting(true);
    const payload = {
      name: categoryForm.name.trim(),
      description: categoryForm.description.trim(),
      gstPercentage: Number(categoryForm.gstPercentage),
      icon: categoryForm.icon,
      subCategories: categoryForm.subCategories.map(s => ({ name: s, slug: s.toLowerCase().replace(/[^a-z0-9]+/g, '-') }))
    };

    if (editingCategory && editingCategory._id) {
      await updateAdminCategoryApi(editingCategory._id, payload);
    } else if (editingCategory) {
      // Local fallback edit
      setCategories(prev => prev.map(c => c.name === editingCategory.name ? { ...c, ...payload } : c));
    } else {
      const res = await createAdminCategoryApi(payload);
      if (!res.category) {
        // Fallback local add if API is not persistent
        setCategories(prev => [...prev, { _id: `cat_${Date.now()}`, ...payload }]);
      }
    }

    setSubmitting(false);
    setIsModalOpen(false);
    loadCategories();
  };

  // Delete Category
  const handleDeleteCategory = async (cat) => {
    if (!canEdit) return;
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}" and all its subcategories?`)) return;

    if (cat._id) {
      await deleteAdminCategoryApi(cat._id);
    }
    setCategories(prev => prev.filter(c => (c._id ? c._id !== cat._id : c.name !== cat.name)));
    loadCategories();
  };

  // Quick Add Subcategory Inline
  const handleAddInlineSub = async (cat) => {
    const catId = cat._id || cat.name;
    const text = (inlineSubInput[catId] || '').trim();
    if (!text) return;

    const currentSubs = Array.isArray(cat.subCategories)
      ? cat.subCategories.map(s => (typeof s === 'string' ? s : s.name))
      : [];

    if (currentSubs.includes(text)) {
      setInlineSubInput(prev => ({ ...prev, [catId]: '' }));
      return;
    }

    const updatedSubs = [...currentSubs, text];

    if (cat._id) {
      await updateAdminCategoryApi(cat._id, {
        subCategories: updatedSubs.map(s => ({ name: s, slug: s.toLowerCase().replace(/[^a-z0-9]+/g, '-') }))
      });
    }

    setCategories(prev => prev.map(c => {
      const isMatch = c._id ? c._id === cat._id : c.name === cat.name;
      return isMatch
        ? { ...c, subCategories: updatedSubs.map(s => ({ name: s, slug: s.toLowerCase().replace(/[^a-z0-9]+/g, '-') })) }
        : c;
    }));

    setInlineSubInput(prev => ({ ...prev, [catId]: '' }));
  };

  // Quick Remove Subcategory Inline
  const handleRemoveInlineSub = async (cat, subName) => {
    if (!canEdit) return;
    const currentSubs = Array.isArray(cat.subCategories)
      ? cat.subCategories.map(s => (typeof s === 'string' ? s : s.name))
      : [];

    const updatedSubs = currentSubs.filter(s => s !== subName);

    if (cat._id) {
      await updateAdminCategoryApi(cat._id, {
        subCategories: updatedSubs.map(s => ({ name: s, slug: s.toLowerCase().replace(/[^a-z0-9]+/g, '-') }))
      });
    }

    setCategories(prev => prev.map(c => {
      const isMatch = c._id ? c._id === cat._id : c.name === cat.name;
      return isMatch
        ? { ...c, subCategories: updatedSubs.map(s => ({ name: s, slug: s.toLowerCase().replace(/[^a-z0-9]+/g, '-') })) }
        : c;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white rounded-3xl p-6 shadow-xs border border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-brand-yellow/20 text-brand-teal rounded-xl">
              <Layers size={20} />
            </span>
            <h1 className="font-display font-bold text-xl text-gray-900">
              Product Categories & Sub-Categories
            </h1>
          </div>
          <p className="text-xs text-gray-500">
            Add, update, or remove main categories and dynamic subcategories for marketplace catalog.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 bg-brand-yellow text-gray-900 rounded-xl font-bold text-xs hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs shrink-0"
          >
            <Plus size={16} />
            <span>Add New Category</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-brand-teal/10 text-brand-teal rounded-xl">
            <Layers size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Main Categories</p>
            <p className="text-xl font-extrabold text-gray-900">{totalCategories}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Tag size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Sub-Categories</p>
            <p className="text-xl font-extrabold text-gray-900">{totalSubCategories}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Percent size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">GST Tax Configured</p>
            <p className="text-xl font-extrabold text-gray-900">Active</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search category name or subcategory..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-brand-yellow outline-none"
          />
        </div>
      </div>

      {/* Categories Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCategories.map((cat, idx) => {
          const catId = cat._id || cat.name;
          const subList = Array.isArray(cat.subCategories)
            ? cat.subCategories.map(s => (typeof s === 'string' ? s : s.name))
            : [];
          const gstRate = cat.gstPercentage !== undefined ? cat.gstPercentage : 5;

          return (
            <div
              key={cat._id || cat.name || idx}
              className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200 space-y-5 hover:border-brand-teal/30 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Main Category Header */}
                <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-teal/10 text-brand-teal flex items-center justify-center font-extrabold text-lg shrink-0">
                      {cat.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                        <span>{cat.name}</span>
                        <span className="px-2 py-0.5 rounded-md bg-brand-teal/10 text-brand-teal text-[10px] font-bold">
                          GST: {gstRate}%
                        </span>
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {cat.description || `${subList.length} subcategories active`}
                      </p>
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-2 text-gray-500 hover:text-brand-teal hover:bg-brand-teal/5 rounded-xl transition-colors cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Subcategories Chip List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      Sub-Categories ({subList.length})
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {subList.map((sub, sIdx) => (
                      <span
                        key={sIdx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-800 text-xs font-bold border border-gray-200 group/sub"
                      >
                        <span>{sub}</span>
                        {canEdit && (
                          <button
                            onClick={() => handleRemoveInlineSub(cat, sub)}
                            className="text-gray-400 hover:text-rose-600 transition-colors cursor-pointer p-0.5 rounded-full hover:bg-rose-100"
                            title="Remove Subcategory"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </span>
                    ))}
                    {subList.length === 0 && (
                      <span className="text-xs italic text-gray-400">No subcategories defined yet.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Add Subcategory Inline Input */}
              {canEdit && (
                <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                  <input
                    type="text"
                    value={inlineSubInput[catId] || ''}
                    onChange={(e) => setInlineSubInput({ ...inlineSubInput, [catId]: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddInlineSub(cat);
                      }
                    }}
                    placeholder="+ Add sub-category name..."
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-yellow"
                  />
                  <button
                    onClick={() => handleAddInlineSub(cat)}
                    className="px-3.5 py-2 bg-brand-teal text-white rounded-xl font-bold text-xs hover:bg-teal-800 transition-colors cursor-pointer shrink-0"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal for Creating / Editing Category */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="font-display font-bold text-base text-gray-900 flex items-center gap-2">
                <FolderPlus size={18} className="text-brand-teal" />
                <span>{editingCategory ? 'Edit Category & Subcategories' : 'Add New Category'}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. School Uniform, Books, Footwear"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">GST Percentage (%) *</label>
                  <select
                    value={categoryForm.gstPercentage}
                    onChange={(e) => setCategoryForm({ ...categoryForm, gstPercentage: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="0">0% (Tax Free / Books)</option>
                    <option value="5">5% (Apparel / Uniforms)</option>
                    <option value="12">12% (Footwear & Stationery)</option>
                    <option value="18">18% (School Bags & Kits)</option>
                    <option value="28">28% (Luxury Goods)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category Icon</label>
                  <select
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="Shirt">Shirt / Uniform</option>
                    <option value="BookOpen">Book / Textbooks</option>
                    <option value="Edit3">Notebook & Pen</option>
                    <option value="Footprints">Footwear & Shoes</option>
                    <option value="ShoppingBag">School Bag & Kit</option>
                    <option value="Package">Package General</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description / Summary</label>
                <textarea
                  rows="2"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="e.g. Uniforms, readymade school wear, unstitched fabric and winter kits"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-yellow"
                />
              </div>

              {/* Subcategories List Manager inside Modal */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700">Sub-Categories List</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSubInput}
                    onChange={(e) => setNewSubInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubInModal();
                      }
                    }}
                    placeholder="Enter subcategory name..."
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubInModal}
                    className="px-3 py-2 bg-gray-800 text-white rounded-xl font-bold text-xs hover:bg-black transition-colors cursor-pointer"
                  >
                    + Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-200 mt-2">
                  {categoryForm.subCategories.map((sub, sIdx) => (
                    <span
                      key={sIdx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800"
                    >
                      <span>{sub}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubInModal(sub)}
                        className="text-gray-400 hover:text-rose-600 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {categoryForm.subCategories.length === 0 && (
                    <span className="text-xs text-gray-400 italic">No subcategories added yet.</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-brand-teal text-white rounded-xl font-bold text-xs hover:bg-teal-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : (editingCategory ? 'Update Category' : 'Create Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
