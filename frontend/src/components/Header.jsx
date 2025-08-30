import React from "react";

const Header = () => {
  return (
    <header className="bg-indigo-700 text-white shadow-md">
      <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-2xl font-semibold tracking-wide">
          👕 Knit & Keep
        </div>
        <ul className="flex space-x-6 text-sm font-medium">
          <li>
            <a href="/" className="hover:text-yellow-300 transition">
              Home
            </a>
          </li>
          <li>
            <a href="/Admin" className="hover:text-yellow-300 transition">
              Admin
            </a>
          </li>
          <li>
            <a href="/login" className="hover:text-yellow-300 transition">
              Login
            </a>
          </li>
          <li>
            <a href="/company" className="hover:text-yellow-300 transition">
              Company
            </a>
          </li>
          <li>
            <a href="/Registrasi" className="hover:text-yellow-300 transition">
              Registrasi
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
