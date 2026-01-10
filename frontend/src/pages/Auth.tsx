import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, CheckCircle2, Phone, Eye, EyeOff, ArrowLeft, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { login, register, sendOtp, verifyOtp, forgotPassword, resetPassword, saveStep1Data } from "@/apihelper/auth";
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
import RegistrationFAQ from "@/components/RegistrationFAQ";
import TrustBar from "@/components/TrustBar";
import RoadmapSection from "@/components/RoadmapSection";
import RegistrationHero from "@/components/RegistrationHero";
import FloatingRegisterButton from "@/components/FloatingRegisterButton";

type AuthProps = {
  forceRegister?: boolean;
};

const Auth = ({ forceRegister }: AuthProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

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


  const [formData, setFormData] = useState({
    email: "",
    password: "",
    // Register specific fields
    fname: "",
    lname: "",
    mobile: "",
    gender: "",
    zone_id: "",
    city: "",
    state: "",
    pincode: "",
    address1: "",
    address2: "",
    otp: "",
    playerRole: "",
    referralCode: "",
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
    if (refCode) {
      setFormData(prev => ({ ...prev, referralCode: refCode }));
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

    setIsLoading(true);
    try {
      // Save incomplete lead data
      const trackingId = localStorage.getItem('brpl_tracking_id') || searchParams.get('trackingId');
      await saveStep1Data({
        name: `${formData.fname} ${formData.lname}`,
        mobile: formData.mobile,
        role: formData.playerRole,
        state: formData.state,
        city: formData.city,
        trackingId
      });
      setCurrentStep(2);
    } catch (error) {
      console.error("Failed to save step 1", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again."
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
        key: "rzp_live_RsBsR05m5SGbtT", // Should optimally be in env vars
        amount: order.amount,
        currency: order.currency,
        name: "Beyond Reach Premier League",
        description: "Registration Fee",
        order_id: order.id,
        handler: async (response: any) => {
          try {
            // Verify payment on backend (optional but recommended before proceeding)
            // For registration flow, we might just store the ID and verify at final submit
            // But step 3 needs to know it's paid.
            // Let's verify here to be safe and get a confirmed status.

            // Note: verifyLandingPayment usually expects a userId. 
            // Since we don't have a user yet, we might just want to carry the paymentId forward.
            // However, the existing verifyLandingPayment might fail if it needs a userId.
            // Checking the backend authController implementation would be good, 
            // but assuming we just need the paymentId for the register call.

            setPaymentId(response.razorpay_payment_id);
            toast({
              title: "Payment Successful",
              description: "Payment verified. Please complete your account details.",
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
        // Collect tracking data from localStorage or URL
        const trackingId = localStorage.getItem('brpl_tracking_id') || searchParams.get('trackingId');
        const fbclid = localStorage.getItem('brpl_fbclid') || searchParams.get('fbclid');

        await register({
          ...formData,
          referralCodeUsed: formData.referralCode,
          trackingId,
          fbclid,
          isPaid: true,
          paymentId: paymentId,
          paymentAmount: 1499
        });
        // Removed success toast as per requirement
        navigate("/thank-you");
        setIsRegister(false);
      } else {
        const response = await login({ email: formData.email, password: formData.password });

        // Handle various potential token paths
        const token = response.token || response.data?.token || response.accessToken;

        if (token) {
          localStorage.setItem('token', token);
          localStorage.setItem('userEmail', formData.email);
        } else {
          console.error("No token found in response");
        }

        toast({
          title: "Welcome Back!",
          description: "You've successfully signed in.",
        });

        if (response.data?.role === 'admin' || response.role === 'admin') {
          navigate("/admin/dashboard");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.response?.data?.message || "Something went wrong. Please try again.",
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
      {isRegister && <FloatingRegisterButton />}

      {/* Main Content Area (Split View) */}
      <div className="flex flex-col lg:flex-row flex-1 w-full min-h-[calc(100vh-80px)] relative z-20">

        {/* Full Screen Background Image - Scoped to this section */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/50 z-10" /> {/* Dark Overlay */}
          <div className="absolute inset-0 bg-cover bg-no-repeat bg-center" style={{ backgroundImage: "url('/register-footer-2.png')" }} />
        </div>

        {/* Left Panel - Branding (Hidden on mobile) */}
        <div className="flex flex-1 flex-col justify-between p-6 lg:p-12 relative overflow-hidden z-10 w-full lg:w-auto min-h-[300px] lg:min-h-auto items-center text-center lg:items-start lg:text-left">
          {/* Background Image REMOVED from here */}

          <div className="relative z-10 mt-12 lg:mt-32">
            <h1 className="text-3xl lg:text-7xl font-extrabold text-white mb-6 drop-shadow-xl leading-tight uppercase font-display">
              Join BRPL <br /> <span className="text-[#FFC928]">League 2026</span>
            </h1>
            <div className="inline-flex items-center gap-3 bg-black/30 backdrop-blur-sm px-6 py-3 rounded-full border border-white/10">
              <p className="text-lg lg:text-2xl font-bold text-white tracking-wide drop-shadow-md">
                Limited Slots in your City
              </p>
              {/* <span className="text-2xl animate-pulse">⏳</span> */}
            </div>
          </div>

          <div className="relative z-10">
            {/* Placeholder */}
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
                          <Label htmlFor="playerRole" className="text-white font-semibold shadow-black/50 drop-shadow-sm">Select Your Playing Role</Label>
                          <Select onValueChange={(val) => handleSelectChange(val, 'playerRole')} value={formData.playerRole} required>
                            <SelectTrigger className="h-12 bg-white text-black border-white/20 focus:ring-primary/50">
                              <SelectValue placeholder="Choose your playing role" />
                            </SelectTrigger>
                            <SelectContent position="popper" side="bottom" align="start" className="max-h-[300px]">
                              <SelectItem value="Opener">Opener</SelectItem>
                              <SelectItem value="Middle-order batter">Middle-order batter</SelectItem>
                              <SelectItem value="Finisher">Finisher</SelectItem>
                              <SelectItem value="Fast bowler">Fast bowler</SelectItem>
                              <SelectItem value="Swing bowler">Swing bowler</SelectItem>
                              <SelectItem value="Yorker specialist">Yorker specialist</SelectItem>
                              <SelectItem value="Off spinner">Off spinner</SelectItem>
                              <SelectItem value="Leg spinner">Leg spinner</SelectItem>
                              <SelectItem value="Left-arm spinner">Left-arm spinner</SelectItem>
                              <SelectItem value="Chinaman">Chinaman</SelectItem>
                              <SelectItem value="All-rounder">All-rounder</SelectItem>
                              <SelectItem value="Wicketkeeper batsman">Wicketkeeper batsman</SelectItem>
                              <SelectItem value="Fielding specialist">Fielding specialist</SelectItem>
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
                            <Label htmlFor="city" className="text-white font-semibold drop-shadow-sm">Trial City</Label>
                            <Input id="city" value={formData.city} onChange={handleChange} required placeholder="Trial City" className="h-11 bg-white text-black placeholder:text-gray-500 border-white/20 focus-visible:ring-primary/50" />
                          </div>
                        </div>

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
                    {currentStep === 3 && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-white font-semibold drop-shadow-sm">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <Input id="email" type="email" className="pl-9 h-11 bg-white text-black placeholder:text-gray-500 border-white/20 focus-visible:ring-primary/50" value={formData.email} onChange={handleChange} required placeholder="Enter Email" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="gender" className="text-white font-semibold drop-shadow-sm">Gender</Label>
                            <Select onValueChange={(val) => handleSelectChange(val, 'gender')} value={formData.gender}>
                              <SelectTrigger className="h-11 bg-white text-black border-white/20 focus:ring-primary/50">
                                <SelectValue placeholder="Select Gender" />
                              </SelectTrigger>
                              <SelectContent position="popper" side="bottom" align="start">
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="password" className="text-white font-semibold drop-shadow-sm">Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                              <Input
                                id="password"
                                type={showRegisterPassword ? "text" : "password"}
                                className="pl-9 pr-10 h-11 bg-white text-black placeholder:text-gray-500 border-white/20 focus-visible:ring-primary/50"
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
                          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Registration"}
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
                      <Label htmlFor="email" className="text-foreground">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          className="pl-12"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          autoComplete="off"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-foreground">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showLoginPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-12 pr-10"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-sm text-primary hover:underline font-medium"
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
                <p className="text-sm text-muted-foreground">
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
                          navigate("/auth?mode=register");
                        }
                      }
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    {isRegister ? "Sign in" : "Register"}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isRegister && (
        <>
          <TrustBar />
          <RoadmapSection />
          <div className="relative z-10 bg-white">
            <RegistrationFAQ />
          </div>
          <RegistrationHero />
        </>
      )}

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
    </div>
  );
};

export default Auth;
