import { useState } from 'react';
import { HelpCircle, Shield, Cpu, MapPin, ChevronDown, Mail, ExternalLink } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { classNames } from '@/utils/helpers';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FAQItem[] = [
  {
    category: 'ML & Detection',
    question: 'How does FraudShield detect fraudulent transactions?',
    answer: 'FraudShield uses a trained XGBoost Classifier evaluating 20 behavioral, geographical, and temporal features. The engine outputs a real-time fraud probability and risk score (0–100) along with transparent factor explanations.'
  },
  {
    category: 'ML & Detection',
    question: 'What do the risk levels mean?',
    answer: 'Low Risk (0–30): Standard genuine transactions that are automatically approved. Medium Risk (31–70): Elevated risk pattern requiring step-up verification (OTP). High/Critical Risk (71–100): High-confidence anomaly flagged and blocked by the risk engine.'
  },
  {
    category: 'Geolocation',
    question: 'How is location and geographical distance calculated?',
    answer: 'When you grant location access, the browser captures your current GPS coordinates. The backend compares your current position with your most recent previous transaction in MongoDB using the Haversine great-circle formula.'
  },
  {
    category: 'Security',
    question: 'Is my data secure?',
    answer: 'All transactions are authenticated via JSON Web Tokens (JWT) and encrypted in transit. Historical coordinates are strictly isolated per authenticated user account.'
  },
  {
    category: 'Operations',
    question: 'How do I test transactions manually?',
    answer: 'Navigate to Manual Analysis (/detect) from the sidebar. You can input transaction details, click "Use My Current Location", and click "Analyze Transaction" to execute real-time inference.'
  }
];

export default function Help() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [selectedCat, setSelectedCat] = useState<string>('All');

  const categories = ['All', 'ML & Detection', 'Geolocation', 'Security', 'Operations'];

  const filteredFaqs = selectedCat === 'All' 
    ? FAQS 
    : FAQS.filter(f => f.category === selectedCat);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary tracking-tight">HELP & SUPPORT CENTER</h1>
          <p className="text-text-secondary mt-1">Frequently asked questions, system architecture guides, and technical support.</p>
        </div>

        {/* System Overview Cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="card p-5 border-l-4 border-l-primary">
            <div className="flex items-center gap-3 mb-2">
              <Cpu className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-text-primary">XGBoost ML Engine</h3>
            </div>
            <p className="text-xs text-text-secondary">20-feature real-time inference running on Python FastAPI with 98.4% validation accuracy.</p>
          </div>

          <div className="card p-5 border-l-4 border-l-success">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-5 h-5 text-success" />
              <h3 className="text-sm font-bold text-text-primary">Haversine GPS Telemetry</h3>
            </div>
            <p className="text-xs text-text-secondary">Automatic displacement calculation between consecutive transactions.</p>
          </div>

          <div className="card p-5 border-l-4 border-l-warning">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5 text-warning" />
              <h3 className="text-sm font-bold text-text-primary">Adaptive Risk Tiers</h3>
            </div>
            <p className="text-xs text-text-secondary">Automated decisioning: Approve (0-30), OTP Verification (31-70), and Block (71-100).</p>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 pt-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={classNames(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                selectedCat === cat
                  ? 'bg-primary text-background shadow-sm'
                  : 'bg-surface text-text-secondary hover:text-text-primary border border-border'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQs Accordion */}
        <div className="card divide-y divide-border/60">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={idx} className="p-5">
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left gap-4"
                >
                  <span className="text-sm font-bold text-text-primary flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                    {faq.question}
                  </span>
                  <ChevronDown className={classNames('w-4 h-4 text-text-secondary transition-transform shrink-0', isOpen && 'rotate-180')} />
                </button>
                {isOpen && (
                  <p className="text-xs text-text-secondary mt-3 pl-6.5 leading-relaxed bg-background/50 p-3 rounded-lg border border-border/40">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact Support */}
        <div className="card p-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface/80">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">Need Further Assistance?</h4>
              <p className="text-xs text-text-secondary mt-0.5">Reach out to the FraudShield security administration team.</p>
            </div>
          </div>
          <a
            href="mailto:support@fraudshield.io"
            className="btn-secondary text-xs px-4 py-2 font-semibold flex items-center gap-1.5"
          >
            Contact Security Support <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}
