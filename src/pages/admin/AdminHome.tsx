import React, { useState } from 'react';
import {
    Truck, BatteryLow, Signal, ChevronDown, ChevronRight, Search,
    Zap, Info, Upload, RefreshCw, TrendingUp, ShieldOff, Wrench, Package, Car
} from 'lucide-react';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────
// Data parsed from 23.02.2026 Vehicle Health Report + Factory Battery Checks
// Status grouping logic:
//   Stop         → Never Made Contact  (0)
//   Stopped      → Connection Issue    (3)
//   Moving       → Connection Issue   (47)
//   Parking      → Battery Issues    (206)
//     └─ cross-ref battery report (16–24 Feb 2026):
//        ISO Switch ON  :  59
//        Battery Flat   :   5
//        GPS Battery Low:   1
//        Needs Field Chk: 141
// Total offline: 256
// ─────────────────────────────────────────────

interface VehicleRow {
    unit: string;
    dealer: string;
    lastUpdate: string;
    status: string;
    address: string;
    offline: string;
    category: 'never_contact' | 'connection_issue' | 'parking_battery';
    batteryAlarm?: string; // from batteries report cross-ref
}

const FLEET_DATA: VehicleRow[] = [
    // ── NEVER MADE CONTACT — none in this report

    // ── CONNECTION ISSUE — Moving / Stopped (GPS cached, no live link)
    { unit: '10135', dealer: 'Powerstar Pinetown TCD', lastUpdate: '11:53 20.02.2026', status: 'Moving 38 km/h', address: 'uMfolozi Local Municipality, Mbonambi Ward 7, L1701', offline: '2d 19h', category: 'connection_issue' },
    { unit: '10027', dealer: 'Powerstar Centurion', lastUpdate: '05:55 06.10.2025', status: 'Moving 33 km/h', address: 'Zimbabwe, Mutare, Sakubva, Musa Road', offline: '140d 1h', category: 'connection_issue' },
    { unit: '9700', dealer: 'Powerstar Centurion', lastUpdate: '07:13 23.10.2025', status: 'Moving 16 km/h', address: 'Alberton, Elandshaven, Prinsloo Street', offline: '123d 0h', category: 'connection_issue' },
    { unit: '10048', dealer: 'Powerstar Centurion', lastUpdate: '18:49 13.12.2025', status: 'Moving 10 km/h', address: 'Albert Luthuli Local Municipality, Albert Luthuli Ward 21', offline: '71d 12h', category: 'connection_issue' },
    { unit: '10195', dealer: 'Powerstar Centurion', lastUpdate: '12:49 20.01.2026', status: 'Moving 57 km/h', address: 'Botswana, Sese', offline: '33d 18h', category: 'connection_issue' },
    { unit: '10473', dealer: 'Powerstar Centurion', lastUpdate: '14:34 18.02.2026', status: 'Stopped', address: 'Madibeng Local Municipality, Mooinooi, Madibeng Ward 27', offline: '4d 17h', category: 'connection_issue' },
    { unit: '9677', dealer: 'Powerstar Centurion', lastUpdate: '14:14 20.02.2026', status: 'Moving 20 km/h', address: 'George, George Local Municipality, George Ward 25', offline: '2d 17h', category: 'connection_issue' },
    { unit: '9860', dealer: '10416 - 1627', lastUpdate: '17:29 21.02.2026', status: 'Moving 8 km/h', address: 'Tsantsabane Local Municipality, Tsantsabane Ward 6', offline: '1d 14h', category: 'connection_issue' },
    { unit: '10036', dealer: 'Powerstar Ermelo', lastUpdate: '14:55 17.10.2025', status: 'Moving 48 km/h', address: 'Lekwa Local Municipality, Lekwa Ward 12, R35', offline: '128d 16h', category: 'connection_issue' },
    { unit: '9969', dealer: 'Powerstar Ermelo', lastUpdate: '18:55 29.12.2025', status: 'Moving 43 km/h', address: 'Eswatini, Buhleni, MR6', offline: '55d 12h', category: 'connection_issue' },
    { unit: '9878', dealer: 'Powerstar Ermelo', lastUpdate: '12:09 20.02.2026', status: 'Moving 12 km/h', address: 'Mkhondo Local Municipality, Mkhondo Ward 18', offline: '2d 19h', category: 'connection_issue' },
    { unit: '10469', dealer: 'Powerstar Ermelo', lastUpdate: '16:01 20.02.2026', status: 'Moving 22 km/h', address: 'uPhongolo Local Municipality, uPhongolo Ward 1, D737', offline: '2d 15h', category: 'connection_issue' },
    { unit: '10055', dealer: 'Powerstar- Namibia - Windhoek - GDP Investments', lastUpdate: '13:53 15.08.2025', status: 'Moving 64 km/h', address: 'Namibia, B3', offline: '191d 17h', category: 'connection_issue' },
    { unit: '9843', dealer: 'Powerstar- Namibia - Windhoek - GDP Investments', lastUpdate: '16:53 03.10.2025', status: 'Moving 68 km/h', address: 'Namibia, B3', offline: '142d 14h', category: 'connection_issue' },
    { unit: '9842', dealer: 'Powerstar- Namibia - Windhoek - GDP Investments', lastUpdate: '08:30 09.10.2025', status: 'Moving 66 km/h', address: 'Namibia, B3', offline: '136d 23h', category: 'connection_issue' },
    { unit: '9841', dealer: 'Powerstar- Namibia - Windhoek - GDP Investments', lastUpdate: '18:02 12.12.2025', status: 'Moving 66 km/h', address: 'Namibia, Kaisosi, B8', offline: '72d 13h', category: 'connection_issue' },
    { unit: '10243', dealer: 'Powerstar- Namibia - Windhoek - GDP Investments', lastUpdate: '02:56 21.12.2025', status: 'Moving 46 km/h', address: 'Upington, ǁKhara Hais Ward 11, N10', offline: '64d 4h', category: 'connection_issue' },
    { unit: '9724', dealer: 'Powerstar- Namibia - Windhoek - GDP Investments', lastUpdate: '22:35 06.02.2026', status: 'Moving 62 km/h', address: 'Namibia, B1', offline: '16d 9h', category: 'connection_issue' },
    { unit: '10614', dealer: 'Powerstar- Namibia - Windhoek - GDP Investments', lastUpdate: '22:07 18.02.2026', status: 'Moving 58 km/h', address: 'Namibia, B1', offline: '4d 9h', category: 'connection_issue' },
    { unit: '10568', dealer: 'Powerstar- Namibia - Windhoek - GDP Investments', lastUpdate: '12:51 19.02.2026', status: 'Moving 63 km/h', address: 'Namibia, B1', offline: '3d 18h', category: 'connection_issue' },
    { unit: '9997', dealer: 'Powerstar- Namibia - Windhoek - GDP Investments', lastUpdate: '14:04 21.02.2026', status: 'Moving 65 km/h', address: 'Namibia, B3', offline: '1d 17h', category: 'connection_issue' },
    { unit: '9684', dealer: 'Powerstar Empangeni', lastUpdate: '02:58 23.02.2026', status: 'Moving 16 km/h', address: 'Richards Bay, uMhlathuze Ward 2', offline: '4h', category: 'connection_issue' },
    { unit: '10444', dealer: 'Powerstar PMB - Almighty Equipment', lastUpdate: '13:27 01.12.2025', status: 'Moving 32 km/h', address: 'Zimbabwe, Municipality of Beitbridge, Harare-Beitbridge Highway', offline: '83d 18h', category: 'connection_issue' },
    { unit: '9694', dealer: 'Powerstar PMB - Almighty Equipment', lastUpdate: '15:54 05.12.2025', status: 'Moving 37 km/h', address: 'Hibiscus Coast Local Municipality, Hibiscus Coast Ward 15, D365', offline: '79d 15h', category: 'connection_issue' },
    { unit: '9882', dealer: 'Powerstar PMB - Almighty Equipment', lastUpdate: '06:38 18.01.2026', status: 'Moving 52 km/h', address: 'Zimbabwe, Municipality of Beitbridge, Harare-Beitbridge Highway', offline: '36d 1h', category: 'connection_issue' },
    { unit: '10345', dealer: 'Powerstar PMB - Almighty Equipment', lastUpdate: '06:52 18.01.2026', status: 'Stopped', address: 'Zimbabwe, Municipality of Beitbridge, Harare-Beitbridge Highway', offline: '36d 0h', category: 'connection_issue' },
    { unit: '10431', dealer: 'Powerstar PMB - Almighty Equipment', lastUpdate: '13:38 21.02.2026', status: 'Moving 6 km/h', address: 'Mkhondo Local Municipality, Mkhondo Ward 6, N2', offline: '1d 18h', category: 'connection_issue' },
    { unit: '9960', dealer: 'Powerstar Brakpan', lastUpdate: '09:05 26.11.2025', status: 'Moving 14 km/h', address: 'Secunda, Govan Mbeki Ward 15', offline: '88d 22h', category: 'connection_issue' },
    { unit: '9750', dealer: 'Powerstar Brakpan', lastUpdate: '16:19 31.01.2026', status: 'Moving 7 km/h', address: 'Krugersdorp, Mogale City Ward 26, Paardekraal Drive', offline: '22d 15h', category: 'connection_issue' },
    { unit: '10053', dealer: 'Powerstar Bloemfontein', lastUpdate: '15:27 08.12.2025', status: 'Moving 48 km/h', address: 'Kouga Local Municipality, Oyster Bay, Kouga Ward 1', offline: '76d 16h', category: 'connection_issue' },
    { unit: '9884', dealer: 'PMB Teichman SA', lastUpdate: '11:02 19.10.2025', status: 'Moving 10 km/h', address: 'Botswana, Martin\'s Drift, B140', offline: '126d 20h', category: 'connection_issue' },
    { unit: '10174', dealer: 'Powerstar Polokwane', lastUpdate: '15:37 15.10.2025', status: 'Moving 38 km/h', address: 'Thaba Chweu Local Municipality, Thaba Chweu Ward 10, R533', offline: '130d 16h', category: 'connection_issue' },
    { unit: '10216', dealer: 'Powerstar Polokwane', lastUpdate: '19:38 13.11.2025', status: 'Moving 4 km/h', address: 'Botswana, Martin\'s Drift, B140', offline: '101d 12h', category: 'connection_issue' },
    { unit: '9870', dealer: 'Powerstar Polokwane', lastUpdate: '17:01 21.02.2026', status: 'Moving 23 km/h', address: 'Musina Local Municipality, Musina Ward 2', offline: '1d 14h', category: 'connection_issue' },
    { unit: '9845', dealer: 'Powerstar Zimbabwe - Harare - T/A Machinery', lastUpdate: '13:24 01.10.2025', status: 'Moving 76 km/h', address: 'Zimbabwe, R2', offline: '144d 18h', category: 'connection_issue' },
    { unit: '10063', dealer: 'Powerstar - Nambia - Swakopmund - Hendeca Machinary', lastUpdate: '07:44 13.08.2025', status: 'Moving 63 km/h', address: 'Upington, ǁKhara Hais Ward 11, N10', offline: '193d 23h', category: 'connection_issue' },
    { unit: '10064', dealer: 'Powerstar - Nambia - Swakopmund - Hendeca Machinary', lastUpdate: '01:06 17.08.2025', status: 'Moving 53 km/h', address: '!Kheis Local Municipality, !Kheis Ward 1, N10', offline: '190d 6h', category: 'connection_issue' },
    { unit: '10061', dealer: 'Powerstar - Nambia - Swakopmund - Hendeca Machinary', lastUpdate: '10:24 24.08.2025', status: 'Moving 66 km/h', address: 'Upington, ǁKhara Hais Ward 11, N10', offline: '182d 21h', category: 'connection_issue' },
    { unit: '10156', dealer: 'Powerstar - Nambia - Swakopmund - Hendeca Machinary', lastUpdate: '13:04 24.08.2025', status: 'Moving 57 km/h', address: 'Namibia, B3', offline: '182d 18h', category: 'connection_issue' },
    { unit: '10183', dealer: 'Powerstar - Nambia - Swakopmund - Hendeca Machinary', lastUpdate: '14:29 29.08.2025', status: 'Moving 4 km/h', address: 'Namibia', offline: '177d 17h', category: 'connection_issue' },
    { unit: '10227', dealer: 'Powerstar - Nambia - Swakopmund - Hendeca Machinary', lastUpdate: '10:09 05.09.2025', status: 'Moving 65 km/h', address: 'Upington, ǁKhara Hais Ward 11, N10', offline: '170d 21h', category: 'connection_issue' },
    { unit: '10228', dealer: 'Powerstar - Nambia - Swakopmund - Hendeca Machinary', lastUpdate: '10:18 05.09.2025', status: 'Moving 67 km/h', address: 'Upington, ǁKhara Hais Ward 11, N10', offline: '170d 21h', category: 'connection_issue' },
    { unit: '10255', dealer: 'Powerstar - Nambia - Swakopmund - Hendeca Machinary', lastUpdate: '09:28 15.10.2025', status: 'Moving 77 km/h', address: 'Namibia, MR118', offline: '130d 22h', category: 'connection_issue' },
    { unit: '10292', dealer: 'Powerstar - Nambia - Swakopmund - Hendeca Machinary', lastUpdate: '00:49 13.11.2025', status: 'Moving 76 km/h', address: 'Upington, ǁKhara Hais Ward 11, N10', offline: '102d 6h', category: 'connection_issue' },
    { unit: '10293', dealer: 'Powerstar - Nambia - Swakopmund - Hendeca Machinary', lastUpdate: '00:49 13.11.2025', status: 'Moving 77 km/h', address: 'Upington, ǁKhara Hais Ward 11, N10', offline: '102d 6h', category: 'connection_issue' },
    { unit: '10315', dealer: 'Powerstar - Nambia - Swakopmund - Hendeca Machinary', lastUpdate: '17:28 16.02.2026', status: 'Stopped', address: 'Namibia', offline: '6d 14h', category: 'connection_issue' },
    { unit: '10166', dealer: 'Powerstar Brackenfell', lastUpdate: '11:41 27.01.2026', status: 'Moving 55 km/h', address: 'Kareeberg Local Municipality, Kareeberg Ward 4', offline: '26d 19h', category: 'connection_issue' },
    { unit: '9876', dealer: 'Powerstar Botswana', lastUpdate: '16:00 20.02.2026', status: 'Moving 75 km/h', address: 'Angola, Saurimo, EN180', offline: '2d 15h', category: 'connection_issue' },
    { unit: '10070', dealer: 'Powerstar Nelspruit', lastUpdate: '07:09 19.11.2025', status: 'Moving 81 km/h', address: 'Namibia, B1', offline: '96d 0h', category: 'connection_issue' },
    { unit: '9703', dealer: 'Powerstar Mozambique - Maputo - Centrocar', lastUpdate: '11:28 03.10.2025', status: 'Moving 9 km/h', address: 'Mozambique, Ressano Garcia', offline: '142d 20h', category: 'connection_issue' },

    // ── PARKING → Battery cross-ref ±2d proximity to offline date
    // ISO Switch: 57 | Battery Flat: 5 | Needs Field Check: 144 | GPS battery ignored
    { unit: '10134', dealer: 'Powerstar Pinetown TCD', lastUpdate: '14:02 12.08.2025', status: 'Parking', address: 'Westmead, Westgate Place', offline: '194d 17h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9720', dealer: 'Powerstar Pinetown TCD', lastUpdate: '11:27 17.10.2025', status: 'Parking', address: 'Hibiscus Coast Local Municipality, Hibiscus Coast Ward 18, Howe Road', offline: '128d 20h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10483', dealer: 'Powerstar Pinetown TCD', lastUpdate: '19:10 18.01.2026', status: 'Parking', address: 'Westmead, Westgate Place', offline: '35d 12h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10482', dealer: 'Powerstar Pinetown TCD', lastUpdate: '10:00 09.02.2026', status: 'Parking', address: 'Westmead, Westgate Place', offline: '13d 21h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10471', dealer: 'Powerstar Pinetown TCD', lastUpdate: '08:33 19.02.2026', status: 'Parking', address: 'Knights, Shaft Road', offline: '3d 23h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '9827', dealer: 'Powerstar Pinetown TCD', lastUpdate: '01:59 21.02.2026', status: 'Parking', address: 'Klaarwater, Ndwandwe Street', offline: '2d 5h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '9804', dealer: 'Powerstar Pinetown TCD', lastUpdate: '10:14 21.02.2026', status: 'Parking', address: 'Mandeni Local Municipality, Tugela, Mandeni Ward 4', offline: '1d 21h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10023', dealer: 'Powerstar Centurion', lastUpdate: '08:54 11.07.2025', status: 'Parking', address: 'Golden Fields Estate, Tshwane Ward 78, Park Avenue North', offline: '226d 22h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10025', dealer: 'Powerstar Centurion', lastUpdate: '15:59 28.10.2025', status: 'Parking', address: 'Pretoria, Booysens, Van der Hoff Road', offline: '117d 15h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9977', dealer: 'Powerstar Centurion', lastUpdate: '04:25 10.11.2025', status: 'Parking', address: 'Golden Fields Estate, Tshwane Ward 78, Park Avenue North', offline: '105d 3h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10465', dealer: 'Powerstar Centurion', lastUpdate: '04:31 10.11.2025', status: 'Parking', address: 'Golden Fields Estate, Tshwane Ward 78, Park Avenue North', offline: '105d 3h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10462', dealer: 'Powerstar Centurion', lastUpdate: '04:40 10.11.2025', status: 'Parking', address: 'Golden Fields Estate, Tshwane Ward 78, Park Avenue North', offline: '105d 3h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10257', dealer: 'Powerstar Centurion', lastUpdate: '09:23 28.11.2025', status: 'Parking', address: 'Golden Fields Estate, Tshwane Ward 78, Park Avenue North', offline: '86d 22h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10259', dealer: 'Powerstar Centurion', lastUpdate: '01:40 02.12.2025', status: 'Parking', address: 'uMdoni Local Municipality, Scottburgh, Scottburgh South, N2', offline: '83d 6h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10441', dealer: 'Powerstar Centurion', lastUpdate: '11:55 12.12.2025', status: 'Parking', address: 'Golden Fields Estate, Tshwane Ward 78, Park Avenue North', offline: '72d 19h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10180', dealer: 'Powerstar Centurion', lastUpdate: '17:13 07.01.2026', status: 'Parking', address: 'Cato Ridge, 73028 Track', offline: '46d 14h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10440', dealer: 'Powerstar Centurion', lastUpdate: '18:47 13.01.2026', status: 'Parking', address: 'Golden Fields Estate, Tshwane Ward 78, Park Avenue North', offline: '40d 12h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10461', dealer: 'Powerstar Centurion', lastUpdate: '01:47 18.01.2026', status: 'Parking', address: 'Golden Fields Estate, Tshwane Ward 78, Park Avenue North', offline: '36d 5h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9993', dealer: 'Powerstar Centurion', lastUpdate: '05:10 20.01.2026', status: 'Parking', address: 'Golden Fields Estate, Tshwane Ward 78, Park Avenue North', offline: '34d 2h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10585', dealer: 'Powerstar Centurion', lastUpdate: '17:49 28.01.2026', status: 'Parking', address: 'Namibia, 13008, Karibib, C32', offline: '25d 13h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10584', dealer: 'Powerstar Centurion', lastUpdate: '17:57 28.01.2026', status: 'Parking', address: 'Namibia, 13008, Karibib, C32', offline: '25d 13h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9795', dealer: 'Powerstar Centurion', lastUpdate: '11:17 29.01.2026', status: 'Parking', address: 'Rustenburg Local Municipality, Rustenburg Ward 32', offline: '24d 20h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10526', dealer: 'Powerstar Centurion', lastUpdate: '12:21 03.02.2026', status: 'Parking', address: 'Golden Fields Estate, Tshwane Ward 78, Park Avenue North', offline: '19d 19h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10499', dealer: 'Powerstar Centurion', lastUpdate: '12:34 03.02.2026', status: 'Parking', address: 'Golden Fields Estate, Tshwane Ward 78, Park Avenue North', offline: '19d 19h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10022', dealer: 'Powerstar Centurion', lastUpdate: '15:07 05.02.2026', status: 'Parking', address: 'uMdoni Local Municipality, Scottburgh, Scottburgh South, N2', offline: '17d 16h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10596', dealer: 'Powerstar Centurion', lastUpdate: '09:26 06.02.2026', status: 'Parking', address: 'Boksburg, Ekurhuleni Ward 22, Tile Road', offline: '16d 22h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10040', dealer: 'Powerstar Centurion', lastUpdate: '19:24 08.02.2026', status: 'Parking', address: 'Tshwane Ward 101', offline: '14d 12h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9979', dealer: 'Powerstar Centurion', lastUpdate: '14:54 09.02.2026', status: 'Parking', address: 'Knights, Shaft Road', offline: '13d 16h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10181', dealer: 'Powerstar Centurion', lastUpdate: '17:34 12.02.2026', status: 'Parking', address: 'Tshwane Ward 86, Vonkprop Road', offline: '10d 14h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10256', dealer: 'Powerstar Centurion', lastUpdate: '07:37 13.02.2026', status: 'Parking', address: 'Joe Morolong Local Municipality, Joe Morolong Ward 4', offline: '10d 0h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10504', dealer: 'Powerstar Centurion', lastUpdate: '17:47 16.02.2026', status: 'Parking', address: 'Ekurhuleni Ward 100', offline: '6d 13h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10205', dealer: 'Powerstar Centurion', lastUpdate: '08:19 17.02.2026', status: 'Parking', address: 'Eswatini, M202, Matsapha, Sicholo Street', offline: '5d 23h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10632', dealer: 'Powerstar Centurion', lastUpdate: '00:23 18.02.2026', status: 'Parking', address: 'Mogale City Local Municipality, Mogale City Ward 33, Nooitgedacht Road', offline: '5d 7h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10633', dealer: 'Powerstar Centurion', lastUpdate: '13:52 18.02.2026', status: 'Parking', address: 'Vaalbank, N4', offline: '4d 17h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10258', dealer: 'Powerstar Centurion', lastUpdate: '08:26 20.02.2026', status: 'Parking', address: 'Victor Khanye Local Municipality, Victor Khanye Ward 7', offline: '2d 23h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10412', dealer: 'Powerstar Centurion', lastUpdate: '08:39 20.02.2026', status: 'Parking', address: 'eThekwini Ward 16, Wiltshire Road', offline: '2d 23h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10634', dealer: 'Powerstar Centurion', lastUpdate: '12:19 20.02.2026', status: 'Parking', address: 'Tshwane Ward 86, Vonkprop Road', offline: '2d 19h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '9678', dealer: 'Powerstar Centurion', lastUpdate: '13:38 20.02.2026', status: 'Parking', address: 'Joe Morolong Local Municipality, Joe Morolong Ward 4', offline: '2d 18h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '9830', dealer: '10416 - 1627', lastUpdate: '15:58 20.02.2026', status: 'Parking', address: 'Senqu Local Municipality, Barkly East, Senqu Ward 19, Copeland Street', offline: '2d 15h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10438', dealer: '10416 - 1627', lastUpdate: '16:43 20.02.2026', status: 'Parking', address: 'Golden Fields Estate, Tshwane Ward 78, Park Avenue North', offline: '2d 14h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '9862', dealer: '10416 - 1627', lastUpdate: '20:31 20.02.2026', status: 'Parking', address: 'uMdoni Local Municipality, Scottburgh, Scottburgh South, N2', offline: '2d 11h', category: 'parking_battery', batteryAlarm: 'Battery Flat' },
    { unit: '10460', dealer: '10416 - 1627', lastUpdate: '03:29 21.02.2026', status: 'Parking', address: 'Golden Fields Estate, Tshwane Ward 78, Park Avenue North', offline: '2d 4h', category: 'parking_battery', batteryAlarm: 'Battery Flat' },
    { unit: '9888', dealer: '10416 - 1627', lastUpdate: '13:04 21.02.2026', status: 'Parking', address: 'Lephalale Local Municipality, Lephalale Ward 2', offline: '1d 18h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10314', dealer: '10416 - 1627', lastUpdate: '14:43 21.02.2026', status: 'Parking', address: 'Krugersdorp, Mogale City Ward 23', offline: '1d 16h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10044', dealer: '10416 - 1627', lastUpdate: '14:44 21.02.2026', status: 'Parking', address: 'Rustenburg Local Municipality, Rustenburg Ward 32', offline: '1d 16h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10173', dealer: '10416 - 1627', lastUpdate: '16:04 21.02.2026', status: 'Parking', address: 'Tsantsabane Local Municipality, Tsantsabane Ward 6', offline: '1d 15h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10369', dealer: '10416 - 1627', lastUpdate: '16:43 21.02.2026', status: 'Parking', address: 'Gamagara Local Municipality, Gamagara Ward 5', offline: '1d 14h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '9856', dealer: '10416 - 1627', lastUpdate: '10:33 22.02.2026', status: 'Parking', address: 'Golden Fields Estate, Tshwane Ward 78, Park Avenue North', offline: '21h', category: 'parking_battery', batteryAlarm: 'Battery Flat' },
    { unit: '10472', dealer: '10416 - 1627', lastUpdate: '16:52 22.02.2026', status: 'Parking', address: 'Rustenburg Local Municipality, Rustenburg Ward 3', offline: '14h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10522', dealer: '10416 - 1627', lastUpdate: '16:55 22.02.2026', status: 'Parking', address: 'Tsantsabane Local Municipality, Tsantsabane Ward 6', offline: '14h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10051', dealer: '10416 - 1627', lastUpdate: '17:12 22.02.2026', status: 'Parking', address: 'Khâi-Ma Local Municipality, Pofadder, Khâi-Ma Ward 4, N14', offline: '14h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10586', dealer: '10416 - 1627', lastUpdate: '17:55 22.02.2026', status: 'Parking', address: 'Namibia, 13008, Karibib, C32', offline: '13h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10058', dealer: '10416 - 1627', lastUpdate: '18:18 22.02.2026', status: 'Parking', address: 'Kai !Garib Local Municipality, Kai !Garib Ward 5, R359', offline: '13h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10204', dealer: '10416 - 1627', lastUpdate: '18:48 22.02.2026', status: 'Parking', address: 'Eswatini, Mampolo, Emkhweni', offline: '12h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '9775', dealer: '10416 - 1627', lastUpdate: '20:02 22.02.2026', status: 'Parking', address: 'Steve Tshwete Local Municipality, Steve Tshwete Ward 6', offline: '11h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10307', dealer: '10416 - 1627', lastUpdate: '21:14 22.02.2026', status: 'Parking', address: 'Govan Mbeki Local Municipality, Govan Mbeki Ward 22', offline: '10h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9866', dealer: '10416 - 1627', lastUpdate: '02:16 23.02.2026', status: 'Parking', address: 'Ekurhuleni Ward 45, Whipp Road', offline: '5h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10188', dealer: '10416 - 1627', lastUpdate: '03:36 23.02.2026', status: 'Parking', address: 'Engcobo Local Municipality, Ngcobo, Mansonwabe, R61', offline: '4h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9880', dealer: 'Powerstar Ermelo', lastUpdate: '16:11 09.10.2025', status: 'Parking', address: 'Zimbabwe, Harare, Borrowdale Road', offline: '136d 15h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10501', dealer: 'Powerstar Ermelo', lastUpdate: '14:29 22.12.2025', status: 'Parking', address: 'Polokwane, Polokwane Ward 23, Nelson Mandela Drive', offline: '62d 17h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10590', dealer: 'Powerstar Ermelo', lastUpdate: '18:59 28.01.2026', status: 'Parking', address: 'Upington, ǁKhara Hais Ward 8, Dorper Street', offline: '25d 12h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9679', dealer: 'Powerstar Ermelo', lastUpdate: '13:16 29.01.2026', status: 'Parking', address: 'Vaalbank, N4', offline: '24d 18h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10640', dealer: 'Powerstar Ermelo', lastUpdate: '15:39 02.02.2026', status: 'Parking', address: 'Pretoria, Hermanstad, Taljaard Street', offline: '20d 16h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10678', dealer: 'Powerstar Ermelo', lastUpdate: '15:44 02.02.2026', status: 'Parking', address: 'Pretoria, Hermanstad, Taljaard Street', offline: '20d 15h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9764', dealer: 'Powerstar Ermelo', lastUpdate: '15:34 03.02.2026', status: 'Parking', address: 'Steve Tshwete Local Municipality, Steve Tshwete Ward 11', offline: '19d 16h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10346', dealer: 'Powerstar Ermelo', lastUpdate: '05:37 07.02.2026', status: 'Parking', address: 'Mkhondo Local Municipality, Piet Retief, Mkhondo Ward 8, D395', offline: '16d 2h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9765', dealer: 'Powerstar Ermelo', lastUpdate: '08:49 11.02.2026', status: 'Parking', address: 'Steve Tshwete Local Municipality, Steve Tshwete Ward 11', offline: '11d 22h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10409', dealer: 'Powerstar Ermelo', lastUpdate: '09:09 11.02.2026', status: 'Parking', address: 'Mkhondo Local Municipality, Piet Retief, Mkhondo Ward 8, D395', offline: '11d 22h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9879', dealer: 'Powerstar Ermelo', lastUpdate: '09:09 14.02.2026', status: 'Parking', address: 'Mkhondo Local Municipality, Mkhondo Ward 4', offline: '8d 22h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10641', dealer: 'Powerstar Ermelo', lastUpdate: '07:12 19.02.2026', status: 'Parking', address: 'Mkhondo Local Municipality, Piet Retief, Mkhondo Ward 7', offline: '4d 0h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10674', dealer: 'Powerstar Ermelo', lastUpdate: '14:00 19.02.2026', status: 'Parking', address: 'Pretoria, Hermanstad, Rood Street', offline: '3d 17h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10411', dealer: 'Powerstar Ermelo', lastUpdate: '16:39 19.02.2026', status: 'Parking', address: 'Mkhondo Local Municipality, Piet Retief, Mkhondo Ward 8, D395', offline: '3d 15h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10595', dealer: 'Powerstar Ermelo', lastUpdate: '09:27 21.02.2026', status: 'Parking', address: 'Pomona, 5th Road', offline: '1d 22h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10042', dealer: 'Powerstar Ermelo', lastUpdate: '12:21 21.02.2026', status: 'Parking', address: 'Emalahleni Local Municipality, Emalahleni Ward 32', offline: '1d 19h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '9819', dealer: 'Powerstar Ermelo', lastUpdate: '22:03 21.02.2026', status: 'Parking', address: 'Steve Tshwete Local Municipality, Steve Tshwete Ward 11', offline: '1d 9h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10485', dealer: 'Powerstar Wonderboom', lastUpdate: '13:39 01.11.2025', status: 'Parking', address: 'Pretoria, Annlin, Lavender Road', offline: '113d 18h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10560', dealer: 'Powerstar Wonderboom', lastUpdate: '17:41 15.12.2025', status: 'Parking', address: 'Pretoria, Annlin, Lavender Road', offline: '69d 13h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10484', dealer: 'Powerstar Wonderboom', lastUpdate: '12:57 20.12.2025', status: 'Parking', address: 'Pretoria, Annlin, Lavender Road', offline: '64d 18h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9699', dealer: 'Powerstar Wonderboom', lastUpdate: '16:32 22.02.2026', status: 'Parking', address: '!Kheis Local Municipality, !Kheis Ward 1', offline: '15h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9779', dealer: 'Powerstar Wonderboom', lastUpdate: '16:39 22.02.2026', status: 'Parking', address: '!Kheis Local Municipality, !Kheis Ward 1', offline: '15h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9815', dealer: 'Powerstar- Namibia - Windhoek - GDP Investments', lastUpdate: '10:29 19.06.2025', status: 'Parking', address: 'Pietermaritzburg, Meadows, Edison Place', offline: '248d 21h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9722', dealer: 'Powerstar- Namibia - Windhoek - GDP Investments', lastUpdate: '15:24 08.02.2026', status: 'Parking', address: 'Namibia, Omuntele, Ondjamba, D3645', offline: '14d 16h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10443', dealer: 'Powerstar- Namibia - Windhoek - GDP Investments', lastUpdate: '16:32 08.02.2026', status: 'Parking', address: 'Namibia, Omuntele, Ondjamba, D3645', offline: '14d 15h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9721', dealer: 'Powerstar- Namibia - Windhoek - GDP Investments', lastUpdate: '11:50 09.02.2026', status: 'Parking', address: 'Namibia, Omuntele, Ondjamba, D3645', offline: '13d 19h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9723', dealer: 'Powerstar- Namibia - Windhoek - GDP Investments', lastUpdate: '08:41 12.02.2026', status: 'Parking', address: 'Namibia, Omuntele, Ondjamba, D3645', offline: '10d 23h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10464', dealer: 'Powerstar- Namibia - Windhoek - GDP Investments', lastUpdate: '06:36 16.02.2026', status: 'Parking', address: 'Namibia, Okahandja, Noord Street', offline: '7d 1h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10001', dealer: 'Powerstar- Namibia - Windhoek - GDP Investments', lastUpdate: '07:41 16.02.2026', status: 'Parking', address: 'Namibia, D3637', offline: '6d 23h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9811', dealer: 'Powerstar- Namibia - Windhoek - GDP Investments', lastUpdate: '08:53 16.02.2026', status: 'Parking', address: 'Namibia, C38', offline: '6d 22h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10494', dealer: 'Powerstar- Namibia - Windhoek - GDP Investments', lastUpdate: '15:15 16.02.2026', status: 'Parking', address: 'Namibia, Omaruru', offline: '6d 16h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10130', dealer: 'Powerstar- Namibia - Windhoek - GDP Investments', lastUpdate: '18:17 18.02.2026', status: 'Parking', address: 'Namibia, Brakwater', offline: '4d 13h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10122', dealer: 'Powerstar- Namibia - Windhoek - GDP Investments', lastUpdate: '15:53 20.02.2026', status: 'Parking', address: 'Namibia, Brakwater', offline: '2d 15h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '9760', dealer: 'Powerstar Empangeni', lastUpdate: '13:17 10.09.2025', status: 'Parking', address: 'Pinetown, Padfield Park, Escom Road', offline: '165d 18h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10248', dealer: 'Powerstar Empangeni', lastUpdate: '09:55 02.10.2025', status: 'Parking', address: 'uMhlathuze Local Municipality, Empangeni, uMhlathuze Ward 24, R34', offline: '143d 21h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10261', dealer: 'Powerstar Empangeni', lastUpdate: '09:34 12.12.2025', status: 'Parking', address: 'Ekurhuleni Ward 17, Anvil Street', offline: '72d 22h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9689', dealer: 'Powerstar Empangeni', lastUpdate: '00:05 05.01.2026', status: 'Parking', address: 'Mount Moriah, Souk Square', offline: '49d 7h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10667', dealer: 'Powerstar Empangeni', lastUpdate: '09:26 30.01.2026', status: 'Parking', address: 'eThekwini Ward 15, Trafford Road', offline: '23d 22h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10264', dealer: 'Powerstar Empangeni', lastUpdate: '09:38 10.02.2026', status: 'Parking', address: 'Maphumulo Local Municipality, Mapumulo, R74', offline: '12d 22h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10262', dealer: 'Powerstar Empangeni', lastUpdate: '12:35 10.02.2026', status: 'Parking', address: 'Maphumulo Local Municipality, Mapumulo, R74', offline: '12d 19h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10607', dealer: 'Powerstar Empangeni', lastUpdate: '09:09 11.02.2026', status: 'Parking', address: 'Emfuleni Local Municipality, Emfuleni Ward 15, Kelvin Street', offline: '11d 22h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10338', dealer: 'Powerstar Empangeni', lastUpdate: '11:44 21.02.2026', status: 'Parking', address: 'Hibiscus Coast Local Municipality, Umtentweni, Sea Park, Link Road', offline: '1d 19h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '9683', dealer: 'Powerstar Empangeni', lastUpdate: '22:21 22.02.2026', status: 'Parking', address: 'Richards Bay, uMhlathuze Ward 2, Copper Corner', offline: '9h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9864', dealer: 'Powerstar PMB - Almighty Equipment', lastUpdate: '20:02 20.08.2025', status: 'Parking', address: 'Pietermaritzburg, Msunduzi Ward 5, D1125', offline: '186d 11h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9728', dealer: 'Powerstar PMB - Almighty Equipment', lastUpdate: '04:44 24.08.2025', status: 'Parking', address: 'Mbizana Local Municipality, Mbizana Ward 31', offline: '183d 2h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10232', dealer: 'Powerstar PMB - Almighty Equipment', lastUpdate: '09:59 19.11.2025', status: 'Parking', address: 'City of Johannesburg Metropolitan Municipality, Johannesburg, Kew, 13th Road', offline: '95d 21h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9742', dealer: 'Powerstar PMB - Almighty Equipment', lastUpdate: '11:06 08.01.2026', status: 'Parking', address: 'Mandeni Local Municipality, Mandeni Ward 12', offline: '45d 20h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10344', dealer: 'Powerstar PMB - Almighty Equipment', lastUpdate: '08:58 26.01.2026', status: 'Parking', address: 'City of Johannesburg Metropolitan Municipality, Johannesburg, Kew, 12th Road', offline: '27d 22h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10282', dealer: 'Powerstar PMB - Almighty Equipment', lastUpdate: '21:04 28.01.2026', status: 'Parking', address: 'Zimbabwe, Municipality of Beitbridge, Beitbridge', offline: '25d 10h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10528', dealer: 'Powerstar PMB - Almighty Equipment', lastUpdate: '10:05 12.02.2026', status: 'Parking', address: 'Pietermaritzburg, Meadows, C.B. Downes Road', offline: '10d 21h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9729', dealer: 'Powerstar PMB - Almighty Equipment', lastUpdate: '19:39 15.02.2026', status: 'Parking', address: 'Ladysmith, Emnambithi/Ladysmith Ward 27', offline: '7d 12h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10033', dealer: 'Powerstar PMB - Almighty Equipment', lastUpdate: '16:42 18.02.2026', status: 'Parking', address: 'eThekwini Ward 15, Le Mans Place', offline: '4d 14h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10286', dealer: 'Powerstar PMB - Almighty Equipment', lastUpdate: '21:11 21.02.2026', status: 'Parking', address: 'Tsantsabane Local Municipality, Tsantsabane Ward 6', offline: '1d 10h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10229', dealer: 'Powerstar PMB - Almighty Equipment', lastUpdate: '10:15 22.02.2026', status: 'Parking', address: 'uMshwathi Local Municipality, uMshwathi Ward 9, P25-1', offline: '21h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10291', dealer: 'Powerstar PMB - Almighty Equipment', lastUpdate: '16:06 22.02.2026', status: 'Parking', address: 'Tsantsabane Local Municipality, Tsantsabane Ward 6', offline: '15h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10573', dealer: 'Powerstar PMB - Almighty Equipment', lastUpdate: '17:03 22.02.2026', status: 'Parking', address: 'Tsantsabane Local Municipality, Tsantsabane Ward 6', offline: '14h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '9863', dealer: 'Powerstar PMB - Almighty Equipment', lastUpdate: '17:09 22.02.2026', status: 'Parking', address: 'Lekwa Local Municipality, Lekwa Ward 12', offline: '14h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10054', dealer: 'Powerstar PMB - Almighty Equipment', lastUpdate: '17:45 22.02.2026', status: 'Parking', address: 'Zambia', offline: '13h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9704', dealer: 'Powerstar PMB - Almighty Equipment', lastUpdate: '21:14 22.02.2026', status: 'Parking', address: 'Mozambique', offline: '10h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10267', dealer: 'Powerstar Middelburg', lastUpdate: '15:55 14.02.2026', status: 'Parking', address: 'Steve Tshwete Local Municipality, Koornfontein', offline: '8d 15h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9768', dealer: 'Powerstar Middelburg', lastUpdate: '16:55 17.02.2026', status: 'Parking', address: 'Govan Mbeki Local Municipality, Evander, Govan Mbeki Ward 17, R546', offline: '5d 14h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '9767', dealer: 'Powerstar Middelburg', lastUpdate: '17:18 21.02.2026', status: 'Parking', address: 'Emalahleni Local Municipality, Emalahleni Ward 19', offline: '1d 14h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '9773', dealer: 'Powerstar Middelburg', lastUpdate: '20:39 22.02.2026', status: 'Parking', address: 'Steve Tshwete Local Municipality, Steve Tshwete Ward 6', offline: '11h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10379', dealer: 'Powerstar Brakpan', lastUpdate: '13:21 11.11.2025', status: 'Parking', address: 'Brakpan, Huntingdon, Voortrekker Road', offline: '103d 18h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10251', dealer: 'Powerstar Brakpan', lastUpdate: '08:59 18.12.2025', status: 'Parking', address: 'Brakpan, Huntingdon, Gordon Street', offline: '66d 22h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10237', dealer: 'Powerstar Brakpan', lastUpdate: '11:32 27.01.2026', status: 'Parking', address: 'Brakpan, Huntingdon, Voortrekker Road', offline: '26d 20h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10323', dealer: 'Powerstar Brakpan', lastUpdate: '11:38 27.01.2026', status: 'Parking', address: 'Brakpan, Huntingdon, Voortrekker Road', offline: '26d 20h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10423', dealer: 'Powerstar Brakpan', lastUpdate: '11:43 27.01.2026', status: 'Parking', address: 'Brakpan, Huntingdon, Voortrekker Road', offline: '26d 19h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10421', dealer: 'Powerstar Brakpan', lastUpdate: '11:45 27.01.2026', status: 'Parking', address: 'Brakpan, Huntingdon, Voortrekker Road', offline: '26d 19h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10241', dealer: 'Powerstar Brakpan', lastUpdate: '15:06 28.01.2026', status: 'Parking', address: 'Brakpan, Huntingdon, Voortrekker Road', offline: '25d 16h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10008', dealer: 'Powerstar Brakpan', lastUpdate: '20:19 02.02.2026', status: 'Parking', address: 'Zimbabwe, Gwanda', offline: '20d 11h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10424', dealer: 'Powerstar Brakpan', lastUpdate: '14:50 06.02.2026', status: 'Parking', address: 'Brakpan, Huntingdon, Voortrekker Road', offline: '16d 16h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9986', dealer: 'Powerstar Brakpan', lastUpdate: '10:56 10.02.2026', status: 'Parking', address: 'Brakpan, Huntingdon, Voortrekker Road', offline: '12d 20h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9985', dealer: 'Powerstar Brakpan', lastUpdate: '11:04 10.02.2026', status: 'Parking', address: 'Brakpan, Huntingdon, Voortrekker Road', offline: '12d 20h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10390', dealer: 'Powerstar Brakpan', lastUpdate: '11:06 10.02.2026', status: 'Parking', address: 'Brakpan, Huntingdon, Voortrekker Road', offline: '12d 20h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10391', dealer: 'Powerstar Brakpan', lastUpdate: '11:16 10.02.2026', status: 'Parking', address: 'Brakpan, Huntingdon, Voortrekker Road', offline: '12d 20h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10422', dealer: 'Powerstar Brakpan', lastUpdate: '11:22 10.02.2026', status: 'Parking', address: 'Brakpan, Huntingdon, Voortrekker Road', offline: '12d 20h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10242', dealer: 'Powerstar Brakpan', lastUpdate: '11:27 10.02.2026', status: 'Parking', address: 'Brakpan, Huntingdon, Voortrekker Road', offline: '12d 20h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10381', dealer: 'Powerstar Brakpan', lastUpdate: '10:44 20.02.2026', status: 'Parking', address: 'Mkhondo Local Municipality, Mkhondo Ward 1', offline: '2d 20h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10380', dealer: 'Powerstar Brakpan', lastUpdate: '11:31 20.02.2026', status: 'Parking', address: 'Zambia, Chambishi, T3', offline: '2d 20h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '9962', dealer: 'Powerstar Brakpan', lastUpdate: '16:11 20.02.2026', status: 'Parking', address: 'Jozini Local Municipality, Jozini Ward 5', offline: '2d 15h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10011', dealer: 'Powerstar Port Elizabeth', lastUpdate: '10:13 13.01.2026', status: 'Parking', address: 'Gqeberha, Nelson Mandela Bay Ward 7, Kensington, Diaz Road', offline: '40d 21h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10010', dealer: 'Powerstar Port Elizabeth', lastUpdate: '12:00 02.02.2026', status: 'Parking', address: 'Gqeberha, Nelson Mandela Bay Ward 7, Kensington, Connaught Avenue', offline: '20d 19h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10448', dealer: 'Powerstar Port Elizabeth', lastUpdate: '12:52 02.02.2026', status: 'Parking', address: 'Gqeberha, Nelson Mandela Bay Ward 7, Kensington, Diaz Road', offline: '20d 18h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10496', dealer: '9909 - 1627', lastUpdate: '01:31 14.01.2026', status: 'Parking', address: 'Pietermaritzburg, Mkondeni, Gladys Manzi Road', offline: '40d 6h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10531', dealer: '9910 - 1627', lastUpdate: '15:02 01.02.2026', status: 'Parking', address: 'Pietermaritzburg, Meadows, Edison Place', offline: '21d 16h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9996', dealer: '9910 - 1627', lastUpdate: '13:24 12.02.2026', status: 'Parking', address: 'Pietermaritzburg, Meadows, C.B. Downes Road', offline: '10d 18h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10468', dealer: '9910 - 1627', lastUpdate: '03:11 16.02.2026', status: 'Parking', address: 'Pietermaritzburg, Meadows, Edison Place', offline: '7d 4h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9989', dealer: '9910 - 1627', lastUpdate: '16:08 19.02.2026', status: 'Parking', address: 'Ekurhuleni Ward 100', offline: '3d 15h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10763', dealer: '9910 - 1627', lastUpdate: '09:42 20.02.2026', status: 'Parking', address: 'eThekwini Ward 63, Wiltshire Road', offline: '2d 21h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10769', dealer: '9910 - 1627', lastUpdate: '12:34 20.02.2026', status: 'Parking', address: 'eThekwini Ward 16, Wiltshire Road', offline: '2d 19h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10017', dealer: '9910 - 1627', lastUpdate: '16:25 20.02.2026', status: 'Parking', address: 'Pietermaritzburg, Mkondeni, Gladys Manzi Road', offline: '2d 15h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10764', dealer: '9910 - 1627', lastUpdate: '18:07 20.02.2026', status: 'Parking', address: 'eThekwini Ward 16, Wiltshire Road', offline: '2d 13h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10702', dealer: 'TO BE DRIVEN', lastUpdate: '10:41 08.12.2025', status: 'Parking', address: '', offline: '76d 20h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10783', dealer: 'TO BE DRIVEN', lastUpdate: '14:39 21.01.2026', status: 'Parking', address: 'Russia, 614513, Khmeli', offline: '32d 17h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10787', dealer: '10415 - 1627', lastUpdate: '08:14 19.02.2026', status: 'Parking', address: 'Pietermaritzburg, Meadows, C.B. Downes Road', offline: '3d 23h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10475', dealer: 'Powerstar Bloemfontein', lastUpdate: '08:51 17.02.2026', status: 'Parking', address: 'Bloemfontein, Ferreira, Taxi Street', offline: '5d 22h', category: 'parking_battery', batteryAlarm: 'Battery Flat' },
    { unit: '10230', dealer: 'Powerstar Polokwane', lastUpdate: '04:41 14.11.2025', status: 'Parking', address: 'Botswana, Martin\'s Drift, B140', offline: '101d 2h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10432', dealer: 'Powerstar Polokwane', lastUpdate: '15:49 24.11.2025', status: 'Parking', address: 'Polokwane, Polokwane Ward 36', offline: '90d 15h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10231', dealer: 'Powerstar Polokwane', lastUpdate: '10:46 15.01.2026', status: 'Parking', address: 'Zambia, Chambishi, T3', offline: '38d 20h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9964', dealer: 'Powerstar Polokwane', lastUpdate: '07:56 21.01.2026', status: 'Parking', address: 'Zambia, D271', offline: '32d 23h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10158', dealer: 'Powerstar Polokwane', lastUpdate: '08:03 21.01.2026', status: 'Parking', address: 'Zambia, D271', offline: '32d 23h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10322', dealer: 'Powerstar Polokwane', lastUpdate: '08:58 30.01.2026', status: 'Parking', address: 'Zambia, D271', offline: '23d 22h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9868', dealer: 'Powerstar Polokwane', lastUpdate: '02:33 02.02.2026', status: 'Parking', address: 'Mokopane, Mogalakwena Ward 12, D1231', offline: '21d 5h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10368', dealer: 'Powerstar Polokwane', lastUpdate: '07:28 16.02.2026', status: 'Parking', address: 'Zambia, D271', offline: '7d 0h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10588', dealer: 'Powerstar Polokwane', lastUpdate: '18:21 19.02.2026', status: 'Parking', address: 'Makhado Local Municipality, Makhado Ward 28, D1253', offline: '3d 13h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10218', dealer: 'Powerstar Polokwane', lastUpdate: '09:39 20.02.2026', status: 'Parking', address: 'Polokwane, Polokwane Ward 23, Landdros Mare Street', offline: '2d 22h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10524', dealer: 'Powerstar Polokwane', lastUpdate: '13:53 20.02.2026', status: 'Parking', address: 'Mogalakwena Local Municipality, Mogalakwena Ward 18, D4380', offline: '2d 17h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10235', dealer: 'Powerstar Polokwane', lastUpdate: '18:51 20.02.2026', status: 'Parking', address: 'Doornpoort', offline: '2d 12h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10254', dealer: 'Powerstar Zimbabwe - Harare - T/A Machinery', lastUpdate: '14:57 01.09.2025', status: 'Parking', address: 'Pietermaritzburg, Meadows, C.B. Downes Road', offline: '174d 16h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10038', dealer: 'Powerstar Zimbabwe - Harare - T/A Machinery', lastUpdate: '10:01 06.09.2025', status: 'Parking', address: 'Zimbabwe, Harare, Harrow Road', offline: '169d 21h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10200', dealer: 'Powerstar Zimbabwe - Harare - T/A Machinery', lastUpdate: '10:55 06.09.2025', status: 'Parking', address: 'Zimbabwe, Harare, Harrow Road', offline: '169d 20h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9846', dealer: 'Powerstar Zimbabwe - Harare - T/A Machinery', lastUpdate: '13:42 10.09.2025', status: 'Parking', address: 'Zimbabwe', offline: '165d 17h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10225', dealer: 'Powerstar Zimbabwe - Harare - T/A Machinery', lastUpdate: '13:54 10.09.2025', status: 'Parking', address: 'Zimbabwe, Mvuma', offline: '165d 17h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10208', dealer: 'Powerstar Zimbabwe - Harare - T/A Machinery', lastUpdate: '06:36 11.09.2025', status: 'Parking', address: 'Zimbabwe, Harare, Harrow Road', offline: '165d 1h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9874', dealer: 'Powerstar Zimbabwe - Harare - T/A Machinery', lastUpdate: '03:03 06.10.2025', status: 'Parking', address: 'Zimbabwe, Norton, R2', offline: '140d 4h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10249', dealer: 'Powerstar Zimbabwe - Harare - T/A Machinery', lastUpdate: '19:49 04.11.2025', status: 'Parking', address: 'Zimbabwe, Kwekwe', offline: '110d 11h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10277', dealer: 'Powerstar Zimbabwe - Harare - T/A Machinery', lastUpdate: '16:15 15.12.2025', status: 'Parking', address: 'Zimbabwe, Harare', offline: '69d 15h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10353', dealer: 'Powerstar Zimbabwe - Harare - T/A Machinery', lastUpdate: '09:12 12.02.2026', status: 'Parking', address: 'Zambia, Mutanda, T5', offline: '10d 22h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10043', dealer: 'QTC Civils', lastUpdate: '06:17 15.02.2026', status: 'Parking', address: 'Pretoria, Weavind Park, Pretoria Street', offline: '8d 1h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10319', dealer: 'Powerstar - Nambia - Swakopmund - Hendeca Machinary', lastUpdate: '09:24 10.10.2025', status: 'Parking', address: 'Namibia, 13001, Swakopmund, Kramersdorf, Einstein Street', offline: '135d 22h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9746', dealer: 'Powerstar - Nambia - Swakopmund - Hendeca Machinary', lastUpdate: '14:25 14.02.2026', status: 'Parking', address: 'Namibia, Langer Heinrich Mine Road', offline: '8d 17h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10316', dealer: 'Powerstar - Nambia - Swakopmund - Hendeca Machinary', lastUpdate: '09:34 16.02.2026', status: 'Parking', address: 'Namibia', offline: '6d 22h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10000', dealer: 'Powerstar - Nambia - Swakopmund - Hendeca Machinary', lastUpdate: '16:06 18.02.2026', status: 'Parking', address: 'Namibia', offline: '4d 15h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10493', dealer: 'Powerstar Brackenfell', lastUpdate: '11:27 07.02.2026', status: 'Parking', address: 'Bellville, Glenhaven, Sacks Circle', offline: '15d 20h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10491', dealer: 'Powerstar Brackenfell', lastUpdate: '17:51 12.02.2026', status: 'Parking', address: 'Kraaifontein, Northpine, Viben Avenue', offline: '10d 13h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10300', dealer: 'Powerstar Brackenfell', lastUpdate: '10:40 18.02.2026', status: 'Parking', address: 'Kraaifontein, Northpine, Viben Avenue', offline: '4d 21h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10602', dealer: 'Powerstar Brackenfell', lastUpdate: '13:21 20.02.2026', status: 'Parking', address: 'Bellville, Shirley Park, Cecil Morgan Street', offline: '2d 18h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10360', dealer: 'Powerstar Brackenfell', lastUpdate: '15:10 20.02.2026', status: 'Parking', address: 'Cape Town, Ndabeni, Thomas Road', offline: '2d 16h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '9970', dealer: 'Powerstar Swaziland - Matsapha - Swazi Bus and Truck', lastUpdate: '21:10 22.02.2026', status: 'Parking', address: 'Eswatini, Mhlabanyatsi, MR19', offline: '10h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10045', dealer: '9907 - 1627', lastUpdate: '08:39 05.01.2026', status: 'Parking', address: 'Ekurhuleni Ward 13, Element Road', offline: '48d 23h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9877', dealer: 'Powerstar Botswana', lastUpdate: '18:19 06.02.2026', status: 'Parking', address: 'Angola, Saurimo', offline: '16d 13h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10470', dealer: 'Powerstar Botswana', lastUpdate: '14:30 20.02.2026', status: 'Parking', address: 'Botswana, Gaborone', offline: '2d 17h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '9973', dealer: 'Powerstar Schweizer-Reneke', lastUpdate: '13:17 01.02.2026', status: 'Parking', address: 'Steve Tshwete Local Municipality, Steve Tshwete Ward 11, Dr. Mandela Drive', offline: '21d 18h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10652', dealer: 'Powerstar Schweizer-Reneke', lastUpdate: '17:32 22.02.2026', status: 'Parking', address: 'Tswaing Local Municipality, Tswaing Ward 7', offline: '14h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10125', dealer: 'Powerstar Kimberly', lastUpdate: '13:40 20.02.2026', status: 'Parking', address: 'Kimberley, Sol Plaatje Ward 21, Hendrik van der Bijl', offline: '2d 18h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10527', dealer: 'Powerstar Kimberly', lastUpdate: '23:31 20.02.2026', status: 'Parking', address: 'Richtersveld Local Municipality, Richtersveld Ward 2', offline: '2d 8h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10250', dealer: 'Powerstar Nelspruit', lastUpdate: '22:28 29.12.2025', status: 'Parking', address: 'Mbombela, Riverside Park, R37', offline: '55d 9h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10567', dealer: 'Ropewise', lastUpdate: '18:03 20.02.2026', status: 'Parking', address: 'Pinetown, Cowie\'s Hill, Drake Road', offline: '2d 13h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10589', dealer: 'Powerstar Mozambique - Matola - Haps', lastUpdate: '10:43 11.02.2026', status: 'Parking', address: 'Mozambique, 1114, Matola', offline: '11d 20h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10653', dealer: 'Powerstar Mozambique - Matola - Haps', lastUpdate: '16:07 12.02.2026', status: 'Parking', address: 'Mozambique, 1114, Matola', offline: '10d 15h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10657', dealer: 'Powerstar Upington', lastUpdate: '07:56 07.02.2026', status: 'Parking', address: 'Upington, ǁKhara Hais Ward 8, Dorper Street', offline: '15d 23h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10182', dealer: 'Powerstar Upington', lastUpdate: '08:44 10.02.2026', status: 'Parking', address: 'Upington, ǁKhara Hais Ward 8, Dorper Street', offline: '12d 22h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '10351', dealer: 'Westhouse', lastUpdate: '03:04 21.02.2026', status: 'Parking', address: 'Mkhondo Local Municipality, Piet Retief, Mkhondo Ward 8, D395', offline: '2d 4h', category: 'parking_battery', batteryAlarm: 'Battery Flat' },
    { unit: '9771', dealer: 'Powerstar George', lastUpdate: '10:53 16.07.2025', status: 'Parking', address: 'Matlosana Local Municipality, Orkney, Nooitgedacht, O.R. Tambo Street', offline: '221d 20h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9778', dealer: 'Adenco', lastUpdate: '03:00 23.02.2026', status: 'Parking', address: 'Ubuntu Local Municipality, Ubuntu Ward 3, R63', offline: '4h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
    { unit: '9858', dealer: 'Leshapo Lamotsumi Trading', lastUpdate: '19:00 21.02.2026', status: 'Parking', address: 'Emalahleni Local Municipality, Klippoortjie, R545', offline: '1d 12h', category: 'parking_battery', batteryAlarm: 'ISO Switch ON' },
    { unit: '10378', dealer: 'Pixley Ka Seme Civils', lastUpdate: '10:47 20.02.2026', status: 'Parking', address: 'Ubuntu Local Municipality, Victoria West, Ubuntu Ward 2, Helpmekaar Street', offline: '2d 20h', category: 'parking_battery', batteryAlarm: 'Needs Field Check' },
];

// ── Computed stats ──
const connectionIssue = FLEET_DATA.filter(v => v.category === 'connection_issue');
const parkingBattery  = FLEET_DATA.filter(v => v.category === 'parking_battery');

const TOTAL_MONITORED = 1022;
const totalOffline    = connectionIssue.length + parkingBattery.length;
const activeCount     = TOTAL_MONITORED - totalOffline;

// Battery alarm breakdown from batteries report
const batteryBreakdown = {
    isoSwitch: 57,     // ISO Switch ON — alarm within ±2d of offline date
    batteryFlat: 5,    // Battery Flat — alarm within ±2d of offline date
    galileoBattery: 0, // GPS battery — excluded per analysis rules
    needsReport: 144,  // Parking but no proximate alarm — needs field visit
};

// ── Telematics savings data (Sep 2025 – Feb 2026, values in R thousands) ──
const savingsData = [
    { month: 'Sep 25', warrantyDeclined: 42,  theftPrevention: 180, maintenance: 68, parts: 31, driverBehaviour: 95  },
    { month: 'Oct 25', warrantyDeclined: 67,  theftPrevention: 95,  maintenance: 74, parts: 28, driverBehaviour: 102 },
    { month: 'Nov 25', warrantyDeclined: 55,  theftPrevention: 240, maintenance: 81, parts: 45, driverBehaviour: 98  },
    { month: 'Dec 25', warrantyDeclined: 38,  theftPrevention: 150, maintenance: 62, parts: 22, driverBehaviour: 87  },
    { month: 'Jan 26', warrantyDeclined: 89,  theftPrevention: 320, maintenance: 92, parts: 58, driverBehaviour: 115 },
    { month: 'Feb 26', warrantyDeclined: 104, theftPrevention: 185, maintenance: 77, parts: 67, driverBehaviour: 122 },
];

const savingsTotals = savingsData.reduce(
    (acc, m) => ({
        warrantyDeclined: acc.warrantyDeclined + m.warrantyDeclined,
        theftPrevention:  acc.theftPrevention  + m.theftPrevention,
        maintenance:      acc.maintenance      + m.maintenance,
        parts:            acc.parts            + m.parts,
        driverBehaviour:  acc.driverBehaviour  + m.driverBehaviour,
    }),
    { warrantyDeclined: 0, theftPrevention: 0, maintenance: 0, parts: 0, driverBehaviour: 0 }
);
const totalSavingsK = Object.values(savingsTotals).reduce((a, b) => a + b, 0); // 2 889 k

const savingsCategories = [
    { key: 'warrantyDeclined', label: 'Warranty Declined',      color: '#6366f1', icon: ShieldOff, desc: 'Driver-fault claims rejected — cost not borne by OEM' },
    { key: 'theftPrevention',  label: 'Fluid Thefts',           color: '#ec4899', icon: Car,       desc: 'Storage tank monitoring catches theft and prevents over-usage on the production line. Dispatch trucks are also monitored — fluid theft on a unit before dealership delivery is flagged before it ships' },
    { key: 'maintenance',      label: 'Proactive Maintenance',  color: '#14b8a6', icon: Wrench,    desc: 'Early fault detection preventing major component failure' },
    { key: 'parts',            label: 'Precision Parts Procurement', color: '#f59e0b', icon: Package,   desc: 'Telematics data drives exact parts ordering — no excess stock, no unnecessary procurement costs' },
    { key: 'driverBehaviour',  label: 'Engine Protection',          color: '#22c55e', icon: Zap,       desc: 'Critical sensor thresholds trigger automatic limp mode — protecting the engine before catastrophic damage occurs' },
] as const;

// Custom tooltip for the savings chart
const SavingsTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const total = payload.reduce((s: number, p: any) => s + p.value, 0);
    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-3 min-w-[190px]">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
            {[...payload].reverse().map((p: any) => (
                <div key={p.name} className="flex items-center justify-between gap-4 mb-0.5">
                    <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ background: p.fill }} />
                        {p.name}
                    </span>
                    <span className="text-[10px] font-black text-slate-700">R {p.value}k</span>
                </div>
            ))}
            <div className="border-t border-slate-100 mt-2 pt-2 flex justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase">Total</span>
                <span className="text-[10px] font-black text-emerald-600">R {total}k</span>
            </div>
        </div>
    );
};

// ── Category Card ──
const CategoryCard: React.FC<{
    label: string;
    count: number;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    description: string;
    vehicles: VehicleRow[];
}> = ({ label, count, icon: Icon, color, bg, border, description, vehicles }) => {
    const [expanded, setExpanded] = useState(false);
    const [search, setSearch] = useState('');
    const filtered = vehicles.filter(v =>
        v.unit.toLowerCase().includes(search.toLowerCase()) ||
        v.dealer.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={cn("bg-white border rounded-xl shadow-sm overflow-hidden", border)}>
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full p-5 flex items-center justify-between hover:bg-slate-50/30 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl", bg)}>
                        <Icon className={cn("h-5 w-5", color)} />
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                        <p className={cn("text-3xl font-black", color)}>{count}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
                    </div>
                </div>
                {expanded
                    ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                    : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                }
            </button>

            {expanded && (
                <div className="border-t border-border">
                    <div className="p-3 border-b border-border bg-slate-50/50">
                        <div className="relative max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Filter unit or dealer…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full border border-border rounded py-1.5 pl-8 pr-3 text-[11px] focus:outline-none focus:ring-1 focus:ring-accent/40 bg-white"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto max-h-72">
                        <table className="w-full text-[11px]">
                            <thead className="bg-slate-50 sticky top-0">
                                <tr>
                                    {['Unit', 'Dealer', 'Last Seen', 'Offline', 'Location', label === 'ISO Switch / Battery / Field Check' ? 'Alarm' : 'Status'].map(h => (
                                        <th key={h} className="px-3 py-2 text-left font-black text-[9px] text-slate-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map(v => (
                                    <tr key={v.unit} className="hover:bg-slate-50/50">
                                        <td className="px-3 py-2 font-black text-slate-800">{v.unit}</td>
                                        <td className="px-3 py-2 text-slate-500 max-w-[140px] truncate">{v.dealer}</td>
                                        <td className="px-3 py-2 font-mono text-slate-400 text-[10px]">{v.lastUpdate}</td>
                                        <td className="px-3 py-2">
                                            <span className={cn("font-black px-1.5 py-0.5 rounded text-[9px]", color, bg)}>{v.offline}</span>
                                        </td>
                                        <td className="px-3 py-2 text-slate-400 max-w-[160px] truncate">{v.address}</td>
                                        <td className="px-3 py-2">
                                            {v.batteryAlarm
                                                ? <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded ring-1 ring-amber-200">{v.batteryAlarm}</span>
                                                : <span className="text-[9px] text-slate-400">{v.status}</span>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
// ── Main Component ──
const AdminHome: React.FC = () => {
    const reportDate = '23 Feb 2026';

    return (
        <div className="p-4 lg:p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Khulu Admin Portal</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Fleet health dashboard — vehicle health report & battery alarms. Report date: <span className="font-bold text-slate-700">{reportDate}</span></p>
                </div>
                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-600 border border-border px-4 py-2 rounded text-xs font-black uppercase tracking-widest cursor-pointer transition-all shadow-sm">
                        <Upload className="h-3.5 w-3.5" />
                        Import New Reports
                    </label>
                    <button className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded text-xs font-black uppercase tracking-widest shadow-sm transition-all flex items-center gap-2">
                        <RefreshCw className="h-3.5 w-3.5" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Top-level counters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Total Monitored', value: 1022, color: 'text-slate-800',  bg: 'bg-slate-100',  icon: Truck    },
                    { label: 'Connection Issue', value: 50,   color: 'text-orange-600', bg: 'bg-orange-50', icon: Signal   },
                    { label: 'Parking — Battery', value: 206, color: 'text-red-600',    bg: 'bg-red-50',    icon: BatteryLow },
                ].map(s => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className="bg-white border border-border rounded-xl p-5 shadow-sm">
                            <div className={cn("p-2.5 rounded-xl w-fit mb-3", s.bg)}>
                                <Icon className={cn("h-4 w-4", s.color)} />
                            </div>
                            <p className={cn("text-3xl font-black", s.color)}>{s.value}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Status Groups Explainer + Pie Chart */}
            <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">Status Groups — Grouping Logic</h3>
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* Pie Chart */}
                    <div className="flex-shrink-0 w-full lg:w-64">
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Connection Issue', value: 50 },
                                        { name: 'ISO Switch / Battery', value: 206 },
                                    ]}
                                    cx="50%" cy="50%"
                                    innerRadius={55} outerRadius={90}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    <Cell fill="#f97316" />
                                    <Cell fill="#ef4444" />
                                </Pie>
                                <Tooltip
                                    formatter={(value: number, name: string) => [`${value} units`, name]}
                                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                                />
                                <Legend
                                    iconType="circle"
                                    iconSize={8}
                                    formatter={(value) => <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Centre label overlay via text */}
                        <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest -mt-2">256 offline units</p>
                    </div>

                    {/* Category cards */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
                        {[
                            { group: 'Stopped / Moving', count: connectionIssue.length, category: 'Connection Issue',                   color: 'text-orange-600', dot: 'bg-orange-500', bar: 'bg-orange-400', desc: 'Status data cached but GPS link broken — unit not sending live updates.' },
                            { group: 'Parking',          count: parkingBattery.length,  category: 'ISO Switch / Battery / Field Check', color: 'text-red-600',    dot: 'bg-red-500',    bar: 'bg-red-400',    desc: 'Parked unit cross-referenced with battery report (16–24 Feb 2026) for ISO Switch, Battery Flat, or GPS battery events.' },
                            { group: 'OK',               count: activeCount,            category: 'Active & Reporting',                color: 'text-green-600',  dot: 'bg-green-500',  bar: 'bg-green-400',  desc: `${activeCount} of ${TOTAL_MONITORED} monitored units actively transmitting with no battery alarms.` },
                        ].map(row => (
                            <div key={row.group} className="border border-border rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className={cn("h-2 w-2 rounded-full", row.dot)} />
                                    <p className="font-black text-slate-700 truncate">{row.group}</p>
                                    <span className={cn("ml-auto font-black text-lg shrink-0", row.color)}>{row.count}</span>
                                </div>
                                <p className={cn("font-black text-[10px] uppercase mb-2", row.color)}>{row.category}</p>
                                {/* Progress bar — proportion of total monitored fleet */}
                                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={cn("h-full rounded-full", row.bar)} style={{ width: `${Math.round(row.count / TOTAL_MONITORED * 100)}%` }} />
                                </div>
                                <p className="text-slate-400 text-[10px] mt-2 leading-snug">{row.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 3 Expandable Drill-Down Sections */}
            <div className="space-y-4">
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Offline Unit Drill-Down</h3>

                <CategoryCard
                    label="Connection Issue"
                    count={connectionIssue.length}
                    icon={Signal}
                    color="text-orange-600"
                    bg="bg-orange-50"
                    border="border-orange-100"
                    description="Stopped / Moving — cached GPS position but no live link"
                    vehicles={connectionIssue}
                />

                <CategoryCard
                    label="ISO Switch / Battery / Field Check"
                    count={parkingBattery.length}
                    icon={BatteryLow}
                    color="text-red-600"
                    bg="bg-red-50"
                    border="border-red-100"
                    description="Parking status — battery alarm cross-reference from batteries report"
                    vehicles={parkingBattery}
                />
            </div>

            {/* Battery Alarm Breakdown */}
            <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">Battery Alarm Breakdown — 206 Parking Units · Alarm within 2 days of going offline</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { label: 'ISO Switch ON',   value: batteryBreakdown.isoSwitch,  desc: 'ISO switch activated within 2 days of truck going offline',          color: 'text-red-600',   bg: 'bg-red-50',   icon: Zap      },
                        { label: 'Battery Flat',    value: batteryBreakdown.batteryFlat, desc: 'Main battery voltage alarm within 2 days of truck going offline',    color: 'text-orange-600', bg: 'bg-orange-50', icon: BatteryLow },
                        { label: 'Needs Field Check', value: batteryBreakdown.needsReport, desc: 'Parked and offline — no proximate battery alarm found, physical inspection required', color: 'text-slate-600', bg: 'bg-slate-100', icon: Info },
                    ].map(b => {
                        const Icon = b.icon;
                        return (
                            <div key={b.label} className={cn("border border-border rounded-xl p-4", b.bg.replace('50', '50/40'))}>
                                <div className={cn("p-2 rounded-lg w-fit mb-2", b.bg)}>
                                    <Icon className={cn("h-4 w-4", b.color)} />
                                </div>
                                <p className={cn("text-2xl font-black", b.color)}>{b.value}</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{b.label}</p>
                                <p className="text-[10px] text-slate-400 mt-1 leading-snug">{b.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
            {/* Telematics Savings ROI */}
            <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
                {/* Section header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Telematics ROI — Total Savings</h3>
                        </div>
                        <p className="text-[10px] text-slate-400 ml-6">Sep 2025 – Feb 2026 · Warranty · Fluid Thefts · Maintenance · Parts Procurement · Engine Protection</p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">6-Month Total</p>
                        <p className="text-3xl font-black text-emerald-600">R {(totalSavingsK / 1000).toFixed(2)}M</p>
                        <p className="text-[10px] text-slate-400">across 1 022 monitored units</p>
                    </div>
                </div>

                {/* Stacked bar chart */}
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={savingsData} margin={{ top: 5, right: 8, left: 0, bottom: 0 }} barSize={36}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                            dataKey="month"
                            tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                            axisLine={false} tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            axisLine={false} tickLine={false}
                            tickFormatter={v => `R${v}k`}
                            width={46}
                        />
                        <Tooltip content={<SavingsTooltip />} cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="warrantyDeclined" name="Warranty Declined"     stackId="a" fill="#6366f1" />
                        <Bar dataKey="theftPrevention"  name="Fluid Thefts"          stackId="a" fill="#ec4899" />
                        <Bar dataKey="maintenance"      name="Proactive Maintenance" stackId="a" fill="#14b8a6" />
                        <Bar dataKey="parts"            name="Precision Parts Procurement" stackId="a" fill="#f59e0b" />
                        <Bar dataKey="driverBehaviour"  name="Engine Protection"           stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>

                {/* Savings category breakdown cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-5">
                    {savingsCategories.map(cat => {
                        const Icon = cat.icon;
                        const total = savingsTotals[cat.key];
                        return (
                            <div key={cat.key} className="border border-border rounded-xl p-3.5">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 rounded-lg" style={{ background: cat.color + '18' }}>
                                        <Icon className="h-3.5 w-3.5" style={{ color: cat.color }} />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-tight">{cat.label}</p>
                                </div>
                                <p className="text-xl font-black" style={{ color: cat.color }}>R {total}k</p>
                                <p className="text-[10px] text-slate-400 mt-1 leading-snug">{cat.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
};

export default AdminHome;
