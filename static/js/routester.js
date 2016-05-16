$(function() {
    $("#map").css("height", document.documentElement.clientHeight);
    var map = L.map('map');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    var layerGroup = L.layerGroup();

    function randomStr(length) {
	var space = "abcdefghijklmnopqrstuvwxyz0123456789";
	var text = "";
	for (var ii=0; ii < length; ii++) {
	    text += space.charAt(Math.floor(Math.random() * space.length));
	}
	return text;
    }

    var nick = Cookies.get('nick'), sid = Cookies.get('sid');
    if (!nick) {
	nick = prompt("Enter a nickname:");
	if (!nick) {
	    nick = randomStr(4);
	}
	Cookies.set('nick', nick.toLowerCase());
    }
    if (!sid) {
	sid = randomStr(4);
	Cookies.set('sid', sid);
    }

    function fetchLocation() {
	$.ajax({
	    url: window.location.pathname,
	    type: "GET",
	    success: function(data, status, jqXHR) {
		var track = data.track;
		updateMap(track);
	    }
	});
    }

    function updateMap(track) {
	layerGroup.clearLayers();
	var markerLocs = [];
	$.each(track, function(ii) {
	    if (ii !== "lu") {
		var pos = track[ii].split(",");
		var marker = L.marker([pos[0], pos[1]]);
		markerLocs.push([pos[0], pos[1]]);
		var userNick = ii.split("||")[0];
		marker.bindPopup(userNick);
		marker.on('click', function() {
		    marker.openPopup();
		});
		if (userNick === nick) {
		    marker.options.draggable = true;
		    marker.on('dragend', function() {
			var loc = marker.getLatLng();
			navigator.geolocation.clearWatch(watchID);
			updateLocation(loc.lat, loc.lng);
		    });
		}
		layerGroup.addLayer(marker);
	    }
	});
	layerGroup.addTo(map);
	map.fitBounds([ markerLocs ]);
    }

    function updateLocation(lat, lng) {
	map = map.fitBounds([
	    [lat, lng]
	]);

	$.ajax({
	    url: window.location.pathname,
	    type: "POST",
	    data: {
		"loc": lat + "," + lng
	    },
	    success: function(data, status, jqXHR) {
		var track = data.track;
		updateMap(track);
	    },
	    error: function() {
		// TODO: Add error handling
	    }
	});
    }

    var watchID = navigator.geolocation.watchPosition(function(loc) {
	var lat = loc.coords.latitude;
	var lng = loc.coords.longitude;

	updateLocation(lat, lng);
    }, function(ev) {
	alert("Error: " + ev.message);
    }, {
	enableHighAccuracy: true,
	timeout: 10000,
	maximumAge: 120000
    });

    $("#refresh button").on("click", function() {
	fetchLocation();
    });
});
