/**
 * Indian City and District GPS Coordinates Utility
 * Provides instant and offline-first GPS lookup for Indian cities and districts.
 */

export const INDIAN_CITY_COORDINATES = {
  // Uttar Pradesh - Major Districts & Towns
  'saharanpur': { lat: 29.9640, lng: 77.5460, name: 'Saharanpur' },
  'behat': { lat: 30.1667, lng: 77.6167, name: 'Behat, Saharanpur' },
  'deoband': { lat: 29.6958, lng: 77.6814, name: 'Deoband, Saharanpur' },
  'nakur': { lat: 29.9255, lng: 77.3072, name: 'Nakur, Saharanpur' },
  'gangoh': { lat: 29.7716, lng: 77.2588, name: 'Gangoh, Saharanpur' },
  'rampur maniharan': { lat: 29.7997, lng: 77.5925, name: 'Rampur Maniharan' },
  'sarsawa': { lat: 29.9882, lng: 77.4069, name: 'Sarsawa, Saharanpur' },
  'muzaffarnagar': { lat: 29.4727, lng: 77.7085, name: 'Muzaffarnagar' },
  'shamli': { lat: 29.4485, lng: 77.3105, name: 'Shamli' },
  'kairana': { lat: 29.4000, lng: 77.2000, name: 'Kairana' },
  'meerut': { lat: 28.9845, lng: 77.7064, name: 'Meerut' },
  'baghpat': { lat: 28.9449, lng: 77.2244, name: 'Baghpat' },
  'baraut': { lat: 29.1026, lng: 77.2625, name: 'Baraut' },
  'ghaziabad': { lat: 28.6692, lng: 77.4538, name: 'Ghaziabad' },
  'hapur': { lat: 28.7306, lng: 77.7759, name: 'Hapur' },
  'noida': { lat: 28.5355, lng: 77.3910, name: 'Noida' },
  'greater noida': { lat: 28.4744, lng: 77.5040, name: 'Greater Noida' },
  'gautam buddha nagar': { lat: 28.5355, lng: 77.3910, name: 'Gautam Buddha Nagar' },
  'bulandshahr': { lat: 28.4069, lng: 77.8498, name: 'Bulandshahr' },
  'aligarh': { lat: 27.8974, lng: 78.0880, name: 'Aligarh' },
  'hathras': { lat: 27.5986, lng: 78.0537, name: 'Hathras' },
  'mathura': { lat: 27.4924, lng: 77.6737, name: 'Mathura' },
  'vrindavan': { lat: 27.5806, lng: 77.7006, name: 'Vrindavan' },
  'agra': { lat: 27.1767, lng: 78.0081, name: 'Agra' },
  'firozabad': { lat: 27.1592, lng: 78.3957, name: 'Firozabad' },
  'mainpuri': { lat: 27.2289, lng: 79.0253, name: 'Mainpuri' },
  'etawah': { lat: 26.7855, lng: 79.0154, name: 'Etawah' },
  'auraiya': { lat: 26.4674, lng: 79.5168, name: 'Auraiya' },
  'kanpur': { lat: 26.4499, lng: 80.3319, name: 'Kanpur' },
  'kanpur nagar': { lat: 26.4499, lng: 80.3319, name: 'Kanpur' },
  'kanpur dehat': { lat: 26.3687, lng: 79.9535, name: 'Kanpur Dehat' },
  'lucknow': { lat: 26.8467, lng: 80.9462, name: 'Lucknow' },
  'unnao': { lat: 26.5459, lng: 80.4878, name: 'Unnao' },
  'rae bareli': { lat: 26.2236, lng: 81.2409, name: 'Rae Bareli' },
  'raebareli': { lat: 26.2236, lng: 81.2409, name: 'Raebareli' },
  'amethi': { lat: 26.1557, lng: 81.8159, name: 'Amethi' },
  'sultanpur': { lat: 26.2648, lng: 82.0727, name: 'Sultanpur' },
  'ayodhya': { lat: 26.7922, lng: 82.1998, name: 'Ayodhya' },
  'faizabad': { lat: 26.7731, lng: 82.1460, name: 'Faizabad' },
  'barabanki': { lat: 26.9269, lng: 81.1834, name: 'Barabanki' },
  'sitapur': { lat: 27.5684, lng: 80.6806, name: 'Sitapur' },
  'hardoi': { lat: 27.3989, lng: 80.1309, name: 'Hardoi' },
  'lakhimpur': { lat: 27.9462, lng: 80.7787, name: 'Lakhimpur' },
  'lakhimpur kheri': { lat: 27.9462, lng: 80.7787, name: 'Lakhimpur Kheri' },
  'bareilly': { lat: 28.3670, lng: 79.4304, name: 'Bareilly' },
  'budaun': { lat: 28.0384, lng: 79.1246, name: 'Budaun' },
  'shahjahanpur': { lat: 27.8805, lng: 79.9122, name: 'Shahjahanpur' },
  'pilibhit': { lat: 28.6304, lng: 79.8043, name: 'Pilibhit' },
  'moradabad': { lat: 28.8386, lng: 78.7733, name: 'Moradabad' },
  'rampur': { lat: 28.8074, lng: 79.0267, name: 'Rampur' },
  'bijnor': { lat: 29.3732, lng: 78.1354, name: 'Bijnor' },
  'amroha': { lat: 28.9044, lng: 78.4674, name: 'Amroha' },
  'sambhal': { lat: 28.5846, lng: 78.5701, name: 'Sambhal' },
  'varanasi': { lat: 25.3176, lng: 82.9739, name: 'Varanasi' },
  'banaras': { lat: 25.3176, lng: 82.9739, name: 'Banaras' },
  'kashi': { lat: 25.3176, lng: 82.9739, name: 'Kashi' },
  'jaunpur': { lat: 25.7464, lng: 82.6837, name: 'Jaunpur' },
  'ghazipur': { lat: 25.5840, lng: 83.5770, name: 'Ghazipur' },
  'chandauli': { lat: 25.2611, lng: 83.2706, name: 'Chandauli' },
  'mirzapur': { lat: 25.1337, lng: 82.5644, name: 'Mirzapur' },
  'sonbhadra': { lat: 24.6854, lng: 83.0673, name: 'Sonbhadra' },
  'bhadohi': { lat: 25.3957, lng: 82.5714, name: 'Bhadohi' },
  'prayagraj': { lat: 25.4358, lng: 81.8463, name: 'Prayagraj' },
  'allahabad': { lat: 25.4358, lng: 81.8463, name: 'Allahabad' },
  'kaushambi': { lat: 25.5317, lng: 81.3888, name: 'Kaushambi' },
  'pratapgarh': { lat: 25.9250, lng: 81.9867, name: 'Pratapgarh' },
  'fatehpur': { lat: 25.9286, lng: 80.8130, name: 'Fatehpur' },
  'gorakhpur': { lat: 26.7606, lng: 83.3732, name: 'Gorakhpur' },
  'maharajganj': { lat: 27.1472, lng: 83.5606, name: 'Maharajganj' },
  'deoria': { lat: 26.5024, lng: 83.7791, name: 'Deoria' },
  'kushinagar': { lat: 26.7408, lng: 83.8890, name: 'Kushinagar' },
  'basti': { lat: 26.8041, lng: 82.7603, name: 'Basti' },
  'siddharthnagar': { lat: 27.2798, lng: 82.8122, name: 'Siddharthnagar' },
  'sant kabir nagar': { lat: 26.7820, lng: 83.0300, name: 'Sant Kabir Nagar' },
  'azamgarh': { lat: 26.0682, lng: 83.1844, name: 'Azamgarh' },
  'mau': { lat: 25.9417, lng: 83.5611, name: 'Mau' },
  'ballia': { lat: 25.7589, lng: 84.1483, name: 'Ballia' },
  'jhansi': { lat: 25.4484, lng: 78.5685, name: 'Jhansi' },
  'lalitpur': { lat: 24.6908, lng: 78.4140, name: 'Lalitpur' },
  'jalaun': { lat: 26.1454, lng: 79.3361, name: 'Jalaun' },
  'orai': { lat: 25.9898, lng: 79.4526, name: 'Orai' },
  'banda': { lat: 25.4764, lng: 80.3361, name: 'Banda' },
  'chitrakoot': { lat: 25.2003, lng: 80.9038, name: 'Chitrakoot' },
  'hamirpur': { lat: 25.9542, lng: 80.1517, name: 'Hamirpur' },
  'mahoba': { lat: 25.2921, lng: 79.8722, name: 'Mahoba' },

  // Uttarakhand & Nearby
  'dehradun': { lat: 30.3165, lng: 78.0322, name: 'Dehradun' },
  'haridwar': { lat: 29.9457, lng: 78.1642, name: 'Haridwar' },
  'roorkee': { lat: 29.8543, lng: 77.8880, name: 'Roorkee' },
  'rishikesh': { lat: 30.0869, lng: 78.2676, name: 'Rishikesh' },
  'nainital': { lat: 29.3919, lng: 79.4542, name: 'Nainital' },
  'haldwani': { lat: 29.2183, lng: 79.5130, name: 'Haldwani' },

  // Delhi NCR & Haryana
  'delhi': { lat: 28.6139, lng: 77.2090, name: 'New Delhi' },
  'new delhi': { lat: 28.6139, lng: 77.2090, name: 'New Delhi' },
  'gurgaon': { lat: 28.4595, lng: 77.0266, name: 'Gurugram' },
  'gurugram': { lat: 28.4595, lng: 77.0266, name: 'Gurugram' },
  'faridabad': { lat: 28.4089, lng: 77.3178, name: 'Faridabad' },
  'sonipat': { lat: 28.9931, lng: 77.0151, name: 'Sonipat' },
  'panipat': { lat: 29.3909, lng: 76.9635, name: 'Panipat' },
  'karnal': { lat: 29.6857, lng: 76.9905, name: 'Karnal' },
  'kurukshetra': { lat: 29.9695, lng: 76.8783, name: 'Kurukshetra' },
  'ambala': { lat: 30.3782, lng: 76.7767, name: 'Ambala' },
  'yamunanagar': { lat: 30.1290, lng: 77.2674, name: 'Yamunanagar' },
  'jagadhri': { lat: 30.1691, lng: 77.2974, name: 'Jagadhri' },
  'rohtak': { lat: 28.8955, lng: 76.6066, name: 'Rohtak' },
  'hisar': { lat: 29.1492, lng: 75.7217, name: 'Hisar' },
  'chandigarh': { lat: 30.7333, lng: 76.7794, name: 'Chandigarh' },
  'mohali': { lat: 30.7046, lng: 76.7179, name: 'Mohali' },
  'panchkula': { lat: 30.6942, lng: 76.8606, name: 'Panchkula' },

  // Other Major Indian Metros & Cities
  'jaipur': { lat: 26.9124, lng: 75.7873, name: 'Jaipur' },
  'patna': { lat: 25.5941, lng: 85.1376, name: 'Patna' },
  'mumbai': { lat: 19.0760, lng: 72.8777, name: 'Mumbai' },
  'pune': { lat: 18.5204, lng: 73.8567, name: 'Pune' },
  'bhopal': { lat: 23.2599, lng: 77.4126, name: 'Bhopal' },
  'indore': { lat: 22.7196, lng: 75.8577, name: 'Indore' },
  'kolkata': { lat: 22.5726, lng: 88.3639, name: 'Kolkata' },
  'bengaluru': { lat: 12.9716, lng: 77.5946, name: 'Bengaluru' },
  'bangalore': { lat: 12.9716, lng: 77.5946, name: 'Bengaluru' },
  'hyderabad': { lat: 17.3850, lng: 78.4867, name: 'Hyderabad' },
  'ahmedabad': { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad' }
};

/**
 * Resolves coordinates from city name or address string using offline dictionary
 */
export function resolveCityCoordinates(text) {
  if (!text || typeof text !== 'string') return null;
  const clean = text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, ' ');

  // 1. Direct exact key match
  const stripped = clean.replace(/\s+/g, ' ').trim();
  if (INDIAN_CITY_COORDINATES[stripped]) {
    return INDIAN_CITY_COORDINATES[stripped];
  }

  // 2. Substring matching: longest key first to prevent "deoband" matching "band" etc.
  const keysSorted = Object.keys(INDIAN_CITY_COORDINATES).sort((a, b) => b.length - a.length);
  for (const key of keysSorted) {
    const regex = new RegExp(`\\b${key}\\b`, 'i');
    if (regex.test(clean)) {
      return INDIAN_CITY_COORDINATES[key];
    }
  }

  // 3. Fallback partial include
  for (const key of keysSorted) {
    if (clean.includes(key)) {
      return INDIAN_CITY_COORDINATES[key];
    }
  }

  return null;
}

/**
 * Resolves coordinates online via Nominatim OpenStreetMap API with India bias
 */
export async function fetchOnlineCoordinates(query) {
  if (!query || typeof query !== 'string' || !query.trim()) return null;
  try {
    const cleanQuery = query.trim().replace(/[^a-zA-Z0-9\s,.-]/g, '');
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery + ', India')}&countrycodes=in&limit=1`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return {
        lat: parseFloat(parseFloat(data[0].lat).toFixed(4)),
        lng: parseFloat(parseFloat(data[0].lon).toFixed(4)),
        displayName: data[0].display_name
      };
    }
  } catch (err) {
    console.warn('Online geocoding fetch notice:', err?.message || err);
  }
  return null;
}

