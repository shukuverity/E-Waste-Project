function initAutocomplete() {
    const input = document.getElementById("pickup-location");
    if (!input || !window.google || !google.maps || !google.maps.places) {
        return;
    }

    const nairobiBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(-1.43, 36.65),
        new google.maps.LatLng(-1.16, 37.10)
    );

    const options = {
        bounds: nairobiBounds,
        strictBounds: true,
        componentRestrictions: { country: "ke" },
        fields: ["address_components", "formatted_address", "geometry", "name"],
        types: ["geocode", "establishment"]
    };

    const autocomplete = new google.maps.places.Autocomplete(input, options);

    autocomplete.addListener("place_changed", function () {
        const place = autocomplete.getPlace();
        if (!place || !place.geometry || !place.geometry.location) {
            return;
        }

        console.log("Selected Place Name:", place.name || place.formatted_address || "Unknown");
        console.log("Coordinates:", place.geometry.location.lat(), place.geometry.location.lng());
    });
}

window.initAutocomplete = initAutocomplete;