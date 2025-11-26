import React from "react";
import { View, StyleSheet } from "@react-pdf/renderer";
import TituloInforme from "./TituloInforme";
import SeccionesDatosRegistros from "./SeccionesDatosRegistros";
import TituloActividad from "./TituloActividad";
import ObservacionesActividades from "./ObservacionesActividades ";

const styles = StyleSheet.create({
  fieldGroup: {
    flexDirection: "column", // ⬅️ Asegura que cada sección use el ancho completo
    justifyContent: "flex-start",
    alignItems: "stretch",
    width: "100%", // ⬅️ Usa todo el ancho disponible
    marginBottom: 2,
  },
  section: {
    width: "100%", // ⬅️ Cada sección ocupa todo el ancho disponible
  },
});

const DatosRegistro = ({ dataRegister }) => {
  return (
    <View style={styles.fieldGroup}>
      {/* Sección 1 */}
      <View style={styles.section}>
        <TituloActividad plantillaSeleccionada={`Trazabilidad de inspección:`} />
        {/* Trazabilidad visual */}
        <View style={{ marginTop: 4, marginBottom: 8, fontSize: 12 }}>
          <TituloInforme plantillaSeleccionada={[
            dataRegister.sectorNombre,
            dataRegister.subSectorNombre,
            dataRegister.parteNombre,
            dataRegister.elementoNombre,
            dataRegister.nombre
          ].filter(
            v => v && !['na', 'n-a', 'n/a'].includes(v.trim().toLowerCase())
          ).join(' - ')} />
        </View>
      </View>

      
      {/* Sección 3 */}
      {/* Sección 3 */}
      <View style={{ ...styles.section, marginBottom: 16, marginTop: 20 }}>
        <TituloInforme plantillaSeleccionada="1. Observaciones generales" />
        <SeccionesDatosRegistros
          valorDelCampo={dataRegister.observaciones}
        />
      </View>


    </View>
  );
};

export default DatosRegistro;
