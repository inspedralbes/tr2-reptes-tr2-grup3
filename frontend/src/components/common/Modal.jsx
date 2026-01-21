import React from 'react';
import { X } from 'lucide-react';

const SIZE_CLASSES = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl'
};

const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
    if (!isOpen) return null;

    const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div
                className={`bg-white rounded-xl shadow-2xl w-full ${sizeClass} transform transition-all animate-in fade-in zoom-in-95 duration-200`}
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 p-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[70vh]">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="flex items-center justify-end gap-3 border-t border-gray-100 p-4 bg-gray-50 rounded-b-xl">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
