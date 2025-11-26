import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  fieldRow: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontWeight: "bold",
    color: "#4b5563",
    fontSize: 9,
    marginBottom: 2,
  },
  fieldValue: {
    color: "#4b5563",
    fontSize: 9,
    lineHeight: 1.5,
    wordBreak: "break-word",
    marginBottom: 2,
  },
});

/**
 * FechaHora Component
 *
 * Displays the date and time for a specific record.
 *
 * @param {Object} fechaHora - Object containing `fecha` and `hora`.
 */
const FechaHora = ({ fechaHora }) => {
  if (!fechaHora || (!fechaHora.fecha && !fechaHora.hora)) return null;

  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>FECHA Y HORA:</Text>
      <Text style={styles.fieldValue}>
        {fechaHora.fecha || "Fecha no disponible"} - {fechaHora.hora || "Hora no disponible"}
      </Text>
    </View>
  );
};

export default FechaHora;
