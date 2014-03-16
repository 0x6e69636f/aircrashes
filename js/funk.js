// Obtenir l'element du DOM correspondant a la Map
function get_map() {
  return document.getElementById("carte");
} 

var MAP;
var DEFAULT_LAT = 32.10118973232094; //49.610709938074294; // 
var DEFAULT_LNG = 0.17578125; //-104.8974609375; //
var DEFAULT_ZOOM = 3;
var MIN_ZOOM = 3;
var MAP_TYPE_ID = "WORLD_MAP";
var HEATMAP_POINTS = [];
var HEATMAP;
var POINT_ARRAY;
var EVENT_BY_ID = {};
var GEOCODER;
var DELAYED = [];
var TOTAL = 0;
var DISPLAYED_DEATH = 0;
var MIN_FATAL = 5;
/**
 * Initialiser la Carte
 * @returns {google.maps.Map}
 */
function init_map() {

  // 1 - Recuperation de l element du DOM correspondant au bloc qui contiendra la carte
  var div_carte = get_map();

  // 3 - Definition de la position par defaut
  var latlng = new google.maps.LatLng(DEFAULT_LAT, DEFAULT_LNG);

  var featureOpts = get_custom_style_features_opts();

  // 4 - Definition des options de la carte
  var options = {
    center: latlng,
    zoom: DEFAULT_ZOOM,
    minZoom: MIN_ZOOM,
    mapTypeId:MAP_TYPE_ID ,
    disableDefaultUI:true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_CENTER
    },
    panControlOptions: {
      position: google.maps.ControlPosition.RIGHT_CENTER
    }
  };

  // 5 - Creation de la carte
  MAP = new google.maps.Map(div_carte, options);
  GEOCODER= new google.maps.Geocoder();

  var customMapType = new google.maps.StyledMapType(featureOpts, {name:"WORLD MAP"});
  MAP.mapTypes.set(MAP_TYPE_ID, customMapType);

  // 6 - Ajout d'un ecouteur pour traiter les clics sur la carte
  google.maps.event.addListener(MAP, 'click', function (e) {
  //  set_form_latlng(e.latLng); // Mettre a jour le formulaire avec les donnees du clic
   // console.log(MAP.getCenter());
    //console.log(MAP.getZoom());
  });

  load_all(MAP);

  return MAP;
}


function load_all(){

  $.ajax({
    url:"data.php?query=events_loc",
    success:function(json_data){
      var events = JSON.parse(json_data);
      var total = 0;
      var done = 0;
      var to_be_done = 0;
      for(var i = 0; i<events.length;i++){

        var flight = events[i];
        var fatal = parseInt(flight.TotalFatalInjuries) >0 ? parseInt(flight.TotalFatalInjuries) : 0;
        
        var event_id = flight.EventId;
        TOTAL += fatal;
        if(flight !=null && flight.Latitude != null && flight.Longitude != null && (flight.Latitude !=0 && flight.Longitude !=0) && fatal > MIN_FATAL) {
          build_marker(flight, flight.Latitude, flight.Longitude);
          //DELAYED.push(flight);
          increase_displayed_deaths(fatal);
          done+= fatal;
        }else{
          to_be_done+=fatal;
          DELAYED.push(flight);
        }
      }

      
      console.log("TOTAL : "+TOTAL);
      console.log("DONE : "+done);
      console.log("TO BE DONE : "+to_be_done);
      console.log("SHOULD BE : "+(done + to_be_done));
      console.log("DELAYED : "+DELAYED.length);
      //$('#message').html(total+" deaths");
      //do_delayed(0);

      }
    });

      

    $('a').on('click', function(ev){
      ev.preventDefault();
    })

    $('#data_text_box').on('click',function(){
      $(this).hide();
    });



  $('#data_text_box').hide();

}

function increase_displayed_deaths(plus){
  DISPLAYED_DEATH += plus;
  //var p = parseInt(DISPLAYED_DEATH / TOTAL * 100);
  $('#message').html(DISPLAYED_DEATH + " killed");
}

function do_delayed(index){
    
  if(index<DELAYED.length){
    setTimeout(function(){
      var flight = DELAYED[index];
      var fatal = parseInt(flight.TotalFatalInjuries) >0 ? parseInt(flight.TotalFatalInjuries) : 0;

      //console.log(index);
      if(flight != null){
        //console.log(index + " : "+ flight.TotalFatalInjuries);
        // if(flight !=null && flight.Latitude != null && flight.Longitude != null && (flight.Latitude !=0 && flight.Longitude !=0)) {
        //   build_marker(flight, flight.Latitude, flight.Longitude);
        // }else{
          get_coordinates(flight, function(f, coords) {
            increase_displayed_deaths(fatal);
            build_marker(f, coords.lat(), coords.lng());
          }); 
        //}        
      }else{
        console.log(index+ ' : null');
      }

      
      do_delayed(index+1);
    }, 200);
  }
}



function get_coordinates(flight, callback){
  var address = flight.Location;
  GEOCODER.geocode( { 'address': address}, function(results, status) {

  if (status == google.maps.GeocoderStatus.OK) {

    var result = results[0];
    var coords = result.geometry.location;
    callback(flight, coords);
  }
 } );
}

function build_marker(flight, Latitude, Longitude){
  // console.log("building maker at "+Latitude+" : "+Longitude);
  var fatal = parseInt(flight.TotalFatalInjuries) >0 ? parseInt(flight.TotalFatalInjuries) : 0;
  var event_id = flight.EventId;
  var latlng = new google.maps.LatLng(parseFloat(Latitude), parseFloat(Longitude)); 
  var date = flight.EventDate;
  var make = flight.Make != null && flight.Make.length >0 ? flight.Make : "";
  var model = flight.Model != null && flight.Model.length >0 ? flight.Model : "";

    var circle = new google.maps.Circle({
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.35,
      map: MAP,
      center: latlng,
      clickable:true,
      radius: fatal * 1300
    });

    build_circle_listener(circle,{
      make:make,
      model:model,
      fatal:fatal,
      event_id:event_id,
      date:date
    });
}

function show_info(event_id){
  console.log("should get data for "+event_id);
  var url ="data.php?query=info&event_id="+event_id;
  $('#data_text_box').load(url, function(t){
    $('#data_text_box').html(t);
    $('#data_text_box').show();
    $('#data_text_box a').remove();
  });
}

function build_circle_listener(circle,flight){
  var message_string = " | "+flight.make+" "+flight.model+" | <span class='date'>"+ flight.date + "</span> | "+flight.fatal + " deaths.";
  var content_string = "<a href='#' onclick='show_info(\""+flight.event_id+"\")'>"+flight.make+" "+flight.model+" "+ flight.date + "</a>";
  var info_window = new google.maps.InfoWindow({
    maxWidth:1000,
    content: content_string
    //content:flight.make+" "+flight.model+" : "+flight.fatal
  });

  google.maps.event.addListener(circle, 'click', function(ev) {
    show_info(flight.event_id);
    info_window.setPosition(circle.getCenter());
    info_window.open(MAP);
    MAP.panTo(ev.latLng);
    $('#info').html(message_string);
  });
}


function get_custom_style_features_opts() {
  return [
    {
      stylers: [
        {hue: '#000000'},
        {visibility: 'on'}
      ]
    },
    
    {
      elementType: 'geometry.stroke',
      stylers: [
        {color: '#FF0000'},
        {visibility: 'off'},
        {weight:1}
      ]
    },
    {
      featureType: 'landscape.man_made',
      elementType: 'geometry.stroke',
      stylers: [
        {color: '#000000'}
      ]
    },
    {
      featureType: 'landscape.natural',
      elementType: 'geometry.fill',
      stylers: [
        {color: '#000000'}
      ]
    },
    {
      featureType: 'landscape.man_made',
      elementType: 'geometry.fill',
      stylers: [
        {color: '#FFFFFF', visibility:'off'}
      ]
    }, /*
     {
     elementType:'geometry',
     stylers:[
     {color:'#FFFFFF'}
     ]
     },
     */
    {
      elementType: 'labels',
      stylers: [
        {visibility: 'off'}
      ]
    },
    {
      featureType: 'poi',
      stylers: [
        {visibility: 'off'}
      ]
    },
    {
      featureType: 'road',
      elementType: 'geometry.fill',
      stylers: [
        {color: '#000000'},
        {visibility: 'off'}
      ]
    },
    {
      featureType: 'road',
      elementType: 'geometry.stroke',
      stylers: [
        {color: '#FFFFFF'},
        {visibility: 'off'}
      ]
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [
        {color: '#FFFFFF'},
        {visibility: 'off'}
      ]
    },
    {
      featureType: 'road',
      elementType: 'labels.text.stroke',
      stylers: [
        {color: '#000000'},
        {visibility: 'off'}
      ]
    },
    {
      featureType: 'water',
      stylers: [
        {color: '#9CBAB9'}
      ]
    }
  ];
}


        //  HEATMAP_POINTS.push(latlng);


/*         new google.maps.Marker({
            position: latlng,
            icon:'style/control-record-small.png',
            map: MAP
          });*/



/*          google.maps.event.addListener(circle, 'click', function(ev) {
            console.log(this);
            //info_window.setPosition(ev.latLng);
            //info_window.open(MAP);
          });*/


      // POINT_ARRAY = new google.maps.MVCArray(HEATMAP_POINTS);

/*      HEATMAP = new google.maps.visualization.HeatmapLayer({
        data: POINT_ARRAY,
        radius: 50
      });

      HEATMAP.setMap(MAP);*/