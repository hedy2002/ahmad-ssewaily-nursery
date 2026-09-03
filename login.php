<?php
include 'config.php';

if (isset($_POST['login'])) {
    $username = $_POST['username'];
    $password = $_POST['password'];

    $result = $conn->query("SELECT * FROM admins WHERE username='$username'");
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        if (password_verify($password, $row['password'])) {
            $_SESSION['admin'] = $username;
            header("Location: dashboard.php");
        } else {
            $error = "پاسۆرد هەڵەیە!";
        }
    } else {
        $error = "ئەم ئەکاونتە بوونی نییە!";
    }
}
?>
<!DOCTYPE html>
<html dir="rtl" lang="ckb">
<head>
    <meta charset="UTF-8">
    <title>چوونەژوورەوە - مەشتەلی ئەحمەد سیوەیلی</title>
    <link rel="stylesheet" href="style.css">
</head>
<body class="login-body">
    <form method="POST" class="login-form">
        <h2>چوونەژوورەوەی ئەدمین</h2>
        <?php if(isset($error)) echo "<p class='error'>$error</p>"; ?>
        <input type="text" name="username" placeholder="ناوی بەکارهێنەر" required>
        <input type="password" name="password" placeholder="پاسۆرد" required>
        <button type="submit" name="login">بچۆ ژوورەوە</button>
    </form>
</body>
</html>
