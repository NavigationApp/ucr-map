// index.html
mapboxgl.accessToken = 'pk.eyJ1IjoiamhvbGxpc3RlciIsImEiOiJjaXR6YXI4enEwYnpwMnhuMjcycGJhYnBhIn0.K5YOZULwqBY53i9M_l0tOA';

var filterInput = document.getElementById('filter-input');

// set bounds to UCR only
var bounds = [
    [-117.335715, 33.966891],  // Southwest coords
    [-117.320575, 33.980049] // Northeast coords
];

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/jhollister/citzb2fdj00ef2hlbnrqk2fw8',
    center: [-117.325, 33.973],
    zoom: 16,
    maxBounds: bounds
});

var directions = new mapboxgl.Directions({
    profile: 'walking',
    interactive: false,
    controls: {
        inputs: false,
        instructions: true
    }
});
map.addControl(directions);
//map.addControl(new mapboxgl.GeolocateControl({position: 'top-right'})); // position is optional

function normalize(string) {
    return string.trim().toLowerCase();
}

function setStartLocation() {
    // (33.974298, -117.328094)
    // 33.973354, -117.328125
    var defLatitude = 33.973354;
    var defLongitude = -117.328094;
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
            directions.setOrigin([longitude, latitude]);
        }, function () {
            directions.setOrigin([defLongitude, defLatitude]);
        });
    }
    else {
        directions.setOrigin([defLongitude, defLatitude]);
    }
}

map.on('load', function () {
    var features = map.queryRenderedFeatures({layers: ['building-poi']});

    map.on('mousemove', function (e) {
        var features = map.queryRenderedFeatures(e.point, {
            layers: ['building-poi']
        });

        // change cursor style to indicate clickable
        map.getCanvas().style.cursor = features.length ? 'pointer' : '';
    });

    map.on('click', function (e) {
        var features = map.queryRenderedFeatures(e.point, {
            layers: ['building-poi']
        });
        if (features.length > 0) {
            var feature = features[0]
            setStartLocation();
            directions.setDestination(feature.geometry.coordinates)
        }
        else {
            setStartLocation();
            directions.setDestination([e.lngLat.lng, e.lngLat.lat]);
        }
    });

    filterInput.addEventListener('keyup', function (e) {
        // hide buildings that match input
        var value = e.target.value.trim().toLowerCase();

        // filter visible features that don't match input value
        var filtered = features.filter(function (feature) {
            var name = normalize(feature.properties.name);
            return name.indexOf(value) > -1;
        });


        map.setFilter('building-poi', ['in', 'name'].concat(filtered.map(function (feature) {
            return feature.properties.name;
        })));

//        if (filtered.length == 1) {
//			var feature = filtered[0];
//			directions.setOrigin([-117.321044, 33.974737]);
//			directions.setDestination(feature.geometry.coordinates);
        //       }

    });

});