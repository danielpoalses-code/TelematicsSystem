export interface Dealership {
    id: string;
    name: string;
    lat: number;
    lng: number;
    targetUnits: number;
}

export const DEALER_NAMES: Dealership[] = [
    { id: 'centurion', name: 'Powerstar Centurion', lat: -25.864, lng: 28.165, targetUnits: 249 },
    { id: 'pmb', name: 'Powerstar PMB - Almighty Equipment', lat: -29.616, lng: 30.392, targetUnits: 121 },
    { id: 'ermelo', name: 'Powerstar Ermelo', lat: -26.533, lng: 29.983, targetUnits: 88 },
    { id: 'empangeni', name: 'Powerstar Empangeni', lat: -28.753, lng: 31.893, targetUnits: 77 },
    { id: 'pinetown', name: 'Powerstar Pinetown TCD', lat: -29.814, lng: 30.865, targetUnits: 55 },
    { id: 'brackenfell', name: 'Powerstar Brackenfell', lat: -33.882, lng: 18.694, targetUnits: 50 },
    { id: 'polokwane', name: 'Powerstar Polokwane', lat: -23.904, lng: 29.468, targetUnits: 35 },
    { id: 'brakpan', name: 'Powerstar Brakpan', lat: -26.235, lng: 28.371, targetUnits: 32 },
    { id: 'namibia_windhoek', name: 'Powerstar- Namibia - Windhoek - GDP Investments', lat: -22.559, lng: 17.083, targetUnits: 29 },
    { id: 'middelburg', name: 'Powerstar Middelburg', lat: -25.766, lng: 29.458, targetUnits: 28 },
    { id: 'namibia_swakopmund', name: 'Powerstar - Namibia - Swakopmund - Hendeca Machinery', lat: -22.684, lng: 14.533, targetUnits: 26 },
    { id: 'pe', name: 'Powerstar Port Elizabeth', lat: -33.960, lng: 25.602, targetUnits: 14 },
    { id: 'wonderboom', name: 'Powerstar Wonderboom', lat: -25.684, lng: 28.190, targetUnits: 13 },
    { id: 'bloemfontein', name: 'Powerstar Bloemfontein', lat: -29.114, lng: 26.227, targetUnits: 12 },
    { id: 'zimbabwe_harare', name: 'Powerstar Zimbabwe - Harare - T/A Machinery', lat: -17.825, lng: 31.033, targetUnits: 12 },
    { id: 'nelspruit', name: 'Powerstar Nelspruit', lat: -25.475, lng: 30.985, targetUnits: 6 },
    { id: 'schweizer_reneke', name: 'Powerstar Schweizer-Reneke', lat: -27.183, lng: 25.327, targetUnits: 6 },
    { id: 'upington', name: 'Powerstar Upington', lat: -28.447, lng: 21.255, targetUnits: 6 },
    { id: 'botswana', name: 'Powerstar Botswana', lat: -24.628, lng: 25.923, targetUnits: 5 },
    { id: 'klerksdorp', name: 'Powerstar Klerksdorp', lat: -26.852, lng: 26.666, targetUnits: 4 },
    { id: 'kimberly', name: 'Powerstar Kimberly', lat: -28.728, lng: 24.765, targetUnits: 3 },
    { id: 'mozambique_matola', name: 'Powerstar Mozambique - Matola - Haps', lat: -25.966, lng: 32.466, targetUnits: 2 },
    { id: 'randburg', name: 'Powerstar Randburg', lat: -26.095, lng: 27.994, targetUnits: 2 },
    { id: 'swaziland_matsapha', name: 'Powerstar Swaziland - Matsapha - Swazi Bus and Truck', lat: -26.500, lng: 31.316, targetUnits: 2 },
    { id: 'hibiscus_coast', name: 'Powerstar Hibiscus Coast', lat: -30.742, lng: 30.448, targetUnits: 2 },
    { id: 'mozambique_maputo', name: 'Powerstar Mozambique - Maputo - Centrocar', lat: -25.969, lng: 32.573, targetUnits: 1 },
    { id: 'port_shepstone', name: 'Powerstar Port Shepstone', lat: -30.742, lng: 30.448, targetUnits: 1 },
    { id: 'zambia', name: 'Powerstar Zambia', lat: -15.416, lng: 28.283, targetUnits: 1 }, // Lusaka
    { id: 'pmb_teichman', name: 'PMB Teichman SA', lat: -29.616, lng: 30.392, targetUnits: 1 },
    { id: 'balito', name: 'Powerstar Balito', lat: -29.533, lng: 31.216, targetUnits: 1 },
    { id: 'bloemfontein_trucknet', name: 'Powerstar Bloemfontein Truck Net', lat: -29.114, lng: 26.227, targetUnits: 1 },
    { id: 'george', name: 'Powerstar George', lat: -33.963, lng: 22.459, targetUnits: 1 }
];
