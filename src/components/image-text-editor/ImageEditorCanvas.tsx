
"use client";

import type { FC, MouseEvent } from 'react';
import React, { useRef, useEffect } from 'react';

export interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  fontFamily: string;
}

interface ImageEditorCanvasProps {
  imageFile: File | null;
  textElements: TextElement[];
  onCanvasClick: (event: MouseEvent<HTMLCanvasElement>) => void;
  canvasWidth?: number;
  canvasHeight?: number;
}

const ImageEditorCanvas: FC<ImageEditorCanvasProps> = ({
  imageFile,
  textElements,
  onCanvasClick,
  canvasWidth = 800, // Default canvas width
  canvasHeight = 600, // Default canvas height
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f0f0f0'; // Light gray background if no image
    ctx.fillRect(0, 0, canvas.width, canvas.height);


    let imgLoaded = false;

    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Scale image to fit canvas while maintaining aspect ratio
          const hRatio = canvas.width / img.width;
          const vRatio = canvas.height / img.height;
          const ratio = Math.min(hRatio, vRatio);
          const centerShift_x = (canvas.width - img.width * ratio) / 2;
          const centerShift_y = (canvas.height - img.height * ratio) / 2;
          
          ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear again before drawing image
          ctx.drawImage(img, 0, 0, img.width, img.height, centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
          imgLoaded = true;
          drawTextElements(ctx); // Draw text after image is loaded
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(imageFile);
    } else {
        // If no image, draw texts immediately
        drawTextElements(ctx);
    }

    const drawTextElements = (context: CanvasRenderingContext2D) => {
      textElements.forEach((el) => {
        context.fillStyle = el.color;
        context.font = `${el.fontSize}px ${el.fontFamily}`;
        context.textAlign = 'left';
        context.textBaseline = 'top';
        context.fillText(el.text, el.x, el.y);
      });
    };
    
    // If image wasn't loaded (e.g. imageFile is null), draw texts
    if (!imageFile) {
        drawTextElements(ctx);
    }

  }, [imageFile, textElements, canvasWidth, canvasHeight]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      onClick={onCanvasClick}
      className="border border-input rounded-md shadow-sm cursor-crosshair bg-muted/20"
      data-ai-hint="image editor canvas"
    />
  );
};

export default ImageEditorCanvas;
