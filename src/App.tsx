/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { GoogleGenAI } from "@google/genai";
import { 
  Upload, 
  RefreshCw, 
  Download, 
  Image as ImageIcon, 
  Loader2, 
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MODEL_NAME = "gemini-2.5-flash-image";

export default function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setOriginalImage(base64);
        setShowOriginal(false);
        generateStudentUniform(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateStudentUniform = async (base64Image: string) => {
    setIsProcessing(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const [mimePart, dataPart] = base64Image.split(",");
      const mimeType = mimePart.split(":")[1].split(";")[0];

      const prompt = "Change the person's clothes in this image to a Thai university student uniform: a white, tight-fitting, short-sleeved button-down shirt and a short black skirt. Even if the original image is a half-body or close-up shot, zoom out the camera and generate a full-body view showing the person from head to toe. Keep the person's face and identity the same. The posture should remain consistent with the original but shown in full body. Ensure the result looks realistic and professional.";

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          parts: [
            {
              inlineData: {
                data: dataPart,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      const candidates = response.candidates;
      if (!candidates || candidates.length === 0 || !candidates[0].content || !candidates[0].content.parts) {
        throw new Error("AI ไม่สามารถสร้างรูปภาพได้ในขณะนี้ (อาจติดตัวกรองความปลอดภัย) กรุณาลองเปลี่ยนรูปภาพอื่น");
      }

      let foundImage = false;
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          const resultBase64 = `data:image/png;base64,${part.inlineData.data}`;
          setGeneratedImage(resultBase64);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        throw new Error("AI ไม่สามารถสร้างรูปภาพได้ กรุณาลองใหม่อีกครั้ง");
      }
    } catch (err) {
      console.error("Error generating image:", err);
      setError("เกิดข้อผิดพลาดในการประมวลผล กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegenerate = () => {
    if (originalImage) {
      setShowOriginal(false);
      generateStudentUniform(originalImage);
    }
  };

  const handleSave = () => {
    if (generatedImage) {
      const link = document.createElement("a");
      link.href = generatedImage;
      link.download = "student-uniform-ai.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-[#0f172a] overflow-hidden font-sans text-slate-200">
      {/* Header */}
      <header className="p-4 bg-[#1e293b] border-b border-slate-800 flex items-center justify-between shrink-0 shadow-lg">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-blue-400" />
          เปลี่ยนชุดนักศึกษา AI
        </h1>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col p-4 overflow-hidden">
        <AnimatePresence mode="wait">
          {!originalImage ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-3xl bg-[#1e293b] p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
              onClick={triggerUpload}
            >
              <div className="w-20 h-20 bg-blue-900/30 rounded-full flex items-center justify-center mb-6">
                <Upload className="w-10 h-10 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">อัพโหลดรูปภาพ</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                เลือกรูปภาพที่มีคนเพื่อเปลี่ยนเป็นชุดนักศึกษา<br />
                (เสื้อเชิ้ตรัดรูปและกระโปรงสั้น)
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col gap-4 overflow-hidden"
            >
              <div className="flex-1 relative rounded-2xl overflow-hidden bg-[#1e293b] shadow-2xl border border-slate-800">
                {isProcessing ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f172a]/80 backdrop-blur-sm z-10">
                    <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-4" />
                    <p className="text-white font-medium animate-pulse">กำลังประมวลผลด้วย AI...</p>
                    <p className="text-slate-400 text-xs mt-2 italic">อาจใช้เวลาสักครู่</p>
                  </div>
                ) : null}

                {error ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-red-900/20 z-20">
                    <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                    <p className="text-red-200 font-medium mb-4">{error}</p>
                    <button
                      onClick={handleRegenerate}
                      className="px-6 py-2 bg-red-600 text-white rounded-full font-medium flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      ลองใหม่อีกครั้ง
                    </button>
                  </div>
                ) : null}

                <img
                  src={showOriginal ? originalImage : (generatedImage || originalImage)}
                  alt="Result"
                  className={cn(
                    "w-full h-full object-contain transition-opacity duration-500",
                    isProcessing ? "opacity-30" : "opacity-100"
                  )}
                  referrerPolicy="no-referrer"
                />
                
                {!isProcessing && generatedImage && (
                  <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                    <CheckCircle2 className="w-3 h-3" />
                    {showOriginal ? "ต้นฉบับ" : "เสร็จสมบูรณ์"}
                  </div>
                )}

                {/* Compare Toggle Button Overlay */}
                {!isProcessing && generatedImage && (
                  <button
                    onClick={() => setShowOriginal(!showOriginal)}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-xl active:scale-95 transition-all"
                  >
                    <RefreshCw className={cn("w-4 h-4", showOriginal && "rotate-180")} />
                    {showOriginal ? "ดูภาพที่สร้าง" : "ดูภาพต้นฉบับ"}
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 shrink-0">
                <button
                  onClick={handleRegenerate}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 py-4 bg-[#1e293b] border border-slate-700 text-slate-200 rounded-2xl font-bold hover:bg-[#334155] active:scale-95 transition-all disabled:opacity-50"
                >
                  <RefreshCw className={cn("w-5 h-5", isProcessing && "animate-spin")} />
                  สุ่มสร้างใหม่
                </button>
                <button
                  onClick={handleSave}
                  disabled={isProcessing || !generatedImage}
                  className="flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-blue-900/40"
                >
                  <Download className="w-5 h-5" />
                  บันทึกรูปภาพ
                </button>
              </div>

              <button
                onClick={() => {
                  setOriginalImage(null);
                  setGeneratedImage(null);
                  setError(null);
                  setShowOriginal(false);
                }}
                className="text-slate-500 text-xs font-medium py-2 hover:text-slate-300 transition-colors"
              >
                เลือกรูปภาพใหม่
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="p-4 text-center shrink-0">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
          Powered by Gemini 2.5 Flash Image
        </p>
      </footer>
    </div>
  );
}
