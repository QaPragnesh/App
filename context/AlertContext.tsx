import React, { createContext, useContext, useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";

type AlertState = {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  isAlertOnly?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
};

type AlertContextType = {
  showAlert: (title: string, message: string) => void;
  showConfirm: (options: { title: string; message: string; confirmText: string; onConfirm: () => void; onCancel?: () => void }) => void;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error("useAlert must be used within an AlertProvider");
  return context;
};

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AlertState>({
    visible: false,
    title: "",
    message: "",
    confirmText: "",
    onConfirm: () => {}
  });

  const showAlert = (title: string, message: string) => {
    setState({
      visible: true,
      title,
      message,
      confirmText: "Got it!",
      isAlertOnly: true,
      onConfirm: () => setState(prev => ({ ...prev, visible: false }))
    });
  };

  const showConfirm = (options: { title: string; message: string; confirmText: string; onConfirm: () => void; onCancel?: () => void }) => {
    setState({
      visible: true,
      title: options.title,
      message: options.message,
      confirmText: options.confirmText,
      isAlertOnly: false,
      onConfirm: () => {
        setState(prev => ({ ...prev, visible: false }));
        options.onConfirm();
      },
      onCancel: options.onCancel
    });
  };

  const handleCancel = () => {
    if (state.onCancel) state.onCancel();
    setState(prev => ({ ...prev, visible: false }));
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <Modal visible={state.visible} animationType="fade" transparent>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{state.title}</Text>
            <Text style={styles.confirmMessage}>{state.message}</Text>
            <View style={styles.confirmActions}>
              {!state.isAlertOnly && (
                <TouchableOpacity style={styles.confirmCancelBtn} onPress={handleCancel}>
                  <Text style={styles.confirmCancelText}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.confirmActionBtn, state.isAlertOnly && { backgroundColor: "#10B981" }]} 
                onPress={state.onConfirm}
              >
                <Text style={styles.confirmActionText}>{state.confirmText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

const styles = StyleSheet.create({
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  confirmCard: {
    backgroundColor: "#121212",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    borderWidth: 1,
    borderColor: "#3A3A3A",
    alignItems: "center",
  },
  confirmTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
  },
  confirmMessage: {
    fontSize: 15,
    color: "#A3A3A3",
    lineHeight: 22,
    marginBottom: 24,
    textAlign: "center",
  },
  confirmActions: {
    flexDirection: "row",
    gap: 12,
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#262626",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3A3A3A",
  },
  confirmCancelText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmActionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#EF4444",
    alignItems: "center",
  },
  confirmActionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
