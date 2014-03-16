<?php
 error_reporting(E_ALL);
 ini_set("display_errors", 1); 
 ini_set("memory_limit","2000M");
function make_csv(){
    
}

function get_db_connection(){
    return new PDO("sqlite:events.sqlite");
}

function make_json(){
    $data = file_get_contents("AviationData.txt");
    $rows = explode("\n", $data);
    
    $head = $rows[0];
    $head_elements = explode("|",$head);
    
    $event_by_id = array();
    $events_array = array();
    
    for($i = 1; $i<sizeof($rows);$i++){
        $row = explode("|",$rows[$i]);
        $event_id = $row[0];
        $event_data = array();
        echo $event_id."<br>";    
        
        foreach($head_elements as $index => $element){
            //echo "$index $element ";
            $element = str_replace(" ", "", $element);
            $event_data[$element] = $row[$index];
        }
        
        echo "<br>";
        
        array_push($events_array, $event_data);
        $event_by_id[$event_id] = $event_data;
        
    }
    
    $event_by_id_json = json_encode($event_by_id);
    $events_array_json = json_encode($events_array);
    
    
    file_put_contents("event_by_id.json", $event_by_id_json);
    file_put_contents("events.json", $events_array_json);
    echo "done"."<br>";
}

function get_events(){
    $db = get_db_connection();
    $data = $db->query("SELECT * FROM data LIMIT 1000;");
    $array = $data->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($array);
}

function get_events_loc(){
    $db = get_db_connection();
    $data = $db->query("SELECT Latitude, Longitude, EventId, EventDate, TotalFatalInjuries, Make, Model, Location FROM events;");
    $array = $data->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($array);
}

function get_event_info($event_id){
    $url = "http://www.ntsb.gov/aviationquery/brief.aspx?ev_id=".$event_id."&key=1";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url); 
    curl_setopt($ch,CURLOPT_USERAGENT, 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1'); 
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, 0);
    $data = curl_exec($ch);
    curl_close($ch);
    libxml_use_internal_errors(true);
    $newdoc = new DOMDocument();
    $doc = new DOMDocument();
    $doc->loadHTML($data);

    $content = $doc->getElementById('lblcontents')->cloneNode(true);
    $newdoc->appendChild($newdoc->importNode($content,true));

    #$data = file_get_contents($url);
    #$data = http_get($url);
    echo $newdoc->saveHTML();
}

if(isset($_GET)){

    if($_GET['query'] == "events"){
        get_events();
    }

    if($_GET['query'] == "events_loc"){
        get_events_loc();
    }

    if($_GET['query'] == "info" && isset($_GET['event_id'])){
        get_event_info($_GET['event_id']);
    }

}

?>
