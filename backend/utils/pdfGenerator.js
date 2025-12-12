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
                .text('info@brpl.net', 110, 110)
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
                    amount: 1499.00,
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
            doc.text("Rs. 1499.00", 450, totalTop, { align: "right" });

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
        .text('info@brpl.net', 110, 110)
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
            amount: 1499.00,
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
    doc.text("Rs. 1499.00", 450, totalTop, { align: "right" });

    // Footer
    doc.fontSize(10)
        .text(
            "Payment received, thank you for your business.",
            50,
            700,
            { align: "center", width: 500 }
        );
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
