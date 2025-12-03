import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, MapPin, DollarSign, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const categoryColors = {
  electronics: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400",
  furniture: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400",
  jewelry: "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-400",
  vehicle: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400",
  art: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-400",
  collectible: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-400",
  real_estate: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
};

export default function AssetGrid({ assets, onEdit, onDelete, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No assets found. Start by adding your first asset!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {assets.map(asset => (
        <Card key={asset.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center relative">
            {asset.photo_url ? (
              <img
                src={asset.photo_url}
                alt={asset.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-16 h-16 text-gray-400" />
            )}
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-white/90 hover:bg-white"
                onClick={() => onEdit(asset)}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-white/90 hover:bg-white text-red-500"
                onClick={() => onDelete(asset.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                {asset.name}
              </h3>
              <Badge variant="outline" className={categoryColors[asset.category]}>
                {asset.category}
              </Badge>
            </div>
            
            {asset.notes && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {asset.notes}
              </p>
            )}
            
            <div className="space-y-2">
              {asset.current_value && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    ${asset.current_value.toLocaleString()}
                  </span>
                  {asset.purchase_price && (
                    <span className="text-gray-500 dark:text-gray-500 text-xs">
                      (${asset.purchase_price.toLocaleString()})
                    </span>
                  )}
                </div>
              )}
              
              {asset.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{asset.location}</span>
                </div>
              )}
              
              {asset.purchase_date && (
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  Purchased: {format(new Date(asset.purchase_date), 'MMM d, yyyy')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}