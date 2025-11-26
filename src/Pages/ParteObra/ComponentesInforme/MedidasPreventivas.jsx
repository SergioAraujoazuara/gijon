import React from "react";
import { View, StyleSheet } from "@react-pdf/renderer";
import SeccionesDatosRegistros from "./SeccionesDatosRegistros";

const styles = StyleSheet.create({
  fieldGroup: {
    flexDirection: "column", // ⬅️ Asegura que cada sección use el ancho completo
    justifyContent: "flex-start",
    alignItems: "stretch",
    width: "100%", // ⬅️ Usa todo el ancho disponible
  },
  section: {
    width: "100%", // ⬅️ Cada sección ocupa todo el ancho disponible
  },
});

const MedidasPreventivas = ({ dataRegister }) => {
  return (
    <View style={styles.fieldGroup}>
      <View style={styles.section}>
        <SeccionesDatosRegistros
          valorDelCampo={dataRegister.actividadesProximoInicio}
        />
        <SeccionesDatosRegistros
          valorDelCampo={dataRegister.medidasPreventivas}
        />
      </View>
    </View>
  );
};

export default MedidasPreventivas;
