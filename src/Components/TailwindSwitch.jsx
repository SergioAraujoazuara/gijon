const TailwindSwitch = ({ checked, onChange }) => {
    return (
      <button
        onClick={onChange}
        className={`relative w-14 h-7 flex items-center rounded-full p-1 transition-all duration-300
          ${checked ? "bg-blue-600" : "bg-gray-400"}`}
      >
        <div
          className={`w-6 h-6 flex items-center justify-center bg-white rounded-full shadow-md transform transition-all duration-300
            ${checked ? "translate-x-7 scale-110" : "translate-x-0 scale-100"}`}
        >
          {checked ? "✔️" : "❌"}
        </div>
      </button>
    );
  };
  
  export default TailwindSwitch;
  