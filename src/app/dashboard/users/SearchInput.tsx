"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export default function SearchInput() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);

    if (term) {
      params.set("search", term); // Añade ?search=texto
    } else {
      params.delete("search"); // Borra si está vacío
    }

    // startTransition hace que la UI no se congele mientras carga el servidor
    startTransition(() => {
      replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="relative">
      {/* Icono de Lupa */}
      <svg
        className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>

      <input
        type="text"
        placeholder="Buscar usuario o email..."
        defaultValue={searchParams.get("search")?.toString()}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#7367f0] focus:ring-1 focus:ring-[#7367f0] text-sm w-full sm:w-72 transition-all"
      />

      {/* Indicador de carga cuando está buscando */}
      {isPending && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7367f0] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#7367f0]"></span>
        </span>
      )}
    </div>
  );
}
