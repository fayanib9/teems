'use client'

import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { ArrowLeft, Star, Award, Mail, Phone } from 'lucide-react'

type VendorMatch = {
  vendor_id: number
  vendor_name: string
  category: string
  score: number
  score_breakdown: { criterion: string; score: number; weight: number }[]
  rating: number
  past_events: number
  contact_email: string
  phone: string
}

type Props = {
  result: {
    id: number
    criteria: { services_needed: string[]; event_type: string; attendees: number; budget_range: string }
    matches: VendorMatch[]
  }
}

function getScoreColor(score: number) {
  if (score >= 70) return 'text-green-600 bg-green-50 border-green-200'
  if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200'
  return 'text-red-600 bg-red-50 border-red-200'
}

export function MatchResultClient({ result }: Props) {
  return (
    <>
      <PageHeader
        title="Vendor Match Results"
        description={`${result.matches.length} vendors found for ${result.criteria.services_needed.join(', ')}`}
        actions={
          <Link href="/tools/vendors" className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />Back
          </Link>
        }
      />

      {/* Criteria summary */}
      <div className="flex flex-wrap gap-2 mb-6">
        {result.criteria.services_needed.map((s: string) => (
          <span key={s} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">{s}</span>
        ))}
        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs capitalize">{result.criteria.event_type}</span>
        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">{result.criteria.attendees?.toLocaleString()} attendees</span>
      </div>

      {result.matches.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <p className="text-text-secondary">No matching vendors found. Try broadening your criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {result.matches.map((vendor, i) => (
            <div key={vendor.vendor_id} className="bg-surface rounded-xl border border-border p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {i < 3 && <Award className={`h-5 w-5 ${i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : 'text-amber-700'}`} />}
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{vendor.vendor_name}</h3>
                    <p className="text-xs text-text-tertiary">{vendor.category} &middot; {vendor.past_events} past events</p>
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-lg border text-lg font-bold ${getScoreColor(vendor.score)}`}>
                  {vendor.score}%
                </div>
              </div>

              {/* Score breakdown */}
              <div className="grid grid-cols-5 gap-2 mb-3">
                {vendor.score_breakdown.map((s) => (
                  <div key={s.criterion} className="text-center">
                    <p className="text-xs text-text-tertiary mb-0.5">{s.criterion}</p>
                    <div className="h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                      <div className="h-full bg-primary-400 rounded-full" style={{ width: `${s.score}%` }} />
                    </div>
                    <p className="text-[10px] text-text-tertiary mt-0.5">{s.score}%</p>
                  </div>
                ))}
              </div>

              {/* Contact */}
              <div className="flex items-center gap-4 pt-3 border-t border-border">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className={`h-3 w-3 ${s < vendor.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                  ))}
                </div>
                {vendor.contact_email && (
                  <span className="flex items-center gap-1 text-xs text-text-tertiary">
                    <Mail className="h-3 w-3" />{vendor.contact_email}
                  </span>
                )}
                {vendor.phone && (
                  <span className="flex items-center gap-1 text-xs text-text-tertiary">
                    <Phone className="h-3 w-3" />{vendor.phone}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
