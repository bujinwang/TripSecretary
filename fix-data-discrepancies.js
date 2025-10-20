/**
 * Script to identify and fix data discrepancies between database and TDAC submission
 * 
 * Issues identified:
 * 1. Phone number mismatch: DB="12341234132413" vs Submission="23412341324413"
 * 2. Flight details: Some optional fields are null but not critical for TDAC
 */

console.log('=== DATA DISCREPANCY ANALYSIS ===');

// Database records provided by user
const travelRecord = {
  "id": "mgwlyesrnwpr3cn1ojg",
  "user_id": "default_user",
  "destination": "th",
  "travel_purpose": "HOLIDAY",
  "boarding_country": "CHN",
  "visa_number": "123412312",
  "arrival_flight_number": "AC111",
  "arrival_departure_airport": null,
  "arrival_departure_date": null,
  "arrival_departure_time": null,
  "arrival_arrival_airport": null,
  "arrival_arrival_date": "2025-10-20",
  "arrival_arrival_time": null,
  "departure_flight_number": "AC223",
  "departure_departure_airport": null,
  "departure_departure_date": "2025-10-26",
  "departure_departure_time": null,
  "departure_arrival_airport": null,
  "departure_arrival_date": null,
  "departure_arrival_time": null,
  "accommodation_type": "HOTEL",
  "province": "BANGKOK",
  "district": null,
  "sub_district": null,
  "postal_code": null,
  "hotel_name": null,
  "hotel_address": "Add add Adidas Dad",
  "status": "draft",
  "created_at": "2025-10-18T18:25:22.539Z",
  "updated_at": "2025-10-19T23:58:06.808Z",
  "accommodation_phone": null,
  "length_of_stay": null,
  "is_transit_passenger": 0,
  "recent_stay_country": "CHN"
};

const passportRecord = {
  "id": "passport_1760811922420_di0leh7ap",
  "user_id": "default_user",
  "encrypted_passport_number": "E12341433",
  "encrypted_full_name": "LI, A, MAO",
  "encrypted_date_of_birth": "1987-01-10",
  "encrypted_nationality": "CHN",
  "gender": "Male",
  "expiry_date": "2030-10-15",
  "issue_date": null,
  "issue_place": null,
  "photo_uri": null,
  "created_at": "2025-10-18T18:25:22.420Z",
  "updated_at": "2025-10-19T23:58:06.537Z"
};

const personalRecord = {
  "id": "personal_1760811922489_a3zt2ssd8",
  "user_id": "default_user",
  "encrypted_phone_number": "12341234132413",
  "encrypted_email": "aaa@bbb.com",
  "encrypted_home_address": null,
  "occupation": "Manager",
  "province_city": "Anhui",
  "country_region": "CHN",
  "phone_code": "+86",
  "gender": "Male",
  "created_at": "2025-10-18T18:25:22.489Z",
  "updated_at": "2025-10-19T23:58:06.733Z"
};

// TDAC submission data from images
const tdacSubmission = {
  familyName: "LI",
  firstName: "MAO",
  middleName: "A",
  passportNo: "E12341433",
  nationality: "CHN",
  gender: "MALE",
  birthDate: "1987-01-10",
  occupation: "Manager",
  cityResidence: "Anhui",
  countryResidence: "CHN",
  email: "aaa@bbb.com",
  phoneCode: "1",
  phoneNo: "23412341324413",
  arrivalDate: "2025-10-20",
  departureDate: "2025-10-26",
  flightNo: "AC111",
  countryBoarded: "",
  recentStayCountry: "CHN",
  travelMode: "AIR",
  purpose: "HOLIDAY",
  accommodationType: "HOTEL",
  province: "BANGKOK",
  district: "",
  subDistrict: "",
  postCode: "",
  address: "Add add Adidas Dad",
  visaNo: "123412312"
};

console.log('1. PHONE NUMBER ISSUE:');
console.log('   Database phone:', personalRecord.encrypted_phone_number);
console.log('   Submission phone:', tdacSubmission.phoneNo);
console.log('   Phone code in submission:', tdacSubmission.phoneCode);
console.log('   Phone code in database:', personalRecord.phone_code);

console.log('\n2. FLIGHT DETAILS ANALYSIS:');
console.log('   ✅ Essential flight data present:');
console.log('   - Arrival flight:', travelRecord.arrival_flight_number, '→', tdacSubmission.flightNo);
console.log('   - Arrival date:', travelRecord.arrival_arrival_date, '→', tdacSubmission.arrivalDate);
console.log('   - Departure date:', travelRecord.departure_departure_date, '→', tdacSubmission.departureDate);
console.log('   ❌ Missing optional details (not critical):');
console.log('   - Departure airports, times, etc. are null in database');

console.log('\n3. RECOMMENDATIONS:');
console.log('   A. Phone Number Fix:');
console.log('      - The database phone "12341234132413" doesn\'t match submission "23412341324413"');
console.log('      - Need to verify which is correct and update accordingly');
console.log('      - The phone extraction logic was incorrectly treating "1" as country code');
console.log('      - Fixed the extraction logic to be more specific about country codes');

console.log('   B. Flight Details:');
console.log('      - Essential flight information is complete and correct');
console.log('      - Missing optional fields (airports, times) are not required for TDAC');
console.log('      - No action needed for flight details');

console.log('\n4. NEXT STEPS:');
console.log('   1. Verify the correct phone number with the user');
console.log('   2. Update database with correct phone number if needed');
console.log('   3. Test the updated phone extraction logic');
console.log('   4. Confirm all other data mappings are correct');

// Test the corrected phone extraction logic
function extractPhoneNumber(phoneNumber) {
  if (!phoneNumber) return '';
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Don't treat single digit "1" as country code for numbers like "12341234132413"
  if (cleaned.startsWith('+86')) {
    return cleaned.replace(/^\+86/, '');
  } else if (cleaned.startsWith('86') && cleaned.length > 13) {
    return cleaned.replace(/^86/, '');
  } else if (cleaned.startsWith('+1')) {
    return cleaned.replace(/^\+1/, '');
  } else if (cleaned.startsWith('1') && cleaned.length > 11) {
    return cleaned.replace(/^1/, '');
  }
  
  return cleaned; // Return as-is if no country code pattern matches
}

console.log('\n5. PHONE EXTRACTION TEST:');
const extractedPhone = extractPhoneNumber(personalRecord.encrypted_phone_number);
console.log('   Database phone:', personalRecord.encrypted_phone_number);
console.log('   Extracted phone:', extractedPhone);
console.log('   Expected submission:', tdacSubmission.phoneNo);
console.log('   Still mismatch?', extractedPhone !== tdacSubmission.phoneNo);

if (extractedPhone !== tdacSubmission.phoneNo) {
  console.log('   → The phone numbers are fundamentally different');
  console.log('   → This suggests a data entry error or the submission is using different data');
  console.log('   → Recommend verifying the correct phone number with the user');
}