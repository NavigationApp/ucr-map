mapboxgl.accessToken = 'pk.eyJ1IjoiamhvbGxpc3RlciIsImEiOiJjaXR6YXI4enEwYnpwMnhuMjcycGJhYnBhIn0.K5YOZULwqBY53i9M_l0tOA';

var filterInput = document.getElementById('filter-input');

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
    //var features = map.querySourceFeatures("building-poi", { sourceLayer: "building-poi"});
    var features = map.queryRenderedFeatures({layers: ['building-poi']});
    var feature_names = [];
    features.forEach(function (entry) {
        feature_names.push(entry.properties.name)
    });
    var awesomplete = new Awesomplete(filterInput, {
            list: feature_names,
            minChars: 1,
        }
    );

    filterInput.addEventListener('awesomplete-selectcomplete', function (e) {
        console.log(e.text.value);
        features.some(function (entry) {
            if (entry.properties.name == e.text.value) {
                setStartLocation();
                directions.setDestination(entry.geometry.coordinates);
                return true;
            }
        });
    });


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

});
