import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ReactPixel from 'react-facebook-pixel';

const PixelTracker = () => {
    const location = useLocation();
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (!initialized) {
            const pixelId = '2343942202702670';
            ReactPixel.init(pixelId, undefined, { debug: true, autoConfig: true }); // Actual Pixel ID
            ReactPixel.pageView(); // Track initial page view
            setInitialized(true);
        }
    }, [initialized]);

    useEffect(() => {
        if (initialized) {
            ReactPixel.pageView();
        }
    }, [location, initialized]);

    return null;
};

export default PixelTracker;
