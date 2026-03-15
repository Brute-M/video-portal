const convertCloudUrlToStream = (_, path) => {
    const backendUrl = process.env.BACKEND_URL;

    if (process.env.NODE_ENV === 'production') {
        return `${backendUrl}/api/cloud-store/preview?uri=${encodeURIComponent(path)}`;
    }

    return `${backendUrl}/cloud-store/preview?uri=${encodeURIComponent(path)}`;
};

module.exports = { convertCloudUrlToStream };
