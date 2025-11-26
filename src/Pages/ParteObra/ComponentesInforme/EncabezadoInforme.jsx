import React from "react";
import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  header: {
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: "2px solid #cccccc",
    paddingBottom: 5,
  },
  headerInfo: {
    width: "65%",
    fontSize: 12,
    color: "#5F6B75",
  },
  headerLabel: {
    fontWeight: "bold",
    color: "#5F6B75",
  },
  headerValue: {
    color: "#5F6B75",
    fontSize: 12,
    marginTop: 5,
  },
  headerLogos: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    width: "45%",
  },
  logo: {
    width: 160,
    height: 75,
    marginBottom: 10,
  },
  line: {
    marginTop: 5,
    marginBottom: 5,
    borderBottomWidth: 2,
    borderBottomColor: "#cccccc",
    width: "100%",
  },
});

const EncabezadoInforme = ({
  empresa,
  obra,
  promotor,
  description,
  coordinador,
  director,
  rangoFechas,
  logos,
}) => (
  <View style={styles.header}>
    <View style={styles.headerInfo}>
      <Text style={styles.headerLabel}>Nombre empresa: {empresa}</Text>
      <Text style={styles.headerValue}>Obra: {obra}</Text>
      <View style={styles.line} />
      <Text style={styles.headerLabel}>Promotor: {promotor}</Text>
      <Text style={styles.headerValue}>Contratista: {description}</Text>
      <Text style={styles.headerValue}>Coordinador de seguridad y salud: {coordinador}</Text>
      <Text style={styles.headerValue}>Director de la obra: {director}</Text>
      <Text style={styles.headerValue}>Fecha: {rangoFechas}</Text>
      
      
    </View>
    <View style={styles.headerLogos}>
      {logos.map((logo, index) => (
        <Image key={index} src={logo} style={styles.logo} />
      ))}
    </View>
  </View>
);

export default EncabezadoInforme;
