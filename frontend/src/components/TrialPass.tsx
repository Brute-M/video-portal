import ReactBarcode from 'react-barcode';
import { useState, useEffect } from 'react';

interface TrialPassProps {
    user?: any;
}

const DEFAULT_AVATAR = '/assets/avtar.jpg';

const TrialPass = ({ user }: TrialPassProps) => {
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
                    if (isMounted && reader.result) setImgSrc(reader.result as string);
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
                    if (isMounted && reader.result) setImgSrc(reader.result as string);
                };
                reader.readAsDataURL(blob);
            } catch (err) {
                console.warn("Proxy also failed for TrialPass image:", err);
            }
        };

        fetchAndSetImage();
        return () => { isMounted = false; };
    }, [profileImage]);

    return (
        <div
            id="brpl-trial-pass"
            className="relative w-full max-w-[400px] aspect-[400/510] shadow-[0_10px_40px_rgba(0,0,0,0.15)] select-none shrink-0 mx-auto overflow-hidden p-0 bg-white"
            style={{
                backgroundImage: 'url(/assets/trail-pass-bg.png)',
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                fontFamily: '"Inter", sans-serif',
            }}
        >
            <div className="absolute inset-0 z-10 flex flex-col">

                {/* Top header area — reserve ~22% for logo/title/validity */}
                <div style={{ height: '22%' }} />

                {/* Profile Photo — centered, ~46% wide, with rounded corners */}
                <div className="flex justify-center" style={{ marginTop: '1%' }}>
                    <div
                        className="overflow-hidden bg-[#5c667a]"
                        style={{
                            width: '58%',
                            aspectRatio: '1 / 1',
                            borderRadius: '6%',
                            border: '3px solid #24324a',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        }}
                    >
                        <img
                            src={imgError ? DEFAULT_AVATAR : imgSrc}
                            alt={fullName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                            onError={() => setImgError(true)}
                        />
                    </div>
                </div>

                {/* Name */}
                <div className="flex justify-center" style={{ marginTop: '3%' }}>
                    <h2
                        className="text-[#000] font-semibold tracking-wide leading-none text-center"
                        style={{
                            fontFamily: '"Poppins", sans-serif',
                            fontSize: 'clamp(16px, 5.5vw, 28px)',
                        }}
                    >
                        {fullName}
                    </h2>
                </div>

                {/* Barcode */}
                <div className="flex justify-center" style={{ marginTop: '2%', paddingLeft: '8%', paddingRight: '8%' }}>
                    <ReactBarcode
                        value={barcodeValue}
                        width={1.4}
                        height={45}
                        displayValue={false}
                        background="transparent"
                        lineColor="#000000"
                        margin={0}
                    />
                </div>

                {/* Bottom tagline area — reserve remaining space */}
                <div className="flex-1" />
            </div>
        </div>
    );
};

export default TrialPass;