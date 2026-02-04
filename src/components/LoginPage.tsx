import React from "react";
import { useAuth } from "../context/AuthContext";
import Button from "./Button";
import { LogIn, Target } from "lucide-react";
import { motion } from "framer-motion";

const LoginPage: React.FC = () => {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-premium">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass p-8 rounded-2xl shadow-premium">
        <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary">
          <Target size={32} />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">
          Habit Master
        </h1>

        <p className="text-text-muted text-lg mb-8 leading-relaxed">
          Zbuduj swoją rutynę z elegancją. <br />
          Śledź postępy i osiągaj cele.
        </p>

        <Button
          onClick={login}
          size="lg"
          className="w-full gap-3 shadow-primary-glow font-bold">
          <LogIn size={20} />
          Zaloguj przez Google
        </Button>

        <p className="mt-8 text-text-dim text-sm">
          Bezpieczne logowanie przez Firebase. Twoje dane są prywatne.
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
