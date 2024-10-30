const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const tempDir = path.join(__dirname, 'temp_pdfs');
  await fs.ensureDir(tempDir);

  async function savePageAsPdf(page, url, index) {
    try {
      await page.goto(url, { waitUntil: 'networkidle0' });

      const pdfPath = path.join(tempDir, `pagina_${index}.pdf`);
      await page.pdf({
        path: pdfPath,
        format: 'A4',
        printBackground: true
      });

      console.log(`PDF salvo em: ${pdfPath}`);
      return pdfPath;
    } catch (err) {
      console.log(`Erro ao acessar o link: ${url} - ${err.message}`);
    }
  }

  async function mergePDFs(pdfPaths) {
    const mergedPdf = await PDFDocument.create();

    for (const pdfPath of pdfPaths) {
      const pdfBytes = await fs.readFile(pdfPath);
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }

    const finalPdfPath = path.join(__dirname, 'final_output.pdf');
    const mergedPdfBytes = await mergedPdf.save();
    await fs.writeFile(finalPdfPath, mergedPdfBytes);

    console.log(`PDF final criado em: ${finalPdfPath}`);
  }

  const pdfPaths = [];
  const url = `https://discordjs.guide/#before-you-begin`;
  console.log(`Acessando URL: ${url}`);
  const pdfPath = await savePageAsPdf(page, url, 1);
    if (pdfPath) pdfPaths.push(pdfPath);

  await mergePDFs(pdfPaths);

  await fs.remove(tempDir);

  await browser.close();
})();
