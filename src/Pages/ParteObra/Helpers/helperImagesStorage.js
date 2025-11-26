import { ref, getMetadata } from "firebase/storage";

export const fetchImagesWithMetadata = async (imagenes, storage) => {
  return await Promise.all(
    imagenes.map(async (url) => {
      try {
        const path = decodeURIComponent(url.split("/o/")[1].split("?")[0]);
        const imageRef = ref(storage, path);

        const metadata = await getMetadata(imageRef);
        const latitude = metadata.customMetadata?.latitude;
        const longitude = metadata.customMetadata?.longitude;

        const response = await fetch(url);
        const blob = await response.blob();
        const imageBase64 = URL.createObjectURL(blob);

        const googleMapsLink =
          latitude && longitude
            ? `https://www.google.com/maps?q=${latitude},${longitude}`
            : null;

        return { imageBase64, googleMapsLink };
      } catch (error) {
        console.error("Error al procesar la imagen:", error);
        return { imageBase64: null, googleMapsLink: null };
      }
    })
  );
};
