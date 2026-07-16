'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, AlertTriangle, Filter, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/states';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';
import type { Product, Category, Brand, Supplier } from '@/lib/types';

interface StockClientProps {
  initialProducts: (Product & { category?: Category | null; brand?: Brand | null; supplier?: Supplier | null })[];
}

interface StockMovementForm {
  productId: string;
  productName: string;
  type: 'in' | 'out';
  quantity: string;
  reference: string;
  notes: string;
}

const emptyMovement: StockMovementForm = {
  productId: '',
  productName: '',
  type: 'in',
  quantity: '',
  reference: '',
  notes: '',
};

export function StockClient({ initialProducts }: StockClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [movement, setMovement] = useState<StockMovementForm>(emptyMovement);
  const [saving, setSaving] = useState(false);

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode || '').includes(search);
    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'low' && p.stock_quantity <= p.min_stock_level && p.stock_quantity > 0) ||
      (stockFilter === 'out' && p.stock_quantity === 0);
    return matchesSearch && matchesStock;
  });

  const lowStockCount = products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_level).length;
  const outOfStockCount = products.filter((p) => p.stock_quantity === 0).length;

  const openMovement = (product: Product, type: 'in' | 'out') => {
    setMovement({
      productId: product.id,
      productName: product.name,
      type,
      quantity: '',
      reference: '',
      notes: '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const qty = parseInt(movement.quantity) || 0;
    if (qty <= 0) return;

    const product = products.find((p) => p.id === movement.productId);
    if (!product) return;

    if (movement.type === 'out' && qty > product.stock_quantity) {
      alert('Yetersiz stok! Çıkış miktarı mevcut stoktan fazla olamaz.');
      return;
    }

    setSaving(true);

    const newQuantity =
      movement.type === 'in' ? product.stock_quantity + qty : product.stock_quantity - qty;

    const { error: updateError } = await supabase
      .from('products')
      .update({ stock_quantity: newQuantity })
      .eq('id', movement.productId);

    if (updateError) {
      setSaving(false);
      return;
    }

    await supabase.from('stock_movements').insert({
      product_id: movement.productId,
      movement_type: movement.type,
      quantity: qty,
      reference: movement.reference || null,
      notes: movement.notes || null,
    });

    setProducts((prev) =>
      prev.map((p) => (p.id === movement.productId ? { ...p, stock_quantity: newQuantity } : p))
    );

    setSaving(false);
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stok Yönetimi"
        description="Stok seviyelerini takip edin, giriş ve çıkış hareketlerini yönetin"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="glass">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Toplam Ürün</p>
                <p className="text-lg font-bold">{products.length}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Düşük Stok</p>
                <p className="text-lg font-bold">{lowStockCount}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="glass">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tükendi</p>
                <p className="text-lg font-bold">{outOfStockCount}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={stockFilter} onValueChange={(v) => setStockFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Stok</SelectItem>
            <SelectItem value="low">Düşük Stok</SelectItem>
            <SelectItem value="out">Tükendi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="glass">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Package className="h-8 w-8" />}
              title="Ürün bulunamadı"
              description={search ? "Aramanızı veya filitrelerinizi değiştirmeyi deneyin" : "Henüz ürün eklenmemiş"}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ürün</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Fiyat</TableHead>
                  <TableHead className="text-center">Stok</TableHead>
                  <TableHead className="text-center">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filtered.map((p, i) => (
                    <motion.tr
                      key={p.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
                            <Package className="h-5 w-5" />
                          </div>
                          <div>
                            <p>{p.name}</p>
                            {p.brand && (
                              <p className="text-xs text-muted-foreground">{p.brand.name}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.sku}</TableCell>
                      <TableCell>{p.category?.name || '—'}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(p.sale_price)}</TableCell>
                      <TableCell className="text-center">
                        {p.stock_quantity === 0 ? (
                          <Badge variant="destructive">Tükendi</Badge>
                        ) : p.stock_quantity <= p.min_stock_level ? (
                          <Badge variant="secondary" className="gap-1 bg-warning/20 text-warning">
                            <AlertTriangle className="h-3 w-3" />
                            {p.stock_quantity}
                          </Badge>
                        ) : (
                          <span className="font-medium">{p.stock_quantity}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => openMovement(p, 'in')}
                          >
                            <ArrowDownToLine className="h-3.5 w-3.5" />
                            Stok Girişi
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => openMovement(p, 'out')}
                            disabled={p.stock_quantity === 0}
                          >
                            <ArrowUpFromLine className="h-3.5 w-3.5" />
                            Stok Çıkışı
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {movement.type === 'in' ? 'Stok Girişi' : 'Stok Çıkışı'} — {movement.productName}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Miktar</Label>
              <Input
                type="number"
                value={movement.quantity}
                onChange={(e) => setMovement({ ...movement, quantity: e.target.value })}
                placeholder="0"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Referans</Label>
              <Input
                value={movement.reference}
                onChange={(e) => setMovement({ ...movement, reference: e.target.value })}
                placeholder="Fatura no, irsaliye no vb."
              />
            </div>
            <div className="space-y-2">
              <Label>Notlar</Label>
              <Textarea
                value={movement.notes}
                onChange={(e) => setMovement({ ...movement, notes: e.target.value })}
                rows={2}
                placeholder="Açıklama"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>İptal</Button>
            <Button onClick={handleSave} disabled={saving || !movement.quantity}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
