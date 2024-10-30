const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const PDFDocument = require('pdfkit');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const tempDir = path.join(__dirname, 'temp');
  await fs.ensureDir(tempDir);

  async function savePageTextAsTxt(page, url, index) {
    try {
      await page.goto(url, { waitUntil: 'networkidle0' });

      const pageText = await page.evaluate(() => {
        return document.body.innerText;
      });

      const txtPath = path.join(tempDir, `pagina_${index}.txt`);
      await fs.writeFile(txtPath, pageText, 'utf-8');
      console.log(`Text saved on: ${txtPath}`);
      return txtPath;
    } catch (err) {
      console.log(`Failure to access url: ${url} - ${err.message}`);
    }
  }

  async function createFinalPDF(txtPaths) {
    const doc = new PDFDocument();

    const finalPdfPath = path.join(__dirname, _pdfFileName + ".pdf");
    const pdfStream = fs.createWriteStream(finalPdfPath);

    doc.pipe(pdfStream);

    for (const txtPath of txtPaths) {
      const text = await fs.readFile(txtPath, 'utf-8');

      doc.addPage();
      doc.fontSize(12).text(text, {
        width: 410,
        align: 'left'
      });
    }

    doc.end();

    console.log(`PDF created successfully: ${finalPdfPath}`);
  }

  const txtPaths = [];
  for (let i = _initialPageValue; i <= _targetValue; i++) {
    const url = `${_baseURL}${i}`;
    console.log(`Accessing current URL: ${url}`);
    const txtPath = await savePageTextAsTxt(page, url, i);
    if (txtPath) txtPaths.push(txtPath);
  }

  await createFinalPDF(txtPaths);

  await fs.remove(tempDir);

  await browser.close();
})();

const _baseURL = "https://novelbin.com/b/rebirth-of-the-strongest-female-emperor/chapter-";
const _initialPageValue = 100;
const _targetValue = 110;
const _pdfFileName = "fileName"