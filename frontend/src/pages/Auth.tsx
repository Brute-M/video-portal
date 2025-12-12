import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Mail, Lock, User, ArrowLeft, Loader2, Phone, MapPin, FileDigit, KeyRound, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { login, register, sendOtp, verifyOtp } from "@/apihelper/auth";
import { getLocationsAPI } from "@/apihelper/location";
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

// Mock data as fallback
const MOCK_LOCATIONS = [
  {
    state: "Uttar Pradesh",
    cities: [
      { name: "Noida", zoneId: "UP-ZN-01" },
      { name: "Lucknow", zoneId: "UP-ZN-02" },
      { name: "Ghaziabad", zoneId: "UP-ZN-03" }
    ]
  },
  {
    state: "Delhi",
    cities: [
      { name: "New Delhi", zoneId: "DL-ZN-01" },
      { name: "South Delhi", zoneId: "DL-ZN-02" }
    ]
  },
  {
    state: "Maharashtra",
    cities: [
      { name: "Mumbai", zoneId: "MH-ZN-01" },
      { name: "Pune", zoneId: "MH-ZN-02" }
    ]
  },
  {
    state: "Karnataka",
    cities: [
      { name: "Bangalore", zoneId: "KA-ZN-01" },
      { name: "Mysore", zoneId: "KA-ZN-02" }
    ]
  }
];

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRegister, setIsRegister] = useState(searchParams.get("mode") === "register");
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
    aadhar: "",
    otp: "",
    playerRole: "",
  });

  const [locations, setLocations] = useState<any[]>([]);
  const [availableCities, setAvailableCities] = useState<any[]>([]);

  const fetchLocations = async () => {
    console.log("Fetching locations...");
    try {
      const data = await getLocationsAPI();
      console.log("Locations fetched from API:", data);

      if (Array.isArray(data) && data.length > 0) {
        setLocations(data);
      } else {
        console.warn("API returned empty/invalid data, using mock data.");
        setLocations(MOCK_LOCATIONS);
      }
    } catch (e) {
      console.error("Failed to load locations from API, using mock data.", e);
      setLocations(MOCK_LOCATIONS);
    }
  };

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "register") {
      setIsRegister(true);
    } else {
      setIsRegister(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isRegister) {
      fetchLocations();
    }
  }, [isRegister]);

  const handleStateChange = (value: string) => {
    setFormData(prev => ({ ...prev, state: value, city: "", zone_id: "" }));
    const selectedState = locations.find(l => l.state === value);
    setAvailableCities(selectedState ? selectedState.cities : []);
  };

  const handleCityChange = (value: string) => {
    const selectedCity = availableCities.find(c => c.name === value);
    setFormData(prev => ({ ...prev, city: value, zone_id: selectedCity ? selectedCity.zoneId : "" }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    // Reset phone verification if number changes
    if (e.target.id === 'mobile') {
      setIsPhoneVerified(false);
    }
  };

  const handleSelectChange = (value: string, field: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSendOtp = async () => {
    if (!formData.mobile || formData.mobile.length < 10) {
      toast({
        variant: "destructive",
        title: "Invalid Mobile Number",
        description: "Please enter a valid mobile number first.",
      });
      return;
    }

    setIsSendingOtp(true);
    try {
      const response = await sendOtp(formData.mobile);
      if (response.success) {
        toast({
          title: "OTP Sent",
          description: `OTP sent to ${formData.mobile}. (Check Console for Demo)`,
        });
        console.log("DEMO OTP:", response.otp);
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
        await register(formData);
        toast({
          title: "Account Created!",
          description: "Welcome to VideoHub. Let's get started!",
        });
        navigate("/auth"); // Redirect to login
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
      {/* Hero gradient overlay */}
      <div className="hero-gradient fixed inset-0 pointer-events-none" />

      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/bg-cricket.png')" }} />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-black/60" />

        <Link to="/" className="relative z-10 flex items-center gap-2">
          <img src="/logo.png" alt="BRPL Logo" className="w-20 h-20 object-contain" />
          <span className="text-xl font-display font-bold text-foreground">Beyond Reach Premier League</span>
        </Link>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">
            Start your <span className="gradient-text">Innings</span> with BRPL
          </h1>
          <p className="text-lg text-muted-foreground">
            Upload match highlights, manage teams, and showcase talent on the premier cricket platform.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 border-2 border-background flex items-center justify-center text-xs font-bold text-primary"
              >
                {i === 1 ? "🏏" : i === 2 ? "🏆" : i === 3 ? "⚡" : "🏟️"}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Join <span className="text-foreground font-medium">500+</span> Teams & Players
          </p>
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
                      <Input id="fname" value={formData.fname} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lname" className="text-foreground">Last Name</Label>
                      <Input id="lname" value={formData.lname} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-foreground">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="email" type="email" className="pl-9" value={formData.email} onChange={handleChange} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile" className="text-foreground">Mobile</Label>
                      <div className="relative flex gap-2">
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="mobile"
                            className="pl-9"
                            value={formData.mobile}
                            onChange={handleChange}
                            disabled={isPhoneVerified}
                            required
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
                        <Input id="password" type="password" className="pl-9" value={formData.password} onChange={handleChange} required />
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
                      <Input id="address1" value={formData.address1} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address2" className="text-foreground">Address Line 2</Label>
                      <Input id="address2" value={formData.address2} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-foreground">State</Label>
                      <Select onValueChange={handleStateChange} value={formData.state}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((loc: any) => (
                            <SelectItem key={loc.state} value={loc.state}>{loc.state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-foreground">City</Label>
                      <Select onValueChange={handleCityChange} value={formData.city} disabled={!formData.state}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select City" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCities.map((city: any) => (
                            <SelectItem key={city.name} value={city.name}>{city.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pincode" className="text-foreground">Pincode</Label>
                      <Input id="pincode" value={formData.pincode} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zone_id" className="text-foreground">Zone ID</Label>
                      <Input id="zone_id" value={formData.zone_id} readOnly className="bg-muted cursor-not-allowed" />
                    </div>
                  </div>

                  <Separator className="my-2" />

                  {/* Verification Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="aadhar" className="text-foreground">Aadhar Number</Label>
                      <div className="relative">
                        <FileDigit className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="aadhar" className="pl-9" value={formData.aadhar} onChange={handleChange} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      {/* Removed OTP Field here as it is handled by modal now, or kept as readonly? user asked for modal. */}
                      {/* I will remove it from here or keep it hidden/updated via state is best.*/}
                    </div>
                  </div>
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
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-12"
                        value={formData.password}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
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
                  onClick={() => setIsRegister(!isRegister)}
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
    </div>
  );
};

export default Auth;
