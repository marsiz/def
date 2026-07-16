'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Pencil, Eye, X, FileText, Trash2 } from 'lucide-react';
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
import { ConfirmDialog, useConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/states';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate, generateQuoteNumber } from '@/lib/format';
import type { Quote, Customer, Product } from '@/lib/types';

interface QuotesClientProps {
  initialQuotes: (Quote & { customer?: Customer | null })[];
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

interface QuoteItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Taslak',
  sent: 'Gönderildi',
  accepted: 'Kabul Edildi',
  rejected: 'Reddedildi',
};

const STATUS_VARIANTS: Record<string, 'secondary' | 'default' | 'destructive'> = {
  draft: 'secondary',
  sent: 'default',
  accepted: 'default',
  rejected: 'destructive',
};

export function QuotesClient() {
  const [quotes, setQuotes] = useState<(Quote & { customer?: Customer | null })[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: qData }, { data: custData }, { data: prodData }] = await Promise.all([
        supabase.from('quotes').select('*, customer:customers(*)').order('created_at', { ascending: false }),
        supabase.from('customers').select('*').order('name'),
        supabase.from('products').select('*').order('name'),
      ]);
      setQuotes((qData || []) as any);
      setCustomers((custData || []) as Customer[]);
      setProducts((prodData || []) as Product[]);
      setLoading(false);
    })();
  }, []);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewQuote, setViewQuote] = useState<(Quote & { customer?: Customer | null; quote_items?: QuoteItem[] }) | null>(null);
  const [saving, setSaving] = useState(false);
  const { open, setOpen, confirm, handleConfirm } = useConfirmDialog();

  const [customerId, setCustomerId] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [productQty, setProductQty] = useState('1');
  const [discount, setDiscount] = useState('0');
  const [taxRate, setTaxRate] = useState('8');
  const [status, setStatus] = useState('draft');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');

  const filtered = quotes.filter((q) => {
    const matchesSearch =
      q.quote_number.toLowerCase().includes(search.toLowerCase()) ||
      (q.customer?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
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
    setStatus('draft');
    setValidUntil('');
    setNotes('');
    setSelectedProduct('');
    setProductQty('1');
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEdit = async (quote: Quote) => {
    const { data: items } = await supabase.from('quote_items').select('*').eq('quote_id', quote.id);
    setEditingId(quote.id);
    setCustomerId(quote.customer_id || '');
    setCart((items || []).map((i: any) => ({
      product_id: i.product_id || '',
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price: Number(i.unit_price),
      unit_cost: Number(i.unit_cost || 0),
      subtotal: Number(i.subtotal),
    })));
    setDiscount(String(quote.discount_amount || 0));
    setTaxRate((((quote.tax_amount || 0) / Math.max(quote.subtotal - (quote.discount_amount || 0), 1)) * 100).toFixed(0));
    setStatus(quote.status);
    setValidUntil(quote.valid_until ? quote.valid_until.slice(0, 10) : '');
    setNotes(quote.notes || '');
    setCreateOpen(true);
  };

  const handleSave = async () => {
    if (cart.length === 0) return;
    setSaving(true);
    const payload = {
      quote_number: generateQuoteNumber(),
      customer_id: customerId || null,
      subtotal: Math.round(subtotal * 100) / 100,
      tax_amount: Math.round(taxAmount * 100) / 100,
      discount_amount: Math.round(discountAmount * 100) / 100,
      total_amount: Math.round(total * 100) / 100,
      status,
      valid_until: validUntil || null,
      notes: notes || null,
    };

    if (editingId) {
      const { data } = await supabase
        .from('quotes')
        .update({ ...payload, quote_number: undefined })
        .eq('id', editingId)
        .select('*,customer:customers(*)')
        .single();
      if (data) {
        await supabase.from('quote_items').delete().eq('quote_id', editingId);
        const itemPayload = cart.map((c) => ({
          quote_id: editingId,
          product_id: c.product_id,
          product_name: c.product_name,
          quantity: c.quantity,
          unit_price: c.unit_price,
          unit_cost: c.unit_cost,
          subtotal: c.subtotal,
        }));
        await supabase.from('quote_items').insert(itemPayload);
        setQuotes((prev) => prev.map((q) => (q.id === data.id ? data : q)));
      }
    } else {
      const { data: quote } = await supabase.from('quotes').insert(payload).select().single();
      if (quote) {
        const itemPayload = cart.map((c) => ({
          quote_id: quote.id,
          product_id: c.product_id,
          product_name: c.product_name,
          quantity: c.quantity,
          unit_price: c.unit_price,
          unit_cost: c.unit_cost,
          subtotal: c.subtotal,
        }));
        await supabase.from('quote_items').insert(itemPayload);
        const { data: fullQuote } = await supabase
          .from('quotes')
          .select('*,customer:customers(*)')
          .eq('id', quote.id)
          .single();
        if (fullQuote) setQuotes((prev) => [fullQuote, ...prev]);
      }
    }
    setSaving(false);
    setCreateOpen(false);
    resetForm();
  };

  const viewQuoteDetails = async (quote: Quote) => {
    const { data: items } = await supabase.from('quote_items').select('*').eq('quote_id', quote.id);
    setViewQuote({ ...quote, quote_items: (items || []) as QuoteItem[] });
  };

  const handleDelete = (id: string) => {
    confirm(async () => {
      await supabase.from('quotes').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      setQuotes((prev) => prev.filter((q) => q.id !== id));
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teklifler"
        description="Müşterilerinize teklifler oluşturun ve takip edin"
        actionLabel="Yeni Teklif"
        actionIcon={<Plus className="h-4 w-4" />}
        onAction={openCreate}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Teklif numarası veya müşteriye göre ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="draft">Taslak</SelectItem>
            <SelectItem value="sent">Gönderildi</SelectItem>
            <SelectItem value="accepted">Kabul Edildi</SelectItem>
            <SelectItem value="rejected">Reddedildi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="glass">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="Teklif bulunamadı"
              description={search ? 'Aramanızı değiştirmeyi deneyin' : 'İlk teklifinizi oluşturun'}
              action={!search && <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Yeni Teklif</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teklif No</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">Toplam</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filtered.map((q, i) => (
                    <motion.tr
                      key={q.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => viewQuoteDetails(q)}
                    >
                      <TableCell className="font-medium">{q.quote_number}</TableCell>
                      <TableCell>{q.customer?.name || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(q.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[q.status] || 'secondary'}>
                          {STATUS_LABELS[q.status] || q.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(Number(q.total_amount))}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(q); }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); viewQuoteDetails(q); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(q.id); }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Teklif Düzenle' : 'Yeni Teklif'}</DialogTitle>
            <DialogDescription>Müşterinize yeni bir teklif hazırlayın</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Müşteri</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger><SelectValue placeholder="Müşteri seç" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Durum</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Taslak</SelectItem>
                    <SelectItem value="sent">Gönderildi</SelectItem>
                    <SelectItem value="accepted">Kabul Edildi</SelectItem>
                    <SelectItem value="rejected">Reddedildi</SelectItem>
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
                    {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} — {formatCurrency(p.sale_price)}</SelectItem>)}
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

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>İndirim (₺)</Label>
                <Input type="number" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>KDV (%)</Label>
                <Input type="number" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Geçerlilik Tarihi</Label>
                <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
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
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); }}>İptal</Button>
            <Button onClick={handleSave} disabled={saving || cart.length === 0}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewQuote} onOpenChange={(open) => !open && setViewQuote(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
          {viewQuote && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {viewQuote.quote_number}
                </DialogTitle>
                <DialogDescription>
                  {formatDate(viewQuote.created_at)} • {viewQuote.customer?.name || '—'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="flex items-center justify-between">
                  <Badge variant={STATUS_VARIANTS[viewQuote.status] || 'secondary'}>
                    {STATUS_LABELS[viewQuote.status] || viewQuote.status}
                  </Badge>
                  {viewQuote.valid_until && (
                    <span className="text-sm text-muted-foreground">
                      Geçerlilik: {formatDate(viewQuote.valid_until)}
                    </span>
                  )}
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
                    {viewQuote.quote_items?.map((item) => (
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
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Ara Toplam</span><span>{formatCurrency(Number(viewQuote.subtotal))}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">İndirim</span><span>-{formatCurrency(Number(viewQuote.discount_amount))}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">KDV</span><span>{formatCurrency(Number(viewQuote.tax_amount))}</span></div>
                  <div className="flex justify-between text-base font-bold border-t border-border pt-2"><span>Toplam</span><span>{formatCurrency(Number(viewQuote.total_amount))}</span></div>
                </div>

                {viewQuote.notes && (
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground mb-1">Notlar</p>
                    <p className="text-sm">{viewQuote.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Teklifi Sil"
        description="Bu teklifi silmek istediğinizden emin misiniz? Bu işlem geri alınabilir."
        onConfirm={handleConfirm}
        confirmLabel="Sil"
      />
    </div>
  );
}
