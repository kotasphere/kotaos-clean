
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Loader2, Download, Mail, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function InsuranceExport({ open, onClose, assets }) {
  const [selectedAssets, setSelectedAssets] = useState(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [exportFormat, setExportFormat] = useState("csv");

  const toggleAsset = (assetId) => {
    const newSelected = new Set(selectedAssets);
    if (newSelected.has(assetId)) {
      newSelected.delete(assetId);
    } else {
      newSelected.add(assetId);
    }
    setSelectedAssets(newSelected);
  };

  const selectAll = () => {
    setSelectedAssets(new Set(assets.map(a => a.id)));
  };

  const deselectAll = () => {
    setSelectedAssets(new Set());
  };

  const handleExport = () => {
    const selectedAssetData = assets.filter(a => selectedAssets.has(a.id));
    
    if (exportFormat === 'csv') {
      exportToCSV(selectedAssetData);
    } else {
      exportToJSON(selectedAssetData);
    }
  };

  const exportToCSV = (data) => {
    const headers = [
      'Name',
      'Category',
      'Brand',
      'Model',
      'Serial Number',
      'Barcode',
      'Current Value',
      'Purchase Price',
      'Purchase Date',
      'Condition',
      'Location',
      'Photo URL',
      'Notes'
    ];

    const rows = data.map(asset => [
      asset.name || '',
      asset.category || '',
      asset.brand || '',
      asset.model || '',
      asset.serial_number || '',
      asset.barcode || '',
      asset.current_value || '',
      asset.purchase_price || '',
      asset.purchase_date || '',
      asset.condition || '',
      asset.location || '',
      asset.photo_url || '',
      asset.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    downloadFile(blob, 'insurance-claim-assets.csv');
  };

  const exportToJSON = (data) => {
    const exportData = {
      exported_at: new Date().toISOString(),
      total_items: data.length,
      total_value: data.reduce((sum, a) => sum + (a.current_value || 0), 0),
      assets: data.map(asset => ({
        name: asset.name,
        category: asset.category,
        brand: asset.brand,
        model: asset.model,
        serial_number: asset.serial_number,
        barcode: asset.barcode,
        current_value: asset.current_value,
        purchase_price: asset.purchase_price,
        purchase_date: asset.purchase_date,
        condition: asset.condition,
        location: asset.location,
        photo_url: asset.photo_url,
        notes: asset.notes
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    downloadFile(blob, 'insurance-claim-assets.json');
  };

  const downloadFile = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleEmailExport = async () => {
    if (!emailTo.trim()) {
      alert('Please enter an email address');
      return;
    }

    setIsExporting(true);
    try {
      const selectedAssetData = assets.filter(a => selectedAssets.has(a.id));
      const totalValue = selectedAssetData.reduce((sum, a) => sum + (a.current_value || 0), 0);

      const emailBody = `Insurance Claim - Asset Inventory

Total Items: ${selectedAssetData.length}
Total Declared Value: $${totalValue.toLocaleString()}
Export Date: ${new Date().toLocaleDateString()}

ASSET LIST:
${selectedAssetData.map((asset, idx) => `
${idx + 1}. ${asset.name}
   Category: ${asset.category}
   ${asset.brand ? `Brand: ${asset.brand}` : ''}
   ${asset.model ? `Model: ${asset.model}` : ''}
   ${asset.serial_number ? `Serial: ${asset.serial_number}` : ''}
   Current Value: $${(asset.current_value || 0).toLocaleString()}
   Purchase Price: $${(asset.purchase_price || 0).toLocaleString()}
   ${asset.purchase_date ? `Purchase Date: ${asset.purchase_date}` : ''}
   Condition: ${asset.condition || 'N/A'}
   ${asset.location ? `Location: ${asset.location}` : ''}
   ${asset.notes ? `Notes: ${asset.notes}` : ''}
`).join('\n')}

This is an automated export from KOTA OS Asset Vault.
`;

      await base44.integrations.Core.SendEmail({
        to: emailTo,
        subject: `Insurance Claim - Asset Inventory (${selectedAssetData.length} items)`,
        body: emailBody
      });

      alert('Insurance claim sent successfully!');
      onClose();
    } catch (error) {
      console.error('Email error:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedCount = selectedAssets.size;
  const totalValue = assets
    .filter(a => selectedAssets.has(a.id))
    .reduce((sum, a) => sum + (a.current_value || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Insurance Claim Export
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select assets to include in your insurance claim
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                {selectedCount} items selected • ${totalValue.toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Clear
              </Button>
            </div>
          </div>

          <ScrollArea className="h-64 border rounded-lg p-4">
            <div className="space-y-2">
              {assets.map(asset => (
                <div
                  key={asset.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Checkbox
                    checked={selectedAssets.has(asset.id)}
                    onCheckedChange={() => toggleAsset(asset.id)}
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {asset.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {asset.category}
                      </Badge>
                      <span className="text-sm text-green-600 dark:text-green-400 font-semibold">
                        ${(asset.current_value || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="space-y-3 pt-4 border-t">
            <Label>Export Options</Label>
            <div className="flex gap-2">
              <Button
                variant={exportFormat === 'csv' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExportFormat('csv')}
              >
                CSV Format
              </Button>
              <Button
                variant={exportFormat === 'json' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExportFormat('json')}
              >
                JSON Format
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email to Agent (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="agent@insurance.com"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={selectedCount === 0}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button 
            onClick={handleEmailExport} 
            disabled={selectedCount === 0 || isExporting || !emailTo.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            Email Claim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
