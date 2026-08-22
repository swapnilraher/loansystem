"use client";

import React, { useState, useRef } from "react";
import { Camera, Image as ImageIcon, RotateCw, ZoomIn, ZoomOut, Check, X, Upload } from "lucide-react";

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (croppedFile: File) => void;
  title?: string;
}

export default function ImageCropModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Upload Document",
}: ImageCropModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [fileName, setFileName] = useState("document.jpg");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 2.5));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 0.8));
  };

  const handleConfirm = () => {
    if (!imageSrc) return;

    // Create a canvas to apply rotation & zoom scaling
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      const isRotated = rotation === 90 || rotation === 270;
      canvas.width = isRotated ? img.height : img.width;
      canvas.height = isRotated ? img.width : img.height;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], fileName, { type: "image/jpeg" });
          onConfirm(croppedFile);
          onClose();
        }
      }, "image/jpeg", 0.9);
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-400" />
            {title}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleFileSelect}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Content Body */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col items-center justify-center bg-slate-100">
          {!imageSrc ? (
            <div className="text-center py-10 px-4 w-full">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8" />
              </div>
              <h4 className="font-semibold text-slate-800 text-lg mb-1">Choose Document Source</h4>
              <p className="text-slate-500 text-xs mb-6 max-w-xs mx-auto">
                Upload clear image or PDF document for verification (JPG, PNG, PDF up to 10MB)
              </p>

              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Camera className="w-4 h-4" />
                  Take Photo
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-3 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  Gallery / File
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              {/* Preview Box */}
              <div className="w-full h-64 bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center relative shadow-inner">
                <img
                  src={imageSrc}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain transition-transform duration-200"
                  style={{
                    transform: `rotate(${rotation}deg) scale(${zoom})`,
                  }}
                />
              </div>

              {/* Editing Toolbar */}
              <div className="flex items-center gap-4 mt-4 bg-white py-2 px-4 rounded-full shadow-md border border-slate-200">
                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-700 transition-colors"
                  title="Rotate"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
                <div className="h-4 w-[1px] bg-slate-200"></div>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-700 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-xs font-semibold text-slate-500">{Math.round(zoom * 100)}%</span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-700 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
          {imageSrc ? (
            <button
              type="button"
              onClick={() => setImageSrc(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Retake / Replace
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
            >
              Cancel
            </button>

            {imageSrc && (
              <button
                type="button"
                onClick={handleConfirm}
                className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-1.5 transition-all"
              >
                <Check className="w-4 h-4" />
                Use This Document
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
