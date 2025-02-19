'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { Popover } from '@headlessui/react';
import { FaCar, FaBus, FaLeaf, FaInfoCircle, FaRupeeSign, FaChartBar, FaCalculator, FaChartLine, FaChartArea } from 'react-icons/fa';
import numberToWords from 'number-to-words';

interface CalculationResult {
    totalCarCost: number;
    totalCommuteCost: number;
    monthlySavings: number;
    yearlySavings: number;
    fuelCosts: number;
    maintenanceCost: number;
    insuranceCost: number;
    depreciationCost: number;
    yearlyEmissions: number;
}

interface FormErrors {
    [key: string]: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const tooltipContent = {
    carPrice: "The purchase price of the vehicle including taxes and registration",
    fuelEfficiency: "Average kilometers traveled per liter of fuel",
    fuelPrice: "Current fuel price per liter",
    maintenanceCosts: "Expected monthly maintenance costs including servicing, repairs, etc.",
    insuranceCosts: "Annual insurance premium for the vehicle",
    distanceToWork: "One-way distance to your workplace",
    workingDaysPerMonth: "Number of days you commute to work per month",
    resaleValue: "Expected resale value after planned usage period",
    resaleYears: "Number of years after which you plan to sell the vehicle",
    publicTransportCosts: "Monthly expenses on public transportation"
};

const environmentalTips = [
    "Using public transport can reduce your carbon footprint by up to 4,800 pounds of CO2 per year",
    "One full bus can take 60 cars off the road",
    "Public transportation uses 50% less fuel per passenger mile than private vehicles",
    "Choosing public transit over private vehicles helps reduce air pollution and traffic congestion"
];

export default function BuyVsCommuteCalculator() {
    const [formData, setFormData] = useState({
        carPrice: '',
        fuelEfficiency: '', // km per liter
        fuelPrice: '', // per liter
        distanceToWork: '', // km one way
        workingDaysPerMonth: '',
        maintenanceCosts: '', // monthly
        insuranceCosts: '', // yearly
        resaleValue: '',
        resaleYears: '',
        publicTransportCosts: '', // monthly
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [result, setResult] = useState<CalculationResult | null>(null);
    const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');
    const [chartType, setChartType] = useState<'line' | 'area'>('line');

    const validateField = (name: string, value: string) => {
        if (value === '') return '';
        
        const numValue = parseFloat(value);
        switch (name) {
            case 'carPrice':
                return numValue <= 0 ? 'Car price must be greater than 0' : '';
            case 'fuelEfficiency':
                return numValue <= 0 ? 'Fuel efficiency must be greater than 0' : '';
            case 'fuelPrice':
                return numValue <= 0 ? 'Fuel price must be greater than 0' : '';
            case 'workingDaysPerMonth':
                return numValue <= 0 || numValue > 31 ? 'Working days must be between 1 and 31' : '';
            case 'resaleYears':
                return numValue <= 0 ? 'Years until resale must be greater than 0' : '';
            default:
                return numValue < 0 ? 'Value cannot be negative' : '';
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        // Allow empty string or valid number input (including decimals)
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));

            // Only validate if there's a value
            if (value !== '') {
                const error = validateField(name, value);
                setErrors(prev => ({
                    ...prev,
                    [name]: error
                }));
            } else {
                // Clear error when input is empty
                setErrors(prev => ({
                    ...prev,
                    [name]: ''
                }));
            }
        }
    };

    const validateForm = () => {
        const newErrors: FormErrors = {};
        let isValid = true;

        // Validate all fields
        Object.entries(formData).forEach(([name, value]) => {
            const error = validateField(name, value);
            if (error) {
                newErrors[name] = error;
                isValid = false;
            }
        });

        // Check for empty required fields
        const requiredFields = ['carPrice', 'fuelEfficiency', 'fuelPrice', 'workingDaysPerMonth'];
        requiredFields.forEach(field => {
            if (!formData[field as keyof typeof formData]) {
                newErrors[field] = 'This field is required';
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    const formatIndianNumber = (num: number): string => {
        if (num >= 10000000) { // Crores
            return `${(num / 10000000).toFixed(2)} Cr`;
        } else if (num >= 100000) { // Lakhs
            return `${(num / 100000).toFixed(2)} L`;
        } else if (num >= 1000) { // Thousands
            return `${(num / 1000).toFixed(2)} K`;
        }
        return num.toFixed(2);
    };

    const formatIndianWords = (num: number): string => {
        if (num >= 10000000) {
            return `${(num / 10000000).toFixed(2)} crores`;
        } else if (num >= 100000) {
            return `${(num / 100000).toFixed(2)} lakhs`;
        } else if (num >= 1000) {
            return `${(num / 1000).toFixed(2)} thousand`;
        }
        return numberToWords.toWords(Math.round(num));
    };

    const convertToWords = (value: string) => {
        if (!value || isNaN(parseFloat(value))) return '';
        const number = parseFloat(value);
        if (number === 0) return 'zero';
        try {
            return formatIndianWords(number);
        } catch {
            return '';
        }
    };

    const calculateEmissions = (monthlyDistance: number) => {
        // Average car emits 404 grams of CO2 per mile (Source: EPA)
        const CO2_PER_KM = 0.404;
        return (monthlyDistance * 12 * CO2_PER_KM) / 1000; // Convert to metric tons
    };

    const calculateCosts = () => {
        if (!validateForm()) {
            return;
        }

        const values = {
            carPrice: parseFloat(formData.carPrice) || 0,
            fuelEfficiency: parseFloat(formData.fuelEfficiency) || 0,
            fuelPrice: parseFloat(formData.fuelPrice) || 0,
            distanceToWork: parseFloat(formData.distanceToWork) || 0,
            workingDaysPerMonth: parseFloat(formData.workingDaysPerMonth) || 0,
            maintenanceCosts: parseFloat(formData.maintenanceCosts) || 0,
            insuranceCosts: parseFloat(formData.insuranceCosts) || 0,
            resaleValue: parseFloat(formData.resaleValue) || 0,
            resaleYears: parseFloat(formData.resaleYears) || 1,
            publicTransportCosts: parseFloat(formData.publicTransportCosts) || 0,
        };

        try {
            // Calculate monthly fuel costs
            const monthlyDistance = values.distanceToWork * 2 * values.workingDaysPerMonth;
            const monthlyFuelCosts = (monthlyDistance / values.fuelEfficiency) * values.fuelPrice;

            // Calculate monthly depreciation
            const totalDepreciation = values.carPrice - values.resaleValue;
            const monthlyDepreciation = totalDepreciation / (values.resaleYears * 12);

            // Calculate total monthly car costs
            const monthlyCarCosts = 
                monthlyFuelCosts + 
                values.maintenanceCosts + 
                (values.insuranceCosts / 12) + 
                monthlyDepreciation;

            // Calculate yearly costs
            const yearlyCarCosts = monthlyCarCosts * 12;
            const yearlyCommuteCosts = values.publicTransportCosts * 12;

            // Calculate yearly emissions
            const yearlyEmissions = calculateEmissions(monthlyDistance);

            setResult({
                totalCarCost: monthlyCarCosts,
                totalCommuteCost: values.publicTransportCosts,
                monthlySavings: values.publicTransportCosts - monthlyCarCosts,
                yearlySavings: yearlyCommuteCosts - yearlyCarCosts,
                fuelCosts: monthlyFuelCosts,
                maintenanceCost: values.maintenanceCosts,
                insuranceCost: values.insuranceCosts / 12,
                depreciationCost: monthlyDepreciation,
                yearlyEmissions
            });
        } catch (error) {
            alert('An error occurred while calculating. Please check your inputs.');
        }
    };

    const InputField = ({ label, name, value, unit }: { label: string; name: string; value: string; unit: string }) => (
        <div className="relative mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-1">
                <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                    {label}
                    {['carPrice', 'fuelEfficiency', 'fuelPrice', 'workingDaysPerMonth'].includes(name) && 
                        <span className="text-red-500 ml-1">*</span>
                    }
                </label>
                <Popover className="relative">
                    <Popover.Button className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded-full p-1">
                        <FaInfoCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Popover.Button>
                    <Popover.Panel className="absolute z-10 w-64 sm:w-72 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm bg-gray-900 text-white rounded-lg shadow-lg right-0 mt-2">
                        {tooltipContent[name as keyof typeof tooltipContent]}
                    </Popover.Panel>
                </Popover>
            </div>
            <div className="relative group">
                <input
                    type="text"
                    inputMode="decimal"
                    name={name}
                    value={value}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                        if (
                            e.key === 'Backspace' ||
                            e.key === 'Delete' ||
                            e.key === 'Tab' ||
                            e.key === 'Escape' ||
                            e.key === 'Enter' ||
                            e.key === '.' ||
                            e.key === 'ArrowLeft' ||
                            e.key === 'ArrowRight' ||
                            e.key === 'ArrowUp' ||
                            e.key === 'ArrowDown' ||
                            /^\d$/.test(e.key)
                        ) {
                            if (e.key === '.' && value.includes('.')) {
                                e.preventDefault();
                            }
                            return;
                        }
                        e.preventDefault();
                    }}
                    className={`block w-full rounded-lg border-2 text-sm sm:text-base ${
                        errors[name] ? 'border-red-500' : 'border-gray-200 group-hover:border-blue-300'
                    } bg-white px-3 py-2 sm:px-4 sm:py-3 pr-12 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-30 transition-all duration-200`}
                    placeholder="0"
                    autoComplete="off"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm bg-white px-1">
                    {unit}
                </span>
            </div>
            {errors[name] && (
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-500 flex items-center">
                    <FaInfoCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {errors[name]}
                </p>
            )}
            {value && !errors[name] && (
                <p className="mt-1 text-xs text-gray-500 italic">
                    {convertToWords(value)} {unit}
                </p>
            )}
        </div>
    );

    const renderResults = () => {
        if (!result) return null;

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-100">
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-3 sm:mb-4 text-blue-600 flex items-center">
                        <FaCar className="w-4 h-4 sm:w-6 sm:h-6 mr-2" />
                        Car Ownership
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                        <p className="text-base sm:text-lg flex justify-between items-center">
                            <span className="text-gray-600">Total Cost:</span>
                            <span className="font-bold text-gray-900">
                                ₹{formatIndianNumber(viewMode === 'monthly' ? result.totalCarCost : result.totalCarCost * 12)}
                            </span>
                        </p>
                        <div className="pt-2 sm:pt-3 border-t border-gray-100">
                            <p className="text-sm flex justify-between items-center text-gray-500">
                                <span>Fuel:</span>
                                <span>₹{formatIndianNumber(result.fuelCosts)}</span>
                            </p>
                            <p className="text-sm flex justify-between items-center text-gray-500">
                                <span>Maintenance:</span>
                                <span>₹{formatIndianNumber(result.maintenanceCost)}</span>
                            </p>
                            <p className="text-sm flex justify-between items-center text-gray-500">
                                <span>Insurance:</span>
                                <span>₹{formatIndianNumber(result.insuranceCost)}</span>
                            </p>
                            <p className="text-sm flex justify-between items-center text-gray-500">
                                <span>Depreciation:</span>
                                <span>₹{formatIndianNumber(result.depreciationCost)}</span>
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-100">
                    <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-3 sm:mb-4 text-green-600 flex items-center">
                        <FaBus className="w-4 h-4 sm:w-6 sm:h-6 mr-2" />
                        Public Transport
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                        <p className="text-base sm:text-lg flex justify-between items-center">
                            <span className="text-gray-600">Total Cost:</span>
                            <span className="font-bold text-gray-900">
                                ₹{formatIndianNumber(viewMode === 'monthly' ? result.totalCommuteCost : result.totalCommuteCost * 12)}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    const renderCharts = () => {
        if (!result) return null;

        const costBreakdown = [
            { name: 'Fuel', value: result.fuelCosts },
            { name: 'Maintenance', value: result.maintenanceCost },
            { name: 'Insurance', value: result.insuranceCost },
            { name: 'Depreciation', value: result.depreciationCost }
        ];

        // Generate monthly data points for the line/area chart
        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
            month: `Month ${i + 1}`,
            Car: result.totalCarCost,
            'Public Transport': result.totalCommuteCost
        }));

        const comparisonData = [
            {
                name: viewMode === 'monthly' ? 'Monthly' : 'Yearly',
                Car: viewMode === 'monthly' ? result.totalCarCost : result.totalCarCost * 12,
                'Public Transport': viewMode === 'monthly' ? result.totalCommuteCost : result.totalCommuteCost * 12
            }
        ];

        return (
            <div className="mt-6 sm:mt-8 space-y-6 sm:space-y-8">
                <div className="bg-white rounded-lg p-4 sm:p-6 shadow-md">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                        <h3 className="text-base sm:text-lg font-bold flex items-center">
                            <FaChartBar className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                            Cost Comparison
                        </h3>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setChartType('line')}
                                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center ${
                                    chartType === 'line'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                <FaChartLine className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                                Line
                            </button>
                            <button
                                onClick={() => setChartType('area')}
                                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center ${
                                    chartType === 'area'
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                <FaChartArea className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                                Area
                            </button>
                        </div>
                    </div>
                    <div className="h-[250px] sm:h-[300px] md:h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            {chartType === 'line' ? (
                                <LineChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" />
                                    <YAxis tickFormatter={(value) => `₹${formatIndianNumber(value)}`} />
                                    <Tooltip 
                                        formatter={(value: number) => [`₹${formatIndianNumber(value)}`, '']}
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '0.5rem', padding: '1rem' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="Car" stroke="#0088FE" strokeWidth={2} dot={{ r: 4 }} />
                                    <Line type="monotone" dataKey="Public Transport" stroke="#00C49F" strokeWidth={2} dot={{ r: 4 }} />
                                </LineChart>
                            ) : (
                                <AreaChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" />
                                    <YAxis tickFormatter={(value) => `₹${formatIndianNumber(value)}`} />
                                    <Tooltip 
                                        formatter={(value: number) => [`₹${formatIndianNumber(value)}`, '']}
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '0.5rem', padding: '1rem' }}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="Car" fill="#0088FE" fillOpacity={0.2} stroke="#0088FE" strokeWidth={2} />
                                    <Area type="monotone" dataKey="Public Transport" fill="#00C49F" fillOpacity={0.2} stroke="#00C49F" strokeWidth={2} />
                                </AreaChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-md">
                    <h3 className="text-lg font-bold mb-6 flex items-center">
                        <FaChartBar className="w-5 h-5 mr-2" />
                        Car Cost Breakdown
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={costBreakdown}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value, percent }) => 
                                    `${name} (₹${formatIndianNumber(value)}) ${(percent * 100).toFixed(0)}%`
                                }
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {costBreakdown.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(value: number) => [`₹${formatIndianNumber(value)}`, '']}
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '0.5rem', padding: '1rem' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-md">
                    <h3 className="text-lg font-bold mb-4 flex items-center">
                        <FaLeaf className="w-5 h-5 mr-2" />
                        Environmental Impact
                    </h3>
                    <div className="space-y-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                            <p className="text-blue-800 font-medium mb-2">
                                Your Carbon Footprint:
                            </p>
                            <p className="text-blue-600 text-2xl font-bold mb-1">
                                {result.yearlyEmissions.toFixed(2)} metric tons
                            </p>
                            <p className="text-blue-600 text-sm">
                                of CO2 emissions per year from car usage
                            </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                            <h4 className="font-semibold text-green-800 mb-3">Environmental Benefits of Public Transport:</h4>
                            <ul className="space-y-3">
                                {environmentalTips.map((tip, index) => (
                                    <li key={index} className="flex items-start text-green-700">
                                        <FaLeaf className="w-5 h-5 mr-2 mt-1 flex-shrink-0 text-green-500" />
                                        <span>{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 py-6 sm:py-8 lg:py-12 px-3 sm:px-4 lg:px-8">
            <div className="max-w-6xl mx-auto bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-center text-white mb-2 sm:mb-3">
                        Buy vs Commute Calculator
                    </h1>
                    <p className="text-center text-blue-100 text-sm sm:text-base lg:text-lg">
                        Compare the costs of buying a car versus using public transport
                    </p>
                </div>
                
                <div className="p-4 sm:p-6 lg:p-8 xl:p-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
                        <div className="space-y-4 sm:space-y-6">
                            <div className="pb-3 sm:pb-4 border-b border-gray-200">
                                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">Car Costs</h2>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1">Enter your estimated car-related expenses</p>
                            </div>
                            <div className="space-y-4 sm:space-y-6">
                                <InputField label="Car Price" name="carPrice" value={formData.carPrice} unit="₹" />
                                <InputField label="Fuel Efficiency" name="fuelEfficiency" value={formData.fuelEfficiency} unit="km/L" />
                                <InputField label="Fuel Price" name="fuelPrice" value={formData.fuelPrice} unit="₹/L" />
                                <InputField label="Monthly Maintenance" name="maintenanceCosts" value={formData.maintenanceCosts} unit="₹" />
                                <InputField label="Yearly Insurance" name="insuranceCosts" value={formData.insuranceCosts} unit="₹" />
                            </div>
                        </div>

                        <div className="space-y-4 sm:space-y-6">
                            <div className="pb-3 sm:pb-4 border-b border-gray-200">
                                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">Usage & Commute</h2>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1">Enter your commute details and preferences</p>
                            </div>
                            <div className="space-y-4 sm:space-y-6">
                                <InputField label="Distance to Work" name="distanceToWork" value={formData.distanceToWork} unit="km" />
                                <InputField label="Working Days per Month" name="workingDaysPerMonth" value={formData.workingDaysPerMonth} unit="days" />
                                <InputField label="Resale Value" name="resaleValue" value={formData.resaleValue} unit="₹" />
                                <InputField label="Years until Resale" name="resaleYears" value={formData.resaleYears} unit="years" />
                                <InputField label="Monthly Public Transport Cost" name="publicTransportCosts" value={formData.publicTransportCosts} unit="₹" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 sm:mt-10 lg:mt-12 text-center">
                        <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">Fields marked with <span className="text-red-500">*</span> are required</p>
                        <button
                            onClick={calculateCosts}
                            className="inline-flex items-center justify-center w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            <FaCalculator className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                            Calculate Costs
                        </button>
                    </div>

                    {result && (
                        <div className="mt-8 sm:mt-10 lg:mt-12">
                            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6 lg:p-8">
                                <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-6 mb-6 sm:mb-8">
                                    <button
                                        onClick={() => setViewMode('monthly')}
                                        className={`w-full sm:w-auto px-6 py-2 rounded-lg transition-all duration-200 ${
                                            viewMode === 'monthly'
                                                ? 'bg-blue-600 text-white shadow-lg'
                                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                        }`}
                                    >
                                        Monthly View
                                    </button>
                                    <button
                                        onClick={() => setViewMode('yearly')}
                                        className={`w-full sm:w-auto px-6 py-2 rounded-lg transition-all duration-200 ${
                                            viewMode === 'yearly'
                                                ? 'bg-blue-600 text-white shadow-lg'
                                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                        }`}
                                    >
                                        Yearly View
                                    </button>
                                </div>

                                {renderResults()}
                                {renderCharts()}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 