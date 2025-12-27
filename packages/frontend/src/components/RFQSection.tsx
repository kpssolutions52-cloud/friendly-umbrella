'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiGet, apiPost, apiPostForm } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Plus, 
  Search, 
  Calendar, 
  Building2, 
  DollarSign, 
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  X,
  Upload,
  Download
} from 'lucide-react';

interface RFQ {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  company: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    logoUrl: string | null;
  };
  supplier: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    logoUrl: string | null;
  };
  quantity: number | null;
  unit: string | null;
  requestedPrice: number | null;
  currency: string;
  message: string | null;
  status: 'pending' | 'responded' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  expiresAt: string | null;
  createdAt: string;
  requestedByUser: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  responses: Array<{
    id: string;
    price: number;
    currency: string;
    respondedAt: string;
  }>;
}

interface RFQCardProps {
  rfq: RFQ;
  onViewDetails: () => void;
}

function RFQCard({ rfq, onViewDetails }: RFQCardProps) {
  // Parse RFQ title and description from message
  const parseRFQMessage = (message: string | null) => {
    if (!message) return { title: 'RFQ', description: '', category: '' };
    
    const lines = message.split('\n');
    const titleMatch = lines[0]?.match(/^RFQ:\s*(.+)$/);
    const title = titleMatch ? titleMatch[1] : 'RFQ';
    const categoryMatch = message.match(/Category:\s*(.+)/);
    const category = categoryMatch ? categoryMatch[1] : '';
    const description = lines.slice(1).filter(l => !l.includes('Category:')).join('\n').trim();
    
    return { title, description, category };
  };

  const { title, description, category } = parseRFQMessage(rfq.message);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'responded':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'responded':
        return <CheckCircle className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const isExpired = rfq.expiresAt && new Date(rfq.expiresAt) < new Date();
  const hasResponses = rfq.responses && rfq.responses.length > 0;

  return (
    <div 
      onClick={onViewDetails}
      className="bg-white rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer overflow-hidden"
    >
      {/* Status Badge */}
      <div className={`flex items-center justify-between px-4 py-2 border-b ${getStatusColor(rfq.status)}`}>
        <div className="flex items-center gap-2">
          {getStatusIcon(rfq.status)}
          <span className="text-xs font-semibold uppercase">{rfq.status}</span>
        </div>
        {hasResponses && (
          <span className="text-xs font-medium">
            {rfq.responses.length} {rfq.responses.length === 1 ? 'response' : 'responses'}
          </span>
        )}
      </div>

      <div className="p-4">
        {/* RFQ Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{title}</h3>
        
        {/* Company Info */}
        <div className="flex items-center gap-2 mb-3">
          {rfq.company.logoUrl ? (
            <img 
              src={rfq.company.logoUrl} 
              alt={rfq.company.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-xs font-semibold text-blue-600">
                {rfq.company.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{rfq.company.name}</p>
            <p className="text-xs text-gray-500">
              {rfq.requestedByUser.firstName} {rfq.requestedByUser.lastName}
            </p>
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>
        )}

        {/* RFQ Details */}
        <div className="space-y-2 mb-3">
          {category && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Package className="h-3 w-3" />
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">{category}</span>
            </div>
          )}
          {rfq.quantity && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Package className="h-3 w-3" />
              <span>Quantity: {rfq.quantity} {rfq.unit || ''}</span>
            </div>
          )}
          {rfq.requestedPrice && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <DollarSign className="h-3 w-3" />
              <span>Budget: {rfq.currency} {rfq.requestedPrice.toFixed(2)}</span>
            </div>
          )}
          {rfq.expiresAt && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Calendar className="h-3 w-3" />
              <span>Expires: {new Date(rfq.expiresAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Posted Date */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Posted {new Date(rfq.createdAt).toLocaleDateString()}
          </p>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View
          </Button>
        </div>
      </div>
    </div>
  );
}

export function RFQSection() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRFQs, setTotalRFQs] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    quantity: '',
    unit: '',
    requestedPrice: '',
    currency: 'USD',
    expiresAt: '',
    supplierId: '', // Optional - empty means open to all
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    summary: {
      total: number;
      created: number;
      failed: number;
      invalid: number;
    };
    created: Array<{ id: string; title: string }>;
    failed: Array<{ row: number; title: string; error: string }>;
    invalid: Array<{ row: number; data: any; errors: string[] }>;
  } | null>(null);

  const loadRFQs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedCategory) params.append('category', selectedCategory);
      params.append('page', currentPage.toString());
      params.append('limit', '12');

      const response = await apiGet<{ rfqs: RFQ[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
        `/api/v1/quotes/rfq/public?${params.toString()}`
      );

      setRfqs(response.rfqs);
      setCurrentPage(response.pagination.page);
      setTotalPages(response.pagination.totalPages);
      setTotalRFQs(response.pagination.total);
    } catch (error) {
      console.error('Failed to load RFQs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load RFQs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      // Try to get suppliers - this endpoint requires company authentication
      // If not authenticated, we'll just skip loading suppliers
      if (user?.tenant?.type === 'company') {
        const response = await apiGet<{ suppliers: Array<{ id: string; name: string }> }>('/api/v1/suppliers');
        setSuppliers(response.suppliers);
      }
    } catch (error) {
      console.error('Failed to load suppliers:', error);
      // Don't show error - suppliers list is optional
    }
  };

  useEffect(() => {
    loadRFQs();
  }, [currentPage, selectedStatus, selectedCategory]);

  useEffect(() => {
    if (showCreateModal && user?.tenant?.type === 'company') {
      loadSuppliers();
    }
  }, [showCreateModal, user]);

  const handleCSVUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!csvFile) {
      toast({
        title: 'Error',
        description: 'Please select a CSV file',
        variant: 'destructive',
      });
      return;
    }

    if (!user || user.tenant?.type !== 'company') {
      toast({
        title: 'Authentication Required',
        description: 'Please log in as a company to upload RFQs',
        variant: 'destructive',
      });
      router.push('/auth/login?returnUrl=/');
      return;
    }

    setIsUploadingCSV(true);
    setUploadResult(null);
    
    try {
      const formData = new FormData();
      formData.append('csvFile', csvFile);

      const result = await apiPostForm<{
        success: boolean;
        summary: {
          total: number;
          created: number;
          failed: number;
          invalid: number;
        };
        created: Array<{ id: string; title: string }>;
        failed: Array<{ row: number; title: string; error: string }>;
        invalid: Array<{ row: number; data: any; errors: string[] }>;
      }>('/api/v1/quotes/rfq/upload-csv', formData);

      setUploadResult(result);
      
      if (result.summary.created > 0) {
        toast({
          title: 'Success',
          description: `Successfully created ${result.summary.created} RFQ(s)`,
          variant: 'default',
        });
        setShowCSVUpload(false);
        setCsvFile(null);
        setCurrentPage(1);
        await loadRFQs();
      } else {
        toast({
          title: 'Warning',
          description: 'No RFQs were created. Please check the errors below.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Failed to upload CSV:', error);
      toast({
        title: 'Error',
        description: error?.error?.message || 'Failed to upload CSV file',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingCSV(false);
    }
  };

  const downloadSampleCSV = () => {
    const sampleCSV = `title,description,category,quantity,unit,requestedPrice,currency,expiresAt,supplierId
Need 500 bags of Portland Cement,We require high-quality Portland cement Type I for our residential construction project.,Construction Materials,500,bags,25000,USD,2024-12-31,
Steel Rebar Supply,Need Grade 60 steel rebar in various sizes for building foundation.,Steel & Metal,10,tons,15000,USD,2024-11-30,
Concrete Mixing Service,Looking for ready-mix concrete delivery service.,Construction Services,50,cubic meters,5000,USD,2024-12-15,`;

    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rfq-sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleSubmitRFQ = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || user.tenant?.type !== 'company') {
      toast({
        title: 'Authentication Required',
        description: 'Please log in as a company to submit RFQs',
        variant: 'destructive',
      });
      router.push('/auth/login?returnUrl=/');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiPost('/api/v1/quotes/rfq', {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        supplierId: formData.supplierId || null,
        quantity: formData.quantity ? parseFloat(formData.quantity) : undefined,
        unit: formData.unit || undefined,
        requestedPrice: formData.requestedPrice ? parseFloat(formData.requestedPrice) : undefined,
        currency: formData.currency,
        expiresAt: formData.expiresAt || undefined,
      });

      toast({
        title: 'Success',
        description: 'RFQ submitted successfully',
        variant: 'default',
      });

      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        category: '',
        quantity: '',
        unit: '',
        requestedPrice: '',
        currency: 'USD',
        expiresAt: '',
        supplierId: '',
      });
      // Reset to page 1 to see the newly submitted RFQ
      setCurrentPage(1);
      // Reload RFQs - the useEffect will trigger when currentPage changes
      await loadRFQs();
    } catch (error: any) {
      console.error('Failed to submit RFQ:', error);
      toast({
        title: 'Error',
        description: error?.error?.message || 'Failed to submit RFQ',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRFQs = rfqs.filter(rfq => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const message = rfq.message || '';
    return (
      message.toLowerCase().includes(searchLower) ||
      rfq.company.name.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Request for Quote (RFQ)</h2>
          <p className="text-sm text-gray-600 mt-1">
            Browse RFQs from companies or submit your own
          </p>
        </div>
        {user?.tenant?.type === 'company' && (
          <div className="flex gap-2">
            <Button
              onClick={() => setShowCSVUpload(true)}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Upload className="h-5 w-5 mr-2" />
              Upload CSV
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-5 w-5 mr-2" />
              Submit RFQ
            </Button>
          </div>
        )}
        {!user && (
          <Button
            onClick={() => router.push('/auth/login?returnUrl=/')}
            variant="outline"
          >
            Login to Submit RFQ
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search RFQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="pending">Pending</option>
            <option value="responded">Responded</option>
            <option value="accepted">Accepted</option>
            <option value="">All Status</option>
          </select>
        </div>
      </div>

      {/* RFQ Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-500">Loading RFQs...</p>
        </div>
      ) : filteredRFQs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-100">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-500">No RFQs found</p>
          {user?.tenant?.type === 'company' && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Submit First RFQ
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRFQs.map((rfq) => (
              <RFQCard
                key={rfq.id}
                rfq={rfq}
                onViewDetails={() => router.push(`/rfq/${rfq.id}`)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <p className="text-sm text-gray-600">
                Showing {((currentPage - 1) * 12) + 1} to {Math.min(currentPage * 12, totalRFQs)} of {totalRFQs} RFQs
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create RFQ Modal */}
      {showCreateModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => !isSubmitting && setShowCreateModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Submit New RFQ</h3>
                <button
                  onClick={() => !isSubmitting && setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isSubmitting}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitRFQ} className="p-6 space-y-4">
                <div>
                  <Label htmlFor="title">RFQ Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Need 500 bags of cement for construction project"
                    required
                    maxLength={200}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide detailed requirements, specifications, delivery location, etc."
                    className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., Construction Materials"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplierId">Target Supplier (Optional)</Label>
                    <select
                      id="supplierId"
                      value={formData.supplierId}
                      onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Open to All Suppliers</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="e.g., bags, kg, m²"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <select
                      id="currency"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="USD">USD</option>
                      <option value="SGD">SGD</option>
                      <option value="MYR">MYR</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="requestedPrice">Budget (Optional)</Label>
                    <Input
                      id="requestedPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.requestedPrice}
                      onChange={(e) => setFormData({ ...formData, requestedPrice: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiresAt">Expiry Date (Optional)</Label>
                    <Input
                      id="expiresAt"
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateModal(false)}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !formData.title.trim()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit RFQ'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* CSV Upload Modal */}
      {showCSVUpload && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => !isUploadingCSV && setShowCSVUpload(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Upload RFQs via CSV</h3>
                <button
                  onClick={() => !isUploadingCSV && setShowCSVUpload(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isUploadingCSV}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">CSV Format Guide</h4>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li><strong>Required:</strong> title (3-200 characters)</li>
                    <li><strong>Optional:</strong> description, category, quantity, unit, requestedPrice, currency, expiresAt, supplierId</li>
                    <li><strong>Currency:</strong> 3-letter code (e.g., USD, SGD, MYR)</li>
                    <li><strong>Date format:</strong> YYYY-MM-DD (e.g., 2024-12-31)</li>
                    <li><strong>Supplier ID:</strong> Leave empty for open RFQs, or provide UUID for targeted RFQs</li>
                  </ul>
                  <Button
                    onClick={downloadSampleCSV}
                    variant="outline"
                    size="sm"
                    className="mt-3 border-blue-600 text-blue-600 hover:bg-blue-100"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Sample CSV
                  </Button>
                </div>

                {/* Upload Form */}
                <form onSubmit={handleCSVUpload} className="space-y-4">
                  <div>
                    <Label htmlFor="csvFile">Select CSV File</Label>
                    <Input
                      id="csvFile"
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      disabled={isUploadingCSV}
                      className="mt-1"
                    />
                    {csvFile && (
                      <p className="mt-2 text-sm text-gray-600">
                        Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(2)} KB)
                      </p>
                    )}
                  </div>

                  {/* Upload Results */}
                  {uploadResult && (
                    <div className="space-y-3">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-2">Upload Summary</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Total:</span>
                            <span className="ml-2 font-medium">{uploadResult.summary.total}</span>
                          </div>
                          <div className="text-green-600">
                            <span>Created:</span>
                            <span className="ml-2 font-medium">{uploadResult.summary.created}</span>
                          </div>
                          {uploadResult.summary.failed > 0 && (
                            <div className="text-red-600">
                              <span>Failed:</span>
                              <span className="ml-2 font-medium">{uploadResult.summary.failed}</span>
                            </div>
                          )}
                          {uploadResult.summary.invalid > 0 && (
                            <div className="text-orange-600">
                              <span>Invalid:</span>
                              <span className="ml-2 font-medium">{uploadResult.summary.invalid}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Failed RFQs */}
                      {uploadResult.failed && uploadResult.failed.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <h4 className="font-semibold text-red-900 mb-2">Failed RFQs</h4>
                          <div className="space-y-2 text-sm">
                            {uploadResult.failed.map((item: { row: number; title: string; error: string }, idx: number) => (
                              <div key={idx} className="text-red-800">
                                <strong>Row {item.row}:</strong> {item.title} - {item.error}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Invalid Rows */}
                      {uploadResult.invalid && uploadResult.invalid.length > 0 && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <h4 className="font-semibold text-orange-900 mb-2">Invalid Rows</h4>
                          <div className="space-y-2 text-sm">
                            {uploadResult.invalid.map((item: { row: number; data: any; errors: string[] }, idx: number) => (
                              <div key={idx} className="text-orange-800">
                                <strong>Row {item.row}:</strong> {item.errors.join(', ')}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCSVUpload(false);
                        setCsvFile(null);
                        setUploadResult(null);
                      }}
                      disabled={isUploadingCSV}
                      className="flex-1"
                    >
                      {uploadResult ? 'Close' : 'Cancel'}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isUploadingCSV || !csvFile}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {isUploadingCSV ? 'Uploading...' : 'Upload CSV'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
