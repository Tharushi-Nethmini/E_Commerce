// ────────────────────────── PRODUCTS PDF ──────────────────────────

export async function downloadProductsPDF({ products, generatedAt }) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Brand header
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, pageW, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('NexMart', 14, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Products Report', 14, 22);
  const dateStr = generatedAt.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });
  doc.text(`Generated: ${dateStr}`, pageW - 14, 22, { align: 'right' });

  let y = 40;

  // KPI summary (like analytics)
  const totalProducts = products.length;
  const categories = [...new Set(products.map(p => p.category || '-'))];
  const statusCounts = products.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});
  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value']],
    body: [
      ['Total Products', String(totalProducts)],
      ['Categories', categories.join(', ')],
      ['Active', String(statusCounts['ACTIVE'] || 0)],
      ['Pending', String(statusCounts['PENDING'] || 0)],
      ['Rejected', String(statusCounts['REJECTED'] || 0)],
    ],
    headStyles: { fillColor: BRAND, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: STRIPE },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: 14, right: 14 },
    theme: 'grid',
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
  });
  y = doc.lastAutoTable.finalY + 18;

  // Section header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...BRAND);
  doc.text('Products List', 14, y);
  y += 7;

  autoTable(doc, {
    startY: y,
    head: [[
      'Name', 'Description', 'Category', 'Price', 'Stock', 'Supplier', 'Status', 'Rejection Reason'
    ]],
    body: products.map(p => [
      p.name,
      p.description,
      p.category,
      fmt(p.price),
      String(p.stock),
      p.supplier,
      p.status,
      p.rejectionReason
    ]),
    headStyles: { fillColor: BRAND, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: STRIPE },
    styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
    margin: { left: 14, right: 14 },
    theme: 'grid',
    columnStyles: {
      0: { cellWidth: 32 }, // Name
      1: { cellWidth: 48 }, // Description
      2: { cellWidth: 24 }, // Category
      3: { cellWidth: 20 }, // Price
      4: { cellWidth: 16 }, // Stock
      5: { cellWidth: 28 }, // Supplier
      6: { cellWidth: 22 }, // Status
      7: { cellWidth: 36 }, // Rejection Reason
    },
  });

  // Footer
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(
      `NexMart Confidential  ·  Page ${i} of ${pages}`,
      pageW / 2, pageH - 8,
      { align: 'center' }
    );
  }
  doc.save(`NexMart-Products-${generatedAt.toISOString().slice(0, 10)}.pdf`);
}

// ────────────────────────── PRODUCTS EXCEL ──────────────────────────
export async function downloadProductsExcel({ products, generatedAt }) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const dateStr = generatedAt.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });
  const totalProducts = products.length;
  const categories = [...new Set(products.map(p => p.category || '-'))];
  const statusCounts = products.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});
  // KPI summary sheet
  const kpiRows = [
    ['NexMart — Products Report'],
    [`Generated: ${dateStr}`],
    [],
    ['Metric', 'Value'],
    ['Total Products', totalProducts],
    ['Categories', categories.join(', ')],
    ['Active', statusCounts['ACTIVE'] || 0],
    ['Pending', statusCounts['PENDING'] || 0],
    ['Rejected', statusCounts['REJECTED'] || 0],
  ];
  const wsKPI = XLSX.utils.aoa_to_sheet(kpiRows);
  wsKPI['!cols'] = [{ wch: 30 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsKPI, 'KPI Summary');

  // Products table sheet
  const rows = [
    ['Name', 'Description', 'Category', 'Price', 'Stock', 'Supplier', 'Status', 'Rejection Reason'],
    ...products.map(p => [
      p.name,
      p.description,
      p.category,
      Number(p.price),
      p.stock,
      p.supplier,
      p.status,
      p.rejectionReason
    ]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 24 }, // Name
    { wch: 36 }, // Description
    { wch: 16 }, // Category
    { wch: 12 }, // Price
    { wch: 10 }, // Stock
    { wch: 20 }, // Supplier
    { wch: 14 }, // Status
    { wch: 24 }, // Rejection Reason
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Products');
  XLSX.writeFile(wb, `NexMart-Products-${generatedAt.toISOString().slice(0, 10)}.xlsx`);
}
/**
 * NexMart — Report Generator
 * Exports analytics data as PDF (jsPDF + autotable) or Excel (SheetJS).
 * All imports are dynamic so the heavy libraries are only loaded on demand.
 */

const BRAND   = [79, 70, 229]   // #4F46E5
const DANGER  = [239, 68, 68]   // #EF4444
const GRAY    = [107, 114, 128]
const STRIPE  = [245, 247, 255]
const STRIPE_RED = [255, 245, 245]

const fmt = (amount) =>
  'Rs. ' + Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

/* ─────────────────────────── PDF ─────────────────────────── */

export async function downloadPDF({ orderStats, userStats, lowStockProducts, generatedAt }) {
  const { jsPDF }    = await import('jspdf')
  const autoTable    = (await import('jspdf-autotable')).default

  const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  /* ── Brand header ── */
  doc.setFillColor(...BRAND)
  doc.rect(0, 0, pageW, 30, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('NexMart', 14, 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('E-Commerce Analytics Report', 14, 22)
  const dateStr = generatedAt.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })
  doc.text(`Generated: ${dateStr}`, pageW - 14, 22, { align: 'right' })

  let y = 40

  /* ── Section heading helper ── */
  const section = (title) => {
    if (y > pageH - 40) { doc.addPage(); y = 20 }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...BRAND)
    doc.text(title, 14, y)
    doc.setDrawColor(...BRAND)
    doc.setLineWidth(0.3)
    doc.line(14, y + 1.5, pageW - 14, y + 1.5)
    y += 7
  }

  const tableOpts = (head, body, headFill = BRAND, rowStripe = STRIPE) => ({
    startY: y,
    head: [head],
    body,
    headStyles:          { fillColor: headFill, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles:  { fillColor: rowStripe },
    styles:              { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
    margin:              { left: 14, right: 14 },
    theme:               'grid',
  })

  /* ── 1. KPI Summary ── */
  section('1. KPI Summary')
  autoTable(doc, {
    ...tableOpts(
      ['Metric', 'Value'],
      [
        ['Total Orders',       String(orderStats?.totalOrders   ?? 0)],
        ['Orders Today',       String(orderStats?.ordersToday   ?? 0)],
        ['Total Revenue',      fmt(orderStats?.totalRevenue)],
        ['Total Users',        String(userStats?.totalUsers     ?? 0)],
        ['New Users Today',    String(userStats?.newToday       ?? 0)],
        ['Low Stock Products', String(lowStockProducts?.length  ?? 0)],
      ]
    ),
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 80 } },
  })
  y = doc.lastAutoTable.finalY + 10

  /* ── 2. Orders by Status ── */
  section('2. Orders by Status')
  const totalOrders = orderStats?.totalOrders || 1
  if (orderStats?.byStatus && Object.keys(orderStats.byStatus).length > 0) {
    autoTable(doc, tableOpts(
      ['Status', 'Count', 'Percentage'],
      Object.entries(orderStats.byStatus).map(([s, c]) => [
        s, String(c), `${Math.round((c / totalOrders) * 100)}%`
      ])
    ))
    y = doc.lastAutoTable.finalY + 10
  } else {
    doc.setTextColor(...GRAY); doc.setFont('helvetica', 'italic'); doc.setFontSize(9)
    doc.text('No order data available.', 14, y); y += 8
  }

  /* ── 3. Users by Role ── */
  section('3. Users by Role')
  const totalUsers = userStats?.totalUsers || 1
  if (userStats?.byRole && Object.keys(userStats.byRole).length > 0) {
    autoTable(doc, tableOpts(
      ['Role', 'Count', 'Percentage'],
      Object.entries(userStats.byRole).map(([r, c]) => [
        r, String(c), `${Math.round((c / totalUsers) * 100)}%`
      ])
    ))
    y = doc.lastAutoTable.finalY + 10
  } else {
    doc.setTextColor(...GRAY); doc.setFont('helvetica', 'italic'); doc.setFontSize(9)
    doc.text('No user role data available.', 14, y); y += 8
  }

  /* ── 4. Recent Orders ── */
  if (orderStats?.recentOrders?.length > 0) {
    section('4. Recent Orders')
    autoTable(doc, tableOpts(
      ['Order ID', 'User ID', 'Amount', 'Status', 'Date'],
      orderStats.recentOrders.map(o => [
        o._id?.slice(-8)    || '—',
        o.userId?.slice(-8) || '—',
        fmt(o.totalAmount),
        o.status,
        new Date(o.createdAt).toLocaleDateString(),
      ])
    ))
    y = doc.lastAutoTable.finalY + 10
  }

  /* ── 5. Low Stock Products ── */
  if (lowStockProducts?.length > 0) {
    section('5. Low Stock Alert')
    autoTable(doc, {
      ...tableOpts(
        ['Name', 'SKU', 'Category', 'Price', 'Stock', 'Available'],
        lowStockProducts.map(p => [
          p.name, p.sku, p.category,
          fmt(p.price),
          String(p.quantity),
          String(p.quantity - (p.reservedQuantity || 0)),
        ]),
        DANGER, STRIPE_RED
      ),
    })
  }

  /* ── Footer on every page ── */
  const pages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(...GRAY)
    doc.text(
      `NexMart Confidential  ·  Page ${i} of ${pages}`,
      pageW / 2, pageH - 8,
      { align: 'center' }
    )
  }

  doc.save(`NexMart-Report-${generatedAt.toISOString().slice(0, 10)}.pdf`)
}

/* ─────────────────────────── Excel ─────────────────────────── */

export async function downloadExcel({ orderStats, userStats, lowStockProducts, generatedAt }) {
  const XLSX   = await import('xlsx')
  const wb     = XLSX.utils.book_new()
  const dateStr = generatedAt.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })

  /* Sheet 1 — KPI Summary */
  const kpiRows = [
    ['NexMart — Analytics Report'],
    [`Generated: ${dateStr}`],
    [],
    ['Metric', 'Value'],
    ['Total Orders',       orderStats?.totalOrders   ?? 0],
    ['Orders Today',       orderStats?.ordersToday   ?? 0],
    ['Total Revenue (Rs.)', Number(orderStats?.totalRevenue ?? 0)],
    ['Total Users',        userStats?.totalUsers     ?? 0],
    ['New Users Today',    userStats?.newToday       ?? 0],
    ['Low Stock Products', lowStockProducts?.length  ?? 0],
  ]
  const wsKPI = XLSX.utils.aoa_to_sheet(kpiRows)
  wsKPI['!cols'] = [{ wch: 30 }, { wch: 22 }]
  XLSX.utils.book_append_sheet(wb, wsKPI, 'KPI Summary')

  /* Sheet 2 — Orders by Status */
  const totalO = orderStats?.totalOrders || 1
  const statusRows = [
    ['Status', 'Count', 'Percentage'],
    ...Object.entries(orderStats?.byStatus || {}).map(([s, c]) => [
      s, c, `${Math.round((c / totalO) * 100)}%`
    ]),
  ]
  const wsStatus = XLSX.utils.aoa_to_sheet(statusRows)
  wsStatus['!cols'] = [{ wch: 18 }, { wch: 10 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsStatus, 'Orders by Status')

  /* Sheet 3 — Users by Role */
  const totalU = userStats?.totalUsers || 1
  const roleRows = [
    ['Role', 'Count', 'Percentage'],
    ...Object.entries(userStats?.byRole || {}).map(([r, c]) => [
      r, c, `${Math.round((c / totalU) * 100)}%`
    ]),
  ]
  const wsRole = XLSX.utils.aoa_to_sheet(roleRows)
  wsRole['!cols'] = [{ wch: 18 }, { wch: 10 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsRole, 'Users by Role')

  /* Sheet 4 — Recent Orders */
  if (orderStats?.recentOrders?.length > 0) {
    const orderRows = [
      ['Order ID', 'User ID', 'Product ID', 'Amount (Rs.)', 'Status', 'Date'],
      ...orderStats.recentOrders.map(o => [
        o._id?.slice(-8)       || '',
        o.userId?.slice(-8)    || '',
        o.productId?.slice(-8) || '',
        Number(o.totalAmount   || 0),
        o.status,
        new Date(o.createdAt).toLocaleDateString(),
      ]),
    ]
    const wsOrders = XLSX.utils.aoa_to_sheet(orderRows)
    wsOrders['!cols'] = Array(6).fill({ wch: 16 })
    XLSX.utils.book_append_sheet(wb, wsOrders, 'Recent Orders')
  }

  /* Sheet 5 — Low Stock Products */
  if (lowStockProducts?.length > 0) {
    const stockRows = [
      ['Name', 'SKU', 'Category', 'Price (Rs.)', 'Stock', 'Reserved', 'Available'],
      ...lowStockProducts.map(p => [
        p.name,
        p.sku,
        p.category,
        Number(p.price || 0),
        p.quantity,
        p.reservedQuantity || 0,
        p.quantity - (p.reservedQuantity || 0),
      ]),
    ]
    const wsStock = XLSX.utils.aoa_to_sheet(stockRows)
    wsStock['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 8 }, { wch: 10 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, wsStock, 'Low Stock Products')
  }

  XLSX.writeFile(wb, `NexMart-Report-${generatedAt.toISOString().slice(0, 10)}.xlsx`)
}
