// Auditor Dashboard JavaScript - Full jQuery Implementation

let currentUser = null;
let orders = [];
let products = [];
let auditLog = [];

// Check if user is logged in
$(window).on('load', function() {
    const userData = sessionStorage.getItem('currentUser');
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = JSON.parse(userData);
    if (currentUser.role !== 'auditor' && currentUser.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
    
    waitForDataReady(function() {
        initializeData();
        loadAuditorDashboard();
        
        // Refresh data every 5 seconds for real-time updates
        setInterval(refreshAllFromStorage, 5000);
        
        // Listen for storage events from other tabs
        window.addEventListener('storage', function(e) {
            if (e.key === 'orders' || e.key === 'products' || e.key === 'auditLog') {
                refreshAllFromStorage();
            }
        });
    });
});

// Wait until dbReady flag or localStorage has orders/products
function waitForDataReady(cb, attempts = 0) {
    if (window.dbReady || localStorage.getItem('orders') !== null || localStorage.getItem('products') !== null || attempts > 30) {
        cb();
    } else {
        setTimeout(() => waitForDataReady(cb, attempts + 1), 200);
    }
}

// Initialize Data
function initializeData() {
    const savedOrders = localStorage.getItem('orders');
    if (savedOrders) {
        orders = JSON.parse(savedOrders);
    }

    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
        products = JSON.parse(savedProducts);
    }
    
    const savedAuditLog = localStorage.getItem('auditLog');
    if (savedAuditLog) {
        auditLog = JSON.parse(savedAuditLog);
    } else {
        auditLog = [];
    }
    
    console.log('✓ Auditor data loaded:');
    console.log('  - Orders:', orders.length);
    console.log('  - Products:', products.length);
    console.log('  - Audit Logs:', auditLog.length);
}

// Refresh data from localStorage
function refreshAllFromStorage() {
    const savedOrders = localStorage.getItem('orders');
    if (savedOrders) {
        orders = JSON.parse(savedOrders);
    }

    const savedProducts = localStorage.getItem('products');
    if (savedProducts) {
        products = JSON.parse(savedProducts);
    }
    
    const savedAuditLog = localStorage.getItem('auditLog');
    if (savedAuditLog) {
        auditLog = JSON.parse(savedAuditLog);
    }
    
    // Update current screen if it's the analytics view
    if ($('#salesAnalytics').hasClass('active')) {
        loadSalesAnalytics();
    }
}

// Screen Management
function showSection(sectionId) {
    $('.screen').removeClass('active');
    $('#' + sectionId).addClass('active');

    switch(sectionId) {
        case 'salesAnalytics':
            loadSalesAnalytics();
            break;
    }
}

function loadAuditorDashboard() {
    $('#auditorName').text(currentUser.name);
}

// Daily Report
function generateDailyReport() {
    console.log('generateDailyReport() called');
    
    const reportDate = $('#dailyReportDate').val();
    const output = $('#dailyReportOutput');
    
    console.log('Report date:', reportDate);
    console.log('Orders available:', orders.length);
    console.log('Output element:', output.length > 0 ? 'found' : 'not found');
    
    if (!reportDate) {
        showToast('Please select a date', 'warning');
        return;
    }

    const filteredOrders = orders.filter(o => {
        if (!o.date) {
            console.warn('Order missing date:', o);
            return false;
        }
        const orderDate = new Date(o.date).toDateString();
        const selectedDate = new Date(reportDate).toDateString();
        return orderDate === selectedDate;
    });

    console.log('Filtered orders:', filteredOrders.length);

    if (filteredOrders.length === 0) {
        output.html('<p style="text-align:center; padding:40px; color:#6b7280;">No transactions found for this date</p>');
        showToast('No transactions found for this date', 'info');
        return;
    }

    // Group by payment method
    const paymentBreakdown = {};
    filteredOrders.forEach(order => {
        const method = order.paymentMethod || 'cash';
        if (!paymentBreakdown[method]) {
            paymentBreakdown[method] = { count: 0, total: 0 };
        }
        paymentBreakdown[method].count++;
        paymentBreakdown[method].total += order.total || 0;
    });

    console.log('Payment breakdown:', paymentBreakdown);

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrder = Math.round(totalRevenue / filteredOrders.length);

    const reportHTML = `
        <h3>DAILY SALES REPORT</h3>
        <p style="color:var(--text-secondary); margin-bottom:20px;">Date: ${new Date(reportDate).toLocaleDateString()}</p>
        
        <div class="stats-grid" style="margin-bottom:20px;">
            <div class="stat-card">
                <i class="fas fa-shopping-bag"></i>
                <h4>Total Orders</h4>
                <p>${filteredOrders.length}</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-dollar-sign"></i>
                <h4>Total Revenue</h4>
                <p>MWK ${totalRevenue.toLocaleString()}</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-chart-line"></i>
                <h4>Avg Order</h4>
                <p>MWK ${avgOrder.toLocaleString()}</p>
            </div>
        </div>

        <h4 style="margin-bottom:10px;">Payment Method Breakdown</h4>
        <table class="report-table" style="margin-bottom:20px;">
            <thead>
                <tr>
                    <th>Method</th>
                    <th>Orders</th>
                    <th>Total Amount</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(paymentBreakdown).map(([method, data]) => {
                    return `
                        <tr>
                            <td style="text-transform:capitalize;">${method}</td>
                            <td>${data.count}</td>
                            <td>MWK ${data.total.toLocaleString()}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>

        <h4 style="margin-bottom:10px;">Transaction Details</h4>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Time</th>
                    <th>Customer/Staff</th>
                    <th>Amount</th>
                    <th>Payment</th>
                </tr>
            </thead>
            <tbody>
                ${filteredOrders.map(order => {
                    return `
                        <tr>
                            <td>${order.id}</td>
                            <td>${new Date(order.date).toLocaleTimeString()}</td>
                            <td>${order.customerName || order.staffName || 'N/A'}</td>
                            <td>MWK ${(order.total || 0).toLocaleString()}</td>
                            <td style="text-transform:capitalize;">${order.paymentMethod || 'cash'}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>

        <div class="export-buttons">
            <button class="btn btn-primary" onclick="previewDailyReport()">
                <i class="fas fa-eye"></i> Preview Report
            </button>
            <button class="btn btn-export-pdf" onclick="exportDailyReport()">
                <i class="fas fa-file-pdf"></i> Download PDF
            </button>
            <button class="btn btn-export-excel" onclick="exportDailyReportExcel()">
                <i class="fas fa-file-excel"></i> Export to Excel
            </button>
        </div>
    `;
    
    console.log('Setting report HTML...');
    output.html(reportHTML);
    console.log('Report generated successfully');
    
    showToast('✓ Daily report generated successfully', 'success');
}

function previewDailyReport() {
    const output = $('#dailyReportOutput');
    if (!output.length || output.html().trim() === '') {
        showToast('Please generate a report first', 'warning');
        return;
    }
        
    // Show modal with report preview
    const modal = $('#reportPreviewModal');
    const previewContent = $('#reportPreviewContent');
        
    // Copy report content to preview
    previewContent.html(output.html());
    modal.show();
        
    showToast('Report preview loaded', 'success');
}

function closeReportPreview() {
    $('#reportPreviewModal').hide();
}

function exportDailyReportFromPreview() {
    exportDailyReport();
}

function exportDailyReport() {
    const output = $('#dailyReportOutput');
    if (!output.length || output.html().trim() === '') {
        showToast('Please generate a report first', 'warning');
        return;
    }

    // Show loading message
    showToast('Generating PDF...', 'info');
        
    // Create a clean clone for PDF
    const element = output.clone()[0];
        
    // Remove buttons and interactive elements
    const buttons = element.querySelectorAll('button');
    buttons.forEach(btn => btn.remove());
        
    // Add proper styling for PDF
    element.style.padding = '20px';
    element.style.fontFamily = 'Arial, sans-serif';
    element.style.fontSize = '12px';
    element.style.color = '#000';
        
    // Try alternative PDF generation method
    try {
        // Method 1: Try html2pdf first
        if (typeof html2pdf !== 'undefined') {
            const opt = {
                margin: 10,
                filename: 'daily-report-' + new Date().toISOString().split('T')[0] + '.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    allowTaint: true
                },
                jsPDF: { 
                    orientation: 'portrait', 
                    unit: 'mm', 
                    format: 'a4',
                    compress: true
                }
            };
                
            html2pdf().set(opt).from(element).save()
                .then(() => {
                    showToast('✓ Daily report exported to PDF successfully', 'success');
                })
                .catch((error) => {
                    console.error('html2pdf error:', error);
                    // Fallback to window.print method
                    fallbackPrintMethod(element);
                });
        } else {
            // Fallback if html2pdf is not available
            fallbackPrintMethod(element);
        }
    } catch (error) {
        console.error('PDF generation error:', error);
        fallbackPrintMethod(element);
    }
}

function fallbackPrintMethod(element) {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
        
    if (printWindow) {
        // Create HTML content for printing
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Daily Sales Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    h3 { color: #333; }
                    .stat-card { background: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 5px; }
                </style>
            </head>
            <body>
                ${element.innerHTML}
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(() => window.close(), 100);
                    }
                </script>
            </body>
            </html>
        `;
            
        printWindow.document.write(printContent);
        printWindow.document.close();
            
        showToast('✓ Report opened in new window - use Ctrl+P to save as PDF', 'success');
    } else {
        // Final fallback - create downloadable text file
        createTextReport();
    }
}

function createTextReport() {
    const reportDate = $('#dailyReportDate').val();
    const filteredOrders = orders.filter(o => {
        const orderDate = new Date(o.date).toDateString();
        const selectedDate = new Date(reportDate).toDateString();
        return orderDate === selectedDate;
    });

    let textContent = 'DAILY SALES REPORT\n';
    textContent += '==================\n\n';
    textContent += 'Date: ' + new Date(reportDate).toLocaleDateString() + '\n\n';
    textContent += 'SUMMARY:\n';
    textContent += '--------\n';
    textContent += 'Total Orders: ' + filteredOrders.length + '\n';
    textContent += 'Total Revenue: MWK ' + filteredOrders.reduce((sum, o) => sum + o.total, 0).toLocaleString() + '\n';
    textContent += 'Average Order: MWK ' + Math.round(filteredOrders.reduce((sum, o) => sum + o.total, 0) / filteredOrders.length).toLocaleString() + '\n\n';
        
    textContent += 'TRANSACTIONS:\n';
    textContent += '-------------\n';
    filteredOrders.forEach(order => {
        textContent += 'Order ID: ' + order.id + '\n';
        textContent += 'Customer: ' + (order.customerName || 'N/A') + '\n';
        textContent += 'Staff: ' + (order.staffName || 'N/A') + '\n';
        textContent += 'Time: ' + new Date(order.date).toLocaleTimeString() + '\n';
        textContent += 'Amount: MWK ' + order.total.toLocaleString() + '\n';
        textContent += 'Payment: ' + (order.paymentMethod || 'cash') + '\n';
        textContent += '---\n';
    });

    // Create and download text file
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'daily-report-' + new Date().toISOString().split('T')[0] + '.txt');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
        
    showToast('✓ Report downloaded as text file', 'success');
}

function exportDailyReportExcel() {
    const output = $('#dailyReportOutput');
    if (!output.length || output.html().trim() === '') {
        showToast('Please generate a report first', 'warning');
        return;
    }

    // Extract data from the report
    const reportDate = $('#dailyReportDate').val();
    const filteredOrders = orders.filter(o => {
        const orderDate = new Date(o.date).toDateString();
        const selectedDate = new Date(reportDate).toDateString();
        return orderDate === selectedDate;
    });

    // Create CSV content
    let csvContent = 'DAILY SALES REPORT\n';
    csvContent += 'Date,' + new Date(reportDate).toLocaleDateString() + '\n\n';
    csvContent += 'SUMMARY\n';
    csvContent += 'Total Orders,' + filteredOrders.length + '\n';
    csvContent += 'Total Revenue,MWK ' + filteredOrders.reduce((sum, o) => sum + o.total, 0).toLocaleString() + '\n';
    csvContent += 'Average Order,MWK ' + Math.round(filteredOrders.reduce((sum, o) => sum + o.total, 0) / filteredOrders.length).toLocaleString() + '\n\n';
    
    csvContent += 'TRANSACTIONS\n';
    csvContent += 'Order ID,Customer,Staff,Time,Amount,Payment Method\n';
    
    filteredOrders.forEach(order => {
        csvContent += order.id + ',';
        csvContent += (order.customerName || 'N/A') + ',';
        csvContent += (order.staffName || 'N/A') + ',';
        csvContent += new Date(order.date).toLocaleTimeString() + ',';
        csvContent += 'MWK ' + order.total.toLocaleString() + ',';
        csvContent += (order.paymentMethod || 'cash') + '\n';
    });

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'daily-report-' + new Date().toISOString().split('T')[0] + '.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('✓ Daily report exported to Excel successfully', 'success');
}

// Sales Analytics
function loadSalesAnalytics() {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrdersCount = orders.length;
    
    // Count unique customers (simplified)
    const uniqueCustomers = new Set(orders.map(o => o.customerId || o.customerName)).size;

    $('#totalRevenue').text(`MWK ${totalRevenue.toLocaleString()}`);
    $('#totalOrdersCount').text(totalOrdersCount);
    $('#totalCustomers').text(uniqueCustomers);

    // Calculate sales by category
    const categoryBreakdown = {};
    orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                const category = product ? product.category : 'other';
                
                if (!categoryBreakdown[category]) {
                    categoryBreakdown[category] = 0;
                }
                categoryBreakdown[category] += (item.price || 0) * (item.quantity || 1);
            });
        }
    });

    const chartDiv = document.getElementById('analyticsChart');
    if (chartDiv) {
        chartDiv.innerHTML = `
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Sales Amount</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(categoryBreakdown).map(([category, amount]) => {
                        const percentage = totalRevenue > 0 ? ((amount / totalRevenue) * 100).toFixed(1) : 0;
                        return `
                            <tr>
                                <td style="text-transform:capitalize;">${category}</td>
                                <td>MWK ${amount.toLocaleString()}</td>
                                <td>
                                    <div style="display:flex; align-items:center; gap:10px;">
                                        <div style="flex:1; background:#e5e7eb; height:8px; border-radius:4px;">
                                            <div style="width:${percentage}%; background:var(--primary-color); height:100%; border-radius:4px;"></div>
                                        </div>
                                        <span>${percentage}%</span>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>

            <div style="margin-top:30px;">
                <h4 style="margin-bottom:15px;">Top Selling Products</h4>
                ${getTopProducts()}
            </div>

            <div style="margin-top:30px;">
                <h4 style="margin-bottom:15px;">Sales Trends</h4>
                ${getSalesTrends()}
            </div>
        `;
    }
}

function getTopProducts() {
    const productSales = {};
    
    orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                const productId = item.productId || item.id;
                if (!productSales[productId]) {
                    productSales[productId] = {
                        name: item.name || item.productName || 'Unknown Product',
                        quantity: 0,
                        revenue: 0
                    };
                }
                productSales[productId].quantity += (item.quantity || 1);
                productSales[productId].revenue += (item.price || 0) * (item.quantity || 1);
            });
        }
    });

    const sorted = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    return `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Units Sold</th>
                    <th>Revenue</th>
                </tr>
            </thead>
            <tbody>
                ${sorted.map(product => {
                    return `
                        <tr>
                            <td>${product.name}</td>
                            <td>${product.quantity}</td>
                            <td>MWK ${product.revenue.toLocaleString()}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function getSalesTrends() {
    // Group sales by date (last 7 days)
    const last7Days = {};
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString();
        last7Days[dateStr] = 0;
    }

    orders.forEach(order => {
        if (order.date) {
            const orderDate = new Date(order.date).toLocaleDateString();
            if (last7Days.hasOwnProperty(orderDate)) {
                last7Days[orderDate] += (order.total || 0);
            }
        }
    });

    const maxValue = Math.max(...Object.values(last7Days), 1); // Avoid division by zero

    return `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Sales</th>
                    <th>Trend</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(last7Days).map(([date, amount]) => {
                    const barWidth = (amount / maxValue) * 100;
                    return `
                        <tr>
                            <td>${date}</td>
                            <td>MWK ${amount.toLocaleString()}</td>
                            <td>
                                <div style="background:#e5e7eb; height:8px; border-radius:4px;">
                                    <div style="width:${barWidth}%; background:var(--success-color); height:100%; border-radius:4px;"></div>
                                </div>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

// Audit Trail
function generateAuditTrail() {
    console.log('generateAuditTrail() called');
    
    const filter = $('#auditFilter').val();
    const startDate = $('#auditStartDate').val();
    const endDate = $('#auditEndDate').val();
    const output = $('#auditTrailOutput');

    // Create comprehensive audit log from all data sources
    let auditActivities = createComprehensiveAuditLog();
    
    console.log('Total audit activities:', auditActivities.length);
    console.log('Filter:', filter, 'Start:', startDate, 'End:', endDate);

    // Filter by activity type
    if (filter && filter !== 'all') {
        auditActivities = auditActivities.filter(activity => {
            return activity.type.toLowerCase().includes(filter.toLowerCase());
        });
    }

    // Filter by date range
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        end.setHours(23, 59, 59, 999);

        auditActivities = auditActivities.filter(activity => {
            const activityDate = new Date(activity.timestamp);
            return activityDate >= start && activityDate <= end;
        });
    }

    // Sort by timestamp (newest first)
    auditActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    console.log('Filtered audit activities:', auditActivities.length);

    if (auditActivities.length === 0) {
        output.html('<p style="text-align:center; padding:40px; color:#6b7280;">No activities found for the selected criteria</p>');
        showToast('No activities found', 'info');
        return;
    }

    // Group activities by date
    const groupedActivities = {};
    auditActivities.forEach(activity => {
        const date = new Date(activity.timestamp).toLocaleDateString();
        if (!groupedActivities[date]) {
            groupedActivities[date] = [];
        }
        groupedActivities[date].push(activity);
    });

    let auditHTML = `
        <h3>AUDIT TRAIL REPORT</h3>
        <p style="color:var(--text-secondary); margin-bottom:20px;">
            ${auditActivities.length} activit(y/ies) found
        </p>
        
        <div class="audit-summary" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:15px; margin-bottom:20px;">
            <div class="stat-card">
                <i class="fas fa-shopping-cart"></i>
                <h4>Sales</h4>
                <p>${auditActivities.filter(a => a.type === 'Sale').length}</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-box"></i>
                <h4>Inventory</h4>
                <p>${auditActivities.filter(a => a.type === 'Inventory').length}</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-users"></i>
                <h4>User Activity</h4>
                <p>${auditActivities.filter(a => a.type === 'User').length}</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-cog"></i>
                <h4>System</h4>
                <p>${auditActivities.filter(a => a.type === 'System').length}</p>
            </div>
        </div>

        <table class="report-table">
            <thead>
                <tr>
                    <th>Date & Time</th>
                    <th>Type</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Details</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;

    Object.entries(groupedActivities).forEach(([date, activities]) => {
        activities.forEach((activity, index) => {
            auditHTML += getAuditTrailRow(activity, index === 0 ? date : '');
        });
    });

    auditHTML += `
            </tbody>
        </table>
        
        <div class="export-buttons" style="margin-top:20px;">
            <button class="btn btn-export-pdf" onclick="exportAuditTrail()">
                <i class="fas fa-file-pdf"></i> Export Audit Trail
            </button>
            <button class="btn btn-export-excel" onclick="exportAuditTrailExcel()">
                <i class="fas fa-file-excel"></i> Export to Excel
            </button>
        </div>
    `;

    output.html(auditHTML);
    showToast('✓ Audit trail generated successfully', 'success');
}

function createComprehensiveAuditLog() {
    let auditActivities = [];

    // 1. Add sales/transactions from orders
    orders.forEach(order => {
        auditActivities.push({
            timestamp: order.date,
            type: 'Sale',
            user: order.staffName || 'Unknown Staff',
            action: 'Transaction',
            details: `Order #${order.id} - ${order.customerName || 'Walk-in Customer'} - MWK ${(order.total || 0).toLocaleString()}`,
            status: order.status || 'completed',
            orderId: order.id
        });
    });

    // 2. Add inventory changes (simulate from products)
    products.forEach(product => {
        if (product.lastUpdated) {
            auditActivities.push({
                timestamp: product.lastUpdated,
                type: 'Inventory',
                user: product.updatedBy || 'System',
                action: 'Stock Update',
                details: `${product.name} - Stock: ${product.stock || 0} units - MWK ${(product.price || 0).toLocaleString()}`,
                status: 'updated',
                productId: product.id
            });
        }
    });

    // 3. Add user login activities (simulate from current user)
    if (currentUser) {
        auditActivities.push({
            timestamp: new Date().toISOString(),
            type: 'User',
            user: currentUser.name,
            action: 'Login',
            details: `${currentUser.role} logged into auditor dashboard`,
            status: 'success'
        });
    }

    // 4. Add system activities
    auditActivities.push({
        timestamp: new Date().toISOString(),
        type: 'System',
        user: 'System',
        action: 'Report Generated',
        details: 'Audit trail report generated',
        status: 'completed'
    });

    // 5. Add sample activities for demonstration if no data exists
    if (auditActivities.length < 3) {
        const sampleActivities = [
            {
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                type: 'Sale',
                user: 'Alice Johnson',
                action: 'Transaction',
                details: 'Order #1001 - John Doe - MWK 45,000',
                status: 'completed'
            },
            {
                timestamp: new Date(Date.now() - 7200000).toISOString(),
                type: 'Inventory',
                user: 'Bob Wilson',
                action: 'Stock Update',
                details: 'Cement 50kg - Stock updated to 200 units',
                status: 'updated'
            },
            {
                timestamp: new Date(Date.now() - 10800000).toISOString(),
                type: 'User',
                user: 'Manager',
                action: 'Login',
                details: 'Manager logged into dashboard',
                status: 'success'
            }
        ];
        auditActivities = [...sampleActivities, ...auditActivities];
    }

    return auditActivities;
}

function getAuditTrailRow(activity, showDate) {
    const typeColors = {
        'Sale': '#10b981',
        'Inventory': '#f59e0b',
        'User': '#3b82f6',
        'System': '#8b5cf6'
    };

    const statusColors = {
        'completed': '#10b981',
        'success': '#10b981',
        'updated': '#f59e0b',
        'pending': '#f59e0b',
        'failed': '#ef4444',
        'error': '#ef4444'
    };

    const typeColor = typeColors[activity.type] || '#6b7280';
    const statusColor = statusColors[activity.status] || '#6b7280';

    return `
        <tr>
            <td>
                ${showDate ? `<div style="font-weight:bold; color:#374151;">${showDate}</div>` : ''}
                <div style="font-size:0.85em; color:#6b7280;">${new Date(activity.timestamp).toLocaleTimeString()}</div>
            </td>
            <td>
                <span style="background:${typeColor}20; color:${typeColor}; padding:2px 8px; border-radius:12px; font-size:0.8em; font-weight:500;">
                    ${activity.type}
                </span>
            </td>
            <td>${activity.user}</td>
            <td>${activity.action}</td>
            <td style="max-width:300px;">${activity.details}</td>
            <td>
                <span style="background:${statusColor}20; color:${statusColor}; padding:2px 8px; border-radius:12px; font-size:0.8em; font-weight:500;">
                    ${activity.status}
                </span>
            </td>
        </tr>
    `;
}

function exportAuditTrail() {
    const output = $('#auditTrailOutput');
    if (!output.length || output.html().trim() === '') {
        showToast('Generate audit trail first', 'warning');
        return;
    }

    // Get the text content from the report
    const auditText = output.text();
    
    // Create a blob and download as text file
    const blob = new Blob([auditText], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'audit-trail-' + new Date().toISOString().split('T')[0] + '.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    showToast('✓ Audit trail exported successfully', 'success');
}

function exportAuditTrailExcel() {
    const output = $('#auditTrailOutput');
    if (!output.length || output.html().trim() === '') {
        showToast('Generate audit trail first', 'warning');
        return;
    }

    // Create comprehensive audit log for export
    let auditActivities = createComprehensiveAuditLog();
    
    // Apply same filters as current view
    const filter = $('#auditFilter').val();
    const startDate = $('#auditStartDate').val();
    const endDate = $('#auditEndDate').val();
    
    if (filter && filter !== 'all') {
        auditActivities = auditActivities.filter(activity => {
            return activity.type.toLowerCase().includes(filter.toLowerCase());
        });
    }
    
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        end.setHours(23, 59, 59, 999);

        auditActivities = auditActivities.filter(activity => {
            const activityDate = new Date(activity.timestamp);
            return activityDate >= start && activityDate <= end;
        });
    }
    
    auditActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Create CSV content
    let csvContent = 'AUDIT TRAIL REPORT\n';
    csvContent += 'Generated,' + new Date().toLocaleString() + '\n';
    if (startDate && endDate) {
        csvContent += 'Period,' + new Date(startDate).toLocaleDateString() + ' to ' + new Date(endDate).toLocaleDateString() + '\n';
    }
    csvContent += 'Total Activities,' + auditActivities.length + '\n\n';
    
    csvContent += 'SUMMARY\n';
    csvContent += 'Type,Count\n';
    const summary = {};
    auditActivities.forEach(activity => {
        summary[activity.type] = (summary[activity.type] || 0) + 1;
    });
    Object.entries(summary).forEach(([type, count]) => {
        csvContent += type + ',' + count + '\n';
    });
    
    csvContent += '\nDETAILED ACTIVITIES\n';
    csvContent += 'Date,Time,Type,User,Action,Details,Status\n';
    
    auditActivities.forEach(activity => {
        const date = new Date(activity.timestamp);
        csvContent += date.toLocaleDateString() + ',';
        csvContent += date.toLocaleTimeString() + ',';
        csvContent += activity.type + ',';
        csvContent += activity.user + ',';
        csvContent += activity.action + ',';
        csvContent += '"' + activity.details + '",'; // Quote details to handle commas
        csvContent += activity.status + '\n';
    });

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'audit-trail-' + new Date().toISOString().split('T')[0] + '.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('✓ Audit trail exported to Excel successfully', 'success');
}

// Set default date to today
$(window).on('load', function() {
    const today = new Date().toISOString().split('T')[0];
    if ($('#dailyReportDate').length) {
        $('#dailyReportDate').val(today);
    }
    if ($('#auditStartDate').length) {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        $('#auditStartDate').val(weekAgo.toISOString().split('T')[0]);
        $('#auditEndDate').val(today);
    }
});

function logout() {
    sessionStorage.removeItem('currentUser');
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

function showToast(message, type = 'success') {
    const toast = $('#toast');
    if (toast.length) {
        toast.text(message)
            .removeClass('success error warning info')
            .addClass(type)
            .addClass('show');
        
        setTimeout(() => {
            toast.removeClass('show');
        }, 3000);
    }
}