import type { Prediction, RiskLevel } from '@/types';

export const riskColors: Record<RiskLevel, { bg: string; text: string; border: string; dot: string }> = {
  Low: { bg: 'bg-success-500/10', text: 'text-success-500', border: 'border-success-500/30', dot: 'bg-success-500' },
  Medium: { bg: 'bg-warning-500/10', text: 'text-warning-500', border: 'border-warning-500/30', dot: 'bg-warning-500' },
  High: { bg: 'bg-danger-500/10', text: 'text-danger-500', border: 'border-danger-500/30', dot: 'bg-danger-500' },
  Critical: { bg: 'bg-critical-500/10', text: 'text-critical-400', border: 'border-critical-500/30', dot: 'bg-critical-500' },
};

export const predictionColors: Record<Prediction, { bg: string; text: string; border: string }> = {
  Genuine: { bg: 'bg-success-500/10', text: 'text-success-500', border: 'border-success-500/30' },
  Suspicious: { bg: 'bg-warning-500/10', text: 'text-warning-500', border: 'border-warning-500/30' },
  Fraud: { bg: 'bg-critical-500/10', text: 'text-critical-400', border: 'border-critical-500/30' },
};

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 30) return 'Medium';
  return 'Low';
}

export function getPrediction(score: number): Prediction {
  if (score >= 80) return 'Fraud';
  if (score >= 40) return 'Suspicious';
  return 'Genuine';
}

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrDecimalFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatNumber(n: number): string {
  if (typeof n !== 'number' || isNaN(n)) return '0';
  return n.toLocaleString('en-IN');
}

export function formatCurrencyINR(amount: number, showDecimals: boolean = false): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '₹0';
  if (showDecimals || (amount % 1 !== 0)) {
    return inrDecimalFormatter.format(amount);
  }
  return inrFormatter.format(amount);
}

// Retain formatCurrency as an alias pointing to formatCurrencyINR for 100% backward compatibility
export const formatCurrency = formatCurrencyINR;

export function formatPercent(n: number, digits = 2): string {
  if (typeof n !== 'number' || isNaN(n)) return '0%';
  return n.toFixed(digits) + '%';
}

const INDIAN_STATES: Record<string, string> = {
  'tamil nadu': 'Tamil Nadu',
  'kerala': 'Kerala',
  'karnataka': 'Karnataka',
  'andhra pradesh': 'Andhra Pradesh',
  'telangana': 'Telangana',
  'maharashtra': 'Maharashtra',
  'gujarat': 'Gujarat',
  'rajasthan': 'Rajasthan',
  'delhi': 'Delhi',
  'uttar pradesh': 'Uttar Pradesh',
  'madhya pradesh': 'Madhya Pradesh',
  'west bengal': 'West Bengal',
  'bihar': 'Bihar',
  'punjab': 'Punjab',
  'haryana': 'Haryana',
  'odisha': 'Odisha',
  'assam': 'Assam',
  'jharkhand': 'Jharkhand',
  'chhattisgarh': 'Chhattisgarh',
  'uttarakhand': 'Uttarakhand',
  'himachal pradesh': 'Himachal Pradesh',
  'goa': 'Goa',
  'jammu and kashmir': 'Jammu and Kashmir',
  'puducherry': 'Puducherry',
  'chandigarh': 'Chandigarh',
};

export function formatLocation(loc?: string | null): string {
  if (!loc || typeof loc !== 'string') return 'Location unavailable';

  let cleaned = loc.replace(/\s*\(Demo Ingestion\)/i, '').trim();
  if (!cleaned || cleaned.toLowerCase() === 'unknown' || cleaned.toLowerCase() === 'null') {
    return 'Location unavailable';
  }

  // If location is raw GPS string (e.g. "Lat: 11.0168, Lon: 76.9558" or "11.0168, 76.9558")
  if (/^lat:\s*[-0-9.]+/i.test(cleaned) || /^[-0-9.]+\s*,\s*[-0-9.]+$/.test(cleaned)) {
    return 'Location unavailable';
  }

  const lower = cleaned.toLowerCase();

  // Check if it's solely an Indian state name (e.g. "kerala" -> "Kerala, India")
  if (INDIAN_STATES[lower]) {
    return `${INDIAN_STATES[lower]}, India`;
  }

  // If already ends with ", India" or contains "India"
  if (/india$/i.test(cleaned)) {
    // Capitalize words cleanly
    const parts = cleaned.split(',').map(p => p.trim());
    const capitalized = parts.map(p => {
      const plower = p.toLowerCase();
      if (INDIAN_STATES[plower]) return INDIAN_STATES[plower];
      return p.charAt(0).toUpperCase() + p.slice(1);
    });
    return capitalized.join(', ');
  }

  // If it's a known city like "Coimbatore", "Chennai", "Bengaluru", "Sulur", "Tiruchirappalli", "Mumbai", "Pune", "Delhi"
  const knownCities: Record<string, string> = {
    'coimbatore': 'Coimbatore, Tamil Nadu, India',
    'sulur': 'Sulur, Tamil Nadu, India',
    'chennai': 'Chennai, Tamil Nadu, India',
    'madurai': 'Madurai, Tamil Nadu, India',
    'tiruchirappalli': 'Tiruchirappalli, Tamil Nadu, India',
    'salem': 'Salem, Tamil Nadu, India',
    'bengaluru': 'Bengaluru, Karnataka, India',
    'bangalore': 'Bengaluru, Karnataka, India',
    'mysuru': 'Mysuru, Karnataka, India',
    'kochi': 'Kochi, Kerala, India',
    'thiruvananthapuram': 'Thiruvananthapuram, Kerala, India',
    'kozhikode': 'Kozhikode, Kerala, India',
    'hyderabad': 'Hyderabad, Telangana, India',
    'mumbai': 'Mumbai, Maharashtra, India',
    'pune': 'Pune, Maharashtra, India',
    'delhi': 'New Delhi, Delhi, India',
    'new delhi': 'New Delhi, Delhi, India',
    'kolkata': 'Kolkata, West Bengal, India',
    'ahmedabad': 'Ahmedabad, Gujarat, India',
  };

  if (knownCities[lower]) {
    return knownCities[lower];
  }

  return cleaned;
}

export async function reverseGeocodeCoordinates(lat: number, lon: number): Promise<{ locationName: string; city?: string; state?: string; country?: string }> {
  // 1. Try BigDataCloud reverse geocode client (fast, no strict rate limit)
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { signal: AbortSignal.timeout(3500) }
    );
    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.locality || data.localityInfo?.administrative?.[3]?.name || '';
      const state = data.principalSubdivision || data.localityInfo?.administrative?.[1]?.name || '';
      const country = data.countryName || 'India';

      if (city && state) {
        return { locationName: `${city}, ${state}, ${country}`, city, state, country };
      } else if (state) {
        return { locationName: `${state}, ${country}`, state, country };
      } else if (city) {
        return { locationName: `${city}, ${country}`, city, country };
      }
    }
  } catch (err) {
    console.warn('BigDataCloud reverse geocoding unavailable:', err);
  }

  // 2. Fallback to OpenStreetMap Nominatim with timeout
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`,
      {
        headers: { 'User-Agent': 'FraudShield-India/1.0' },
        signal: AbortSignal.timeout(3500)
      }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const city = addr.city || addr.town || addr.village || addr.suburb || addr.city_district || addr.county || '';
      const state = addr.state || addr.state_district || '';
      const country = addr.country || 'India';

      if (city && state) {
        return { locationName: `${city}, ${state}, ${country}`, city, state, country };
      } else if (state) {
        return { locationName: `${state}, ${country}`, state, country };
      } else if (data.display_name) {
        const parts = data.display_name.split(',').slice(0, 3).map((p: string) => p.trim());
        return { locationName: parts.join(', '), country };
      }
    }
  } catch (err) {
    console.warn('Nominatim reverse geocoding unavailable:', err);
  }

  return { locationName: 'Location unavailable' };
}

export function classNames(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

