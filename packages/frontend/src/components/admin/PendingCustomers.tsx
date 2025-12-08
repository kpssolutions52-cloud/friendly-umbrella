'use client';

import { useEffect, useState } from 'react';
import { getPendingCustomers, approveCustomer, Customer } from '@/lib/adminApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function PendingCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadPendingCustomers();
  }, []);

  const loadPendingCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPendingCustomers();
      setCustomers(data.customers);
    } catch (err: any) {
      const errorMessage = err.error?.message || 'Failed to load pending customers';
      if (err.error?.statusCode === 401) {
        setError('Your session has expired. Please refresh the page or log in again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (customerId: string) => {
    try {
      setProcessingId(customerId);
      setError(null);
      await approveCustomer(customerId, true);
      await loadPendingCustomers(); // Refresh list
    } catch (err: any) {
      const errorMessage = err.error?.message || 'Failed to approve customer';
      if (err.error?.statusCode === 401) {
        setError('Your session has expired. Please refresh the page or log in again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (customerId: string) => {
    try {
      setProcessingId(customerId);
      setError(null);
      await approveCustomer(customerId, false, rejectReason);
      await loadPendingCustomers(); // Refresh list
      setShowRejectModal(null);
      setRejectReason('');
    } catch (err: any) {
      const errorMessage = err.error?.message || 'Failed to reject customer';
      if (err.error?.statusCode === 401) {
        setError('Your session has expired. Please refresh the page or log in again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Pending Customer Requests</h2>
        <Button onClick={loadPendingCustomers} variant="outline">
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {customers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pending requests</h3>
          <p className="mt-1 text-sm text-gray-500">All customer requests have been processed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {customers.map((customer) => (
            <div key={customer.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {customer.firstName} {customer.lastName}
                    </h3>
                    <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800">
                      Customer
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Email:</span> {customer.email}
                    </div>
                    <div>
                      <span className="font-medium">Requested:</span>{' '}
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    onClick={() => handleApprove(customer.id)}
                    disabled={processingId === customer.id}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processingId === customer.id ? 'Processing...' : 'Approve'}
                  </Button>
                  <Button
                    onClick={() => setShowRejectModal(customer.id)}
                    disabled={processingId === customer.id}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    Reject
                  </Button>
                </div>
              </div>

              {/* Reject Modal */}
              {showRejectModal === customer.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                  <Label htmlFor={`reason-${customer.id}`}>Rejection Reason (Optional)</Label>
                  <Input
                    id={`reason-${customer.id}`}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    className="mt-2"
                  />
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={() => handleReject(customer.id)}
                      disabled={processingId === customer.id}
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      Confirm Reject
                    </Button>
                    <Button
                      onClick={() => {
                        setShowRejectModal(null);
                        setRejectReason('');
                      }}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
