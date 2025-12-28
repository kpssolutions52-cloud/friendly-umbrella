'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet, apiPost } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Calendar, 
  Building2, 
  DollarSign, 
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Send,
  X
} from 'lucide-react';

interface RFQDetails {
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
  status: 'pending' | 'responded' | 'accepted' | 'rejected' | 'expired' | 'cancelled' | 'deleted';
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
    quantity: number | null;
    unit: string | null;
    message: string | null;
    terms: string | null;
    validUntil: string | null;
    respondedAt: string;
    respondedByUser: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  }>;
}

export default function RFQDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [rfq, setRfq] = useState<RFQDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionComment, setActionComment] = useState('');

  const [responseData, setResponseData] = useState({
    price: '',
    currency: 'USD',
    quantity: '',
    unit: '',
    message: '',
    terms: '',
    validUntil: '',
  });
  const [counterData, setCounterData] = useState({
    counterPrice: '',
    counterMessage: '',
  });

  useEffect(() => {
    if (params.id) {
      loadRFQDetails();
    }
  }, [params.id]);

  const loadRFQDetails = async () => {
    setIsLoading(true);
    try {
      // For now, we'll use the quote request endpoint
      // In the future, we can create a dedicated RFQ endpoint
      const response = await apiGet<{ quoteRequest: RFQDetails }>(
        `/api/v1/quotes/${params.id}`
      );
      setRfq(response.quoteRequest);
    } catch (error: any) {
      console.error('Failed to load RFQ:', error);
      toast({
        title: 'Error',
        description: error?.error?.message || 'Failed to load RFQ details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || (user.tenant?.type !== 'supplier' && user.tenant?.type !== 'service_provider')) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in as a supplier to respond to RFQs',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiPost(`/api/v1/quotes/${params.id}/respond`, {
        price: parseFloat(responseData.price),
        currency: responseData.currency,
        quantity: responseData.quantity ? parseFloat(responseData.quantity) : undefined,
        unit: responseData.unit || undefined,
        message: responseData.message || undefined,
        terms: responseData.terms || undefined,
        validUntil: responseData.validUntil || undefined,
      });

      toast({
        title: 'Success',
        description: 'Response submitted successfully',
        variant: 'default',
      });

      setShowResponseModal(false);
      setResponseData({
        price: '',
        currency: 'USD',
        quantity: '',
        unit: '',
        message: '',
        terms: '',
        validUntil: '',
      });
      loadRFQDetails();
    } catch (error: any) {
      console.error('Failed to submit response:', error);
      toast({
        title: 'Error',
        description: error?.error?.message || 'Failed to submit response',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-500">Loading RFQ details...</p>
        </div>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-xl font-bold text-gray-900">RFQ Not Found</h2>
          <p className="mt-2 text-gray-500">The RFQ you're looking for doesn't exist or has been removed.</p>
          <Button
            onClick={() => router.push('/')}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const { title, description, category } = parseRFQMessage(rfq.message);
  const isSupplier = user?.tenant?.type === 'supplier' || user?.tenant?.type === 'service_provider';
  const isCompany = user?.tenant?.type === 'company';
  const canRespond = isSupplier && rfq.status === 'pending';
  const canManageBids = isCompany && rfq.responses && rfq.responses.length > 0;
  const canCounterRFQ = isCompany && rfq.status !== 'accepted' && rfq.status !== 'rejected' && rfq.status !== 'cancelled';

  const handleAcceptBid = async () => {
    if (!selectedResponseId) return;
    
    setIsSubmitting(true);
    try {
      await apiPost(`/api/v1/quotes/${params.id}/accept`, { 
        quoteResponseId: selectedResponseId,
        comment: actionComment || undefined,
      });
      toast({
        title: 'Success',
        description: 'Bid accepted successfully',
        variant: 'default',
      });
      setShowAcceptModal(false);
      setSelectedResponseId(null);
      setActionComment('');
      loadRFQDetails();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.error?.message || 'Failed to accept bid',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectBid = async () => {
    if (!selectedResponseId) return;
    
    setIsSubmitting(true);
    try {
      await apiPost(`/api/v1/quotes/${params.id}/reject-response`, {
        quoteResponseId: selectedResponseId,
        comment: actionComment || undefined,
      });
      toast({
        title: 'Success',
        description: 'Bid rejected successfully',
        variant: 'default',
      });
      setShowRejectModal(false);
      setSelectedResponseId(null);
      setActionComment('');
      loadRFQDetails();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.error?.message || 'Failed to reject bid',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCounterNegotiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterData.counterPrice) return;

    setIsSubmitting(true);
    try {
      await apiPost(`/api/v1/quotes/${params.id}/counter`, {
        quoteResponseId: selectedResponseId,
        counterPrice: parseFloat(counterData.counterPrice),
        counterMessage: counterData.counterMessage || undefined,
      });

      toast({
        title: 'Success',
        description: 'Counter-offer submitted successfully',
        variant: 'default',
      });

      setShowCounterModal(false);
      setSelectedResponseId(null);
      setCounterData({ counterPrice: '', counterMessage: '' });
      loadRFQDetails();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.error?.message || 'Failed to submit counter-offer',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Button
          onClick={() => router.push('/')}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to RFQ List
        </Button>

        {/* RFQ Card */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          {/* Status Header */}
          <div className={`px-6 py-4 border-b ${getStatusColor(rfq.status)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span className="font-semibold uppercase">{rfq.status}</span>
              </div>
              {canRespond && (
                <Button
                  onClick={() => setShowResponseModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Quote
                </Button>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* RFQ Title */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
              <p className="text-sm text-gray-500">
                Posted on {new Date(rfq.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>

            {/* Company Information */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start gap-4">
                {rfq.company.logoUrl ? (
                  <img 
                    src={rfq.company.logoUrl} 
                    alt={rfq.company.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600">
                      {rfq.company.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{rfq.company.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Requested by {rfq.requestedByUser.firstName} {rfq.requestedByUser.lastName}
                  </p>
                  <div className="space-y-1 text-sm text-gray-600">
                    {rfq.company.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${rfq.company.phone}`} className="hover:text-blue-600">
                          {rfq.company.phone}
                        </a>
                      </div>
                    )}
                    {rfq.company.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${rfq.company.email}`} className="hover:text-blue-600">
                          {rfq.company.email}
                        </a>
                      </div>
                    )}
                    {rfq.company.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5" />
                        <span>{rfq.company.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* RFQ Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Package className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Category</p>
                    <p className="font-semibold text-gray-900">{category}</p>
                  </div>
                </div>
              )}
              {rfq.quantity && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Package className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-500">Quantity</p>
                    <p className="font-semibold text-gray-900">
                      {rfq.quantity} {rfq.unit || ''}
                    </p>
                  </div>
                </div>
              )}
              {rfq.requestedPrice && (
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-500">Budget</p>
                    <p className="font-semibold text-gray-900">
                      {rfq.currency} {rfq.requestedPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
              {rfq.expiresAt && (
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-xs text-gray-500">Expires</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(rfq.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {description && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{description}</p>
                </div>
              </div>
            )}

            {/* Company Actions for RFQ (Counter-Negotiate RFQ directly) */}
            {canCounterRFQ && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <Button
                  onClick={() => {
                    setSelectedResponseId(null);
                    setCounterData({ counterPrice: '', counterMessage: '' });
                    setShowCounterModal(true);
                  }}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Submit Counter-Offer for RFQ
                </Button>
              </div>
            )}

            {/* Responses Section */}
            {rfq.responses && rfq.responses.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Responses ({rfq.responses.length})
                </h3>
                <div className="space-y-4">
                  {rfq.responses.map((response) => (
                    <div key={response.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {response.respondedByUser.firstName} {response.respondedByUser.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(response.respondedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            {response.currency} {Number(response.price).toFixed(2)}
                          </p>
                          {response.quantity && (
                            <p className="text-sm text-gray-500">
                              {response.quantity} {response.unit || ''}
                            </p>
                          )}
                        </div>
                      </div>
                      {response.message && (
                        <p className="text-sm text-gray-700 mb-2">{response.message}</p>
                      )}
                      {response.terms && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-500 mb-1">Terms & Conditions:</p>
                          <p className="text-xs text-gray-600">{response.terms}</p>
                        </div>
                      )}
                      {response.validUntil && (
                        <p className="text-xs text-gray-500 mt-2">
                          Valid until: {new Date(response.validUntil).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Response Modal */}
      {showResponseModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => !isSubmitting && setShowResponseModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Submit Quote Response</h3>
                <button
                  onClick={() => !isSubmitting && setShowResponseModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isSubmitting}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitResponse} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="responsePrice">Price *</Label>
                    <Input
                      id="responsePrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={responseData.price}
                      onChange={(e) => setResponseData({ ...responseData, price: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="responseCurrency">Currency</Label>
                    <select
                      id="responseCurrency"
                      value={responseData.currency}
                      onChange={(e) => setResponseData({ ...responseData, currency: e.target.value })}
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
                    <Label htmlFor="responseQuantity">Quantity</Label>
                    <Input
                      id="responseQuantity"
                      type="number"
                      min="0"
                      step="0.01"
                      value={responseData.quantity}
                      onChange={(e) => setResponseData({ ...responseData, quantity: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="responseUnit">Unit</Label>
                    <Input
                      id="responseUnit"
                      value={responseData.unit}
                      onChange={(e) => setResponseData({ ...responseData, unit: e.target.value })}
                      placeholder="e.g., bags, kg"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="responseMessage">Message</Label>
                  <textarea
                    id="responseMessage"
                    value={responseData.message}
                    onChange={(e) => setResponseData({ ...responseData, message: e.target.value })}
                    placeholder="Add any notes or additional information..."
                    className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="responseTerms">Terms & Conditions</Label>
                  <textarea
                    id="responseTerms"
                    value={responseData.terms}
                    onChange={(e) => setResponseData({ ...responseData, terms: e.target.value })}
                    placeholder="Payment terms, delivery terms, etc."
                    className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="responseValidUntil">Valid Until</Label>
                  <Input
                    id="responseValidUntil"
                    type="date"
                    value={responseData.validUntil}
                    onChange={(e) => setResponseData({ ...responseData, validUntil: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowResponseModal(false)}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !responseData.price}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Quote'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Accept Modal */}
      {showAcceptModal && selectedResponseId && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => !isSubmitting && setShowAcceptModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Accept Bid</h3>
                <button
                  onClick={() => !isSubmitting && setShowAcceptModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isSubmitting}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleAcceptBid(); }} className="p-6 space-y-4">
                <div>
                  <Label htmlFor="acceptComment">Comment (Optional)</Label>
                  <textarea
                    id="acceptComment"
                    value={actionComment}
                    onChange={(e) => setActionComment(e.target.value)}
                    placeholder="Add a comment about accepting this bid..."
                    className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAcceptModal(false);
                      setSelectedResponseId(null);
                      setActionComment('');
                    }}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? 'Accepting...' : 'Accept Bid'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedResponseId && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => !isSubmitting && setShowRejectModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Reject Bid</h3>
                <button
                  onClick={() => !isSubmitting && setShowRejectModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isSubmitting}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleRejectBid(); }} className="p-6 space-y-4">
                <div>
                  <Label htmlFor="rejectComment">Comment (Optional)</Label>
                  <textarea
                    id="rejectComment"
                    value={actionComment}
                    onChange={(e) => setActionComment(e.target.value)}
                    placeholder="Add a comment explaining why you're rejecting this bid..."
                    className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowRejectModal(false);
                      setSelectedResponseId(null);
                      setActionComment('');
                    }}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    variant="destructive"
                    className="flex-1"
                  >
                    {isSubmitting ? 'Rejecting...' : 'Reject Bid'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Counter-Negotiate Modal */}
      {showCounterModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => !isSubmitting && setShowCounterModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedResponseId ? 'Counter-Negotiate Bid' : 'Counter-Negotiate RFQ'}
                </h3>
                <button
                  onClick={() => !isSubmitting && setShowCounterModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isSubmitting}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCounterNegotiate} className="p-6 space-y-4">
                {selectedResponseId ? (
                  <p className="text-sm text-gray-600 mb-4">
                    You are counter-negotiating a specific bid. The supplier will see your counter-offer.
                  </p>
                ) : (
                  <p className="text-sm text-gray-600 mb-4">
                    You are submitting a counter-offer for this RFQ. All suppliers who have bid will be notified.
                  </p>
                )}
                <div>
                  <Label htmlFor="counterPrice">Counter Price *</Label>
                  <Input
                    id="counterPrice"
                    name="counterPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={counterData.counterPrice}
                    onChange={(e) => setCounterData({ ...counterData, counterPrice: e.target.value })}
                    required
                    placeholder="Enter your counter-offer price"
                  />
                </div>

                <div>
                  <Label htmlFor="counterMessage">Counter Message</Label>
                  <textarea
                    id="counterMessage"
                    name="counterMessage"
                    value={counterData.counterMessage}
                    onChange={(e) => setCounterData({ ...counterData, counterMessage: e.target.value })}
                    placeholder="Explain your counter-offer or negotiation terms..."
                    className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCounterModal(false);
                      setSelectedResponseId(null);
                    }}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !counterData.counterPrice}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Counter-Offer'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
