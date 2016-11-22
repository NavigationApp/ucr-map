var access_key = 'pk.eyJ1IjoiamhvbGxpc3RlciIsImEiOiJjaXR6YXI4enEwYnpwMnhuMjcycGJhYnBhIn0.K5YOZULwqBY53i9M_l0tOA';
mapboxgl.accessToken = access_key;
$('.datepicker').datepicker();
var socket2 = io.connect('http://' + document.domain + ':' + location.port);

var destInput = document.getElementById('destination-input');
var originInput = document.getElementById('origin-input');
var roomInput = document.getElementById('room-input');
var routeButton = document.getElementById('route-button');
var upArrow = document.getElementById('floor-up');
var downArrow = document.getElementById('floor-down');
var newEvent = document.getElementById('new-event');
var menu = document.getElementById('event-menu');
var eventButton = document.getElementById('event-creator');

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/jhollister/citzb2fdj00ef2hlbnrqk2fw8',
    center: [-117.328, 33.973],
    zoom: 16,
});

var popup = new mapboxgl.Popup({offset:{'bottom':[0,-45]}})
    .setLngLat([-117.328, 33.973])
    .setHTML('Place marker on event')

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

var picIndex;
var pictures = [];

function incrementPic() {
	picIndex += 1;
	document.getElementById("full_image").src = "/static/" + pictures[picIndex];
	downArrow.style.visibility = "visible";
	if (picIndex >= pictures.length || pictures[picIndex] != "") {
		// disapear arrow
		upArrow.style.visibility = "hidden";
	}
}

function decrementPic(ind) {
	picIndex -= 1;
	document.getElementById("full_image").src = "/static/" + pictures[picIndex];
	upArrow.style.visibility = "visible";
	if (picIndex < 0 || pictures[picIndex] != "") {
		// disapear arrow
		downArrow.style.visibility = "hidden";
	}

}


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
	if (feature.files !== undefined && feature.files.length > 0) {
		var floor = 0;
		feature.files.some(function(entry) {
			if (entry != "") {
				picIndex = floor;
				pictures = feature.files;
				console.log(entry);
				document.getElementById("popup-header").innerText = feature.properties.name;
				var button = document.getElementById("button_img");
				button.style.visibility = "visible";
				button.src = "/static/" + entry;
				button.style.background = "#fff";
				document.getElementById("full_image").src = "/static/" + entry;
				downArrow.style.visibility = "hidden";

				if (floor < 3 && feature.files[floor+1] != "") {
					document.getElementById("floor-up").style.visibility = "visible";
				}
				else {
					upArrow.style.visibility = "hidden";
				}
				return true;
			}
			floor += 1;
		});
	}
	var dest = feature.geometry.coordinates;
	room_num = document.getElementById("room-input").value;

	if (feature.rooms !== undefined && room_num != "") {
		feature.rooms.forEach(function(room) {
			console.log(room_num)
			if (room.number.toString() == room_num) {
				feature.doors.some(function(door) {
					if (door.id == room.ids[0]) {
						dest = [door.longitude, door.latitude];
						return true;
					}
				});
			}
		});
	}
	console.log("Destination: " + dest);

	directions.setDestination(dest);

	//var start = directions.getOrigin();
	//console.log(feature);
	//if (feature.doors != null) {
		//if (feature.doors.length > 1) {
			//dest = [feature.doors[0].longitude, feature.doors[0].latitude];
			//var doors = feature.doors;
			//var min = distance(start[1], start[0],  doors[1].latitude, doors[1].latitude);
			//feature.doors.forEach(function(door) {
				//var dist = distance(start[1], start[0], door.latitude, door.longitude);
				//console.log(dist);
				//if (dist < min) {
					//min = dist;
					//dest = [door.longitude.toString(), door.latitude.toString()];
				//}
			//});
		//}
	//}
}


map.addControl(new mapboxgl.GeolocateControl());

map.on('load', function() {
    // Add 'point' for updating user's location
 	map.addSource('point', {
        "type": "geojson",
        "data": geojson
    });

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
	map.addLayer({
        "id": "point",
        "type": "circle",
        "source": "point",
        "paint": {
            "circle-radius": 10,
            "circle-color": "#3887be"
        },
		"layout": {
            'visibility': 'none'
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

	var room_awesomplete = new Awesomplete(roomInput, {
		list: [],
		minChars: 0
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

	downArrow.addEventListener('click', function() {
		decrementPic();
	});

	upArrow.addEventListener('click', function() {
		incrementPic();
	});

	document.getElementById('close_room').addEventListener('click', function() {
		document.getElementById('myModal').style.display = "none";
	});

	roomInput.addEventListener('focus', function() {
		if (room_awesomplete.ul.childNodes.length === 0) {
			room_awesomplete.minChars = 0;
			room_awesomplete.evaluate();
		}
		else if (room_awesomplete.ul.hasAttribute('hidden')) {
			room_awesomplete.open();
		}
		else {
			room_awesomplete.close();
		}
	});

	destInput.addEventListener('awesomplete-selectcomplete', function(e) {
		var destination = searchFeature(features, e.text.value);
		roomInput.value = "";
		if (destination) {
			rooms = [];
			rooms.push("N/A");
			if (destination.rooms !== 'undefined') {
				destination.rooms.forEach(function(room) {
					rooms.push(room.number);
				});
			}
			room_awesomplete.list = rooms;
		}
		else {
			room_awesomeplete.list = [];
		}
		room_awesomplete.evaluate();
		room_awesomplete.close();
	});



	map.on('mousemove', function(e) {
		var features = map.queryRenderedFeatures(e.point, { layers: ['point'] });

        // Change point and cursor style as a UI indicator
        // and set a flag to enable other mouse events.
        if (features.length) {
            map.setPaintProperty('point', 'circle-color', '#3bb2d0');
            canvas.style.cursor = 'move';
            isCursorOverPoint = true;
            map.dragPan.disable();
        } else {
            map.setPaintProperty('point', 'circle-color', '#3887be');
            canvas.style.cursor = '';
            isCursorOverPoint = false;
            map.dragPan.enable();
        }

		// change cursor style to indicate clickable
		map.getCanvas().style.cursor = features.length ? 'pointer' : '';
	});

	map.on('click', function(e) {
		setStartLocation();
		console.log(e.lngLat);
		directions.setDestination([e.lngLat.lng, e.lngLat.lat]);
		console.log(directions.getDestination());
	});

	map.on('mousedown', mouseDown, true);

});

var geojson = {
    "type": "FeatureCollection",
    "features": [{
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [-117.328094,33.973354]
        }
    }]
};

var isDragging;

// Is the cursor over a point? if this
// flag is active, we listen for a mousedown event.
var isCursorOverPoint;

var canvas = map.getCanvasContainer();

function mouseDown() {
    if (!isCursorOverPoint) return;

    isDragging = true;

    // Set a cursor indicator
    canvas.style.cursor = 'grab';

    // Mouse events
    map.on('mousemove', onMove);
    map.on('mouseup', onUp);
}

function onMove(e) {
    if (!isDragging) return;
    var coords = e.lngLat;

    // Set a UI indicator for dragging.
    canvas.style.cursor = 'grabbing';

    // Update the Point feature in `geojson` coordinates
    // and call setData to the source layer `point` on it.
    geojson.features[0].geometry.coordinates = [coords.lng, coords.lat];
    map.getSource('point').setData(geojson);
}

function onUp(e) {
    if (!isDragging) return;
    var coords = e.lngLat;

    isDragging = false;
}

/*
newEvent.addEventListener('click', function() {
	popup.addTo(map);
	map.setLayoutProperty('point', 'visibility', 'visible');
	menu.style.visibility = 'visible';
});

eventButton.addEventListener('click', function() {
	var title = document.getElementById('event-title').value;
	var desc = document.getElementById('event-desc').value;
	var date = document.getElementById('event-date').value;
	document.getElementById('event-title').value = "";
	document.getElementById('event-desc').value = "";
	document.getElementById('event-date').value = "";
	var lng = geojson.features[0].geometry.coordinates[0]
	var lat = geojson.features[0].geometry.coordinates[1]
	map.setLayoutProperty('point', 'visibility', 'none');
	menu.style.visibility = 'hidden';

	socket2.emit('set_event', {title:title, desc:desc, date:date, location:{longitude:lng, latitude:lat}});
});
*/
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
                    socket2.emit("location", {latitude: latitude, longitude: longitude})
                })
            }
        }, 2000);

});