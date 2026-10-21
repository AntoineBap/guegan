// Génère et télécharge un PDF à la demande.
// Avant, chaque carte rendait son PDF en continu via <PDFDownloadLink>,
// ce qui chargeait @react-pdf et calculait tous les documents à l'affichage de la liste.
export const downloadPdf = async (loadDocument, fileName) => {
  const [{ pdf }, element] = await Promise.all([
    import("@react-pdf/renderer"),
    loadDocument(),
  ]);
  const blob = await pdf(element).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Laisse au navigateur le temps de lire le fichier avant de libérer la mémoire
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};
