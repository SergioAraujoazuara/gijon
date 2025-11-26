import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  sectionTitleMain: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "left",
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical:4,
    paddingLeft: 10,
    width:"536px",
      color: "#4B5563"
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "left",
    backgroundColor: "#E5E7EB",
    padding: 3,
    paddingLeft: 10,
    width:"536px",
  
  },
});

/**
 * TituloInforme Component
 *
 * Renders the main title and active section for the report.
 *
 * @param {string} plantillaSeleccionada - Selected template name.
 * @param {string} activo - Active name.
 */
const TituloActividad = ({ plantillaSeleccionada, activo }) => (
  <View>
    <Text style={styles.sectionTitleMain}>{plantillaSeleccionada}</Text>
    
  </View>
);

export default TituloActividad;
