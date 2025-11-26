/**
 * Función para calcular "No Aptos" por sector y el total
 * @param {Array} datosSubactividades - Array de datos de subactividades
 * @returns {Object} - Retorna un objeto con los totales de "No Aptos" por sector y el total general
 */
export const getNoAptos = (datosSubactividades) => {
    const noAptosPorSectorTemp = {};
    let totalNoAptosTemp = 0;

    // Agrupar inspecciones por el campo 'numero'
    const inspeccionesPorNumero = datosSubactividades.reduce((acc, inspeccion) => {
        const { numero } = inspeccion;
        if (!acc[numero]) {
            acc[numero] = [];
        }
        acc[numero].push(inspeccion);
        return acc;
    }, {});

    // Filtrar los "No apto" activos
    Object.values(inspeccionesPorNumero).forEach((inspecciones) => {
        const ultimaInspeccion = inspecciones[inspecciones.length - 1]; // Obtener la última inspección del grupo
        if (ultimaInspeccion.resultadoInspeccion === 'No apto') {
            totalNoAptosTemp += 1;
            const sector = ultimaInspeccion.sector;
            if (!noAptosPorSectorTemp[sector]) {
                noAptosPorSectorTemp[sector] = 0;
            }
            noAptosPorSectorTemp[sector] += 1;
        }
    });

    return {
        noAptosPorSector: noAptosPorSectorTemp,
        totalNoAptos: totalNoAptosTemp,
    };
};