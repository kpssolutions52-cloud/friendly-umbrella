'use client';

import { useState } from 'react';
import { Globe, Mail, Phone, MessageCircle, CheckSquare, Square, ExternalLink, Database, Search } from 'lucide-react';
import type { SupplierCandidate } from '@/lib/procurementApi';
import { toggleCandidateSelection } from '@/lib/procurementApi';

interface Props {
  candidates: SupplierCandidate[];
  onSelectionChange?: (candidates: SupplierCandidate[]) => void;
}

export function SupplierCandidateList({ candidates, onSelectionChange }: Props) {
  const [localCandidates, setLocalCandidates] = useState<SupplierCandidate[]>(candidates);
  const [toggling, setToggling] = useState<string | null>(null);

  const handleToggle = async (candidate: SupplierCandidate) => {
    setToggling(candidate.id);
    try {
      const result = await toggleCandidateSelection(candidate.id, !candidate.isSelected);
      const updated = localCandidates.map((c) =>
        c.id === candidate.id ? result.candidate : c
      );
      setLocalCandidates(updated);
      onSelectionChange?.(updated);
    } catch (err) {
      console.error('Failed to toggle candidate:', err);
    } finally {
      setToggling(null);
    }
  };

  const selectedCount = localCandidates.filter((c) => c.isSelected).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Supplier Candidates
        </h3>
        <span className="text-xs text-gray-500">
          {selectedCount} of {localCandidates.length} selected
        </span>
      </div>

      {localCandidates.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          No suppliers found. Try broadening your search.
        </div>
      )}

      {localCandidates.map((candidate) => (
        <div
          key={candidate.id}
          className={`border rounded-lg p-3 transition-all ${
            candidate.isSelected
              ? 'border-blue-200 bg-blue-50'
              : 'border-gray-200 bg-white opacity-60'
          }`}
        >
          <div className="flex items-start gap-2">
            <button
              onClick={() => handleToggle(candidate)}
              disabled={toggling === candidate.id}
              className="mt-0.5 flex-shrink-0 text-blue-600 disabled:opacity-50"
              title={candidate.isSelected ? 'Deselect' : 'Select'}
            >
              {candidate.isSelected ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4 text-gray-400" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm text-gray-900 truncate">
                  {candidate.companyName}
                </span>
                <span
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${
                    candidate.source === 'internal'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {candidate.source === 'internal' ? (
                    <Database className="w-2.5 h-2.5" />
                  ) : (
                    <Search className="w-2.5 h-2.5" />
                  )}
                  {candidate.source === 'internal' ? 'Internal' : 'Web'}
                </span>
                <span className="ml-auto text-xs text-gray-400">
                  Score: {Math.round(candidate.rankScore)}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                {candidate.contactEmail && (
                  <a
                    href={`mailto:${candidate.contactEmail}`}
                    className="flex items-center gap-1 hover:text-blue-600"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Mail className="w-3 h-3" />
                    <span className="truncate max-w-[160px]">{candidate.contactEmail}</span>
                  </a>
                )}
                {candidate.contactPhone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {candidate.contactPhone}
                  </span>
                )}
                {candidate.contactWhatsapp && (
                  <span className="flex items-center gap-1 text-green-600">
                    <MessageCircle className="w-3 h-3" />
                    {candidate.contactWhatsapp}
                  </span>
                )}
                {candidate.website && (
                  <a
                    href={candidate.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-blue-600"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Globe className="w-3 h-3" />
                    Website
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>

              {candidate.address && (
                <p className="text-xs text-gray-400 mt-1 truncate">{candidate.address}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
