import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  fieldBlock: {
    marginHorizontal: 6,
  },
  labelStyle: {
    fontWeight: "bold",
    color: "#374151", // Texto más oscuro para etiquetas
    fontSize: 9,
    marginBottom: 2,
    lineHeight: 1.25,
  },
  valueStyle: {
    color: "#4B5563", // Texto del valor ligeramente más claro
    fontSize: 9,
    lineHeight: 1.5,
  },
});

/**
 * SeccionesDatosRegistros Component (sin cards, solo separador)
 */
const SeccionesDatosRegistros = ({ nombreCampo, valorDelCampo }) => {
  if (!valorDelCampo) return null;

  return (
    <View style={styles.fieldBlock}>
      {nombreCampo ? (
        <>
          <Text style={styles.valueStyle}>{nombreCampo}{valorDelCampo}</Text>
          
        </>
      ) : (
        <Text style={styles.valueStyle}>{valorDelCampo}</Text>
      )}
    </View>
  );
};

export default SeccionesDatosRegistros;
