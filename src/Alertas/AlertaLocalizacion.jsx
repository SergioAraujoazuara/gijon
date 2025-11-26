import React from 'react';
import { MdError } from "react-icons/md";
import { VscErrorSmall } from "react-icons/vsc";
import { FaCheckCircle } from "react-icons/fa";

function AlertaLocalizacion({ message, closeModal }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none bg-black bg-opacity-80">
      <div className="relative w-full max-w-md p-5 mx-2 my-6 bg-white rounded-md shadow-lg sm:mx-auto md:p-8 lg:p-12">
        <div className="flex flex-col items-center justify-center">
          <div className='flex justify-end w-full'>
            <VscErrorSmall onClick={closeModal} style={{ fontSize: 64, fill:'#525252' }} />
          </div>
          <div className='flex justify-center items-center w-full'>
            {message === 'Localización creada correctamente!' || message === 'Localización actualizada correctamente!'  ? (
              <FaCheckCircle style={{ fontSize: 70, fill: '#10b981' }} />
            ) : (
              <MdError style={{ fontSize: 70, fill: '#b91c1c' }} />
            )}
          </div>
          <div className='flex justify-center items-center w-full mt-10'>
            <p className="text-base text-neutral-700 font-semibold text-center sm:text-lg md:text-xl lg:text-2xl">
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AlertaLocalizacion;

