<?php
include 'config.php';
if (!isset($_SESSION['admin'])) { header("Location: login.php"); exit(); }

// ڕاپۆرتی گشتی
$report = $conn->query("SELECT 
    SUM(sold_qty) as total_sold, 
    SUM(expired_qty) as total_expired, 
    SUM(stock_in_store + stock_out_store) as total_remaining 
    FROM products")->fetch_assoc();
?>
<!DOCTYPE html>
<html dir="rtl" lang="ckb">
<head>
    <meta charset="UTF-8">
    <title>ڕاپۆرتەکان - مەشتەلی ئەحمەد سیوەیلی</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="content-full">
        <h2>ڕاپۆرتی کۆتایی هەفتە و مانگ</h2>
        <a href="dashboard.php" class="btn">گەڕانەوە</a>
        
        <div class="cards">
            <div class="card">
                <h3>کۆی فرۆشراو</h3>
                <p><?= $report['total_sold'] ?? 0 ?> دانە</p>
            </div>
            <div class="card">
                <h3>کۆی ماوەتەوە</h3>
                <p><?= $report['total_remaining'] ?? 0 ?> دانە</p>
            </div>
            <div class="card danger">
                <h3>کۆی بەسەرچوو</h3>
                <p><?= $report['total_expired'] ?? 0 ?> دانە</p>
            </div>
        </div>
    </div>
</body>
</html>
