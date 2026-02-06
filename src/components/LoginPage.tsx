import React from "react";
import { useAuth } from "../context/AuthContext";
import Button from "./Button";
import { LogIn, Target } from "lucide-react";
import { motion } from "framer-motion";

const LoginPage: React.FC = () => {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-bg-main">
      <div className="bg-mesh-gradient" />

      {/* Decorative Background Blobs */}
      <div className="absolute top-0 -left-10 w-80 h-80 bg-primary/20 rounded-full filter-blur animate-blob opacity-40 mix-blend-screen" />
      <div className="absolute top-0 -right-10 w-80 h-80 bg-secondary/20 rounded-full filter-blur animate-blob animation-delay-2000 opacity-30 mix-blend-screen" />
      <div className="absolute -bottom-20 left-1/4 w-96 h-96 bg-accent/20 rounded-full filter-blur animate-blob animation-delay-4000 opacity-20 mix-blend-screen" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full glass p-10 md:p-12 rounded-[2.5rem] shadow-premium relative z-10 border-white/10">
        <motion.div
          animate={{
            y: [0, -12, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 text-primary shadow-lg shadow-primary/20 border border-primary/20">
          <Target size={42} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-5xl font-bold mb-6 text-gradient font-heading tracking-tight leading-tight">
          Habit Master
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-text-muted text-lg mb-10 leading-relaxed font-medium">
          Zbuduj swoją rutynę z elegancją. <br />
          <span className="text-text-dim/80">
            Śledź postępy i osiągaj cele każdego dnia.
          </span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}>
          <Button
            onClick={login}
            size="lg"
            className="w-full gap-4 shadow-primary-glow font-bold py-4 rounded-2xl bg-primary">
            <LogIn size={22} />
            Zaloguj przez Google
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-12 pt-8 border-t border-white/5">
          <p className="text-text-dim text-sm font-medium">
            Bezpieczne logowanie przez Firebase. <br />
            Twoje dane są u nas bezpieczne.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
