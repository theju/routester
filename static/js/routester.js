$(function() {
    var nick = Cookies.get('nick'), sid = Cookies.get('sid'), watchID;

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

    function fetchLocation() {
	      $.ajax({
	          url: window.location.pathname,
	          type: "GET",
	          success: function(data, status, jqXHR) {
		            $("#refresh button").html("Refresh");
	    	        var track = data.track;
		            updateMap(track);
	          },
	          error: function(jqXHR, status, error) {
		            $("#refresh button").html("Error");
		            setTimeout(function() {
		                $("#refresh button").html("Refresh");
		            }, 5000);
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
    }

    function updateLocation(lat, lng) {
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
	          error: function(jqXHR, status, error) {
                geoError({message: error});
	          }
	      });
    }

    function geoError(ev) {
	      alert("Error: " + ev.message);
    }

    navigator.geolocation.getCurrentPosition(function(loc) {
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

	      var lat = loc.coords.latitude;
	      var lng = loc.coords.longitude;
	      updateLocation(lat, lng);
	      map = map.fitBounds([
	          [lat, lng]
	      ]);

	      watchID = navigator.geolocation.watchPosition(function(loc) {
	          var lat = loc.coords.latitude;
	          var lng = loc.coords.longitude;
	          updateLocation(lat, lng);
	      }, geoError, {
	          enableHighAccuracy: true,
	          timeout: 180000
	      });

    }, geoError, {
	      timeout: 30000,
	      maximumAge: 1800000
    });

    $("#refresh button").on("click", function() {
	      $(this).html("Refreshing...");
	      fetchLocation();
    });
});
