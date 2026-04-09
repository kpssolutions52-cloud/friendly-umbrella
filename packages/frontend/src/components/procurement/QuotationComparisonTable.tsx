'use client';

import { useState } from 'react';
import { Award, CheckCircle, Loader2, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { awardQuotation } from '@/lib/procurementApi';
import type { QuotationResponse, SupplierCandidate } from '@/lib/procurementApi';

interface Props {
  requestId: string;
  quotations: QuotationResponse[];
  candidates: SupplierCandidate[];
  onAwarded?: (quotationId: string) => void;
}

function getSupplierName(
  candidateId: string,
  candidates: SupplierCandidate[],
  quotation: QuotationResponse
): string {
  if (quotation.supplierCandidate) return quotation.supplierCandidate.companyName;
  return candidates.find((c) => c.id === candidateId)?.companyName ?? 'Unknown Supplier';
}

export function QuotationComparisonTable({ requestId, quotations, candidates, onAwarded }: Props) {
  const [awarding, setAwarding] = useState<string | null>(null);
  const [awardedId, setAwardedId] = useState<string | null>(
    quotations.find((q) => q.isAwarded)?.id ?? null
  );

  if (quotations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No quotations received yet. Replies from suppliers will appear here once parsed.
      </div>
    );
  }

  // Find the lowest price for highlighting
  const prices = quotations
    .filter((q) => q.unitPrice != null)
    .map((q) => Number(q.unitPrice));
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : null;

  const handleAward = async (quotationId: string) => {
    setAwarding(quotationId);
    try {
      await awardQuotation(requestId, quotationId);
      setAwardedId(quotationId);
      onAwarded?.(quotationId);
    } catch (err) {
      console.error('Failed to award quotation:', err);
    } finally {
      setAwarding(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">
          Quotation Comparison ({quotations.length})
        </h3>
        {lowestPrice != null && (
          <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
            <TrendingDown className="w-3 h-3" />
            Best: {quotations[0]?.currency ?? 'SGD'} {lowestPrice.toFixed(2)}
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left p-2 font-medium text-gray-600">Supplier</th>
              <th className="text-right p-2 font-medium text-gray-600">Unit Price</th>
              <th className="text-left p-2 font-medium text-gray-600">Availability</th>
              <th className="text-left p-2 font-medium text-gray-600">Delivery</th>
              <th className="text-left p-2 font-medium text-gray-600">Payment</th>
              <th className="text-center p-2 font-medium text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {quotations.map((q) => {
              const supplierName = getSupplierName(q.supplierCandidateId, candidates, q);
              const isLowest = q.unitPrice != null && Number(q.unitPrice) === lowestPrice;
              const isAwarded = q.id === awardedId || q.isAwarded;

              return (
                <tr
                  key={q.id}
                  className={`border-b border-gray-100 transition-colors ${
                    isAwarded
                      ? 'bg-green-50'
                      : isLowest
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      {isAwarded && <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />}
                      {isLowest && !isAwarded && (
                        <TrendingDown className="w-3 h-3 text-blue-600 flex-shrink-0" />
                      )}
                      <span className="font-medium text-gray-800 truncate max-w-[120px]">
                        {supplierName}
                      </span>
                    </div>
                    {q.confidence != null && (
                      <div className="text-gray-400 mt-0.5">
                        Confidence: {Math.round(q.confidence * 100)}%
                      </div>
                    )}
                  </td>
                  <td className="p-2 text-right">
                    {q.unitPrice != null ? (
                      <span className={`font-semibold ${isLowest ? 'text-blue-700' : 'text-gray-800'}`}>
                        {q.currency ?? 'SGD'} {Number(q.unitPrice).toFixed(2)}
                        {q.unit && <span className="text-gray-400 font-normal">/{q.unit}</span>}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="p-2 text-gray-600 max-w-[100px]">
                    <span className="truncate block">{q.availability ?? '—'}</span>
                  </td>
                  <td className="p-2 text-gray-600">
                    {q.deliveryDays != null ? (
                      <span>{q.deliveryDays} days</span>
                    ) : q.deliveryTerms ? (
                      <span className="truncate block max-w-[100px]">{q.deliveryTerms}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="p-2 text-gray-600 max-w-[100px]">
                    <span className="truncate block">{q.paymentTerms ?? '—'}</span>
                  </td>
                  <td className="p-2 text-center">
                    {isAwarded ? (
                      <span className="inline-flex items-center gap-1 text-green-700 font-medium">
                        <Award className="w-3 h-3" />
                        Awarded
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAward(q.id)}
                        disabled={awarding === q.id || awardedId != null}
                        className="text-xs h-6 px-2"
                      >
                        {awarding === q.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          'Award'
                        )}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Notes for awarded quotation */}
      {awardedId && (
        <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-2">
          <CheckCircle className="w-3 h-3 inline mr-1" />
          Quotation awarded. The procurement request has been marked as awarded.
        </div>
      )}
    </div>
  );
}
