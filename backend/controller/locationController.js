const getLocations = (req, res) => {
    // Mock data for States, Cities, and Zone IDs
    const locations = [
        {
            state: "Uttar Pradesh",
            cities: [
                { name: "Noida", zoneId: "UP-ZN-01" },
                { name: "Lucknow", zoneId: "UP-ZN-02" },
                { name: "Ghaziabad", zoneId: "UP-ZN-03" }
            ]
        },
        {
            state: "Delhi",
            cities: [
                { name: "New Delhi", zoneId: "DL-ZN-01" },
                { name: "South Delhi", zoneId: "DL-ZN-02" }
            ]
        },
        {
            state: "Maharashtra",
            cities: [
                { name: "Mumbai", zoneId: "MH-ZN-01" },
                { name: "Pune", zoneId: "MH-ZN-02" }
            ]
        },
        {
            state: "Karnataka",
            cities: [
                { name: "Bangalore", zoneId: "KA-ZN-01" },
                { name: "Mysore", zoneId: "KA-ZN-02" }
            ]
        }
    ];

    res.status(200).json(locations);
};

module.exports = { getLocations };
