
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Plus, Package, Download, Scan, Building2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AssetDialog from "../components/vault/AssetDialog";
import AssetGrid from "../components/vault/AssetGrid";
import VaultStats from "../components/vault/VaultStats";
import AssetValueChart from "../components/vault/AssetValueChart";
import BarcodeScanner from "../components/vault/BarcodeScanner";
import InsuranceExport from "../components/vault/InsuranceExport";
import PropertyDialog from "../components/vault/PropertyDialog";
import PropertyList from "../components/vault/PropertyList";
import { format, subDays } from 'date-fns'; // Import date-fns functions

export default function VaultPage() {
  const [showAssetDialog, setShowAssetDialog] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showScanner, setShowScanner] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showPropertyDialog, setShowPropertyDialog] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState('all');
  const [viewMode, setViewMode] = useState('assets');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets', user?.email],
    queryFn: () => base44.entities.Asset.filter({ created_by: user.email }, '-created_date'),
    initialData: [],
    enabled: !!user?.email,
  });

  const { data: valuations } = useQuery({
    queryKey: ['valuations', user?.email],
    queryFn: () => base44.entities.Valuation.filter({ created_by: user.email }, '-as_of_date'),
    initialData: [],
    enabled: !!user?.email,
  });

  const { data: properties } = useQuery({
    queryKey: ['properties', user?.email],
    queryFn: () => base44.entities.Property.filter({ created_by: user.email }, '-created_date'),
    initialData: [],
    enabled: !!user?.email,
  });

  const createAsset = useMutation({
    mutationFn: (data) => base44.entities.Asset.create(data),
    onSuccess: async (newAsset) => {
      const today = new Date();
      const valuationPromises = [];
      
      // Create valuation for TODAY (current value)
      if (newAsset.current_value) {
        valuationPromises.push(
          base44.entities.Valuation.create({
            asset_id: newAsset.id,
            amount: newAsset.current_value,
            valuation_type: 'manual',
            as_of_date: format(today, 'yyyy-MM-dd'),
            source: 'Current value'
          })
        );
      }
      
      // Create valuation for PURCHASE DATE (if provided)
      if (newAsset.purchase_date && newAsset.purchase_price) {
        valuationPromises.push(
          base44.entities.Valuation.create({
            asset_id: newAsset.id,
            amount: newAsset.purchase_price,
            valuation_type: 'manual',
            as_of_date: newAsset.purchase_date,
            source: 'Purchase price'
          })
        );
      }
      
      // Create AI valuation for TODAY (if available)
      if (newAsset.ai_estimated_value) {
        valuationPromises.push(
          base44.entities.Valuation.create({
            asset_id: newAsset.id,
            amount: newAsset.ai_estimated_value,
            valuation_type: 'ai_estimated',
            as_of_date: format(today, 'yyyy-MM-dd'),
            source: 'AI estimation'
          })
        );
        
        // If there's a purchase date, also create AI estimate for then (assume AI estimated purchase price was actual purchase price)
        if (newAsset.purchase_date && newAsset.purchase_price) {
          valuationPromises.push(
            base44.entities.Valuation.create({
              asset_id: newAsset.id,
              amount: newAsset.purchase_price, // AI estimate at purchase was the purchase price
              valuation_type: 'ai_estimated',
              as_of_date: newAsset.purchase_date,
              source: 'AI historical estimate'
            })
          );
        }
      }
      
      try {
        await Promise.all(valuationPromises);
        console.log('Created valuations:', valuationPromises.length);
      } catch (error) {
        console.error('Failed to create valuations:', error);
      }
      
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['valuations'] });
      setShowAssetDialog(false);
      setEditingAsset(null);
    },
  });

  const updateAsset = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Asset.update(id, data),
    onSuccess: async (updatedAsset, variables) => {
      const today = new Date();
      const todayKey = format(today, 'yyyy-MM-dd');
      
      // Only create NEW valuation if value actually changed or updated
      if (updatedAsset.current_value) {
        try {
          await base44.entities.Valuation.create({
            asset_id: updatedAsset.id,
            amount: updatedAsset.current_value,
            valuation_type: 'manual',
            as_of_date: todayKey,
            source: 'Updated value'
          });
        } catch (error) {
          console.error('Failed to create valuation:', error);
        }
      }
      
      if (updatedAsset.ai_estimated_value) {
        try {
          await base44.entities.Valuation.create({
            asset_id: updatedAsset.id,
            amount: updatedAsset.ai_estimated_value,
            valuation_type: 'ai_estimated',
            as_of_date: todayKey,
            source: 'AI estimation update'
          });
        } catch (error) {
          console.error('Failed to create AI valuation:', error);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['valuations'] });
      setShowAssetDialog(false);
      setEditingAsset(null);
    },
  });

  const deleteAsset = useMutation({
    mutationFn: (id) => base44.entities.Asset.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['valuations'] });
    },
  });

  const createProperty = useMutation({
    mutationFn: (data) => base44.entities.Property.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      setShowPropertyDialog(false);
      setEditingProperty(null);
    },
  });

  const updateProperty = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Property.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      setShowPropertyDialog(false);
      setEditingProperty(null);
    },
  });

  const deleteProperty = useMutation({
    mutationFn: (id) => base44.entities.Property.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      if (selectedPropertyId === id) {
        setSelectedPropertyId('all');
      }
    },
  });

  const handleCreateAsset = () => {
    setEditingAsset(null);
    setShowAssetDialog(true);
  };

  const handleEditAsset = (asset) => {
    setEditingAsset(asset);
    setShowAssetDialog(true);
  };

  const handleSaveAsset = (assetData) => {
    if (selectedPropertyId !== 'all' && !assetData.property_id) {
      assetData.property_id = selectedPropertyId;
    }
    
    if (editingAsset) {
      updateAsset.mutate({ id: editingAsset.id, data: assetData });
    } else {
      createAsset.mutate(assetData);
    }
  };

  const handleBarcodeScanned = (assetData) => {
    if (selectedPropertyId !== 'all') {
      assetData.property_id = selectedPropertyId;
    }
    createAsset.mutate(assetData);
    setShowScanner(false);
  };

  const handleCreateProperty = () => {
    setEditingProperty(null);
    setShowPropertyDialog(true);
  };

  const handleEditProperty = (property) => {
    setEditingProperty(property);
    setShowPropertyDialog(true);
  };

  const handleSaveProperty = (propertyData) => {
    if (editingProperty) {
      updateProperty.mutate({ id: editingProperty.id, data: propertyData });
    } else {
      createProperty.mutate(propertyData);
    }
  };

  const handleDeleteProperty = (propertyId) => {
    if (window.confirm('Delete this property? Assets will remain but lose property association.')) {
      deleteProperty.mutate(propertyId);
    }
  };

  const filteredAssets = assets.filter(asset => {
    const categoryMatch = categoryFilter === 'all' || asset.category === categoryFilter;
    const propertyMatch = selectedPropertyId === 'all' || asset.property_id === selectedPropertyId;
    return categoryMatch && propertyMatch;
  });

  const selectedProperty = selectedPropertyId !== 'all' 
    ? properties.find(p => p.id === selectedPropertyId)
    : null;

  const chartAssets = selectedProperty 
    ? assets.filter(a => a.property_id === selectedPropertyId)
    : assets;
    
  const chartValuations = selectedProperty
    ? valuations.filter(v => {
        const asset = assets.find(a => a.id === v.asset_id);
        return asset && asset.property_id === selectedPropertyId;
      })
    : valuations;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30 dark:from-gray-950 dark:to-green-950/30 p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Asset Vault</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Secure inventory of your valuables</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button
              onClick={handleCreateProperty}
              variant="outline"
              size="sm"
              className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 flex-1 sm:flex-initial"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Add Property
            </Button>
            <Button
              onClick={() => setShowScanner(true)}
              variant="outline"
              size="sm"
              className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 flex-1 sm:flex-initial"
            >
              <Scan className="w-4 h-4 mr-2" />
              Scan
            </Button>
            <Button
              onClick={() => setShowExport(true)}
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 flex-1 sm:flex-initial"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={handleCreateAsset}
              size="sm"
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 flex-1 sm:flex-initial"
            >
              <Plus className="w-4 h-4 mr-2" />
              Asset
            </Button>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            variant={viewMode === 'assets' ? 'default' : 'outline'}
            onClick={() => setViewMode('assets')}
            size="sm"
          >
            <Package className="w-4 h-4 mr-2" />
            Assets View
          </Button>
          <Button
            variant={viewMode === 'properties' ? 'default' : 'outline'}
            onClick={() => setViewMode('properties')}
            size="sm"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Properties View ({properties.length})
          </Button>
        </div>

        {viewMode === 'properties' ? (
          <Card className="p-3 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Your Properties
              </h2>
              <Button onClick={handleCreateProperty} size="sm">
                <Building2 className="w-4 h-4 mr-2" />
                Add Property
              </Button>
            </div>
            <PropertyList
              properties={properties}
              assets={assets}
              onEdit={handleEditProperty}
              onDelete={handleDeleteProperty}
              onSelect={(id) => {
                setSelectedPropertyId(id);
                setViewMode('assets');
              }}
              selectedPropertyId={selectedPropertyId}
            />
          </Card>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  View Property:
                </label>
                <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assets (No Property Filter)</SelectItem>
                    {properties.map(property => {
                      const propertyAssetCount = assets.filter(a => a.property_id === property.id).length;
                      return (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name} ({propertyAssetCount} asset{propertyAssetCount !== 1 ? 's' : ''})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {selectedProperty && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProperty(selectedProperty)}
                    >
                      Edit Property
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProperty(selectedProperty.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>
              {filteredAssets.length === 0 && selectedPropertyId !== 'all' && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                  No assets in this property yet. Add assets and assign them to this property.
                </p>
              )}
            </div>

            <VaultStats assets={filteredAssets} />

            <Card className="p-3 sm:p-6 mt-4">
              {selectedProperty && chartAssets.length > 0 && (
                <div className="mb-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-green-900 dark:text-green-100">{selectedProperty.name}</h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {chartAssets.length} asset{chartAssets.length !== 1 ? 's' : ''} tracked
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        ${chartAssets.reduce((sum, a) => sum + (a.current_value || 0), 0).toLocaleString()}
                      </p>
                      {chartAssets.some(a => a.ai_estimated_value) && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          AI: ${chartAssets.reduce((sum, a) => sum + (a.ai_estimated_value || 0), 0).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <AssetValueChart assets={chartAssets} valuations={chartValuations} />
            </Card>

            <Card className="p-3 sm:p-6 mt-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
                <Package className="w-5 h-5 text-gray-500" />
                <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="w-full">
                  <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:inline-grid">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="electronics">Electronics</TabsTrigger>
                    <TabsTrigger value="furniture">Furniture</TabsTrigger>
                    <TabsTrigger value="jewelry">Jewelry</TabsTrigger>
                    <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
                    <TabsTrigger value="art">Art</TabsTrigger>
                    <TabsTrigger value="other">Other</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <AssetGrid
                assets={filteredAssets}
                onEdit={handleEditAsset}
                onDelete={(id) => deleteAsset.mutate(id)}
                isLoading={isLoading}
              />
            </Card>
          </>
        )}

        <AssetDialog
          open={showAssetDialog}
          onClose={() => {
            setShowAssetDialog(false);
            setEditingAsset(null);
          }}
          onSave={handleSaveAsset}
          asset={editingAsset}
          properties={properties}
        />

        <PropertyDialog
          open={showPropertyDialog}
          onClose={() => {
            setShowPropertyDialog(false);
            setEditingProperty(null);
          }}
          onSave={handleSaveProperty}
          property={editingProperty}
        />

        <BarcodeScanner
          open={showScanner}
          onClose={() => setShowScanner(false)}
          onAssetCreated={handleBarcodeScanned}
        />

        <InsuranceExport
          open={showExport}
          onClose={() => setShowExport(false)}
          assets={assets}
        />
      </div>
    </div>
  );
}
