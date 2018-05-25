
var map;

function initMap() {
  map = new google.maps.Map(document.getElementById('mapContainer'), {
  center: {lat: 40.7291, lng: -73.9965},
  zoom: 16
  });
  map.data.loadGeoJson(
    'https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/nycd/FeatureServer/0/query?where=1=1&outFields=*&outSR=4326&f=geojson');
  hideDistricts();
}

function getColorByBoroCD ( id ){
    
    var valBoro =  Math.floor(id/100);
    
    if( valBoro == 1 ) return "#2F4B95"; //blue
    if( valBoro == 2 ) return "#FBE925"; //yellow
    if( valBoro == 3 ) return "#F63F43"; //red
    if( valBoro == 4 ) return "#FD9938"; //orange
    if( valBoro == 5 ) return "#9FCF21"; //green
}

var flag = false;

function getvis( x, y ){
    if ( x === 0){
        return true;
    }
    return x ===  Math.floor(y/100);
}

var centers = [];


function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}


var dis = [];
var DistanceMarkers = []

function loadDistricts ( x = 0) {
    
    map.data.setStyle(function(feature) {
        return ({
            fillColor: getColorByBoroCD(feature.getProperty("BoroCD")),
            strokeWeight: 1,
            visible : getvis( x,feature.getProperty("BoroCD"))
        });
    });

    
    map.data.addListener('mouseover', function(event) {
        map.data.revertStyle();
        map.data.overrideStyle(event.feature, {
            fillColor: getColorByBoroCD(event.feature.getProperty("BoroCD")),
            strokeWeight: 2.5
        });
    });
    
    map.data.addListener('mouseout', function(event) {
      map.data.revertStyle();
    });
    
    centers = [];
    dis = [];
    DistanceMarkers = [];
        
    map.data.forEach( function(feature){
        
        var bounds = new google.maps.LatLngBounds();
        if (feature.getGeometry().getType() == "Polygon") {
            
            feature.getGeometry().forEachLatLng(function(path) {
              bounds.extend(path);
            });
        
            
        }else{
            
            for( var i = 0; i<feature.b.b.length; i++){
                feature.b.b[i].forEachLatLng( function( coor ){
                   bounds.extend(coor);
                });
            }
            
            
        }
        centers.push( bounds.getCenter());
        dis.push( getDistanceFromLatLonInKm(bounds.getCenter().lat(), bounds.getCenter().lng(),40.7291,-73.9965) );  
        
        var marker = new google.maps.Marker({
            map:map,
            position: centers[feature.j-1],
            label : String(dis[feature.j - 1])
        });
        marker.setVisible(false);
        DistanceMarkers.push(marker);
        
    });
 
    map.data.addListener('click', function(event) {
        var mark = DistanceMarkers[event.feature.j-1]; 
        console.log( mark );
        if( mark.getVisible() === true ){
            mark.setVisible(false);    
        }else{
            mark.setVisible(true);    
        }
        
    });

    map.setCenter({lat: 40.696984, lng: -73.946410});
    map.setZoom(11);
}


function hideDistricts(){
    
    map.data.setStyle(function(feature) {
        return ({
            visible : false,
        });
    });
}

var NeighData = $.get( "https://data.cityofnewyork.us/api/views/xyye-rtrs/rows.json?accessType=DOWNLOAD", function(){});
    
function getLatLng( p ){
    var tmp = p.replace('POINT','').replace('(','').replace(')','');
    var coor = tmp.split(" ");
    return  new google.maps.LatLng(parseFloat(coor[2]), parseFloat(coor[1]) );
}    
    

var NeighborhoodsMarker = [];

function loadNeighborhoods( x ){
    NeighborhoodsMarker = [];
    for( var i = 0; i < NeighData.responseJSON.data.length  ; i++ ){
        
        if( x === "All" || NeighData.responseJSON.data[i][16] === x){
            var marker = new google.maps.Marker({
                map:map,
                position: getLatLng(NeighData.responseJSON.data[i][9]),
                icon: {
                    size: new google.maps.Size(20, 20),
                    scaledSize: new google.maps.Size(19, 19),
                    url: 'http://maps.google.com/mapfiles/ms/icons/blue-pushpin.png' 
                },
            });
            NeighborhoodsMarker.push( marker );
        }
    }
}


function hideNeighborhoods(){
    for( var i = 0; i<NeighborhoodsMarker.length; i++){
        NeighborhoodsMarker[i].setMap(null);
    }
}

$(document).ready( function (){
    
    var completeSep = document.getElementById("getDistricts");
    var completeMk = document.getElementById("getNeighborhoods");
    
    $("#getDistricts").on("click", function(){
         if( this.innerHTML == "District Separation"){
            this.innerHTML = "Hide Districts";
            loadDistricts();
         }else if (this. innerHTML == "Hide Districts"){
             hideDistricts();
             this.innerHTML = "District Separation";
         }
    });      
 
    $("#getNeighborhoods").on("click", function(){
        if( this.innerHTML == "Show Neightborhoods"){
            loadNeighborhoods("All");
            this.innerHTML = "Hide Neightborhoods";
        }else if (this. innerHTML == "Hide Neightborhoods"){
            hideNeighborhoods();
            this.innerHTML = "Show Neightborhoods";
        }
    });

 
    $("#getManhattan").on("click", function(){
        hideDistricts();
        hideNeighborhoods();
        loadDistricts(1);
        loadNeighborhoods("Manhattan");
        completeSep.innerHTML = "Hide Districts";
        completeMk.innerHTML = "Hide Neightborhoods";
        map.setCenter( {lat: 40.773860, lng: -73.962955});
    });

    
    $("#getBronx").on("click", function(){
        hideDistricts();
        hideNeighborhoods();
        loadDistricts(2);
        loadNeighborhoods("Bronx");
        completeSep.innerHTML = "Hide Districts";
        completeMk.innerHTML = "Hide Neightborhoods";
        map.setCenter( {lat: 40.853959, lng: -73.854776});
    });
    
    $("#getBrooklyn").on("click", function(){
        hideDistricts();
        hideNeighborhoods();
        loadDistricts(3);
        loadNeighborhoods("Brooklyn");
        completeSep.innerHTML = "Hide Districts";
        completeMk.innerHTML = "Hide Neightborhoods";
        map.setCenter( {lat: 40.646397, lng: -73.928401});
    });
    
    $("#getQueens").on("click", function(){
        hideDistricts();
        hideNeighborhoods();
        loadDistricts(4);
        loadNeighborhoods("Queens");
        completeSep.innerHTML = "Hide Districts";
        completeMk.innerHTML = "Hide Neightborhoods";
        map.setCenter( {lat: 40.678304, lng: -73.779590});
    });
    
    $("#getIsland").on("click", function(){
        hideDistricts();
        hideNeighborhoods();
        loadDistricts(5);
        loadNeighborhoods("Staten Island");
        completeSep.innerHTML = "Hide Districts";
        completeMk.innerHTML = "Hide Neightborhoods";
        map.setCenter( {lat: 40.578100, lng: -74.150357});
    });
    

});


var dropdown = document.getElementsByClassName("dropdown-btn");
for (var i = 0; i < dropdown.length; i++) {
    dropdown[i].addEventListener("click", function() {
    this.classList.toggle("active");
    var dropdownContent = this.nextElementSibling;
    if (dropdownContent.style.display === "block") {
      dropdownContent.style.display = "none";
    } else {
      dropdownContent.style.display = "block";
    }
  });
}


