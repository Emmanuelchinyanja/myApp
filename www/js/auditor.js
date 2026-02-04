// Auditor Dashboard JavaScript - Full jQuery Implementation

let currentUser = null;
let orders = [];
let products = [];

// Check if user is logged in
$(window).on('load', function() {
    const userData = sessionStorage.getItem('currentUser');
    if (!userData) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = JSON.parse(userData);
    if (currentUser.role !== 'auditor') {
        window.location.href = 'index.html';
        return;
    }
    
    initializeData();
    loadAuditorDashboard();
});

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
    const reportDate = $('#dailyReportDate').val();
    const output = $('#dailyReportOutput');
    
    if (!reportDate) {
        showToast('Please select a date', 'warning');
        return;
    }

    const filteredOrders = orders.filter(o => {
        const orderDate = new Date(o.date).toDateString();
        const selectedDate = new Date(reportDate).toDateString();
        return orderDate === selectedDate;
    });

    if (filteredOrders.length === 0) {
        output.html('<p style="text-align:center; padding:40px; color:#6b7280;">No transactions found for this date</p>');
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
        paymentBreakdown[method].total += order.total;
    });

    output.innerHTML = `
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
                <p>MWK ${filteredOrders.reduce((sum, o) => sum + o.total, 0).toLocaleString()}</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-chart-line"></i>
                <h4>Avg Order</h4>
                <p>MWK ${Math.round(filteredOrders.reduce((sum, o) => sum + o.total, 0) / filteredOrders.length).toLocaleString()}</p>
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
                ${Object.entries(paymentBreakdown).map(([method, data]) => `
                    <tr>
                        <td style="text-transform:capitalize;">${method}</td>
                        <td>${data.count}</td>
                        <td>MWK ${data.total.toLocaleString()}</td>
                    </tr>
                `).join('')}
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
                ${filteredOrders.map(order => `
                    <tr>
                        <td>${order.id}</td>
                        <td>${new Date(order.date).toLocaleTimeString()}</td>
                        <td>${order.customerName || order.staffName || 'N/A'}</td>
                        <td>MWK ${order.total.toLocaleString()}</td>
                        <td style="text-transform:capitalize;">${order.paymentMethod || 'cash'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <button class="btn btn-primary" style="margin-top:20px;" onclick="exportDailyReport()">
            <i class="fas fa-download"></i> Export to PDF
        </button>
    `;
}

function exportDailyReport() {
    const output = $('#dailyReportOutput');
    if (!output.length || output.html().trim() === '') {
        showToast('Generate report first', 'warning');
        return;
    }

    const element = output.clone()[0];
    const opt = {
        margin: 10,
        filename: 'daily-report-' + new Date().toISOString().split('T')[0] + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };
    
    html2pdf().set(opt).from(element).save();
    showToast('Daily report exported to PDF', 'success');
}

// Sales Analytics
function loadSalesAnalytics() {
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrdersCount = orders.length;
    
    // Count unique customers (simplified)
    const uniqueCustomers = new Set(orders.map(o => o.customerId || o.customerName)).size;

    $('#totalRevenue').text(`MWK ${totalRevenue.toLocaleString()}`);
    $('#totalOrdersCount').text(totalOrdersCount);
    $('#totalCustomers').text(uniqueCustomers);

    // Calculate sales by category
    const categoryBreakdown = {};
    orders.forEach(order => {
        order.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            const category = product ? product.category : 'other';
            
            if (!categoryBreakdown[category]) {
                categoryBreakdown[category] = 0;
            }
            categoryBreakdown[category] += item.price * item.quantity;
        });
    });

    const chartDiv = document.getElementById('analyticsChart');
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
                    const percentage = ((amount / totalRevenue) * 100).toFixed(1);
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

function getTopProducts() {
    const productSales = {};
    
    orders.forEach(order => {
        order.items.forEach(item => {
            if (!productSales[item.productId]) {
                productSales[item.productId] = {
                    name: item.name,
                    quantity: 0,
                    revenue: 0
                };
            }
            productSales[item.productId].quantity += item.quantity;
            productSales[item.productId].revenue += item.price * item.quantity;
        });
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
                ${sorted.map(product => `
                    <tr>
                        <td>${product.name}</td>
                        <td>${product.quantity}</td>
                        <td>MWK ${product.revenue.toLocaleString()}</td>
                    </tr>
                `).join('')}
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
        const orderDate = new Date(order.date).toLocaleDateString();
        if (last7Days.hasOwnProperty(orderDate)) {
            last7Days[orderDate] += order.total;
        }
    });

    const maxValue = Math.max(...Object.values(last7Days));

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
                    const barWidth = maxValue > 0 ? (amount / maxValue) * 100 : 0;
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
    const filter = $('#auditFilter').val();
    const startDate = $('#auditStartDate').val();
    const endDate = $('#auditEndDate').val();
    const output = $('#auditTrailOutput');

    let filteredOrders = [...orders];

    console.log('Total orders available:', filteredOrders.length);
    console.log('Start date:', startDate, 'End date:', endDate);

    // Filter by date range - FIX: Add 1 day to endDate to include the entire end date
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1); // Include entire end date
        end.setHours(23, 59, 59, 999); // Include until end of day

        console.log('Filtering from', start, 'to', end);

        filteredOrders = filteredOrders.filter(o => {
            if (!o.date) {
                console.warn('Order missing date:', o);
                return false;
            }
            const orderDate = new Date(o.date);
            const isInRange = orderDate >= start && orderDate <= end;
            
            if (!isInRange) {
                console.log('Order date out of range:', orderDate);
            }
            return isInRange;
        });
    }

    console.log('Filtered orders count:', filteredOrders.length);

    // Further filter by text input (customer name, order ID, etc.)
    if (filter) {
        const lowerFilter = filter.toLowerCase();
        filteredOrders = filteredOrders.filter(o => {
            return (
                (o.customerName && o.customerName.toLowerCase().includes(lowerFilter)) ||
                (o.staffName && o.staffName.toLowerCase().includes(lowerFilter)) ||
                (o.id && o.id.toString().includes(lowerFilter))
            );
        });
    }

    output.html(`
        <h3>AUDIT TRAIL REPORT</h3>
        <p style="color:var(--text-secondary); margin-bottom:20px;">
            ${filteredOrders.length} transaction(s) found
        </p>
        
        <table class="report-table">
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Staff</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                </tr>
            </thead>
            <tbody>
                ${filteredOrders.map(order => `
                    <tr>
                        <td>${order.id}</td>
                        <td>${order.customerName || 'N/A'}</td>
                        <td>${order.staffName || 'N/A'}</td>
                        <td>${new Date(order.date).toLocaleString()}</td>
                        <td>MWK ${order.total.toLocaleString()}</td>
                        <td style="text-transform:capitalize;">${order.paymentMethod || 'cash'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
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