// Cada sección se captura y se renderiza por separado, una por página del
// PDF, en vez de rasterizar todo el detalle en un único canvas y cortarlo
// cada tantos píxeles. Con un solo canvas gigante, el corte de página caía
// donde tocara (a mitad de un gráfico, de una tarjeta, de una fila de
// ronda) porque html2canvas no respeta `break-before`/`break-inside`: esas
// propiedades solo tienen efecto en un contexto de impresión paginado real,
// no al rasterizar un elemento a una imagen. Capturando sección por sección
// cada una queda entera en su propia página (achicada para entrar si hiciera
// falta), sin depender de dónde caiga un corte automático.
export async function exportSectionsToPdf(sections: HTMLElement[], filename: string) {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  // Si quedó un tooltip de un gráfico abierto por una interacción previa
  // (común en touch, donde no hay un "mouse leave" natural), lo cerramos
  // antes de capturar para que no tape parte del gráfico en el PDF.
  (document.activeElement as HTMLElement | null)?.blur?.();
  document.querySelectorAll(".recharts-wrapper").forEach((el) => {
    el.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
  });
  await new Promise((resolve) => setTimeout(resolve, 60));

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Capturar varias secciones seguidas, una atrás de otra, puede pisar el
  // propio cleanup interno de html2canvas (el iframe que usa para clonar el
  // documento): a veces la mide con tamaño 0/degenerado si la siguiente
  // captura arranca antes de que termine de desmontarlo, sobre todo en la
  // primera exportación después de cargar la página. Si eso pasa, se
  // reintenta esa sección después de una pausa en vez de meter una imagen
  // en blanco en el PDF.
  async function captureSection(el: HTMLElement) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const canvas = await html2canvas(el, {
        backgroundColor: "#14171a",
        scale: 2,
        useCORS: true,
      });
      if (canvas.width > 20 && canvas.height > 20) return canvas;
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    throw new Error("No se pudo capturar una de las secciones del PDF.");
  }

  for (let i = 0; i < sections.length; i++) {
    const canvas = await captureSection(sections[i]);
    const imgData = canvas.toDataURL("image/png");

    let imgWidth = pageWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;
    if (imgHeight > pageHeight) {
      // No entra entero a ancho completo: se achica manteniendo proporción
      // para que quepa completo en la página en vez de cortarse.
      imgHeight = pageHeight;
      imgWidth = (canvas.width * imgHeight) / canvas.height;
    }

    if (i > 0) pdf.addPage();
    const x = (pageWidth - imgWidth) / 2;
    pdf.addImage(imgData, "PNG", x, 0, imgWidth, imgHeight);

    // Le da tiempo a html2canvas de terminar de desmontar su iframe de
    // clonado antes de arrancar la siguiente captura (ver comentario arriba).
    if (i < sections.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
  }

  pdf.save(filename);
}
