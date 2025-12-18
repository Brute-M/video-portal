const PDFDocument = require('pdfkit');
const path = require('path');

const generateInvoicePDF = (video, user) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // --- Header ---
            const logoPath = path.join(__dirname, '../../frontend/public/logo.png');
            if (require('fs').existsSync(logoPath)) {
                doc.image(logoPath, 50, 45, { width: 50 });
            }

            doc.fillColor('#444444')
                .fontSize(20)
                .text('Beyond Reach Premiere League', 110, 57)
                .fontSize(10)
                .text('Ground Floor, Suite G-01, Procapitus Business Park, D-247/4A, D Block, Sector 63, Noida, Uttar Pradesh 201309', 110, 80, { width: 250 })
                .text('noreply@brpl.net', 110, 110)
                .moveDown();

            // Invoice Label and Details (Right aligned)
            doc.fillColor('#444444')
                .fontSize(20)
                .text('INVOICE', 400, 57, { align: 'right' })
                .fontSize(10)
                .text(`Invoice No: ${video.paymentId}`, 400, 80, { align: 'right' })
                .text(`Date: ${new Date().toLocaleDateString()}`, 400, 95, { align: 'right' })
                .text(`Balance Due: Rs. 0.00`, 400, 110, { align: 'right' });

            // Divider
            doc.moveDown();
            doc.strokeColor("#aaaaaa")
                .lineWidth(1)
                .moveTo(50, 150)
                .lineTo(550, 150)
                .stroke();

            // --- Bill To Section ---
            doc.fontSize(12).text('Bill To:', 50, 170);
            doc.fontSize(10)
                .text(`${user.fname} ${user.lname}`, 50, 190)
                .text(`${user.address1}${user.address2 ? ', ' + user.address2 : ''}`, 50, 205)
                .text(`${user.city}, ${user.state} - ${user.pincode}`, 50, 220)
                .text(`Email: ${user.email}`, 50, 235)
                .text(`Mobile: ${user.mobile}`, 50, 250);

            // --- Items Table ---
            const invoiceTableTop = 330;

            doc.font("Helvetica-Bold");
            doc.text("Item", 50, invoiceTableTop)
                .text("Description", 150, invoiceTableTop)
                .text("Amount", 280, invoiceTableTop, { width: 90, align: "right" })
                .text("Quantity", 370, invoiceTableTop, { width: 90, align: "right" })
                .text("Line Total", 0, invoiceTableTop, { align: "right" });

            doc.strokeColor("#aaaaaa")
                .lineWidth(1)
                .moveTo(50, invoiceTableTop + 20)
                .lineTo(550, invoiceTableTop + 20)
                .stroke();

            doc.font("Helvetica");

            const items = [
                {
                    item: "Video Upload",
                    description: video.originalName || "Video Upload Service",
                    amount: 1.0,
                    quantity: 1
                }
            ];

            let i;
            const invoiceTableLoop = invoiceTableTop + 30;
            for (i = 0; i < items.length; i++) {
                const item = items[i];
                const position = invoiceTableLoop + (i * 30);

                doc.fontSize(10)
                    .text(item.item, 50, position)
                    .text(item.description, 150, position)
                    .text("Rs. " + item.amount.toFixed(2), 280, position, { width: 90, align: "right" })
                    .text(item.quantity, 370, position, { width: 90, align: "right" })
                    .text("Rs. " + (item.amount * item.quantity).toFixed(2), 0, position, { align: "right" });

                doc.strokeColor("#aaaaaa")
                    .lineWidth(1)
                    .moveTo(50, position + 20)
                    .lineTo(550, position + 20)
                    .stroke();
            }

            // --- Summary & Total ---
            const subtotalPosition = invoiceTableLoop + (items.length * 30) + 20;
            const totalTop = subtotalPosition + 25;

            doc.font("Helvetica-Bold");
            doc.text("Total:", 350, totalTop);
            doc.text("Rs. 1.0", 450, totalTop, { align: "right" });

            // Footer
            doc.fontSize(10)
                .text(
                    "Payment received, thank you for your business.",
                    50,
                    700,
                    { align: "center", width: 500 }
                );

            doc.end();
            return doc;
        } catch (error) {
            reject(error);
        }
    });
};

const pipeInvoicePDF = (video, user, res) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    // ... Copy of logic or reuse ...
    // To avoid code duplication, for the pipe version we can reuse the same drawing logic
    // but PDFKit structure makes it slightly hard to share exactly same "doc" instance logic 
    // without wrapping the drawing part.
    // Ideally, I should make a "drawInvoice(doc, video, user)" function.

    // For now, let's keep it simple. The requirement is to SEND EMAIL with attachment.
    // The previous implementation for download was piping to res.
    // We can just use the memory buffer approach for email and write to res for download?
    // OR we can make the draw logic separate.

    doc.pipe(res);
    drawInvoice(doc, video, user);
    doc.end();
};

// Extracted drawing logic to avoid duplication
const drawInvoice = (doc, video, user) => {
    const pageWidth = doc.page.width;
    const marginLeft = doc.page.margins.left;
    const marginRight = doc.page.margins.right;

    const contentWidth = pageWidth - marginLeft - marginRight;

    const baseAmount = video.amount ? Number(video.amount) : 1.0;
    const totalAmount = baseAmount; // No taxes

    // Calculate total explicitly to ensure number
    const finalTotal = Number(totalAmount).toFixed(2);


    // --- Top colored band ---
    doc.save();
    doc.rect(0, 0, pageWidth, 20).fill('#111a45'); // Navy Theme
    doc.restore();

    // --- Header: Logo and company / invoice details ---
    const logoPath = path.join(__dirname, '../../frontend/public/logo.png');
    if (require('fs').existsSync(logoPath)) {
        doc.image(logoPath, marginLeft, 35, { width: 50 });
    }

    doc.fillColor('#111a45')
        .fontSize(20)
        .text('Beyond Reach Premiere League', marginLeft + 70, 40, { continued: false });

    doc.fontSize(10)
        .fillColor('#555555')
        .text('TAX INVOICE', marginLeft + 70, 65);

    const infoWidth = 200;
    const infoX = marginLeft + contentWidth - infoWidth;
    const today = new Date();

    const infoTop = 40;
    doc.fillColor('#000000').fontSize(10);
    doc.text(`Invoice # : ${video.paymentId}`, infoX, infoTop, { align: 'right', width: infoWidth });
    doc.text(`Date : ${today.toLocaleDateString()}`, infoX, infoTop + 14, { align: 'right', width: infoWidth });
    doc.text(`Place of Supply : ${user.state || ''}`, infoX, infoTop + 28, { align: 'right', width: infoWidth });
    // Removed GSTIN if not needed, or keep it. User asked to remove SGST/CGST, maybe GSTIN is fine or not?
    // User said "remove sgst and cgst also". I will keep GSTIN of company for now unless asked.
    doc.text(`GSTIN: 36ABCBS2942R1ZR`, infoX, infoTop + 42, { align: 'right', width: infoWidth });

    // --- Bill To and Ship To ---
    const blockTop = 110;
    const blockWidth = contentWidth / 2 - 10;

    doc.fontSize(10).fillColor('#555555');
    doc.text('Bill To:', marginLeft, blockTop);
    doc.fillColor('#000000').fontSize(10);
    doc.text(`${user.fname || ''} ${user.lname || ''}`.trim(), marginLeft, blockTop + 14);
    doc.text(`${user.address1 || ''}${user.address2 ? ', ' + user.address2 : ''}`, marginLeft, blockTop + 28, { width: blockWidth });
    doc.text(`${user.city || ''}, ${user.state || ''} - ${user.pincode || ''}`, marginLeft, blockTop + 42, { width: blockWidth });
    if (user.mobile) {
        doc.text(`Ph: ${user.mobile}`, marginLeft, blockTop + 56);
    }

    const shipTop = blockTop;
    const shipLeft = marginLeft + blockWidth + 20;

    doc.fontSize(10).fillColor('#555555');
    doc.text('Ship To:', shipLeft, shipTop);
    doc.fillColor('#000000');
    doc.text(`${user.fname || ''} ${user.lname || ''}`.trim(), shipLeft, shipTop + 14);
    doc.text(`${user.address1 || ''}${user.address2 ? ', ' + user.address2 : ''}`, shipLeft, shipTop + 28, { width: blockWidth });
    doc.text(`${user.city || ''}, ${user.state || ''} - ${user.pincode || ''}`, shipLeft, shipTop + 42, { width: blockWidth });

    // --- Items Table Header ---
    const tableTop = 220;
    const rowHeight = 22;

    const colNoX = marginLeft;
    const colDescX = marginLeft + 30;
    const colHsnX = marginLeft + 320;
    const colAmountX = marginLeft + 430;

    doc.save();
    doc.rect(marginLeft, tableTop, contentWidth, rowHeight).fill('#111a45'); // Navy Theme
    doc.restore();

    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
    doc.text('#', colNoX + 10, tableTop + 6);
    doc.text('Description', colDescX, tableTop + 6);
    doc.text('HSN/SAC', colHsnX, tableTop + 6);
    doc.text('Amount', colAmountX, tableTop + 6, { width: 100, align: 'right' });

    // --- Single item row ---
    const itemY = tableTop + rowHeight;
    doc.strokeColor('#dddddd').lineWidth(0.5)
        .moveTo(marginLeft, itemY)
        .lineTo(marginLeft + contentWidth, itemY)
        .stroke();

    doc.font('Helvetica').fontSize(10).fillColor('#000000');

    doc.text('1', colNoX + 10, itemY + 6);
    const descriptionLines = [
        'Video Upload Service',
        video.originalName ? `File: ${video.originalName}` : ''
    ].filter(Boolean);
    doc.text(descriptionLines.join(' - '), colDescX, itemY + 6, { width: colHsnX - colDescX - 10 });
    doc.text('998365', colHsnX, itemY + 6);
    doc.text(`Rs. ${finalTotal}`, colAmountX, itemY + 6, { width: 100, align: 'right' });

    const afterItemY = itemY + rowHeight + 4;
    doc.strokeColor('#dddddd').lineWidth(0.5)
        .moveTo(marginLeft, afterItemY)
        .lineTo(marginLeft + contentWidth, afterItemY)
        .stroke();

    // --- Total Summary (Simplified, no Tax) ---
    const taxBlockTop = afterItemY + 16;
    const taxLeft = marginLeft + contentWidth - 220;

    doc.font('Helvetica-Bold').fontSize(11).fillColor('#000000');
    doc.text('Total', taxLeft, taxBlockTop);
    doc.text(`Rs. ${finalTotal}`, taxLeft + 120, taxBlockTop, { align: 'right', width: 100 });

    // --- Amount in words ---
    const amountWordsY = taxBlockTop + 80;
    doc.font('Helvetica').fontSize(9).fillColor('#555555');
    doc.text(`Total amount (in words): INR ${totalAmount.toFixed(2)} only.`, marginLeft, amountWordsY, {
        width: contentWidth,
    });

    // --- Company Address (Shifted to Bottom) ---
    const addressTop = amountWordsY + 50;
    doc.strokeColor("#aaaaaa").lineWidth(0.5).moveTo(marginLeft, addressTop - 10).lineTo(marginLeft + contentWidth, addressTop - 10).stroke();

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#111a45');
    doc.text('Beyond Reach Premiere League', marginLeft, addressTop);
    doc.font('Helvetica').fontSize(9).fillColor('#555555');
    doc.text('Ground Floor, Suite G-01, Procapitus Business Park, D-247/4A, D Block, Sector 63, Noida, Uttar Pradesh 201309', marginLeft, addressTop + 12, { width: contentWidth });
    doc.text('Email: noreply@brpl.net | Mobile: 9999999999', marginLeft, addressTop + 24);

    // --- Terms and Conditions ---
    const termsTop = addressTop + 45;
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000');
    doc.text('Terms and Conditions:', marginLeft, termsTop);
    doc.font('Helvetica').fontSize(8).fillColor('#555555');
    doc.text('1. Goods/services once sold cannot be taken back or exchanged.', marginLeft, termsTop + 14, { width: contentWidth });
    doc.text('2. Company will stand for warranty as per their terms and conditions.', marginLeft, termsTop + 26, { width: contentWidth });
    doc.text('3. Interest @24% p.a. will be charged for uncleared bills beyond 15 days.', marginLeft, termsTop + 38, { width: contentWidth });
    doc.text('4. Subject to local jurisdiction.', marginLeft, termsTop + 50, { width: contentWidth });
};

// Function Update: returns Buffer Promise
const createInvoiceBuffer = (video, user) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const buffers = [];

            doc.on('data', key => buffers.push(key));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            drawInvoice(doc, video, user);
            doc.end();

        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { createInvoiceBuffer, drawInvoice };
