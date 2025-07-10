
"use client";

import type { FC } from 'react';
import React, { useRef, useEffect, useState } from 'react';

export interface TextElement {
  id: string;
  text: string;
  x: number; // Logical X coordinate relative to image's natural dimensions
  y: number; // Logical Y coordinate
  color: string;
  fontSize: number; // Logical font size
  fontFamily: string;
}

interface ImageEditorCanvasProps extends React.HTMLAttributes<HTMLCanvasElement> {
  imageSrc: File | string | null; // File object or base64 data URI
  textElements: TextElement[];
  onCanvasClick: (logicalX: number, logicalY: number) => void;
  selectedTextElementId?: string | null;
}

const ImageEditorCanvas = React.forwardRef<HTMLCanvasElement, ImageEditorCanvasProps>(({
  imageSrc,
  textElements,
  onCanvasClick,
  selectedTextElementId,
  ...canvasHtmlProps // Spread remaining props to canvas element
}, ref) => {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  // Use the forwarded ref if available, otherwise use the internal ref
  const canvasRef = ref || internalCanvasRef;

  const [currentImage, setCurrentImage] = useState<HTMLImageElement | null>(null);
  const [naturalImageSize, setNaturalImageSize] = useState<{width: number; height: number} | null>(null);

  useEffect(() => {
    let objectUrl: string | undefined;
    const img = new Image();

    img.onload = () => {
      setNaturalImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      setCurrentImage(img);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl); // Clean up if File object was used
      }
    };
    img.onerror = () => {
      console.error("Failed to load image for canvas.");
      setCurrentImage(null);
      setNaturalImageSize(null);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };

    if (imageSrc instanceof File) {
      objectUrl = URL.createObjectURL(imageSrc);
      img.src = objectUrl;
    } else if (typeof imageSrc === 'string') {
      img.src = imageSrc;
    } else {
      setCurrentImage(null);
      setNaturalImageSize(null);
    }
    
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imageSrc]);


  useEffect(() => {
    const canvas = (canvasRef as React.RefObject<HTMLCanvasElement>)?.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    
    // Determine logical canvas size
    const logicalWidth = naturalImageSize?.width || 600; // Default if no image
    const logicalHeight = naturalImageSize?.height || 450;

    // Set actual canvas drawing surface size (scaled by DPR)
    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;

    // Set CSS display size (unscaled)
    canvas.style.width = `${logicalWidth}px`;
    canvas.style.height = `${logicalHeight}px`;
    
    // Scale the context for drawing operations
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, logicalWidth, logicalHeight);

    if (currentImage && naturalImageSize) {
      // Draw image at its natural size (which is our logical canvas size now)
      ctx.drawImage(currentImage, 0, 0, naturalImageSize.width, naturalImageSize.height);
    } else {
      // Fallback background if no image
      ctx.fillStyle = '#e9ecef'; // Light gray
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);
      ctx.fillStyle = '#6c757d'; // Muted text color
      ctx.font = `${16 * dpr}px Arial`; // Scale font for placeholder
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText("No image loaded or image failed to load", logicalWidth / 2, logicalHeight / 2);
    }

    textElements.forEach((el) => {
      ctx.fillStyle = el.color;
      // Font size is already logical, no need to scale again here for setting font string
      // but drawing itself will be scaled by ctx.scale(dpr, dpr)
      ctx.font = `${el.fontSize}px ${el.fontFamily}`; 
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top'; 
      ctx.fillText(el.text, el.x, el.y);

      if (el.id === selectedTextElementId) {
        ctx.strokeStyle = 'rgba(0, 123, 255, 0.7)'; // Blue selection highlight
        ctx.lineWidth = 1; // Logical line width
        const textMetrics = ctx.measureText(el.text);
        const actualWidth = textMetrics.width; // width in logical pixels after ctx.font is set
        const actualHeight = el.fontSize * 1.2; // Approximate height based on font size
        ctx.strokeRect(el.x - 2, el.y - 2, actualWidth + 4, actualHeight + 4);
      }
    });

  }, [currentImage, naturalImageSize, textElements, selectedTextElementId, canvasRef]);

  const handleCanvasClick = (event: ReactMouseEvent<HTMLCanvasElement>) => {
    const canvas = (canvasRef as React.RefObject<HTMLCanvasElement>)?.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    
    // Mouse click coordinates relative to the displayed canvas element
    const scaleX = canvas.width / (window.devicePixelRatio || 1) / rect.width;
    const scaleY = canvas.height / (window.devicePixelRatio || 1) / rect.height;

    // Calculate logical coordinates based on natural image size
    const logicalX = (event.clientX - rect.left) * scaleX;
    const logicalY = (event.clientY - rect.top) * scaleY;
    
    onCanvasClick(logicalX, logicalY);
  };

  return (
    <canvas
      ref={canvasRef as React.RefObject<HTMLCanvasElement>}
      onClick={handleCanvasClick}
      className="border border-input rounded-md shadow-sm cursor-crosshair bg-muted/20"
      style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block' }} // Ensure it scales down nicely
      data-ai-hint="image editor canvas"
      {...canvasHtmlProps} // Spread other HTML attributes
    />
  );
});

ImageEditorCanvas.displayName = "ImageEditorCanvas";
export default ImageEditorCanvas;
