import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import TituloInforme from "./TituloInforme";

const styles = StyleSheet.create({
  fieldGroup: {
    flexDirection: "column",
    marginBottom: 3,
    marginLeft: 8,
  },
  actividadBlock: {
    borderRadius: 6,
    marginBottom: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: "#fff",
    position: "relative",
  },
  actividadHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#9ca3af", // Color más oscuro
  },
  actividadTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#5F6B75",
    flex: 3,
  },
  actividadEstado: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#388e3c",
    flex: 1,
    textAlign: "right",
  },
  observacionText: {
    fontSize: 8,
    color: "#5F6B75",
    marginBottom: 4,
    lineHeight: 1.2,
  },
  subActividadBlock: {
    borderRadius: 4,
    marginTop: 2,
    marginBottom: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "#fff",
  },
  subActividadTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 3,
  },
  subActividadText: {
    fontSize: 8,
    color: "#5F6B75",
    marginBottom: 3,
    lineHeight: 1,
  },
  subActividadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  subActividadStatus: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#388e3c",
  },
  label: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 3,
  },
  value: {
    fontSize: 8,
    color: "#5F6B75",
    marginBottom: 3,
    lineHeight: 1.2,
  },
});

const DatosRegistroTabla = ({ registro }) => {
  return (
    <View style={styles.fieldGroup}>
      <TituloInforme plantillaSeleccionada="3. Detalles de la inspección (PPI)" />

      {registro.actividades &&
        Object.values(registro.actividades)
          .filter((actividad) => actividad.seleccionada === true)
          .map((actividad, index) => (
            <View key={index} style={styles.actividadBlock}>
              <View style={styles.actividadHeader}>
                <Text style={styles.actividadTitle}>
                 {actividad.nombre || `${index + 1}`}
                </Text>
                <Text style={styles.actividadEstado}>Aplica ✅</Text>
              </View>

              <Text style={styles.observacionText}>
                {actividad.observacion || "—"}
              </Text>

              {Array.isArray(actividad.subactividades) &&
                actividad.subactividades.length > 0 &&
                actividad.subactividades.filter(
                  (sub) => sub.seleccionada === true && ((sub.nombre && sub.nombre.trim() !== "") || (sub.observacion && sub.observacion.trim() !== ""))
                ).length > 0 && (
                  <View style={styles.subActividadBlock}>
                    <Text style={styles.label}>Subactividades:</Text>
                    
                  </View>
                )}
            </View>
          ))}
    </View>
  );
};

export default DatosRegistroTabla;
