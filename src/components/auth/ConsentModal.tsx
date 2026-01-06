import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Mail, Sparkles } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConsentModalProps {
  isOpen: boolean;
  type: 'marketing' | 'personalization';
  onAccept: () => void;
  onDecline: () => void;
}

export function ConsentModal({ isOpen, type, onAccept, onDecline }: ConsentModalProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const isMarketing = type === 'marketing';
  const Icon = isMarketing ? Mail : Sparkles;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-md p-0 gap-0 bg-white rounded-2xl overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="bg-[#0B6BD3] p-6 text-white">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-4">
            <Icon className="w-7 h-7" />
          </div>
          <h2 className="font-heading text-xl font-bold">
            {isMarketing ? t('consent.marketingTitle') : t('consent.personalizationTitle')}
          </h2>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-[#0F172A] text-sm leading-relaxed mb-4">
            {isMarketing ? t('consent.marketingBody') : t('consent.personalizationBody')}
          </p>

          {/* Expandable section */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm text-[#0B6BD3] hover:text-[#095BB3] font-medium mb-4"
          >
            {t('consent.learnMore')}
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {expanded && (
            <div className="bg-[#F5F7FA] rounded-lg p-4 mb-4 text-sm text-[#64748B] leading-relaxed animate-fade-in">
              {isMarketing ? t('consent.marketingDetails') : t('consent.personalizationDetails')}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onDecline}
              className="flex-1 h-12 rounded-full border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] font-medium"
            >
              {t('consent.decline')}
            </Button>
            <Button
              onClick={onAccept}
              className="flex-1 h-12 rounded-full bg-[#0B6BD3] hover:bg-[#095BB3] text-white font-semibold"
            >
              {t('consent.accept')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
