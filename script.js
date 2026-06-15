// script.js - ใช้ pdf-lib เพื่อฝังฟอนต์และวางข้อความตามพิกัด (PDF origin = bottom-left)
const previewBtn = document.getElementById('previewBtn');
const downloadBtn = document.getElementById('downloadBtn');

async function readFileAsArrayBuffer(file) {
  return await file.arrayBuffer();
}

async function generatePDF({ preview = false } = {}) {
  const templateInput = document.getElementById('templateFile');
  if (!templateInput.files.length) return alert('กรุณาอัพโหลดไฟล์ PDF แบบฟอร์มก่อน');
  const templateBytes = await readFileAsArrayBuffer(templateInput.files[0]);

  const pdfDoc = await PDFLib.PDFDocument.load(templateBytes);
  const pages = pdfDoc.getPages();
  const page = pages[0];
  const { height: pageHeight } = page.getSize();

  // embed font if provided
  const fontInput = document.getElementById('fontFile');
  let font;
  if (fontInput.files.length) {
    const fontBytes = await readFileAsArrayBuffer(fontInput.files[0]);
    font = await pdfDoc.embedFont(new Uint8Array(fontBytes));
  } else {
    // fallback to a built-in font (no Thai support). Recommend uploading .ttf for Thai.
    font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
  }

  // helper to draw a single text field
  function drawTextFrom(ids) {
    const text = document.getElementById(ids.text).value || '';
    if (!text) return;
    const x = Number(document.getElementById(ids.x).value) || 0;
    const y = Number(document.getElementById(ids.y).value) || 0;
    const size = Number(document.getElementById(ids.size).value) || 12;
    page.drawText(text, { x, y, size, font, color: PDFLib.rgb(0,0,0) });
  }

  // draw fields (first page)
  drawTextFrom({ text: 'titleText', x: 'titleX', y: 'titleY', size: 'titleSize' });
  drawTextFrom({ text: 'authorText', x: 'authorX', y: 'authorY', size: 'authorSize' });
  drawTextFrom({ text: 'pagesText', x: 'pagesX', y: 'pagesY', size: 'pagesSize' });
  drawTextFrom({ text: 'timeText', x: 'timeX', y: 'timeY', size: 'timeSize' });
  drawTextFrom({ text: 'summaryText', x: 'summaryX', y: 'summaryY', size: 'summarySize' });
  drawTextFrom({ text: 'takeawayText', x: 'takeawayX', y: 'takeawayY', size: 'takeawaySize' });
  drawTextFrom({ text: 'applicationText', x: 'applicationX', y: 'applicationY', size: 'applicationSize' });
  drawTextFrom({ text: 'reasonText', x: 'reasonX', y: 'reasonY', size: 'reasonSize' });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  if (preview) {
    window.open(url, '_blank');
  } else {
    // download with filename
    const a = document.createElement('a');
    a.href = url;
    a.download = 'filled-form.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
}

previewBtn.addEventListener('click', (e) => { e.preventDefault(); generatePDF({ preview: true }).catch(err => alert(err)); });
downloadBtn.addEventListener('click', (e) => { e.preventDefault(); generatePDF({ preview: false }).catch(err => alert(err)); });
