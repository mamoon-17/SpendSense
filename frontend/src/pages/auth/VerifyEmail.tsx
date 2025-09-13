import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, RotateCcw, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { authAPI } from '@/lib/api';

export const VerifyEmail: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const email = location.state?.email || 'your email';
  const token = new URLSearchParams(location.search).get('token');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    setIsLoading(true);
    try {
      await authAPI.verifyEmail(verificationToken);
      setIsVerified(true);
      toast({
        title: 'Email verified successfully!',
        description: 'Your account has been activated. You can now sign in.',
      });
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      toast({
        title: 'Verification failed',
        description: error.response?.data?.message || 'Invalid or expired verification token.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerification = async () => {
    if (typeof email !== 'string' || !email.includes('@')) {
      toast({
        title: 'Cannot resend',
        description: 'Email address not found. Please try registering again.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Assuming there's a resend endpoint
      await authAPI.register({ name: '', email, password: '' }); // This would be a resend endpoint
      toast({
        title: 'Verification email sent',
        description: 'Please check your email for a new verification link.',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to resend',
        description: error.response?.data?.message || 'Could not resend verification email.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">FinanceFlow</h1>
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-6">
          {isVerified ? (
            <>
              {/* Success State */}
              <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  Email Verified!
                </h2>
                <p className="text-muted-foreground">
                  Your account has been successfully verified. 
                  <br />
                  Redirecting you to sign in...
                </p>
              </div>
              
              <div className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            </>
          ) : (
            <>
              {/* Pending State */}
              <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  Check Your Email
                </h2>
                <p className="text-muted-foreground">
                  We've sent a verification link to
                  <br />
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Click the link in the email to verify your account and get started with FinanceFlow.
                </p>

                {/* Resend Button */}
                <div className="space-y-2">
                  <Button
                    onClick={resendVerification}
                    variant="outline"
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4 mr-2" />
                    )}
                    Resend Verification Email
                  </Button>
                  
                  <p className="text-xs text-muted-foreground">
                    Didn't receive the email? Check your spam folder or try resending.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Back to Login */}
          <div className="pt-4 border-t border-border">
            <Link
              to="/login"
              className="text-primary hover:text-primary-hover text-sm font-medium transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};