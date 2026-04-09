'use client';

import { useState } from 'react';
import { X, ChevronDown, ChevronUp, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SupplierCandidateList } from './SupplierCandidateList';
import { RFQMessageEditor } from './RFQMessageEditor';
import { QuotationComparisonTable } from './QuotationComparisonTable';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/procurementApi';
import { getProcurementRequest } from '@/lib/procurementApi';
import type { ProcurementRequest } from '@/lib/procurementApi';

type Tab = 'suppliers' | 'rfq' | 'quotations';

interface Props {
  request: ProcurementRequest;
  onClose: () => void;
  onUpdate?: (request: ProcurementRequest) => void;
}

export function ProcurementPanel({ request: initialRequest, onClose, onUpdate }: Props) {
  const [request, setRequest] = useState<ProcurementRequest>(initialRequest);
  const [activeTab, setActiveTab] = useState<Tab>('suppliers');
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    {
      id: 'quotations',
      label: 'Quotations',
      count: request.quotationResponses.length,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-gray-200 bg-gray-50">
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
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
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
      <div className="flex-1 overflow-y-auto p-4">
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
            onSent={(result) => {
              // Refresh to get updated status
              handleRefresh();
            }}
            onDraftUpdated={handleUpdate}
          />
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
