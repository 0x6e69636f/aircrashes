<?php

error_reporting(E_ALL);
 ini_set("display_errors", 1); 
 ini_set("memory_limit","2000M");

$url = "http://maps.google.com/maps/api/geocode/json?sensor=false&address=";

function get_url(){
	return "http://maps.google.com/maps/api/geocode/json?sensor=false&address=";
}

function get_db_connection(){
    return new PDO("sqlite:events.sqlite");
}

function curl_file_get_contents($URL){
    $c = curl_init();
    curl_setopt($c, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($c, CURLOPT_URL, $URL);
    $contents = curl_exec($c);
    curl_close($c);

    if ($contents) return $contents;
        else return FALSE;
}

function getLocation($address){
	$url = get_url();
    $url = $url.urlencode($address);
    
    $resp_json = curl_file_get_contents($url);
    $resp = json_decode($resp_json, true);

    echo $resp['status'];

    if($resp['status']='OK' && isset($resp['results']) && isset($resp['results'][0]) ){
        return $resp['results'][0]['geometry']['location'];
    }else{
        return false;
    }
}

echo "new connection \n";
$db = get_db_connection();
echo "query \n";
$data = $db->query("SELECT * FROM events WHERE Latitude = '  ' AND Longitude = '  ';");
echo "fetching \n";
$array = $data->fetchAll(PDO::FETCH_ASSOC);
echo "iterating \n";

$total = sizeof($array);
echo "total $total \n";
//$db->beginTransaction();
foreach($array as $index=>$event){
	echo "$index / $total \n";
	$event_id = $event["EventId"];
	$location = $event["Location"];
	$lat = $event["Latitude"];
	$lng = $event["Longitude"];

	if(floatval($lat) == 0 && floatval($lng) == 0){

		$geoloc = getLocation($location);
		if($geoloc != false){
			$latitude = $geoloc['lat'];
			$longitude = $geoloc['lng'];
			echo " got ".$geoloc['lat']." : ".$geoloc['lng']."\n";
			$query = "UPDATE events SET Latitude = $latitude , Longitude = $longitude WHERE EventId LIKE '$event_id' ;";
			echo $query . "\n";
			echo $db->exec($query)." rows affected \n";
		}
		usleep(200000);
	}else{
		echo " have ".$lat." : ".$lng."\n";
	}
}
//$db->commit();



?>