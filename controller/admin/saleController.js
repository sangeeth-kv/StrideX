const orderSchema=require("../../model/orderModel")
const couponController=require("../../model/coupenModel")
const moment = require("moment");
const PDFDocument = require("pdfkit"); // For PDF generation
const ExcelJS = require("exceljs");
const saleController={
    loadSaleReport:async (req,res) => {
        try {
            try {
                let { day, startDate, endDate } = req.query;
                console.log("daya",day)

                let filter = {};
        
                if (day) {
                    const today = moment().startOf("day");
                    switch (day) {
                        case "salesToday":
                            filter.orderDate = { $gte: today.toDate(), $lte: moment(today).endOf("day").toDate() };
                            break;
                        case "salesWeekly":
                            filter.orderDate = { $gte: moment().subtract(7, "days").toDate() };
                            break;
                        case "salesMonthly":
                            filter.orderDate = { $gte: moment().subtract(1, "months").toDate() };
                            break;
                        case "salesYearly":
                            filter.orderDate = { $gte: moment().subtract(1, "years").toDate() };
                            break;
                    }
                }
        
                if (startDate && endDate) {
                    filter.orderDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
                }
        
                const salesData = await orderSchema.find(filter)
    .populate("userId", "name")
    .populate("items.productId", "name price") // ✅ Ensure products are populated
    .populate("couponId", "offerPrice")
    .populate("address").lean();


        
                // Calculate Sales Metrics
                let overallSalesCount = salesData.length;
                let overallOrderAmount = salesData.reduce((sum, order) => sum + order.total, 0);
                let overallDiscount = salesData.reduce((sum, order) => sum + (order.couponId?.offerPrice || 0), 0);
                // console.log(JSON.stringify(salesData, null, 2));

                console.log("there are sale data : ====>>",salesData)
        
                res.render("admin/salesreport", {
                    data: salesData,
                    overallSalesCount,
                    overallOrderAmount,
                    overallDiscount,
                    selectedDay: day,
                    startDate,
                    endDate,
                });
            } catch (err) {
                console.error(err);
                res.status(500).send("Server Error");
            }
        } catch (error) {
           console.log(error) 
        }
    },
    generatePDF:async (req,res) => {
        try {
            const salesData = req.body;
        const doc = new PDFDocument();
        res.setHeader("Content-Disposition", "attachment; filename=sales_report.pdf");
        res.setHeader("Content-Type", "application/pdf");

        doc.pipe(res);
        doc.fontSize(16).text("Sales Report", { align: "center" }).moveDown();

        salesData.forEach((sale) => {
            doc.fontSize(12).text(`Order ID: ${sale.orderId}`);
            doc.text(`Customer: ${sale.name}`);
            doc.text(`Date: ${sale.date}`);
            doc.text(`Total Amount: ${sale.totalAmount}`);
            doc.text(`Payment Method : ${sale.paymentMethod}`)
            doc.moveDown();
        });

        doc.fontSize(14).text(`Grand Total: ${salesData.reduce((sum, sale) => sum + sale.totalAmount, 0)}`, { align: "right" });
        doc.end();
        } catch (error) {
            console.log(error)
        }
    },generateExecl:async (req,res) => {
        try {
            const salesData = req.body;
            console.log("sale data of req body : ",req.body)
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Sales Report");

        worksheet.columns = [
            { header: "Order ID", key: "orderId", width: 20 },
            { header: "Customer Name", key: "name", width: 20 },
            { header: "Date", key: "date", width: 15 },
            { header: "Total Amount", key: "totalAmount", width: 15 },
            { header: "Payment Method", key: "paymentMethod", width: 15 },
        ];

        salesData.forEach((sale) => {
            worksheet.addRow(sale);
        });

        worksheet.addRow(["Grand Total", "", "", salesData.reduce((sum, sale) => sum + sale.totalAmount, 0), ""]);

        res.setHeader("Content-Disposition", "attachment; filename=sales_report.xlsx");
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        await workbook.xlsx.write(res);
        res.end();
        } catch (error) {
            console.log(error)
        }
    }
}

module.exports=saleController