'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useLanguage } from '@/lib/i18n'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  member_price: number | null
  images: string[]
  stock: number
  made_to_order: boolean
  production_time: string | null
  quantity_limit: number | null
  sale_start_date: string | null
  sale_end_date: string | null
}

interface Props {
  userEmail: string
  userName: string
}

export default function ShopClient({ userEmail, userName }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState('')

  // Shipping form
  const [shippingName, setShippingName] = useState(userName)
  const [shippingEmail, setShippingEmail] = useState(userEmail)
  const [shippingPhone, setShippingPhone] = useState('')
  const [shippingPostalCode, setShippingPostalCode] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')

  const { t } = useLanguage()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/shop-products')
      const data = await res.json()
      if (res.ok && Array.isArray(data)) {
        const now = new Date()
        const filtered = data.filter((p: Product) => {
          if (p.sale_start_date && now < new Date(p.sale_start_date)) return false
          if (p.sale_end_date && now > new Date(p.sale_end_date)) return false
          return true
        })
        setProducts(filtered)
      } else if (Array.isArray(data)) {
        setProducts(data)
      }
    } catch (e) {
      console.error('Failed to fetch products:', e)
    } finally {
      setLoading(false)
    }
  }

  const getPrice = (product: Product) => {
    // GUILD members always get member price
    if (product.member_price != null && product.member_price < product.price) {
      return product.member_price
    }
    return product.price
  }

  const maxQty = (product: Product) => {
    if (product.made_to_order) return product.quantity_limit || 99
    return Math.min(product.stock, product.quantity_limit || 99)
  }

  const handleCheckout = async () => {
    if (!selectedProduct) return

    if (!shippingName || !shippingEmail || !shippingPhone || !shippingPostalCode || !shippingAddress) {
      setError('配送先情報をすべて入力してください')
      return
    }

    setError('')
    setCheckoutLoading(true)

    try {
      const res = await fetch('/api/shop-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ product_id: selectedProduct.id, quantity }],
          shipping: {
            name: shippingName,
            email: shippingEmail,
            phone: shippingPhone,
            postal_code: shippingPostalCode,
            address: shippingAddress,
          },
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '決済の作成に失敗しました')
        return
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch {
      setError('エラーが発生しました')
    } finally {
      setCheckoutLoading(false)
    }
  }

  // Postal code auto-fill
  const handlePostalCode = async (code: string) => {
    setShippingPostalCode(code)
    const clean = code.replace('-', '')
    if (clean.length === 7) {
      try {
        const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${clean}`)
        const data = await res.json()
        if (data.results?.[0]) {
          const r = data.results[0]
          setShippingAddress(`${r.address1}${r.address2}${r.address3}`)
        }
      } catch { /* ignore */ }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center flex-col gap-2">
        <div className="animate-pulse text-zinc-500">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] tracking-[0.25em] uppercase text-zinc-500 mb-2">FOMUS GUILD Members</p>
          <h1 className="text-2xl font-light text-white">Shop</h1>
          <p className="text-xs text-zinc-400 mt-2">GUILD会員限定価格 ・ 日本国内発送のみ（送料 ¥800）</p>
        </div>

        {/* Product Detail View */}
        {selectedProduct ? (
          <div>
            <button
              onClick={() => { setSelectedProduct(null); setQuantity(1); setError('') }}
              className="text-xs text-zinc-400 hover:text-white transition-colors mb-6 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
              商品一覧に戻る
            </button>

            {/* Product */}
            <div className="bg-white/5 backdrop-blur rounded-2xl border border-zinc-700/50 overflow-hidden">
              {selectedProduct.images?.[0] && (
                <div className="aspect-square relative">
                  <Image
                    src={selectedProduct.images[0]}
                    alt={selectedProduct.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 672px) 100vw, 672px"
                  />
                </div>
              )}
              <div className="p-6">
                <h2 className="text-xl font-light text-white mb-2">{selectedProduct.name}</h2>
                {selectedProduct.description && (
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4 whitespace-pre-wrap">{selectedProduct.description}</p>
                )}

                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-2xl font-light text-white">
                    ¥{getPrice(selectedProduct).toLocaleString()}
                  </span>
                  {selectedProduct.member_price != null && selectedProduct.member_price < selectedProduct.price && (
                    <span className="text-sm text-zinc-500 line-through">
                      ¥{selectedProduct.price.toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-teal-400 tracking-wide mb-4">GUILD会員価格 ・ 送料 ¥800</p>

                {selectedProduct.made_to_order && (
                  <p className="text-xs text-zinc-500 mb-4">
                    完全受注生産 — 数量限定
                    {selectedProduct.production_time && ` / ${selectedProduct.production_time}`}
                  </p>
                )}

                {/* Quantity */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-xs text-zinc-400">数量</span>
                  <div className="flex items-center border border-zinc-700 rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 text-zinc-400 hover:text-white transition-colors"
                      disabled={quantity <= 1}
                    >−</button>
                    <span className="w-10 text-center text-sm text-white">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(maxQty(selectedProduct), quantity + 1))}
                      className="px-3 py-2 text-zinc-400 hover:text-white transition-colors"
                      disabled={quantity >= maxQty(selectedProduct)}
                    >+</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Form */}
            <div className="mt-6 bg-white/5 backdrop-blur rounded-2xl border border-zinc-700/50 p-6">
              <h3 className="text-sm font-medium text-white mb-4">配送先</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={shippingName}
                  onChange={(e) => setShippingName(e.target.value)}
                  placeholder="お名前"
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                />
                <input
                  type="email"
                  value={shippingEmail}
                  onChange={(e) => setShippingEmail(e.target.value)}
                  placeholder="メールアドレス"
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                />
                <input
                  type="tel"
                  value={shippingPhone}
                  onChange={(e) => setShippingPhone(e.target.value)}
                  placeholder="電話番号"
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                />
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={shippingPostalCode}
                    onChange={(e) => handlePostalCode(e.target.value)}
                    placeholder="郵便番号"
                    className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                  <input
                    type="text"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="住所"
                    className="col-span-2 bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>
              </div>
            </div>

            {/* Total & Checkout */}
            <div className="mt-6 bg-white/5 backdrop-blur rounded-2xl border border-zinc-700/50 p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-zinc-400">小計</span>
                <span className="text-sm text-white">¥{(getPrice(selectedProduct) * quantity).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-zinc-400">送料</span>
                <span className="text-sm text-zinc-300">¥800</span>
              </div>
              <div className="border-t border-zinc-700 pt-4 flex justify-between items-center">
                <span className="text-sm font-medium text-white">合計</span>
                <span className="text-xl font-light text-white">¥{(getPrice(selectedProduct) * quantity + 800).toLocaleString()}</span>
              </div>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
            )}

            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="mt-6 w-full bg-white text-zinc-900 py-4 rounded-xl text-sm font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkoutLoading ? '処理中...' : '購入する'}
            </button>

            <p className="mt-3 text-[10px] text-zinc-600 text-center">
              Stripe決済画面に移動します。クレジットカード決済のみ対応。
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* GUILD Exclusive Products */}
            {(() => {
              const guildProducts = products.filter(p => p.member_price != null && p.member_price < p.price)
              const hasGuildProducts = guildProducts.length > 0

              return (
                <>
                  {hasGuildProducts && (
                    <div>
                      <p className="text-[10px] tracking-[0.2em] uppercase text-teal-400 mb-4">GUILD Member Exclusive</p>
                      <div className="space-y-4">
                        {guildProducts.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => setSelectedProduct(product)}
                            className="w-full bg-white/5 backdrop-blur rounded-2xl border border-teal-500/20 overflow-hidden hover:border-teal-500/50 transition-colors text-left"
                          >
                            <div className="flex gap-4 p-4">
                              {product.images?.[0] && (
                                <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 relative">
                                  <Image
                                    src={product.images[0]}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    sizes="96px"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-medium text-white line-clamp-1">{product.name}</h3>
                                {product.made_to_order && (
                                  <p className="text-[10px] text-zinc-500 mt-0.5">完全受注生産 — 数量限定</p>
                                )}
                                <div className="mt-2 flex items-baseline gap-2">
                                  <span className="text-lg font-light text-white">
                                    ¥{product.member_price!.toLocaleString()}
                                  </span>
                                  <span className="text-xs text-zinc-500 line-through">
                                    ¥{product.price.toLocaleString()}
                                  </span>
                                </div>
                                <span className="text-[10px] text-teal-400 tracking-wide">GUILD会員価格</span>
                              </div>
                              <div className="flex items-center">
                                <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!hasGuildProducts && (
                    <div className="text-center py-12">
                      <p className="text-zinc-500 text-sm">現在GUILD会員限定商品はありません</p>
                    </div>
                  )}
                </>
              )
            })()}

            {/* Link to FOMUS SHOP */}
            <div className="border-t border-zinc-700/50 pt-8">
              <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-4">All Products</p>
              <a
                href="https://shop.fomus.jp/shop"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-white/5 backdrop-blur rounded-2xl border border-zinc-700/50 overflow-hidden hover:border-zinc-500/50 transition-colors p-5 text-center"
              >
                <p className="text-sm font-medium text-white mb-1">FOMUS SHOPで全商品を見る</p>
                <p className="text-[10px] text-zinc-500">枡・SILVA・ランニングウェアなど</p>
                <div className="mt-3 inline-flex items-center gap-2 text-[10px] tracking-[0.15em] uppercase text-zinc-400">
                  <span>shop.fomus.jp</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </div>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
