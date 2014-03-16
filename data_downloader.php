<?php
file_put_contents("data.txt", file_get_contents("http://www.ntsb.gov/aviationquery/download.ashx?type=csv"));
?>