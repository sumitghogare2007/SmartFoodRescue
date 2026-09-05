import { Link } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Heart className="mx-auto h-12 w-12 text-[#166534]" />
        <h2 className="mt-6 text-3xl font-extrabold text-[#1e3a5f]">
          Password Reset
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200 text-center">
          <p className="text-gray-600 mb-6">
            Self-service password reset is not available in this version of SmartFoodRescue. 
            Please contact the system administrator to regain access to your account.
          </p>
          
          <Link
            to="/auth/login"
            className="inline-flex items-center justify-center w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#166534] hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#166534]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
