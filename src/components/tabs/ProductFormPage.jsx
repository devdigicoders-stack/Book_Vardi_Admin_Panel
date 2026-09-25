import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Plus,
  Trash2,
  UploadCloud,
  Check,
  Tag,
  DollarSign,
  Boxes,
  Eye,
  Info,
  ChevronDown,
  X,
  Sliders,
  ShieldCheck,
  CreditCard,
  Search,
  BookOpen,
  Layers3
} from 'lucide-react';
import { CATEGORIES } from '../../constants/categories';
import ImageUploadDropzone from '../common/ImageUploadDropzone';
import { resolveImageUrl, parseSizeVariants } from '../../utils/api';

// Universal Category Form Configuration Schema Matrix
export const CATEGORY_FORM_SCHEMA = {
  // 1. NCERT & Books
  ncert: {
    showMeterCalculation: false,
    showSizeChart: false,
    showGender: false,
    allowedScales: ['count', 'box', 'unit'],
    allowedPresets: ['book_sets', 'packaging']
  },
  practice_books: {
    showMeterCalculation: false,
    showSizeChart: false,
    showGender: false,
    allowedScales: ['count', 'box', 'unit'],
    allowedPresets: ['book_sets', 'packaging']
  },
  drawing_books: {
    showMeterCalculation: false,
    showSizeChart: false,
    showGender: false,
    allowedScales: ['count', 'box', 'unit'],
    allowedPresets: ['book_sets', 'packaging']
  },

  // 2. Notebooks & Stationery
  notebooks: {
    showMeterCalculation: false,
    showSizeChart: false,
    showGender: false,
    allowedScales: ['count', 'box', 'kg', 'unit'],
    allowedPresets: ['book_sets', 'weight', 'packaging']
  },
  writing: {
    showMeterCalculation: false,
    showSizeChart: false,
    showGender: false,
    allowedScales: ['count', 'box', 'unit'],
    allowedPresets: ['packaging']
  },
  drawing: {
    showMeterCalculation: false,
    showSizeChart: false,
    showGender: false,
    allowedScales: ['count', 'box', 'unit'],
    allowedPresets: ['packaging']
  },
  bottles: {
    showMeterCalculation: false,
    showSizeChart: false,
    showGender: false,
    allowedScales: ['unit', 'count', 'box'],
    allowedPresets: ['packaging']
  },
  bags: {
    showMeterCalculation: false,
    showSizeChart: false,
    showGender: true,
    allowedScales: ['unit', 'count', 'box'],
    allowedPresets: ['packaging']
  },

  // 3. Shoes & Socks
  shoes: {
    showMeterCalculation: false,
    showSizeChart: false,
    showGender: true,
    allowedScales: ['size', 'unit', 'count'],
    allowedPresets: ['standard']
  },

  // 4. Uniforms & Clothing
  uniforms: {
    showMeterCalculation: true,
    showSizeChart: true,
    showGender: true,
    allowedScales: ['size', 'meter', 'count', 'unit'],
    allowedPresets: ['standard', 'uniform_waist', 'meters', 'packaging']
  },
  rain_winter: {
    showMeterCalculation: true,
    showSizeChart: true,
    showGender: true,
    allowedScales: ['size', 'meter', 'count', 'unit'],
    allowedPresets: ['standard', 'uniform_waist', 'meters']
  },
  sports: {
    showMeterCalculation: true,
    showSizeChart: true,
    showGender: true,
    allowedScales: ['size', 'meter', 'count', 'unit'],
    allowedPresets: ['standard', 'uniform_waist', 'meters']
  }
};

export function getCategorySchema(categoryKey) {
  const cat = String(categoryKey || '').toLowerCase().trim();
  return CATEGORY_FORM_SCHEMA[cat] || {
    showMeterCalculation: true,
    showSizeChart: true,
    showGender: true,
    allowedScales: ['size', 'count', 'meter', 'kg', 'box', 'unit'],
    allowedPresets: ['standard', 'uniform_waist', 'book_sets', 'meters', 'weight', 'packaging']
  };
}

// Presets for Sizing & Measuring Matrix
const SIZE_PRESETS = [
  {
    id: 'standard',
    label: 'Apparel Standard (S - XXL)',
    scale: 'size',
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  },
  {
    id: 'uniform_waist',
    label: 'Uniform Waist / Chest (26 - 38)',
    scale: 'size',
    sizes: ['26', '28', '30', '32', '34', '36', '38']
  },
  {
    id: 'book_sets',
    label: 'Books & Counts (Single / Sets)',
    scale: 'count',
    sizes: ['1 Book', 'Set of 3 Books', 'Set of 5 Books', 'Set of 10 Books']
  },
  {
    id: 'meters',
    label: 'Fabric Length (Meters)',
    scale: 'meter',
    sizes: ['1 Meter', '2.5 Meters', '5 Meters', '10 Meters']
  },
  {
    id: 'weight',
    label: 'Weight (Grams / Kg)',
    scale: 'kg',
    sizes: ['250 Grams', '500 Grams', '1 Kg', '2 Kg', '5 Kg']
  },
  {
    id: 'packaging',
    label: 'Boxes & Bulk Packs',
    scale: 'box',
    sizes: ['1 Piece', 'Pack of 10', '1 Box (50 Pcs)', '1 Carton']
  }
];

const MEASURE_SCALES = [
  { id: 'size', label: 'Clothes & Shoes (Size: S, M, XL, 32)', defaultUnit: 'Size', placeholder: 'e.g. S, M, L, XL, 32, UK 8' },
  { id: 'count', label: 'Books & Sets (Count: 1 Book, Set of 5)', defaultUnit: 'Count', placeholder: 'e.g. 1 Book, Set of 3, Pack of 10' },
  { id: 'meter', label: 'Fabric & Materials (Meters / Yards)', defaultUnit: 'Meter', placeholder: 'e.g. 1 Meter, 2.5 Meters, 5 Meters' },
  { id: 'kg', label: 'Weight & Bulk (Kg / Grams)', defaultUnit: 'Kg', placeholder: 'e.g. 500 Grams, 1 Kg, 5 Kg' },
  { id: 'box', label: 'Packaging (Box / Carton / Pieces)', defaultUnit: 'Box', placeholder: 'e.g. 1 Box (50 Pcs), 1 Carton, 1 Piece' },
  { id: 'unit', label: 'General Unit (Pair, Pack, Set)', defaultUnit: 'Unit', placeholder: 'e.g. Pair, Pack, Roll, Dozen' }
];

export default function ProductFormPage({ product, sellers = [], existingProducts = [], onSave, onBack }) {
  const isEdit = Boolean(product);

  // Entry Type: 'single' (Standard product) or 'kit' (Kit / Bundle)
  const [entryType, setEntryType] = useState(() => {
    if (product?.category === 'kits' || product?.bundleType === 'kit' || (Array.isArray(product?.items) && product.items.length > 0)) {
      return 'kit';
    }
    return 'single';
  });

  // Kit Mode: 'existing' (bundle from catalog items) or 'scratch' (create kit from scratch)
  const [kitMode, setKitMode] = useState('existing');

  // Single Product Form Data
  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    price: '',
    originalPrice: '',
    category: 'uniforms',
    subCategory: '',
    gst: '5',
    isGstInclusive: true,
    schoolName: '',
    gender: 'Unisex',
    badge: '',
    stockQuantity: '',
    sellerId: '',
    sellerName: '',
    paymentMethodAllowed: 'Both',
    approvalStatus: 'Pending',
    approvalComment: '',
    description: '',
    sku: '',
    image: '',
    images: [],
    isMeterBased: false,
    minMeter: '0.5',
    meterStep: '0.5',
    isReturnable: true,
    returnWindowDays: '7',
    enableSizeChart: false,
    sizeChart: {
      chestInches: '',
      lengthInches: '',
      sleeveInches: '',
      waistInches: '',
      shoulderInches: '',
      sizeGuideText: '',
      rows: []
    }
  });

  // Dynamic Category Form Schema (Hides meter calculations/kg/size-charts for NCERT books & non-apparel)
  const categorySchema = getCategorySchema(formData.category);

  // Size / Scale Variants
  const [sizeVariants, setSizeVariants] = useState([]);

  // Modal for Adding / Editing a Single Variant
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [editingVariantIndex, setEditingVariantIndex] = useState(null);
  const [variantForm, setVariantForm] = useState({
    size: '',
    measureScale: 'size',
    measureValue: '',
    unit: 'Size',
    price: '',
    mrp: '',
    stock: '',
    sku: '',
    image: '',
    images: []
  });

  // Kit / Bundle Specific State
  const [kitData, setKitData] = useState({
    title: '',
    schoolName: '',
    classGrade: '',
    gender: 'Unisex',
    badgeTag: '',
    bundlePrice: '',
    totalMrp: '',
    stock: '',
    description: '',
    paymentMethodAllowed: 'Both',
    images: []
  });
  const [selectedKitProducts, setSelectedKitProducts] = useState([]); // Array of { productId, name, unitPrice, quantity, image }
  const [scratchKitItems, setScratchKitItems] = useState([
    { name: '', quantity: 1, unitPrice: '' }
  ]);
  const [catalogSearch, setCatalogSearch] = useState('');

  // Quick batch fill helpers
  const [batchBasePrice, setBatchBasePrice] = useState('');
  const [batchBaseMrp, setBatchBaseMrp] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'variants' | 'kit' | 'payment'

  // Initialize form
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (product) {
      const prodImages = Array.isArray(product.images) && product.images.length > 0
        ? product.images
        : (product.image ? [product.image] : []);

      setFormData({
        name: product.name || product.title || '',
        subtitle: product.subtitle || '',
        price: product.price !== undefined ? String(product.price) : '',
        originalPrice: product.originalPrice || product.mrp ? String(product.originalPrice || product.mrp) : '',
        category: product.category || 'uniforms',
        subCategory: product.subCategory || '',
        gst: product.gst !== undefined ? String(product.gst) : (product.gstPercentage !== undefined ? String(product.gstPercentage) : '5'),
        isGstInclusive: product.isGstInclusive !== undefined ? Boolean(product.isGstInclusive) : true,
        schoolName: product.schoolName || '',
        gender: product.gender || 'Unisex',
        badge: product.badge || product.badgeTag || 'NEW',
        stockQuantity: product.stockQuantity !== undefined ? String(product.stockQuantity) : (product.stock !== undefined ? String(product.stock) : '50'),
        sellerId: product.sellerId || 'self',
        sellerName: product.sellerName || 'Book Vardi Verified Seller',
        paymentMethodAllowed: product.paymentMethodAllowed || 'Both',
        approvalStatus: product.approvalStatus || 'Pending',
        approvalComment: product.approvalComment || '',
        description: product.description || '',
        sku: product.sku || '',
        image: prodImages[0] || product.image || '',
        images: prodImages,
        isMeterBased: Boolean(product.isMeterBased),
        minMeter: product.minMeter !== undefined ? String(product.minMeter) : '0.5',
        meterStep: product.meterStep !== undefined ? String(product.meterStep) : '0.5',
        isReturnable: product.isReturnable !== undefined ? Boolean(product.isReturnable) : true,
        returnWindowDays: product.returnWindowDays !== undefined ? String(product.returnWindowDays) : '7',
        enableSizeChart: Boolean(product.sizeChart && product.sizeChart.rows && product.sizeChart.rows.length > 0),
        sizeChart: (product.sizeChart && product.sizeChart.rows && product.sizeChart.rows.length > 0) ? product.sizeChart : {
          chestInches: '',
          lengthInches: '',
          sleeveInches: '',
          waistInches: '',
          shoulderInches: '',
          sizeGuideText: '',
          rows: [
            { size: 'S', chest: '36', length: '26', sleeve: '8', waist: '30', shoulder: '16' },
            { size: 'M', chest: '38', length: '27', sleeve: '8.5', waist: '32', shoulder: '17' },
            { size: 'L', chest: '40', length: '28', sleeve: '9', waist: '34', shoulder: '18' },
            { size: 'XL', chest: '42', length: '29', sleeve: '9.5', waist: '36', shoulder: '19' },
            { size: 'XXL', chest: '44', length: '30', sleeve: '10', waist: '38', shoulder: '20' }
          ]
        }
      });

      // Load sizeVariants safely via parseSizeVariants
      const parsedVariants = parseSizeVariants(product);
      if (parsedVariants.length > 0) {
        setSizeVariants(parsedVariants.map(v => ({
          size: v.size || v.measureValue || '',
          measureScale: v.measureScale || 'size',
          measureValue: v.measureValue || v.size || '',
          unit: v.unit || 'Size',
          price: v.price !== undefined ? String(v.price) : String(product.price || ''),
          mrp: v.mrp !== undefined ? String(v.mrp) : String(product.originalPrice || product.mrp || ''),
          stock: v.stock !== undefined ? String(v.stock) : '20',
          image: v.image || '',
          images: Array.isArray(v.images) ? v.images : (v.image ? [v.image] : []),
          sku: v.sku || (product.sku ? `${product.sku}-${v.size || v.measureValue}` : '')
        })));
      } else if (Array.isArray(product.sizes) && product.sizes.length > 0) {
        setSizeVariants(product.sizes.map(s => ({
          size: s,
          measureScale: 'size',
          measureValue: s,
          unit: 'Size',
          price: String(product.price || ''),
          mrp: String(product.originalPrice || product.mrp || ''),
          stock: '20',
          image: prodImages[0] || '',
          images: prodImages[0] ? [prodImages[0]] : [],
          sku: product.sku ? `${product.sku}-${s}` : ''
        })));
      } else {
        setSizeVariants([]);
      }

      // Initialize Kit specific data if editing a kit
      if (product.category === 'kits' || product.bundleType === 'kit' || Array.isArray(product.items)) {
        setKitData({
          title: product.title || product.name || '',
          schoolName: product.schoolName || '',
          classGrade: product.classGrade || 'Class 1-5',
          gender: product.gender || 'Unisex',
          badgeTag: product.badgeTag || 'School Approved',
          bundlePrice: product.bundlePrice !== undefined ? String(product.bundlePrice) : String(product.price || ''),
          totalMrp: product.totalMrp !== undefined ? String(product.totalMrp) : String(product.originalPrice || product.mrp || ''),
          stock: product.stock !== undefined ? String(product.stock) : '20',
          description: product.description || '',
          paymentMethodAllowed: product.paymentMethodAllowed || 'Both',
          images: prodImages
        });
        if (Array.isArray(product.items)) {
          setSelectedKitProducts(product.items.map(item => ({
            productId: item.productId || item.id,
            name: item.name,
            unitPrice: item.unitPrice || item.price || 0,
            quantity: item.quantity || 1,
            image: item.image || ''
          })));
        }
      }

    } else {
      const defaultSeller = sellers[0];
      setFormData({
        name: '',
        subtitle: '',
        price: '',
        originalPrice: '',
        category: 'uniforms',
        subCategory: '',
        schoolName: '',
        gender: 'Unisex',
        badge: '',
        stockQuantity: '',
        sellerId: 'self',
        sellerName: 'Book Vardi Verified Seller',
        paymentMethodAllowed: 'Both',
        approvalStatus: 'Approved',
        approvalComment: '',
        description: '',
        sku: '',
        image: '',
        images: []
      });
      setSizeVariants([]);
      setKitData({
        title: '',
        schoolName: '',
        classGrade: '',
        gender: 'Unisex',
        badgeTag: '',
        bundlePrice: '',
        totalMrp: '',
        stock: '',
        description: '',
        paymentMethodAllowed: 'Both',
        images: []
      });
    }
  }, [product, sellers]);

  // Open Variant Modal for Creating or Editing
  const openAddVariantModal = () => {
    const defaultPrice = formData.price || '';
    const defaultMrp = formData.originalPrice || '';
    setEditingVariantIndex(null);
    setVariantForm({
      size: '',
      measureScale: 'size',
      measureValue: '',
      unit: 'Size',
      price: defaultPrice,
      mrp: defaultMrp,
      stock: '',
      sku: '',
      image: formData.images[0] || '',
      images: formData.images.length > 0 ? [formData.images[0]] : []
    });
    setIsVariantModalOpen(true);
  };

  const openEditVariantModal = (index) => {
    const v = sizeVariants[index];
    setEditingVariantIndex(index);
    setVariantForm({
      size: v.size || v.measureValue || '',
      measureScale: v.measureScale || 'size',
      measureValue: v.measureValue || v.size || '',
      unit: v.unit || 'Size',
      price: v.price !== undefined ? String(v.price) : '',
      mrp: v.mrp !== undefined ? String(v.mrp) : '',
      stock: v.stock !== undefined ? String(v.stock) : '',
      sku: v.sku || '',
      image: v.image || '',
      images: Array.isArray(v.images) ? v.images : (v.image ? [v.image] : [])
    });
    setIsVariantModalOpen(true);
  };

  const handleSaveVariantModal = (e) => {
    e?.preventDefault();
    const val = (variantForm.measureValue || variantForm.size).trim();
    if (!val) {
      setError('Please provide a variant value (e.g., Size, Count, Meter, or Weight value).');
      return;
    }
    if (!variantForm.price || Number(variantForm.price) <= 0) {
      setError('Please enter a valid selling price for this variant.');
      return;
    }

    const newVariant = {
      size: val,
      measureScale: variantForm.measureScale,
      measureValue: val,
      unit: variantForm.unit,
      price: variantForm.price,
      mrp: variantForm.mrp || Math.round(Number(variantForm.price) * 1.25).toString(),
      stock: variantForm.stock || '25',
      sku: variantForm.sku || `SKU-${val}`,
      image: variantForm.images[0] || variantForm.image || '',
      images: variantForm.images
    };

    if (editingVariantIndex !== null) {
      setSizeVariants(prev => {
        const copy = [...prev];
        copy[editingVariantIndex] = newVariant;
        return copy;
      });
    } else {
      setSizeVariants(prev => [...prev, newVariant]);
    }

    setIsVariantModalOpen(false);
    setError('');
  };

  const handleRemoveVariant = (index) => {
    setSizeVariants(prev => prev.filter((_, i) => i !== index));
  };

  // Apply Quick Size Preset
  const applySizePreset = (preset) => {
    const defaultPrice = formData.price || '499';
    const defaultMrp = formData.originalPrice || Math.round(Number(defaultPrice || 499) * 1.25).toString();
    const defaultImage = formData.images[0] || formData.image || '';

    const newVariants = preset.sizes.map(sz => {
      const existing = sizeVariants.find(v => (v.size || v.measureValue || '').toLowerCase() === sz.toLowerCase());
      if (existing) return existing;
      return {
        size: sz,
        measureScale: preset.scale,
        measureValue: sz,
        unit: preset.scale.toUpperCase(),
        price: defaultPrice,
        mrp: defaultMrp,
        stock: '25',
        image: defaultImage,
        images: defaultImage ? [defaultImage] : [],
        sku: formData.sku ? `${formData.sku}-${sz}` : `SKU-${sz}`
      };
    });

    setSizeVariants(newVariants);
  };

  // Kit Creation Helpers
  const handleAddProductToKit = (p) => {
    if (selectedKitProducts.some(item => String(item.productId) === String(p.id || p._id))) return;
    const newItem = {
      productId: p.id || p._id,
      name: p.name || p.title,
      unitPrice: Number(p.price) || 0,
      quantity: 1,
      image: p.image || ''
    };
    setSelectedKitProducts(prev => [...prev, newItem]);
  };

  const handleRemoveProductFromKit = (productId) => {
    setSelectedKitProducts(prev => prev.filter(item => String(item.productId) !== String(productId)));
  };

  const handleUpdateKitProductQty = (productId, qty) => {
    const numQty = Math.max(1, Number(qty) || 1);
    setSelectedKitProducts(prev => prev.map(item => {
      if (String(item.productId) === String(productId)) {
        return { ...item, quantity: numQty };
      }
      return item;
    }));
  };

  // Auto-calculated totals for Kit Mode A
  const calculatedKitMrp = selectedKitProducts.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (entryType === 'single') {
      if (!formData.name.trim()) {
        setError('Please provide a product title');
        setActiveTab('general');
        return;
      }

      if (sizeVariants.length > 0) {
        for (const variant of sizeVariants) {
          if (!variant.price || Number(variant.price) <= 0) {
            setError(`Please specify a valid selling price for variant "${variant.size || variant.measureValue}".`);
            setActiveTab('variants');
            return;
          }
        }
      } else {
        if (!formData.price || Number(formData.price) <= 0) {
          setError('Please specify a valid base selling price.');
          setActiveTab('general');
          return;
        }
      }

      setSubmitting(true);
      try {
        const validPrices = sizeVariants.map(v => Number(v.price)).filter(p => !isNaN(p) && p > 0);
        const minVariantPrice = validPrices.length > 0 ? Math.min(...validPrices) : Number(formData.price);
        const totalVariantStock = sizeVariants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

        const finalImages = (formData.images && formData.images.length > 0)
          ? formData.images
          : (formData.image ? [formData.image] : []);
        const primaryImg = finalImages[0] || '';

        const paymentAllowedStr = formData.paymentMethodAllowed || 'Both';
        const paymentAllowedArr = paymentAllowedStr === 'Online_Only' 
          ? ['Online'] 
          : (paymentAllowedStr === 'COD_Only' ? ['COD'] : ['COD', 'Online']);

        const payload = {
          ...formData,
          bundleType: 'single',
          price: sizeVariants.length > 0 ? minVariantPrice : Number(formData.price),
          originalPrice: Number(formData.originalPrice) || Math.round(minVariantPrice * 1.25),
          mrp: Number(formData.originalPrice) || Math.round(minVariantPrice * 1.25),
          stockQuantity: sizeVariants.length > 0 ? totalVariantStock : Number(formData.stockQuantity || 0),
          stock: sizeVariants.length > 0 ? totalVariantStock : Number(formData.stockQuantity || 0),
          image: primaryImg,
          images: finalImages,
          paymentMethodAllowed: paymentAllowedStr,
          paymentMethodsAllowed: paymentAllowedArr,
          isMeterBased: Boolean(formData.isMeterBased),
          minMeter: Number(formData.minMeter) || 0.5,
          meterStep: Number(formData.meterStep) || 0.5,
          unit: formData.isMeterBased ? 'meter' : (formData.unit || 'piece'),
          isReturnable: Boolean(formData.isReturnable),
          returnWindowDays: Number(formData.returnWindowDays) || 7,
          sizeChart: formData.enableSizeChart ? formData.sizeChart : { rows: [] },
          sizes: sizeVariants.map(v => v.size || v.measureValue),
          sizeVariants: sizeVariants.map(v => ({
            size: v.size || v.measureValue,
            measureScale: v.measureScale || 'size',
            measureValue: v.measureValue || v.size,
            unit: v.unit || 'Size',
            price: Number(v.price) || minVariantPrice,
            mrp: Number(v.mrp || v.originalPrice) || Math.round(minVariantPrice * 1.25),
            originalPrice: Number(v.originalPrice || v.mrp) || Math.round(minVariantPrice * 1.25),
            stock: Number(v.stock) || 0,
            stockQuantity: Number(v.stockQuantity || v.stock) || 0,
            image: v.image || primaryImg,
            images: Array.isArray(v.images) && v.images.length > 0 ? v.images : [v.image || primaryImg],
            sku: v.sku || `${formData.sku}-${v.size}`
          })),
          variants: sizeVariants.map(v => ({
            size: v.size || v.measureValue,
            measureScale: v.measureScale || 'size',
            measureValue: v.measureValue || v.size,
            unit: v.unit || 'Size',
            price: Number(v.price) || minVariantPrice,
            mrp: Number(v.mrp || v.originalPrice) || Math.round(minVariantPrice * 1.25),
            originalPrice: Number(v.originalPrice || v.mrp) || Math.round(minVariantPrice * 1.25),
            stock: Number(v.stock) || 0,
            stockQuantity: Number(v.stockQuantity || v.stock) || 0,
            image: v.image || primaryImg,
            images: Array.isArray(v.images) && v.images.length > 0 ? v.images : [v.image || primaryImg],
            sku: v.sku || `${formData.sku}-${v.size}`
          }))
        };

        await onSave(payload);
        onBack();
      } catch (err) {
        setError(err?.message || 'Failed to save product catalog entry.');
      } finally {
        setSubmitting(false);
      }

    } else {
      // Kit / Bundle Submission
      if (!kitData.title.trim()) {
        setError('Please provide a title for the Kit Bundle.');
        setActiveTab('kit');
        return;
      }

      let finalKitItems = [];
      let finalTotalMrp = 0;

      if (kitMode === 'existing') {
        if (selectedKitProducts.length === 0) {
          setError('Please add at least one catalog product to the Kit Bundle.');
          setActiveTab('kit');
          return;
        }
        finalKitItems = selectedKitProducts.map(item => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity
        }));
        finalTotalMrp = calculatedKitMrp;
      } else {
        const validScratchItems = scratchKitItems.filter(i => i.name.trim() !== '');
        if (validScratchItems.length === 0) {
          setError('Please add at least one line item to the kit.');
          setActiveTab('kit');
          return;
        }
        finalKitItems = validScratchItems.map(item => ({
          name: item.name,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          totalPrice: (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1)
        }));
        finalTotalMrp = finalKitItems.reduce((sum, i) => sum + i.totalPrice, 0);
      }

      const finalBundlePrice = Number(kitData.bundlePrice) || Math.round(finalTotalMrp * 0.85);

      setSubmitting(true);
      try {
        const finalImages = (kitData.images && kitData.images.length > 0)
          ? kitData.images
          : (formData.images && formData.images.length > 0 ? formData.images : (formData.image ? [formData.image] : []));

        const paymentAllowedStr = kitData.paymentMethodAllowed || 'Both';
        const paymentAllowedArr = paymentAllowedStr === 'Online_Only' 
          ? ['Online'] 
          : (paymentAllowedStr === 'COD_Only' ? ['COD'] : ['COD', 'Online']);

        const payload = {
          name: kitData.title,
          title: kitData.title,
          category: 'kits',
          bundleType: 'kit',
          schoolName: kitData.schoolName,
          classGrade: kitData.classGrade,
          gender: kitData.gender,
          badgeTag: kitData.badgeTag,
          badge: kitData.badgeTag,
          items: finalKitItems,
          totalMrp: finalTotalMrp,
          bundlePrice: finalBundlePrice,
          price: finalBundlePrice,
          originalPrice: finalTotalMrp,
          mrp: finalTotalMrp,
          stock: Number(kitData.stock) || 20,
          stockQuantity: Number(kitData.stock) || 20,
          description: kitData.description,
          image: finalImages[0],
          images: finalImages,
          paymentMethodAllowed: paymentAllowedStr,
          paymentMethodsAllowed: paymentAllowedArr,
          sellerId: formData.sellerId,
          sellerName: formData.sellerName
        };

        await onSave(payload);
        onBack();
      } catch (err) {
        setError(err?.message || 'Failed to save Kit Bundle.');
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-28">
      {/* Top Header & Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Return to Catalog"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-teal">
                  Catalog Manager
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-xs text-gray-500">
                  {isEdit ? 'Modify Entry' : 'New Listing Entry'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
                {isEdit ? `Edit: ${formData.name || kitData.title || 'Item'}` : 'Create Listing Entry'}
              </h1>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2.2 text-xs font-bold bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              <span>{submitting ? 'Saving...' : (isEdit ? 'Save Changes' : 'Publish Entry')}</span>
            </button>
          </div>
        </div>

        {/* ENTRY TYPE SWITCHER: Single Product vs Kit / Bundle */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3">
          <div className="p-1.5 bg-gray-100/80 rounded-2xl inline-flex items-center gap-2 border border-gray-200">
            <button
              type="button"
              onClick={() => {
                setEntryType('single');
                setActiveTab('general');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                entryType === 'single'
                  ? 'bg-brand-teal text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package size={15} />
              <span>Standard Product (With Variants)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEntryType('kit');
                setActiveTab('kit');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                entryType === 'kit'
                  ? 'bg-brand-teal text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Layers3 size={15} />
              <span>Kit / Bundle Package (Multi-Item)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Form Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {entryType === 'single' ? (
          <div className="flex border-b border-gray-200 gap-6">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'general'
                  ? 'border-brand-teal text-brand-teal'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Package size={17} />
              <span>1. Base Details & Photos</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('variants')}
              className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'variants'
                  ? 'border-brand-teal text-brand-teal'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Sliders size={17} />
              <span>2. Measuring Scale Variants ({sizeVariants.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payment')}
              className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'payment'
                  ? 'border-brand-teal text-brand-teal'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <CreditCard size={17} />
              <span>3. Allowed Payment Methods</span>
            </button>
          </div>
        ) : (
          <div className="flex border-b border-gray-200 gap-6">
            <button
              type="button"
              onClick={() => setActiveTab('kit')}
              className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'kit'
                  ? 'border-brand-teal text-brand-teal'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Layers3 size={17} />
              <span>1. Kit Bundle Configuration</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payment')}
              className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'payment'
                  ? 'border-brand-teal text-brand-teal'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <CreditCard size={17} />
              <span>2. Allowed Payment Methods</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Form Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
            <AlertCircle size={20} className="shrink-0 text-red-500" />
            <div className="flex-1 font-medium">{error}</div>
            <button type="button" onClick={() => setError('')} className="text-red-400 hover:text-red-700 cursor-pointer">
              <X size={16} />
            </button>
          </div>
        )}

        {/* SINGLE PRODUCT ENTRY */}
        {entryType === 'single' && (
          <div className="space-y-6">
            
            {/* TAB 1: BASE DETAILS & PHOTOS */}
            {activeTab === 'general' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200 space-y-4">
                    <h2 className="font-display font-bold text-base text-gray-900 border-b border-gray-100 pb-3">
                      Basic Information
                    </h2>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Product Title *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Oxford Blue Unisex School Uniform Shirt"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Primary Category *</label>
                        <select
                          value={formData.category}
                          onChange={e => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden capitalize"
                        >
                          {CATEGORIES.map((c, idx) => {
                            const catId = typeof c === 'string' ? c : (c.id || c.name || `cat-${idx}`);
                            const catName = typeof c === 'string' ? c : (c.name || c.label || c.id);
                            return (
                              <option key={catId} value={catId}>
                                {catName}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Sub-Category</label>
                        <input
                          type="text"
                          value={formData.subCategory}
                          onChange={e => setFormData({ ...formData, subCategory: e.target.value })}
                          placeholder="e.g. Shirts, Practice Books, Pencils"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Default Base Price (₹) *</label>
                        <input
                          type="number"
                          value={formData.price}
                          onChange={e => setFormData({ ...formData, price: e.target.value })}
                          placeholder="499"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Default Base MRP (₹)</label>
                        <input
                          type="number"
                          value={formData.originalPrice}
                          onChange={e => setFormData({ ...formData, originalPrice: e.target.value })}
                          placeholder="699"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Default Base Stock (Qty) *</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.stockQuantity}
                          onChange={e => setFormData({ ...formData, stockQuantity: e.target.value, stock: e.target.value })}
                          placeholder="50"
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:ring-2 focus:ring-brand-yellow outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">GST Rate (%) *</label>
                        <select
                          value={formData.gst}
                          onChange={e => setFormData({ ...formData, gst: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold bg-white focus:ring-2 focus:ring-brand-yellow outline-hidden cursor-pointer"
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">GST Included in Price?</label>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, isGstInclusive: !prev.isGstInclusive }))}
                          className={`w-full px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs ${
                            formData.isGstInclusive
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                              : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                          }`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${formData.isGstInclusive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                          <span>{formData.isGstInclusive ? 'GST Included' : 'GST Extra (+ Tax)'}</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Product Description</label>
                      <textarea
                        rows={3}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Provide details about fabric, wash instructions, book page count, etc."
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-brand-yellow outline-hidden resize-none"
                      />
                    </div>
                  </div>

                  {/* Base Product Media Dropzone */}
                  <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200 space-y-4">
                    <h2 className="font-display font-bold text-base text-gray-900 border-b border-gray-100 pb-3">
                      Base Product Media Gallery
                    </h2>
                    <ImageUploadDropzone
                      images={formData.images}
                      onChange={(newImgs) => setFormData({ ...formData, images: newImgs, image: newImgs[0] || '' })}
                      maxImages={8}
                      helperText="Drag & drop primary product cover photos here"
                    />
                  </div>
                </div>

                {/* Right Column Meta */}
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200 space-y-4">
                    <h3 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-3">Merchant & Meta</h3>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Assigned Seller / Merchant *</label>
                      <select
                        value={formData.sellerId || 'self'}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === 'self') {
                            setFormData({
                              ...formData,
                              sellerId: 'self',
                              sellerName: 'Book Vardi Verified Seller'
                            });
                          } else {
                            const found = sellers.find(s => String(s.id || s._id) === String(val));
                            setFormData({
                              ...formData,
                              sellerId: val,
                              sellerName: found ? (found.storeName || (typeof found.name === 'string' ? found.name : 'Partner Merchant') || 'Partner Merchant') : 'Partner Merchant'
                            });
                          }
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-800 bg-white focus:ring-2 focus:ring-brand-yellow outline-hidden cursor-pointer"
                      >
                        <option value="self">🏢 Self (Book Vardi Direct / In-House Store)</option>
                        {sellers.map(s => (
                          <option key={s.id || s._id} value={s.id || s._id}>
                            🏪 {s.storeName || (typeof s.name === 'string' ? s.name : 'Merchant')} ({s.sellerPhone || s.email || 'Partner Merchant'})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Target School / Institution</label>
                      <input
                        type="text"
                        value={formData.schoolName}
                        onChange={e => setFormData({ ...formData, schoolName: e.target.value })}
                        placeholder="e.g. Delhi Public School / All"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-medium outline-hidden"
                      />
                    </div>
                    {categorySchema.showGender && (
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Target Gender</label>
                        <select
                          value={formData.gender || 'Unisex'}
                          onChange={e => setFormData({ ...formData, gender: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-brand-yellow outline-hidden cursor-pointer"
                        >
                          <option value="Unisex">👫 Unisex (All Students)</option>
                          <option value="Boys">👦 Boys</option>
                          <option value="Girls">👧 Girls</option>
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Product SKU</label>
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={e => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="e.g. BV-SHIRT-101"
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-mono font-medium outline-hidden"
                      />
                    </div>
                  </div>

                  {/* 1. Meter-wise Quantity Configuration (Only shown for Fabric / Clothing categories) */}
                  {categorySchema.showMeterCalculation && (
                    <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-gray-900">
                          <input
                            type="checkbox"
                            checked={formData.isMeterBased}
                            onChange={e => setFormData({ ...formData, isMeterBased: e.target.checked })}
                            className="w-4 h-4 rounded text-brand-teal focus:ring-brand-teal cursor-pointer"
                          />
                          <span>Fabric / Meter-wise Product (Sold in meters e.g. 2.5m, 5m)</span>
                        </label>
                      </div>
                      {formData.isMeterBased && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-teal-100">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">Minimum Meter Quantity</label>
                            <input
                              type="number"
                              step="0.1"
                              value={formData.minMeter}
                              onChange={e => setFormData({ ...formData, minMeter: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                              placeholder="0.5"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">Meter Increment Step</label>
                            <input
                              type="number"
                              step="0.1"
                              value={formData.meterStep}
                              onChange={e => setFormData({ ...formData, meterStep: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                              placeholder="0.5"
                            />
                          </div>
                          <p className="text-[11px] text-gray-500 sm:col-span-2">
                            Customers will be able to input custom decimal quantities (e.g. 2.5 Meters) directly on the product detail page.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. Return Policy Settings */}
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-gray-900">
                        <input
                          type="checkbox"
                          checked={formData.isReturnable}
                          onChange={e => setFormData({ ...formData, isReturnable: e.target.checked })}
                          className="w-4 h-4 rounded text-brand-teal focus:ring-brand-teal cursor-pointer"
                        />
                        <span>Product is Returnable / Exchangeable</span>
                      </label>
                    </div>
                    {formData.isReturnable ? (
                      <div className="pt-2 border-t border-gray-200">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">Return Window (Days)</label>
                        <input
                          type="number"
                          value={formData.returnWindowDays}
                          onChange={e => setFormData({ ...formData, returnWindowDays: e.target.value })}
                          className="w-48 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                          placeholder="7"
                        />
                      </div>
                    ) : (
                      <p className="text-[11px] text-amber-700 font-medium">
                        This product will be marked as "Non-Returnable" on the storefront.
                      </p>
                    )}
                  </div>

                  {/* 3. Apparel Size Chart Editor (Only shown for Clothing & Uniforms) */}
                  {categorySchema.showSizeChart && (
                    <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-gray-900">
                          <input
                            type="checkbox"
                            checked={formData.enableSizeChart}
                            onChange={e => setFormData({ ...formData, enableSizeChart: e.target.checked })}
                            className="w-4 h-4 rounded text-brand-teal focus:ring-brand-teal cursor-pointer"
                          />
                          <span>Include Size Chart / Measurement Guide (Clothing & Uniforms)</span>
                        </label>
                      </div>

                      {formData.enableSizeChart && (
                      <div className="space-y-3 pt-3 border-t border-indigo-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-indigo-950">Size Chart Matrix (Inches)</span>
                          <button
                            type="button"
                            onClick={() => {
                              const rows = formData.sizeChart?.rows || [];
                              setFormData({
                                ...formData,
                                sizeChart: {
                                  ...formData.sizeChart,
                                  rows: [...rows, { size: '', chest: '', length: '', sleeve: '', waist: '', shoulder: '' }]
                                }
                              });
                            }}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                          >
                            + Add Size Row
                          </button>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-indigo-200 bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-indigo-100/70 text-indigo-950 font-bold uppercase text-[10px]">
                              <tr>
                                <th className="p-2">Size</th>
                                <th className="p-2">Chest (in)</th>
                                <th className="p-2">Length (in)</th>
                                <th className="p-2">Sleeve (in)</th>
                                <th className="p-2">Waist (in)</th>
                                <th className="p-2">Shoulder (in)</th>
                                <th className="p-2 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-indigo-100">
                              {(formData.sizeChart?.rows || []).map((row, idx) => (
                                <tr key={idx}>
                                  <td className="p-1.5">
                                    <input
                                      type="text"
                                      value={row.size}
                                      onChange={e => {
                                        const rows = [...(formData.sizeChart?.rows || [])];
                                        rows[idx].size = e.target.value;
                                        setFormData({ ...formData, sizeChart: { ...formData.sizeChart, rows } });
                                      }}
                                      placeholder="e.g. S"
                                      className="w-16 px-2 py-1 border border-gray-200 rounded font-bold text-xs"
                                    />
                                  </td>
                                  <td className="p-1.5">
                                    <input
                                      type="text"
                                      value={row.chest}
                                      onChange={e => {
                                        const rows = [...(formData.sizeChart?.rows || [])];
                                        rows[idx].chest = e.target.value;
                                        setFormData({ ...formData, sizeChart: { ...formData.sizeChart, rows } });
                                      }}
                                      placeholder='36"'
                                      className="w-16 px-2 py-1 border border-gray-200 rounded text-xs"
                                    />
                                  </td>
                                  <td className="p-1.5">
                                    <input
                                      type="text"
                                      value={row.length}
                                      onChange={e => {
                                        const rows = [...(formData.sizeChart?.rows || [])];
                                        rows[idx].length = e.target.value;
                                        setFormData({ ...formData, sizeChart: { ...formData.sizeChart, rows } });
                                      }}
                                      placeholder='26"'
                                      className="w-16 px-2 py-1 border border-gray-200 rounded text-xs"
                                    />
                                  </td>
                                  <td className="p-1.5">
                                    <input
                                      type="text"
                                      value={row.sleeve}
                                      onChange={e => {
                                        const rows = [...(formData.sizeChart?.rows || [])];
                                        rows[idx].sleeve = e.target.value;
                                        setFormData({ ...formData, sizeChart: { ...formData.sizeChart, rows } });
                                      }}
                                      placeholder='8"'
                                      className="w-16 px-2 py-1 border border-gray-200 rounded text-xs"
                                    />
                                  </td>
                                  <td className="p-1.5">
                                    <input
                                      type="text"
                                      value={row.waist}
                                      onChange={e => {
                                        const rows = [...(formData.sizeChart?.rows || [])];
                                        rows[idx].waist = e.target.value;
                                        setFormData({ ...formData, sizeChart: { ...formData.sizeChart, rows } });
                                      }}
                                      placeholder='30"'
                                      className="w-16 px-2 py-1 border border-gray-200 rounded text-xs"
                                    />
                                  </td>
                                  <td className="p-1.5">
                                    <input
                                      type="text"
                                      value={row.shoulder}
                                      onChange={e => {
                                        const rows = [...(formData.sizeChart?.rows || [])];
                                        rows[idx].shoulder = e.target.value;
                                        setFormData({ ...formData, sizeChart: { ...formData.sizeChart, rows } });
                                      }}
                                      placeholder='16"'
                                      className="w-16 px-2 py-1 border border-gray-200 rounded text-xs"
                                    />
                                  </td>
                                  <td className="p-1.5 text-right">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const rows = (formData.sizeChart?.rows || []).filter((_, i) => i !== idx);
                                        setFormData({ ...formData, sizeChart: { ...formData.sizeChart, rows } });
                                      }}
                                      className="text-red-600 hover:text-red-800 text-xs font-bold p-1 cursor-pointer"
                                    >
                                      ✕
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: MEASURING SCALE VARIANTS (+ ADD VARIANT FORM / MODAL) */}
            {activeTab === 'variants' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-gray-100">
                    <div>
                      <h2 className="font-display font-bold text-base text-gray-900 flex items-center gap-2">
                        <Sliders className="text-brand-teal" size={18} />
                        Variants & Multi-Category Measuring Scales
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Define product variants in Size (Clothes), Count (Books), Meter (Fabrics), Kg (Weight), or Box (Packaging) with individual images.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={openAddVariantModal}
                      className="px-4 py-2.5 bg-brand-teal hover:bg-brand-teal-dark text-white rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <Plus size={16} />
                      <span>+ Add Variant</span>
                    </button>
                  </div>

                  {/* 1-Click Preset Bar */}
                  <div className="pt-4 pb-5 border-b border-gray-100 space-y-2">
                    <span className="text-[11px] font-extrabold uppercase text-gray-400">1-Click Category Presets</span>
                    <div className="flex flex-wrap gap-2">
                      {SIZE_PRESETS.filter(p => categorySchema.allowedPresets.includes(p.id)).map(preset => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applySizePreset(preset)}
                          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-teal-50 hover:text-brand-teal text-gray-700 text-xs font-bold border border-gray-200 transition-colors cursor-pointer"
                        >
                          + {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Variants List Table */}
                  {sizeVariants.length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 my-4 space-y-3">
                      <Boxes className="mx-auto text-gray-400" size={32} />
                      <h4 className="text-sm font-bold text-gray-800">No Variants Added Yet</h4>
                      <p className="text-xs text-gray-500 max-w-md mx-auto">
                        Click the <strong>"+ Add Variant"</strong> button above to open the form and add custom size, count, meter, or weight variants with individual photos.
                      </p>
                      <button
                        type="button"
                        onClick={openAddVariantModal}
                        className="px-4 py-2 bg-brand-yellow text-brand-teal-dark font-extrabold text-xs rounded-xl cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Plus size={15} />
                        <span>Add First Variant</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-4">
                      {/* Variant Preview Image Layout in Row */}
                      <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                        {sizeVariants.map((v, vIdx) => {
                          const vImgUrl = v.image ? resolveImageUrl(v.image) : '';
                          const vVal = v.size || v.measureValue || `Variant #${vIdx + 1}`;

                          return (
                            <div
                              key={vIdx}
                              onClick={() => openEditVariantModal(vIdx)}
                              className="flex items-center gap-2.5 p-2 rounded-xl bg-teal-50/70 hover:bg-teal-100/80 border border-teal-200/80 shrink-0 min-w-[175px] cursor-pointer transition-all shadow-2xs"
                              title="Click to edit this variant"
                            >
                              <div className="relative w-12 h-12 rounded-lg bg-teal-100 text-teal-950 font-bold text-xs flex items-center justify-center shrink-0 border border-teal-200 overflow-hidden">
                                {vImgUrl ? (
                                  <img
                                    src={vImgUrl}
                                    alt={vVal}
                                    className="w-full h-full object-cover relative z-10"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                ) : null}
                                <span className="select-none absolute z-0">{vVal.slice(0, 3)}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-extrabold text-xs text-gray-900 truncate">{vVal}</div>
                                <div className="text-[11px] font-bold text-teal-800 flex items-center gap-1 mt-0.5">
                                  <span>₹{v.price}</span>
                                  {v.mrp && Number(v.mrp) > Number(v.price) && (
                                    <span className="text-[9px] text-gray-400 line-through">₹{v.mrp}</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                                  {v.stock || 0} pcs in stock
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-gray-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="px-4 py-3">Variant / Scale Value</th>
                            <th className="px-4 py-3">Scale Type</th>
                            <th className="px-4 py-3">Selling Price (₹)</th>
                            <th className="px-4 py-3">MRP (₹)</th>
                            <th className="px-4 py-3">Stock</th>
                            <th className="px-4 py-3">Variant Photo</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white font-medium">
                          {sizeVariants.map((v, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                              <td className="px-4 py-3 font-bold text-gray-900">
                                {v.size || v.measureValue}
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 font-bold text-[10px] uppercase border border-teal-200">
                                  {v.measureScale || 'size'}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-extrabold text-gray-900">₹{v.price}</td>
                              <td className="px-4 py-3 text-gray-500 line-through">₹{v.mrp}</td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  min="0"
                                  value={v.stock !== undefined ? v.stock : (v.stockQuantity !== undefined ? v.stockQuantity : '')}
                                  onChange={(e) => {
                                    const newStock = e.target.value;
                                    setSizeVariants(prev => prev.map((item, i) => i === idx ? { ...item, stock: newStock, stockQuantity: newStock } : item));
                                  }}
                                  className="w-20 px-2 py-1 bg-teal-50 border border-teal-300 rounded-lg text-xs font-bold text-teal-900 text-center outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                                  title="Edit variant stock quantity"
                                />
                              </td>
                              <td className="px-4 py-3">
                                {v.image ? (
                                  <img src={resolveImageUrl(v.image)} alt={v.size} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                                ) : (
                                  <span className="text-[10px] text-gray-400 italic">Base photo</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right space-x-2">
                                <button
                                  type="button"
                                  onClick={() => openEditVariantModal(idx)}
                                  className="text-xs font-bold text-brand-teal hover:underline cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVariant(idx)}
                                  className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* KIT / BUNDLE ENTRY FORM */}
        {entryType === 'kit' && activeTab === 'kit' && (
          <div className="space-y-6">
            
            {/* Mode Switcher for Kit */}
            <div className="bg-white p-6 rounded-3xl shadow-xs border border-gray-200 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="font-display font-bold text-base text-gray-900 flex items-center gap-2">
                  <Layers3 className="text-brand-teal" size={18} />
                  Kit / Bundle Creation Mode
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setKitMode('existing')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                    kitMode === 'existing'
                      ? 'border-brand-teal bg-brand-teal/5 ring-2 ring-brand-teal/10'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <Package className="text-brand-teal shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-bold text-xs text-gray-900">Option A: Bundle Existing Catalog Products</h4>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                      Pick items directly from your catalog, set quantities per item, and configure a bundle price.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => setKitMode('scratch')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                    kitMode === 'scratch'
                      ? 'border-brand-teal bg-brand-teal/5 ring-2 ring-brand-teal/10'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <BookOpen className="text-brand-teal shrink-0 mt-0.5" size={20} />
                  <div>
                    <h4 className="font-bold text-xs text-gray-900">Option B: Create Kit from Scratch</h4>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                      Manually type line item names, unit prices, and quantities without individual product variants.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Kit Details Card */}
            <div className="bg-white p-6 rounded-3xl shadow-xs border border-gray-200 space-y-4">
              <h2 className="font-display font-bold text-base text-gray-900 border-b border-gray-100 pb-3">
                Kit Identity & Pricing
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kit Bundle Title *</label>
                  <input
                    type="text"
                    required
                    value={kitData.title}
                    onChange={e => setKitData({ ...kitData, title: e.target.value })}
                    placeholder="e.g. DPS Class 5 Complete Academic Uniform & Stationery Kit"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-medium outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">School Name *</label>
                  <input
                    type="text"
                    required
                    value={kitData.schoolName}
                    onChange={e => setKitData({ ...kitData, schoolName: e.target.value })}
                    placeholder="e.g. Delhi Public School"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-medium outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Target Class / Grade</label>
                  <input
                    type="text"
                    value={kitData.classGrade}
                    onChange={e => setKitData({ ...kitData, classGrade: e.target.value })}
                    placeholder="e.g. Class 1-5"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-medium outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Bundle Discounted Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={kitData.bundlePrice}
                    onChange={e => setKitData({ ...kitData, bundlePrice: e.target.value })}
                    placeholder={calculatedKitMrp ? `Suggested: ₹${Math.round(calculatedKitMrp * 0.85)}` : '1299'}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-bold outline-hidden text-emerald-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Available Kit Stock</label>
                  <input
                    type="number"
                    value={kitData.stock}
                    onChange={e => setKitData({ ...kitData, stock: e.target.value })}
                    placeholder="20"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-medium outline-hidden"
                  />
                </div>
              </div>

              {/* Kit Items List Selector (Existing Mode) */}
              {kitMode === 'existing' && (
                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs text-gray-900">Kit Bundled Products ({selectedKitProducts.length})</h3>
                    <span className="text-xs font-extrabold text-brand-teal">
                      Summed Item Total MRP: ₹{calculatedKitMrp}
                    </span>
                  </div>

                  {/* Picked Items Table */}
                  {selectedKitProducts.length > 0 && (
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="px-3 py-2">Product Name</th>
                            <th className="px-3 py-2 w-24">Unit Price</th>
                            <th className="px-3 py-2 w-24">Quantity</th>
                            <th className="px-3 py-2 w-24">Subtotal</th>
                            <th className="px-3 py-2 text-right w-16">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {selectedKitProducts.map((item, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2.5 font-bold text-gray-900">{item.name}</td>
                              <td className="px-3 py-2.5 text-gray-600">₹{item.unitPrice}</td>
                              <td className="px-3 py-2.5">
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={e => handleUpdateKitProductQty(item.productId, e.target.value)}
                                  className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-xs font-bold text-center"
                                />
                              </td>
                              <td className="px-3 py-2.5 font-extrabold text-brand-teal">₹{item.unitPrice * item.quantity}</td>
                              <td className="px-3 py-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProductFromKit(item.productId)}
                                  className="text-red-500 hover:text-red-700 font-bold text-xs"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Catalog Picker Search */}
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                    <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
                      <Search size={14} className="text-brand-teal" />
                      Search & Select Products from Catalog to Include in Kit
                    </label>
                    <input
                      type="text"
                      value={catalogSearch}
                      onChange={e => setCatalogSearch(e.target.value)}
                      placeholder="Type product title to filter existing catalog items..."
                      className="w-full px-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium outline-hidden"
                    />

                    <div className="max-h-48 overflow-y-auto divide-y divide-gray-200 bg-white rounded-xl border border-gray-200">
                      {existingProducts
                        .filter(p => p.name?.toLowerCase().includes(catalogSearch.toLowerCase()))
                        .slice(0, 10)
                        .map((p, pIdx) => (
                          <div key={p.id || p._id || pIdx} className="p-2.5 flex items-center justify-between hover:bg-teal-50/50">
                            <div className="flex items-center gap-2">
                              {p.image && <img src={p.image} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />}
                              <div>
                                <p className="text-xs font-bold text-gray-900">{p.name}</p>
                                <p className="text-[10px] text-gray-500">₹{p.price} • {p.category}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddProductToKit(p)}
                              disabled={selectedKitProducts.some(item => String(item.productId) === String(p.id || p._id))}
                              className="px-3 py-1 bg-brand-teal hover:bg-brand-teal-dark text-white rounded-lg text-xs font-bold disabled:opacity-40 cursor-pointer"
                            >
                              {selectedKitProducts.some(item => String(item.productId) === String(p.id || p._id)) ? 'Added' : '+ Add to Kit'}
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: ALLOWED PAYMENT METHODS SELECTION (Single & Kit) */}
        {activeTab === 'payment' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-xs border border-gray-200 space-y-5">
              <div className="flex items-center gap-2.5 border-b border-gray-100 pb-4">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h2 className="font-display font-bold text-base text-gray-900">
                    Allowed Checkout Payment Methods
                  </h2>
                  <p className="text-xs text-gray-500">
                    Configure permitted customer payment options. If a method is disallowed, it will be automatically disabled on the frontend during checkout.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Both */}
                <div
                  onClick={() => {
                    if (entryType === 'single') setFormData({ ...formData, paymentMethodAllowed: 'Both' });
                    else setKitData({ ...kitData, paymentMethodAllowed: 'Both' });
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    (entryType === 'single' ? formData.paymentMethodAllowed : kitData.paymentMethodAllowed) === 'Both'
                      ? 'border-brand-teal bg-brand-teal/5 ring-2 ring-brand-teal/10 font-bold'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-brand-teal uppercase">💳 Both Methods</span>
                      <CheckCircle2 size={18} className={(entryType === 'single' ? formData.paymentMethodAllowed : kitData.paymentMethodAllowed) === 'Both' ? 'text-brand-teal' : 'text-gray-300'} />
                    </div>
                    <p className="text-xs font-bold text-gray-900">Online & Cash on Delivery (COD)</p>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                      Shoppers can pay using Razorpay / UPI / Cards or select COD upon arrival.
                    </p>
                  </div>
                </div>

                {/* Online Only */}
                <div
                  onClick={() => {
                    if (entryType === 'single') setFormData({ ...formData, paymentMethodAllowed: 'Online_Only' });
                    else setKitData({ ...kitData, paymentMethodAllowed: 'Online_Only' });
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    (entryType === 'single' ? formData.paymentMethodAllowed : kitData.paymentMethodAllowed) === 'Online_Only'
                      ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20 font-bold'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-amber-700 uppercase">⚡ Prepaid Only</span>
                      <CheckCircle2 size={18} className={(entryType === 'single' ? formData.paymentMethodAllowed : kitData.paymentMethodAllowed) === 'Online_Only' ? 'text-amber-600' : 'text-gray-300'} />
                    </div>
                    <p className="text-xs font-bold text-gray-900">Online Payment Only</p>
                    <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                      <strong>Disables Cash on Delivery (COD)</strong> on frontend checkout for this item.
                    </p>
                  </div>
                </div>

                {/* COD Only */}
                <div
                  onClick={() => {
                    if (entryType === 'single') setFormData({ ...formData, paymentMethodAllowed: 'COD_Only' });
                    else setKitData({ ...kitData, paymentMethodAllowed: 'COD_Only' });
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    (entryType === 'single' ? formData.paymentMethodAllowed : kitData.paymentMethodAllowed) === 'COD_Only'
                      ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20 font-bold'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-blue-700 uppercase">💵 COD Only</span>
                      <CheckCircle2 size={18} className={(entryType === 'single' ? formData.paymentMethodAllowed : kitData.paymentMethodAllowed) === 'COD_Only' ? 'text-blue-600' : 'text-gray-300'} />
                    </div>
                    <p className="text-xs font-bold text-gray-900">Cash on Delivery Only</p>
                    <p className="text-[11px] text-blue-800 mt-1 leading-relaxed">
                      <strong>Disables Online / UPI options</strong> on frontend checkout for this item.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DIALOG: + Add / Edit Variant Form */}
      {isVariantModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-display font-bold text-base text-gray-900">
                {editingVariantIndex !== null ? 'Edit Variant Details' : 'Add New Variant'}
              </h3>
              <button
                type="button"
                onClick={() => setIsVariantModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveVariantModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Measuring Scale Category *</label>
                <select
                  value={variantForm.measureScale}
                  onChange={e => {
                    const sc = MEASURE_SCALES.find(s => s.id === e.target.value);
                    setVariantForm({ ...variantForm, measureScale: e.target.value, unit: sc?.defaultUnit || 'Size' });
                  }}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-medium outline-hidden"
                >
                  {MEASURE_SCALES.filter(sc => categorySchema.allowedScales.includes(sc.id)).map(sc => (
                    <option key={sc.id} value={sc.id}>{sc.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Variant / Scale Value *</label>
                <input
                  type="text"
                  required
                  value={variantForm.measureValue}
                  onChange={e => setVariantForm({ ...variantForm, measureValue: e.target.value, size: e.target.value })}
                  placeholder={MEASURE_SCALES.find(s => s.id === variantForm.measureScale)?.placeholder || 'e.g. XL, 2.5 Meters, Set of 5'}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-medium outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={variantForm.price}
                    onChange={e => setVariantForm({ ...variantForm, price: e.target.value })}
                    placeholder="499"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-bold outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">MRP / Original (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={variantForm.mrp}
                    onChange={e => setVariantForm({ ...variantForm, mrp: e.target.value })}
                    placeholder="699"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-bold outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={variantForm.stock}
                    onChange={e => setVariantForm({ ...variantForm, stock: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-medium outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Variant SKU</label>
                  <input
                    type="text"
                    value={variantForm.sku}
                    onChange={e => setVariantForm({ ...variantForm, sku: e.target.value })}
                    placeholder="SKU-XL"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs font-mono font-medium outline-hidden"
                  />
                </div>
              </div>

              {/* Variant Specific Image Upload Dropzone */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Variant-Specific Image (Dedicated photo for this variant)
                </label>
                <ImageUploadDropzone
                  images={variantForm.images}
                  onChange={(imgs) => setVariantForm({ ...variantForm, images: imgs, image: imgs[0] || '' })}
                  maxImages={4}
                  helperText="Upload specific photo for this size/count/weight variant"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsVariantModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-teal text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Save Variant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
