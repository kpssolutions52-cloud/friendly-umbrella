'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiGet, apiPost, apiPostForm } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { QuoteResponseModal } from './QuoteResponseModal';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText,
  Building2,
  Package,
  Plus,
  Upload,
  Download,
  X
} from 'lucide-react';

interface QuoteRequest {
  id: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    unit: string;
    type: 'product' | 'service';
  } | null;
  company?: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  supplier?: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  quantity: number | null;
  requestedPrice: number | null;
  currency: string;
  message: string | null;
  status: 'pending' | 'responded' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  requestedBy: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  respondedBy?: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  respondedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  responses: Array<{
    id: string;
    price: number;
    currency: string;
    quantity: number | null;
    validUntil: string | null;
    message: string | null;
    terms: string | null;
    isAccepted: boolean;
    respondedAt: string;
    respondedByUser: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  }>;
}

interface QuoteManagementProps {
  tenantType: 'company' | 'supplier' | 'service_provider';
}

export function QuoteManagement({ tenantType }: QuoteManagementProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);

  // Form state for RFQ creation
  const [formData, setFormData] = useState({
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

  const isCompany = tenantType === 'company';

  useEffect(() => {
    loadQuoteRequests();
  }, [selectedStatus]);

  useEffect(() => {
    if (showCreateModal && isCompany) {
      loadSuppliers();
    }
  }, [showCreateModal, isCompany]);

  const loadQuoteRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      
      // For suppliers, use the RFQ public endpoint to see general RFQs
      // For companies, use the regular quotes endpoint
      if (isCompany) {
        const response = await apiGet<{ quoteRequests: QuoteRequest[] }>(
          `/api/v1/quotes?${params.toString()}`
        );
        setQuoteRequests(response.quoteRequests || []);
      } else {
        // Suppliers see RFQs from the public endpoint
        const response = await apiGet<{ rfqs: any[]; pagination?: any }>(
          `/api/v1/quotes/rfq/public?${params.toString()}`
        );
        // Map RFQ response to QuoteRequest format
        const rfqs = response.rfqs || [];
        setQuoteRequests(rfqs.map((rfq: any) => ({
          id: rfq.id,
          product: rfq.product || null, // General RFQs may not have a product
          company: rfq.company,
          supplier: rfq.supplier,
          quantity: rfq.quantity,
          requestedPrice: rfq.requestedPrice,
          currency: rfq.currency,
          message: rfq.message,
          status: rfq.status,
          requestedBy: rfq.requestedByUser ? {
            id: rfq.requestedByUser.id,
            email: rfq.requestedByUser.email,
            firstName: rfq.requestedByUser.firstName,
            lastName: rfq.requestedByUser.lastName,
          } : {
            id: '',
            email: '',
            firstName: null,
            lastName: null,
          },
          respondedBy: null,
          respondedAt: null,
          expiresAt: rfq.expiresAt,
          createdAt: rfq.createdAt,
          responses: rfq.responses || [],
        })));
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.error?.message || 'Failed to load quote requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuote = async (quoteRequestId: string, quoteResponseId: string) => {
    try {
      await apiPost(`/quotes/${quoteRequestId}/accept`, { quoteResponseId });
      toast({
        title: 'Quote Accepted',
        description: 'You have accepted the quote response.',
      });
      loadQuoteRequests();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.error?.message || 'Failed to accept quote',
        variant: 'destructive',
      });
    }
  };

  const handleRejectQuote = async (quoteRequestId: string) => {
    if (!confirm('Are you sure you want to reject this quote?')) return;

    try {
      await apiPost(`/quotes/${quoteRequestId}/reject`);
      toast({
        title: 'Quote Rejected',
        description: 'The quote has been rejected.',
      });
      loadQuoteRequests();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.error?.message || 'Failed to reject quote',
        variant: 'destructive',
      });
    }
  };

  const handleCancelQuote = async (quoteRequestId: string) => {
    if (!confirm('Are you sure you want to cancel this quote request?')) return;

    try {
      await apiPost(`/quotes/${quoteRequestId}/cancel`);
      toast({
        title: 'Quote Cancelled',
        description: 'The quote request has been cancelled.',
      });
      loadQuoteRequests();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.error?.message || 'Failed to cancel quote',
        variant: 'destructive',
      });
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await apiGet<{ suppliers: Array<{ id: string; name: string }> }>('/api/v1/suppliers');
      setSuppliers(response.suppliers);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    }
  };

  const handleSubmitRFQ = async (e: React.FormEvent) => {
    e.preventDefault();
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
      loadQuoteRequests();
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
        loadQuoteRequests();
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
Need 500 bags of Portland Cement,We require high-quality Portland cement Type I for our residential construction project.,Construction Materials,500,bags,25000,USD,2025-12-31,
Steel Rebar Supply,Need Grade 60 steel rebar in various sizes for building foundation.,Steel & Metal,10,tons,15000,USD,2025-11-30,
Concrete Mixing Service,Looking for ready-mix concrete delivery service.,Construction Services,50,cubic meters,5000,USD,2025-12-15,`;

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

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      responded: { bg: 'bg-blue-100', text: 'text-blue-800', icon: MessageSquare },
      accepted: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      expired: { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle },
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        <Icon className="w-3.5 h-3.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quote Requests</h2>
          <p className="text-sm text-gray-600 mt-1">
            {isCompany ? 'Manage your quote requests' : 'Respond to quote requests from companies'}
          </p>
        </div>
        {isCompany && (
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
              Create RFQ
            </Button>
          </div>
        )}
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'responded', 'accepted', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Quote Requests List */}
      {quoteRequests.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 font-medium">No quote requests found</p>
          <p className="text-sm text-gray-500 mt-1">
            {selectedStatus !== 'all' ? `No ${selectedStatus} quotes` : 'You have no quote requests yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {quoteRequests.map((quote) => (
            <div
              key={quote.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                {/* Left: Product/Company Info */}
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        {quote.product ? (
                          <Package className="w-6 h-6 text-blue-600" />
                        ) : (
                          <FileText className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {quote.product 
                          ? quote.product.name 
                          : (quote.message?.split('\n')[0]?.replace('RFQ: ', '') || 'General RFQ')}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-2">
                        {quote.product && <span>SKU: {quote.product.sku}</span>}
                        {quote.quantity && (
                          <span>Qty: {quote.quantity} {quote.product?.unit || quote.message?.match(/unit:\s*(\w+)/i)?.[1] || ''}</span>
                        )}
                        {quote.requestedPrice && (
                          <span>Target: {quote.currency} {Number(quote.requestedPrice).toFixed(2)}</span>
                        )}
                      </div>
                      {isCompany ? (
                        quote.supplier && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building2 className="w-4 h-4" />
                            <span>{quote.supplier.name}</span>
                          </div>
                        )
                      ) : (
                        quote.company && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building2 className="w-4 h-4" />
                            <span>{quote.company.name}</span>
                          </div>
                        )
                      )}
                      {quote.message && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                          {quote.message.startsWith('RFQ:') ? (
                            <div>
                              {quote.message.split('\n').slice(1).filter(l => !l.includes('Category:')).join('\n')}
                            </div>
                          ) : (
                            quote.message
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Status and Actions */}
                <div className="flex flex-col items-end gap-3">
                  {getStatusBadge(quote.status)}
                  <div className="text-xs text-gray-500">
                    {new Date(quote.createdAt).toLocaleDateString()}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    {!isCompany && quote.status === 'pending' && quote.product && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedQuote(quote);
                          setShowResponseModal(true);
                        }}
                      >
                        Respond
                      </Button>
                    )}
                    {!isCompany && quote.message?.startsWith('RFQ:') && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => router.push(`/rfq/${quote.id}`)}
                      >
                        View & Bid
                      </Button>
                    )}
                    {isCompany && quote.status === 'responded' && quote.responses.length > 0 && (
                      <>
                        {quote.responses[0].isAccepted ? (
                          <span className="text-sm text-green-600 font-medium">Accepted</span>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRejectQuote(quote.id)}
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAcceptQuote(quote.id, quote.responses[0].id)}
                            >
                              Accept
                            </Button>
                          </>
                        )}
                      </>
                    )}
                    {isCompany && quote.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelQuote(quote.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Quote Responses */}
              {quote.responses.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Quote Responses:</p>
                  {quote.responses.map((response) => (
                    <div
                      key={response.id}
                      className={`p-4 rounded-lg border ${
                        response.isAccepted
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-lg font-bold text-gray-900">
                            {response.currency} {response.price.toFixed(2)}
                          </p>
                          {response.quantity && (
                            <p className="text-sm text-gray-600">
                              For {response.quantity} {quote.product?.unit || ''}
                            </p>
                          )}
                          {response.validUntil && (
                            <p className="text-xs text-gray-500 mt-1">
                              Valid until: {new Date(response.validUntil).toLocaleDateString()}
                            </p>
                          )}
                          {response.message && (
                            <p className="text-sm text-gray-700 mt-2">{response.message}</p>
                          )}
                          {response.terms && (
                            <p className="text-xs text-gray-600 mt-2">
                              <strong>Terms:</strong> {response.terms}
                            </p>
                          )}
                        </div>
                        {response.isAccepted && (
                          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Responded by {response.respondedByUser.firstName} {response.respondedByUser.lastName} on{' '}
                        {new Date(response.respondedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Response Modal */}
      {selectedQuote !== null && selectedQuote.company && selectedQuote.product && (
        <QuoteResponseModal
          quoteRequest={{
            id: selectedQuote.id,
            product: {
              id: selectedQuote.product.id,
              name: selectedQuote.product.name,
              unit: selectedQuote.product.unit,
            },
            company: {
              id: selectedQuote.company.id,
              name: selectedQuote.company.name,
            },
            quantity: selectedQuote.quantity,
            requestedPrice: selectedQuote.requestedPrice,
            currency: selectedQuote.currency,
            message: selectedQuote.message,
          }}
          isOpen={showResponseModal}
          onClose={() => {
            setShowResponseModal(false);
            setSelectedQuote(null);
          }}
          onSuccess={() => {
            loadQuoteRequests();
            setShowResponseModal(false);
            setSelectedQuote(null);
          }}
        />
      )}

      {/* Create RFQ Modal */}
      {showCreateModal && isCompany && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => !isSubmitting && setShowCreateModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Create New RFQ</h3>
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
      {showCSVUpload && isCompany && (
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
                            {uploadResult.failed.map((item: any, idx: number) => (
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
                            {uploadResult.invalid.map((item: any, idx: number) => (
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
