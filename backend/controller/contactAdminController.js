const Contact = require('../model/contactModel');

exports.getContactLeads = async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(5, Number(req.query.limit) || 10));
        const search = (req.query.search || '').toString().trim();
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;

        const filter = {};

        if (search) {
            // Match across all main contact fields + message
            // eslint-disable-next-line no-useless-escape
            const regex = { $regex: search, $options: 'i' };
            filter.$or = [
                { firstName: regex },
                { lastName: regex },
                { mobileNumber: regex },
                { email: regex },
                { message: regex },
            ];
        }

        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
            };
        }

        const total = await Contact.countDocuments(filter);
        const pages = Math.max(1, Math.ceil(total / limit));
        const safePage = Math.min(page, pages);
        const skip = (safePage - 1) * limit;

        const items = await Contact.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return res.json({
            statusCode: 200,
            data: {
                items,
                pagination: {
                    page: safePage,
                    limit,
                    total,
                    pages,
                },
            },
        });
    } catch (error) {
        console.error('Error fetching contact leads:', error);
        return res.status(500).json({ message: 'Server error fetching contact leads' });
    }
};

exports.exportContactLeadsExcel = async (req, res) => {
    try {
        const { search } = req.query;
        const filter = {};

        if (search) {
            // eslint-disable-next-line no-useless-escape
            const regex = { $regex: String(search).trim(), $options: 'i' };
            filter.$or = [
                { firstName: regex },
                { lastName: regex },
                { mobileNumber: regex },
                { email: regex },
                { message: regex },
            ];
        }

        const leads = await Contact.find(filter).sort({ createdAt: -1 });

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Contact Us Leads');

        worksheet.columns = [
            { header: 'First Name', key: 'firstName', width: 20 },
            { header: 'Last Name', key: 'lastName', width: 20 },
            { header: 'Mobile Number', key: 'mobileNumber', width: 18 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Message', key: 'message', width: 60 },
            { header: 'Submitted At', key: 'createdAt', width: 25 },
        ];

        leads.forEach((lead) => {
            worksheet.addRow({
                firstName: lead.firstName || '',
                lastName: lead.lastName || '',
                mobileNumber: lead.mobileNumber || '',
                email: lead.email || '',
                message: lead.message || '',
                createdAt: lead.createdAt ? new Date(lead.createdAt).toLocaleString() : '',
            });
        });

        worksheet.getRow(1).font = { bold: true };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=contact-us-leads.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Export Contact Leads Error:', error);
        res.status(500).json({ message: 'Server error during export' });
    }
};

