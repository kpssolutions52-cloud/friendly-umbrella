'use client';

import Link from 'next/link';
import { Mail, MessageCircle, Users, CheckCircle, Clock, Search, Send, Award, XCircle } from 'lucide-react';
import type { ProcurementRequest, ProcurementStatus } from '@/lib/procurementApi';
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/procurementApi';

const STATUS_ICONS: Record<ProcurementStatus, React.ReactNode> = {
  draft: <Clock className="w-3 h-3" />,
  searching: <Search className="w-3 h-3" />,
  rfq_sent: <Send className="w-3 h-3" />,
  evaluating: <Clock className="w-3 h-3" />,
  awarded: <Award className="w-3 h-3" />,
  closed: <XCircle className="w-3 h-3" />,
};

interface Props {
  request: ProcurementRequest;
  onClick?: () => void;
}

export function ProcurementRequestCard({ request, onClick }: Props) {
  const emailCount = request.communications.filter(
    (c) => c.channel === 'email' && c.direction === 'outbound'
  ).length;
  const waCount = request.communications.filter(
    (c) => c.channel === 'whatsapp' && c.direction === 'outbound'
  ).length;
  const replyCount = request.communications.filter((c) => c.direction === 'inbound').length;
  const quotationCount = request.quotationResponses.length;
  const selectedCount = request.supplierCandidates.filter((c) => c.isSelected).length;

  const createdAt = new Date(request.createdAt).toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{request.product}</h3>
          {request.location && (
            <p className="text-sm text-gray-500 mt-0.5">{request.location}</p>
          )}
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[request.status]}`}
        >
          {STATUS_ICONS[request.status]}
          {STATUS_LABELS[request.status]}
        </span>
      </div>

      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{request.rawPrompt}</p>

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {selectedCount} suppliers
        </span>
        {emailCount > 0 && (
          <span className="flex items-center gap-1">
            <Mail className="w-3.5 h-3.5" />
            {emailCount} emails
          </span>
        )}
        {waCount > 0 && (
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
            {waCount} WA
          </span>
        )}
        {replyCount > 0 && (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle className="w-3.5 h-3.5" />
            {replyCount} replies
          </span>
        )}
        {quotationCount > 0 && (
          <span className="flex items-center gap-1 text-purple-600">
            <Award className="w-3.5 h-3.5" />
            {quotationCount} quotes
          </span>
        )}
        <span className="ml-auto">{createdAt}</span>
      </div>
    </div>
  );
}
