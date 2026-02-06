import React from "react";
import { useAuth } from "../context/AuthContext";
import Button from "./Button";
import { LogIn, Target } from "lucide-react";
import { motion } from "framer-motion";

const LoginPage: React.FC = () => {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-bg-main font-main">
      {/* Dynamic Background Elements */}
      <div className="bg-mesh-premium" />

      {/* Animated Glow Spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-primary/20 rounded-full blur-[120px] animate-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-secondary/10 rounded-full blur-[120px] animate-glow animation-delay-2000" />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md z-10">
        <div className="glass-premium p-10 md:p-12 text-center rounded-[3rem] border-white/10 shadow-premium relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-primary/40 animate-float">
            <Target className="text-white" size={48} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}>
            <h1 className="text-5xl font-black mb-4 tracking-tighter text-gradient">
              Habit <span className="text-gradient-vibrant">Master</span>
            </h1>
            <p className="text-text-muted text-lg mb-12 font-medium leading-relaxed">
              Zbuduj swoją rutynę z elegancją.
              <br />
              Śledź postępy i osiągaj cele każdego dnia.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-6">
            <Button
              size="lg"
              onClick={login}
              className="w-full shadow-primary-glow group">
              <LogIn
                size={24}
                className="group-hover:translate-x-1 transition-transform"
              />
              Zaloguj przez Google
            </Button>

            <div className="pt-4">
              <p className="text-text-dim text-sm font-semibold flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Bezpieczne logowanie przez Firebase
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
