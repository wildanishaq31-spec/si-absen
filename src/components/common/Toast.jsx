import React from 'react';
import { FloatingNotificationModal } from './FloatingNotificationModal';

export function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <FloatingNotificationModal
      notification={{
        type: toast.type || 'success',
        title: toast.title,
        message: toast.message,
        confirmText: toast.confirmText,
        cancelText: toast.cancelText,
        isConfirm: toast.isConfirm || false,
        onConfirm: toast.onConfirm,
        onCancel: toast.onCancel
      }}
      onClose={onClose}
    />
  );
}
