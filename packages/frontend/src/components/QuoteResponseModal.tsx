'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { apiPost } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface QuoteResponseModalProps {
  quoteRequest: {
    id: string;
    product: {
      id: string;
      name: string;
      unit: string;
    };
    company: {
      id: string;
      name: string;
    };
    quantity: number | null;
    requestedPrice: number | null;
    currency: string;
    message: string | null;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function QuoteResponseModal({
  quoteRequest,
  isOpen,
  onClose,
  onSuccess,
}: QuoteResponseModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    price: '',
    quantity: quoteRequest.quantity?.toString() || '',
    unit: quoteRequest.product.unit,
    validUntil: '',
    message: '',
    terms: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiPost(`/quotes/${quoteRequest.id}/respond`, {
        price: parseFloat(formData.price),
        currency: quoteRequest.currency,
        quantity: formData.quantity ? parseFloat(formData.quantity) : undefined,
        unit: formData.unit,
        validUntil: formData.validUntil || undefined,
        message: formData.message || undefined,
        terms: formData.terms || undefined,
      });

      toast({
        title: 'Quote Response Sent',
        description: `Your quote response has been sent to ${quoteRequest.company.name}.`,
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.error?.message || 'Failed to send quote response',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Respond to Quote</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Respond to quote request from <strong>{quoteRequest.company.name}</strong>
            </p>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Product Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900">{quoteRequest.product.name}</p>
              {quoteRequest.quantity && (
                <p className="text-xs text-gray-500 mt-1">
                  Requested Quantity: {quoteRequest.quantity} {quoteRequest.product.unit}
                </p>
              )}
              {quoteRequest.requestedPrice && (
                <p className="text-xs text-gray-500 mt-1">
                  Target Price: {quoteRequest.currency} {quoteRequest.requestedPrice.toFixed(2)}
                </p>
              )}
              {quoteRequest.message && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-700">Company Notes:</p>
                  <p className="text-xs text-gray-600 mt-1">{quoteRequest.message}</p>
                </div>
              )}
            </div>

            {/* Price */}
            <div>
              <Label htmlFor="price">Your Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="Enter your price"
                className="mt-1"
              />
            </div>

            {/* Quantity */}
            <div>
              <Label htmlFor="quantity">Quantity (Optional)</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="Enter quantity"
                className="mt-1"
              />
            </div>

            {/* Valid Until */}
            <div>
              <Label htmlFor="validUntil">Price Valid Until (Optional)</Label>
              <Input
                id="validUntil"
                type="datetime-local"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                className="mt-1"
              />
            </div>

            {/* Message */}
            <div>
              <Label htmlFor="message">Response Message (Optional)</Label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Add a message to the company..."
                rows={3}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            {/* Terms */}
            <div>
              <Label htmlFor="terms">Payment/Delivery Terms (Optional)</Label>
              <textarea
                id="terms"
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                placeholder="Payment terms, delivery terms, etc."
                rows={3}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting || !formData.price}
              >
                {isSubmitting ? 'Sending...' : 'Send Response'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
