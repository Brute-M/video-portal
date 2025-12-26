import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Mail, Lock, User, ArrowLeft, Loader2, Phone, MapPin, FileDigit, KeyRound, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { login, register, sendOtp, verifyOtp, forgotPassword, resetPassword } from "@/apihelper/auth";

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

type AuthProps = {
  forceRegister?: boolean;
};



const Auth = ({ forceRegister }: AuthProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRegister, setIsRegister] = useState(
    !!forceRegister || searchParams.get("mode") === "register"
  );
  const [isLoading, setIsLoading] = useState(false);

  // OTP State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

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
    // aadhar: "",
    otp: "",
    playerRole: "",
    referralCode: "", // Add referralCode field
  });

  const [locations, setLocations] = useState<any[]>([]);
  const [availableCities, setAvailableCities] = useState<any[]>([]);

  // const fetchLocations = async () => {
  //   console.log("Fetching locations...");
  //   try {
  //     const data = await getStatesAPI();
  //     console.log("States fetched from API:", data);

  //     if (Array.isArray(data) && data.length > 0) {
  //       setLocations(data);
  //     } else {
  //       console.warn("API returned empty/invalid data, using mock data.");
  //       // Map mock data to match expected structure { id, name }
  //       setLocations(MOCK_LOCATIONS.map(l => ({ id: l.state === "Uttar Pradesh" ? "UP" : "MOCK", name: l.state })));
  //     }
  //   } catch (e) {
  //     console.error("Failed to load locations from API, using mock data.", e);
  //     setLocations(MOCK_LOCATIONS.map(l => ({ id: l.state === "Uttar Pradesh" ? "UP" : "MOCK", name: l.state })));
  //   }
  // };

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
    // Reset phone verification if number changes (handled above for mobile specific)
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
      const response = await sendOtp(formData.mobile);
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

    if (isRegister && !isPhoneVerified) {
      toast({
        variant: "destructive",
        title: "Verification Required",
        description: "Please verify your mobile number before registering.",
      });
      return;
    }

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
          fbclid
        });
        // Removed success toast as per requirement
        navigate("/thank-you");
        setIsRegister(false);
      } else {
        const response = await login({ email: formData.email, password: formData.password });
        console.log("Login Response:", response);

        // Handle various potential token paths
        const token = response.token || response.data?.token || response.accessToken;

        if (token) {
          localStorage.setItem('token', token);
          localStorage.setItem('userEmail', formData.email);
          console.log("Token saved:", token);
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

  return (
    <div className="min-h-screen bg-background flex">
      <SEO
        title={isRegister ? "Register" : "Login"}
        description={isRegister ? "Create your account to join the Beyond Reach Premier League community." : "Sign in to your Beyond Reach Premier League account."}
      />
      {/* Hero gradient overlay */}
      <div className="hero-gradient fixed inset-0 pointer-events-none" />

      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/auth1.png')" }} />

        <Link to="/" className="relative z-10 flex items-center gap-2">
          <img src="/logo.png" alt="BRPL Logo" className="w-80 h-80 object-contain" />
        </Link>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-2xl font-bold text-white mb-6">
            Start your Innings with BRPL
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-md leading-relaxed">
            Show your talent, represent your zone, and step into the spotlight on TV.
          </p>

          <div className="flex items-center gap-2 mt-4">
            <span className="text-5xl lg:text-6xl font-extrabold text-[#FFC928] drop-shadow-md ml-auto block w-fit">₹ 1499</span>
          </div>
        </div>

        {/* Removed the bottom "Join 500+ Teams" section as it wasn't in the provided image/request focus which emphasized the price and main content */}
        <div className="relative z-10">
          {/* Placeholder for spacing if needed, or remove completely if not needed at bottom */}
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10 overflow-auto">
        <div className={`w-full ${isRegister ? 'max-w-2xl' : 'max-w-md'}`}>
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            <span className="text-muted-foreground">Back to home</span>
          </Link>

          <div className="glass-card p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-display font-bold text-foreground">
                {isRegister ? "Create your account" : "Welcome back"}
              </h2>
              <p className="text-muted-foreground mt-2">
                {isRegister
                  ? "Join our community of creators"
                  : "Sign in to continue to your dashboard"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {isRegister ? (
                <>
                  {/* Personal Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fname" className="text-foreground">First Name</Label>
                      <Input id="fname" value={formData.fname} onChange={handleChange} required placeholder="Enter First Name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lname" className="text-foreground">Last Name</Label>
                      <Input id="lname" value={formData.lname} onChange={handleChange} required placeholder="Enter Last Name" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="email" type="email" className="pl-9" value={formData.email} onChange={handleChange} required placeholder="Enter Email" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile" className="text-foreground">Mobile</Label>
                      <div className="relative flex gap-2">
                        <div className="relative flex-1">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground font-medium">+91</span>
                          </div>
                          <Input
                            id="mobile"
                            className="pl-20"
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
                          <Button type="button" variant="outline" className="border-green-500 text-green-500" disabled>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Verified
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={handleSendOtp}
                            disabled={isSendingOtp || !formData.mobile}
                          >
                            {isSendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gender" className="text-foreground">Gender</Label>
                      <Select onValueChange={(val) => handleSelectChange(val, 'gender')} value={formData.gender}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-foreground">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showRegisterPassword ? "text" : "password"}
                          className="pl-9 pr-10"
                          value={formData.password}
                          onChange={handleChange}
                          required
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

                  <div className="space-y-2 mt-4">
                    <Label htmlFor="playerRole" className="text-foreground">Player Role</Label>
                    <Select onValueChange={(val) => handleSelectChange(val, 'playerRole')} value={formData.playerRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Player Role" />
                      </SelectTrigger>
                      <SelectContent>
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
                        <SelectItem value="All-rounder">All-rounder (batting / bowling / spin / pace)</SelectItem>
                        <SelectItem value="Wicketkeeper batsman">Wicketkeeper batsman</SelectItem>
                        <SelectItem value="Fielding specialist">Fielding specialist</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>



                  <Separator className="my-2" />

                  <Separator className="my-2" />

                  {/* Address Info & Zone Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address1" className="text-foreground">Address Line 1</Label>
                      <Input id="address1" value={formData.address1} onChange={handleChange} required placeholder="Enter Address Line 1" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address2" className="text-foreground">Address Line 2</Label>
                      <Input id="address2" value={formData.address2} onChange={handleChange} placeholder="Enter Address Line 2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-foreground">State</Label>
                      <Input id="state" value={formData.state} onChange={handleChange} required placeholder="Enter State" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-foreground">City</Label>
                      <Input id="city" value={formData.city} onChange={handleChange} required placeholder="Enter City" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pincode" className="text-foreground">Pincode</Label>
                      <Input id="pincode" value={formData.pincode} onChange={handleChange} required placeholder="Enter Pincode" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zone_id" className="text-foreground">Zone</Label>
                      <Select onValueChange={(val) => handleSelectChange(val, 'zone_id')} value={formData.zone_id}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Zone" />
                        </SelectTrigger>
                        <SelectContent>
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

                  <div className="space-y-2">
                    <Label htmlFor="referralCode" className="text-foreground">Referral Code (Optional)</Label>
                    <Input id="referralCode" value={formData.referralCode} onChange={handleChange} placeholder="Enter Code (e.g. EARNYOURJERSEY2025)" />
                  </div>

                  <Separator className="my-2" />


                </>
              ) : (
                // Login Form
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

                  {/* Forgot Password Modal */}
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

                </>
              )}

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading || (isRegister && !isPhoneVerified)}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    {isRegister ? "Creating Account..." : "Signing In..."}
                  </>
                ) : (
                  <>{isRegister ? "Create Account" : "Sign In"}</>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
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
            <Button
              className="w-full"
              onClick={handleVerifyOtp}
              disabled={isVerifyingOtp || !otpInput}
            >
              {isVerifyingOtp ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Verify OTP"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default Auth;
