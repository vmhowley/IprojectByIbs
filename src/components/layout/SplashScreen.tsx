// components/SplashScreen.tsx
import React, { useEffect, useState } from 'react';
import Logo from '../../public/Logoibpulse.webp';
const SplashScreen: React.FC = () => {
    // Estado para controlar cuándo mostrar la animación de entrada
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Pequeño retraso para que la transición se aprecie mejor al cargar
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white overflow-hidden">
            {/* Contenedor del Logo con Animación de Entrada */}
            <div
                className={`relative transform transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'
                    }`}
            >
                {/* AQUÍ VA LA IMAGEN DEL NUEVO LOGO. 
           Asegúrate de importar tu imagen o usar la ruta correcta.
           Ejemplo: <img src="/logo-ibpulse-hibrido.png" ... />
        */}
                <img
                    src={Logo} // ¡REEMPLAZA ESTO!
                    alt="Logo ibPulse"
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-auto w-64 md:w-80 lg:w-96 object-contain invert" // Ajusta el tamaño según prefieras
                />
                <img
                    src={Logo} // ¡REEMPLAZA ESTO!
                    alt="Logo ibPulse"
                    className="h-auto w-64 md:w-80 lg:w-96 object-contain animate-pulse" // Ajusta el tamaño según prefieras
                />
            </div>

            {/* Indicador de Carga Sutil (Opcional) */}
            <div className={`mt-12 transition-opacity duration-1000 delay-500  ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                {/* From Uiverse.io by milley69 */}
                <div className="loading">
                    <svg width="64px" height="48px">
                        <polyline points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" id="back"></polyline>
                        <polyline points="0.157 23.954, 14 23.954, 21.843 48, 43 0, 50 24, 64 24" id="front"></polyline>
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;