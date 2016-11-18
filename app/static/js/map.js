mapboxgl.accessToken = 'pk.eyJ1IjoiamhvbGxpc3RlciIsImEiOiJjaXR6YXI4enEwYnpwMnhuMjcycGJhYnBhIn0.K5YOZULwqBY53i9M_l0tOA';

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
				directions.setOrigin([longitude, latitude]);
                map.getSource('location-point').setData({
                      "type": "FeatureCollection",
					  "features": [{
						  "type": "Feature",
						  "properties": { "name": "user-location" },
						  "geometry": {
							  "type": "Point",
							  "coordinates": [ longitude, latitude ]
						  }
					  }]
                });
			}, function() {
				directions.setOrigin([defLongitude, defLatitude]);
			});
		}
		else {
			directions.setOrigin([defLongitude, defLatitude]);
		}
	}
}

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
	//features = map.queryRenderedFeatures({layers: ['building-poi']});
	console.log(features);
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
			directions.setDestination(destination.geometry.coordinates);
		}
	});

	//destInput.addEventListener(
	routeButton.addEventListener('click', function() {
		var destination = searchFeature(features, destInput.value);
		if (destination != null) {
			setStartLocation();
			directions.setDestination(destination.geometry.coordinates);
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

