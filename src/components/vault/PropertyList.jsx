import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Building2, DollarSign, TrendingUp, Package } from "lucide-react";
import { format } from "date-fns";

export default function PropertyList({ properties, assets, onEdit, onDelete, onSelect, selectedPropertyId }) {
  const getPropertyStats = (propertyId) => {
    const propertyAssets = assets.filter(a => a.property_id === propertyId);
    const totalValue = propertyAssets.reduce((sum, a) => sum + (a.current_value || 0), 0);
    const totalPurchase = propertyAssets.reduce((sum, a) => sum + (a.purchase_price || 0), 0);
    const appreciation = totalValue - totalPurchase;
    
    return {
      assetCount: propertyAssets.length,
      totalValue,
      appreciation,
      appreciationPercent: totalPurchase > 0 ? ((appreciation / totalPurchase) * 100).toFixed(1) : 0
    };
  };

  if (properties.length === 0) {
    return (
      <div className="text-center py-8">
        <Building2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No properties yet. Add a property to organize your assets by location.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {properties.map(property => {
        const stats = getPropertyStats(property.id);
        const isSelected = selectedPropertyId === property.id;

        return (
          <Card
            key={property.id}
            className={`hover:shadow-lg transition-all cursor-pointer ${
              isSelected ? 'ring-2 ring-green-500 shadow-lg' : ''
            }`}
            onClick={() => onSelect(property.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{property.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {property.type}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onEdit(property)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500"
                    onClick={() => onDelete(property.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {property.address && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-1">
                  {property.address}
                </p>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Package className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Assets</span>
                  </div>
                  <span className="text-sm font-semibold">{stats.assetCount}</span>
                </div>

                {stats.totalValue > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Total Value</span>
                      </div>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        ${stats.totalValue.toLocaleString()}
                      </span>
                    </div>

                    {stats.appreciation !== 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Growth</span>
                        </div>
                        <span className={`text-sm font-semibold ${
                          stats.appreciation >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {stats.appreciation >= 0 ? '+' : ''}{stats.appreciationPercent}%
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {property.purchase_date && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500">
                    Acquired: {format(new Date(property.purchase_date), 'MMM d, yyyy')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}