import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { login, verifyAdminOtp } from "@/apihelper/auth";
import SEO from "@/components/SEO";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Admin 2FA (Google Authenticator) state
  const [requireAdminOtp, setRequireAdminOtp] = useState(false);
  const [adminOtpToken, setAdminOtpToken] = useState("");
  const [adminOtpInput, setAdminOtpInput] = useState("");
  const [adminQrCodeUrl, setAdminQrCodeUrl] = useState<string | null>(null);
  const [isVerifyingAdminOtp, setIsVerifyingAdminOtp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await login({
        email: formData.email,
        password: formData.password
      });

      const data = response.data || response;
      if (data.requireOtp) {
        setRequireAdminOtp(true);
        setAdminOtpToken(data.otpToken);
        if (data.qrCodeUrl) {
          setAdminQrCodeUrl(data.qrCodeUrl);
        }
        toast({
          title: "2FA Required",
          description: data.message
        });
        return;
      }

      finishLogin(data.token, data.role, data.email);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.response?.data?.data?.message || error.response?.data?.message || "Invalid credentials."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAdminMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyingAdminOtp(true);
    try {
      const resp = await verifyAdminOtp(adminOtpToken, adminOtpInput);
      const data = resp.data || resp;
      finishLogin(data.token, data.role, data.email);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "OTP Verification Failed",
        description: error.response?.data?.data?.message || "Invalid OTP code."
      });
    } finally {
      setIsVerifyingAdminOtp(false);
    }
  };

  const finishLogin = (token: string, role: string, email: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userRole", role);
    if (email) localStorage.setItem("userEmail", email);
    
    toast({ title: "Login Successful", description: "Welcome back!" });
    navigate("/admin/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center relative p-4">
      <SEO title="Admin Login" description="Beyond Reach Premier League Admin Portal" />
      
      {/* Background Image optional: */}
      <div className="absolute inset-0 z-0 bg-[length:100%_auto] bg-top bg-no-repeat opacity-40" style={{ backgroundImage: "url('/auth-banner.png')" }} />

      <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-8 shadow-2xl w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-display font-bold text-white drop-shadow-md">
            Admin Portal
          </h2>
          <p className="text-zinc-200 mt-2 font-medium">
            Sign in to continue to administration
          </p>
        </div>

        {requireAdminOtp ? (
          <form onSubmit={verifyAdminMfa} className="space-y-5">
            {adminQrCodeUrl && (
              <div className="flex flex-col items-center mb-4">
                <p className="text-sm text-yellow-500 mb-2 font-semibold">Scan this QR in Google Authenticator</p>
                <img src={adminQrCodeUrl} alt="2FA QR Code" className="w-48 h-48 bg-white p-2 rounded" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="mfa" className="text-white">Enter 6-digit Authenticator Code</Label>
              <Input
                id="mfa"
                className="bg-white text-black text-center text-xl tracking-widest"
                value={adminOtpInput}
                onChange={(e) => setAdminOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required placeholder="123456"
              />
            </div>
            <Button type="submit" className="w-full bg-[#FFC928] text-black font-bold hover:bg-[#e6b524]" disabled={isVerifyingAdminOtp || adminOtpInput.length !== 6}>
              {isVerifyingAdminOtp ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Verify Code
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white font-semibold">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  id="email"
                  type="text"
                  className="pl-12 bg-white text-black placeholder:text-gray-500"
                  placeholder="admin@brpl.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white font-semibold">Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="pl-12 pr-10 bg-white text-black placeholder:text-gray-500"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full mt-4 bg-[#FFC928] text-black hover:bg-[#e6b524] font-bold text-lg h-11" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Sign In"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
