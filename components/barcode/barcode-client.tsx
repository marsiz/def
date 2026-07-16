'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ScanBarcode, Printer, Package, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-header';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';
import type { Product } from '@/lib/types';

export function BarcodeClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    supabase
      .from('products')
      .select('*,category:categories(*),brand:brands(*)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setProducts(data as Product[]);
      });
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearched(true);

    const localMatch = products.find(
      (p) => p.barcode === query.trim() || p.sku === query.trim()
    );
    if (localMatch) {
      setFoundProduct(localMatch);
      return;
    }

    const { data } = await supabase
      .from('products')
      .select('*,category:categories(*),brand:brands(*)')
      .eq('barcode', query.trim())
      .single();

    setFoundProduct(data || null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handlePrint = () => {
    if (!foundProduct?.barcode) return;
    const printWindow = window.open('', '_blank', 'width=400,height=300');
    if (!printWindow) return;

    const barcode = foundProduct.barcode;
    const bars = generateBarcodeBars(barcode);

    printWindow.document.write(`
      <html>
        <head>
          <title>Barkod - ${foundProduct.name}</title>
          <style>
            body { font-family: monospace; display: flex; flex-direction: column; align-items: center; padding: 20px; }
            .product-name { font-size: 14px; font-weight: bold; margin-bottom: 8px; }
            .barcode-container { display: flex; align-items: flex-end; gap: 2px; padding: 10px; background: white; border: 1px solid #ccc; }
            .bar { background: black; }
            .barcode-text { font-size: 18px; letter-spacing: 4px; margin-top: 8px; }
            .price { font-size: 16px; font-weight: bold; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="product-name">${foundProduct.name}</div>
          <div class="barcode-container">
            ${bars.map((w) => `<div class="bar" style="width: ${w}px; height: 60px;"></div>`).join('')}
          </div>
          <div class="barcode-text">${barcode}</div>
          <div class="price">${formatCurrency(foundProduct.sale_price)}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Barkod Tarayıcı"
        description="Barkod ile ürünleri hızlıca arayın ve bulun"
      />

      <Card className="glass">
        <CardContent className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <ScanBarcode className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Barkod girin veya tarayın"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} className="gap-2">
              <Search className="h-4 w-4" />
              Ara
            </Button>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {searched && (
          <motion.div
            key={foundProduct ? 'found' : 'not-found'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {foundProduct ? (
              <Card className="glass">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 text-success">
                      <Package className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold text-success">Ürün Bulundu</h3>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Ürün Adı</p>
                        <p className="font-semibold text-lg">{foundProduct.name}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">SKU</p>
                          <p className="font-medium">{foundProduct.sku}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Barkod</p>
                          <p className="font-medium">{foundProduct.barcode || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Fiyat</p>
                          <p className="font-medium">{formatCurrency(foundProduct.sale_price)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Stok</p>
                          {foundProduct.stock_quantity === 0 ? (
                            <Badge variant="destructive">Tükendi</Badge>
                          ) : foundProduct.stock_quantity <= foundProduct.min_stock_level ? (
                            <Badge variant="secondary" className="bg-warning/20 text-warning">
                              {foundProduct.stock_quantity}
                            </Badge>
                          ) : (
                            <p className="font-medium">{foundProduct.stock_quantity} {foundProduct.unit}</p>
                          )}
                        </div>
                      </div>
                      {foundProduct.category && (
                        <div>
                          <p className="text-xs text-muted-foreground">Kategori</p>
                          <p className="text-sm">{foundProduct.category.name}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-center justify-center gap-4">
                      {foundProduct.barcode && (
                        <div className="flex flex-col items-center">
                          <BarcodeDisplay value={foundProduct.barcode} />
                        </div>
                      )}
                      <Button onClick={handlePrint} variant="outline" className="gap-2">
                        <Printer className="h-4 w-4" />
                        Yazdır
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Ürün Bulunamadı</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        "{query}" barkoduna ait ürün bulunamadı.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function generateBarcodeBars(value: string): number[] {
  const bars: number[] = [];
  for (let i = 0; i < value.length; i++) {
    const charCode = value.charCodeAt(i);
    const binary = charCode.toString(2).padStart(8, '0');
    for (const bit of binary) {
      bars.push(bit === '1' ? 3 : 1);
    }
  }
  return bars;
}

function BarcodeDisplay({ value }: { value: string }) {
  const bars = generateBarcodeBars(value);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-end gap-[2px] bg-white px-4 py-3 rounded-lg border border-border">
        {bars.map((width, i) => (
          <div
            key={i}
            className="bg-black"
            style={{ width: `${width}px`, height: '60px' }}
          />
        ))}
      </div>
      <p className="font-mono text-sm tracking-[0.3em]">{value}</p>
    </div>
  );
}
