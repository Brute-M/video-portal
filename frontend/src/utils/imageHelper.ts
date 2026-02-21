export const getImageUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("blob:")) return path;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    // Remove /api if present in VITE_API_URL just in case, though standard in this project seems to be http://localhost:5000 for static files
    // But axios base URL is .../api.
    // Static files are at http://localhost:5000/uploads
    const cleanBase = baseUrl.replace(/\/api$/, '');
    return `${cleanBase}/${path.startsWith("/") ? path.slice(1) : path}`;
};
