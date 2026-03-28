'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { formatCurrency } from '@/lib/utils'
import {
  ShoppingCart, Plus, Minus, Package, Zap, Wifi,
  Armchair, PenTool, UtensilsCrossed, Check,
} from 'lucide-react'

type Service = {
  id: number
  event_id: number
  event_title: string
  name: string
  description: string | null
  category: string
  unit_price: number
  unit: string
  is_available: boolean
}

type Order = {
  id: number
  service_name: string
  service_category: string
  quantity: number
  total_price: number
  status: string
  notes: string | null
  created_at: string
}

const CATEGORY_ICONS: Record<string, typeof Zap> = {
  power: Zap,
  wifi: Wifi,
  furniture: Armchair,
  signage: PenTool,
  catering: UtensilsCrossed,
}

export default function PortalServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<Map<number, { service: Service; quantity: number }>>(new Map())
  const [showCart, setShowCart] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders'>('catalog')

  const fetchData = useCallback(async () => {
    try {
      // Fetch available services from exhibitor's events
      const res = await fetch('/api/portal/booth')
      if (res.ok) {
        const data = await res.json()
        // Services would come from a dedicated endpoint
        // For now, show placeholder
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function addToCart(service: Service) {
    setCart(prev => {
      const next = new Map(prev)
      const existing = next.get(service.id)
      next.set(service.id, {
        service,
        quantity: (existing?.quantity || 0) + 1,
      })
      return next
    })
  }

  function removeFromCart(serviceId: number) {
    setCart(prev => {
      const next = new Map(prev)
      const existing = next.get(serviceId)
      if (existing && existing.quantity > 1) {
        next.set(serviceId, { ...existing, quantity: existing.quantity - 1 })
      } else {
        next.delete(serviceId)
      }
      return next
    })
  }

  const cartTotal = Array.from(cart.values()).reduce(
    (sum, item) => sum + item.service.unit_price * item.quantity,
    0
  )

  const cartCount = Array.from(cart.values()).reduce(
    (sum, item) => sum + item.quantity,
    0
  )

  // Group services by category
  const servicesByCategory = services.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = []
    acc[s.category].push(s)
    return acc
  }, {} as Record<string, Service[]>)

  return (
    <>
      <PageHeader
        title="Additional Services"
        description="Order extra services for your booth"
        actions={
          cartCount > 0 ? (
            <Button onClick={() => setShowCart(true)}>
              <ShoppingCart className="h-4 w-4 mr-1.5" />
              Cart ({cartCount})
            </Button>
          ) : undefined
        }
      />

      {/* Tab toggle */}
      <div className="flex gap-1 mb-6">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'catalog' ? 'bg-primary-50 text-primary-700' : 'text-text-secondary hover:bg-surface-tertiary'
          }`}
        >
          Service Catalog
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeTab === 'orders' ? 'bg-primary-50 text-primary-700' : 'text-text-secondary hover:bg-surface-tertiary'
          }`}
        >
          My Orders
        </button>
      </div>

      {activeTab === 'catalog' ? (
        services.length === 0 ? (
          <div className="bg-surface rounded-xl border border-border p-12 text-center">
            <Package className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
            <p className="text-sm font-medium text-text-primary mb-1">No services available</p>
            <p className="text-xs text-text-secondary">Additional services for your events will appear here when available.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(servicesByCategory).map(([category, items]) => {
              const CategoryIcon = CATEGORY_ICONS[category] || Package
              return (
                <div key={category}>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-3">
                    <CategoryIcon className="h-4 w-4 text-primary-500" />
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {items.map(service => {
                      const inCart = cart.get(service.id)
                      return (
                        <div key={service.id} className="bg-surface rounded-xl border border-border p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-text-primary">{service.name}</p>
                              {service.description && (
                                <p className="text-xs text-text-secondary mt-0.5">{service.description}</p>
                              )}
                              <p className="text-sm font-semibold text-primary-600 mt-2">
                                {formatCurrency(service.unit_price)}
                                <span className="text-xs text-text-tertiary font-normal"> / {service.unit}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {inCart ? (
                                <>
                                  <button
                                    onClick={() => removeFromCart(service.id)}
                                    className="h-7 w-7 flex items-center justify-center rounded-md border border-border hover:bg-surface-secondary"
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>
                                  <span className="w-6 text-center text-sm font-medium">{inCart.quantity}</span>
                                  <button
                                    onClick={() => addToCart(service)}
                                    className="h-7 w-7 flex items-center justify-center rounded-md border border-border hover:bg-surface-secondary"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => addToCart(service)}>
                                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        orders.length === 0 ? (
          <div className="bg-surface rounded-xl border border-border p-12 text-center">
            <ShoppingCart className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
            <p className="text-sm font-medium text-text-primary mb-1">No orders yet</p>
            <p className="text-xs text-text-secondary">Your service orders will appear here</p>
          </div>
        ) : (
          <div className="bg-surface rounded-xl border border-border overflow-hidden divide-y divide-border-light">
            {orders.map(order => (
              <div key={order.id} className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-primary">{order.service_name}</p>
                    <p className="text-xs text-text-secondary">Qty: {order.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-text-primary">{formatCurrency(order.total_price)}</p>
                    <Badge color={
                      order.status === 'delivered' ? 'green' :
                      order.status === 'confirmed' ? 'blue' :
                      'amber'
                    } className="text-[10px]">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Cart Modal */}
      <Modal open={showCart} onClose={() => setShowCart(false)} title="Your Cart">
        <div className="space-y-3">
          {Array.from(cart.values()).map(({ service, quantity }) => (
            <div key={service.id} className="flex items-center justify-between py-2 border-b border-border-light last:border-0">
              <div>
                <p className="text-sm font-medium text-text-primary">{service.name}</p>
                <p className="text-xs text-text-secondary">{quantity} × {formatCurrency(service.unit_price)}</p>
              </div>
              <p className="text-sm font-semibold text-text-primary">
                {formatCurrency(service.unit_price * quantity)}
              </p>
            </div>
          ))}
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <p className="text-sm font-semibold text-text-primary">Total</p>
            <p className="text-base font-bold text-primary-600">{formatCurrency(cartTotal)}</p>
          </div>
          <Button className="w-full" loading={submitting}>
            <Check className="h-4 w-4 mr-1.5" /> Place Order
          </Button>
        </div>
      </Modal>
    </>
  )
}
