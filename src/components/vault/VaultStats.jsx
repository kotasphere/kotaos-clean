import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Package, TrendingUp, Archive } from "lucide-react";

export default function VaultStats({ assets }) {
  const stats = {
    totalAssets: assets.length,
    totalValue: assets.reduce((sum, asset) => sum + (asset.current_value || 0), 0),
    totalPurchaseValue: assets.reduce((sum, asset) => sum + (asset.purchase_price || 0), 0),
    categoriesCount: new Set(assets.map(a => a.category)).size,
  };

  const appreciation = stats.totalValue - stats.totalPurchaseValue;
  const appreciationPercent = stats.totalPurchaseValue > 0
    ? ((appreciation / stats.totalPurchaseValue) * 100).toFixed(1)
    : 0;

  const statCards = [
    { 
      label: 'Total Value', 
      value: `$${stats.totalValue.toLocaleString()}`, 
      icon: DollarSign, 
      color: 'text-green-600 dark:text-green-400', 
      bg: 'bg-green-50 dark:bg-green-950' 
    },
    { 
      label: 'Total Assets', 
      value: stats.totalAssets, 
      icon: Package, 
      color: 'text-blue-600 dark:text-blue-400', 
      bg: 'bg-blue-50 dark:bg-blue-950' 
    },
    { 
      label: 'Appreciation', 
      value: `${appreciationPercent}%`, 
      icon: TrendingUp, 
      color: appreciation >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400', 
      bg: appreciation >= 0 ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-red-50 dark:bg-red-950' 
    },
    { 
      label: 'Categories', 
      value: stats.categoriesCount, 
      icon: Archive, 
      color: 'text-purple-600 dark:text-purple-400', 
      bg: 'bg-purple-50 dark:bg-purple-950' 
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}