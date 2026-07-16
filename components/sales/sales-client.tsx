'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, Receipt, Eye, X, Printer, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/states';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate, generateInvoiceNumber } from '@/lib/format';
import type { Sale, Customer, Product, SaleItem } from '@/lib/types';

interface SalesClientProps {
  initialSales: (Sale & { customer?: Customer | null })[];
  customers: Customer[];
  products: Product[];
}

interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  subtotal: number;
}

export function SalesClient({ initialSales, customers, products }: SalesClientProps) {
  const [sales, setSales] = useState(initialSales);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [viewSale, setViewSale] = useState<(Sale & { customer?: Customer | null; sale_items?: SaleItem[] }) | null>(null);
  const [saving, setSaving] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [productQty, setProductQty] = useState('1');
  const [discount, setDiscount] = useState('0');
  const [taxRate, setTaxRate] = useState('8');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');

  const filtered = sales.filter((s) => {
    const matchesSearch =
      s.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (s.customer?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = parseFloat(discount) || 0;
  const taxableAmount = Math.max(subtotal - discountAmount, 0);
  const taxAmount = (taxableAmount * (parseFloat(taxRate) || 0)) / 100;
  const total = taxableAmount + taxAmount;

  const addToCart = () => {
    if (!selectedProduct) return;
    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;
    const qty = parseInt(productQty) || 1;
    const existing = cart.find((c) => c.product_id === product.id);
    if (existing) {
      setCart(cart.map((c) =>
        c.product_id === product.id
          ? { ...c, quantity: c.quantity + qty, subtotal: (c.quantity + qty) * c.unit_price }
          : c
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        product_name: product.name,
        quantity: qty,
        unit_price: Number(product.sale_price),
        unit_cost: Number(product.cost_price),
        subtotal: qty * Number(product.sale_price),
      }]);
    }
    setSelectedProduct('');
    setProductQty('1');
  };

  const removeFromCart = (id: string) => setCart(cart.filter((c) => c.product_id !== id));

  const resetForm = () => {
    setCustomerId('');
    setCart([]);
    setDiscount('0');
    setTaxRate('8');
    setPaymentMethod('cash');
    setNotes('');
    setSelectedProduct('');
    setProductQty('1');
  };

  const handleCreate = async () => {
    if (cart.length === 0) return;
    setSaving(true);
    const invoiceNumber = generateInvoiceNumber();
    const salePayload = {
      invoice_number: invoiceNumber,
      customer_id: customerId || null,
      subtotal: Math.round(subtotal * 100) / 100,
      tax_amount: Math.round(taxAmount * 100) / 100,
      discount_amount: Math.round(discountAmount * 100) / 100,
      total_amount: Math.round(total * 100) / 100,
      paid_amount: Math.round(total * 100) / 100,
      status: 'paid',
      payment_method: paymentMethod,
      notes: notes || null,
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
          await supabase.from('products').update({ stock_quantity: Math.max(product.stock_quantity - item.quantity, 0) }).eq('id', item.product_id);
        }
      }

      const { data: fullSale } = await supabase
        .from('sales')
        .select('*,customer:customers(*)')
        .eq('id', sale.id)
        .single();

      if (fullSale) setSales((prev) => [fullSale, ...prev]);
    }
    setSaving(false);
    setCreateOpen(false);
    resetForm();
  };

  const viewSaleDetails = async (sale: Sale) => {
    const { data: items } = await supabase.from('sale_items').select('*').eq('sale_id', sale.id);
    setViewSale({ ...sale, sale_items: items || [] });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Satışlar ve Faturalar"
        description="Satış faturaları oluşturun ve işlemleri takip edin"
        actionLabel="Yeni Satış"
        actionIcon={<Plus className="h-4 w-4" />}
        onAction={() => { resetForm(); setCreateOpen(true); }}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Fatura numarası veya müşteriye göre ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="paid">Ödendi</SelectItem>
            <SelectItem value="pending">Bekliyor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="glass">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-8 w-8" />}
              title="Satış bulunamadı"
              description={search ? "Aramanızı değiştirmeyi deneyin" : "İlk satış faturanızı oluşturun"}
              action={!search && <Button onClick={() => setCreateOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Yeni Satış</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fatura No</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Ödeme</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">Toplam</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filtered.map((s, i) => (
                    <motion.tr
                      key={s.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => viewSaleDetails(s)}
                    >
                      <TableCell className="font-medium">{s.invoice_number}</TableCell>
                      <TableCell>{s.customer?.name || 'Yoldaki Müşteri'}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(s.sale_date)}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {s.payment_method === 'cash' ? 'Nakit' : s.payment_method === 'card' ? 'Kart' : s.payment_method === 'bank' ? 'Havale' : 'Taksit'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.status === 'paid' ? 'default' : 'destructive'}>
                          {s.status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(Number(s.total_amount))}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); viewSaleDetails(s); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle>Yeni Satış Faturası</DialogTitle>
            <DialogDescription>Yeni bir satış işlemi oluşturun</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Müşteri</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger><SelectValue placeholder="Yoldaki Müşteri" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ödeme Yöntemi</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Nakit</SelectItem>
                    <SelectItem value="card">Kredi Kartı</SelectItem>
                    <SelectItem value="bank">Havale/EFT</SelectItem>
                    <SelectItem value="installment">Taksit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg border border-border p-4 space-y-3">
              <Label className="text-sm font-semibold">Ürün Ekle</Label>
              <div className="flex gap-2">
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Ürün seç" /></SelectTrigger>
                  <SelectContent>
                    {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} — {formatCurrency(p.sale_price)} ({p.stock_quantity} stokta)</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="number" min="1" value={productQty} onChange={(e) => setProductQty(e.target.value)} className="w-20" />
                <Button onClick={addToCart} disabled={!selectedProduct}><Plus className="h-4 w-4" /></Button>
              </div>

              {cart.length > 0 && (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.product_id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">{item.quantity} x {formatCurrency(item.unit_price)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{formatCurrency(item.subtotal)}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeFromCart(item.product_id)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>İndirim (₺)</Label>
                <Input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>KDV Oranı (%)</Label>
                <Input type="number" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
              </div>
            </div>

            <div className="rounded-lg bg-muted/30 p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Ara Toplam</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">İndirim</span><span>-{formatCurrency(discountAmount)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">KDV ({taxRate}%)</span><span>{formatCurrency(taxAmount)}</span></div>
              <div className="flex justify-between text-base font-bold border-t border-border pt-2"><span>Toplam</span><span>{formatCurrency(total)}</span></div>
            </div>

            <div className="space-y-2">
              <Label>Notlar</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="İsteğe bağlı notlar" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>İptal</Button>
            <Button onClick={handleCreate} disabled={saving || cart.length === 0}>
              {saving ? 'İşleniyor...' : 'Satışı Tamamla'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewSale} onOpenChange={(open) => !open && setViewSale(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
          {viewSale && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  {viewSale.invoice_number}
                </DialogTitle>
                <DialogDescription>
                  {formatDate(viewSale.sale_date)} • {viewSale.customer?.name || 'Yoldaki Müşteri'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="flex items-center justify-between">
                  <Badge variant={viewSale.status === 'paid' ? 'default' : 'destructive'}>
                    {viewSale.status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {viewSale.payment_method === 'cash' ? 'Nakit' : viewSale.payment_method === 'card' ? 'Kredi Kartı' : viewSale.payment_method === 'bank' ? 'Havale/EFT' : 'Taksit'}
                  </span>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ürün</TableHead>
                      <TableHead className="text-center">Adet</TableHead>
                      <TableHead className="text-right">Fiyat</TableHead>
                      <TableHead className="text-right">Toplam</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewSale.sale_items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(item.unit_price))}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(Number(item.subtotal))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="rounded-lg bg-muted/30 p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Ara Toplam</span><span>{formatCurrency(Number(viewSale.subtotal))}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">İndirim</span><span>-{formatCurrency(Number(viewSale.discount_amount))}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">KDV</span><span>{formatCurrency(Number(viewSale.tax_amount))}</span></div>
                  <div className="flex justify-between text-base font-bold border-t border-border pt-2"><span>Toplam</span><span>{formatCurrency(Number(viewSale.total_amount))}</span></div>
                </div>

                {viewSale.notes && (
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground mb-1">Notlar</p>
                    <p className="text-sm">{viewSale.notes}</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" className="gap-2"><Printer className="h-4 w-4" />Yazdır</Button>
                <Button variant="outline" className="gap-2"><Download className="h-4 w-4" />İndir</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
