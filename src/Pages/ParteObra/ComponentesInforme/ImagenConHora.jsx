import React from "react";
import { View, Image, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  imageContainer: {
    marginBottom: 10,
    alignItems: "center",
  },
  image: {
    width: "90%",
    height: 150,
    borderRadius: 5,
    marginBottom: 5,
    border: "1px solid #cccccc",
  },
  hourText: {
    fontSize: 10,
    color: "#4b5563",
    textAlign: "center",
  },
});

/**
 * ImagenConHora Component
 *
 * Renderiza una imagen con su hora correspondiente.
 *
 * @param {string} src - URL de la imagen.
 * @param {string} hora - Hora asociada a la imagen.
 */
const ImagenConHora = ({ src, hora }) => (
  <View style={styles.imageContainer}>
    <Image style={styles.image} src={src} />
    <Text style={styles.hourText}>{hora}</Text>
  </View>
);

export default ImagenConHora;
