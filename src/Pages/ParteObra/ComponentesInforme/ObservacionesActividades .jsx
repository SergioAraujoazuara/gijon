import React from "react";
import { View, StyleSheet } from "@react-pdf/renderer";
import TituloInforme from "./TituloInforme";
import SeccionesDatosRegistros from "./SeccionesDatosRegistros";

const styles = StyleSheet.create({
  fieldGroup: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "stretch",
    width: "100%",
    marginBottom: 2,
  },
  section: {
    width: "100%",
  },
  fieldRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 2,
  },
  field: {
    width: "33.33%",
    paddingRight: 4,
    paddingLeft: 4,
    marginBottom: 8,
  },
  middleField: {
    borderLeftWidth: 1,
    borderLeftColor: "#e5e7eb",
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
  },
  fieldContent: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 4,
    marginBottom: 8,
  },
  lastRow: {
    marginBottom: 0,
  },
  lastField: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  }
});

const ObservacionesActividades = ({ dataRegister }) => {
  const actividades = Object.entries(dataRegister.observacionesActividades)
    .filter(([_, observacion]) => observacion.trim() !== "");

  return (
    <View style={styles.fieldGroup}>
      <View style={styles.section}>
        <View style={styles.fieldRow}>
          {actividades.map(([actividadKey, observacion], index) => {
            const isMiddleColumn = (index + 1) % 3 === 2; // Es la columna del medio
            const isLastRow = Math.floor(index / 3) === Math.floor((actividades.length - 1) / 3);
            const isLastField = index === actividades.length - 1;

            return (
              <View 
                key={index} 
                style={[
                  styles.field,
                  isMiddleColumn && styles.middleField,
                  isLastRow && styles.lastRow
                ]}
              >
                <View style={[
                  styles.fieldContent,
                  isLastField && styles.lastField
                ]}>
                  <SeccionesDatosRegistros
                    nombreCampo="Actividad: "
                    valorDelCampo={observacion || "No especificado"}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export default ObservacionesActividades;
