const { default: axios } = require("axios");

const convertCloudUrlToStream = (req, path) => {
    const backendUrl = process.env.BACKEND_URL;

    if (process.env.NODE_ENV === 'production') {
        return `${backendUrl}/api/cloud-store/preview?uri=${encodeURIComponent(path)}`;
    }

    return `${backendUrl}/cloud-store/preview?uri=${encodeURIComponent(path)}`;
};

const streamCloudStoreToUser = async (req, res) => {
    try {
        const CLOUD_STORAGE_SERVER_URL = process.env.CLOUD_STORAGE_SERVER_URL;
        const { uri } = req.query;

        if (!uri) {
            return res.status(400).json({
                statusCode: 400,
                data: { message: "Missing media URI" }
            });
        }

        const baseUrl = CLOUD_STORAGE_SERVER_URL.replace(/\/$/, "");
        const uriPath = uri.startsWith("/") ? uri : `/${uri}`;
        const mediaUrl = `${baseUrl}${uriPath}`;

        const headers = {};

        if (req.headers.range) {
            headers["Range"] = req.headers.range;
        }

        const response = await axios({
            method: "GET",
            url: mediaUrl,
            responseType: "stream",
            headers,
            validateStatus: () => true
        });

        res.status(response.status);

        if (response.headers["content-type"]) {
            res.setHeader("Content-Type", response.headers["content-type"]);
        } else {
            res.setHeader("Content-Type", "video/mp4");
        }

        if (response.headers["content-length"]) {
            res.setHeader("Content-Length", response.headers["content-length"]);
        }

        if (response.headers["content-range"]) {
            res.setHeader("Content-Range", response.headers["content-range"]);
        }

        res.setHeader("Accept-Ranges", "bytes");

        res.setHeader("Content-Disposition", "inline");

        res.setHeader("Cache-Control", "public, max-age=3600");

        response.data.pipe(res);

    } catch (error) {
        console.error("Streaming Error:", error?.response?.data || error.message);

        if (!res.headersSent) {
            res.status(500).json({
                statusCode: 500,
                data: { message: "Error streaming media" }
            });
        }
    }
};

module.exports = { convertCloudUrlToStream, streamCloudStoreToUser };
