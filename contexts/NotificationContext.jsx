import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import { paymentStatusManager } from "../services/paymentStatusManager";

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [visible, setVisible] = useState(false);
  const timeoutRefs = useRef(new Map());
  const notificationId = useRef(0);

  const addNotification = (notification) => {
    const id = ++notificationId.current;
    const newNotification = {
      id,
      timestamp: Date.now(),
      autoHide: notification.autoHide !== false,
      duration: notification.duration || 5000,
      ...notification,
    };

    setNotifications((prev) => [...prev, newNotification]);
    setVisible(true);

    if (newNotification.autoHide) {
      const timeoutId = setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);

      timeoutRefs.current.set(id, timeoutId);
    }

    return id;
  };

  const removeNotification = (id) => {
    setNotifications((prev) => {
      const filtered = prev.filter((n) => n.id !== id);
      if (filtered.length === 0) {
        setVisible(false);
      }
      return filtered;
    });

    const timeoutId = timeoutRefs.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutRefs.current.delete(id);
    }
  };

  const clearAllNotifications = () => {
    timeoutRefs.current.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutRefs.current.clear();
    setNotifications([]);
    setVisible(false);
  };

  const showPaymentOverdueNotification = (payments) => {
    const count = payments.length;
    const message =
      count === 1
        ? `Pembayaran ${payments[0].periodData?.label} sudah terlambat!`
        : `${count} pembayaran sudah terlambat!`;

    return addNotification({
      type: "error",
      title: "Pembayaran Terlambat",
      message,
      icon: "⚠️",
      actions: [
        {
          label: "Bayar Sekarang",
          primary: true,
          onPress: () => {
            // Navigation akan di-handle di komponen yang menggunakan
          },
        },
      ],
      data: { payments, type: "overdue" },
    });
  };

  const showPaymentUpcomingNotification = (payments) => {
    const count = payments.length;
    const message =
      count === 1
        ? `Pembayaran ${payments[0].periodData?.label} akan jatuh tempo dalam 3 hari`
        : `${count} pembayaran akan jatuh tempo dalam 3 hari`;

    return addNotification({
      type: "warning",
      title: "Pembayaran Akan Jatuh Tempo",
      message,
      icon: "⏰",
      actions: [
        {
          label: "Lihat Detail",
          primary: true,
          onPress: () => {
            // Navigation akan di-handle di komponen yang menggunakan
          },
        },
      ],
      data: { payments, type: "upcoming" },
    });
  };

  const showPaymentSuccessNotification = (payment) => {
    return addNotification({
      type: "success",
      title: "Pembayaran Berhasil",
      message: `Pembayaran ${payment.periodData?.label} telah berhasil diproses`,
      icon: "✅",
      duration: 3000,
      data: { payment, type: "success" },
    });
  };

  const showUpdateNotification = (message, type = "info") => {
    return addNotification({
      type,
      title: "Status Diperbarui",
      message,
      icon: type === "success" ? "✅" : "ℹ️",
      duration: 3000,
    });
  };

  const showErrorNotification = (message, error = null) => {
    return addNotification({
      type: "error",
      title: "Error",
      message,
      icon: "❌",
      duration: 4000,
      data: { error },
    });
  };

  useEffect(() => {
    const unsubscribe = paymentStatusManager.addListener((type, data) => {
      switch (type) {
        case "payments_overdue":
          showPaymentOverdueNotification(data.payments);
          break;

        case "payments_upcoming":
          showPaymentUpcomingNotification(data.payments);
          break;

        case "user_payment_updated":
          if (data.source !== "manual") {
            showUpdateNotification(
              `Data pembayaran diperbarui (${data.source})`,
              "success"
            );
          }
          break;

        case "all_users_updated":
          if (data.source !== "manual") {
            showUpdateNotification(
              `Data pembayaran semua santri diperbarui (${data.source})`,
              "success"
            );
          }
          break;

        default:
          break;
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, []);

  const value = {
    notifications,
    visible,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showPaymentOverdueNotification,
    showPaymentUpcomingNotification,
    showPaymentSuccessNotification,
    showUpdateNotification,
    showErrorNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
