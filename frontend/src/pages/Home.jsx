// import React from "react";
// import { GiLargeDress } from "react-icons/gi";
// import { GiTrousers } from "react-icons/gi";
// import { FaTshirt } from "react-icons/fa";
// import Footer  from "../components/Footer";
// import { useNavigate } from "react-router-dom";

// function Home() {
//   const navigate = useNavigate();

//   return (
//     <div className="flex flex-col min-h-screen">
//       {/* Header Khusus untuk Home */}
//       <header className="bg-indigo-700 text-white shadow-md">
//         <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
//           <div className="text-2xl font-semibold tracking-wide">
//             👕 Knit & Keep
//           </div>
//         </div>
//       </header>

//       {/* Main Content */}
//       <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-indigo-500 to-blue-600 text-white px-4">
//         <div className="text-center max-w-2xl">
//           <div className="flex justify-center mb-4">
//             <GiLargeDress size={50} className="text-yellow-300 animate-bounce" />
//             <GiTrousers size={50} className="text-yellow-300 animate-bounce" />
//             <FaTshirt size={50} className="text-yellow-300 animate-bounce" />
//           </div>

//           <h1 className="text-4xl md:text-5xl font-bold mb-4">
//             Welcome to <span className="text-yellow-300">Our Platform</span>
//           </h1>

//           <p className="text-lg md:text-xl mb-6 text-gray-100">
//             Discover a curated collection of thrift clothing at affordable
//             prices. Unique style, budget-friendly, and always high quality.
//           </p>

//           <button
//             onClick={() => navigate("/SelectRole")}
//             className="bg-yellow-400 text-gray-900 font-semibold px-6 py-3 rounded-full shadow-lg hover:bg-yellow-300 transition"
//           >
//             Get Started
//           </button>
//         </div>
//       </main>

//       {/* Footer */}
//       <Footer />
//     </div>
//   );
// }

// export default Home;


import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Footer from "../components/Footer";
import { FaArrowRight } from "react-icons/fa";

// Komponen helper untuk animasi saat elemen masuk ke viewport
const AnimatedSection = ({ children }) => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <motion.div
      ref={ref}
      animate={controls}
      initial="hidden"
      variants={{
        visible: { opacity: 1, y: 0 },
        hidden: { opacity: 0, y: 50 },
      }}
      transition={{ duration: 0.8 }}
    >
      {children}
    </motion.div>
  );
};

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-serif">
      {/* Header Elegan */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-semibold tracking-wider text-gray-800">
            Knit & Keep
          </div>
          <button
            onClick={() => navigate("/SelectRole")}
            className="bg-gray-800 text-white font-semibold px-5 py-2 rounded-full shadow-lg hover:bg-gray-700 transition"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="h-screen flex items-center justify-center bg-cover bg-center text-white" style={{backgroundImage: "url('https://i.pinimg.com/736x/24/88/11/2488111598d9f51a9a706c722bb875c0.jpg')"}}>
            <div className="text-center bg-black/50 p-10 rounded-lg">
                <motion.h1 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-5xl md:text-7xl font-bold mb-4"
                >
                    Timeless Style, Reimagined
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-lg md:text-xl mb-8 text-gray-200"
                >
                    Discover a curated collection of thrift clothing.
                </motion.p>
            </div>
        </section>

        {/* About Section - Meniru Referensi Anda */}
        <section className="py-20 md:py-32 bg-white">
          <AnimatedSection>
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div className="relative">
                <h2 className="absolute -top-12 -left-8 text-8xl font-bold text-gray-100 opacity-80 z-0 select-none">
                  ABOUT
                </h2>
                <div className="relative z-10">
                  <p className="text-sm font-semibold text-gray-500 tracking-widest mb-2">HOW WE CAN HELP</p>
                  <p className="text-4xl text-gray-800 leading-tight">
                    <span className="text-5xl font-bold">A</span>At Knit & Keep, we believe that thrifting isn’t just about buying second-hand clothes, but about giving each piece a new life and purpose.
                  </p>
                  <p className="mt-6 text-gray-600">
                    Kami percaya bahwa gaya tidak harus mahal — dengan thrifting, Anda bisa menemukan barang unik, ramah lingkungan, dan tetap bergaya tanpa harus menguras kantong.
                  </p>
                  <button className="mt-8 flex items-center gap-2 font-semibold text-gray-800 border-b-2 border-gray-800 pb-1 hover:text-gray-600 hover:border-gray-600 transition">
                    LEARN MORE <FaArrowRight size={12} />
                  </button>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 border-2 border-gray-200 -m-4 rounded-2xl transform -rotate-2"></div>
                <img
                  src="https://i.pinimg.com/1200x/db/b1/8b/dbb18b3f3398aaef52c20ec01143a284.jpg"
                  alt="Trifting"
                  className="rounded-2xl shadow-2xl relative z-10"
                />
              </div>
            </div>
          </AnimatedSection>
        </section>

        {/* Collection Section */}
        <section className="py-20 md:py-32 bg-gray-50">
             <AnimatedSection>
                <div className="max-w-7xl mx-auto px-6 text-center">
                     <h2 className="text-4xl font-bold text-gray-800 mb-4">Our Collection</h2>
                     <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12">
                         Each piece is hand-picked to ensure quality, style, and a touch of uniqueness for your wardrobe.
                     </p>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         <div className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform">
                             <img src="https://i.pinimg.com/736x/e1/3a/1d/e13a1d0742aa270a1575c0a0011abea4.jpg" alt="Jackets" className="w-full h-80 object-cover"/>
                             <div className="p-6">
                                 <h3 className="text-xl font-bold">Jackets & Outerwear</h3>
                                 <p className="text-gray-600 mt-2">Find the perfect layer for any season.</p>
                             </div>
                         </div>
                         <div className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform md:mt-12">
                             <img src="https://i.pinimg.com/1200x/5c/13/d2/5c13d2fdb2eb5c88062173550f92afd7.jpg" alt="Sweaters" className="w-full h-80 object-cover"/>
                             <div className="p-6">
                                 <h3 className="text-xl font-bold">Sweaters & Knits</h3>
                                 <p className="text-gray-600 mt-2">Cozy, comfortable, and effortlessly stylish.</p>
                             </div>
                         </div>
                         <div className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform">
                             <img src="https://i.pinimg.com/1200x/1e/fa/09/1efa096bb83494e1927092a0e576221a.jpg" alt="T-Shirts" className="w-full h-80 object-cover"/>
                             <div className="p-6">
                                 <h3 className="text-xl font-bold">T-Shirts & Tops</h3>
                                 <p className="text-gray-600 mt-2">Unique graphics and timeless basics.</p>
                             </div>
                         </div>
                     </div>
                </div>
             </AnimatedSection>
        </section>

      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
