/**
 * Componente Button reutilizable
 * Props: children, onClick, type, variant, disabled, className
 */
const Button = ({ children, onClick, type = "button", variant = "primary", disabled = false, className = "" }) => {
  const baseStyles = "px-5 py-2.5 rounded-[4px] font-semibold text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-primary text-white hover:bg-[#004275] focus:ring-primary border border-transparent shadow-none",
    secondary: "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500 shadow-none",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 border border-transparent shadow-none",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
