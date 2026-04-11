'use client';

import { useState, useEffect } from 'react';
import { Send, Mail, MessageCircle, Loader2, CheckCircle, AlertCircle, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateRfqDraft, sendRfq } from '@/lib/procurementApi';
import type { ProcurementRequest } from '@/lib/procurementApi';

interface Props {
  request: ProcurementRequest;
  onSent?: (result: { sent: number; failed: number }) => void;
  onDraftUpdated?: (request: ProcurementRequest) => void;
}

type SendStatus = 'idle' | 'sending' | 'success' | 'error';

export function RFQMessageEditor({ request, onSent, onDraftUpdated }: Props) {
  const [subject, setSubject] = useState(request.rfqSubject ?? '');
  const [body, setBody] = useState(request.rfqBody ?? '');

  // Sync when parent refreshes the request (but don't overwrite if user is mid-edit)
  const [isEditing, setIsEditing] = useState(false);
  useEffect(() => {
    if (!isEditing) {
      setSubject(request.rfqSubject ?? '');
      setBody(request.rfqBody ?? '');
    }
  }, [request.rfqSubject, request.rfqBody, isEditing]);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [sendStatus, setSendStatus] = useState<SendStatus>('idle');
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const hasEmailRecipients = request.supplierCandidates.some(
    (c) => c.isSelected && c.contactEmail
  );
  const hasWARecipients = request.supplierCandidates.some(
    (c) => c.isSelected && (c.contactWhatsapp || c.contactPhone)
  );

  const [draftError, setDraftError] = useState<string | null>(null);

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setDraftError(null);
    try {
      const result = await updateRfqDraft(request.id, subject, body);
      onDraftUpdated?.(result.request);
      setIsEditing(false);
    } catch (err: any) {
      setDraftError(err.message || 'Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSend = async (channel: 'email' | 'whatsapp' | 'both') => {
    setSendStatus('sending');
    setSendError(null);
    try {
      // Save draft first if editing
      if (isEditing) {
        await updateRfqDraft(request.id, subject, body);
      }
      const result = await sendRfq(request.id, channel);
      setSendResult(result);
      setSendStatus('success');
      onSent?.(result);
    } catch (err: any) {
      setSendError(err.message || 'Failed to send RFQ');
      setSendStatus('error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">RFQ Message</h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
        >
          <Edit3 className="w-3 h-3" />
          {isEditing ? 'Cancel edit' : 'Edit'}
        </button>
      </div>

      {/* Subject */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Subject</label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={!isEditing}
          className="text-sm"
          placeholder="RFQ Subject"
        />
      </div>

      {/* Body */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Email Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={!isEditing}
          rows={10}
          className="w-full text-xs border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-600 font-mono leading-relaxed"
          placeholder="RFQ message body..."
        />
      </div>

      {isEditing && (
        <div className="space-y-1">
          {draftError && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {draftError}
            </p>
          )}
          <Button
            onClick={handleSaveDraft}
            disabled={isSavingDraft}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {isSavingDraft ? (
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
            ) : null}
            Save Draft
          </Button>
        </div>
      )}

      {/* Send buttons */}
      {sendStatus === 'success' && sendResult && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            Sent to {sendResult.sent} supplier{sendResult.sent !== 1 ? 's' : ''}.
            {sendResult.failed > 0 && ` ${sendResult.failed} failed.`}
          </span>
        </div>
      )}

      {sendStatus === 'error' && sendError && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{sendError}</span>
        </div>
      )}

      <div className="flex gap-2">
        {hasEmailRecipients && (
          <Button
            onClick={() => handleSend('email')}
            disabled={sendStatus === 'sending'}
            size="sm"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {sendStatus === 'sending' ? (
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
            ) : (
              <Mail className="w-3 h-3 mr-2" />
            )}
            Send Email
          </Button>
        )}

        {hasWARecipients && (
          <Button
            onClick={() => handleSend('whatsapp')}
            disabled={sendStatus === 'sending'}
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {sendStatus === 'sending' ? (
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
            ) : (
              <MessageCircle className="w-3 h-3 mr-2" />
            )}
            Send WhatsApp
          </Button>
        )}

        {hasEmailRecipients && hasWARecipients && (
          <Button
            onClick={() => handleSend('both')}
            disabled={sendStatus === 'sending'}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            {sendStatus === 'sending' ? (
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
            ) : (
              <Send className="w-3 h-3 mr-2" />
            )}
            Send Both
          </Button>
        )}
      </div>

      {!hasEmailRecipients && !hasWARecipients && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
          No contact details available for selected suppliers. Please add email or phone numbers.
        </p>
      )}
    </div>
  );
}
