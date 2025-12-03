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
import { Loader2, Sparkles } from "lucide-react";

export default function PropertyDialog({ open, onClose, onSave, property }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'home',
    address: '',
    purchase_price: '',
    purchase_date: '',
    current_value: '',
    ai_estimated_value: '',
    notes: ''
  });
  const [estimating, setEstimating] = useState(false);

  useEffect(() => {
    if (property) {
      setFormData({
        name: property.name || '',
        type: property.type || 'home',
        address: property.address || '',
        purchase_price: property.purchase_price || '',
        purchase_date: property.purchase_date || '',
        current_value: property.current_value || '',
        ai_estimated_value: property.ai_estimated_value || '',
        notes: property.notes || ''
      });
    } else {
      setFormData({
        name: '',
        type: 'home',
        address: '',
        purchase_price: '',
        purchase_date: '',
        current_value: '',
        ai_estimated_value: '',
        notes: ''
      });
    }
  }, [property, open]);

  const handleAIEstimate = async () => {
    if (!formData.name.trim() || !formData.address.trim()) {
      alert('Please enter property name and address first');
      return;
    }

    setEstimating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Estimate the current market value for this property:
        
Name: ${formData.name}
Type: ${formData.type}
Address: ${formData.address}
${formData.purchase_price ? `Original Purchase Price: $${formData.purchase_price}` : ''}
${formData.purchase_date ? `Purchase Date: ${formData.purchase_date}` : ''}

Search the web for current real estate market prices in this area and return a JSON object with:
- estimated_value: current market value as a number
- explanation: brief explanation of the valuation based on location and market trends
- comparable_properties: list of 2-3 comparable properties found with their prices

Be realistic and use actual market data.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            estimated_value: { type: "number" },
            explanation: { type: "string" },
            comparable_properties: { 
              type: "array",
              items: {
                type: "object",
                properties: {
                  address: { type: "string" },
                  price: { type: "number" }
                }
              }
            }
          }
        }
      });

      if (result && result.estimated_value) {
        setFormData({ 
          ...formData, 
          ai_estimated_value: result.estimated_value,
          notes: formData.notes + `\n\nAI Valuation: ${result.explanation}`
        });
        alert(`AI Estimated Value: $${result.estimated_value.toLocaleString()}\n\n${result.explanation}`);
      }
    } catch (error) {
      console.error('AI estimation error:', error);
      alert('Failed to estimate value. Please try again.');
    } finally {
      setEstimating(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{property ? 'Edit Property' : 'Add New Property'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="name">Property Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Main Residence, Rental Property"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Property Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="rental">Rental Property</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="land">Land</SelectItem>
                <SelectItem value="vehicle">Vehicle</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_price">Purchase Price</Label>
              <Input
                id="purchase_price"
                type="number"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || '' })}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="current_value">Current Value</Label>
              <Input
                id="current_value"
                type="number"
                value={formData.current_value}
                onChange={(e) => setFormData({ ...formData, current_value: parseFloat(e.target.value) || '' })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai_estimated_value" className="flex items-center gap-1">
                AI Estimated Value
                <Sparkles className="w-3 h-3 text-purple-600" />
              </Label>
              <div className="flex gap-2">
                <Input
                  id="ai_estimated_value"
                  type="number"
                  value={formData.ai_estimated_value}
                  onChange={(e) => setFormData({ ...formData, ai_estimated_value: parseFloat(e.target.value) || '' })}
                  placeholder="0.00"
                  readOnly
                  className="bg-gray-50 dark:bg-gray-900"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleAIEstimate}
                  disabled={estimating || !formData.name.trim() || !formData.address.trim()}
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  {estimating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional details..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
            {property ? 'Update' : 'Add'} Property
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}