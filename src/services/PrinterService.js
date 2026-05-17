// Printer Service Offline untuk Web & Capacitor Hybrid (Target 58mm Thermal Printer)

const generateHtml = (data) => {
    const formatCurrency = (amount) => {
        return "Rp " + amount.toLocaleString('id-ID');
    };

    const itemsHtml = data.items.map(item => `
        <div class="item">
            <div class="row">
                <span class="name">${item.name}</span>
            </div>
            <div class="row details">
                <span>${item.quantity || item.qty} x ${formatCurrency(item.price)}</span>
                <span class="price">${formatCurrency((item.quantity || item.qty) * item.price)}</span>
            </div>
        </div>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, minimum-scale=1.0, user-scalable=yes" />
    <style>
        @page {
            margin: 0;
            size: 58mm auto; /* Ukuran kertas kasir 58mm */
        }
        body {
            font-family: 'Courier New', monospace;
            width: 100%;
            margin: 0;
            padding: 10px;
            font-size: 11px;
            color: black;
            background-color: white;
            box-sizing: border-box;
        }
        .container {
            width: 100%;
            max-width: 58mm;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 1px dashed black;
            padding-bottom: 8px;
        }
        .store-name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 2px;
        }
        .store-address {
            font-size: 9px;
            line-height: 1.2;
        }
        .store-phone {
            font-size: 9px;
            margin-top: 2px;
        }
        .meta {
            font-size: 9px;
            margin-bottom: 8px;
            line-height: 1.3;
        }
        .divider {
            border-top: 1px dashed black;
            margin: 6px 0;
        }
        .item {
            margin-bottom: 6px;
        }
        .row {
            display: flex;
            justify-content: space-between;
        }
        .name {
            font-weight: bold;
            word-break: break-all;
        }
        .details {
            font-size: 9.5px;
            color: #333;
            margin-top: 2px;
        }
        .totals {
            margin-top: 8px;
            border-top: 1px dashed black;
            padding-top: 6px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
        }
        .grand-total {
            font-weight: bold;
            font-size: 12px;
        }
        .footer {
            text-align: center;
            margin-top: 15px;
            font-size: 9px;
            line-height: 1.3;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="store-name">${data.storeName}</div>
            <div class="store-address">${data.storeAddress}</div>
            ${data.storePhone ? `<div class="store-phone">Telp: ${data.storePhone}</div>` : ''}
        </div>
        
        <div class="meta">
            <div>Waktu   : ${data.date}</div>
            <div>No. TRX : ${data.orderId}</div>
            <div>Kasir   : ${data.cashierName || 'Kasir Toko'}</div>
        </div>

        <div class="divider"></div>

        <div class="items">
            ${itemsHtml}
        </div>

        <div class="totals">
            <div class="total-row grand-total">
                <span>TOTAL</span>
                <span>${formatCurrency(data.total)}</span>
            </div>
            <div class="total-row">
                <span>Bayar Tunai</span>
                <span>${formatCurrency(data.paid)}</span>
            </div>
            <div class="total-row">
                <span>Kembalian</span>
                <span>${formatCurrency(data.change)}</span>
            </div>
        </div>

        <div class="footer">
            <p>*** Terima Kasih ***</p>
            <p>Barang yang sudah dibeli<br>tidak dapat ditukar/dikembalikan.</p>
        </div>
    </div>
</body>
</html>
    `;
};

export async function printReceipt(data) {
    try {
        const html = generateHtml(data);
        
        // Buat iframe tersembunyi untuk memicu dialog print sistem secara native/web
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
        
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();
        
        // Trigger pencetakan
        setTimeout(() => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            
            // Hapus iframe setelah pencetakan selesai
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        }, 200);

        return true;
    } catch (error) {
        console.error("Printing failed:", error);
        alert("Gagal memicu pencetakan struk. Pastikan browser mendukung dialog cetak.");
        return false;
    }
}
