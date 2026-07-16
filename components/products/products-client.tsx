'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Pencil, Trash2, Package, AlertTriangle, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmDialog, useConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState, TableSkeleton } from '@/components/shared/states';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';
import type { Product, Category, Brand, Supplier } from '@/lib/types';

interface ProductsClientProps {
  initialProducts: (Product & { category?: Category | null; brand?: Brand | null })[];
  categories: Category[];
  brands: Brand[];
  suppliers: Supplier[];
}

type ProductForm = {
  id?: string;
  sku: string;
  barcode: string;
  name: string;
  description: string;
  category_id: string;
  brand_id: string;
  supplier_id: string;
  cost_price: string;
  sale_price: string;
  stock_quantity: string;
  min_stock_level: string;
  unit: string;
  has_serial_tracking: boolean;
};

const emptyForm: ProductForm = {
  sku: '',
  barcode: '',
  name: '',
  description: '',
  category_id: '',
  brand_id: '',
  supplier_id: '',
  cost_price: '0',
  sale_price: '0',
  stock_quantity: '0',
  min_stock_level: '5',
  unit: 'pcs',
  has_serial_tracking: false,
};

export function ProductsClient({ initialProducts, categories, brands, suppliers }: ProductsClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { open, setOpen, confirm, handleConfirm } = useConfirmDialog();

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

  const openCreate = () => {
    setEditing({ ...emptyForm, sku: `SKU-${Date.now().toString().slice(-6)}` });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing({
      id: p.id,
      sku: p.sku,
      barcode: p.barcode || '',
      name: p.name,
      description: p.description || '',
      category_id: p.category_id || '',
      brand_id: p.brand_id || '',
      supplier_id: p.supplier_id || '',
      cost_price: String(p.cost_price),
      sale_price: String(p.sale_price),
      stock_quantity: String(p.stock_quantity),
      min_stock_level: String(p.min_stock_level),
      unit: p.unit,
      has_serial_tracking: p.has_serial_tracking,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editing.name || !editing.sku) return;
    setSaving(true);
    const payload = {
      sku: editing.sku,
      barcode: editing.barcode || null,
      name: editing.name,
      description: editing.description || null,
      category_id: editing.category_id || null,
      brand_id: editing.brand_id || null,
      supplier_id: editing.supplier_id || null,
      cost_price: parseFloat(editing.cost_price) || 0,
      sale_price: parseFloat(editing.sale_price) || 0,
      stock_quantity: parseInt(editing.stock_quantity) || 0,
      min_stock_level: parseInt(editing.min_stock_level) || 0,
      unit: editing.unit,
      has_serial_tracking: editing.has_serial_tracking,
    };

    if (editing.id) {
      const { data } = await supabase.from('products').update(payload).eq('id', editing.id).select('*,category:categories(*),brand:brands(*),supplier:suppliers(*)').single();
      if (data) setProducts((prev) => prev.map((p) => (p.id === data.id ? data : p)));
    } else {
      const { data } = await supabase.from('products').insert(payload).select('*,category:categories(*),brand:brands(*),supplier:suppliers(*)').single();
      if (data) setProducts((prev) => [data, ...prev]);
    }
    setSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    confirm(async () => {
      await supabase.from('products').update({ deleted_at: new Date().toISOString() }).eq('id', id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your inventory items, pricing, and stock levels"
        actionLabel="Add Product"
        actionIcon={<Plus className="h-4 w-4" />}
        onAction={openCreate}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, SKU, or barcode..."
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
            <SelectItem value="all">All Stock</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
            <SelectItem value="out">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="glass">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Package className="h-8 w-8" />}
              title="No products found"
              description={search ? "Try adjusting your search or filters" : "Add your first product to get started"}
              action={!search && <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />Add Product</Button>}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                            {p.has_serial_tracking && (
                              <Badge variant="secondary" className="text-[10px]">Serial Tracked</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.sku}</TableCell>
                      <TableCell>{p.category?.name || '—'}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(p.cost_price)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(p.sale_price)}</TableCell>
                      <TableCell className="text-center">
                        {p.stock_quantity === 0 ? (
                          <Badge variant="destructive">Out</Badge>
                        ) : p.stock_quantity <= p.min_stock_level ? (
                          <Badge variant="secondary" className="gap-1 bg-warning/20 text-warning">
                            <AlertTriangle className="h-3 w-3" />
                            {p.stock_quantity}
                          </Badge>
                        ) : (
                          <span className="font-medium">{p.stock_quantity}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle>{editing.id ? 'Edit Product' : 'New Product'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Product name" />
              </div>
              <div className="space-y-2">
                <Label>SKU *</Label>
                <Input value={editing.sku} onChange={(e) => setEditing({ ...editing, sku: e.target.value })} placeholder="SKU-001" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={2} placeholder="Product description" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={editing.category_id} onValueChange={(v) => setEditing({ ...editing, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Brand</Label>
                <Select value={editing.brand_id} onValueChange={(v) => setEditing({ ...editing, brand_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select value={editing.supplier_id} onValueChange={(v) => setEditing({ ...editing, supplier_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Cost Price ($)</Label>
                <Input type="number" step="0.01" value={editing.cost_price} onChange={(e) => setEditing({ ...editing, cost_price: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Sale Price ($)</Label>
                <Input type="number" step="0.01" value={editing.sale_price} onChange={(e) => setEditing({ ...editing, sale_price: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Stock Quantity</Label>
                <Input type="number" value={editing.stock_quantity} onChange={(e) => setEditing({ ...editing, stock_quantity: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Min Stock Level</Label>
                <Input type="number" value={editing.min_stock_level} onChange={(e) => setEditing({ ...editing, min_stock_level: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input value={editing.unit} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} placeholder="pcs" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <Label className="text-sm font-medium">Serial Number / IMEI Tracking</Label>
                <p className="text-xs text-muted-foreground">Enable for products with unique serial numbers</p>
              </div>
              <Switch checked={editing.has_serial_tracking} onCheckedChange={(v) => setEditing({ ...editing, has_serial_tracking: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !editing.name}>
              {saving ? 'Saving...' : editing.id ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action can be undone."
        onConfirm={handleConfirm}
        confirmLabel="Delete"
      />
    </div>
  );
}
