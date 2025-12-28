'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { apiPost } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface QuoteRequestModalProps {
  productId: string;
  productName: string;
  productUnit: string;
  supplierName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function QuoteRequestModal({
  productId,
  productName,
  productUnit,
  supplierName,
  isOpen,
  onClose,
  onSuccess,
}: QuoteRequestModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    quantity: '',
    requestedPrice: '',
    message: '',
    expiresAt: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiPost('/quotes', {
        productId,
        quantity: formData.quantity ? parseFloat(formData.quantity) : undefined,
        unit: productUnit,
        requestedPrice: formData.requestedPrice ? parseFloat(formData.requestedPrice) : undefined,
        message: formData.message || undefined,
        expiresAt: formData.expiresAt || undefined,
      });

      toast({
        title: 'Quote Request Sent',
        description: `Your quote request for ${productName} has been sent to ${supplierName}.`,
      });

      // Reset form
      setFormData({
        quantity: '',
        requestedPrice: '',
        message: '',
        expiresAt: '',
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.error?.message || 'Failed to send quote request',
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
              <h2 className="text-xl font-semibold text-gray-900">Request Quote</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Request a custom quote from <strong>{supplierName}</strong>
            </p>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Product Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900">{productName}</p>
              <p className="text-xs text-gray-500 mt-1">Unit: {productUnit}</p>
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

            {/* Requested Price */}
            <div>
              <Label htmlFor="requestedPrice">Target Price (Optional)</Label>
              <Input
                id="requestedPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.requestedPrice}
                onChange={(e) => setFormData({ ...formData, requestedPrice: e.target.value })}
                placeholder="Enter your target price"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Let the supplier know your target price for negotiation
              </p>
            </div>

            {/* Message */}
            <div>
              <Label htmlFor="message">Additional Notes (Optional)</Label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Add any special requirements or notes..."
                rows={4}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            {/* Expiration Date */}
            <div>
              <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                When should this quote request expire?
              </p>
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
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Request'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}




