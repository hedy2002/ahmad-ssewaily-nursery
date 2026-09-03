<?php
$host = "localhost";
$user = "root";
$pass = "";
$db = "mashtal_db";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
die("بەستنەوە سەرکەوتوو نەبوو: " . $conn->connect_error);
}
session_start();
?>