import ReactBarcode from 'react-barcode';
import { useState, useEffect } from 'react';

interface TrialPassProps {
    user?: any;
}

const TrialPass = ({ user }: TrialPassProps) => {
    // Default values mimicking the provided image
    const fullName = user ? (`${user.fname || ''} ${user.lname || ''}`.trim() || 'Sushil Sharma') : 'Sushil Sharma';
    const profileImage = user?.profileImage || '/assets/hero-player.png'; // Will use a default if available, or fallback
    const barcodeValue = String(user?.userId || user?._id || '1234567890123');

    const [imgSrc, setImgSrc] = useState<string>(profileImage);

    useEffect(() => {
        let isMounted = true;
        setImgSrc(profileImage);

        if (!profileImage || profileImage.startsWith('data:') || profileImage.startsWith('/')) {
            return; // No need to fetch local or base64 images
        }

        const fetchAndSetImage = async () => {
            const isLocal = !profileImage || profileImage.startsWith('data:') || profileImage.startsWith('/');
            if (isLocal) return;

            // Direct fetch attempt (often works if S3 bucket has proper CORS)
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
                return; // Success
            } catch (err) {
                console.warn("Direct fetch failed, trying proxy...", err);
            }

            // Proxy fallback
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
                // Do NOT fallback to local avatar. The URL might still render fine in normal img tag
                // If html-to-image fails later, it's unavoidable without working CORS.
            }
        };

        fetchAndSetImage();

        return () => { isMounted = false; };
    }, [profileImage]);

    return (
        <div id="brpl-trial-pass" className="relative w-[400px] h-[510px] shadow-[0_10px_40px_rgba(0,0,0,0.15)] select-none shrink-0 mx-auto overflow-hidden p-0 bg-white"
            style={{
                backgroundImage: 'url(/assets/trail-pass-bg.png)',
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                fontFamily: '"Inter", sans-serif',
            }}
        >
            <div className="relative z-10 w-full h-full flex flex-col pt-[108px] px-[30px] pb-[16px]">

                {/* Photo Area */}
                <div className="w-full flex-none flex flex-col items-center justify-start mt-[10px]">
                    <div className="w-[220px] h-[220px] rounded-[22px] border-[3px] border-[#24324a] overflow-hidden bg-[#5c667a] shadow-sm">
                        {user?.profileImage ? (
                            <img
                                src={imgSrc}
                                alt={fullName}
                                className="w-full h-full object-cover object-center"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-center text-[18px] font-medium p-4 leading-snug">
                                Upload Your <br /> Image
                            </div>
                        )}
                    </div>
                </div>

                {/* User Info Wrapper */}
                <div className="mt-2 flex flex-col items-center justify-center text-center gap-1">
                    <h2 className="text-[#000] text-[26px] font-semibold tracking-wide mb-1 leading-none" style={{ fontFamily: '"Poppins", sans-serif' }}>
                        {fullName}
                    </h2>

                    <div className="flex justify-center mx-auto mb-[32px] w-[70%]">
                        <ReactBarcode
                            value={barcodeValue}
                            width={1.3}
                            height={52}
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
