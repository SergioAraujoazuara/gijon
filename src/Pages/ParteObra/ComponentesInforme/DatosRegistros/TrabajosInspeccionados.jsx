import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import TituloInforme from "../TituloInforme";

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
  fieldLabelObservaciones: {
    fontWeight: "bold",
    color: "#4b5563",
    fontSize: 9,
    marginBottom: 5,
    lineHeight: 1.6,
  },
});

/**
 * ObservacionesRegistro Component
 *
 * Displays the observations for a specific record.
 *
 
 */
const TrabajosInspeccionados = ({ dataRegister }) => {
  if (!dataRegister) return null;

  return (
    <View style={styles.fieldRow}>
       <TituloInforme plantillaSeleccionada="Acta de inspección de coordinación" />
      <Text style={styles.fieldLabelObservaciones}>{dataRegister.observacionesActividad}</Text>
      <Text style={styles.fieldLabelObservaciones}>{dataRegister.observacionesLocalizacion}</Text>
    </View>
  );
};

export default TrabajosInspeccionados;
