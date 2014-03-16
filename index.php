<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Plane Crash Map</title>
        <link rel="stylesheet" type="text/css" href="style/style.css">
    </head>
    <body>
        <?php
        /*
        $db = new PDO("sqlite:events.sqlite");
        $query = $db->query("SELECT * FROM data");

        foreach($query as $row){
            echo $row["EventId"]."<br>";
        }*/
        
        ?>
    
    <!-- Bloc accueillant la carte -->
    
    <div id="data_text_box"></div>
    <div id="carte"></div>
    <div id="bandeau">
            <span id="message">Loading</span><span id="info"></span>
    </div>

    <script src="http://code.jquery.com/jquery-1.10.1.min.js"></script>
    <script src="js/highcharts.js"></script>
    <script src="js/funk.js"></script>
    <script type="text/javascript" src="http://maps.google.com/maps/api/js?v=3.exp&sensor=false&libraries=visualization"></script>
    <script type="text/javascript">
        google.maps.event.addDomListener(window, 'load', init_map);
    </script>
    </body>
</html>
