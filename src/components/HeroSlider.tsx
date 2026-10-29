"use client";

import React, { useState, useEffect } from "react";
import { useConfig } from "@/context/ConfigContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function HeroSlider() {
  const { slides, recargarSlides } = useConfig();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    recargarSlides();
  }, [recargarSlides]);

  // Autoplay cada 6 segundos si hay más de 1 slide
  useEffect(() => {
    if (!slides || slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [slides]);

  if (!slides || slides.length === 0) {
    return null;
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="relative w-full bg-slate-900 select-none overflow-hidden">
      {/* Marco con altura completa e imponente */}
      <div className="relative w-full h-[320px] sm:h-[420px] md:h-[500px] lg:h-[560px] flex items-center justify-center overflow-hidden">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;

          return (
            <div
              key={slide.id || index}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out overflow-hidden ${
                isActive
                  ? "opacity-100 z-10"
                  : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {/* Imagen llenando el 100% del alto y ancho del marco con zoom suave */}
              <img
                src={slide.imagenUrl}
                alt={slide.titulo || "Banner Principal"}
                className={`w-full h-full object-fill md:object-cover object-top sm:object-center block transform transition-transform ease-out will-change-transform ${
                  isActive
                    ? "scale-105 duration-7000"
                    : "scale-100 duration-1000"
                }`}
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          );
        })}

        {/* Flechas de navegación */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevSlide}
              className="absolute left-2 sm:left-4 z-20 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white transition backdrop-blur-xs cursor-pointer"
              aria-label="Slide anterior"
            >
              <ChevronLeft size={22} />
            </button>

            <button
              type="button"
              onClick={nextSlide}
              className="absolute right-2 sm:right-4 z-20 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white transition backdrop-blur-xs cursor-pointer"
              aria-label="Slide siguiente"
            >
              <ChevronRight size={22} />
            </button>

            {/* Puntos de navegación */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentIndex(i)}
                  className={`h-2 sm:h-2.5 rounded-full transition-all cursor-pointer ${
                    i === currentIndex
                      ? "w-6 sm:w-8 bg-[#e62020]"
                      : "w-2 sm:w-2.5 bg-white/60 hover:bg-white"
                  }`}
                  aria-label={`Ir al slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default HeroSlider;
