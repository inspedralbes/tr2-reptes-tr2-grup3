/**
 * ImageCropper.jsx
 * 
 * Component per retallar imatges (fotografies) de perfil.
 * Permet seleccionar una imatge, ajustar-la i retallar-la en format quadrat.
 */
import { useState, useRef, useCallback } from "react";
import { X, Upload, ZoomIn, ZoomOut, RotateCw, Check, Camera } from "lucide-react";
import Modal from "./Modal";
import Button from "../ui/Button";

const ImageCropper = ({ 
  isOpen, 
  onClose, 
  onCropComplete, 
  aspectRatio = 1, // 1 = cuadrado (perfil)
  title = "Retallar imatge",
  maxSizeMB = 2
}) => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setError("Si us plau, selecciona un fitxer d'imatge vàlid");
      return;
    }

    // Validar tamaño
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`La imatge no pot superar els ${maxSizeMB}MB`);
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target.result);
      setPreview(event.target.result);
      setZoom(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e) => {
    if (!image) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (delta) => {
    setZoom(prev => Math.min(3, Math.max(0.5, prev + delta)));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleCrop = () => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Tamaño de salida (cuadrado 300x300 para fotos de perfil)
      const outputSize = 300;
      canvas.width = outputSize;
      canvas.height = outputSize / aspectRatio;

      // Limpiar canvas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Calcular transformaciones
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      // Dibujar imagen centrada
      const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      
      ctx.drawImage(
        img,
        -scaledWidth / 2 + position.x / zoom,
        -scaledHeight / 2 + position.y / zoom,
        scaledWidth,
        scaledHeight
      );
      
      ctx.restore();

      // Convertir a blob
      canvas.toBlob((blob) => {
        if (blob) {
          const croppedUrl = URL.createObjectURL(blob);
          onCropComplete(blob, croppedUrl);
          handleReset();
          onClose();
        }
      }, 'image/jpeg', 0.9);
    };

    img.src = image;
  };

  const handleReset = () => {
    setImage(null);
    setPreview(null);
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="md"
    >
      <div className="space-y-4">
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Input de archivo */}
        {!image ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
          >
            <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
              <Camera className="text-gray-400" size={32} />
            </div>
            <p className="text-gray-600 font-medium mb-1">Fes clic per seleccionar una imatge</p>
            <p className="text-gray-400 text-sm">JPG, PNG o GIF · Màxim {maxSizeMB}MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <>
            {/* Área de previsualización y recorte */}
            <div 
              ref={containerRef}
              className="relative w-full aspect-square bg-gray-900 rounded-xl overflow-hidden cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Marco de recorte */}
              <div className="absolute inset-4 border-2 border-white/50 rounded-full pointer-events-none z-10" />
              <div className="absolute inset-0 bg-black/40 pointer-events-none">
                <div 
                  className="absolute inset-4 rounded-full"
                  style={{ 
                    background: 'transparent', 
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)' 
                  }} 
                />
              </div>
              
              {/* Imagen */}
              <img
                src={preview}
                alt="Preview"
                className="absolute top-1/2 left-1/2 max-w-none select-none pointer-events-none"
                style={{
                  transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${zoom})`,
                  minWidth: '100%',
                  minHeight: '100%',
                  objectFit: 'cover'
                }}
                draggable={false}
              />
            </div>

            {/* Controles */}
            <div className="flex items-center justify-center gap-4 py-2">
              <button
                onClick={() => handleZoom(-0.1)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                title="Reduir"
              >
                <ZoomOut size={20} className="text-gray-600" />
              </button>
              
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg min-w-[80px] justify-center">
                <span className="text-sm font-medium text-gray-700">{Math.round(zoom * 100)}%</span>
              </div>
              
              <button
                onClick={() => handleZoom(0.1)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                title="Ampliar"
              >
                <ZoomIn size={20} className="text-gray-600" />
              </button>
              
              <div className="w-px h-6 bg-gray-300" />
              
              <button
                onClick={handleRotate}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                title="Rotar 90°"
              >
                <RotateCw size={20} className="text-gray-600" />
              </button>
            </div>
          </>
        )}

        {/* Canvas oculto para el crop */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-2">
          {image && (
            <Button variant="secondary" onClick={handleReset}>
              <Upload size={16} className="mr-2" /> Canviar imatge
            </Button>
          )}
          <Button variant="secondary" onClick={handleClose}>
            Cancel·lar
          </Button>
          {image && (
            <Button onClick={handleCrop}>
              <Check size={16} className="mr-2" /> Aplicar
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ImageCropper;
