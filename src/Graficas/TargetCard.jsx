import React from 'react';
import { FaSitemap } from "react-icons/fa6";
import { FaCalendarCheck } from "react-icons/fa6";
import { FaRegCheckCircle } from "react-icons/fa";

const TargetCard = ({ title, value, message }) => {

  return (
    <div className="flex flex-col justify-center items-center text-center px-8 py-4 bg-gray-200
    rounded-lg shadow-lg">
      <div className="text-md font-medium text-gray-600 flex flex-col items-center gap-1">
        <span>
          {title == "Total aptos (Progreso):" ? (
            <FaSitemap className='text-2xl' />
          ) : (
            ""
          )}

          {title == "Lotes completados:" ? (
            <FaCalendarCheck className='text-2xl' />
          ) : (
            ""
          )}
          {title == "Lotes iniciados:" ? (
            <FaRegCheckCircle className='text-2xl' />
          ) : (
            ""
          )}
        </span>

        <div className='flex gap-2'>

          <span>{title}</span>


          {value}


        </div>
        <div className="text-md font-light text-gray-600  text-sm">
          {message}
        </div>

      </div>
    </div>
  );
};

export default TargetCard;
