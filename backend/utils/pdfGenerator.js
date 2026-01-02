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
                    amount: 1499,
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
            doc.text("Rs. 1499", 450, totalTop, { align: "right" });

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

    const baseAmount = video.amount ? Number(video.amount) : 1499;
    const totalAmount = baseAmount; // No taxes

    // Calculate total explicitly to ensure number
    const finalTotal = Number(totalAmount).toFixed(2);


    // --- Header Section: White Background ---
    const topMargin = 40;

    // --- Left side: Logo and Company Details ---
    const logoPath = path.join(__dirname, '../../frontend/public/logo.png');
    if (require('fs').existsSync(logoPath)) {
        doc.image(logoPath, marginLeft, topMargin, { width: 60 });
    }

    const companyDetailsX = marginLeft;
    const companyDetailsY = topMargin + 70;

    doc.fillColor('#111a45').font('Helvetica-Bold').fontSize(14)
        .text('Beyond Reach Premiere League', companyDetailsX, companyDetailsY);

    doc.fillColor('#444444').font('Helvetica').fontSize(8);
    doc.text('Ground Floor, Suite G-01, Procapitus Business Park,', companyDetailsX, companyDetailsY + 16);
    doc.text('D-247/4A, D Block, Sector 63, Noida, Uttar Pradesh – 201309', companyDetailsX, companyDetailsY + 28);
    doc.text('Email: noreply@brpl.net', companyDetailsX, companyDetailsY + 40);
    // doc.text('GSTIN: 36ABCBS2942R1ZR', companyDetailsX, companyDetailsY + 52);

    // --- Right side: Invoice Info ---
    const rightColX = marginLeft + 300;

    doc.fillColor('#444444').font('Helvetica').fontSize(16)
        .text('TAX INVOICE', 0, topMargin, { align: 'right', width: contentWidth + marginLeft });

    doc.fontSize(8).text('Original for Recipient', 0, topMargin + 18, { align: 'right', width: contentWidth + marginLeft });

    doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000')
        .text(`IN-${video.paymentId?.substring(0, 8) || '1'}`, 0, topMargin + 30, { align: 'right', width: contentWidth + marginLeft });

    // --- Amount Due Bar (Blue) ---
    const barWidth = 220;
    const barHeight = 25;
    const barX = pageWidth - marginRight - barWidth;
    const barY = topMargin + 55;

    doc.save()
        .fillColor('#111a45')
        .rect(barX, barY, barWidth, barHeight)
        .fill();

    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);
    doc.text('Amount Due:', barX + 10, barY + 8);
    doc.text(`Rs. ${finalTotal}`, barX, barY + 8, { width: barWidth - 10, align: 'right' });
    doc.restore();

    // --- Meta Details (Right Side) ---
    const metaY = barY + barHeight + 10;
    const metaLabelWidth = 80;
    const metaValueWidth = 100;
    const metaX = pageWidth - marginRight - (metaLabelWidth + metaValueWidth);

    doc.fillColor('#444444').font('Helvetica').fontSize(8);

    const drawMetaRow = (label, value, y) => {
        doc.text(label, metaX, y, { width: metaLabelWidth, align: 'right' });
        doc.text(value, metaX + metaLabelWidth + 10, y, { width: metaValueWidth, align: 'left' });
    };

    const today = new Date();
    drawMetaRow('Issue Date:', today.toLocaleDateString(), metaY);
    drawMetaRow('Due Date:', today.toLocaleDateString(), metaY + 12);
    drawMetaRow('Place of Supply:', user.state || 'N/A', metaY + 24);

    // --- Bill To / Ship To ---
    const blockTop = 180;
    const blockWidth = contentWidth / 2 - 20;

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#111a45');
    doc.text('Bill To:', marginLeft, blockTop);

    doc.fontSize(9).font('Helvetica').fillColor('#000000');
    doc.text(`${user.fname || ''} ${user.lname || ''}`.trim(), marginLeft, blockTop + 15);
    doc.text(`${user.address1 || ''}${user.address2 ? ', ' + user.address2 : ''}`, marginLeft, blockTop + 27, { width: blockWidth });
    doc.text(`${user.city || ''}, ${user.state || ''} - ${user.pincode || ''}`, marginLeft, blockTop + 45, { width: blockWidth });
    if (user.mobile) {
        doc.text(`Ph: ${user.mobile}`, marginLeft, blockTop + 57);
    }

    const shipLeft = marginLeft + contentWidth / 2 + 10;
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#111a45');
    doc.text('Ship To:', shipLeft, blockTop);

    doc.fontSize(9).font('Helvetica').fillColor('#000000');
    doc.text(`${user.fname || ''} ${user.lname || ''}`.trim(), shipLeft, blockTop + 15);
    doc.text(`${user.address1 || ''}${user.address2 ? ', ' + user.address2 : ''}`, shipLeft, blockTop + 27, { width: blockWidth });
    doc.text(`${user.city || ''}, ${user.state || ''} - ${user.pincode || ''}`, shipLeft, blockTop + 45, { width: blockWidth });


    // --- Items Table Header ---
    const tableTop = 260;
    const rowHeight = 25;

    const colNoX = marginLeft;
    const colDescX = marginLeft + 30;
    const colHsnX = marginLeft + 300;
    const colQtyX = marginLeft + 360;
    const colAmountX = marginLeft + 420;

    doc.save();
    doc.rect(marginLeft, tableTop, contentWidth, rowHeight).fill('#111a45'); // Navy Theme
    doc.restore();

    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
    doc.text('S.No', colNoX + 5, tableTop + 8);
    doc.text('Item Description', colDescX, tableTop + 8);
    doc.text('HSN/SAC', colHsnX, tableTop + 8);
    doc.text('Qty', colQtyX, tableTop + 8);
    doc.text('Amount (Rs.)', colAmountX, tableTop + 8, { width: 80, align: 'right' });

    // --- Single item row ---
    const itemY = tableTop + rowHeight;
    doc.strokeColor('#eeeeee').lineWidth(0.5)
        .moveTo(marginLeft, itemY)
        .lineTo(marginLeft + contentWidth, itemY)
        .stroke();

    doc.font('Helvetica').fontSize(9).fillColor('#000000');

    doc.text('1', colNoX + 5, itemY + 8);
    const descriptionLines = [
        'Video Upload Service',
        video.originalName ? `File: ${video.originalName}` : ''
    ].filter(Boolean);
    doc.text(descriptionLines.join(' - '), colDescX, itemY + 8, { width: colHsnX - colDescX - 10 });
    doc.text('998365', colHsnX, itemY + 8);
    doc.text('1', colQtyX, itemY + 8);
    doc.text(`${finalTotal}`, colAmountX, itemY + 8, { width: 80, align: 'right' });

    const afterItemY = itemY + 30;
    doc.strokeColor('#eeeeee').lineWidth(0.5)
        .moveTo(marginLeft, afterItemY)
        .lineTo(marginLeft + contentWidth, afterItemY)
        .stroke();

    // --- Bottom Section ---
    const footerTop = afterItemY + 20;

    // Left: Payment Details
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#111a45');
    doc.text('Payment Details:', marginLeft, footerTop);
    doc.fontSize(8).font('Helvetica').fillColor('#444444');
    doc.text(`Transaction ID: ${video.paymentId || 'N/A'}`, marginLeft, footerTop + 14);
    doc.text('Account Name: BEYOND REACH PREMIERE LEAGUE', marginLeft, footerTop + 24);
    // doc.text('Bank: YOUR BANK NAME', marginLeft, footerTop + 34);
    // doc.text('A/C No: 1234567890', marginLeft, footerTop + 44);

    // Right: Summary
    const summaryX = marginLeft + contentWidth - 180;
    const summaryLabelWidth = 100;
    const summaryValueWidth = 80;

    const drawSummaryRow = (label, value, y, bold = false) => {
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor('#000000');
        doc.text(label, summaryX, y, { width: summaryLabelWidth, align: 'right' });
        doc.text(value, summaryX + summaryLabelWidth, y, { width: summaryValueWidth, align: 'right' });
    };

    drawSummaryRow('Total Taxable Value:', `Rs. ${finalTotal}`, footerTop);
    drawSummaryRow('IGST/CGST/SGST:', 'Rs. 0.00', footerTop + 14);
    doc.save().strokeColor('#111a45').lineWidth(1).moveTo(summaryX + 20, footerTop + 28).lineTo(marginLeft + contentWidth, footerTop + 28).stroke().restore();
    drawSummaryRow('Total Amount:', `Rs. ${finalTotal}`, footerTop + 35, true);

    // Amount in words
    const wordsY = footerTop + 70;
    doc.font('Helvetica-Bold').fontSize(8).text('Total Value (in words):', marginLeft, wordsY);
    doc.font('Helvetica').fontSize(8).text(`${finalTotal} Rupees Only.`, marginLeft + 100, wordsY);

    // Signing Authority
    const signTop = wordsY + 40;
    doc.save().strokeColor('#444444').lineWidth(0.5).moveTo(marginLeft + contentWidth - 150, signTop + 40).lineTo(marginLeft + contentWidth, signTop + 40).stroke().restore();
    doc.fontSize(8).text('Authorized Signatory', 0, signTop + 45, { align: 'right', width: contentWidth + marginLeft });

    // Terms
    const termsTop = signTop + 80;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#111a45').text('Terms & Conditions:', marginLeft, termsTop);
    doc.fontSize(7).font('Helvetica').fillColor('#444444');
    doc.text('1. Payment should be made to the mentioned account only.', marginLeft, termsTop + 12);
    doc.text('2. This is a computer generated invoice.', marginLeft, termsTop + 22);
    doc.text('3. Subject to local jurisdiction.', marginLeft, termsTop + 32);
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
