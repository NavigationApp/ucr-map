var access_key = 'pk.eyJ1IjoiamhvbGxpc3RlciIsImEiOiJjaXR6YXI4enEwYnpwMnhuMjcycGJhYnBhIn0.K5YOZULwqBY53i9M_l0tOA';
mapboxgl.accessToken = access_key;

var socket2 = io.connect('http://' + document.domain + ':' + location.port);



var destInput = document.getElementById('destination-input');
var originInput = document.getElementById('origin-input');
var routeButton = document.getElementById('route-button');

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/jhollister/citzb2fdj00ef2hlbnrqk2fw8',
    center: [-117.325, 33.973],
    zoom: 16,
});

var directions = new mapboxgl.Directions({
    profile: 'walking',
    interactive: true,
    controls: {
        inputs: false,
        instructions: true
    }
});
map.addControl(directions);

var features = geojson.features;
var watchID = null;


function normalize(string) {
    return string.trim().toLowerCase();
}

function searchFeature(features, feature_name) {
	var feature = null;
	features.some(function(entry) {
		if (normalize(entry.properties.name) == normalize(feature_name)) {
			feature = entry;
			return true;
		}
	});
	return feature;
}

/** Set start location and draw a single point at location **/
function setStartLocation() {
    // (33.974298, -117.328094)
	// 33.973354, -117.328125

    var defLatitude = 33.973354;
    var defLongitude = -117.328094;
	var origin = searchFeature(features, originInput.value);
	if (origin != null) {
		directions.setOrigin(origin.geometry.coordinates);
	}
	else {
		originInput.value = "";
		if (navigator.geolocation) {
            watchID = navigator.geolocation.watchPosition(function(position) {
				latitude = position.coords.latitude;
				longitude = position.coords.longitude;

                if(Math.abs(latitude - defLatitude) < .1 && Math.abs(longitude - defLongitude) < .1) {
                    directions.setOrigin([longitude, latitude]);
                } else {
                    directions.setOrigin([defLongitude, defLatitude]);
                }

			}, function() {
				directions.setOrigin([defLongitude, defLatitude]);
			});
		}
		else {
			directions.setOrigin([defLongitude, defLatitude]);
		}
	}
}


function distance(lat1,lon1,lat2,lon2) {
  lat1 = parseFloat(lat1);
  lon1 = parseFloat(lon1);
  lat2 = parseFloat(lat2);
  lon2 = parseFloat(lon2);
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
  return deg * (Math.PI/180)
}

function setDestination(feature) {
	console.log(feature.files);
	//if (feature.files != null && feature.files.length > 0) {
		//document.getElementById("popup-header").innerText = feature.properties.name;
		//var button = document.getElementById("button_img");
		//button.style.visibility = "visible";
		//button.src = "/static/" + feature.files;
		//button.style.background = "#fff";
		//document.getElementById("full_image").src = "/static/" + feature.files;
	//}
	//room_popup = document.getElementById("room_popup");
	//room_popup.style.visibility = "visible";
	//room_popup.style.opacity = 1;
	var start = [feature.geometry.coordinates];
	var dest = [feature.geometry.coordinates];
	console.log(feature);
	if (feature.doors != null) {
		if (feature.doors.length > 1) {
			dest = [feature.doors[0].longitude, feature.doors[0].latitude];
			var doors = feature.doors;
			var min = distance(start[1], start[0],  doors[1].latitude, doors[1].latitude);
			feature.doors.forEach(function(door) {
				var dist = distance(start[1], start[0], door.latitude, door.longitude);
				console.log(dist);
				if (dist < min) {
					min = dist;
					dest = [door.longitude, door.latitude];
				}
			});
		}
	}

	directions.setDestination(dest);
}




map.addControl(new mapboxgl.GeolocateControl());

map.on('load', function() {
    // Add 'point' for updating user's location

    map.addSource('location-point', {
        "type": "geojson",
        "data": {
            "type": "FeatureCollection",
            "features": []
        }
    });
    map.addLayer({
		"id": "location",
        "source": "location-point",
        "type": "circle",
        "paint": {
            "circle-radius": 8,
            "circle-color": "#007cbf"
	    }
    });
	var feature_names = [];
	features.forEach(function(entry) {
		feature_names.push(entry.properties.name)
	});
	var dest_awesomplete = new Awesomplete(destInput, {
		list: feature_names,
		minChars: 1,
		}
	);
	var origin_awesomplete = new Awesomplete(originInput, {
		list: feature_names,
		minChars: 1
	});
			

	destInput.addEventListener('awesomplete-selectcomplete', function(e) {
		console.log(e.text.value);
		var destination = searchFeature(features, e.text.value);
		if (destination) {
			setStartLocation();
			//directions.setDestination(destination.geometry.coordinates);
			setDestination(destination);
		}
	});

	//destInput.addEventListener(
	routeButton.addEventListener('click', function() {
		var destination = searchFeature(features, destInput.value);
		if (destination != null) {
			setStartLocation();
			setDestination(destination);
			//directions.setDestination(destination.geometry.coordinates);
		}
	});


	map.on('mousemove', function(e) {
		var features = map.queryRenderedFeatures(e.point, {
			layers: ['building-poi']
		});

		// change cursor style to indicate clickable
		map.getCanvas().style.cursor = features.length ? 'pointer' : '';
	});

	map.on('click', function(e) {
		setStartLocation();
        console.log(e.lngLat);
		directions.setDestination([e.lngLat.lng, e.lngLat.lat]);
        console.log(directions.getDestination());
	});

});

socket2.on('connect', function () {
        window.setInterval(function() {
            if (navigator.geolocation) {
                navigator.geolocation.watchPosition(function(position) {
                    var defLatitude = 33.973354;
                    var defLongitude = -117.328094;

                    latitude = position.coords.latitude;
                    longitude = position.coords.longitude;

                    if (!(Math.abs(latitude - defLatitude) < .1 && Math.abs(longitude - defLongitude) < .1)) {
                        latitude = defLatitude;
                        longitude = defLongitude;
                    }

                    directions.setOrigin([longitude, latitude])
                    socket2.emit("location", {lat: latitude, lon: longitude})
                })
            }
        }, 2000);

});
