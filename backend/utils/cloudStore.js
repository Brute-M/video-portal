// const { default: axios } = require("axios");
// const { request } = require("undici");


const convertCloudUrlToStream = (req, path) => {
    const backendUrl = process.env.BACKEND_URL;

    if (process.env.NODE_ENV === 'production') {
        return `${backendUrl}/api/cloud-store/preview?uri=${encodeURIComponent(path)}`;
    }

    return `${backendUrl}/cloud-store/preview?uri=${encodeURIComponent(path)}`;
};

// const streamCloudStoreToUser = async (req, res) => {
//     try {
//         const CLOUD_STORAGE_SERVER_URL = process.env.CLOUD_STORAGE_SERVER_URL;
//         const { uri } = req.query;

//         if (!uri) {
//             return res.status(400).json({
//                 statusCode: 400,
//                 data: { message: "Missing media URI" }
//             });
//         }

//         const baseUrl = CLOUD_STORAGE_SERVER_URL.replace(/\/$/, "");
//         const uriPath = uri.startsWith("/") ? uri : `/${uri}`;
//         const mediaUrl = `${baseUrl}${uriPath}`;

//         const headers = {};

//         if (req.headers.range) {
//             headers["range"] = req.headers.range;
//         }

//         const { statusCode, headers: upstreamHeaders, body } = await request(mediaUrl, {
//             method: "GET",
//             headers
//         });

//         res.status(statusCode);

//         // Forward important headers
//         if (upstreamHeaders["content-type"]) {
//             res.setHeader("Content-Type", upstreamHeaders["content-type"]);
//         }

//         if (upstreamHeaders["content-length"]) {
//             res.setHeader("Content-Length", upstreamHeaders["content-length"]);
//         }

//         if (upstreamHeaders["content-range"]) {
//             res.setHeader("Content-Range", upstreamHeaders["content-range"]);
//         }

//         if (upstreamHeaders["accept-ranges"]) {
//             res.setHeader("Accept-Ranges", upstreamHeaders["accept-ranges"]);
//         }

//         res.setHeader("Content-Disposition", "inline");
//         res.setHeader("Cache-Control", "public, max-age=3600");

//         body.pipe(res);

//     } catch (error) {
//         console.error("Streaming Error:", error);

//         if (!res.headersSent) {
//             res.status(500).json({
//                 statusCode: 500,
//                 data: { message: "Error streaming media" }
//             });
//         }
//     }
// };

module.exports = { convertCloudUrlToStream };
