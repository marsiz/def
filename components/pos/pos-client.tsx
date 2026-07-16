'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, Trash2, Package, User, CreditCard, Banknote, Building2, CheckCircle2, Plus, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/states';
import { supabase } from '@/lib/supabase';
import { formatCurrency, generateInvoiceNumber } from '@/lib/format';
import type { Product, Customer } from '@/lib/types';

interface PosClientProps {
  products: Product[];
  customers: Customer[];
}

interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  subtotal: number;
}

const TAX_RATE = 8;

export function PosClient({ products, customers }: PosClientProps) {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [saving, setSaving] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<string | null>(null);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode || '').includes(search)
  );

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const taxAmount = (subtotal * TAX_RATE) / 100;
  const total = subtotal + taxAmount;

  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) return;
    const existing = cart.find((c) => c.product_id === product.id);
    if (existing) {
      setCart(cart.map((c) =>
        c.product_id === product.id
          ? { ...c, quantity: c.quantity + 1, subtotal: (c.quantity + 1) * c.unit_price }
          : c
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: Number(product.sale_price),
        unit_cost: Number(product.cost_price),
        subtotal: Number(product.sale_price),
      }]);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.product_id !== id) return c;
          const qty = c.quantity + delta;
          if (qty <= 0) return null;
          return { ...c, quantity: qty, subtotal: qty * c.unit_price };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: string) => setCart(cart.filter((c) => c.product_id !== id));

  const clearCart = () => {
    setCart([]);
    setCustomerId('');
    setPaymentMethod('cash');
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSaving(true);
    const invoiceNumber = generateInvoiceNumber();
    const salePayload = {
      invoice_number: invoiceNumber,
      customer_id: customerId || null,
      subtotal: Math.round(subtotal * 100) / 100,
      tax_amount: Math.round(taxAmount * 100) / 100,
      discount_amount: 0,
      total_amount: Math.round(total * 100) / 100,
      paid_amount: Math.round(total * 100) / 100,
      status: 'paid',
      payment_method: paymentMethod,
      notes: null,
    };

    const { data: sale, error } = await supabase.from('sales').insert(salePayload).select().single();
    if (sale) {
      const itemPayload = cart.map((c) => ({
        sale_id: sale.id,
        product_id: c.product_id,
        product_name: c.product_name,
        quantity: c.quantity,
        unit_price: c.unit_price,
        unit_cost: c.unit_cost,
        subtotal: c.subtotal,
      }));
      await supabase.from('sale_items').insert(itemPayload);

      for (const item of cart) {
        const product = products.find((p) => p.id === item.product_id);
        if (product) {
          await supabase
            .from('products')
            .update({ stock_quantity: Math.max(product.stock_quantity - item.quantity, 0) })
            .eq('id', item.product_id);
        }
      }

      setLastInvoice(invoiceNumber);
      clearCart();
    }
    setSaving(false);
  };

  const paymentMethods = [
    { value: 'cash', label: 'Nakit', icon: <Banknote className="h-4 w-4" /> },
    { value: 'card', label: 'Kart', icon: <CreditCard className="h-4 w-4" /> },
    { value: 'bank', label: 'Havale', icon: <Building2 className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="POS Ekranı"
        description="Hızlı satış işlemi oluşturun"
      />

      {lastInvoice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4"
        >
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div className="flex-1">
            <p className="text-sm font-medium">Satış başarıyla tamamlandı</p>
            <p className="text-xs text-muted-foreground">Fatura No: {lastInvoice}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setLastInvoice(null)}>Kapat</Button>
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Sol: Ürün Grid */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Ürün Ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {filtered.length === 0 ? (
            <Card className="glass">
              <CardContent className="p-0">
                <EmptyState
                  icon={<Package className="h-8 w-8" />}
                  title="Ürün bulunamadı"
                  description={search ? 'Aramanızı değiştirmeyi deneyin' : 'Önce ürün ekleyin'}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence>
                {filtered.map((p, i) => {
                  const outOfStock = p.stock_quantity <= 0;
                  const inCart = cart.find((c) => c.product_id === p.id);
                  return (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02 }}
                      whileHover={{ y: -2 }}
                      onClick={() => addToCart(p)}
                      className={`group relative cursor-pointer rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 ${
                        outOfStock ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground mb-3">
                        <Package className="h-6 w-6" />
                      </div>
                      <p className="font-medium text-sm line-clamp-2 mb-1">{p.name}</p>
                      <p className="text-xs text-muted-foreground mb-2">{p.sku}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary">{formatCurrency(p.sale_price)}</span>
                        <Badge variant={outOfStock ? 'destructive' : 'secondary'} className="text-[10px]">
                          {outOfStock ? 'Tükendi' : `${p.stock_quantity} stokta`}
                        </Badge>
                      </div>
                      {inCart && (
                        <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                          {inCart.quantity}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Sağ: Sepet */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card className="glass">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Sepet</h3>
                  {cart.length > 0 && (
                    <Badge variant="secondary" className="text-[10px]">{cart.length} ürün</Badge>
                  )}
                </div>
                {cart.length > 0 && (
                  <Button variant="ghost" size="sm" className="gap-1 text-destructive" onClick={clearCart}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Boş Sepet
                  </Button>
                )}
              </div>

              {/* Müşteri */}
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Müşteri
                </Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger><SelectValue placeholder="Yoldaki Müşteri" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Sepet öğeleri */}
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <ShoppingCart className="h-10 w-10 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Sepet boş</p>
                  <p className="text-xs text-muted-foreground/70">Ürün kartına tıklayarak ekleyin</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[280px] overflow-y-auto scrollbar-thin pr-1">
                  <AnimatePresence>
                    {cart.map((item) => (
                      <motion.div
                        key={item.product_id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center gap-2 rounded-lg bg-muted/30 p-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(item.unit_price)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQty(item.product_id, -1)}>
                            <Minus className="h-3.5 w-3.5" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQty(item.product_id, 1)}>
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold w-16 text-right">{formatCurrency(item.subtotal)}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFromCart(item.product_id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Ödeme Yöntemi */}
              <div className="space-y-2">
                <Label className="text-xs">Ödeme Yöntemi</Label>
                <div className="grid grid-cols-3 gap-2">
                  {paymentMethods.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setPaymentMethod(m.value)}
                      className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors ${
                        paymentMethod === m.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:bg-muted/30'
                      }`}
                    >
                      {m.icon}
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Özet */}
              <div className="space-y-2 rounded-lg bg-muted/30 p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ara Toplam</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">KDV (%{TAX_RATE})</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-border pt-2">
                  <span>Toplam</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <Button
                className="w-full gap-2"
                size="lg"
                onClick={handleCheckout}
                disabled={saving || cart.length === 0}
              >
                {saving ? 'İşleniyor...' : <><CheckCircle2 className="h-4 w-4" /> Satışı Tamamla</>}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
