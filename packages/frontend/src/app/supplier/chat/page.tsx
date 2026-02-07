'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { apiPost, apiGet, apiPut, apiDelete, getMainCategories, getSubcategories, ProductCategory } from '@/lib/api';
import { Send, Loader2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Package, Edit2, Trash2, Search, Grid3x3, List, ArrowUpDown, ArrowUp, ArrowDown, Plus, Zap, Tag, DollarSign, Save, X, Info, Maximize2, Minimize2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Header } from '@/components/Header';
import { PriceExpiryInput, PriceExpiryInput as PriceExpiryInputType } from '@/components/PriceExpiryInput';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  action?: {
    type: string;
    data?: any;
  };
}

type QuestionFlowType = 'add_product' | 'update_product' | 'fetch_products' | 'set_special_price' | null;
type PanelMode = 'split' | 'chat-full' | 'dashboard-full';

interface QuestionFlow {
  type: QuestionFlowType;
  step: number;
  data: Record<string, any>;
}

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
  stockAvailability?: string | null;
  category?: string | null;
  categoryId?: string | null;
  defaultPrices?: Array<{
    id: string;
    effectiveFrom: Date | string;
    effectiveUntil: Date | string | null;
    price: number;
    currency: string;
  }>;
}

interface Company {
  id: string;
  name: string;
  email: string;
}

interface SpecialPriceEntry {
  companyId: string;
  priceType: 'price' | 'discount';
  price?: string;
  discountPercentage?: string;
  currency: string;
  notes?: string;
  expiry?: PriceExpiryInputType;
}

interface SupplierProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  logoUrl: string | null;
  metadata: {
    registrationNumber?: string | null;
    contactPerson?: string | null;
    website?: string | null;
    taxId?: string | null;
    businessLicense?: string | null;
    description?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export default function SupplierChatPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [panelMode, setPanelMode] = useState<PanelMode>('split');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [questionFlow, setQuestionFlow] = useState<QuestionFlow | null>(null);
  
  // Dashboard state
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  
  // Inventory manager state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'updatedAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    unit: '',
    stockAvailability: '',
    categoryId: '',
  });
  
  // Category selection state
  const [mainCategories, setMainCategories] = useState<ProductCategory[]>([]);
  const [subCategories, setSubCategories] = useState<ProductCategory[]>([]);
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<string>('');
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [defaultPriceExpiry, setDefaultPriceExpiry] = useState<PriceExpiryInputType | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  
  // Special Prices state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [draftSpecialPrice, setDraftSpecialPrice] = useState<SpecialPriceEntry | null>(null);
  const [includedSpecialPrices, setIncludedSpecialPrices] = useState<SpecialPriceEntry[]>([]);
  const [editingSpecialPriceId, setEditingSpecialPriceId] = useState<string | null>(null);
  
  // Form section collapse state
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    pricing: true,
    expiry: false,
    specialPrices: false,
  });
  
  // Profile state
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: '',
    phone: '',
    address: '',
    postalCode: '',
    registrationNumber: '',
    contactPerson: '',
    website: '',
    taxId: '',
    businessLicense: '',
    description: '',
    city: '',
    state: '',
    country: '',
  });
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Redirect if not authenticated or not supplier
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    // If user is QS, redirect to QS chat
    if (user?.type === 'qs') {
      router.push('/chat');
      return;
    }
    // If user is not supplier, redirect to home
    if (user?.type !== 'supplier' && user?.tenant?.type !== 'supplier') {
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, router]);

  // Load products on mount and when needed
  useEffect(() => {
    if (isAuthenticated && (user?.type === 'supplier' || user?.tenant?.type === 'supplier')) {
      loadProducts();
    }
  }, [isAuthenticated, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load profile when Profile section is shown (always reload for fresh data)
  useEffect(() => {
    if (showProfile) {
      loadProfile();
    }
  }, [showProfile]);

  // Load profile
  const loadProfile = async () => {
    try {
      setLoadingProfile(true);
      setProfileError(null);
      console.log('[Profile] Loading profile...');
      const response = await apiGet<{ profile: SupplierProfile }>('/api/v1/supplier/profile');
      console.log('[Profile] Profile response:', response);
      
      if (!response || !response.profile) {
        throw new Error('Invalid profile response');
      }
      
      const profileData = response.profile;
      setProfile(profileData);
      
      // Handle metadata - it might be null, an object, or a string that needs parsing
      let metadata: Record<string, any> = {};
      if (profileData.metadata) {
        if (typeof profileData.metadata === 'string') {
          try {
            metadata = JSON.parse(profileData.metadata);
          } catch (e) {
            console.warn('[Profile] Failed to parse metadata as JSON:', e);
            metadata = {};
          }
        } else if (typeof profileData.metadata === 'object') {
          metadata = profileData.metadata;
        }
      }
      
      console.log('[Profile] Extracted metadata:', metadata);
      console.log('[Profile] Profile data:', {
        name: profileData.name,
        phone: profileData.phone,
        address: profileData.address,
        postalCode: profileData.postalCode,
        metadataKeys: Object.keys(metadata),
      });
      
      setProfileFormData({
        name: profileData.name || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
        postalCode: profileData.postalCode || '',
        registrationNumber: metadata.registrationNumber || '',
        contactPerson: metadata.contactPerson || '',
        website: metadata.website || '',
        taxId: metadata.taxId || '',
        businessLicense: metadata.businessLicense || '',
        description: metadata.description || '',
        city: metadata.city || '',
        state: metadata.state || '',
        country: metadata.country || '',
      });
      
      console.log('[Profile] Form data set:', {
        name: profileData.name || '',
        phone: profileData.phone || '',
        registrationNumber: metadata.registrationNumber || '',
        contactPerson: metadata.contactPerson || '',
        city: metadata.city || '',
        state: metadata.state || '',
        country: metadata.country || '',
      });
    } catch (err: any) {
      console.error('[Profile] Failed to load profile:', err);
      console.error('[Profile] Error details:', {
        message: err?.message,
        error: err?.error,
        response: err?.response,
      });
      setProfileError(err.error?.message || err?.message || 'Failed to load profile. Please try again.');
    } finally {
      setLoadingProfile(false);
    }
  };

  // Save profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      const response = await apiPut<{ profile: SupplierProfile; message: string }>(
        '/api/v1/supplier/profile',
        profileFormData
      );
      setProfile(response.profile);
      setProfileSuccess('Profile updated successfully');
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (err: any) {
      setProfileError(err.error?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Load companies for special prices
  const loadCompanies = async () => {
    if (companies.length > 0) return; // Already loaded
    try {
      setLoadingCompanies(true);
      const response = await apiGet<{ companies: Company[] }>('/api/v1/companies');
      setCompanies(response.companies || []);
    } catch (err: any) {
      console.error('Failed to load companies:', err);
    } finally {
      setLoadingCompanies(false);
    }
  };

  // Load companies when special price form is opened
  useEffect(() => {
    if (draftSpecialPrice && companies.length === 0) {
      loadCompanies();
    }
  }, [draftSpecialPrice]);

  // Calculate expiry countdown
  const getExpiryCountdown = (product: Product): string | null => {
    if (!product.defaultPrices || product.defaultPrices.length === 0) return null;
    const latestPrice = product.defaultPrices[0];
    if (!latestPrice.effectiveUntil) return null;
    
    const expiryDate = new Date(latestPrice.effectiveUntil);
    const now = new Date();
    const diff = expiryDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const showAvailableActions = () => {
    const actionsMessage: Message = {
      role: 'assistant',
      content: `## Available Actions

### Product Management:
- **Add Product** - Add a new product to your inventory
  *Example: "Add cement at $48 per bag"*

- **Update Product Price** - Update the price of an existing product
  *Example: "Update cement price to $50"*

- **List Products** - View all products in your inventory
  *Example: "Show my products"*

- **Get Product Price** - Retrieve price details for a specific product
  *Example: "What is the price of cement?"*`,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, actionsMessage]);
  };

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await apiGet<{ products: Product[] }>(
        '/api/v1/products?supplier=true'
      );
      // Ensure price is always a number and include defaultPrices with parsed dates
      const normalizedProducts = (response.products || []).map(product => ({
        ...product,
        price: typeof product.price === 'string' ? parseFloat(product.price) : Number(product.price) || 0,
        defaultPrices: ((product as any).defaultPrices || []).map((dp: any) => ({
          ...dp,
          effectiveFrom: dp.effectiveFrom ? new Date(dp.effectiveFrom) : null,
          effectiveUntil: dp.effectiveUntil ? new Date(dp.effectiveUntil) : null,
        })),
      }));
      setProducts(normalizedProducts);
    } catch (error: any) {
      console.error('Failed to load products:', error);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const refreshProducts = async () => {
    try {
      setRefreshing(true);
      await loadProducts();
    } finally {
      setRefreshing(false);
    }
  };

  const startQuestionFlow = (type: QuestionFlowType) => {
    setQuestionFlow({ type, step: 0, data: {} });
    
    let initialQuestion = '';
    if (type === 'add_product') {
      initialQuestion = 'What is the product name?';
    } else if (type === 'update_product') {
      initialQuestion = 'Which product would you like to update? (Enter product name)';
    } else if (type === 'fetch_products') {
      // Fetch products immediately
      handleFetchProducts();
      return;
    } else if (type === 'set_special_price') {
      initialQuestion = 'Which product should have a special price? (Enter product name)';
    }

    const assistantMessage: Message = {
      role: 'assistant',
      content: initialQuestion,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, assistantMessage]);
  };

  const handleFetchProducts = async () => {
    setLoading(true);
    try {
      // Use longer timeout for AI chat requests
      const response = await apiPost<{
        answer: string;
        action?: { type: string; data?: any };
      }>('/api/v1/supplier/chat', {
        command: 'Show my products',
      }, true, 60000); // 60 second timeout

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toISOString(),
        action: response.action,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      refreshProducts();
    } catch (error: any) {
      const errorText = error?.error?.message || error?.error || error?.message || 'Failed to fetch products. Please try again.';
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${errorText}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setQuestionFlow(null);
    }
  };

  const processQuestionFlow = async (userInput: string) => {
    if (!questionFlow) return false;

    const { type, step, data } = questionFlow;
    let nextStep = step;
    let updatedData = { ...data };
    let nextQuestion = '';
    let shouldExecute = false;
    let command = '';

    if (type === 'add_product') {
      if (step === 0) {
        // Product name
        updatedData.productName = userInput.trim();
        nextStep = 1;
        nextQuestion = 'What is the price per unit? (e.g., 48)';
      } else if (step === 1) {
        // Price
        const price = parseFloat(userInput.trim());
        if (isNaN(price) || price <= 0) {
          const errorMessage: Message = {
            role: 'assistant',
            content: 'Please enter a valid positive number for the price.',
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          return true;
        }
        updatedData.price = price;
        nextStep = 2;
        nextQuestion = 'What is the unit? (e.g., bag, kg, gallon) - Press Enter to use "unit" as default';
      } else if (step === 2) {
        // Unit
        updatedData.unit = userInput.trim() || 'unit';
        shouldExecute = true;
        command = `Add ${updatedData.productName} at $${updatedData.price} per ${updatedData.unit}`;
      }
    } else if (type === 'update_product') {
      if (step === 0) {
        // Product name
        updatedData.productName = userInput.trim();
        nextStep = 1;
        nextQuestion = 'What would you like to update?\n1. Price\n2. Product Name\n3. Unit\n\nEnter the number or name (e.g., "1" or "price")';
      } else if (step === 1) {
        // Update type
        const updateType = userInput.trim().toLowerCase();
        if (updateType === '1' || updateType === 'price') {
          updatedData.updateType = 'price';
          nextStep = 2;
          nextQuestion = 'What is the new price? (e.g., 50)';
        } else if (updateType === '2' || updateType === 'name' || updateType === 'product name') {
          updatedData.updateType = 'name';
          nextStep = 2;
          nextQuestion = 'What is the new product name?';
        } else if (updateType === '3' || updateType === 'unit') {
          updatedData.updateType = 'unit';
          nextStep = 2;
          nextQuestion = 'What is the new unit? (e.g., bag, kg, gallon)';
        } else {
          const errorMessage: Message = {
            role: 'assistant',
            content: 'Please enter 1, 2, or 3 (or "price", "name", or "unit")',
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          return true;
        }
      } else if (step === 2) {
        // Update value
        if (updatedData.updateType === 'price') {
          const price = parseFloat(userInput.trim());
          if (isNaN(price) || price <= 0) {
            const errorMessage: Message = {
              role: 'assistant',
              content: 'Please enter a valid positive number for the price.',
              timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errorMessage]);
            return true;
          }
          updatedData.price = price;
          shouldExecute = true;
          command = `Update ${updatedData.productName} price to $${updatedData.price}`;
        } else if (updatedData.updateType === 'name') {
          updatedData.newProductName = userInput.trim();
          shouldExecute = true;
          command = `Rename ${updatedData.productName} to ${updatedData.newProductName}`;
        } else if (updatedData.updateType === 'unit') {
          updatedData.unit = userInput.trim();
          shouldExecute = true;
          command = `Change ${updatedData.productName} unit to ${updatedData.unit}`;
        }
      }
    } else if (type === 'set_special_price') {
      if (step === 0) {
        // Product name
        const productName = userInput.trim();
        const product = products.find(p => p.name.toLowerCase() === productName.toLowerCase());
        if (!product) {
          const errorMessage: Message = {
            role: 'assistant',
            content: `Product "${productName}" not found. Please enter a valid product name from your inventory.`,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          return true;
        }
        updatedData.productId = product.id;
        updatedData.productName = product.name;
        nextStep = 1;
        nextQuestion = `Which company should receive the special price for "${product.name}"? (Enter company name)`;
      } else if (step === 1) {
        // Company name
        const companyName = userInput.trim();
        const company = companies.find(c => c.name.toLowerCase() === companyName.toLowerCase());
        if (!company) {
          const errorMessage: Message = {
            role: 'assistant',
            content: `Company "${companyName}" not found. Please enter a valid company name.`,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          return true;
        }
        updatedData.companyId = company.id;
        updatedData.companyName = company.name;
        nextStep = 2;
        nextQuestion = 'What type of special pricing?\n1. Special Price (fixed amount)\n2. Discount Percentage\n\nEnter 1 or 2';
      } else if (step === 2) {
        // Price type
        const priceType = userInput.trim();
        if (priceType === '1') {
          updatedData.priceType = 'price';
          nextStep = 3;
          nextQuestion = 'What is the special price? (e.g., 45.00)';
        } else if (priceType === '2') {
          updatedData.priceType = 'discount';
          nextStep = 3;
          nextQuestion = 'What is the discount percentage? (e.g., 10 for 10%)';
        } else {
          const errorMessage: Message = {
            role: 'assistant',
            content: 'Please enter 1 for Special Price or 2 for Discount Percentage',
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          return true;
        }
      } else if (step === 3) {
        // Price or discount value
        if (updatedData.priceType === 'price') {
          const price = parseFloat(userInput.trim());
          if (isNaN(price) || price <= 0) {
            const errorMessage: Message = {
              role: 'assistant',
              content: 'Please enter a valid positive number for the price.',
              timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errorMessage]);
            return true;
          }
          updatedData.price = price;
          shouldExecute = true;
          command = `Set special price of $${updatedData.price} for ${updatedData.companyName} on product ${updatedData.productName}`;
        } else {
          const discount = parseFloat(userInput.trim());
          if (isNaN(discount) || discount < 0 || discount > 100) {
            const errorMessage: Message = {
              role: 'assistant',
              content: 'Please enter a valid discount percentage between 0 and 100.',
              timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errorMessage]);
            return true;
          }
          updatedData.discountPercentage = discount;
          shouldExecute = true;
          command = `Set ${updatedData.discountPercentage}% discount for ${updatedData.companyName} on product ${updatedData.productName}`;
        }
      }
    }

    // Update flow state
    if (shouldExecute) {
      setQuestionFlow(null);
      // Execute the command
      await executeCommand(command);
    } else {
      setQuestionFlow({ type, step: nextStep, data: updatedData });
      const assistantMessage: Message = {
        role: 'assistant',
        content: nextQuestion,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }

    return true;
  };

  const executeCommand = async (command: string) => {
    setLoading(true);
    try {
      // Use longer timeout for AI chat requests (60 seconds) as they can take time
      const response = await apiPost<{
        answer: string;
        action?: { type: string; data?: any };
      }>('/api/v1/supplier/chat', {
        command,
      }, true, 60000); // 60 second timeout for AI requests

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toISOString(),
        action: response.action,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If action was performed, refresh products dashboard
      if (response.action && (
        response.action.type === 'price_updated' ||
        response.action.type === 'product_added' ||
        response.action.type === 'product_deleted' ||
        response.action.type === 'product_updated'
      )) {
        // Highlight the affected product
        if (response.action.data?.product?.id) {
          setHighlightedProductId(response.action.data.product.id);
          // Remove highlight after 3 seconds
          setTimeout(() => {
            setHighlightedProductId(null);
          }, 3000);
        }
        
        // Small delay to ensure backend has processed the change (increased for expiry updates)
        setTimeout(() => {
          refreshProducts();
        }, 1000);
      }
    } catch (error: any) {
      const errorText = error?.error?.message || error?.error || error?.message || 'Failed to process command. Please try again.';
      
      // If it's a timeout error, check if it might be a price update that succeeded
      // by refreshing products to see if anything changed
      if (errorText.includes('timeout') || errorText.includes('Request timeout')) {
        // Refresh products to check if update succeeded
        await refreshProducts();
        
        // Show a message that suggests checking if the update worked
        const timeoutMessage: Message = {
          role: 'assistant',
          content: `⚠️ Request timed out, but the update may have succeeded. Please check your products list. If the price was updated, you'll see it there.`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, timeoutMessage]);
      } else {
        const errorMessage: Message = {
          role: 'assistant',
          content: `Error: ${errorText}`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');

    // Check if we're in a question flow
    const handled = await processQuestionFlow(userInput);
    if (handled) {
      return;
    }

    // Otherwise, process as natural language command
    await executeCommand(userInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Filtered and sorted products for dashboard
  // Extract unique categories from products
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    products.forEach(product => {
      if (product.category) {
        categories.add(product.category);
      }
    });
    return Array.from(categories).sort();
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.unit.toLowerCase().includes(query) ||
          product.price.toString().includes(query) ||
          (product.category && product.category.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [products, searchQuery, sortBy, sortOrder, selectedCategory]);

  const handleSort = (field: 'name' | 'price' | 'updatedAt') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: 'name' | 'price' | 'updatedAt' }) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 text-gray-400" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1 text-blue-600" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 text-blue-600" />
    );
  };

  // Load main categories
  const loadMainCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await getMainCategories();
      setMainCategories(response.categories || []);
    } catch (err) {
      console.error('Failed to load main categories:', err);
      setMainCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Load subcategories when main category is selected
  const loadSubCategories = async (parentId: string) => {
    if (!parentId) {
      setSubCategories([]);
      setFormData({ ...formData, categoryId: '' });
      return;
    }
    
    try {
      setLoadingSubCategories(true);
      const response = await getSubcategories(parentId);
      setSubCategories(response.categories || []);
      // Reset subcategory selection when main category changes
      // If no subcategories, allow using main category as categoryId
      if (response.categories && response.categories.length === 0) {
        setFormData({ ...formData, categoryId: parentId });
      } else {
        setFormData({ ...formData, categoryId: '' });
      }
    } catch (err) {
      console.error('Failed to load subcategories:', err);
      setSubCategories([]);
      // If error loading subcategories, allow using main category
      setFormData({ ...formData, categoryId: parentId });
    } finally {
      setLoadingSubCategories(false);
    }
  };

  const handleAddProduct = () => {
    setFormData({ name: '', price: '', unit: '', stockAvailability: '', categoryId: '' });
    setDefaultPriceExpiry(undefined);
    setDraftSpecialPrice(null);
    setIncludedSpecialPrices([]);
    setEditingProduct(null);
    setSelectedMainCategoryId('');
    setSubCategories([]);
    setShowAddForm(true);
    // Load categories when form opens
    if (mainCategories.length === 0) {
      loadMainCategories();
    }
  };

  const handleEditProduct = (product: Product) => {
    setFormData({
      name: product.name,
      price: product.price.toString(),
      unit: product.unit,
      stockAvailability: (product as any).stockAvailability || '',
      categoryId: (product as any).categoryId || '',
    });
    setDefaultPriceExpiry(undefined);
    setDraftSpecialPrice(null);
    setIncludedSpecialPrices([]);
    setEditingProduct(product);
    
    // Load categories if not loaded
    if (mainCategories.length === 0) {
      loadMainCategories();
    }
    
    // If product has a category, load its parent and subcategories
    if ((product as any).categoryId) {
      // We need to find which main category this belongs to
      // For now, just set the categoryId and let user select main category
      setSelectedMainCategoryId('');
      setSubCategories([]);
    } else {
      setSelectedMainCategoryId('');
      setSubCategories([]);
    }
    
    setShowAddForm(true);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.unit) {
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        name: formData.name,
        price: parseFloat(formData.price),
        unit: formData.unit,
        stockAvailability: formData.stockAvailability || undefined,
        categoryId: formData.categoryId || undefined,
      };

      // Add default price with expiry if provided
      if (defaultPriceExpiry) {
        payload.defaultPrice = {
          price: parseFloat(formData.price),
          currency: 'USD',
          expiry: defaultPriceExpiry,
        };
      }

      // Add special prices if any
      if (includedSpecialPrices.length > 0) {
        payload.specialPrices = includedSpecialPrices.map(sp => ({
          companyId: sp.companyId,
          price: sp.price ? parseFloat(sp.price) : undefined,
          discountPercentage: sp.discountPercentage ? parseFloat(sp.discountPercentage) : undefined,
          currency: sp.currency,
          notes: sp.notes,
          expiry: sp.expiry,
        }));
      }

      if (editingProduct) {
        // Update existing product
        await apiPut(`/api/v1/products/${editingProduct.id}`, payload);
      } else {
        // Create new product
        await apiPost('/api/v1/products', payload);
      }
      setShowAddForm(false);
      setEditingProduct(null);
      setFormData({ name: '', price: '', unit: '', stockAvailability: '', categoryId: '' });
      setSelectedMainCategoryId('');
      setSubCategories([]);
      setDefaultPriceExpiry(undefined);
      setDraftSpecialPrice(null);
      setIncludedSpecialPrices([]);
      await loadProducts();
      
      // Add success message to chat
      const successMessage: Message = {
        role: 'assistant',
        content: editingProduct 
          ? `Product "${formData.name}" updated successfully!`
          : `Product "${formData.name}" added successfully!`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, successMessage]);
    } catch (error: any) {
      console.error('Failed to save product:', error);
      const errorText = error?.error?.message || error?.error || error?.message || 'Failed to save product. Please try again.';
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${errorText}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) {
      return;
    }

    try {
      await apiDelete(`/api/v1/products/${productId}`);
      await loadProducts();
      
      // Add success message to chat
      const successMessage: Message = {
        role: 'assistant',
        content: `Product "${productName}" deleted successfully!`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, successMessage]);
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      const errorText = error?.error?.message || error?.error || error?.message || 'Failed to delete product. Please try again.';
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${errorText}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const togglePanelMode = (mode: PanelMode) => {
    setPanelMode(mode);
  };

  // Check both new schema (type) and old schema (tenant.type)
  if (!isAuthenticated || (user?.type !== 'supplier' && user?.tenant?.type !== 'supplier')) {
    return null; // Will redirect
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header />
      
      {/* Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat */}
        <div
          className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
            panelMode === 'dashboard-full' ? 'w-0 hidden' :
            panelMode === 'chat-full' ? 'w-full' :
            'w-full md:w-1/3'
          }`}
        >
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                AI Assistant
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Natural language commands
              </p>
            </div>
            <div className="flex items-center gap-1">
              {panelMode === 'split' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePanelMode('chat-full')}
                  title="Maximize chat"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
              {panelMode === 'chat-full' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePanelMode('split')}
                  title="Split view"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => togglePanelMode('dashboard-full')}
                className="md:hidden"
                title="Hide chat"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 text-2xl mb-3">💬</div>
                <h2 className="text-lg font-semibold text-gray-700 mb-2">
                  Start a conversation
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Try these commands:
                </p>
                <div className="space-y-2 text-left max-w-xs mx-auto">
                  <div className="bg-green-50 p-2 rounded text-xs text-gray-700">
                    "Update cement price to $48"
                  </div>
                  <div className="bg-green-50 p-2 rounded text-xs text-gray-700">
                    "Add paint at $25 per gallon"
                  </div>
                  <div className="bg-green-50 p-2 rounded text-xs text-gray-700">
                    "Show my products"
                  </div>
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    message.role === 'user'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="break-words">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => (
                          <p className={`mb-2 last:mb-0 ${message.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                            {children}
                          </p>
                        ),
                        strong: ({ children }) => (
                          <strong className={`font-semibold ${message.role === 'user' ? 'text-white' : 'text-gray-900'}`}>
                            {children}
                          </strong>
                        ),
                        em: ({ children }) => (
                          <em className={`italic ${message.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                            {children}
                          </em>
                        ),
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={message.role === 'user' 
                              ? 'text-green-200 hover:text-green-100 underline' 
                              : 'text-blue-600 hover:text-blue-800 underline'
                            }
                          >
                            {children}
                          </a>
                        ),
                        code: ({ children, className }) => {
                          const isInline = !className;
                          if (isInline) {
                            return (
                              <code className={`px-1 py-0.5 rounded text-xs font-mono ${
                                message.role === 'user' 
                                  ? 'bg-white/20 text-white' 
                                  : 'bg-gray-200 text-gray-800'
                              }`}>
                                {children}
                              </code>
                            );
                          }
                          return (
                            <code className={className}>
                              <pre className={`p-3 rounded-lg overflow-x-auto mb-2 text-xs ${
                                message.role === 'user'
                                  ? 'bg-white/10 text-white'
                                  : 'bg-gray-900 text-gray-100'
                              }`}>
                                {children}
                              </pre>
                            </code>
                          );
                        },
                        ul: ({ children }) => (
                          <ul className={`list-disc ml-4 mb-2 ${message.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className={`list-decimal ml-4 mb-2 ${message.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className={`mb-1 ${message.role === 'user' ? 'text-white' : 'text-gray-800'}`}>
                            {children}
                          </li>
                        ),
                        h1: ({ children }) => (
                          <h1 className={`text-lg font-bold mb-2 ${message.role === 'user' ? 'text-white' : 'text-gray-900'}`}>
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className={`text-base font-semibold mb-2 ${message.role === 'user' ? 'text-white' : 'text-gray-900'}`}>
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className={`text-sm font-semibold mb-2 ${message.role === 'user' ? 'text-white' : 'text-gray-900'}`}>
                            {children}
                          </h3>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className={`border-l-4 pl-3 italic my-2 ${
                            message.role === 'user' 
                              ? 'border-white/30 text-white/90' 
                              : 'border-gray-300 text-gray-700'
                          }`}>
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      message.role === 'user'
                        ? 'text-green-100'
                        : 'text-gray-500'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-3 py-2">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                    <span className="text-gray-500 text-xs">Processing...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="bg-white border-t border-gray-200">
            {/* Action Tags */}
            <div className="px-3 pt-2 pb-2 border-b border-gray-100">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startQuestionFlow('add_product')}
                  disabled={loading || questionFlow !== null}
                  className="text-xs h-7 px-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                >
                  <Package className="h-3 w-3 mr-1" />
                  Add Product
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startQuestionFlow('fetch_products')}
                  disabled={loading || questionFlow !== null}
                  className="text-xs h-7 px-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                >
                  <Package className="h-3 w-3 mr-1" />
                  Fetch Products
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startQuestionFlow('update_product')}
                  disabled={loading || questionFlow !== null}
                  className="text-xs h-7 px-2 bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700"
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Update Product
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startQuestionFlow('set_special_price')}
                  disabled={loading || questionFlow !== null}
                  className="text-xs h-7 px-2 bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  Set Special Price
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={showAvailableActions}
                  disabled={loading || questionFlow !== null}
                  className="text-xs h-7 px-2 bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Actions
                </Button>
                {questionFlow && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setQuestionFlow(null);
                      const cancelMessage: Message = {
                        role: 'assistant',
                        content: 'Question flow cancelled. You can start a new one or type a command.',
                        timestamp: new Date().toISOString(),
                      };
                      setMessages((prev) => [...prev, cancelMessage]);
                    }}
                    className="text-xs h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
            
            {/* Input Field */}
            <div className="px-3 py-2">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    questionFlow
                      ? questionFlow.type === 'add_product'
                        ? questionFlow.step === 0
                          ? 'Enter product name...'
                          : questionFlow.step === 1
                          ? 'Enter price...'
                          : 'Enter unit (or press Enter for default)...'
                        : questionFlow.type === 'update_product'
                        ? questionFlow.step === 0
                          ? 'Enter product name...'
                          : questionFlow.step === 1
                          ? 'Enter update type (1, 2, or 3)...'
                          : 'Enter new value...'
                        : 'Enter your response...'
                      : 'Enter a command or use tags above...'
                  }
                  disabled={loading}
                  className="flex-1 text-sm"
                />
                <Button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  size="sm"
                  className="px-3 bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Dashboard */}
        <div
          className={`flex-1 flex flex-col overflow-hidden bg-gray-50 transition-all duration-300 ${
            panelMode === 'chat-full' ? 'w-0 hidden' : 'flex'
          }`}
        >
          {/* Dashboard Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {panelMode === 'dashboard-full' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePanelMode('split')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Inventory Manager
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {products.length} product{products.length !== 1 ? 's' : ''} in inventory
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {panelMode === 'split' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePanelMode('dashboard-full')}
                  title="Maximize dashboard"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
              {panelMode === 'dashboard-full' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePanelMode('split')}
                  title="Split view"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowProfile(!showProfile);
                }}
                className={showProfile ? "bg-blue-600 text-white hover:bg-blue-700 border-0" : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 border-0"}
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshProducts}
                disabled={refreshing || loadingProducts}
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Refresh'
                )}
              </Button>
              <Button
                onClick={handleAddProduct}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Product
              </Button>
            </div>
          </div>

          {/* Profile Form */}
          {showProfile && (
            <div className="bg-white border-b border-gray-200 px-4 py-3 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold">Supplier Profile</h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowProfile(false);
                    setProfileError(null);
                    setProfileSuccess(null);
                  }}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
              
              {loadingProfile ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-sm text-gray-600">Loading profile...</span>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-2">
                  {profileError && (
                    <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-800">
                      {profileError}
                    </div>
                  )}
                  {profileSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded p-2 text-xs text-green-800">
                      {profileSuccess}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <Label className="text-xs">Company Name *</Label>
                      <Input
                        value={profileFormData.name}
                        onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                        required
                        className="h-8 text-sm mt-0.5"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input
                        value={profile?.email || ''}
                        disabled
                        className="h-8 text-sm mt-0.5 bg-gray-50"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Phone</Label>
                      <Input
                        value={profileFormData.phone}
                        onChange={(e) => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                        className="h-8 text-sm mt-0.5"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Registration #</Label>
                      <Input
                        value={profileFormData.registrationNumber}
                        onChange={(e) => setProfileFormData({ ...profileFormData, registrationNumber: e.target.value })}
                        className="h-8 text-sm mt-0.5"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Contact Person</Label>
                      <Input
                        value={profileFormData.contactPerson}
                        onChange={(e) => setProfileFormData({ ...profileFormData, contactPerson: e.target.value })}
                        className="h-8 text-sm mt-0.5"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Website</Label>
                      <Input
                        value={profileFormData.website}
                        onChange={(e) => setProfileFormData({ ...profileFormData, website: e.target.value })}
                        className="h-8 text-sm mt-0.5"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Address</Label>
                      <textarea
                        value={profileFormData.address}
                        onChange={(e) => setProfileFormData({ ...profileFormData, address: e.target.value })}
                        rows={2}
                        className="w-full h-16 text-sm rounded-md border border-input bg-background px-2 py-1 mt-0.5"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">City</Label>
                      <Input
                        value={profileFormData.city}
                        onChange={(e) => setProfileFormData({ ...profileFormData, city: e.target.value })}
                        className="h-8 text-sm mt-0.5"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">State</Label>
                      <Input
                        value={profileFormData.state}
                        onChange={(e) => setProfileFormData({ ...profileFormData, state: e.target.value })}
                        className="h-8 text-sm mt-0.5"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Postal Code</Label>
                      <Input
                        value={profileFormData.postalCode}
                        onChange={(e) => setProfileFormData({ ...profileFormData, postalCode: e.target.value })}
                        className="h-8 text-sm mt-0.5"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Country</Label>
                      <Input
                        value={profileFormData.country}
                        onChange={(e) => setProfileFormData({ ...profileFormData, country: e.target.value })}
                        className="h-8 text-sm mt-0.5"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Tax ID</Label>
                      <Input
                        value={profileFormData.taxId}
                        onChange={(e) => setProfileFormData({ ...profileFormData, taxId: e.target.value })}
                        className="h-8 text-sm mt-0.5"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Business License</Label>
                      <Input
                        value={profileFormData.businessLicense}
                        onChange={(e) => setProfileFormData({ ...profileFormData, businessLicense: e.target.value })}
                        className="h-8 text-sm mt-0.5"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Description</Label>
                      <textarea
                        value={profileFormData.description}
                        onChange={(e) => setProfileFormData({ ...profileFormData, description: e.target.value })}
                        rows={3}
                        className="w-full h-20 text-sm rounded-md border border-input bg-background px-2 py-1 mt-0.5"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2 border-t mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowProfile(false);
                        setProfileError(null);
                        setProfileSuccess(null);
                      }}
                      className="h-7 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={savingProfile}
                      className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                    >
                      {savingProfile ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Add/Edit Form - Modern Design */}
          {showAddForm && !showProfile && (
            <div className="bg-white border-b border-gray-200 flex flex-col h-[calc(100vh-200px)]">
              {/* Sticky Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {editingProduct ? 'Update product details and pricing' : 'Create a new product for your inventory'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingProduct(null);
                      setFormData({ name: '', price: '', unit: '', stockAvailability: '', categoryId: '' });
                      setDefaultPriceExpiry(undefined);
                      setDraftSpecialPrice(null);
                      setIncludedSpecialPrices([]);
                      setSelectedMainCategoryId('');
                      setSubCategories([]);
                      setExpandedSections({ basic: true, pricing: true, expiry: false, specialPrices: false });
                    }}
                    className="h-9"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    form="product-form"
                    size="sm"
                    disabled={submitting}
                    className="h-9 bg-blue-600 hover:bg-blue-700"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {editingProduct ? 'Save Changes' : 'Create Product'}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Scrollable Form Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <form id="product-form" onSubmit={handleSubmitProduct} className="space-y-6 max-w-4xl">
                  {/* Basic Information Section */}
                  <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedSections({ ...expandedSections, basic: !expandedSections.basic })}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Package className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-sm font-semibold text-gray-900">Basic Information</h3>
                          <p className="text-xs text-gray-500">Product name, pricing, and stock details</p>
                        </div>
                      </div>
                      {expandedSections.basic ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    {expandedSections.basic && (
                      <div className="px-5 py-4 bg-white border-t border-gray-200 space-y-4">
                        <div>
                          <Label htmlFor="dashboard-name" className="text-sm font-medium text-gray-700 mb-1.5 block">
                            Product Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="dashboard-name"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            required
                            placeholder="e.g., Premium Cement 50kg"
                            className="h-10 text-sm"
                          />
                        </div>
                        
                        {/* Category Selection */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="main-category" className="text-sm font-medium text-gray-700 mb-1.5 block">
                              Main Category
                            </Label>
                            <select
                              id="main-category"
                              value={selectedMainCategoryId}
                              onChange={(e) => {
                                const mainCatId = e.target.value;
                                setSelectedMainCategoryId(mainCatId);
                                loadSubCategories(mainCatId);
                              }}
                              disabled={loadingCategories}
                              className="w-full h-10 text-sm rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select main category...</option>
                              {mainCategories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="sub-category" className="text-sm font-medium text-gray-700 mb-1.5 block">
                              Sub Category
                            </Label>
                            <select
                              id="sub-category"
                              value={formData.categoryId}
                              onChange={(e) =>
                                setFormData({ ...formData, categoryId: e.target.value })
                              }
                              disabled={!selectedMainCategoryId || loadingSubCategories}
                              className="w-full h-10 text-sm rounded-md border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                              <option value="">{subCategories.length === 0 && selectedMainCategoryId ? 'No subcategories (using main category)' : 'Select sub category...'}</option>
                              {subCategories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                            {!selectedMainCategoryId && (
                              <p className="mt-1 text-xs text-gray-500">Select a main category first</p>
                            )}
                            {selectedMainCategoryId && subCategories.length === 0 && !loadingSubCategories && (
                              <p className="mt-1 text-xs text-gray-500">No subcategories available. Main category will be used.</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor="dashboard-price" className="text-sm font-medium text-gray-700 mb-1.5 block">
                              Price <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                              <Input
                                id="dashboard-price"
                                type="number"
                                step="0.01"
                                value={formData.price}
                                onChange={(e) =>
                                  setFormData({ ...formData, price: e.target.value })
                                }
                                required
                                placeholder="0.00"
                                className="h-10 text-sm pl-8"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="dashboard-unit" className="text-sm font-medium text-gray-700 mb-1.5 block">
                              Unit <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="dashboard-unit"
                              value={formData.unit}
                              onChange={(e) =>
                                setFormData({ ...formData, unit: e.target.value })
                              }
                              required
                              placeholder="e.g., bag, kg, ton"
                              className="h-10 text-sm"
                            />
                          </div>
                          <div>
                            <Label htmlFor="dashboard-stockAvailability" className="text-sm font-medium text-gray-700 mb-1.5 block">
                              Stock Availability
                            </Label>
                            <Input
                              id="dashboard-stockAvailability"
                              value={formData.stockAvailability}
                              onChange={(e) =>
                                setFormData({ ...formData, stockAvailability: e.target.value })
                              }
                              placeholder="in_stock, out_of_stock, low_stock"
                              className="h-10 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Price Expiry Section */}
                  <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedSections({ ...expandedSections, expiry: !expandedSections.expiry })}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <DollarSign className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-sm font-semibold text-gray-900">Price Expiry</h3>
                          <p className="text-xs text-gray-500">Set when the default price expires (optional)</p>
                        </div>
                      </div>
                      {expandedSections.expiry ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    {expandedSections.expiry && (
                      <div className="px-5 py-4 bg-white border-t border-gray-200">
                        <PriceExpiryInput
                          value={defaultPriceExpiry}
                          onChange={setDefaultPriceExpiry}
                          effectiveFrom={new Date()}
                        />
                      </div>
                    )}
                  </div>

                  {/* Special Prices Section */}
                  <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedSections({ ...expandedSections, specialPrices: !expandedSections.specialPrices })}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Tag className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="text-left flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900">Special Prices</h3>
                            {includedSpecialPrices.length > 0 && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                {includedSpecialPrices.length}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">Set custom prices or discounts for specific companies</p>
                        </div>
                      </div>
                      {expandedSections.specialPrices ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    {expandedSections.specialPrices && (
                      <div className="px-5 py-4 bg-white border-t border-gray-200 space-y-4">
                        {!draftSpecialPrice && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDraftSpecialPrice({
                                companyId: '',
                                priceType: 'price',
                                price: '',
                                currency: 'USD',
                                notes: '',
                              });
                              loadCompanies();
                            }}
                            disabled={loadingCompanies}
                            className="w-full border-dashed border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Company Price
                          </Button>
                        )}

                        {draftSpecialPrice && (
                          <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-semibold text-gray-900">Add Company Price</h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setDraftSpecialPrice(null)}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                  Company <span className="text-red-500">*</span>
                                </Label>
                                <select
                                  value={draftSpecialPrice.companyId}
                                  onChange={(e) => setDraftSpecialPrice({ ...draftSpecialPrice, companyId: e.target.value })}
                                  className="w-full h-10 text-sm rounded-md border border-input bg-background px-3"
                                  required
                                >
                                  <option value="">Select a company...</option>
                                  {companies.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700 mb-2 block">Price Type</Label>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    variant={draftSpecialPrice.priceType === 'price' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setDraftSpecialPrice({ ...draftSpecialPrice, priceType: 'price', discountPercentage: '' })}
                                    className="flex-1 h-10"
                                  >
                                    Fixed Price
                                  </Button>
                                  <Button
                                    type="button"
                                    variant={draftSpecialPrice.priceType === 'discount' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setDraftSpecialPrice({ ...draftSpecialPrice, priceType: 'discount', price: '' })}
                                    className="flex-1 h-10"
                                  >
                                    Discount %
                                  </Button>
                                </div>
                              </div>
                              {draftSpecialPrice.priceType === 'price' ? (
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                      Price <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={draftSpecialPrice.price}
                                        onChange={(e) => setDraftSpecialPrice({ ...draftSpecialPrice, price: e.target.value })}
                                        className="h-10 text-sm pl-8"
                                        required
                                        placeholder="0.00"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Currency</Label>
                                    <select
                                      value={draftSpecialPrice.currency}
                                      onChange={(e) => setDraftSpecialPrice({ ...draftSpecialPrice, currency: e.target.value })}
                                      className="w-full h-10 text-sm rounded-md border border-input bg-background px-3"
                                    >
                                      <option value="USD">USD</option>
                                      <option value="EUR">EUR</option>
                                      <option value="GBP">GBP</option>
                                      <option value="SGD">SGD</option>
                                    </select>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                    Discount Percentage <span className="text-red-500">*</span>
                                  </Label>
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      max="100"
                                      value={draftSpecialPrice.discountPercentage}
                                      onChange={(e) => setDraftSpecialPrice({ ...draftSpecialPrice, discountPercentage: e.target.value })}
                                      className="h-10 text-sm pr-8"
                                      required
                                      placeholder="0.00"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                                  </div>
                                </div>
                              )}
                              <div>
                                <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                                  Price Expiry (Optional)
                                </Label>
                                <PriceExpiryInput
                                  value={draftSpecialPrice.expiry}
                                  onChange={(expiry) => setDraftSpecialPrice({ ...draftSpecialPrice, expiry })}
                                  effectiveFrom={new Date()}
                                />
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  if (draftSpecialPrice.companyId && (draftSpecialPrice.price || draftSpecialPrice.discountPercentage)) {
                                    setIncludedSpecialPrices([...includedSpecialPrices, draftSpecialPrice]);
                                    setDraftSpecialPrice(null);
                                  }
                                }}
                                className="w-full h-10 bg-blue-600 hover:bg-blue-700"
                                disabled={!draftSpecialPrice.companyId || (!draftSpecialPrice.price && !draftSpecialPrice.discountPercentage)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add to List
                              </Button>
                            </div>
                          </div>
                        )}

                        {includedSpecialPrices.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">Added Special Prices</Label>
                            <div className="space-y-2">
                              {includedSpecialPrices.map((sp, idx) => (
                                <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between hover:border-blue-300 transition-colors">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm text-gray-900">
                                      {companies.find(c => c.id === sp.companyId)?.name || 'Unknown Company'}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                      {sp.priceType === 'price' 
                                        ? `Fixed: ${sp.currency} ${sp.price}` 
                                        : `Discount: ${sp.discountPercentage}%`}
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIncludedSpecialPrices(includedSpecialPrices.filter((_, i) => i !== idx))}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {includedSpecialPrices.length === 0 && !draftSpecialPrice && (
                          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                            <Tag className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No special prices added yet</p>
                            <p className="text-xs text-gray-400 mt-1">Click "Add Company Price" to set custom pricing</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Search and Filter Bar - Hide when editing */}
          {products.length > 0 && !showAddForm && !showProfile && (
            <div className="bg-white border-b border-gray-200 px-4 py-3">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search products by name, price, or unit..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                {availableCategories.length > 0 && (
                  <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-gray-50">
                    <span className="text-xs text-gray-600 whitespace-nowrap">Category:</span>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="text-sm border-0 bg-transparent focus:outline-none focus:ring-0 cursor-pointer min-w-[120px]"
                    >
                      <option value="">All Categories</option>
                      {availableCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Sort and View Toggle */}
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-gray-50">
                    <span className="text-xs text-gray-600 whitespace-nowrap">Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'updatedAt')}
                      className="text-sm border-0 bg-transparent focus:outline-none focus:ring-0 cursor-pointer"
                    >
                      <option value="name">Name</option>
                      <option value="price">Price</option>
                      <option value="updatedAt">Last Updated</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {sortOrder === 'asc' ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex border rounded-md overflow-hidden">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="rounded-none border-0"
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="rounded-none border-0"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Results count */}
              {(searchQuery || selectedCategory) && (
                <div className="mt-2 text-xs text-gray-500">
                  Showing {filteredAndSortedProducts.length} of {products.length} products
                  {(searchQuery || selectedCategory) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('');
                      }}
                      className="ml-2 h-5 text-xs"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Products Display - Hide when editing or viewing profile */}
          {!showAddForm && !showProfile && (
          <div className="flex-1 overflow-y-auto p-4">
            {loadingProducts ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                  <p className="text-sm text-gray-500 mt-2">Loading products...</p>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No products yet
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Use the AI chat or click "Add Product" to add your first product
                  </p>
                  <Button onClick={handleAddProduct} size="sm" className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Product
                  </Button>
                </div>
              </div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-sm text-gray-500 mb-2">No products match your search.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchQuery('')} 
                    size="sm"
                  >
                    Clear Search
                  </Button>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAndSortedProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-all duration-300 ${
                      highlightedProductId === product.id
                        ? 'border-green-500 shadow-lg ring-2 ring-green-200 bg-green-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-base font-semibold text-gray-900 flex-1 pr-2">
                        {product.name}
                      </h3>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                          className="h-8 w-8 p-0 hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="h-8 w-8 p-0 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-900">
                          ${(Number(product.price) || 0).toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-500">/{product.unit}</span>
                      </div>
                      <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                        {getExpiryCountdown(product) ? (
                          <span className={getExpiryCountdown(product) === 'Expired' ? 'text-red-600 font-medium' : 'text-orange-600'}>
                            Expires: {getExpiryCountdown(product)}
                          </span>
                        ) : (
                          <span>No expiry set</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        <input
                          type="checkbox"
                          checked={selectedProducts.size === filteredAndSortedProducts.length && filteredAndSortedProducts.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts(new Set(filteredAndSortedProducts.map(p => p.id)));
                            } else {
                              setSelectedProducts(new Set());
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center">
                          Product Name
                          <SortIcon field="name" />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('price')}
                      >
                        <div className="flex items-center">
                          Price
                          <SortIcon field="price" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('updatedAt')}
                      >
                        <div className="flex items-center">
                          Last Updated
                          <SortIcon field="updatedAt" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedProducts.map((product) => (
                      <tr 
                        key={product.id} 
                        className={`hover:bg-gray-50 ${
                          highlightedProductId === product.id ? 'bg-green-50' : ''
                        } ${selectedProducts.has(product.id) ? 'bg-blue-50' : ''}`}
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(product.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedProducts);
                              if (e.target.checked) {
                                newSelected.add(product.id);
                              } else {
                                newSelected.delete(product.id);
                              }
                              setSelectedProducts(newSelected);
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          {product.category && (
                            <div className="text-xs text-gray-500 mt-1">
                              {product.category}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            ${(Number(product.price) || 0).toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{product.unit}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(product.updatedAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                              className="hover:bg-blue-50 hover:border-blue-300"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
