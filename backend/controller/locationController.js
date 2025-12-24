const axios = require('axios');

// Mock data as fallback
const MOCK_LOCATIONS = [
    {
        id: "UP",
        name: "Uttar Pradesh",
        cities: [
            { name: "Noida", zoneId: "UP-ZN-01" },
            { name: "Lucknow", zoneId: "UP-ZN-02" },
            { name: "Ghaziabad", zoneId: "UP-ZN-03" }
        ]
    },
    {
        id: "DL",
        name: "Delhi",
        cities: [
            { name: "New Delhi", zoneId: "DL-ZN-01" },
            { name: "South Delhi", zoneId: "DL-ZN-02" }
        ]
    },
    {
        id: "MH",
        name: "Maharashtra",
        cities: [
            { name: "Mumbai", zoneId: "MH-ZN-01" },
            { name: "Pune", zoneId: "MH-ZN-02" }
        ]
    },
    {
        id: "KA",
        name: "Karnataka",
        cities: [
            { name: "Bangalore", zoneId: "KA-ZN-01" },
            { name: "Mysore", zoneId: "KA-ZN-02" }
        ]
    }
];

const BASE_URL = 'https://india-location-hub.in/api/locations';

const getStates = async (req, res) => {
    try {
        const response = await axios.get(`${BASE_URL}/states`);

        if (response.data && response.data.success && Array.isArray(response.data.data.states)) {
            const states = response.data.data.states.map(state => ({
                id: state.name, // Use name as ID for easier mapping
                name: state.name,
                code: state.code
            }));
            return res.status(200).json(states);
        } else {
            throw new Error("Invalid API response format");
        }
    } catch (error) {
        console.error("Error fetching states from API:", error.message);
        // Fallback to mock data (returning just state info)
        const mockStates = MOCK_LOCATIONS.map(l => ({ id: l.name, name: l.name }));
        return res.status(200).json(mockStates);
    }
};

const getDistricts = async (req, res) => {
    const { stateId } = req.params; // This is now the state NAME

    // Legacy/Mock Check
    const isMock = MOCK_LOCATIONS.find(l => l.name === stateId || l.id === stateId);
    if (isMock && (!stateId.includes(' ') && stateId.length === 2)) {
        // If it's the old 2-letter ID, support it
        return res.status(200).json(isMock.cities);
    }

    try {
        // Fetch ALL districts and filter, since API filtering is unreliable
        const response = await axios.get(`${BASE_URL}/districts`);

        if (response.data && response.data.success && Array.isArray(response.data.data.districts)) {
            const allDistricts = response.data.data.districts;
            // Filter by state name (case insensitive just in case)
            const filteredDistricts = allDistricts.filter(d =>
                d.state_name && d.state_name.toLowerCase() === stateId.toLowerCase()
            );

            if (filteredDistricts.length === 0) {
                // Try fallback to mock if no districts found for this state
                const mockFallback = MOCK_LOCATIONS.find(l => l.name.toLowerCase() === stateId.toLowerCase());
                if (mockFallback) return res.status(200).json(mockFallback.cities);
            }

            const districts = filteredDistricts.map(dist => ({
                name: dist.name,
                zoneId: generateZoneId(stateId, dist.name)
            }));

            return res.status(200).json(districts);
        } else {
            console.warn(`No districts found valid response`);
            return res.status(200).json([]);
        }

    } catch (error) {
        console.error(`Error fetching districts for state ${stateId}:`, error.message);
        // Fallback to mock if API fails
        const mockFallback = MOCK_LOCATIONS.find(l => l.name.toLowerCase() === stateId.toLowerCase());
        if (mockFallback) return res.status(200).json(mockFallback.cities);
        return res.status(200).json([]);
    }
};

// Helper to generate a pseudo-random but consistent Zone ID
const generateZoneId = (stateId, cityName) => {
    const statePrefix = String(stateId).substring(0, 2).toUpperCase();
    const cityPrefix = cityName.substring(0, 2).toUpperCase();
    const randomNum = Math.floor(Math.random() * 90) + 10; // 10-99
    return `${statePrefix}-${CITY_CODE_MAP[cityName] || cityPrefix}-ZN-${randomNum}`;
};

// Simple map for consistency for known cities if needed, otherwise dynamic
const CITY_CODE_MAP = {};

// Deprecated: Legacy getLocations for backward compatibility if needed temporarily
const getLocations = (req, res) => {
    const legacyData = MOCK_LOCATIONS.map(state => ({
        state: state.name,
        cities: state.cities
    }));
    res.status(200).json(legacyData);
};

module.exports = { getStates, getDistricts, getLocations };
