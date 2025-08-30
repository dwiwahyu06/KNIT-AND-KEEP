import React from "react";

const Footer = () => {
  return (
    <footer className="bg-white/80 backdrop-blur-lg shadow-inner mt-10 py-4">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Knit & Keep . Dwi Wahyu Susilowati
        </p>
        <div className="flex space-x-4 mt-4 md:mt-0">
          <a href="#" className="hover:text-yellow-300 text-sm transition">
            Privacy
          </a>
          <a href="#" className="hover:text-yellow-300 text-sm transition">
            Terms
          </a>
          <a href="#" className="hover:text-yellow-300 text-sm transition">
            Support
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
