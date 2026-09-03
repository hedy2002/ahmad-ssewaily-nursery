<?php
include 'config.php';
if (!isset($_SESSION['admin'])) { header("Location: login.php"); exit(); }

// سڕینەوەی کاڵا
if (isset($_GET['delete'])) {
    $id = $_GET['delete'];
    $conn->query("DELETE FROM products WHERE id=$id");
    header("Location: dashboard.php");
}

$category_filter = isset($_GET['cat']) ? $_GET['cat'] : '';
$sql = "SELECT * FROM products";
if ($category_filter != '') {
    $sql .= " WHERE category='$category_filter'";
}
$products = $conn->query($sql);
?>
<!DOCTYPE html>
<html dir="rtl" lang="ckb">
<head>
    <meta charset="UTF-8">
    <title>مەشتەلی ئەحمەد سیوەیلی - بەشی ئەدمین</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="sidebar">
        <h3>مەشتەلی ئەحمەد سیوەیلی</h3>
        <a href="dashboard.php">هەموو کاڵاکان</a>
        <a href="dashboard.php?cat=دەرامان">بەشی دەرمان</a>
        <a href="dashboard.php?cat=خاکەناز و مزەخە">خاکەناز و مزەخە</a>
        <a href="dashboard.php?cat=مادەی خۆراکی">مادە خۆراکییەکان</a>
        <a href="dashboard.php?cat=بەشی تر">بەشەکانی تر</a>
        <a href="reports.php">راپۆرتەکان</a>
        <a href="logout.php">چوونەدەرەوە</a>
    </div>

    <div class="content">
        <h2>لیستی کاڵاکان</h2>
        <a href="add_product.php" class="btn">زیادکردنی کاڵای نوێ +</a>
        
        <table>
            <thead>
                <tr>
                    <th>ناو</th>
                    <th>جۆر</th>
                    <th>نرخ</th>
                    <th>لە کۆگا (ئۆتۆماتیک)</th>
                    <th>دەرەوەی کۆگا</th>
                    <th>کۆی گشتی</th>
                    <th>تێبینی</th>
                    <th>کردارەکان</th>
                </tr>
            </thead>
            <tbody>
                <?php while($row = $products->fetch_assoc()): 
                    $total_stock = $row['stock_in_store'] + $row['stock_out_store'];
                ?>
                <tr>
                    <td><?= $row['name'] ?></td>
                    <td><?= $row['category'] ?></td>
                    <td><?= $row['price'] ?> د.ع</td>
                    <td><?= $row['stock_in_store'] ?></td>
                    <td><?= $row['stock_out_store'] ?></td>
                    <td><strong><?= $total_stock ?></strong></td>
                    <td><?= $row['notes'] ?></td>
                    <td>
                        <a href="edit_product.php?id=<?= $row['id'] ?>" class="edit-btn">دەستکاری</a>
                        <a href="dashboard.php?delete=<?= $row['id'] ?>" onclick="return confirm('دڵنیایت لە سڕینەوە؟')" class="delete-btn">سڕینەوە</a>
                    </td>
                </tr>
                <?php endwhile; ?>
            </tbody>
        </table>
    </div>
</body>
</html>
