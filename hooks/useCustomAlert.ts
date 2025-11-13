import { useState } from 'react';

interface AlertConfig {
  type: 'success' | 'error' | 'warning' | 'confirm';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const useCustomAlert = () => {
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [visible, setVisible] = useState(false);

  const showAlert = (config: AlertConfig) => {
    setAlertConfig(config);
    setVisible(true);
  };

  const hideAlert = () => {
    setVisible(false);
    setTimeout(() => setAlertConfig(null), 300);
  };

  const handleConfirm = () => {
    alertConfig?.onConfirm?.();
    hideAlert();
  };

  const handleCancel = () => {
    alertConfig?.onCancel?.();
    hideAlert();
  };

  return {
    alertConfig,
    visible,
    showAlert,
    hideAlert,
    handleConfirm,
    handleCancel,
  };
};
