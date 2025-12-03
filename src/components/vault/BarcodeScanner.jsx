
import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Scan, Camera, X, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function BarcodeScanner({ open, onClose, onAssetCreated }) {
  const [barcode, setBarcode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [useCamera, setUseCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState('none');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const { data: properties = [] } = useQuery({
    queryKey: ['properties'],
    queryFn: () => base44.entities.Property.list(),
  });

  useEffect(() => {
    if (useCamera && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [useCamera, stream]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setUseCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError(error.message);
      alert(`Camera access denied or unavailable: ${error.message}\n\nPlease allow camera access or use manual barcode input.`);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setUseCamera(false);
    setCameraError(null);
  };

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) {
      alert('Camera not ready. Please try again.');
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      alert('Camera is still loading. Please wait a moment and try again.');
      return;
    }
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    setIsScanning(true);
    try {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
      
      if (!blob) {
        throw new Error('Failed to capture image');
      }
      
      const file = new File([blob], 'barcode.jpg', { type: 'image/jpeg' });
      const uploadResult = await base44.integrations.Core.UploadFile({ file });

      // Step 1: Extract barcode number from image
      const barcodeExtractionResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Look at this image VERY CAREFULLY and extract the barcode or UPC number you see.

CRITICAL INSTRUCTIONS:
1. Look for numeric codes (usually 12-13 digits for UPC, 8-14 digits for other formats)
2. The barcode is typically under or above a series of vertical lines
3. Return ONLY the numeric digits, no spaces or dashes
4. If you see multiple numbers, return the longest continuous sequence

Return JSON:
{
  "barcode": "the numeric barcode string",
  "confidence": "high" or "low"
}

If you cannot clearly see a barcode, return {"barcode": null}`,
        file_urls: [uploadResult.file_url],
        response_json_schema: {
          type: "object",
          properties: {
            barcode: { type: "string" },
            confidence: { type: "string" }
          }
        }
      });

      if (barcodeExtractionResult && barcodeExtractionResult.barcode) {
        setBarcode(barcodeExtractionResult.barcode);
        stopCamera();
        await handleManualLookup(barcodeExtractionResult.barcode);
      } else {
        alert('Could not detect a barcode in the image. Please ensure the barcode is clearly visible and try again, or use manual input.');
      }
    } catch (error) {
      console.error('Scan error:', error);
      alert('Failed to scan barcode. Please try manual input.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualLookup = async (code = barcode) => {
    if (!code.trim()) return;
    
    setIsScanning(true);
    try {
      // Step 1: Search web for product info using barcode
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Search the web for EXACT product information for this barcode/UPC: ${code}

CRITICAL ACCURACY REQUIREMENTS:
1. Find the EXACT product match from major retailers (Amazon, Walmart, Target, manufacturer websites)
2. Verify the barcode matches the product
3. Get the COMPLETE product name including brand, size, variant, etc.
4. If you find multiple matches, choose the most common/popular one from major retailers
5. If no exact match found, return null

Return JSON:
{
  "name": "EXACT complete product name with brand and details",
  "brand": "manufacturer/brand name",
  "model": "model number or variant if applicable",
  "category": "electronics|furniture|jewelry|vehicle|art|collectible|other",
  "estimated_price": current retail price as number,
  "description": "brief product description",
  "found": true/false,
  "source": "where you found this info (Amazon, manufacturer, etc.)"
}

Example for lotion:
{
  "name": "Jergens Ultra Healing Extra Dry Skin Moisturizer, 21 oz",
  "brand": "Jergens",
  "category": "other",
  "estimated_price": 8.99,
  "description": "Extra dry skin body lotion",
  "found": true,
  "source": "Amazon"
}

If product not found, return {"found": false}`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            brand: { type: "string" },
            model: { type: "string" },
            category: { type: "string" },
            estimated_price: { type: "number" },
            description: { type: "string" },
            found: { type: "boolean" },
            source: { type: "string" }
          }
        }
      });

      if (result && result.found && result.name) {
        const assetData = {
          name: result.name,
          brand: result.brand || '',
          model: result.model || '',
          category: result.category || 'other',
          barcode: code,
          ai_estimated_value: result.estimated_price || 0,
          current_value: result.estimated_price || 0,
          notes: result.description ? `${result.description}\n\nProduct info from: ${result.source}` : '',
          condition: 'good',
          purchase_date: new Date().toISOString().split('T')[0]
        };
        
        setScannedData(assetData);
        setShowConfirmation(true);
      } else {
        alert(`Could not find product information for barcode ${code}.\n\nThis might be a store-specific or international code. You can add the item manually instead.`);
      }
    } catch (error) {
      console.error('Barcode lookup error:', error);
      alert('Failed to lookup barcode. Please try again or add the item manually.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleConfirmAdd = () => {
    if (scannedData) {
      const finalData = {
        ...scannedData,
        property_id: selectedProperty !== 'none' ? selectedProperty : null
      };
      onAssetCreated(finalData);
      handleCloseAll();
    }
  };

  const handleCloseAll = () => {
    setBarcode("");
    setScannedData(null);
    setShowConfirmation(false);
    setSelectedProperty('none');
    stopCamera();
    onClose();
  };

  if (showConfirmation && scannedData) {
    return (
      <Dialog open={open} onOpenChange={handleCloseAll}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Product Found!
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">
                {scannedData.name}
              </h3>
              <div className="space-y-1 text-sm">
                {scannedData.brand && <p><strong>Brand:</strong> {scannedData.brand}</p>}
                {scannedData.model && <p><strong>Model:</strong> {scannedData.model}</p>}
                <p><strong>Category:</strong> {scannedData.category}</p>
                {scannedData.ai_estimated_value > 0 && (
                  <p><strong>Estimated Value:</strong> ${scannedData.ai_estimated_value.toLocaleString()}</p>
                )}
                {scannedData.notes && (
                  <p className="mt-2 text-gray-600 dark:text-gray-400">{scannedData.notes.split('\n')[0]}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="property">Assign to Property (Optional)</Label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
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
              <p className="text-xs text-gray-500">You can organize assets by location or property</p>
            </div>

            <Alert>
              <AlertDescription>
                Would you like to add this asset to your Vault?
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseAll}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAdd} className="bg-green-600 hover:bg-green-700">
              <Check className="w-4 h-4 mr-2" />
              Add to Vault
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleCloseAll}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-green-600 dark:text-green-400" />
            Barcode Scanner
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!useCamera ? (
            <>
              <Alert>
                <AlertDescription>
                  Scan a barcode with your camera or enter manually for accurate product lookup.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode / UPC Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="e.g., 012345678901"
                    onKeyPress={(e) => e.key === 'Enter' && handleManualLookup()}
                  />
                  <Button onClick={() => handleManualLookup()} disabled={!barcode.trim() || isScanning}>
                    {isScanning ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Lookup'
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">OR</p>
                <Button onClick={startCamera} variant="outline" className="w-full">
                  <Camera className="w-4 h-4 mr-2" />
                  Scan with Camera
                </Button>
                {cameraError && (
                  <p className="text-xs text-red-600 mt-2">{cameraError}</p>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                <Button
                  onClick={stopCamera}
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                >
                  <X className="w-4 h-4 text-white" />
                </Button>
                <div className="absolute bottom-2 left-2 right-2 text-center text-white text-sm bg-black/50 p-2 rounded">
                  Position barcode clearly in view and click Capture
                </div>
              </div>
              <Button 
                onClick={captureAndScan}
                disabled={isScanning}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Scan className="w-4 h-4 mr-2" />
                    Capture & Scan
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCloseAll}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
