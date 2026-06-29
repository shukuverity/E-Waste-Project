function setupAutocomplete(inputId, suggestionsId) {
const inputField = document.getElementById(inputId);
        const suggestionsBox = document.getElementById(suggestionsId);
        let debounceTimer;

        // Listen for typing inside the input field
        inputField.addEventListener('input', (e) => {
            const query = e.target.value.trim();

            // Clear suggestions if input is less than 3 characters
            if (query.length < 3) {
                suggestionsBox.innerHTML = '';
                return;
            }

            // Debounce function to wait until user stops typing before making the API call (saves performance)
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                fetchPlaces(query);
            }, 300); 
        });

        // Fetch data from OpenStreetMap's Nominatim Engine
        async function fetchPlaces(query) {
            // We append parameters to restrict the search strictly to Kenya (countrycodes=ke) 
            // and force bias heavily to Nairobi's coordinate box (viewbox & bounded=1)
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ke&addressdetails=1&limit=5`;

            try {
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'KenyaAutocompleteApp/1.0' // Best practice policy requirement for using OSM
                    }
                });
                const data = await response.json();
                displaySuggestions(data, inputField, suggestionsBox);
            } catch (error) {
                console.error("Error fetching location data from OSM:", error);
            }
        }

        // Display results in the custom dropdown panel
        function displaySuggestions(places, inputField, suggestionsBox) {
            suggestionsBox.innerHTML = '';

            if (places.length === 0) {
                const noResult = document.createElement('div');
                noResult.className = 'suggestion-item';
                noResult.innerText = "No matching locations found in Kenya";
                suggestionsBox.appendChild(noResult);
                return;
            }

            places.forEach(place => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.innerText = place.display_name.split(',').slice(0, 3).join(',');
                
                // Format the address layout beautifully
                item.innerText = place.display_name.split(',').slice(0, 3).join(',');

                // Click event handling to select the address
                item.addEventListener('click', () => {
                    inputField.value = place.display_name; // Set text field value
                    suggestionsBox.innerHTML = ''; // Hide suggestions container
                    
                    // Log out latitude and longitude values to use for your logic!
                    console.log(`Saved for ${inputField.id}:`, {
                        lat: place.lat,
                        lon: place.lon
                    });
                   
                });

                suggestionsBox.appendChild(item);
            });
        }

        // Close the suggestions panel if user clicks anywhere outside the application form box
        document.addEventListener('click', (e) => {
            if (e.target !== inputField) {
                suggestionsBox.innerHTML = '';
            }
        });
    }

    // Initialize autocomplete for the dropoff input field
    setupAutocomplete('location-input', 'pickup-suggestions');
    setupAutocomplete('dropoff-input', 'dropoff-suggestions');