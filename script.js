function calculateTotal() {
let inStore = parseInt(document.getElementById('stock_in').value) || 0;
let outStore = parseInt(document.getElementById('stock_out').value) || 0;

let total = inStore + outStore;
document.getElementById('total_stock').innerText = "کۆی گشتی: " + total;
}