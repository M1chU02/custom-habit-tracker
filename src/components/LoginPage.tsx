import React from "react";
import { useAuth } from "../context/AuthContext";
import Button from "./Button";
import { LogIn, Target } from "lucide-react";
import { motion } from "framer-motion";

const LoginPage: React.FC = () => {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.15),transparent),radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.1),transparent)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center">
        <div className="mb-8 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
          <Target size={32} />
        </div>

        <h1 className="text-4xl md:text-5xl mb-4 bg-gradient-to-r from-white to-text-dim bg-clip-text text-transparent">
          Habit Master
        </h1>

        <p className="text-text-muted text-lg mb-10 leading-relaxed">
          Zbuduj swoją rutynę z elegancją. <br />
          Śledź postępy, buduj streaki, osiągaj cele.
        </p>

        <Button
          onClick={login}
          size="lg"
          className="w-full gap-3 shadow-2xl shadow-primary/40">
          <LogIn size={20} />
          Zaloguj przez Google
        </Button>

        <p className="mt-8 text-text-dim text-sm">
          Bezpieczne logowanie przez Firebase. Twoje dane są pryatne.
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
