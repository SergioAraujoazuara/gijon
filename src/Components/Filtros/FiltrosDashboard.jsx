import React from 'react';
import { FaSearch, FaTimes } from "react-icons/fa";

const FiltrosDashboard = ({ filters, uniqueValues, filterText, onFilterChange, onSelectChange, onClearFilters }) => {
    return (
        <div className='w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 text-sm'>
            <div className="relative flex items-center">
                <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg pl-10"
                    placeholder="Lote o PPI"
                    value={filterText}
                    onChange={onFilterChange}
                />
                <FaSearch className="absolute left-3 top-3 text-gray-400 text-sm" />
            </div>
            <select
                name="sector"
                className="w-full p-2 border border-gray-300 rounded-lg"
                value={filters.sector}
                onChange={onSelectChange}
            >
                <option value="">Sector</option>
                {uniqueValues.sector.map((value, index) => (
                    <option key={index} value={value}>{value}</option>
                ))}
            </select>
            <select
                name="subSector"
                className="w-full p-2 border border-gray-300 rounded-lg"
                value={filters.subSector}
                onChange={onSelectChange}
            >
                <option value="">Sub Sector</option>
                {uniqueValues.subSector.map((value, index) => (
                    <option key={index} value={value}>{value}</option>
                ))}
            </select>
            <select
                name="parte"
                className="w-full p-2 border border-gray-300 rounded-lg"
                value={filters.parte}
                onChange={onSelectChange}
            >
                <option value="">Parte</option>
                {uniqueValues.parte.map((value, index) => (
                    <option key={index} value={value}>{value}</option>
                ))}
            </select>
            <select
                name="elemento"
                className="w-full p-2 border border-gray-300 rounded-lg"
                value={filters.elemento}
                onChange={onSelectChange}
            >
                <option value="">Elemento</option>
                {uniqueValues.elemento.map((value, index) => (
                    <option key={index} value={value}>{value}</option>
                ))}
            </select>
            <select
                name="lote"
                className="w-full p-2 border border-gray-300 rounded-lg"
                value={filters.lote}
                onChange={onSelectChange}
            >
                <option value="">Lote</option>
                {uniqueValues.lote.map((value, index) => (
                    <option key={index} value={value}>{value}</option>
                ))}
            </select>
            <select
                name="ppi"
                className="w-full p-2 border border-gray-300 rounded-lg"
                value={filters.ppi}
                onChange={onSelectChange}
            >
                <option value="">PPI</option>
                {uniqueValues.ppi.map((value, index) => (
                    <option key={index} value={value}>{value}</option>
                ))}
            </select>
            <button
                className="w-full p-2 bg-gray-500 text-white rounded-lg flex items-center justify-center gap-2"
                onClick={onClearFilters}
            >
                <FaTimes />
                Borrar filtros
            </button>
        </div>
    );
};

export default FiltrosDashboard;
