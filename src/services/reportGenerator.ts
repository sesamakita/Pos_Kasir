export const generateClosingReportHTML = (data: any) => {
    const { date, summary, topProducts, userSummary, logs, lowStock, transactions, storeSettings } = data;
    const storeName = storeSettings?.store_name || 'POS Kasir Pro';
    const storeAddress = storeSettings?.store_address || '';
    const storePhone = storeSettings?.store_phone || '';

    const topProductsList = topProducts.map((p: any, idx: number) => `
        <tr>
            <td style="width: 40px; text-align: center;">${idx + 1}</td>
            <td>${p.name}</td>
            <td style="text-align: center;">${p.qty}</td>
            <td style="text-align: right;">Rp ${p.total.toLocaleString()}</td>
        </tr>
    `).join('');

    const userSummaryList = userSummary.map((u: any) => `
        <tr>
            <td>${u.full_name}</td>
            <td style="text-align: right; font-weight: bold;">Rp ${u.total.toLocaleString()}</td>
        </tr>
    `).join('');

    const logsList = logs.map((l: any) => `
        <tr>
            <td style="width: 80px;">${new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
            <td style="width: 100px; text-align: center;"><span class="log-badge ${l.event.toLowerCase()}">${l.event}</span></td>
            <td>${l.full_name}</td>
        </tr>
    `).join('');

    const lowStockAlerts = lowStock.map((p: any) => `
        <tr>
            <td>${p.name}</td>
            <td style="text-align: right; color: #d32f2f;">Stok: ${p.stock}</td>
        </tr>
    `).join('');

    const transactionRows = transactions.map((t: any) => `
        <tr>
            <td>${new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
            <td>${t.waiter_name || 'System'}</td>
            <td style="text-align: center;"><span class="payment-badge ${t.payment_method.toLowerCase()}">${t.payment_method}</span></td>
            <td style="text-align: right;">Rp ${t.total.toLocaleString()}</td>
        </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            @page { margin: 30px; }
            body { font-family: 'Helvetica', 'Arial', sans-serif; color: #000; line-height: 1.4; margin: 0; padding: 0; background: #fff; }
            
            .container { padding: 10px; }
            
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; margin-bottom: 5px; }
            .header h2 { margin: 0; font-size: 16px; border: none; font-weight: normal; margin-bottom: 5px; color: #555; }
            .header-contact { font-size: 10px; color: #777; margin-bottom: 10px; }
            .header-info { font-size: 12px; margin-top: 10px; font-weight: bold; border-top: 1px dashed #ccc; padding-top: 10px; }

            .summary-table { width: 100%; margin-bottom: 20px; border: 1px solid #000; }
            .summary-table td { padding: 10px; border: 1px solid #ddd; }
            .summary-label { font-size: 10px; text-transform: uppercase; color: #555; }
            .summary-value { font-size: 16px; font-weight: bold; }

            h3 { font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 4px; margin-top: 20px; margin-bottom: 10px; }

            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            th { text-align: left; padding: 8px; font-size: 11px; background: #f2f2f2; border: 1px solid #000; }
            td { padding: 7px 8px; font-size: 11px; border: 1px solid #ddd; }

            .two-cols { display: flex; gap: 20px; }
            .col { flex: 1; }

            .log-badge { padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; border: 1px solid #000; text-transform: uppercase; }
            .log-badge.login { background: #e8f5e9; color: #2e7d32; }
            .log-badge.logout { background: #ffebee; color: #c62828; }

            .payment-badge { padding: 2px 6px; border-radius: 4px; font-size: 9px; border: 1px solid #ccc; text-transform: uppercase; }
            
            .footer { margin-top: 30px; font-size: 9px; color: #777; text-align: center; border-top: 1px solid #ddd; padding-top: 10px; }
            
            .page-break { page-break-before: always; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${storeName}</h1>
                ${storeAddress ? `<h2>${storeAddress}</h2>` : ''}
                ${storePhone ? `<div class="header-contact">Tel: ${storePhone}</div>` : ''}
                
                <div class="header-info">
                   LAPORAN PENUTUPAN HARIAN <br>
                   Tanggal: ${new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
            </div>

            <table class="summary-table">
                <tr>
                    <td width="25%">
                        <div class="summary-label">Total Omset</div>
                        <div class="summary-value" style="color: #000;">Rp ${(summary.total_sales || 0).toLocaleString()}</div>
                    </td>
                    <td width="25%">
                        <div class="summary-label">Total Cash</div>
                        <div class="summary-value">Rp ${(summary.cash_sales || 0).toLocaleString()}</div>
                    </td>
                    <td width="25%">
                        <div class="summary-label">Non-Cash</div>
                        <div class="summary-value">Rp ${(summary.non_cash_sales || 0).toLocaleString()}</div>
                    </td>
                    <td width="25%">
                        <div class="summary-label">Total Transaksi</div>
                        <div class="summary-value">${summary.total_orders || 0} Trx</div>
                    </td>
                </tr>
            </table>

            <div class="two-cols">
                <div class="col">
                    <h3>Produk Terlaris (Top 5)</h3>
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 30px; text-align: center;">#</th>
                                <th>Produk</th>
                                <th style="text-align: center; width: 50px;">Qty</th>
                                <th style="text-align: right; width: 100px;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${topProductsList || '<tr><td colspan="4" style="text-align:center;">Tidak ada data penjualan</td></tr>'}
                        </tbody>
                    </table>
                </div>
                <div class="col">
                    <h3>Ringkasan Kasir (Shift)</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Nama Kasir</th>
                                <th style="text-align: right;">Total Penjualan</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${userSummaryList || '<tr><td colspan="2" style="text-align:center;">Tidak ada data</td></tr>'}
                        </tbody>
                    </table>

                    ${lowStock.length > 0 ? `
                        <h3>Peringatan Stok Rendah</h3>
                        <table>
                            <tbody>
                                ${lowStockAlerts}
                            </tbody>
                        </table>
                    ` : ''}
                </div>
            </div>

            <h3>Log Kehadiran & Keamanan</h3>
            <table>
                <thead>
                    <tr>
                        <th style="width: 80px;">Waktu</th>
                        <th style="width: 100px; text-align: center;">Event</th>
                        <th>User / Staff</th>
                    </tr>
                </thead>
                <tbody>
                    ${logsList || '<tr><td colspan="3" style="text-align:center;">Tidak ada log aktivitas</td></tr>'}
                </tbody>
            </table>

            <div class="page-break"></div>

            <h3>Detail Transaksi Penjualan</h3>
            <table>
                <thead>
                    <tr>
                        <th style="width: 80px;">Jam</th>
                        <th>Kasir</th>
                        <th style="width: 100px; text-align: center;">Pembayaran</th>
                        <th style="text-align: right; width: 120px;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${transactionRows || '<tr><td colspan="4" style="text-align:center;">Belum ada riwayat transaksi</td></tr>'}
                </tbody>
            </table>

            <div class="footer">
                ${storeName} - Laporan Penutupan Harian<br>
                Dicetak pada: ${new Date().toLocaleString('id-ID')}
            </div>
        </div>
    </body>
    </html>
    `;
};
