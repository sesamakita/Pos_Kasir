import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';

interface ReceiptItem {
    name: string;
    qty: number;
    price: number;
}

interface ReceiptData {
    storeName: string;
    storeAddress: string;
    storePhone?: string; // Added phone
    items: ReceiptItem[];
    total: number;
    paid: number;
    change: number;
    date: string;
    cashierName?: string;
    orderId: string;
}

/**
 * Generates HTML content specifically designed for 58mm thermal printers.
 * Key constraints:
 * - Width: Approx 58mm (using ~260px - 300px based on DPI, but we use viewport)
 * - Font: Monospace or simple Sans-Serif
 * - Contrast: Black & White only
 */
const generateHtml = (data: ReceiptData) => {
    const formatCurrency = (amount: number) => {
        return "Rp " + amount.toLocaleString('id-ID');
    };

    const itemsHtml = data.items.map(item => `
        <div class="item">
            <div class="row">
                <span class="name">${item.name}</span>
            </div>
            <div class="row details">
                <span>${item.qty} x ${formatCurrency(item.price)}</span>
                <span class="price">${formatCurrency(item.qty * item.price)}</span>
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
            size: 58mm auto; /* Target 58mm paper width */
        }
        body {
            font-family: 'Courier New', monospace;
            width: 100%;
            margin: 0;
            padding: 5px;
            font-size: 12px;
            color: black;
            background-color: white;
        }
        .container {
            width: 100%;
            max-width: 58mm; /* Enforce width constrain */
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 1px dashed black;
            padding-bottom: 5px;
        }
        .store-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 2px;
        }
        .store-address {
            font-size: 10px;
        }
        .store-phone {
            font-size: 10px;
            margin-top: 2px;
        }
        .meta {
            font-size: 10px;
            margin-bottom: 5px;
        }
        .divider {
            border-top: 1px dashed black;
            margin: 5px 0;
        }
        .item {
            margin-bottom: 4px;
        }
        .row {
            display: flex;
            justify-content: space-between;
        }
        .name {
            font-weight: bold;
        }
        .details {
            font-size: 10px;
            color: #333;
        }
        .totals {
            margin-top: 10px;
            border-top: 1px dashed black;
            padding-top: 5px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
            font-size: 12px;
        }
        .grand-total {
            font-weight: bold;
            font-size: 14px;
            margin-top: 5px;
        }
        .footer {
            text-align: center;
            margin-top: 15px;
            font-size: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="store-name">${data.storeName}</div>
            <div class="store-address">${data.storeAddress}</div>
            ${data.storePhone ? `<div class="store-phone">${data.storePhone}</div>` : ''}
        </div>
        
        <div class="meta">
            <div>Date: ${data.date}</div>
            <div>Order ID: #${data.orderId.slice(-6)}</div>
            <div>Cashier: ${data.cashierName || 'Admin'}</div>
        </div>

        <div class="divider"></div>

        <div class="items">
            ${itemsHtml}
        </div>

        <div class="totals">
            <div class="total-row">
                <span>Total</span>
                <span class="grand-total">${formatCurrency(data.total)}</span>
            </div>
            <div class="total-row">
                <span>Tunai</span>
                <span>${formatCurrency(data.paid)}</span>
            </div>
            <div class="total-row">
                <span>Kembali</span>
                <span>${formatCurrency(data.change)}</span>
            </div>
        </div>

        <div class="footer">
            <p>Terima Kasih!</p>
            <p>Simpan struk ini sebagai bukti pembayaran.</p>
        </div>
    </div>
</body>
</html>
    `;
};

export const printReceipt = async (data: ReceiptData) => {
    try {
        const html = generateHtml(data);
        await Print.printAsync({
            html,
            width: 58 * 11.81, // Approx width in points (optional, might be ignored by some print services)
            orientation: Print.Orientation.portrait,
        });
    } catch (error) {
        console.error("Printing failed:", error);
    }
};
