(function () {
    var STATUS_STEPS = [
        "Requested",
        "Approved",
        "Recycler Assigned",
        "En Route",
        "Picked Up",
        "Completed"
    ];

    var RECYCLERS = [
        { name: "WEEE Centre", city: "Nairobi", rating: 4.5, type: "Household e-waste", lat: -1.286389, lng: 36.817223 },
        { name: "CFSK", city: "Nakuru", rating: 4.2, type: "Business e-waste", lat: -0.303099, lng: 36.080025 },
        { name: "EACR", city: "Kisumu", rating: 4.0, type: "Batteries and power units", lat: -0.091702, lng: 34.767956 },
        { name: "Tech Green Hub", city: "Mombasa", rating: 4.3, type: "Household e-waste", lat: -4.043477, lng: 39.668206 }
    ];

    var LOCATION_MAP = {
        nairobi: { lat: -1.286389, lng: 36.817223 },
        nakuru: { lat: -0.303099, lng: 36.080025 },
        kisumu: { lat: -0.091702, lng: 34.767956 },
        mombasa: { lat: -4.043477, lng: 39.668206 },
        eldoret: { lat: 0.514277, lng: 35.269779 },
        thika: { lat: -1.03326, lng: 37.069327 }
    };

    var DEFAULT_POINTS = {
        totalEarned: 2000,
        redeemed: 750
    };

    var pointsState = loadState("ewastePoints", DEFAULT_POINTS);
    var trackingState = loadState("ewasteTracking", getEmptyTrackingState());

    var currentPointsEl = document.getElementById("current-points");
    var totalEarnedEl = document.getElementById("total-earned");
    var redeemedEl = document.getElementById("redeemed-points");
    var progressEl = document.getElementById("points-progress");

    var wasteForm = document.getElementById("waste-request-form");
    var trackingRequestIdEl = document.getElementById("tracking-request-id");
    var trackingLiveStatusEl = document.getElementById("tracking-live-status");
    var trackingNoteEl = document.getElementById("tracking-note");
    var advanceStatusBtn = document.getElementById("advance-status-btn");
    var removeRequestBtn = document.getElementById("remove-request-btn");

    var recyclerForm = document.getElementById("recycler-search-form");
    var recyclerResultsEl = document.getElementById("recycler-results");

    renderPoints();
    renderTracking();

    if (wasteForm) {
        wasteForm.addEventListener("submit", function (event) {
            event.preventDefault();

            var formData = new FormData(wasteForm);
            var weight = Number(formData.get("waste-weight") || 0);
            var pickupLocation = String(formData.get("pickup-location") || "").trim();

            trackingState = {
                requestId: generateRequestId(),
                statusIndex: 0,
                weightKg: weight,
                awarded: false,
                pickupLocation: pickupLocation
            };

            saveState("ewasteTracking", trackingState);
            renderTracking();

            trackingNoteEl.textContent = "Request submitted. Use Advance Status to track each pickup stage.";
        });
    }

    if (advanceStatusBtn) {
        advanceStatusBtn.addEventListener("click", function () {
            if (!trackingState.requestId) {
                trackingNoteEl.textContent = "Submit a waste request first.";
                return;
            }

            if (trackingState.statusIndex < STATUS_STEPS.length - 1) {
                trackingState.statusIndex += 1;
                saveState("ewasteTracking", trackingState);
                renderTracking();
            }

            if (STATUS_STEPS[trackingState.statusIndex] === "Completed" && !trackingState.awarded) {
                var earned = calculatePoints(trackingState.weightKg);
                pointsState.totalEarned += earned;
                trackingState.awarded = true;
                saveState("ewastePoints", pointsState);
                saveState("ewasteTracking", trackingState);
                renderPoints();
                renderTracking();
                trackingNoteEl.textContent = "Pickup completed. " + earned + " points added.";
                return;
            }

            if (STATUS_STEPS[trackingState.statusIndex] === "Completed") {
                trackingNoteEl.textContent = "Pickup is already completed for this request.";
                return;
            }

            trackingNoteEl.textContent = "Status updated to " + STATUS_STEPS[trackingState.statusIndex] + ".";
        });
    }

    if (removeRequestBtn) {
        removeRequestBtn.addEventListener("click", function () {
            trackingState = getEmptyTrackingState();
            saveState("ewasteTracking", trackingState);
            renderTracking();
            trackingNoteEl.textContent = "Request removed. Tracking reset.";
        });
    }

    if (recyclerForm) {
        recyclerForm.addEventListener("submit", function (event) {
            event.preventDefault();

            var locationInput = document.getElementById("recycler-location");
            var typeInput = document.getElementById("recycler-type");

            var locationValue = (locationInput && locationInput.value || "").trim();
            var selectedType = (typeInput && typeInput.value || "").trim();
            var userPoint = resolveLocation(locationValue);

            if (!userPoint) {
                recyclerResultsEl.innerHTML = "<span>Please enter a valid town, for example: Nairobi, Nakuru, Kisumu, Mombasa, Eldoret, or Thika.</span>";
                return;
            }

            var candidates = RECYCLERS.filter(function (recycler) {
                return !selectedType || recycler.type === selectedType;
            }).map(function (recycler) {
                return {
                    recycler: recycler,
                    distanceKm: haversineKm(userPoint.lat, userPoint.lng, recycler.lat, recycler.lng)
                };
            }).sort(function (a, b) {
                return a.distanceKm - b.distanceKm;
            });

            if (!candidates.length) {
                recyclerResultsEl.innerHTML = "<span>No recycler found for the selected type in the current list.</span>";
                return;
            }

            recyclerResultsEl.innerHTML = candidates.map(function (item) {
                return "<div class=\"recycler-card\">" +
                    "<div class=\"recycler-name\">" + item.recycler.name + "</div>" +
                    "<div class=\"recycler-meta\">" +
                    item.recycler.city + " | Rating " + item.recycler.rating.toFixed(1) + " | " +
                    item.distanceKm.toFixed(1) + " km away" +
                    "</div>" +
                    "</div>";
            }).join("");
        });
    }

    function renderPoints() {
        var current = Math.max(pointsState.totalEarned - pointsState.redeemed, 0);
        var denominator = Math.max(pointsState.totalEarned, 1);
        var progressPercent = Math.min((current / denominator) * 100, 100);

        if (currentPointsEl) {
            currentPointsEl.textContent = formatNumber(current);
        }
        if (totalEarnedEl) {
            totalEarnedEl.textContent = formatNumber(pointsState.totalEarned);
        }
        if (redeemedEl) {
            redeemedEl.textContent = formatNumber(pointsState.redeemed);
        }
        if (progressEl) {
            progressEl.style.width = progressPercent.toFixed(1) + "%";
        }
    }

    function renderTracking() {
        var hasRequest = Boolean(trackingState.requestId);
        var currentStatus = hasRequest && trackingState.statusIndex >= 0
            ? STATUS_STEPS[trackingState.statusIndex]
            : "No active request";

        if (trackingRequestIdEl) {
            trackingRequestIdEl.textContent = hasRequest ? trackingState.requestId : "No request yet";
        }

        if (trackingLiveStatusEl) {
            trackingLiveStatusEl.textContent = currentStatus;
            trackingLiveStatusEl.classList.toggle("is-empty", !hasRequest);
        }
    }

    function getEmptyTrackingState() {
        return {
            requestId: "",
            statusIndex: -1,
            weightKg: 0,
            awarded: false,
            pickupLocation: ""
        };
    }

    function calculatePoints(weightKg) {
        var safeWeight = Number(weightKg);
        if (!Number.isFinite(safeWeight) || safeWeight <= 0) {
            return 20;
        }
        return Math.round(safeWeight * 20);
    }

    function generateRequestId() {
        var now = new Date();
        var datePart = String(now.getFullYear()).slice(-2) +
            String(now.getMonth() + 1).padStart(2, "0") +
            String(now.getDate()).padStart(2, "0");
        var randomPart = Math.floor(Math.random() * 9000 + 1000);
        return "REQ-" + datePart + "-" + randomPart;
    }

    function loadState(key, fallback) {
        try {
            var raw = localStorage.getItem(key);
            if (!raw) {
                return fallback;
            }
            return Object.assign({}, fallback, JSON.parse(raw));
        } catch (error) {
            return fallback;
        }
    }

    function saveState(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function formatNumber(value) {
        return Number(value).toLocaleString();
    }

    function haversineKm(lat1, lon1, lat2, lon2) {
        var toRad = function (deg) {
            return deg * (Math.PI / 180);
        };

        var earthRadiusKm = 6371;
        var dLat = toRad(lat2 - lat1);
        var dLon = toRad(lon2 - lon1);

        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return earthRadiusKm * c;
    }

    function resolveLocation(rawInput) {
        var cleaned = normalizeLocation(rawInput);
        if (!cleaned) {
            return null;
        }

        if (LOCATION_MAP[cleaned]) {
            return LOCATION_MAP[cleaned];
        }

        var keys = Object.keys(LOCATION_MAP);
        for (var i = 0; i < keys.length; i += 1) {
            var key = keys[i];
            if (cleaned.indexOf(key) !== -1 || key.indexOf(cleaned) !== -1) {
                return LOCATION_MAP[key];
            }
        }

        return null;
    }

    function normalizeLocation(value) {
        return String(value || "")
            .toLowerCase()
            .replace(/[^a-z\s]/g, " ")
            .replace(/\b(county|city|town|kenya)\b/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }
})();

(function () {
    var toggleBtn = document.getElementById('modules-toggle');
    var modulesMenu = document.getElementById('admin-modules-menu');
    if (!toggleBtn || !modulesMenu) {
        return;
    }

    toggleBtn.addEventListener('click', function () {
        var isOpen = modulesMenu.classList.toggle('open');
        toggleBtn.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', function (event) {
        if (!modulesMenu.classList.contains('open')) {
            return;
        }

        if (modulesMenu.contains(event.target) || toggleBtn.contains(event.target)) {
            return;
        }

        modulesMenu.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
    });
})();
