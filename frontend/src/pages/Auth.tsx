import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, CheckCircle2, Phone, Eye, EyeOff, ArrowLeft, Loader2, ArrowRight, Swords, CircleDot, Shield, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ResponseModal from "@/components/ResponseModal";
import { login, loginOtp, verifyAdminOtp, register, sendOtp, verifyOtp, forgotPassword, resetPassword, saveStep1Data, updateProfile, storeSyncData, getProfile } from "@/apihelper/auth";
import { createLandingOrder, verifyLandingPayment, createOrderRegistrationInfluencer, verifyLandingPaymentInfluencer } from "@/apihelper/payment";
import { getSlugAmount } from "@/apihelper/influencerLinks";
import { loadRazorpay } from "@/utils/loadRazorpay";
import { getLocationsAPI } from "@/apihelper/location";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import SEO from "@/components/SEO";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import RegistrationFAQ from "@/components/RegistrationFAQ";
import TrustBar from "@/components/TrustBar";
import RoadmapSection from "@/components/RoadmapSection";
import RegistrationHero from "@/components/RegistrationHero";
import FloatingRegisterButton from "@/components/FloatingRegisterButton";
import FloatingWhatsAppButton from "@/components/FloatingWhatsAppButton";
import AuthVideoFeed from "@/components/AuthVideoFeed";
import apiClient from "@/apihelper/api";
import { getImageUrl } from "@/utils/imageHelper";

type AuthProps = {
  forceRegister?: boolean;
};

const Auth = ({ forceRegister }: AuthProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();

  const DEFAULT_PRICE_INR = 1499;

  // Wireframe: show these major cities as "Trail City" options.
  // Backend requires `city` + `state`, but `zone_id` is optional.
  const STATIC_TRAIL_CITIES = [
    { name: "Mumbai", state: "Maharashtra" },
    { name: "Ahmedabad", state: "Gujarat" },
    { name: "Kolkata", state: "West Bengal" },
    { name: "Delhi", state: "Delhi" },
    { name: "Chennai", state: "Tamil Nadu" },
    { name: "Bengaluru", state: "Karnataka" },
    { name: "Pune", state: "Maharashtra" },
    { name: "Hyderabad", state: "Telangana" },
    { name: "Nagpur", state: "Maharashtra" },
    { name: "Lucknow", state: "Uttar Pradesh" },
  ];

  const buildStaticTrailCityOptions = () =>
    STATIC_TRAIL_CITIES.map((c, idx) => ({
      name: c.name,
      state: c.state,
      zoneId: `STATIC-${idx + 1}`,
    }));

  // Mode & Steps
  const [isRegister, setIsRegister] = useState(
    !!forceRegister || searchParams.get("mode") === "register"
  );
  const [currentStep, setCurrentStep] = useState(1); // 1: Details, 2: Payment, 3: Account

  const [isLoading, setIsLoading] = useState(false);

  const [responseModal, setResponseModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: "success" | "error";
  }>({
    isOpen: false,
    title: "",
    description: "",
    type: "error",
  });

  const toast = (options: any) => {
    setResponseModal({
      isOpen: true,
      title: options.title || "",
      description: options.description || "",
      type: options.variant === "destructive" ? "error" : "success",
    });
  };

  // Dynamic banner & quote
  const [authBannerImage, setAuthBannerImage] = useState("/auth-banner.png");
  const [authQuote, setAuthQuote] = useState("Where skill is the only selection criteria and your dream is the only qualification.");

  useEffect(() => {
    apiClient.get("/api/registration-banner")
      .then(res => {
        if (res.data.success && res.data.data) {
          if (res.data.data.backgroundImage) setAuthBannerImage(res.data.data.backgroundImage);
          if (res.data.data.quote !== undefined) setAuthQuote(res.data.data.quote);
        }
      })
      .catch(() => {});
  }, []);

  // OTP State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Login mode: players can sign in with mobile OTP (admin/subadmin/seo_content still use password login).
  const [loginMode, setLoginMode] = useState<"otp" | "password">("otp");
  const [showLoginOtpModal, setShowLoginOtpModal] = useState(false);
  const [loginOtpInput, setLoginOtpInput] = useState("");
  const [isSendingLoginOtp, setIsSendingLoginOtp] = useState(false);
  const [isVerifyingLoginOtp, setIsVerifyingLoginOtp] = useState(false);

  // Payment State
  const [paymentId, setPaymentId] = useState("");
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [userId, setUserId] = useState("");
  const [influencerSlug, setInfluencerSlug] = useState<string | null>(null);
  const [slugAmountInr, setSlugAmountInr] = useState<number | null>(null);

  // Admin 2FA (Google Authenticator) state
  const [requireAdminOtp, setRequireAdminOtp] = useState(false);
  const [adminOtpToken, setAdminOtpToken] = useState("");
  const [adminOtpInput, setAdminOtpInput] = useState("");
  const [adminQrCodeUrl, setAdminQrCodeUrl] = useState<string | null>(null);
  const [isVerifyingAdminOtp, setIsVerifyingAdminOtp] = useState(false);


  const [formData, setFormData] = useState({
    email: "",
    password: "",
    // Register specific fields
    fname: "",
    lname: "",
    mobile: "",

    zone_id: "",
    city: "",
    state: "",
    pincode: "",
    address1: "",
    address2: "",
    otp: "",
    playerRole: "",
    referralCode: "",
    campaignCode: "",
  });

  const [availableCities, setAvailableCities] = useState<any[]>(() => buildStaticTrailCityOptions());

  // Registration UI states (wireframe-inspired)
  const [fullName, setFullName] = useState("");
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  // Load Trail City dropdown options
  useEffect(() => {
    if (!isRegister) return;
    let cancelled = false;

    (async () => {
      setIsLoadingLocations(true);
      try {
        const locations = await getLocationsAPI();
        if (cancelled) return;

        const flattened: Array<{ name: string; state: string; zoneId: string }> = [];
        if (Array.isArray(locations)) {
          locations.forEach((s: any) => {
            const stateName = s?.state || s?.name || "";
            const cities = Array.isArray(s?.cities) ? s.cities : [];

            // backend requires `state`, so we only include cities with a state
            if (!String(stateName).trim()) return;

            cities.forEach((c: any) => {
              if (!c?.name) return;

              // Radix SelectItem value must not be empty string.
              const safeZoneId = String(c?.zoneId || c?.name || ""); // fallback to city name
              if (!safeZoneId.trim()) return;

              flattened.push({
                name: String(c.name),
                state: String(stateName),
                zoneId: safeZoneId,
              });
            });
          });
        }

        // Merge API results on top of static cities (dedupe by city+state)
        const merged = new Map<string, any>();
        buildStaticTrailCityOptions().forEach((c) => {
          merged.set(`${c.state}::${c.name}`, c);
        });
        flattened.forEach((c) => {
          merged.set(`${c.state}::${c.name}`, c);
        });

        setAvailableCities(Array.from(merged.values()));
      } catch {
        // Keep static options if API fails
        if (!cancelled) setAvailableCities(buildStaticTrailCityOptions());
      } finally {
        if (!cancelled) setIsLoadingLocations(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isRegister]);

  useEffect(() => {
    if (forceRegister) {
      setIsRegister(true);
      return;
    }

    const mode = searchParams.get("mode");
    setIsRegister(mode === "register");

    // Auto-fill referral code
    const refCode = searchParams.get("ref") || localStorage.getItem("brpl_ref_code");
    // Auto-fill campaign code
    const campCode = searchParams.get("campaign");

    if (refCode || campCode) {
      setFormData(prev => ({
        ...prev,
        referralCode: refCode || prev.referralCode,
        campaignCode: campCode || prev.campaignCode
      }));
    }

    // Treat ?ref=slug as influencer slug for dynamic pricing + discount attribution
    const slugFromUrl = searchParams.get("ref");
    if (slugFromUrl) {
      const normalized = String(slugFromUrl).trim().toLowerCase();
      setInfluencerSlug(normalized);
      sessionStorage.setItem("brpl_influencer_slug", normalized);
      localStorage.setItem("brpl_influencer_slug", normalized);
    }
  }, [searchParams, forceRegister]);

  // Restore userId and influencerSlug from sessionStorage on mount (e.g. user refreshed on payment step)
  useEffect(() => {
    const stored = sessionStorage.getItem('brpl_registration_user_id');
    if (stored && !userId) setUserId(stored);
    const storedSlug = sessionStorage.getItem('brpl_influencer_slug');
    if (storedSlug && !influencerSlug) setInfluencerSlug(storedSlug);
  }, []);

  // Fetch dynamic amount for influencer slug (used for display/tracking)
  useEffect(() => {
    let cancelled = false;
    const slug = influencerSlug || localStorage.getItem("brpl_influencer_slug");
    if (!slug) {
      setSlugAmountInr(null);
      return;
    }
    (async () => {
      try {
        const amount = await getSlugAmount(slug);
        if (!cancelled && Number.isFinite(amount) && amount > 0) setSlugAmountInr(amount);
      } catch {
        if (!cancelled) setSlugAmountInr(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [influencerSlug]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // For mobile, only allow numbers and max 10 digits
    if (e.target.id === 'mobile') {
      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, [e.target.id]: val });
      setIsPhoneVerified(false);
      return;
    }
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSelectChange = (value: string, field: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleFullNameChange = (value: string) => {
    setFullName(value);
    const parts = value.trim().split(/\s+/).filter(Boolean);
    const fname = parts[0] || "";
    const lname = parts.length > 1 ? parts.slice(1).join(" ") : "";
    setFormData(prev => ({ ...prev, fname, lname }));
  };

  const generatePassword = () => {
    // Backend requires `password` but the wireframe doesn't show it,
    // so we generate a strong password and send it via email.
    const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+?";
    const length = 14;

    try {
      const arr = new Uint32Array(length);
      if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
        window.crypto.getRandomValues(arr);
        return Array.from(arr)
          .map((n) => charset[n % charset.length])
          .join("");
      }
    } catch {
      // Fallback below
    }

    return Array.from({ length }, () => charset[Math.floor(Math.random() * charset.length)]).join("");
  };

  const handleTrailCityChange = (zoneId: string) => {
    const selected = availableCities.find((c) => String(c.zoneId) === String(zoneId));
    setFormData((prev) => ({
      ...prev,
      zone_id: selected?.zoneId ? String(selected.zoneId) : "",
      city: selected?.name ? String(selected.name) : "",
      state: selected?.state ? String(selected.state) : "",
    }));
  };

  const handleSendOtp = async () => {
    if (!formData.mobile || !/^\d{10}$/.test(formData.mobile)) {
      toast({
        variant: "destructive",
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number.",
      });
      return;
    }

    setIsSendingOtp(true);
    try {
      const response = await sendOtp(formData.mobile, isRegister);
      if (response.success) {
        toast({
          title: "OTP Sent",
          description: `OTP sent to ${formData.mobile}.`,
        });
        setShowOtpModal(true);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Send OTP",
        description: error.response?.data?.message || "Something went wrong.",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpInput) return;

    setIsVerifyingOtp(true);
    try {
      const response = await verifyOtp(formData.mobile, otpInput);
      if (response.success) {
        toast({
          title: "Phone Verified",
          description: "Your mobile number has been verified successfully.",
        });
        setIsPhoneVerified(true);
        setShowOtpModal(false);
        setFormData(prev => ({ ...prev, otp: otpInput }));
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: error.response?.data?.message || "Invalid OTP.",
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleLoginOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.mobile || !/^\d{10}$/.test(formData.mobile)) {
      toast({
        variant: "destructive",
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit mobile number.",
      });
      return;
    }

    setIsSendingLoginOtp(true);
    try {
      const response = await sendOtp(formData.mobile, false);
      if (response.success) {
        toast({
          title: "OTP Sent",
          description: `OTP sent to ${formData.mobile}.`,
        });
        setLoginOtpInput("");
        setShowLoginOtpModal(true);
      } else {
        toast({
          variant: "destructive",
          title: "Failed to Send OTP",
          description: response?.message || "Please try again.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Send OTP",
        description: error.response?.data?.message || "Something went wrong.",
      });
    } finally {
      setIsSendingLoginOtp(false);
    }
  };

  const handleVerifyLoginOtp = async () => {
    if (!loginOtpInput || loginOtpInput.length !== 4) return;

    setIsVerifyingLoginOtp(true);
    try {
      const response = await loginOtp({
        mobile: formData.mobile,
        otp: loginOtpInput,
      });

      const data = response.data || response;

      const token = data.token || response.token || data?.accessToken;
      const role = data.role || response.role;
      const email = data.email || response.email || data?.userEmail;

      if (!token || !role) {
        toast({
          variant: "destructive",
          title: "Login Error",
          description: "Invalid server response. Please try again.",
        });
        return;
      }

      if (["admin", "subadmin", "seo_content"].includes(role)) {
        toast({
          variant: "destructive",
          title: "Use Password Login",
          description: "Admin/SEO users cannot use OTP login. Please switch to Email & Password.",
        });
        setLoginMode("password");
        setShowLoginOtpModal(false);
        return;
      }

      localStorage.setItem("token", token);
      if (email) localStorage.setItem("userEmail", email);
      localStorage.setItem("userRole", role);

      toast({
        title: "Welcome Back!",
        description: "You've successfully signed in.",
      });

      setShowLoginOtpModal(false);
      setLoginOtpInput("");

      navigate("/dashboard");
    } catch (error: any) {
      const message =
        error.response?.data?.data?.message ||
        error.response?.data?.message ||
        "Failed to login.";

      if (String(message).toLowerCase().includes("requires password")) {
        setLoginMode("password");
        setShowLoginOtpModal(false);
      }

      toast({
        variant: "destructive",
        title: "OTP Login Failed",
        description: message,
      });
    } finally {
      setIsVerifyingLoginOtp(false);
    }
  };

  const completeRegistrationFlow = async () => {
    try {
      // Persist any extra details if provided (name/role/city/state etc).
      await updateProfile({ ...formData });
    } catch (err) {
      console.error("Failed to update profile after payment:", err);
    }

    // Meta Pixel: CompleteRegistration
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "CompleteRegistration", {
        value: DEFAULT_PRICE_INR,
        currency: "INR",
        content_name: "BRPL Registration",
        content_type: "registration",
      });
    }

    navigate("/thank-you");
    setIsRegister(false);
  };

  const startPaymentFlow = async (userIdForPayment: string) => {
    // Re-check from server so opening payment in a new tab still applies discount
    let resolvedInfluencerSlug = influencerSlug || localStorage.getItem("brpl_influencer_slug");
    try {
      const prof = await getProfile();
      const pdata = prof?.data || prof;
      if (pdata?.influencerSlug && !pdata?.influencerDiscountApplied) {
        resolvedInfluencerSlug = pdata.influencerSlug;
        localStorage.setItem("brpl_influencer_slug", pdata.influencerSlug);
        setInfluencerSlug(pdata.influencerSlug);
      }
    } catch {
      // ignore profile fetch failure; fallback to local storage/state
    }

    const useInfluencerPayment = !!resolvedInfluencerSlug;
    const amountInr = useInfluencerPayment ? (slugAmountInr ?? DEFAULT_PRICE_INR) : DEFAULT_PRICE_INR;

    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "InitiateCheckout", {
        value: amountInr,
        currency: "INR",
        content_name: "Registration Fee",
        content_type: "product",
      });
    }

    setIsPaymentProcessing(true);
    try {
      let order: { id: string; amount: number; currency: string };
      if (useInfluencerPayment) {
        order = await createOrderRegistrationInfluencer(userIdForPayment);
      } else {
        order = await createLandingOrder(DEFAULT_PRICE_INR);
      }

      const Razorpay = await loadRazorpay();
      const options: any = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_RsBsR05m5SGbtT",
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Beyond Reach Premier League",
        description: useInfluencerPayment ? "Registration Fee (Influencer offer)" : "Registration Fee",
        order_id: order.id,
        handler: async (response: any) => {
          try {
            const resolvedUserId = userIdForPayment || sessionStorage.getItem("brpl_registration_user_id") || "";
            if (useInfluencerPayment) {
              await verifyLandingPaymentInfluencer({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: resolvedUserId,
              });
            } else {
              await verifyLandingPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: resolvedUserId,
                amount: DEFAULT_PRICE_INR,
                isFromLandingPage: false,
              });
            }

            sessionStorage.removeItem("brpl_registration_user_id");
            localStorage.removeItem("brpl_influencer_slug");

            setPaymentId(response.razorpay_payment_id);
            setInfluencerSlug(null);

            if (typeof window !== "undefined" && (window as any).fbq) {
              (window as any).fbq("track", "Purchase", {
                value: amountInr,
                currency: "INR",
                content_name: "Registration Fee",
                content_type: "product",
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                user_id: resolvedUserId,
              });
            }

            toast({
              title: "Payment Successful",
              description: "Payment verified. Your registration is now complete.",
            });

            await completeRegistrationFlow();
          } catch (verifyError: any) {
            console.error("Verification failed", verifyError);
            toast({
              variant: "destructive",
              title: "Payment Verification Failed",
              description: "Contact support if money was deducted.",
            });
          } finally {
            setIsPaymentProcessing(false);
          }
        },
        prefill: {
          name: `${formData.fname} ${formData.lname}`.trim(),
          email: formData.email,
          contact: formData.mobile,
        },
        theme: { color: "#0f172a" },
        modal: { ondismiss: () => setIsPaymentProcessing(false) },
      };

      const rzp = new Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error("Payment initiation failed", error);
      const msg = error.response?.data?.message || error.message || "Unknown error";
      toast({
        variant: "destructive",
        title: "Error",
        description: `Could not initiate payment: ${msg}`,
      });
      setIsPaymentProcessing(false);
    }
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPhoneVerified) {
      toast({
        variant: "destructive",
        title: "Verification Required",
        description: "Please verify your mobile number before proceeding.",
      });
      return;
    }

    if (!formData.email) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please enter your email.",
      });
      return;
    }

    if (!formData.fname) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please enter your full name.",
      });
      return;
    }

    if (!formData.state || !formData.city) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please select your Trail City.",
      });
      return;
    }

    const generatedPassword = formData.password || generatePassword();

    setIsLoading(true);
    try {
      // If user is already created in this session (e.g. went back from Step 2), just update or proceed
      if (userId) {
        await updateProfile(formData);
        toast({ title: "Proceeding to payment", description: "Please complete your checkout." });
        await startPaymentFlow(userId);
        return;
      }

      // Register logic now moved to Step 1
      const trackingId = localStorage.getItem('brpl_tracking_id') || searchParams.get('trackingId');
      const fbclid = localStorage.getItem('brpl_fbclid') || searchParams.get('fbclid');

      const response = await register({
        ...formData,
        referralCodeUsed: formData.referralCode,
        influencerSlug: (influencerSlug || localStorage.getItem("brpl_influencer_slug") || searchParams.get("ref") || "").trim().toLowerCase() || undefined,
        // Password isn't shown in the wireframe; generate and email it after registration.
        password: generatedPassword,
        trackingId,
        fbclid,
        isPaid: false, // Not paid yet
        isFromLandingPage: true, // Triggers email with generated password
      });

      console.log("Step 1 Response:", response);

      const responseData = response.data || response;
      const token = responseData.token || (response.data && response.data.token);
      const newUserId = responseData.userId || (response.data && response.data.userId);
      const email = responseData.email || (response.data && response.data.email);

      // Trigger sync API when: website registration + user unpaid (after account create, before payment)
      if (newUserId) {
        try {
          await storeSyncData({
            ...formData,
            userId: newUserId,
            trackingId,
            fbclid,
            source: 'website_registration',
            isPaid: false
          });
          console.log("User data synced successfully (website registration, unpaid)");
        } catch (syncErr) {
          console.error("Failed to sync user data:", syncErr);
          // We continue even if sync fails, or should we stop? User said "trigger... on synchronous way". 
          // Assuming blocking is desired but failure shouldn't stop the user flow unless critical. 
          // Usually logging is enough.
        }
      }

      console.log("Extracted Data:", { token, newUserId, email });

      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('userEmail', email);
        const idStr = String(newUserId);
        setUserId(idStr);
        sessionStorage.setItem('brpl_registration_user_id', idStr);
        if (responseData.influencerSlug) {
          setInfluencerSlug(responseData.influencerSlug);
          // store in localStorage so it survives across tabs
          localStorage.setItem('brpl_influencer_slug', responseData.influencerSlug);
        }
        toast({ title: "Account Created", description: "Please complete your payment to finish registration." });
        await startPaymentFlow(idStr);
      } else if (newUserId) {
        const idStr = String(newUserId);
        setUserId(idStr);
        sessionStorage.setItem('brpl_registration_user_id', idStr);
        if (responseData.influencerSlug) {
          setInfluencerSlug(responseData.influencerSlug);
          localStorage.setItem('brpl_influencer_slug', responseData.influencerSlug);
        }
        toast({ title: "Account Created", description: "Proceeding to payment." });
        await startPaymentFlow(idStr);
      } else {
        console.error("Critical: No token or userId in response");
        toast({
          variant: "destructive",
          title: "Registration Error",
          description: "Account created but valid response missing. Please try logging in."
        });
      }

    } catch (error: any) {
      console.error("Failed to register step 1", error);
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.response?.data?.message || "Something went wrong. Please try again."
      })
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userIdForPayment = userId || sessionStorage.getItem('brpl_registration_user_id') || '';
    if (!userIdForPayment) {
      toast({
        variant: "destructive",
        title: "Session expired",
        description: "Please complete Step 1 again to proceed to payment.",
      });
      return;
    }

    // Re-check from server so opening payment in a new tab still applies discount
    let resolvedInfluencerSlug = influencerSlug || localStorage.getItem('brpl_influencer_slug');
    try {
      const prof = await getProfile();
      const pdata = prof?.data || prof;
      if (pdata?.influencerSlug && !pdata?.influencerDiscountApplied) {
        resolvedInfluencerSlug = pdata.influencerSlug;
        localStorage.setItem('brpl_influencer_slug', pdata.influencerSlug);
        setInfluencerSlug(pdata.influencerSlug);
      }
    } catch {
      // ignore profile fetch failure; fallback to local storage/state
    }

    const useInfluencerPayment = !!resolvedInfluencerSlug;
    const amountInr = useInfluencerPayment ? (slugAmountInr ?? 999) : DEFAULT_PRICE_INR;

    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "InitiateCheckout", {
        value: amountInr,
        currency: "INR",
        content_name: "Registration Fee",
        content_type: "product",
      });
    }

    setIsPaymentProcessing(true);
    try {
      let order: { id: string; amount: number; currency: string };
      if (useInfluencerPayment) {
        order = await createOrderRegistrationInfluencer(userIdForPayment);
      } else {
        order = await createLandingOrder(DEFAULT_PRICE_INR);
      }

      const Razorpay = await loadRazorpay();
      const options: any = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_RsBsR05m5SGbtT",
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Beyond Reach Premier League",
        description: useInfluencerPayment ? "Registration Fee (Influencer offer)" : "Registration Fee",
        order_id: order.id,
        handler: async (response: any) => {
          const resolvedUserId = userIdForPayment || sessionStorage.getItem('brpl_registration_user_id') || '';
          try {
            if (useInfluencerPayment) {
              await verifyLandingPaymentInfluencer({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: resolvedUserId,
              });
            } else {
              await verifyLandingPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: resolvedUserId,
                amount: DEFAULT_PRICE_INR,
                isFromLandingPage: false,
              });
            }

            sessionStorage.removeItem('brpl_registration_user_id');
            localStorage.removeItem('brpl_influencer_slug');
            setPaymentId(response.razorpay_payment_id);
            if (resolvedUserId && !userId) setUserId(resolvedUserId);
            setInfluencerSlug(null);

            if (typeof window !== "undefined" && (window as any).fbq) {
              (window as any).fbq("track", "Purchase", {
                value: amountInr,
                currency: "INR",
                content_name: "Registration Fee",
                content_type: "product",
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                user_id: resolvedUserId,
              });
            }

            toast({
              title: "Payment Successful",
              description: "Payment verified. Please complete your profile.",
            });
            setCurrentStep(3);
          } catch (verifyError: any) {
            console.error("Verification failed", verifyError);
            toast({
              variant: "destructive",
              title: "Payment Verification Failed",
              description: "Contact support if money was deducted.",
            });
          }
        },
        prefill: {
          name: `${formData.fname} ${formData.lname}`,
          email: formData.email,
          contact: formData.mobile,
        },
        theme: { color: "#0f172a" },
        modal: { ondismiss: () => setIsPaymentProcessing(false) },
      };

      const rzp = new Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error("Payment initiation failed", error);
      const msg = error.response?.data?.message || error.message || "Unknown error";
      toast({
        variant: "destructive",
        title: "Error",
        description: `Could not initiate payment: ${msg}`,
      });
      setIsPaymentProcessing(false);
    }
  };


  // Forgot Password State & Handlers
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  // Password Visibility State
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email address to reset password.",
      });
      return;
    }

    setIsForgotLoading(true);
    try {
      const response = await forgotPassword(forgotEmail);
      if (response.success) {
        toast({
          title: "OTP Sent",
          description: "Password reset OTP has been sent to your email.",
        });
        setForgotStep(2);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed",
        description: error.response?.data?.message || "Failed to send reset OTP.",
      });
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!forgotOtp || !newPassword) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please enter the OTP and your new password.",
      });
      return;
    }

    setIsForgotLoading(true);
    try {
      const response = await resetPassword({
        email: forgotEmail,
        otp: forgotOtp,
        newPassword
      });

      if (response.success) {
        toast({
          title: "Password Reset Successful",
          description: "Your password has been reset. Please login with new password.",
        });
        setShowForgotModal(false);
        setForgotStep(1);
        setForgotEmail("");
        setForgotOtp("");
        setNewPassword("");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: error.response?.data?.message || "Failed to reset password.",
      });
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      if (isRegister) {
        // Step 3: Update Profile
        // User is already created in Step 1.

        await updateProfile({
          ...formData, // Send what's needed
        });

        // Meta Pixel: CompleteRegistration — fire once when full registration is completed
        if (typeof window !== "undefined" && (window as any).fbq) {
          console.log("[Meta Pixel] CompleteRegistration: fbq available, tracking event.");
          (window as any).fbq("track", "CompleteRegistration", {
            value: DEFAULT_PRICE_INR,
            currency: "INR",
            content_name: "BRPL Registration",
            content_type: "registration",
          });
        } else {
          console.warn("[Meta Pixel] CompleteRegistration: fbq NOT available, event not sent.");
        }

        // Navigate to Thank You
        navigate("/thank-you");
        setIsRegister(false);
      } else {
        const response = await login({ email: formData.email, password: formData.password });
        console.log("Login Response:", response);

        const data = response.data || response;

        // Admin 2FA: if OTP required, show OTP step instead of issuing token
        if (data.requireOtp && data.otpToken) {
          setRequireAdminOtp(true);
          setAdminOtpToken(data.otpToken);
          setAdminOtpInput("");
          if (data.qrCodeUrl) {
            setAdminQrCodeUrl(data.qrCodeUrl);
          } else {
            setAdminQrCodeUrl(null);
          }
          setIsLoading(false);
          toast({
            title: data.qrCodeUrl ? "MFA Setup Required" : "Two-Factor Authentication",
            description: data.qrCodeUrl ? "Enrolling device. Scan the QR code." : "Enter the 6-digit code from your authenticator app.",
          });
          return;
        }

        // Handle various potential token paths
        const token = response.token || data?.token || response.accessToken;
        const role = data?.role || response.role;

        console.log("Extracted Token:", token);
        console.log("Extracted Role:", role);

        if (token) {
          localStorage.setItem('token', token);
          localStorage.setItem('userEmail', formData.email);
          if (role) localStorage.setItem('userRole', role);
        } else {
          console.error("No token found in response");
          toast({
            variant: "destructive",
            title: "Login Error",
            description: "No access token received. Please try again or contact support."
          });
          setIsLoading(false);
          return;
        }

        toast({
          title: "Welcome Back!",
          description: "You've successfully signed in.",
        });

        if (['admin', 'subadmin', 'seo_content'].includes(role)) {
          navigate("/admin/dashboard");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: error.response?.data?.data?.message || error.response?.data?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAdminOtp = async (e: React.FormEvent) => {
    debugger
    if (!adminOtpToken || adminOtpInput.length !== 6) {
      toast({ variant: "destructive", title: "Invalid OTP", description: "Enter the 6-digit code from your authenticator app." });
      return;
    }
    setIsVerifyingAdminOtp(true);
    try {
      const response = await verifyAdminOtp(adminOtpToken, adminOtpInput);
      const data = response.data || response;
      const token = data.token || response.token;
      const role = data.role || data.user?.role;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('userEmail', formData.email);
        if (role) localStorage.setItem('userRole', role);
        setRequireAdminOtp(false);
        setAdminOtpToken("");
        setAdminOtpInput("");
        toast({ title: "Welcome Back!", description: "You've successfully signed in." });
        navigate("/admin/dashboard");
      } else {
        toast({ variant: "destructive", title: "Login Error", description: "No token received." });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: err.response?.data?.data?.message || err.response?.data?.message || "Invalid OTP. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] relative overflow-x-hidden flex flex-col">
      <SEO
        title={isRegister ? "Register" : "Login"}
        description={isRegister ? "Create your account to join the Beyond Reach Premier League community." : "Sign in to your Beyond Reach Premier League account."}
      />
      {/* Local keyframes for animated border highlight */}
      <style>{`
        @keyframes borderSweep {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>

      {isRegister && <FloatingRegisterButton />}
      {isRegister && <FloatingWhatsAppButton />}

      {/* Banner + Form Section */}
      <div className="relative w-full">
        {/* Banner Image - sets the height */}
        <img src={getImageUrl(authBannerImage)} alt="" className="w-full h-auto block" loading="eager" />

        {/* Form overlay - positioned over the right side of the banner */}
        <div id="auth-form-container" className="lg:absolute lg:right-0 lg:top-0 lg:bottom-0 lg:w-[45%] flex flex-col items-center justify-center px-4 py-4 lg:px-8 bg-[#0F172A]/40 lg:bg-transparent">
          <div className={`w-full ${isRegister ? 'max-w-xl' : 'max-w-md'}`}>


            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-6 shadow-2xl">
              <div className="text-center mb-4">
                {isRegister ? (
                  <div
                    className="relative inline-block p-[2px] rounded-xl bg-[linear-gradient(90deg,#22C55E,#FFC928,#22C55E)] bg-[length:200%_200%]"
                    style={{ animation: "borderSweep 2.2s linear infinite" }}
                  >
                    <div className="rounded-[10px] bg-[#0F172A]/65 px-6 py-2">
                      <h2 className="text-2xl font-display font-bold text-white drop-shadow-md">
                        Registrations Open
                      </h2>
                    </div>
                  </div>
                ) : (
                  <h2 className="text-2xl font-display font-bold text-white drop-shadow-md">
                    Welcome back
                  </h2>
                )}
                <p className="text-zinc-200 mt-2 font-medium drop-shadow-sm">
                  {isRegister ? "" : "Sign in to continue to your dashboard"}
                </p>
              </div>

              <form
                onSubmit={!isRegister ? (loginMode === "otp" ? handleLoginOtpSubmit : handleSubmit) : handleStep1Submit}
                className="space-y-3"
              >

                {isRegister ? (
                  <div className="space-y-3 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-white font-semibold drop-shadow-sm">
                          Enter Full Name
                        </Label>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => handleFullNameChange(e.target.value)}
                          required
                          placeholder="Enter Full Name"
                          className="h-11 bg-white text-black placeholder:text-gray-500 border-white/20 focus-visible:ring-primary/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-white font-semibold drop-shadow-sm">
                          Enter Email ID
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="Enter Email ID"
                          className="h-11 bg-white text-black placeholder:text-gray-500 border-white/20 focus-visible:ring-primary/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mobile" className="text-white font-semibold drop-shadow-sm">
                        Enter Mobile Number
                      </Label>
                      <div className="relative flex gap-2">
                        <div className="relative flex-1">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground font-medium">+91</span>
                          </div>
                          <Input
                            id="mobile"
                            className="pl-20 h-11 bg-white text-black placeholder:text-gray-500 border-white/20 focus-visible:ring-primary/50"
                            value={formData.mobile}
                            onChange={handleChange}
                            disabled={isPhoneVerified}
                            required
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="Enter Mobile Number"
                          />
                        </div>
                        {isPhoneVerified ? (
                          <Button type="button" variant="outline" className="h-11 border-green-500 text-green-500" disabled>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Verified
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="default"
                            className="h-11"
                            onClick={handleSendOtp}
                            disabled={isSendingOtp || !formData.mobile}
                          >
                            {isSendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send OTP"}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="trailCity" className="text-white font-semibold drop-shadow-sm">
                          Select Trial City
                        </Label>
                        <Select onValueChange={handleTrailCityChange} value={formData.zone_id} required>
                          <SelectTrigger className="h-12 bg-white text-black border-white/20 focus:ring-primary/50">
                            <SelectValue placeholder={isLoadingLocations ? "Loading..." : "Select Trial City"} />
                          </SelectTrigger>
                          <SelectContent position="popper" side="bottom" align="start">
                            {availableCities.length ? (
                              availableCities.map((c) => (
                                <SelectItem key={c.zoneId} value={String(c.zoneId)}>
                                  {c.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="__no_cities__" disabled>
                                {isLoadingLocations ? "Loading..." : "No cities available"}
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="playerRole" className="text-white font-semibold shadow-black/50 drop-shadow-sm">
                          Select Role
                        </Label>
                        <Select
                          onValueChange={(val) => handleSelectChange(val, "playerRole")}
                          value={formData.playerRole}
                          required
                        >
                          <SelectTrigger className="h-12 bg-white text-black border-white/20 focus:ring-primary/50">
                            <SelectValue placeholder="Select Role" />
                          </SelectTrigger>
                          <SelectContent position="popper" side="bottom" align="start">
                            <SelectItem value="Batsman">Batsman</SelectItem>
                            <SelectItem value="Bowler">Bowler</SelectItem>
                            <SelectItem value="Wicket Keeper">Wicket Keeper</SelectItem>
                            <SelectItem value="All-Rounder">All-Rounder</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 pt-2">
                      <input type="checkbox" id="terms" className="mt-1" required />
                      <Label
                        htmlFor="terms"
                        className="text-sm text-zinc-200 font-medium leading-tight cursor-pointer drop-shadow-sm"
                      >
                        I agree to the{" "}
                        <Link to="/terms" className="text-[#FFC928] hover:underline font-bold">
                          Terms and Conditions
                        </Link>{" "}
                        &{" "}
                        <Link to="/privacy" className="text-[#FFC928] hover:underline font-bold">
                          Privacy Policy
                        </Link>
                      </Label>
                    </div>

                    <Button
                      type="submit"
                      variant="default"
                      size="lg"
                      className="w-full mt-2 bg-[#22C55E] hover:bg-[#16A34A] text-black font-bold shadow-[0_4px_20px_rgba(34,197,94,0.35)]"
                      disabled={
                        isLoading ||
                        isPaymentProcessing ||
                        isLoadingLocations ||
                        !isPhoneVerified ||
                        !fullName.trim() ||
                        !formData.email ||
                        !formData.city ||
                        !formData.state ||
                        !formData.playerRole
                      }
                    >
                      {isLoading || isPaymentProcessing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>Submit &amp; Pay ₹{DEFAULT_PRICE_INR}/-</>
                      )}
                    </Button>
                  </div>
                ) : (
                  <>
                    {loginMode === "otp" ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="mobile" className="text-white font-semibold drop-shadow-sm">
                            Mobile Number
                          </Label>
                          <div className="relative flex gap-2">
                            <div className="relative flex-1">
                              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground font-medium">+91</span>
                              </div>
                              <Input
                                id="mobile"
                                className="pl-20 h-11 bg-white text-black placeholder:text-gray-500 border-white/20 focus-visible:ring-primary/50"
                                value={formData.mobile}
                                onChange={handleChange}
                                required
                                inputMode="numeric"
                                maxLength={10}
                                placeholder="Enter Mobile Number"
                              />
                            </div>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          variant="hero"
                          size="lg"
                          className="w-full"
                          disabled={isSendingLoginOtp || isVerifyingLoginOtp || !/^\d{10}$/.test(formData.mobile)}
                        >
                          {isSendingLoginOtp ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin mr-2" />
                              Sending OTP...
                            </>
                          ) : (
                            <>Send Login OTP</>
                          )}
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-white font-semibold drop-shadow-sm">Email or Mobile Number</Label>
                          <div className="relative">
                            {/^\+?\d+$/.test(formData.email) ? (
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            ) : (
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            )}
                            <Input
                              id="email"
                              type="text"
                              placeholder="Email or Mobile"
                              className="pl-12 bg-white text-black placeholder:text-gray-500 border-white/20 focus-visible:ring-primary/50"
                              value={formData.email}
                              onChange={handleChange}
                              required
                              autoComplete="username"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-white font-semibold drop-shadow-sm">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <Input
                              id="password"
                              type={showLoginPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="pl-12 pr-10 bg-white text-black placeholder:text-gray-500 border-white/20 focus-visible:ring-primary/50"
                              value={formData.password}
                              onChange={handleChange}
                              required
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowLoginPassword(!showLoginPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                            >
                              {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setShowForgotModal(true)}
                            className="text-sm text-[#FFC928] hover:underline font-medium drop-shadow-sm"
                          >
                            Forgot Password?
                          </button>
                        </div>

                        <Dialog open={showForgotModal} onOpenChange={(open) => {
                          setShowForgotModal(open);
                          if (!open) setForgotStep(1);
                        }}>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Reset Password</DialogTitle>
                              <DialogDescription>
                                {forgotStep === 1
                                  ? "Enter your email to receive a password reset OTP."
                                  : "Enter the OTP sent to your email and your new password."}
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                              {forgotStep === 1 ? (
                                <div className="space-y-2">
                                  <Label htmlFor="forgot-email">Email Address</Label>
                                  <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                      id="forgot-email"
                                      type="email"
                                      placeholder="Enter your email"
                                      className="pl-9"
                                      value={forgotEmail}
                                      onChange={(e) => setForgotEmail(e.target.value)}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="space-y-2">
                                    <Label htmlFor="forgot-otp">Enter OTP</Label>
                                    <div className="flex justify-center">
                                      <InputOTP
                                        maxLength={4}
                                        value={forgotOtp}
                                        onChange={(value) => setForgotOtp(value)}
                                      >
                                        <InputOTPGroup>
                                          <InputOTPSlot index={0} />
                                          <InputOTPSlot index={1} />
                                          <InputOTPSlot index={2} />
                                          <InputOTPSlot index={3} />
                                        </InputOTPGroup>
                                      </InputOTP>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="new-password">New Password</Label>
                                    <div className="relative">
                                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                      <Input
                                        id="new-password"
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="Enter new password"
                                        className="pl-9 pr-10"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                      >
                                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}

                              <Button
                                className="w-full"
                                onClick={forgotStep === 1 ? handleForgotPassword : handleResetPassword}
                                disabled={isForgotLoading}
                              >
                                {isForgotLoading
                                  ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  : (forgotStep === 1 ? "Send OTP" : "Reset Password")
                                }
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin mr-2" />
                              Signing In...
                            </>
                          ) : (
                            <>Sign In</>
                          )}
                        </Button>
                      </>
                    )}
                  </>
                )}

              </form>

              <div className="mt-3 text-center">
                <p className="text-sm text-white drop-shadow-sm">
                  {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      // Reset when switching modes
                      setCurrentStep(1);
                      if (isRegister) {
                        navigate("/auth");
                      } else {
                        if (forceRegister) {
                          navigate("/registration");
                        } else {
                          navigate("/registration");
                        }
                      }
                    }}
                    className="text-[#FFC928] hover:underline font-bold ml-1"
                  >
                    {isRegister ? "Sign in" : "Register"}
                  </button>
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Marquee Quote - below banner */}
      {authQuote && (
        <div className="relative z-10 w-full bg-[#0F172A] border-y border-[#FFC928]/30 overflow-hidden -mt-[1px]">
          <div
            className="group py-3"
            onMouseEnter={e => {
              const inner = e.currentTarget.querySelector('.marquee-inner') as HTMLElement;
              if (inner) inner.style.animationPlayState = 'paused';
            }}
            onMouseLeave={e => {
              const inner = e.currentTarget.querySelector('.marquee-inner') as HTMLElement;
              if (inner) inner.style.animationPlayState = 'running';
            }}
          >
            <style>{`
              @keyframes marqueeScroll {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
            `}</style>
            <div
              className="marquee-inner flex whitespace-nowrap"
              style={{ animation: 'marqueeScroll 20s linear infinite' }}
            >
              {[...Array(6)].map((_, i) => (
                <span key={i} className="mx-12 text-sm md:text-base bg-gradient-to-r from-[#FFC928] to-[#f59e0b] bg-clip-text text-transparent italic font-semibold cursor-default">
                  "{authQuote}"
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {
        isRegister && (
          <div className="relative z-10">
            <AuthVideoFeed />
            <TrustBar />
            <RoadmapSection />
            <div className="relative z-10 bg-white">
              <RegistrationFAQ />
            </div>
            <RegistrationHero />
          </div>
        )
      }

      {/* OTP Modal */}
      <Dialog open={showOtpModal} onOpenChange={setShowOtpModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Mobile Number</DialogTitle>
            <DialogDescription>
              Enter the OTP sent to {formData.mobile}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="otp-input">OTP</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={4}
                  value={otpInput}
                  onChange={(value) => setOtpInput(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
            <Button onClick={handleVerifyOtp} className="w-full" disabled={isVerifyingOtp || !otpInput || otpInput.length !== 4}>
              {isVerifyingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify OTP"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Player Login OTP Modal */}
      <Dialog
        open={showLoginOtpModal}
        onOpenChange={(open) => {
          setShowLoginOtpModal(open);
          if (!open) setLoginOtpInput("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Login OTP</DialogTitle>
            <DialogDescription>
              Enter the OTP sent to {formData.mobile} to sign in.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="login-otp-input">OTP</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={4}
                  value={loginOtpInput}
                  onChange={(value) => setLoginOtpInput(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <Button
              onClick={handleVerifyLoginOtp}
              className="w-full"
              disabled={isVerifyingLoginOtp || !loginOtpInput || loginOtpInput.length !== 4}
            >
              {isVerifyingLoginOtp ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Verify & Sign in"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Admin 2FA (Google Authenticator) Modal */}
      <Dialog open={requireAdminOtp} onOpenChange={(open) => { if (!open) { setRequireAdminOtp(false); setAdminOtpToken(""); setAdminOtpInput(""); setAdminQrCodeUrl(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{adminQrCodeUrl ? "Setup Two-Factor Authentication" : "Two-Factor Authentication"}</DialogTitle>
            <DialogDescription>
              {adminQrCodeUrl
                ? "Scan the QR code below using your Google Authenticator app, then enter the generated 6-digit code to complete setup."
                : "Enter the 6-digit code from your Google Authenticator app."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {adminQrCodeUrl && (
              <div className="flex justify-center mb-4">
                <img src={adminQrCodeUrl} alt="QR Code for Google Authenticator" className="w-48 h-48 border rounded-lg shadow-sm bg-white p-2" loading="lazy" decoding="async" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Authenticator code</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={adminOtpInput}
                  onChange={(value) => setAdminOtpInput(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
            <Button onClick={handleVerifyAdminOtp} className="w-full" disabled={isVerifyingAdminOtp || adminOtpInput.length !== 6}>
              {isVerifyingAdminOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Sign in"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ResponseModal
        isOpen={responseModal.isOpen}
        onClose={() => setResponseModal(prev => ({ ...prev, isOpen: false }))}
        title={responseModal.title}
        description={responseModal.description}
        type={responseModal.type}
      />
    </div >
  );
};

export default Auth;
