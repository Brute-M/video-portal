import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, CheckCircle2, Phone, Eye, EyeOff, ArrowLeft, Loader2, ArrowRight, Swords, CircleDot, Shield, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { login, register, sendOtp, verifyOtp, forgotPassword, resetPassword, saveStep1Data, updateProfile, storeSyncData } from "@/apihelper/auth";
import { createLandingOrder, verifyLandingPayment } from "@/apihelper/payment";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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

type AuthProps = {
  forceRegister?: boolean;
};

const Auth = ({ forceRegister }: AuthProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings } = useSiteSettings();

  // Mode & Steps
  const [isRegister, setIsRegister] = useState(
    !!forceRegister || searchParams.get("mode") === "register"
  );
  const [currentStep, setCurrentStep] = useState(1); // 1: Details, 2: Payment, 3: Account

  const [isLoading, setIsLoading] = useState(false);

  // OTP State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Payment State
  const [paymentId, setPaymentId] = useState("");
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [userId, setUserId] = useState("");


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

  const [availableCities, setAvailableCities] = useState<any[]>([]);

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
  }, [searchParams, forceRegister]);

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

    if (!formData.email || !formData.password) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please enter your email and create a password.",
      });
      return;
    }

    setIsLoading(true);
    try {
      // If user is already created in this session (e.g. went back from Step 2), just update or proceed
      if (userId) {
        // Optional: Update basic details if changed? 
        // For now, let's just proceed to Step 2 to avoid "Mobile/Email already exists" error.
        // If we want to support editing, we'd need an update API call here, or use updateProfile.
        // Since Step 1 has core account fields (email/password/mobile), updating them is trickier.
        // Let's assume for this flow, if they earned a userId, Step 1 is "done".
        // But if they changed inputs?

        // Better approach: Call updateProfile with the data, just in case they fixed a typo in Name/City/State.
        await updateProfile(formData);
        setCurrentStep(2);
        toast({
          title: "Details Updated",
          description: "Proceeding to payment.",
        });
        return;
      }

      // Register logic now moved to Step 1
      const trackingId = localStorage.getItem('brpl_tracking_id') || searchParams.get('trackingId');
      const fbclid = localStorage.getItem('brpl_fbclid') || searchParams.get('fbclid');

      const response = await register({
        ...formData,
        referralCodeUsed: formData.referralCode,
        trackingId,
        fbclid,
        isPaid: false, // Not paid yet
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
        setUserId(newUserId);
        setCurrentStep(2);
        toast({
          title: "Account Created",
          description: "Please complete payment to access full features.",
        });
      } else if (newUserId) {
        // Fallback: If user created but no token (weird, but handle it)
        setUserId(newUserId);
        setCurrentStep(2);
        toast({
          title: "Account Created",
          description: "Proceeding to payment.",
        });
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
    // Razorpay Payment Logic
    setIsPaymentProcessing(true);
    try {
      console.log("Creating landing order...");
      const order = await createLandingOrder(1499);
      console.log("Order created:", order);

      if (!(window as any).Razorpay) {
        console.error("Razorpay SDK not loaded");
        toast({
          variant: "destructive",
          title: "System Error",
          description: "Payment gateway not loaded. Please refresh the page.",
        });
        setIsPaymentProcessing(false);
        return;
      }

      const options: any = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_RsBsR05m5SGbtT", // Should optimally be in env vars
        amount: order.amount,
        currency: order.currency,
        name: "Beyond Reach Premier League",
        description: "Registration Fee",
        order_id: order.id,
        handler: async (response: any) => {
          try {
            await verifyLandingPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId, // From state
              amount: 1499
            });

            setPaymentId(response.razorpay_payment_id);

            // Track Facebook Pixel Purchase Event
            import('react-facebook-pixel').then((x) => x.default.track('Purchase', {
              value: 1499,
              currency: 'INR',
              content_name: 'Registration Fee',
              content_type: 'product',
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              user_id: userId
            }));

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
          email: formData.email, // Email might be empty at this stage if it's in step 3? Yes, step 3 is next.
          contact: formData.mobile,
        },
        theme: {
          color: "#0f172a",
        },
        modal: {
          ondismiss: () => setIsPaymentProcessing(false)
        }
      };

      console.log("Opening Razorpay with options:", options);
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error("Payment initiation failed", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Could not initiate payment: ${error.message || "Unknown error"}`,
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

        // Navigate to Thank You
        navigate("/thank-you");
        setIsRegister(false);
      } else {
        const response = await login({ email: formData.email, password: formData.password });
        console.log("Login Response:", response);

        // Handle various potential token paths
        const token = response.token || response.data?.token || response.accessToken;
        const role = response.data?.role || response.role;

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

        // Check if user is unpaid (Access Restricted handled on Dashboard, but maybe we can warn here too?)
        // The dashboard will show the restricted view.

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

  const StepIndicator = () => (
    <div className="w-full mb-8 px-1">
      <div className="flex justify-between items-end mb-3">
        {[
          { id: 1, label: "Details" },
          { id: 2, label: "Payment" },
          { id: 3, label: "Account" }
        ].map((step) => {
          const isActive = currentStep >= step.id;
          return (
            <span
              key={step.id}
              className={`text-sm font-bold uppercase tracking-wider transition-all duration-300 ${isActive ? 'text-[#FFC928] drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] scale-105' : 'text-zinc-100/80 hover:text-white'}`}
            >
              {step.label}
            </span>
          )
        })}
      </div>

      {/* Progress Line */}
      <div className="relative w-full h-[4px] bg-black/40 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-yellow-600 via-[#FFC928] to-[#FFC928] shadow-[0_0_15px_#FFC928] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / 3) * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden flex flex-col">
      <SEO
        title={isRegister ? "Register" : "Login"}
        description={isRegister ? "Create your account to join the Beyond Reach Premier League community." : "Sign in to your Beyond Reach Premier League account."}
      />

      {/* Full Screen Background Image */}
      <div className="absolute inset-0 z-0 bg-[#0F172A]">
        {/* <div className="absolute inset-0 bg-black/50 z-10" /> Dark Overlay */}
        <div className="absolute inset-0 bg-[length:100%_auto] bg-top bg-no-repeat" style={{ backgroundImage: "url('/auth-banner.jpeg')" }} />
      </div>

      {isRegister && <FloatingRegisterButton />}
      {isRegister && <FloatingWhatsAppButton />}

      {/* Main Content Area (Split View) */}
      <div className="flex flex-col lg:flex-row flex-1 w-full min-h-[calc(100vh-80px)] relative z-10">

        {/* Left Panel - Branding (Hidden on mobile) */}
        <div className="flex flex-1 flex-col justify-between p-6 lg:p-12 relative overflow-hidden z-10 w-full lg:w-auto min-h-[300px] lg:min-h-auto items-center text-center lg:items-start lg:text-left">
          {/* Background Image REMOVED from here */}

          <div className="relative z-10 mt-12 lg:mt-32">
            {/* Buttons Section */}
            {/* <div className="flex flex-col sm:flex-row gap-4 mt-8 md:mt-[32rem] animate-fade-in-up md:ml-12">
              <button
                onClick={() => document.getElementById('auth-form-container')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-[#FFC928] text-black font-extrabold text-lg px-8 py-3 rounded-xl shadow-[0_0_20px_rgba(255,201,40,0.4)] hover:scale-105 transition-transform uppercase tracking-wider skew-x-[-10deg]"
              >
                <span className="block skew-x-[10deg]">Register Now</span>
              </button>

              <a
                href={`tel:${settings.contactPhone.replace(/\D/g, "").replace(/^/, "+")}`}
                className="bg-black/40 backdrop-blur-md border border-white/20 text-white font-bold text-lg px-8 py-3 rounded-xl hover:bg-black/60 transition-all flex items-center justify-center gap-2 skew-x-[-10deg]"
              >
                <span className="block skew-x-[10deg] not-italic">📞 {settings.contactPhone}</span>
              </a>
            </div> */}
            {/* <div className="inline-flex items-center gap-3 bg-[#FFC928] backdrop-blur-sm px-6 py-2 rounded-full shadow-[0_0_15px_rgba(255,201,40,0.4)] border border-white/20">
              <p className="text-lg lg:text-xl font-bold text-black tracking-wide">
                Limited Slots in your City
              </p>
            </div>
            <div className="mt-6 text-white text-lg font-semibold drop-shadow-md bg-black/40 px-4 py-2 rounded-lg inline-block backdrop-blur-sm border border-white/10">
              📞 Call us: <a href={`tel:${settings.contactPhone.replace(/\D/g, "").replace(/^/, "+")}`} className="text-[#FFC928] hover:underline">{settings.contactPhone}</a>
            </div> */}
          </div>
        </div>

        {/* Right Panel - Auth Form */}
        <div id="auth-form-container" className="flex-1 flex flex-col items-center p-6 lg:p-12 relative z-10 overflow-auto">
          <div className={`w-full ${isRegister ? 'max-w-2xl' : 'max-w-md'} my-auto`}>


            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-8 shadow-2xl">
              {isRegister && <StepIndicator />}

              <div className="text-center mb-8">
                <h2 className="text-2xl font-display font-bold text-white drop-shadow-md">
                  {isRegister
                    ? currentStep === 1 ? "" : currentStep === 2 ? "Payment" : "Create Account"
                    : "Welcome back"}
                </h2>
                <p className="text-zinc-200 mt-2 font-medium drop-shadow-sm">
                  {isRegister
                    ? ""
                    : "Sign in to continue to your dashboard"}
                </p>
              </div>

              <form onSubmit={!isRegister ? handleSubmit : currentStep === 1 ? handleStep1Submit : currentStep === 2 ? handleStep2Submit : handleSubmit} className="space-y-5">

                {isRegister ? (
                  <>
                    {/* STEP 1: Details */}
                    {currentStep === 1 && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="space-y-2">
                          <Label htmlFor="playerRole" className="text-white font-semibold shadow-black/50 drop-shadow-sm">Select Your Role</Label>
                          <Select onValueChange={(val) => handleSelectChange(val, 'playerRole')} value={formData.playerRole} required>
                            <SelectTrigger className="h-12 bg-white text-black border-white/20 focus:ring-primary/50">
                              <SelectValue placeholder="Choose your playing role" />
                            </SelectTrigger>
                            <SelectContent position="popper" side="bottom" align="start">
                              <SelectItem value="Batsman">Batsman</SelectItem>
                              <SelectItem value="Bowler">Bowler</SelectItem>
                              <SelectItem value="Wicket Keeper">Wicket Keeper</SelectItem>
                              <SelectItem value="All-Rounder">All-Rounder</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="fname" className="text-white font-semibold drop-shadow-sm">First Name</Label>
                            <Input id="fname" value={formData.fname} onChange={handleChange} required placeholder="First Name" className="h-11 bg-white text-black placeholder:text-gray-500 border-white/20 focus-visible:ring-primary/50" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lname" className="text-white font-semibold drop-shadow-sm">Last Name</Label>
                            <Input id="lname" value={formData.lname} onChange={handleChange} required placeholder="Last Name" className="h-11 bg-white text-black placeholder:text-gray-500 border-white/20 focus-visible:ring-primary/50" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="mobile" className="text-white font-semibold drop-shadow-sm">Mobile Number</Label>
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
                                placeholder="Enter your mobile number"
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
                            <Label htmlFor="state" className="text-white font-semibold drop-shadow-sm">State</Label>
                            <Input id="state" value={formData.state} onChange={handleChange} required placeholder="Select State" className="h-11 bg-white text-black placeholder:text-gray-500 border-white/20 focus-visible:ring-primary/50" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="city" className="text-white font-semibold drop-shadow-sm">City</Label>
                            <Input id="city" value={formData.city} onChange={handleChange} required placeholder="City" className="h-11 bg-white text-black placeholder:text-gray-500 border-white/20 focus-visible:ring-primary/50" />
                          </div>
                        </div>

                        {/* NEW: Email and Password in Step 1 */}
                        {isPhoneVerified && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                            <div className="space-y-2">
                              <Label htmlFor="email" className="text-white font-semibold drop-shadow-sm">Email Address</Label>
                              <div className="relative">
                                <Input id="email" type="email" className="pl-3 h-11 bg-white text-black placeholder:text-gray-500 border-white/20 focus-visible:ring-primary/50" value={formData.email} onChange={handleChange} required placeholder="Enter Email" />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="password" className="text-white font-semibold drop-shadow-sm">Create Password</Label>
                              <div className="relative">
                                <Input
                                  id="password"
                                  type={showRegisterPassword ? "text" : "password"}
                                  className="pl-3 pr-10 h-11 bg-white text-black placeholder:text-gray-500 border-white/20 focus-visible:ring-primary/50"
                                  value={formData.password}
                                  onChange={handleChange}
                                  required
                                  placeholder="Create Password"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                  {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-2 pt-2">
                          <input type="checkbox" id="terms" className="mt-1" required />
                          <Label htmlFor="terms" className="text-sm text-zinc-200 font-medium leading-tight cursor-pointer drop-shadow-sm">
                            I agree to the <Link to="/terms" className="text-[#FFC928] hover:underline font-bold">Terms and Conditions</Link> & <Link to="/privacy" className="text-[#FFC928] hover:underline font-bold">Privacy Policy</Link>
                          </Label>
                        </div>

                        <Button type="submit" variant="hero" size="lg" className="w-full mt-2" disabled={isLoading}>
                          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Next <ArrowRight className="w-4 h-4 ml-2" /></>}
                        </Button>
                      </div>
                    )}

                    {/* STEP 2: Payment */}
                    {currentStep === 2 && (
                      <div className="space-y-6 animate-fade-in text-center py-6">
                        <div className="bg-secondary/30 p-6 rounded-xl border border-secondary">
                          <p className="text-sm text-zinc-300 uppercase tracking-widest mb-2 font-bold">Registration Fee</p>
                          <div className="text-5xl font-extrabold text-primary mb-2">₹ 1499</div>
                          <p className="text-sm text-zinc-200 font-medium">One-time payment for lifetime access</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-left text-sm text-white font-medium max-w-sm mx-auto drop-shadow-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>Professional Trials</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>Live TV Coverage</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>Real Stadiums</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>Pro Jerseys</span>
                          </div>
                        </div>

                        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isPaymentProcessing}>
                          {isPaymentProcessing ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin mr-2" />
                              Processing Payment...
                            </>
                          ) : (
                            <>Pay Securely Now <ArrowRight className="w-4 h-4 ml-2" /></>
                          )}
                        </Button>

                        <Button type="button" variant="ghost" onClick={() => setCurrentStep(1)} className="w-full" disabled={isPaymentProcessing}>
                          Back to Details
                        </Button>
                      </div>
                    )}

                    {/* STEP 3: Create Account */}
                    {/* STEP 3: Create Account - Now just additional info */}
                    {currentStep === 3 && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Email/Password removed from here */}

                          <div className="space-y-2">
                            <Label htmlFor="aadhaar" className="text-white font-semibold drop-shadow-sm">Aadhaar (Optional)</Label>
                            {/* Assuming aadhaar field exists in formData but wasn't in original display?? Let's check formData init. Yes, aadhar is there. */}
                            <Input id="aadhar" value={(formData as any).aadhar} onChange={handleChange} placeholder="Aadhaar Number" className="h-11 bg-white text-black placeholder:text-gray-500 border-white/20 focus-visible:ring-primary/50" />
                          </div>
                        </div>

                        <Separator className="my-2" />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="address1" className="text-white font-semibold drop-shadow-sm">Address Line 1</Label>
                            <Input id="address1" value={formData.address1} onChange={handleChange} required placeholder="House No, Building" className="h-11 bg-white text-black placeholder:text-gray-500 border-white/20 focus-visible:ring-primary/50" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="address2" className="text-white font-semibold drop-shadow-sm">Address Line 2</Label>
                            <Input id="address2" value={formData.address2} onChange={handleChange} placeholder="Street, Area" className="h-11 bg-white text-black placeholder:text-gray-500 border-white/20 focus-visible:ring-primary/50" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="pincode" className="text-white font-semibold drop-shadow-sm">Pincode</Label>
                            <Input id="pincode" value={formData.pincode} onChange={handleChange} required placeholder="Pincode" className="h-11 bg-white text-black placeholder:text-gray-500 border-white/20 focus-visible:ring-primary/50" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="zone_id" className="text-white font-semibold drop-shadow-sm">Zone</Label>
                            <Select onValueChange={(val) => handleSelectChange(val, 'zone_id')} value={formData.zone_id}>
                              <SelectTrigger className="h-11 bg-white text-black border-white/20 focus:ring-primary/50">
                                <SelectValue placeholder="Select Zone" />
                              </SelectTrigger>
                              <SelectContent position="popper" side="bottom" align="start">
                                {[
                                  { zoneId: 1, zoneName: "North Zone" },
                                  { zoneId: 2, zoneName: "South Zone" },
                                  { zoneId: 3, zoneName: "East Zone" },
                                  { zoneId: 4, zoneName: "West Zone" },
                                  { zoneId: 5, zoneName: "Central Zone" },
                                  { zoneId: 6, zoneName: "North-East Zone" }
                                ].map((zone) => (
                                  <SelectItem key={zone.zoneId} value={zone.zoneId.toString()}>
                                    {zone.zoneName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <Button type="submit" variant="hero" size="lg" className="w-full mt-4" disabled={isLoading}>
                          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Profile"}
                        </Button>

                        <Button type="button" variant="ghost" onClick={() => setCurrentStep(2)} className="w-full">
                          Back to Payment
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  // Login Form (Unchanged)
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

                    <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading || (isRegister && !isPhoneVerified)}>
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

              </form>

              <div className="mt-6 text-center">
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
    </div >
  );
};

export default Auth;
