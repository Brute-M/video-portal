import ReactBarcode from 'react-barcode';
import { useState, useEffect } from 'react';

interface TrialPassProps {
    user?: any;
}

const DEFAULT_AVATAR = '/assets/avtar.jpg';

const TrialPass = ({ user }: TrialPassProps) => {
    // Default values mimicking the provided image
    const fullName = user ? (`${user.fname || ''} ${user.lname || ''}`.trim() || 'Sushil Sharma') : 'Sushil Sharma';
    const profileImage = user?.profileImage || DEFAULT_AVATAR;
    const barcodeValue = String(user?.userId || user?._id || '1234567890123');

    const [imgSrc, setImgSrc] = useState<string>(profileImage);
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        setImgError(false);
        const isExternal = profileImage && !profileImage.startsWith('data:') && !profileImage.startsWith('/') && !profileImage.startsWith('blob:');
        const displayUrl = isExternal
            ? profileImage + (profileImage.includes('?') ? '&' : '?') + 't=' + Date.now()
            : profileImage;
        setImgSrc(displayUrl);

        if (!profileImage || profileImage.startsWith('data:') || profileImage.startsWith('/')) {
            return;
        }

        const fetchAndSetImage = async () => {
            const isLocal = !profileImage || profileImage.startsWith('data:') || profileImage.startsWith('/');
            if (isLocal) return;

            try {
                const directUrl = profileImage + (profileImage.includes('?') ? '&' : '?') + 't=' + Date.now();
                const res = await fetch(directUrl, { mode: 'cors' });
                if (!res.ok) throw new Error("Direct fetch failed");
                const blob = await res.blob();

                const reader = new FileReader();
                reader.onloadend = () => {
                    if (isMounted && reader.result) {
                        setImgSrc(reader.result as string);
                    }
                };
                reader.readAsDataURL(blob);
                return;
            } catch (err) {
                console.warn("Direct fetch failed, trying proxy...", err);
            }

            try {
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(profileImage)}`;
                const res = await fetch(proxyUrl);
                if (!res.ok) throw new Error("Proxy fetch failed");
                const blob = await res.blob();

                const reader = new FileReader();
                reader.onloadend = () => {
                    if (isMounted && reader.result) {
                        setImgSrc(reader.result as string);
                    }
                };
                reader.readAsDataURL(blob);
            } catch (err) {
                console.warn("Proxy also failed for TrialPass image:", err);
                // Keep imgSrc as displayUrl so <img> can still try to load it (e.g. S3 public URL)
            }
        };

        fetchAndSetImage();

        return () => { isMounted = false; };
    }, [profileImage]);

    return (
        <div
            id="brpl-trial-pass"
            className="relative w-full max-w-[400px] aspect-[400/510] shadow-[0_10px_40px_rgba(0,0,0,0.15)] select-none shrink-0 mx-auto overflow-hidden p-0 bg-white min-h-0"
            style={{
                backgroundImage: 'url(/assets/trail-pass-bg.png)',
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                fontFamily: '"Inter", sans-serif',
            }}
        >
            <div className="absolute inset-0 z-10 flex flex-col pt-[21.2%] px-[7.5%] pb-[3.1%]">
                {/* Photo Area */}
                <div className="flex flex-col items-center justify-start mt-[2%] flex-none">
                    <div className="w-[55%] aspect-square max-w-[220px] rounded-[5.5%] border-[3px] border-[#24324a] overflow-hidden bg-[#5c667a] shadow-sm">
                        <img
                            src={imgError ? DEFAULT_AVATAR : imgSrc}
                            alt={fullName}
                            className="w-full h-full object-cover object-center"
                            onError={() => setImgError(true)}
                        />
                    </div>
                </div>

                {/* User Info Wrapper */}
                <div className="mt-[2%] flex flex-col items-center justify-center text-center gap-0 flex-1 min-h-0">
                    <h2 className="text-[#000] font-semibold tracking-wide mb-0 leading-none" style={{ fontFamily: '"Poppins", sans-serif', fontSize: 'clamp(14px, 5.2vw, 26px)' }}>
                        {fullName}
                    </h2>
                    <div className="flex justify-center mx-auto mt-1 w-[70%] flex-1 min-h-0 items-center">
                        <ReactBarcode
                            value={barcodeValue}
                            width={1.3}
                            height={40}
                            displayValue={false}
                            background="transparent"
                            lineColor="#000000"
                            margin={0}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrialPass;
