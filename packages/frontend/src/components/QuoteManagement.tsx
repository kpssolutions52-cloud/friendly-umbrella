'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { apiGet, apiPost } from '@/lib/api';
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
  Package
} from 'lucide-react';

interface QuoteRequest {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
    unit: string;
    type: 'product' | 'service';
  };
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
  const { toast } = useToast();
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);

  const isCompany = tenantType === 'company';

  useEffect(() => {
    loadQuoteRequests();
  }, [selectedStatus]);

  const loadQuoteRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      
      const response = await apiGet<{ quoteRequests: QuoteRequest[] }>(
        `/quotes?${params.toString()}`
      );
      setQuoteRequests(response.quoteRequests || []);
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
                        <Package className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {quote.product.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-2">
                        <span>SKU: {quote.product.sku}</span>
                        {quote.quantity && (
                          <span>Qty: {quote.quantity} {quote.product.unit}</span>
                        )}
                        {quote.requestedPrice && (
                          <span>Target: {quote.currency} {quote.requestedPrice.toFixed(2)}</span>
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
                          {quote.message}
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
                    {!isCompany && quote.status === 'pending' && (
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
                              For {response.quantity} {quote.product.unit}
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
      {selectedQuote !== null && selectedQuote.company && (
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
    </div>
  );
}
