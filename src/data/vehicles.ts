import type { VehiclePreset } from '../types/user';

/* India-market EVs with manufacturer-published usable battery capacity and
   charging inlets. Manufacturers don't publish a kWh/100 km efficiency, so it
   is left blank for the driver to fill in from their own trip data.
   Specs vary by variant and model year — every field stays editable. */
const SOURCE = 'Battery capacity from the manufacturer’s published India specification. Verify against your variant and model year.';

export const VEHICLE_PRESETS: VehiclePreset[] = [
{ id: 'tata-nexon-ev-mr', brand: 'Tata', model: 'Nexon.ev Medium Range', batteryKwh: 30, efficiencyKwh100km: null, connectors: ['CCS2', 'Type 2'], source: SOURCE },
{ id: 'tata-nexon-ev-45', brand: 'Tata', model: 'Nexon.ev 45', batteryKwh: 45, efficiencyKwh100km: null, connectors: ['CCS2', 'Type 2'], source: SOURCE },
{ id: 'tata-punch-ev-mr', brand: 'Tata', model: 'Punch.ev Medium Range', batteryKwh: 25, efficiencyKwh100km: null, connectors: ['CCS2', 'Type 2'], source: SOURCE },
{ id: 'tata-punch-ev-lr', brand: 'Tata', model: 'Punch.ev Long Range', batteryKwh: 35, efficiencyKwh100km: null, connectors: ['CCS2', 'Type 2'], source: SOURCE },
{ id: 'tata-tiago-ev-mr', brand: 'Tata', model: 'Tiago.ev Medium Range', batteryKwh: 19.2, efficiencyKwh100km: null, connectors: ['CCS2', 'Type 2'], source: SOURCE },
{ id: 'tata-tiago-ev-lr', brand: 'Tata', model: 'Tiago.ev Long Range', batteryKwh: 24, efficiencyKwh100km: null, connectors: ['CCS2', 'Type 2'], source: SOURCE },
{ id: 'mg-zs-ev', brand: 'MG', model: 'ZS EV', batteryKwh: 50.3, efficiencyKwh100km: null, connectors: ['CCS2', 'Type 2'], source: SOURCE },
{ id: 'hyundai-creta-electric', brand: 'Hyundai', model: 'Creta Electric', batteryKwh: 42, efficiencyKwh100km: null, connectors: ['CCS2', 'Type 2'], source: SOURCE },
{ id: 'hyundai-creta-electric-lr', brand: 'Hyundai', model: 'Creta Electric Long Range', batteryKwh: 51.4, efficiencyKwh100km: null, connectors: ['CCS2', 'Type 2'], source: SOURCE },
{ id: 'hyundai-ioniq-5', brand: 'Hyundai', model: 'Ioniq 5', batteryKwh: 72.6, efficiencyKwh100km: null, connectors: ['CCS2', 'Type 2'], source: SOURCE },
{ id: 'mahindra-xuv400-ec', brand: 'Mahindra', model: 'XUV400 EC Pro', batteryKwh: 34.5, efficiencyKwh100km: null, connectors: ['CCS2', 'Type 2'], source: SOURCE },
{ id: 'mahindra-xuv400-el', brand: 'Mahindra', model: 'XUV400 EL Pro', batteryKwh: 39.4, efficiencyKwh100km: null, connectors: ['CCS2', 'Type 2'], source: SOURCE },
{ id: 'mahindra-be6-59', brand: 'Mahindra', model: 'BE 6 (59 kWh)', batteryKwh: 59, efficiencyKwh100km: null, connectors: ['CCS2', 'Type 2'], source: SOURCE },
{ id: 'mahindra-be6-79', brand: 'Mahindra', model: 'BE 6 (79 kWh)', batteryKwh: 79, efficiencyKwh100km: null, connectors: ['CCS2', 'Type 2'], source: SOURCE },
{ id: 'byd-atto3-std', brand: 'BYD', model: 'Atto 3 (49.92 kWh)', batteryKwh: 49.92, efficiencyKwh100km: null, connectors: ['CCS2', 'Type 2'], source: SOURCE },
{ id: 'byd-atto3-ext', brand: 'BYD', model: 'Atto 3 (60.48 kWh)', batteryKwh: 60.48, efficiencyKwh100km: null, connectors: ['CCS2', 'Type 2'], source: SOURCE },
{ id: 'citroen-ec3', brand: 'Citroën', model: 'ëC3', batteryKwh: 29.2, efficiencyKwh100km: null, connectors: ['CCS2', 'Type 2'], source: SOURCE },
{ id: 'kia-ev6-2022', brand: 'Kia', model: 'EV6 (2022–2024)', batteryKwh: 77.4, efficiencyKwh100km: null, connectors: ['CCS2', 'Type 2'], source: SOURCE }];