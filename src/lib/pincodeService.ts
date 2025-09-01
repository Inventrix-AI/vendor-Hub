import { useState, useCallback } from 'react';

// Free pincode to city/state mapping service
// Using India Post API (free) or fallback to offline data

interface PincodeData {
  city: string;
  state: string;
  district?: string;
}

// Offline data for major Madhya Pradesh pincodes
const offlinePincodeData: Record<string, PincodeData> = {
  // Bhopal
  '462001': { city: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal' },
  '462002': { city: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal' },
  '462003': { city: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal' },
  '462004': { city: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal' },
  '462010': { city: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal' },
  '462016': { city: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal' },
  '462021': { city: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal' },
  '462022': { city: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal' },
  '462023': { city: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal' },
  '462024': { city: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal' },
  '462030': { city: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal' },
  '462036': { city: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal' },
  '462038': { city: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal' },
  '462039': { city: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal' },
  '462042': { city: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal' },
  '462043': { city: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal' },
  '462044': { city: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal' },
  '462046': { city: 'Bhopal', state: 'Madhya Pradesh', district: 'Bhopal' },
  
  // Indore
  '452001': { city: 'Indore', state: 'Madhya Pradesh', district: 'Indore' },
  '452002': { city: 'Indore', state: 'Madhya Pradesh', district: 'Indore' },
  '452003': { city: 'Indore', state: 'Madhya Pradesh', district: 'Indore' },
  '452004': { city: 'Indore', state: 'Madhya Pradesh', district: 'Indore' },
  '452005': { city: 'Indore', state: 'Madhya Pradesh', district: 'Indore' },
  '452006': { city: 'Indore', state: 'Madhya Pradesh', district: 'Indore' },
  '452007': { city: 'Indore', state: 'Madhya Pradesh', district: 'Indore' },
  '452008': { city: 'Indore', state: 'Madhya Pradesh', district: 'Indore' },
  '452009': { city: 'Indore', state: 'Madhya Pradesh', district: 'Indore' },
  '452010': { city: 'Indore', state: 'Madhya Pradesh', district: 'Indore' },
  '452011': { city: 'Indore', state: 'Madhya Pradesh', district: 'Indore' },
  '452012': { city: 'Indore', state: 'Madhya Pradesh', district: 'Indore' },
  '452013': { city: 'Indore', state: 'Madhya Pradesh', district: 'Indore' },
  '452014': { city: 'Indore', state: 'Madhya Pradesh', district: 'Indore' },
  '452015': { city: 'Indore', state: 'Madhya Pradesh', district: 'Indore' },
  '452016': { city: 'Indore', state: 'Madhya Pradesh', district: 'Indore' },
  '452017': { city: 'Indore', state: 'Madhya Pradesh', district: 'Indore' },
  '452018': { city: 'Indore', state: 'Madhya Pradesh', district: 'Indore' },
  
  // Jabalpur
  '482001': { city: 'Jabalpur', state: 'Madhya Pradesh', district: 'Jabalpur' },
  '482002': { city: 'Jabalpur', state: 'Madhya Pradesh', district: 'Jabalpur' },
  '482003': { city: 'Jabalpur', state: 'Madhya Pradesh', district: 'Jabalpur' },
  '482004': { city: 'Jabalpur', state: 'Madhya Pradesh', district: 'Jabalpur' },
  '482005': { city: 'Jabalpur', state: 'Madhya Pradesh', district: 'Jabalpur' },
  '482006': { city: 'Jabalpur', state: 'Madhya Pradesh', district: 'Jabalpur' },
  '482007': { city: 'Jabalpur', state: 'Madhya Pradesh', district: 'Jabalpur' },
  '482008': { city: 'Jabalpur', state: 'Madhya Pradesh', district: 'Jabalpur' },
  '482009': { city: 'Jabalpur', state: 'Madhya Pradesh', district: 'Jabalpur' },
  '482010': { city: 'Jabalpur', state: 'Madhya Pradesh', district: 'Jabalpur' },
  '482011': { city: 'Jabalpur', state: 'Madhya Pradesh', district: 'Jabalpur' },
  
  // Gwalior
  '474001': { city: 'Gwalior', state: 'Madhya Pradesh', district: 'Gwalior' },
  '474002': { city: 'Gwalior', state: 'Madhya Pradesh', district: 'Gwalior' },
  '474003': { city: 'Gwalior', state: 'Madhya Pradesh', district: 'Gwalior' },
  '474004': { city: 'Gwalior', state: 'Madhya Pradesh', district: 'Gwalior' },
  '474005': { city: 'Gwalior', state: 'Madhya Pradesh', district: 'Gwalior' },
  '474006': { city: 'Gwalior', state: 'Madhya Pradesh', district: 'Gwalior' },
  '474007': { city: 'Gwalior', state: 'Madhya Pradesh', district: 'Gwalior' },
  '474008': { city: 'Gwalior', state: 'Madhya Pradesh', district: 'Gwalior' },
  '474009': { city: 'Gwalior', state: 'Madhya Pradesh', district: 'Gwalior' },
  '474010': { city: 'Gwalior', state: 'Madhya Pradesh', district: 'Gwalior' },
  '474011': { city: 'Gwalior', state: 'Madhya Pradesh', district: 'Gwalior' },
  '474012': { city: 'Gwalior', state: 'Madhya Pradesh', district: 'Gwalior' },
  
  // Ujjain
  '456001': { city: 'Ujjain', state: 'Madhya Pradesh', district: 'Ujjain' },
  '456006': { city: 'Ujjain', state: 'Madhya Pradesh', district: 'Ujjain' },
  '456010': { city: 'Ujjain', state: 'Madhya Pradesh', district: 'Ujjain' },
  
  // Sagar
  '470001': { city: 'Sagar', state: 'Madhya Pradesh', district: 'Sagar' },
  '470002': { city: 'Sagar', state: 'Madhya Pradesh', district: 'Sagar' },
  '470003': { city: 'Sagar', state: 'Madhya Pradesh', district: 'Sagar' },
  '470004': { city: 'Sagar', state: 'Madhya Pradesh', district: 'Sagar' },
  '470006': { city: 'Sagar', state: 'Madhya Pradesh', district: 'Sagar' },
  
  // Ratlam
  '457001': { city: 'Ratlam', state: 'Madhya Pradesh', district: 'Ratlam' },
  '457114': { city: 'Ratlam', state: 'Madhya Pradesh', district: 'Ratlam' },
  
  // Rewa
  '486001': { city: 'Rewa', state: 'Madhya Pradesh', district: 'Rewa' },
  '486002': { city: 'Rewa', state: 'Madhya Pradesh', district: 'Rewa' },
  '486003': { city: 'Rewa', state: 'Madhya Pradesh', district: 'Rewa' },
  '486006': { city: 'Rewa', state: 'Madhya Pradesh', district: 'Rewa' },
  
  // Satna
  '485001': { city: 'Satna', state: 'Madhya Pradesh', district: 'Satna' },
  '485661': { city: 'Satna', state: 'Madhya Pradesh', district: 'Satna' },
  
  // Dewas
  '455001': { city: 'Dewas', state: 'Madhya Pradesh', district: 'Dewas' },
  
  // Murwara (Katni)
  '483501': { city: 'Murwara', state: 'Madhya Pradesh', district: 'Katni' },
  
  // Other important cities
  '471001': { city: 'Chhatarpur', state: 'Madhya Pradesh', district: 'Chhatarpur' },
  '484001': { city: 'Shahdol', state: 'Madhya Pradesh', district: 'Shahdol' },
  '473001': { city: 'Guna', state: 'Madhya Pradesh', district: 'Guna' },
  '458001': { city: 'Mandsaur', state: 'Madhya Pradesh', district: 'Mandsaur' },
  '460001': { city: 'Betul', state: 'Madhya Pradesh', district: 'Betul' },
  '461001': { city: 'Hoshangabad', state: 'Madhya Pradesh', district: 'Hoshangabad' },
  '464001': { city: 'Vidisha', state: 'Madhya Pradesh', district: 'Vidisha' },
  '465001': { city: 'Raisen', state: 'Madhya Pradesh', district: 'Raisen' },
  '466001': { city: 'Sehore', state: 'Madhya Pradesh', district: 'Sehore' },
  '467001': { city: 'Rajgarh', state: 'Madhya Pradesh', district: 'Rajgarh' },
  '468001': { city: 'Narsinghpur', state: 'Madhya Pradesh', district: 'Narsinghpur' },
  '472001': { city: 'Tikamgarh', state: 'Madhya Pradesh', district: 'Tikamgarh' },
  '475001': { city: 'Datia', state: 'Madhya Pradesh', district: 'Datia' },
  '476001': { city: 'Morena', state: 'Madhya Pradesh', district: 'Morena' },
  '477001': { city: 'Bhind', state: 'Madhya Pradesh', district: 'Bhind' },
  '478001': { city: 'Balaghat', state: 'Madhya Pradesh', district: 'Balaghat' },
  '480001': { city: 'Chhindwara', state: 'Madhya Pradesh', district: 'Chhindwara' },
  '481001': { city: 'Seoni', state: 'Madhya Pradesh', district: 'Seoni' },
  '487001': { city: 'Sidhi', state: 'Madhya Pradesh', district: 'Sidhi' },
  '488001': { city: 'Panna', state: 'Madhya Pradesh', district: 'Panna' },
  '450001': { city: 'Khandwa', state: 'Madhya Pradesh', district: 'Khandwa' },
  '451001': { city: 'Khargone', state: 'Madhya Pradesh', district: 'Khargone' },
  '453001': { city: 'Dhar', state: 'Madhya Pradesh', district: 'Dhar' },
  '454001': { city: 'Jhabua', state: 'Madhya Pradesh', district: 'Jhabua' }
};

// Free pincode API service
export async function getPincodeData(pincode: string): Promise<PincodeData | null> {
  if (!pincode || pincode.length !== 6) {
    return null;
  }

  // First try offline data for faster response
  const offlineData = offlinePincodeData[pincode];
  if (offlineData) {
    return offlineData;
  }

  // If not found in offline data, try free API
  try {
    // Using India Post API (free, no API key required)
    const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const data = await response.json();
    
    if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
      const postOffice = data[0].PostOffice[0];
      return {
        city: postOffice.District,
        state: postOffice.State,
        district: postOffice.District
      };
    }
  } catch (error) {
    console.warn('Pincode API failed, using offline data only:', error);
  }

  // Return null for invalid pincodes - don't fill with "Unknown City"
  return null;
}

// Client-side hook for pincode lookup
export function usePincodeData() {
  const [loading, setLoading] = useState(false);
  
  const lookupPincode = useCallback(async (pincode: string): Promise<PincodeData | null> => {
    if (!pincode || pincode.length !== 6) {
      return null;
    }

    setLoading(true);
    
    try {
      // First check offline data (instant)
      const offlineData = offlinePincodeData[pincode];
      if (offlineData) {
        return offlineData;
      }

      // If not in offline data, try API
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      
      if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
        const postOffice = data[0].PostOffice[0];
        return {
          city: postOffice.District,
          state: postOffice.State,
          district: postOffice.District
        };
      }

      // Return null for invalid pincodes - don't fill with "Unknown City"
      return null;
    } catch (error) {
      console.warn('Pincode lookup failed:', error);
      
      // Return null for invalid pincodes - don't fill with "Unknown City"
      return null;
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since function doesn't depend on any props/state

  return { lookupPincode, loading };
}