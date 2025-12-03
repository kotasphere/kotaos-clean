import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, Sparkles } from "lucide-react";

export default function AssetDialog({ open, onClose, onSave, asset, properties = [] }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'other',
    property_id: '',
    brand: '',
    model: '',
    serial_number: '',
    barcode: '',
    purchase_price: '',
    purchase_date: '',
    current_value: '',
    ai_estimated_value: '',
    condition: 'good',
    location: '',
    notes: '',
    photo_url: ''
  });
  const [uploading, setUploading] = useState(false);
  const [estimating, setEstimating] = useState(false);

  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name || '',
        category: asset.category || 'other',
        property_id: asset.property_id || '',
        brand: asset.brand || '',
        model: asset.model || '',
        serial_number: asset.serial_number || '',
        barcode: asset.barcode || '',
        purchase_price: asset.purchase_price || '',
        purchase_date: asset.purchase_date || '',
        current_value: asset.current_value || '',
        ai_estimated_value: asset.ai_estimated_value || '',
        condition: asset.condition || 'good',
        location: asset.location || '',
        notes: asset.notes || '',
        photo_url: asset.photo_url || ''
      });
    } else {
      setFormData({
        name: '',
        category: 'other',
        property_id: '',
        brand: '',
        model: '',
        serial_number: '',
        barcode: '',
        purchase_price: '',
        purchase_date: '',
        current_value: '',
        ai_estimated_value: '',
        condition: 'good',
        location: '',
        notes: '',
        photo_url: ''
      });
    }
  }, [asset, open]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, photo_url: result.file_url });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleAIEstimate = async () => {
    if (!formData.name.trim()) {
      alert('Please enter asset name first');
      return;
    }

    setEstimating(true);
    try {
      console.log('Starting AI estimation for:', formData.name);
      
      const prompt = `You are a professional appraiser. Estimate the REALISTIC current market value for this item based on ACTUAL market data.

Item Details:
- Name: ${formData.name}
${formData.brand ? `- Brand: ${formData.brand}` : ''}
${formData.model ? `- Model: ${formData.model}` : ''}
${formData.condition ? `- Condition: ${formData.condition}` : ''}
${formData.purchase_price ? `- Original Purchase Price: $${formData.purchase_price}` : ''}
${formData.purchase_date ? `- Purchase Date: ${formData.purchase_date}` : ''}

CRITICAL INSTRUCTIONS:
1. Search Google, eBay, Amazon, Facebook Marketplace for this EXACT item or very similar items
2. Find 3-5 REAL comparable listings with actual prices
3. Calculate a realistic current market value (NOT original price, CURRENT resale value)
4. If you cannot find exact matches, use similar items and note that in explanation
5. Be conservative - real-world resale values are often 30-70% of original price

IMPORTANT: Return a valid number for estimated_value. If you cannot find pricing data, make a reasonable estimate based on the item category and condition.

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "estimated_value": 1500,
  "explanation": "Based on current eBay listings...",
  "comparable_prices": [
    {"item": "Similar item 1", "price": 1400, "source": "eBay"},
    {"item": "Similar item 2", "price": 1600, "source": "Amazon"}
  ]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            estimated_value: { type: "number" },
            explanation: { type: "string" },
            comparable_prices: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item: { type: "string" },
                  price: { type: "number" },
                  source: { type: "string" }
                }
              }
            }
          },
          required: ["estimated_value", "explanation"]
        }
      });

      console.log('AI estimation result:', result);

      if (result && result.estimated_value && result.estimated_value > 0) {
        const estimatedValue = Math.round(result.estimated_value);
        
        setFormData({
          ...formData,
          ai_estimated_value: estimatedValue,
          current_value: formData.current_value || estimatedValue
        });

        let message = `✅ AI Estimated Value: $${estimatedValue.toLocaleString()}\n\n📊 ${result.explanation}`;

        if (result.comparable_prices && result.comparable_prices.length > 0) {
          message += '\n\n🔍 Comparable Listings:\n';
          result.comparable_prices.forEach(comp => {
            message += `\n• ${comp.item}: $${comp.price.toLocaleString()}${comp.source ? ` (${comp.source})` : ''}`;
          });
        }

        alert(message);
      } else {
        console.error('Invalid AI response:', result);
        alert('Could not generate estimate. The AI returned an invalid response. Please enter the value manually.');
      }
    } catch (error) {
      console.error('AI estimation error:', error);
      alert(`Failed to estimate value: ${error.message}\n\nPlease enter the value manually.`);
    } finally {
      setEstimating(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    
    const dataToSave = {
      ...formData,
      purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
      current_value: formData.current_value ? parseFloat(formData.current_value) : null,
      ai_estimated_value: formData.ai_estimated_value ? parseFloat(formData.ai_estimated_value) : null,
      property_id: formData.property_id || null
    };
    
    console.log('Saving asset with data:', dataToSave);
    
    onSave(dataToSave);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{asset ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {formData.photo_url && (
            <div className="flex justify-center">
              <img src={formData.photo_url} alt="Asset" className="h-32 w-32 object-cover rounded-lg" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="photo">Photo</Label>
            <div className="flex gap-2">
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploading}
              />
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Asset Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., iPhone 15 Pro, Samsung TV"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="furniture">Furniture</SelectItem>
                  <SelectItem value="jewelry">Jewelry</SelectItem>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                  <SelectItem value="art">Art</SelectItem>
                  <SelectItem value="collectible">Collectible</SelectItem>
                  <SelectItem value="real_estate">Real Estate</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_id">Assign to Property</Label>
              <Select 
                value={formData.property_id || "none"} 
                onValueChange={(value) => setFormData({ ...formData, property_id: value === "none" ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No Property" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Property</SelectItem>
                  {properties.map(property => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Organize assets by location/property</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="Manufacturer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Model number/name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_price">Purchase Price</Label>
              <Input
                id="purchase_price"
                type="number"
                step="0.01"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_date">Purchase Date</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_value">Current Value</Label>
            <Input
              id="current_value"
              type="number"
              step="0.01"
              value={formData.current_value}
              onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="ai_estimated_value" className="flex items-center gap-1">
                AI Estimated Value
                <Sparkles className="w-3 h-3 text-purple-600" />
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAIEstimate}
                disabled={estimating || !formData.name.trim()}
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                {estimating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Estimating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Get AI Estimate
                  </>
                )}
              </Button>
            </div>
            <Input
              id="ai_estimated_value"
              type="number"
              step="0.01"
              value={formData.ai_estimated_value}
              onChange={(e) => setFormData({ ...formData, ai_estimated_value: e.target.value })}
              placeholder="0.00"
              className="bg-gray-50 dark:bg-gray-900"
            />
            <p className="text-xs text-gray-500">AI-generated market value estimate</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Physical Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Living room, Storage"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional information..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
            {asset ? 'Update' : 'Add'} Asset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}