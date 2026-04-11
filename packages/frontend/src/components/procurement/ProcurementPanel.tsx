'use client';

import { useState, useEffect } from 'react';
import { X, RefreshCw, Mail, MessageCircle, ArrowUpRight, ArrowDownLeft, CheckCircle, XCircle, Clock } from 'lucide-react';
import { SupplierCandidateList } from './SupplierCandidateList';
import { RFQMessageEditor } from './RFQMessageEditor';
import { QuotationComparisonTable } from './QuotationComparisonTable';
import { STATUS_LABELS, STATUS_COLORS, getProcurementRequest } from '@/lib/procurementApi';
import type { ProcurementRequest, RfqCommunication } from '@/lib/procurementApi';

type Tab = 'suppliers' | 'rfq' | 'quotations' | 'comms';

interface Props {
  request: ProcurementRequest;
  onClose: () => void;
  onUpdate?: (request: ProcurementRequest) => void;
}

function DeliveryIcon({ status }: { status?: string | null }) {
  if (status === 'sent' || status === 'delivered') return <CheckCircle className="w-3 h-3 text-green-500" />;
  if (status === 'failed') return <XCircle className="w-3 h-3 text-red-500" />;
  return <Clock className="w-3 h-3 text-gray-400" />;
}

function CommCard({ comm }: { comm: RfqCommunication }) {
  const isOutbound = comm.direction === 'outbound';
  const isEmail = comm.channel === 'email';
  const time = comm.sentAt || comm.receivedAt || comm.createdAt;

  return (
    <div className={`border rounded-lg p-3 text-xs ${isOutbound ? 'bg-blue-50 border-blue-100' : 'bg-green-50 border-green-100'}`}>
      <div className="flex items-center gap-2 mb-1.5">
        {isOutbound ? (
          <ArrowUpRight className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
        ) : (
          <ArrowDownLeft className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
        )}
        {isEmail ? (
          <Mail className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
        ) : (
          <MessageCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
        )}
        <span className="font-medium text-gray-700 capitalize">
          {isOutbound ? 'Sent' : 'Received'} via {comm.channel}
        </span>
        <DeliveryIcon status={comm.deliveryStatus} />
        <span className="ml-auto text-gray-400">
          {new Date(time).toLocaleString('en-SG', { dateStyle: 'short', timeStyle: 'short' })}
        </span>
      </div>
      {comm.toAddress && (
        <p className="text-gray-500 mb-1 truncate">
          {isOutbound ? 'To: ' : 'From: '}{comm.toAddress}
        </p>
      )}
      {comm.subject && (
        <p className="font-medium text-gray-700 mb-1 truncate">{comm.subject}</p>
      )}
      <p className="text-gray-600 line-clamp-3 whitespace-pre-wrap">{comm.body}</p>
      {comm.deliveryStatus && (
        <p className={`mt-1 capitalize ${comm.deliveryStatus === 'failed' ? 'text-red-500' : 'text-gray-400'}`}>
          Status: {comm.deliveryStatus}
        </p>
      )}
    </div>
  );
}

export function ProcurementPanel({ request: initialRequest, onClose, onUpdate }: Props) {
  const [request, setRequest] = useState<ProcurementRequest>(initialRequest);
  const [activeTab, setActiveTab] = useState<Tab>('suppliers');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync when parent passes a new request (e.g. user clicks a different card)
  useEffect(() => {
    setRequest(initialRequest);
  }, [initialRequest.id]);

  const handleUpdate = (updated: ProcurementRequest) => {
    setRequest(updated);
    onUpdate?.(updated);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const result = await getProcurementRequest(request.id);
      setRequest(result.request);
      onUpdate?.(result.request);
    } catch (err) {
      console.error('Failed to refresh:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'suppliers', label: 'Suppliers', count: request.supplierCandidates.length },
    { id: 'rfq', label: 'RFQ Draft' },
    { id: 'comms', label: 'Comms', count: request.communications.length },
    { id: 'quotations', label: 'Quotes', count: request.quotationResponses.length },
  ];

  const sortedComms = [...request.communications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex items-start justify-between p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-semibold text-gray-900 truncate text-sm">{request.product}</h2>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[request.status]}`}
            >
              {STATUS_LABELS[request.status]}
            </span>
          </div>
          {request.location && (
            <p className="text-xs text-gray-500">{request.location}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-200 text-gray-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`min-w-fit px-3 py-2.5 text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {activeTab === 'suppliers' && (
          <SupplierCandidateList
            candidates={request.supplierCandidates}
            onSelectionChange={(updated) =>
              setRequest({ ...request, supplierCandidates: updated })
            }
          />
        )}

        {activeTab === 'rfq' && (
          <RFQMessageEditor
            request={request}
            onSent={() => handleRefresh()}
            onDraftUpdated={handleUpdate}
          />
        )}

        {activeTab === 'comms' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Communication History</h3>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {sortedComms.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No messages yet.</p>
                <p className="text-xs mt-1">Send the RFQ to start communicating with suppliers.</p>
              </div>
            ) : (
              sortedComms.map((comm) => <CommCard key={comm.id} comm={comm} />)
            )}
          </div>
        )}

        {activeTab === 'quotations' && (
          <QuotationComparisonTable
            requestId={request.id}
            quotations={request.quotationResponses}
            candidates={request.supplierCandidates}
            onAwarded={() => handleRefresh()}
          />
        )}
      </div>

      {/* Footer prompt */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-400 line-clamp-2 italic">"{request.rawPrompt}"</p>
      </div>
    </div>
  );
}
