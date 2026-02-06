import React from "react";
import { useAuth } from "../context/AuthContext";
import Button from "./Button";
import { LogIn, Target } from "lucide-react";
import { motion } from "framer-motion";

const LoginPage: React.FC = () => {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="bg-mesh-gradient" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full glass p-10 rounded-[2rem] shadow-premium relative z-10 border-white/10">
        <motion.div
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 text-primary shadow-lg shadow-primary/20 border border-primary/20">
          <Target size={40} />
        </motion.div>

        <h1 className="text-5xl font-bold mb-5 text-gradient font-heading tracking-tight leading-tight">
          Habit Master
        </h1>

        <p className="text-text-muted text-lg mb-10 leading-relaxed font-medium">
          Zbuduj swoją rutynę z elegancją. <br />
          <span className="text-text-dim">
            Śledź postępy i osiągaj cele każdego dnia.
          </span>
        </p>

        <Button
          onClick={login}
          size="lg"
          className="w-full gap-4 shadow-primary-glow font-bold py-4 rounded-2xl">
          <LogIn size={22} />
          Zaloguj przez Google
        </Button>

        <div className="mt-10 pt-8 border-t border-white/5">
          <p className="text-text-dim text-sm font-medium">
            Bezpieczne logowanie przez Firebase. <br />
            Twoje dane są u nas bezpieczne.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
