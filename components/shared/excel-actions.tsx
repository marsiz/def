'use client';

import { useState } from 'react';
import { FileSpreadsheet, Loader2, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { exportToExcel, getExcelColumns, importFromExcel, type ExcelColumn, type ImportResult } from '@/lib/excel';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/lib/activity-logger';

interface ExcelActionsProps<T extends Record<string, any>> {
  data: T[];
  allData?: T[];
  columns: ExcelColumn[];
  filename: string;
  sheetName?: string;
  moduleKey: string;
  onImport?: (rows: T[]) => Promise<void>;
  importColumns?: Record<string, string>;
}

export function ExcelActions<T extends Record<string, any>>({
  data, allData, columns, filename, sheetName = 'Sayfa1', moduleKey, onImport, importColumns,
}: ExcelActionsProps<T>) {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult<T> | null>(null);

  const handleExport = (type: 'all' | 'filtered' | 'selected') => {
    setExporting(true);
    let exportData = data;
    if (type === 'all' && allData) exportData = allData;
    try {
      exportToExcel(exportData, columns, filename, sheetName);
      toast({ title: 'Excel\'e aktarıldı', description: `${exportData.length} kayıt aktarıldı.` });
      logActivity('Excel\'e Aktarıldı', moduleKey, `${exportData.length} kayıt`);
    } catch (err: any) {
      toast({ title: 'Aktarma başarısız', description: err.message, variant: 'destructive' });
    }
    setExporting(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportResult(null);
    try {
      const cols = await getExcelColumns(file);
      setFileColumns(cols);
      if (importColumns) {
        const mapping: Record<string, string> = {};
        for (const [modelField, excelCol] of Object.entries(importColumns)) {
          const match = cols.find((c) => c.toLowerCase().includes(excelCol.toLowerCase()));
          if (match) mapping[modelField] = match;
        }
        setColumnMapping(mapping);
      }
    } catch {
      toast({ title: 'Dosya okunamadı', variant: 'destructive' });
    }
  };

  const handleImport = async () => {
    if (!importFile || !onImport) return;
    setImporting(true);
    try {
      const result = await importFromExcel<T>(importFile, columnMapping);
      setImportResult(result);
      if (result.success.length > 0) {
        await onImport(result.success);
        logActivity('Excel\'den Aktarıldı', moduleKey, `${result.successCount} kayıt`);
      }
      toast({
        title: 'İçe aktarma tamamlandı',
        description: `${result.successCount} başarılı, ${result.errorCount} hatalı kayıt.`,
      });
    } catch (err: any) {
      toast({ title: 'İçe aktarma başarısız', description: err.message, variant: 'destructive' });
    }
    setImporting(false);
  };

  const canImport = !!onImport;

  return (
    <>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2" disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              Excel
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExport('filtered')}>
              <Download className="mr-2 h-4 w-4" />
              Filtrelenmiş Kayıtlar ({data.length})
            </DropdownMenuItem>
            {allData && (
              <DropdownMenuItem onClick={() => handleExport('all')}>
                <Download className="mr-2 h-4 w-4" />
                Tüm Kayıtlar ({allData.length})
              </DropdownMenuItem>
            )}
            {canImport && (
              <DropdownMenuItem onClick={() => setImportOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Excel'den Aktar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {canImport && (
        <Dialog open={importOpen} onOpenChange={setImportOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Excel'den Aktar</DialogTitle>
              <DialogDescription>.xlsx dosyası seçin ve kolon eşleştirmesi yapın</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Dosya Seç</Label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
              {fileColumns.length > 0 && (
                <div className="space-y-2">
                  <Label>Kolon Eşleştirme</Label>
                  <div className="space-y-2 max-h-60 overflow-y-auto rounded-lg border border-border p-3">
                    {Object.keys(importColumns || {}).map((modelField) => (
                      <div key={modelField} className="flex items-center gap-2">
                        <span className="w-32 text-sm text-muted-foreground">{modelField}</span>
                        <Select
                          value={columnMapping[modelField] || ''}
                          onValueChange={(v) => setColumnMapping((prev) => ({ ...prev, [modelField]: v }))}
                        >
                          <SelectTrigger className="flex-1"><SelectValue placeholder="Kolon seçin" /></SelectTrigger>
                          <SelectContent>
                            {fileColumns.map((col) => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {importResult && (
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">İçe Aktarma Raporu</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/30 p-2">
                      <p className="text-lg font-bold">{importResult.totalRows}</p>
                      <p className="text-xs text-muted-foreground">Toplam</p>
                    </div>
                    <div className="rounded-lg bg-success/10 p-2">
                      <p className="text-lg font-bold text-success">{importResult.successCount}</p>
                      <p className="text-xs text-muted-foreground">Başarılı</p>
                    </div>
                    <div className="rounded-lg bg-destructive/10 p-2">
                      <p className="text-lg font-bold text-destructive">{importResult.errorCount}</p>
                      <p className="text-xs text-muted-foreground">Hatalı</p>
                    </div>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="max-h-32 overflow-y-auto rounded-lg bg-destructive/5 p-2 text-xs text-destructive">
                      {importResult.errors.slice(0, 10).map((e, i) => (
                        <div key={i}>Satır {e.row}: {e.message}</div>
                      ))}
                      {importResult.errors.length > 10 && <div>...ve {importResult.errors.length - 10} hata daha</div>}
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setImportOpen(false)}>Kapat</Button>
              <Button onClick={handleImport} disabled={importing || !importFile} className="gap-2">
                {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                İçe Aktar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
