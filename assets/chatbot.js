/**
 * chatbot.js — QueueLess Intelligent Citizen & Officer Assistant
 * Accurate, zero-default, context-aware chatbot for QueueLess Government Office.
 */

(function () {
  "use strict";

  // Conversation history
  const HIST = [];

  /* ================================================================
     1. KNOWLEDGE BASE & DOCUMENT REQUIREMENTS
  ================================================================ */
  const DOCS = {
    // Driving Licence Services
    learner_licence: {
      title: "Learner's Licence (LL) Document Checklist",
      office: "RTO Office",
      dept: "Transport Department",
      onlinePortal: "sarathi.parivahan.gov.in",
      items: [
        "<b>Proof of Age (any 1):</b> 10th Standard School Leaving Certificate (SLC), Birth Certificate, Passport, or PAN Card.",
        "<b>Proof of Address (any 1):</b> Aadhaar Card, Voter ID Card, Electricity Bill (within 3 months), or Passport.",
        "<b>Application Form:</b> Form 2 generated online from Sarathi portal.",
        "<b>Medical Certificate:</b> Form 1 (Self-declaration for non-transport) or Form 1A (certified by MBBS doctor if age >40).",
        "<b>Photographs:</b> 3 recent passport-sized color photos (white background).",
        "<b>Fee Payment Receipt:</b> Online payment receipt from Sarathi portal (₹150–₹200 per class of vehicle).",
        "<b>For Minors (16–18 years, 50cc without gear):</b> Written consent declaration by parent/guardian."
      ],
      process: "1. Fill Form 2 on Sarathi portal. 2. Upload documents & pay fee. 3. Book computer-based learner test slot. 4. Take your QueueLess virtual token on the test day to skip the waiting line!"
    },
    driving_test: {
      title: "Permanent Driving Licence (DL) & Driving Test",
      office: "RTO Office",
      dept: "Transport Department",
      onlinePortal: "sarathi.parivahan.gov.in",
      items: [
        "<b>Valid Learner's Licence (LL):</b> Must be held for a minimum of 30 days and valid within 180 days.",
        "<b>Application Form:</b> Form 4 printout from Sarathi portal.",
        "<b>Test Vehicle Documents:</b> Valid Registration Certificate (RC), Comprehensive Motor Insurance, and valid PUC (Pollution Under Control) certificate of the test vehicle.",
        "<b>Vehicle Suitability:</b> For 2-wheeler, helmet is compulsory; for 4-wheeler, seatbelt and 'L' sticker if learner vehicle.",
        "<b>Photographs:</b> 2 passport-size color photographs.",
        "<b>Slot Booking Receipt:</b> Confirmation slip of driving test appointment.",
        "<b>Commercial / Transport Vehicle (if applicable):</b> Form 5 certificate from recognized Motor Driving School."
      ],
      process: "Pass the practical driving test on the automated testing track. Once verified, biometric photo/thumbprint is captured, and the smart card DL is dispatched via Speed Post."
    },
    dl_renewal: {
      title: "Driving Licence (DL) Renewal / Duplicate / Address Change",
      office: "RTO Office",
      dept: "Transport Department",
      onlinePortal: "sarathi.parivahan.gov.in",
      items: [
        "<b>Original Driving Licence:</b> Physical DL card or booklet.",
        "<b>Application Form:</b> Form 9 (for renewal) or Form 2 (for address change / duplicate).",
        "<b>Medical Form 1A:</b> Compulsory if the applicant is over 40 years of age.",
        "<b>Proof of Address:</b> Aadhaar Card, Voter ID, or Utility bill (mandatory if changing residential address).",
        "<b>For Duplicate DL (lost/damaged):</b> Copy of police report / FIR or non-traceable certificate, plus Form LLD.",
        "<b>Prescribed Fee:</b> Renewal fee payment receipt (extra penalty applies if expired >1 year)."
      ],
      process: "Submit online on Sarathi or visit RTO counter. Once verified, updated DL card is issued."
    },
    vehicle_registration: {
      title: "Vehicle Registration (New RC Book)",
      office: "RTO Office",
      dept: "Transport Department",
      onlinePortal: "vahan.parivahan.gov.in",
      items: [
        "<b>Application Form:</b> Form 20 signed by vehicle purchaser.",
        "<b>Sale Certificate:</b> Form 21 issued by authorized automobile dealer.",
        "<b>Roadworthiness Certificate:</b> Form 22 and Form 22A from vehicle manufacturer.",
        "<b>Valid Motor Insurance:</b> Comprehensive motor insurance policy copy.",
        "<b>Proof of Address:</b> Aadhaar Card, Voter ID, Electricity Bill, or Ration Card.",
        "<b>PAN Card / Form 60:</b> Copy of PAN card or declaration Form 60.",
        "<b>Chassis & Engine Pencil Impression:</b> Clear pencil tracing on Form 20.",
        "<b>One-time Road Tax Receipt:</b> Proof of road tax paid."
      ],
      process: "Dealer uploads initial data; physical inspection/HSRP fitment verified at RTO before RC smart card generation."
    },
    rc_transfer: {
      title: "Vehicle Ownership Transfer (Second-hand Vehicle RC)",
      office: "RTO Office",
      dept: "Transport Department",
      onlinePortal: "vahan.parivahan.gov.in",
      items: [
        "<b>Original Registration Certificate (RC):</b> Existing smart card/booklet.",
        "<b>Transfer Forms:</b> Form 29 (Notice of Transfer in duplicate) and Form 30 (Application for Transfer).",
        "<b>Valid Insurance:</b> Transferred motor insurance policy in buyer's name.",
        "<b>Valid PUC Certificate:</b> Emission test report.",
        "<b>Buyer's Identity & Address Proof:</b> Aadhaar Card and PAN card.",
        "<b>NOC from Financier (Form 35):</b> If vehicle had a bank hypothecation/loan.",
        "<b>RTO Inter-state NOC (Form 28):</b> Compulsory if transferred from outside current RTO jurisdiction."
      ],
      process: "Buyer and seller sign transfer papers, submit at RTO counter, and new RC is issued to the buyer."
    },

    // Passport Services
    fresh_passport: {
      title: "Fresh Passport (Adult & Minor) Document Checklist",
      office: "Passport Seva Kendra (PSK)",
      dept: "Ministry of External Affairs (MEA)",
      onlinePortal: "passportindia.gov.in",
      items: [
        "<b>Proof of Date of Birth (any 1):</b> Birth Certificate (issued by Municipal authority), 10th School Leaving Certificate (SLC), PAN Card, or Aadhaar Card.",
        "<b>Proof of Present Address (any 1):</b> Aadhaar Card, Water/Electricity/Telephone bill, Bank Passbook (with photo & bank branch stamp), or Registered Rent Agreement.",
        "<b>Non-ECR Proof (for Emigration Check Not Required):</b> 10th standard pass certificate / higher degree certificate. (If uneducated, passport will be stamped ECR).",
        "<b>Appointment Confirmation Slip:</b> Printed ARN (Application Reference Number) appointment sheet.",
        "<b>For Minors (<18 years):</b> Parents' original passports (with self-attested copies), Annexure 'D' signed by both parents, minor's birth certificate.",
        "<b>For Tatkaal Application:</b> 3 out of 13 approved identity documents (Aadhaar, PAN, Voter ID, Bank Passbook, etc.) plus Annexure 'E' affidavit."
      ],
      process: "1. Fill form on passportindia.gov.in. 2. Pay fee & book PSK slot. 3. Arrive at PSK for biometric photo, fingerprinting & document verification. 4. Police verification followed by Speed Post delivery."
    },
    passport_renewal: {
      title: "Passport Renewal / Re-issue Document Checklist",
      office: "Passport Seva Kendra (PSK)",
      dept: "Ministry of External Affairs (MEA)",
      onlinePortal: "passportindia.gov.in",
      items: [
        "<b>Old Original Passport:</b> Must be submitted physically at counter.",
        "<b>Self-attested Photocopies:</b> First 2 pages (photo & personal details), last 2 pages (address), and ECR/Non-ECR status page.",
        "<b>Proof of Current Address:</b> Mandatory ONLY if your residential address has changed since old passport.",
        "<b>Spouse Name Addition (if applicable):</b> Self-attested copy of spouse's passport or Marriage Certificate.",
        "<b>Appointment Slip:</b> ARN appointment receipt from passportindia.gov.in."
      ],
      process: "Re-issue is rapid. If old passport was verified by police and address is unchanged, police verification may be waived or post-issue."
    },
    police_clearance: {
      title: "Police Clearance Certificate (PCC) Checklist",
      office: "Passport Seva Kendra (PSK)",
      dept: "Ministry of External Affairs (MEA)",
      onlinePortal: "passportindia.gov.in",
      items: [
        "<b>Original Passport:</b> Valid passport with self-attested copies of first 2 and last 2 pages.",
        "<b>Proof of Current Address:</b> Aadhaar Card or Bank Passbook with applicant's photo.",
        "<b>Requirement Evidence:</b> Employment contract, Visa requirement letter, or Immigration sponsorship document.",
        "<b>ARN Receipt:</b> Appointment slip from Passport Seva portal."
      ],
      process: "Application submitted at PSK; local police station conducts background check, after which PCC is stamped/issued."
    },

    // Revenue / Collectorate Services
    income_certificate: {
      title: "Income Certificate (Aavak no Dakhlo) Checklist",
      office: "Collectorate / Mamlatdar Office",
      dept: "Revenue Department (Digital Gujarat / e-Dhara)",
      onlinePortal: "digitalgujarat.gov.in",
      items: [
        "<b>Identity Proof:</b> Aadhaar Card or Voter ID of applicant / head of household.",
        "<b>Residence Proof:</b> Ration Card (Mandatory) and recent Electricity bill.",
        "<b>Proof of Income:</b> Salary slip (last 3 months) / Form 16 / IT Return / Employer letter OR Talati's Village Income Assessment Panchnama (for farmers/self-employed).",
        "<b>Self-declaration / Affidavit:</b> ₹50 / ₹100 Stamp paper affidavit stating total annual family income.",
        "<b>Passport-sized Photographs:</b> 2 color photos.",
        "<b>Application Form:</b> Duly completed Revenue Form with revenue stamp."
      ],
      process: "Submitted at Jan Seva Kendra / Collectorate. Verified by Talati / Circle Officer; Mamlatdar issues digital certificate valid for 3 financial years."
    },
    caste_certificate: {
      title: "Caste / Tribe Certificate (SC / ST / OBC / SEBC / EWS)",
      office: "Collectorate / Mamlatdar Office",
      dept: "Social Justice & Empowerment / Revenue",
      onlinePortal: "digitalgujarat.gov.in",
      items: [
        "<b>Proof of Caste Lineage (any 1):</b> Father's, brother's, paternal uncle's, or grandfather's School Leaving Certificate or old Caste Certificate containing caste entry.",
        "<b>Applicant's School Leaving Certificate (SLC):</b> Indicating birth place, date, and community.",
        "<b>Identity & Address Proof:</b> Aadhaar Card and Ration Card of applicant & parents.",
        "<b>Genealogical Tree (Pedhinama):</b> Family pedigree certified by Talati / Village Panchayat.",
        "<b>Self-Declaration Affidavit:</b> Formal caste pedigree declaration on non-judicial stamp paper.",
        "<b>For OBC Non-Creamy Layer (NCL):</b> Last 3 years' verified income tax returns or revenue income certificate of parents (income under ₹8 Lakh/annum threshold)."
      ],
      process: "Submitted at Collectorate / Jan Seva Kendra counter. Verification completed within 7–15 working days."
    },
    land_records: {
      title: "Land Records (7/12 & 8A / RoR / Village Form Nakal)",
      office: "Collectorate / Mamlatdar (e-Dhara Kendra)",
      dept: "Revenue Department (AnyRoR Gujarat)",
      onlinePortal: "anyror.gujarat.gov.in",
      items: [
        "<b>Village Details:</b> District Name, Taluka Name, and Village Name.",
        "<b>Survey Number / Gut Number / Block Number:</b> Exact agricultural or non-agricultural survey number.",
        "<b>Khata Number (Account Number):</b> For Village Form 8A (holding record).",
        "<b>Mutation Entry Number:</b> Village Form 6 (Hakk Patrak) if checking title transfer.",
        "<b>Applicant Identity Proof:</b> Aadhaar Card for certified physical copies.",
        "<b>Nominal Fee:</b> ₹5 to ₹15 per digitally signed certified copy at e-Dhara counter."
      ],
      process: "Certified computerised extracts are issued instantly at e-Dhara Jan Seva counters across Gujarat."
    },

    // Municipal / RMC Civic Centre Services
    birth_certificate: {
      title: "Birth Certificate (Janam Praman Patra) Checklist",
      office: "RMC Civic Centre (Municipal Corporation)",
      dept: "Health & Vital Statistics Department",
      onlinePortal: "rmc.gov.in",
      items: [
        "<b>Institutional Birth (Hospital):</b> Discharge Slip / Form 1 Birth Report issued directly by hospital/maternity clinic.",
        "<b>Parents' Identity & Address Proof:</b> Aadhaar Cards of mother and father.",
        "<b>Parents' Marriage Certificate:</b> If available (assists child naming).",
        "<b>Timeline Rules:</b> Registration within 21 days of birth is 100% FREE.",
        "<b>Late Registration:</b> 21–30 days requires late fee; 30 days–1 year requires CMO permission; >1 year requires Sub-Divisional Magistrate (SDM) order.",
        "<b>Child Name Addition:</b> If certificate was taken without name, Form for name addition can be submitted within 15 years."
      ],
      process: "Issued on-the-spot at RMC Civic Centre upon verification of hospital vital register record."
    },
    death_certificate: {
      title: "Death Certificate (Maran Praman Patra) Checklist",
      office: "RMC Civic Centre (Municipal Corporation)",
      dept: "Health & Vital Statistics Department",
      onlinePortal: "rmc.gov.in",
      items: [
        "<b>Medical Cause of Death Form:</b> Form 4 (institutional) or Form 4A (attended by registered doctor at home).",
        "<b>Crematorium / Burial Ground Receipt:</b> Official register slip issued by crematorium / Kabrastan / graveyard authority.",
        "<b>Deceased Person's Identity Proof:</b> Aadhaar Card, Voter ID, and Ration Card.",
        "<b>Informant / Applicant ID Proof:</b> Aadhaar Card of family member submitting application.",
        "<b>Registration Window:</b> Within 21 days for standard processing."
      ],
      process: "Registered in municipal civil registry; certified copies issued at civic centre counters."
    },
    property_tax: {
      title: "Property Tax Assessment & Payment Checklist",
      office: "RMC Civic Centre",
      dept: "Assessment & Tax Recovery Department",
      onlinePortal: "rmc.gov.in",
      items: [
        "<b>Existing Assessment:</b> Tenement Number / Property Tax Bill / Receipt of previous financial year.",
        "<b>For Name Change / Transfer:</b> Registered Sale Deed (Dastavej) or Property Index-II extract.",
        "<b>For New Property Assessment:</b> Approved Building Permission plan, BU (Building Use) Permission, and Architect layout carpet area certificate.",
        "<b>Electricity Bill:</b> Copy showing consumer number and active connection meter.",
        "<b>Owner's Aadhaar Card & PAN Card.</b>"
      ],
      process: "Tax can be paid by cash/card/UPI at any RMC Civic Centre cash counter. Rebates (up to 10%) often apply for early online payment in April-May."
    },
    trade_licence: {
      title: "Trade Licence / Shop & Establishment Registration",
      office: "RMC Civic Centre",
      dept: "Licensing & Health Department",
      onlinePortal: "rmc.gov.in",
      items: [
        "<b>Premises Tax Receipt:</b> Current year's Property Tax paid receipt for the shop/commercial unit.",
        "<b>Occupancy Proof:</b> Commercial Rent Agreement + Landlord NOC (if rented) or Property Title deed (if owned).",
        "<b>Business Registration:</b> GST Registration Certificate, Udyam MSME certificate, or Partnership Deed / MOA-AOA.",
        "<b>Premises Photographs:</b> Clear photos of shop exterior showing display name board in Gujarati/English.",
        "<b>Owner/Proprietor ID & Address:</b> Aadhaar Card and PAN card.",
        "<b>Fire Safety NOC:</b> Required for eating joints, hotels, chemical stores, factories, and commercial spaces >500 sq m."
      ],
      process: "Inspection conducted by Sanitary / Ward Inspector; digital trade licence certificate issued upon fee clearance."
    }
  };

  /* ================================================================
     2. OFFICE SCHEDULES & CONTACTS
  ================================================================ */
  const OFFICES_INFO = [
    {
      id: "col",
      name: "Collectorate, Rajkot",
      dept: "Revenue, District Administration, Jan Seva Kendra",
      timings: "Monday to Saturday: 9:30 AM – 6:10 PM (Lunch: 1:30 PM – 2:00 PM)",
      holidays: "Closed on 2nd & 4th Saturdays, Sundays, and Gazetted Public Holidays",
      address: "Shroff Road, Near Race Course Ring Road, Rajkot, Gujarat 360001",
      phone: "+91-281-2473900",
      services: "Income Certificate, Caste/EWS Certificate, 7/12 Land Records, Solvency, Permits"
    },
    {
      id: "rto",
      name: "RTO Office, Rajkot (GJ-03)",
      dept: "Regional Transport Office, Gujarat State",
      timings: "Monday to Friday: 10:00 AM – 5:00 PM; Saturday: 10:00 AM – 2:00 PM",
      holidays: "Closed on 2nd & 4th Saturdays, Sundays, and State Holidays",
      address: "Near Marketing Yard, Rajkot-Ahmedabad National Highway, Rajkot 360003",
      phone: "+91-281-2703666",
      services: "Learner's Licence, Driving Test, Driving Licence Renewal, Vehicle Registration (RC), RC Transfer"
    },
    {
      id: "pas",
      name: "Passport Seva Kendra (PSK), Rajkot",
      dept: "Regional Passport Office / Ministry of External Affairs",
      timings: "Monday to Friday: 9:00 AM – 4:30 PM (Biometric slot basis)",
      holidays: "Closed on Saturdays, Sundays, and Central Government Holidays",
      address: "Ground Floor, RMC West Zone Office Building, Near Bahumali Bhavan, Rajkot 360001",
      phone: "1800-258-1800 (National Toll-Free)",
      services: "Fresh Passport, Passport Renewal / Re-issue, Police Clearance Certificate (PCC), Tatkaal"
    },
    {
      id: "rmc",
      name: "RMC Civic Centre (Rajkot Municipal Corporation)",
      dept: "Municipal Administration & Citizen Services",
      timings: "Monday to Saturday: 9:30 AM – 6:00 PM (Cash counters close at 5:00 PM)",
      holidays: "Closed on 2nd & 4th Saturdays, Sundays, and Municipal Holidays",
      address: "Central Zone: Dhebarbhai Road; West Zone: Haripar; East Zone: Bhavnagar Road, Rajkot",
      phone: "+91-281-2224444",
      services: "Birth & Death Certificates, Property Tax Payment, Trade Licence, Water Supply Connections"
    }
  ];

  /* ================================================================
     3. LIVE STATE HELPERS (ENGINE CONNECTIVITY)
  ================================================================ */
  function getEngine() {
    return window.Engine || null;
  }

  function getActiveUserToken(explicitTokenNumber) {
    const eng = getEngine();
    if (!eng) return null;

    const state = eng.getState();
    const tokens = state ? state.tokens : [];

    // If explicit token number given (e.g. TW-0003 or 0003)
    if (explicitTokenNumber) {
      const clean = explicitTokenNumber.toUpperCase();
      const match = tokens.find(t => 
        t.tokenNumber.toUpperCase() === clean || 
        t.tokenNumber.toUpperCase().endsWith(clean)
      );
      if (match) return eng.getToken(match.id);
    }

    // Check user's stored tokens in S.mine or localStorage
    const myIds = (window.S && window.S.mine) ? window.S.mine : [];
    for (const id of myIds) {
      const t = eng.getToken(id);
      if (t && (t.status === "ISSUED" || t.status === "CALLED" || t.status === "RESERVED")) {
        return t;
      }
    }

    // Fallback: check most recent token owned by citizen
    if (myIds.length > 0) {
      return eng.getToken(myIds[0]);
    }

    // Or check any token marked active in session
    const active = tokens.find(t => t.status === "ISSUED" || t.status === "CALLED");
    return active ? eng.getToken(active.id) : null;
  }

  function getFastestOfficeAnalysis() {
    const eng = getEngine();
    if (!eng) return null;

    const offices = eng.getOffices();
    const queues = eng.getAllQueues();
    const userLoc = (window.S && window.S.me) ? window.S.me : [22.3039, 70.8022];
    const geo = window.GEO || { col:[22.2987,70.7870], rto:[22.2860,70.7780], pas:[22.3110,70.7950], rmc:[22.3020,70.7900] };

    const hav = (a, b) => {
      const r = x => x * Math.PI / 180;
      const dl = r(b[0] - a[0]), dn = r(b[1] - a[1]);
      const h = Math.sin(dl / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dn / 2) ** 2;
      return 12742 * Math.asin(Math.sqrt(h));
    };
    const etaKm = km => Math.max(3, Math.round(km * 1.35 / 24 * 60));

    const results = offices.map(o => {
      const g = geo[o.id] || geo['col'];
      const km = hav(userLoc, g);
      const travelMins = etaKm(km);

      // find active queue for office
      const officeQueues = queues.filter(q => q.service.officeId === o.id);
      let totalWaitMins = 0;
      let totalAhead = 0;
      let totalCounters = 0;

      officeQueues.forEach(q => {
        const last = q.queue[q.queue.length - 1];
        if (last && last.etaSeconds) {
          totalWaitMins = Math.max(totalWaitMins, Math.ceil(last.etaSeconds / 60));
        }
        totalAhead += q.queue.length;
        totalCounters += q.service.activeCounters || 1;
      });

      return {
        office: o,
        km: Number(km.toFixed(1)),
        travelMins,
        waitMins: totalWaitMins,
        totalMins: travelMins + totalWaitMins,
        activeAhead: totalAhead,
        counters: totalCounters
      };
    });

    results.sort((a, b) => a.totalMins - b.totalMins);
    return results;
  }

  /* ================================================================
     4. NATURAL LANGUAGE INTENT CLASSIFICATION
  ================================================================ */
  function normalize(str) {
    return (str || "").toLowerCase().replace(/['".,?!;:\-_/\\()]/g, " ").replace(/\s+/g, " ").trim();
  }

  function detectLanguage(q) {
    // Check Devanagari script (Hindi)
    if (/[\u0900-\u097F]/.test(q)) return 'hi';
    // Check Gujarati script
    if (/[\u0A80-\u0AFF]/.test(q)) return 'gu';

    const l = q.toLowerCase();
    // Hinglish keywords
    if (/\b(kya|kaise|chahiye|kab|kaha|kitna|batao|mera|meri|mujhe|nikalna|bheed|kaunsa|lagta|hain|hai|shukriya|dhanyawad)\b/.test(l)) {
      return 'hinglish';
    }
    // Gujlish keywords
    if (/\b(shu|joye|joiye|kyare|ketlo|ketli|kaho|maro|mari|mane|nikalvu|ochhi|vadhare|kyan|kyi|thashe|chhe|aabhar|kem|majama)\b/.test(l)) {
      return 'gujlish';
    }

    // Default to app's current language if set, else English
    const appLang = (window.S && window.S.lang) ? window.S.lang : 'en';
    if (appLang === 'hi') return 'hi';
    if (appLang === 'gu') return 'gu';
    return 'en';
  }

  function classifyIntent(q) {
    const n = normalize(q);

    // 1. Explicit Token Number Query (TW-0001, TW0002, 0004)
    const tokenMatch = q.match(/\b(TW-?\d{3,4}|\d{4})\b/i);
    if (tokenMatch) {
      return { intent: 'TOKEN_STATUS', tokenNumber: tokenMatch[1] };
    }

    // 2. My Token / Queue Status
    if (/\b(my token|token status|check token|my turn|waiting time|status of my|tokens ahead|where is my turn|mera token|status kya hai|maro token|maro number|mari vaari)\b/.test(n)) {
      return { intent: 'TOKEN_STATUS' };
    }

    // 3. Fastest Office / Comparison
    if (/\b(fastest|quickest|shortest|nearest|best office|which office is fastest|least wait|shortest queue|fastest for me|bheed kahan kam|jaldi kaun|kyi office jaldi|ochhi bheed)\b/.test(n)) {
      return { intent: 'FASTEST_OFFICE' };
    }

    // 4. When to Leave Home / Travel Guidance
    if (/\b(when should i leave|when to leave|leave home|departure|smart alert|alert schedule|get ready|leave now|kab nikalna|kab niklu|kyare nikalvu|gharethi kyare)\b/.test(n)) {
      return { intent: 'WHEN_TO_LEAVE' };
    }

    // 5. Driving Licence & RTO Documents
    if (/\b(learner|learners|learning|ll\b|ll test)\b/.test(n) && /\b(doc|document|chahiye|joiye|checklist|paper|form|requirement)\b/.test(n)) {
      return { intent: 'DOC_CHECKLIST', service: 'learner_licence' };
    }
    if (/\b(driving test|permanent dl|permanent licence|driving license test|license test|track test)\b/.test(n)) {
      return { intent: 'DOC_CHECKLIST', service: 'driving_test' };
    }
    if (/\b(renew|renewal|duplicate dl|address change|license renew)\b/.test(n) && /\b(licence|license|dl)\b/.test(n)) {
      return { intent: 'DOC_CHECKLIST', service: 'dl_renewal' };
    }
    if (/\b(driving licence|driving license|dl|licence|license|rto licence|rto license|laicence)\b/.test(n)) {
      return { intent: 'DOC_CHECKLIST', service: 'learner_licence' };
    }
    if (/\b(vehicle registration|new vehicle|rc book|new rc|vahan registration|gadi registration)\b/.test(n)) {
      return { intent: 'DOC_CHECKLIST', service: 'vehicle_registration' };
    }
    if (/\b(transfer|rc transfer|ownership transfer|second hand rc|gadi transfer|naam transfer)\b/.test(n)) {
      return { intent: 'DOC_CHECKLIST', service: 'rc_transfer' };
    }

    // 6. Passport Documents
    if (/\b(pcc|police clearance|police verification)\b/.test(n)) {
      return { intent: 'DOC_CHECKLIST', service: 'police_clearance' };
    }
    if (/\b(passport renewal|renew passport|reissue passport|re issue passport|passport renew)\b/.test(n)) {
      return { intent: 'DOC_CHECKLIST', service: 'passport_renewal' };
    }
    if (/\b(passport|fresh passport|new passport|tatkaal passport|psk)\b/.test(n)) {
      return { intent: 'DOC_CHECKLIST', service: 'fresh_passport' };
    }

    // 7. Revenue / Collectorate Documents
    if (/\b(income certificate|income|aavak|aavak no dakhlo|aay praman patra)\b/.test(n)) {
      return { intent: 'DOC_CHECKLIST', service: 'income_certificate' };
    }
    if (/\b(caste|caste certificate|jati|jaati|sc|st|obc|sebc|ews|non creamy|ncl)\b/.test(n)) {
      return { intent: 'DOC_CHECKLIST', service: 'caste_certificate' };
    }
    if (/\b(7 12|7\/12|8a|8 a|land record|ror|nakal|satbara|jamabandi|edhara|anyror)\b/.test(n)) {
      return { intent: 'DOC_CHECKLIST', service: 'land_records' };
    }

    // 8. Municipal / RMC Civic Centre Documents
    if (/\b(birth certificate|birth|janam|janam praman|janma)\b/.test(n)) {
      return { intent: 'DOC_CHECKLIST', service: 'birth_certificate' };
    }
    if (/\b(death certificate|death|maran|maran praman|mrityu)\b/.test(n)) {
      return { intent: 'DOC_CHECKLIST', service: 'death_certificate' };
    }
    if (/\b(property tax|house tax|makan vero|vero|tax payment|tenement)\b/.test(n)) {
      return { intent: 'DOC_CHECKLIST', service: 'property_tax' };
    }
    if (/\b(trade licence|trade license|gumasta|shop act|shop establishment|dukan licence)\b/.test(n)) {
      return { intent: 'DOC_CHECKLIST', service: 'trade_licence' };
    }

    // General Document Query
    if (/\b(document|documents|checklist|kagad|kagaj|dastavej|praman patra|proofs)\b/.test(n)) {
      return { intent: 'GENERAL_DOCS' };
    }

    // 9. Office Timings & Working Hours
    if (/\b(timing|timings|working hours|opening time|closing time|lunch time|holiday|open today|kya time hai|samay|chalu chhe)\b/.test(n)) {
      return { intent: 'OFFICE_TIMINGS' };
    }

    // 10. How QueueLess Works / Algorithm
    if (/\b(how it works|how (does|do) (the )?prediction work|prediction work|how is (the )?wait calculated|how does queueless work|eta calculation|eta formula|queue math|algorithm|learning factor|explain prediction|kaise kaam karta hai|math)\b/.test(n)) {
      return { intent: 'HOW_IT_WORKS' };
    }

    // 11. How to Book / Virtual Token Guide
    if (/\b(how to book|how to take token|book token|take virtual token|join queue|token kaise le|token levi)\b/.test(n)) {
      return { intent: 'HOW_TO_JOIN' };
    }

    // 12. Priority Tokens (Senior Citizen / PwD)
    if (/\b(senior citizen|elderly|disability|disabled|divyang|handicapped|priority|vruddh)\b/.test(n)) {
      return { intent: 'PRIORITY_QUEUE' };
    }

    // 13. Cancellation & Recall / No Show Policy
    if (/\b(cancel|cancellation|missed turn|late|no show|recall|radd)\b/.test(n)) {
      return { intent: 'CANCEL_RECALL' };
    }

    // 14. Notifications / Reminders (SMS & WhatsApp)
    if (/\b(whatsapp|sms|reminder|notification|alert|message)\b/.test(n)) {
      return { intent: 'REMINDERS_INFO' };
    }

    // 15. Greetings
    if (/^(hi|hello|hey|namaste|namaskar|pranam|kem cho|khem cho|good morning|good afternoon|good evening)\b/.test(n)) {
      return { intent: 'GREETING' };
    }

    // 16. Gratitude
    if (/\b(thank you|thanks|dhanyawad|dhanyavad|shukriya|aabhar|khoob aabhar)\b/.test(n)) {
      return { intent: 'GRATITUDE' };
    }

    // 17. Help / Capabilities
    if (/\b(help|what can you do|features|menu|commands|options|madad)\b/.test(n)) {
      return { intent: 'HELP' };
    }

    // Default Fallback
    return { intent: 'GENERAL_ASSISTANCE' };
  }

  /* ================================================================
     5. RESPONSE GENERATOR (RICH FORMATTING & ZERO DEFAULT)
  ================================================================ */
  function formatResponse(intentObj, userRaw, lang) {
    const isHi = lang === 'hi' || lang === 'hinglish';
    const isGu = lang === 'gu' || lang === 'gujlish';

    switch (intentObj.intent) {
      // -------------------------------------------------------------
      // DOCUMENT CHECKLIST RESPONSE
      // -------------------------------------------------------------
      case 'DOC_CHECKLIST': {
        const item = DOCS[intentObj.service];
        if (!item) return formatGeneralDocsResponse(lang);

        let out = `<b>📋 ${item.title}</b><br>`;
        out += `<span style="font-size:0.8rem;color:var(--mut);">🏢 <b>Office:</b> ${item.office} · ${item.dept}</span><br>`;
        if (item.onlinePortal) {
          out += `<span style="font-size:0.8rem;color:var(--pri);">🌐 <b>Official Portal:</b> ${item.onlinePortal}</span><br>`;
        }
        out += `<div style="margin:8px 0 4px 0;font-weight:600;">Required Documents:</div>`;
        out += `<ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:5px;">`;
        item.items.forEach(doc => {
          out += `<li style="font-size:0.86rem;line-height:1.4;">${doc}</li>`;
        });
        out += `</ul>`;

        if (item.process) {
          out += `<div style="margin-top:8px;padding:6px 10px;background:var(--bg);border-radius:6px;border:1px solid var(--bd);font-size:0.82rem;"><b>💡 Process Summary:</b> ${item.process}</div>`;
        }

        out += `<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;">`;
        out += `<button class="btn s" onclick="QueueLessBot.action('join')">🎫 Book Token for ${item.office.split(',')[0]}</button>`;
        out += `<button class="btn s g" onclick="QueueLessBot.ask('What are the working hours of ${item.office.split(',')[0]}?')">🕒 Office Timings</button>`;
        out += `</div>`;
        return out;
      }

      // -------------------------------------------------------------
      // GENERAL DOCUMENTS MENU
      // -------------------------------------------------------------
      case 'GENERAL_DOCS': {
        return formatGeneralDocsResponse(lang);
      }

      // -------------------------------------------------------------
      // LIVE TOKEN STATUS RESPONSE
      // -------------------------------------------------------------
      case 'TOKEN_STATUS': {
        const t = getActiveUserToken(intentObj.tokenNumber);
        if (!t) {
          if (isHi) {
            return `<b>🔍 टोकन स्थिति (Token Status)</b><br>
वर्तमान में आपका कोई सक्रिय टोकन नहीं मिला है।<br><br>
यदि आपने पहले टोकन लिया है, तो कृपया अपना टोकन नंबर लिखें (उदा. <b>TW-0004</b>), या नीचे दिए गए बटन पर क्लिक करके तुरंत नया टोकन प्राप्त करें।
<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;">
  <button class="btn s" onclick="QueueLessBot.action('join')">🎫 नया टोकन लें (Join Queue)</button>
  <button class="btn s g" onclick="QueueLessBot.ask('Which office is fastest for me?')">⚡ सबसे तेज़ कार्यालय देखें</button>
</div>`;
          }
          if (isGu) {
            return `<b>🔍 ટોકન સ્થિતિ (Token Status)</b><br>
હાલમાં તમારો કોઈ સક્રિય ટોકન મળ્યો નથી.<br><br>
જો તમારી પાસે ટોકન નંબર હોય, તો તે લખો (દા.ત. <b>TW-0004</b>), અથવા નીચે આપેલા બટન પર ક્લિક કરીને નવો વર્ચ્યુઅલ ટોકન લો.
<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;">
  <button class="btn s" onclick="QueueLessBot.action('join')">🎫 નવો ટોકન મેળવો (Join Queue)</button>
  <button class="btn s g" onclick="QueueLessBot.ask('Which office is fastest for me?')">⚡ સૌથી ઝડપી કચેરી જુઓ</button>
</div>`;
          }

          return `<b>🔍 Token Status</b><br>
No active token found in your current session.<br><br>
If you booked a token earlier, please type your token number (e.g., <b>TW-0004</b>), or book a new virtual token right now without physical waiting!
<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;">
  <button class="btn s" onclick="QueueLessBot.action('join')">🎫 Book Virtual Token</button>
  <button class="btn s g" onclick="QueueLessBot.ask('Which office is fastest for me?')">⚡ Check Fastest Office</button>
</div>`;
        }

        // Active token found!
        const waitMins = t.etaSeconds ? Math.ceil(t.etaSeconds / 60) : 0;
        const ahead = t.tokensAhead != null ? t.tokensAhead : 0;
        const trMins = t.travel || (window.$ ? +($('#tr') ? $('#tr').value : 15) : 15);

        let statusBadge = '';
        let adviceBox = '';

        if (t.status === 'CALLED') {
          statusBadge = '<span class="pill" style="background:var(--ok);color:#fff;font-weight:700;">🟢 CALLED — YOUR TURN!</span>';
          adviceBox = `<div style="margin-top:8px;padding:8px;background:rgba(19,136,8,0.1);border-left:4px solid var(--ok);border-radius:4px;font-size:0.85rem;">
            <b>📢 PROCEED TO COUNTER IMMEDIATELY!</b><br>
            Your token has been called. Please walk to the service counter with all original documents.
          </div>`;
        } else if (t.status === 'ISSUED') {
          if (waitMins <= trMins + 8) {
            statusBadge = '<span class="pill" style="background:var(--bad);color:#fff;font-weight:700;">🔴 LEAVE NOW!</span>';
            adviceBox = `<div style="margin-top:8px;padding:8px;background:rgba(179,38,30,0.1);border-left:4px solid var(--bad);border-radius:4px;font-size:0.85rem;">
              <b>🚗 TIME TO DEPART!</b><br>
              Estimated wait is <b>~${waitMins} min</b> and your travel time is <b>${trMins} min</b>. Start heading to the office now to arrive comfortably before your turn.
            </div>`;
          } else if (waitMins <= trMins + 25) {
            statusBadge = '<span class="pill" style="background:var(--warn);color:#000;font-weight:700;">🟡 GET READY!</span>';
            adviceBox = `<div style="margin-top:8px;padding:8px;background:rgba(230,129,0,0.1);border-left:4px solid var(--warn);border-radius:4px;font-size:0.85rem;">
              <b>🎒 GET READY AT HOME!</b><br>
              Wait is ~${waitMins} min. Pack your Aadhaar, original documents, and copies. You should depart in approximately <b>~${Math.max(1, waitMins - trMins - 5)} min</b>.
            </div>`;
          } else {
            statusBadge = '<span class="pill" style="background:var(--pri);color:#fff;font-weight:700;">🔵 RELAX AT HOME</span>';
            adviceBox = `<div style="margin-top:8px;padding:8px;background:rgba(21,50,91,0.08);border-left:4px solid var(--pri);border-radius:4px;font-size:0.85rem;">
              <b>🏠 RELAX AT HOME!</b><br>
              You have ${ahead} citizens ahead of you (~${waitMins} min). There is plenty of time. We will send you an automated WhatsApp/SMS alert when you need to start traveling!
            </div>`;
          }
        } else if (t.status === 'DONE') {
          statusBadge = '<span class="pill" style="background:var(--ok);color:#fff;">✅ COMPLETED</span>';
          adviceBox = `<div style="margin-top:8px;padding:8px;background:rgba(19,136,8,0.1);font-size:0.85rem;">Your service has been successfully completed. Thank you for using QueueLess!</div>`;
        } else if (t.status === 'NO_SHOW') {
          statusBadge = '<span class="pill" style="background:var(--bad);color:#fff;">⚠️ NO-SHOW</span>';
          adviceBox = `<div style="margin-top:8px;padding:8px;background:rgba(179,38,30,0.1);font-size:0.85rem;">You were marked as No-Show. Under QueueLess demo rules, counter staff can <b>recall your token once</b> within the 10-minute grace window if counters are free.</div>`;
        }

        let out = `<b>🎫 Live Token Status: <span style="color:var(--pri);">${t.tokenNumber}</span></b><br>`;
        out += `<div style="margin:4px 0 8px 0;">${statusBadge}</div>`;
        out += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.84rem;background:var(--bg);padding:8px;border-radius:8px;border:1px solid var(--bd);">`;
        out += `<div><b>Citizen:</b> ${t.name || 'Citizen'}</div>`;
        out += `<div><b>Service:</b> ${t.serviceName || 'Service'}</div>`;
        out += `<div><b>Tokens Ahead:</b> <span style="font-weight:700;color:var(--pri);">${ahead}</span></div>`;
        out += `<div><b>Est. Wait:</b> <span style="font-weight:700;color:var(--pri);">~${waitMins} min</span></div>`;
        out += `<div><b>Travel Time:</b> ~${trMins} min</div>`;
        out += `<div><b>Notifications:</b> ${t.notifyWhatsApp ? 'WhatsApp ✅' : ''} ${t.notifySms ? 'SMS ✅' : ''}</div>`;
        out += `</div>`;
        out += adviceBox;

        out += `<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;">`;
        out += `<button class="btn s g" onclick="QueueLessBot.ask('When should I leave home?')">🕒 Departure Countdown</button>`;
        out += `<button class="btn s g" onclick="QueueLessBot.ask('Which documents do I need for ${t.serviceName}?')">📋 Required Docs</button>`;
        out += `</div>`;
        return out;
      }

      // -------------------------------------------------------------
      // FASTEST OFFICE ANALYSIS RESPONSE
      // -------------------------------------------------------------
      case 'FASTEST_OFFICE': {
        const rankings = getFastestOfficeAnalysis();
        if (!rankings || !rankings.length) {
          return `Unable to calculate live office wait times right now. Please check the Live Map tab!`;
        }

        const top = rankings[0];

        let out = `<b>⚡ Fastest Government Office For You Right Now</b><br>`;
        out += `<div style="margin:6px 0 10px 0;padding:8px 12px;background:rgba(19,136,8,0.1);border-left:4px solid var(--ok);border-radius:6px;font-size:0.88rem;">`;
        out += `🏆 <b>Recommendation:</b> <span style="color:var(--pri);font-weight:700;">${top.office.name}</span> is your fastest choice!<br>`;
        out += `<span style="font-size:0.82rem;color:var(--mut);">🚗 Travel: <b>${top.travelMins} min</b> (${top.km} km) + ⏳ Queue Wait: <b>${top.waitMins} min</b> = <b>Total: ${top.totalMins} min</b></span>`;
        out += `</div>`;

        out += `<div style="font-size:0.82rem;font-weight:600;margin-bottom:4px;">Live Comparison Across All Offices:</div>`;
        out += `<div style="display:flex;flex-direction:column;gap:5px;">`;

        rankings.forEach((r, idx) => {
          const isWinner = idx === 0;
          const statusCol = r.waitMins < 12 ? 'var(--ok)' : (r.waitMins < 30 ? 'var(--warn)' : 'var(--bad)');
          out += `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;border-radius:6px;border:1px solid var(--bd);background:${isWinner ? 'var(--card)' : 'var(--bg)'};font-size:0.82rem;">`;
          out += `<div><b>#${idx + 1} ${r.office.name.split(',')[0]}</b><br><span style="color:var(--mut);font-size:0.75rem;">${r.km} km · ${r.activeAhead} waiting</span></div>`;
          out += `<div style="text-align:right;">`;
          out += `<span style="font-weight:700;color:${statusCol};">${r.totalMins} min total</span><br>`;
          out += `<span style="font-size:0.75rem;color:var(--mut);">(${r.travelMins}m travel + ${r.waitMins}m wait)</span>`;
          out += `</div>`;
          out += `</div>`;
        });
        out += `</div>`;

        out += `<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;">`;
        out += `<button class="btn s" onclick="window.pickOff ? window.pickOff('${top.office.id}') : QueueLessBot.action('join'); QueueLessBot.action('join');">Select ${top.office.name.split(',')[0]}</button>`;
        out += `<button class="btn s g" onclick="QueueLessBot.action('map')">🗺️ Open Schematic Map</button>`;
        out += `</div>`;
        return out;
      }

      // -------------------------------------------------------------
      // WHEN TO LEAVE HOME RESPONSE
      // -------------------------------------------------------------
      case 'WHEN_TO_LEAVE': {
        const t = getActiveUserToken();
        const trMins = t && t.travel ? t.travel : (window.$ && $('#tr') ? +$('#tr').value : 15);

        let out = `<b>🚦 Smart Departure Schedule & When to Leave Home</b><br>`;
        out += `<p style="font-size:0.85rem;margin:6px 0 8px 0;line-height:1.4;">QueueLess uses an explainable 3-tier departure model based on your travel time (currently <b>${trMins} min</b>):</p>`;

        out += `<div style="display:flex;flex-direction:column;gap:6px;font-size:0.84rem;">`;
        out += `<div style="padding:6px 8px;border-left:4px solid #2563eb;background:var(--bg);border-radius:4px;">`;
        out += `<b>🏠 1. Relax at Home:</b> While queue wait > travel time + 25 min. Relax and carry on with your routine.`;
        out += `</div>`;
        out += `<div style="padding:6px 8px;border-left:4px solid var(--warn);background:rgba(230,129,0,0.08);border-radius:4px;">`;
        out += `<b>🎒 2. Get Ready Alert:</b> Triggered when remaining wait is <b>≤ travel time + 25 min</b>. Gather all required documents, photocopies, and fee receipts.`;
        out += `</div>`;
        out += `<div style="padding:6px 8px;border-left:4px solid var(--bad);background:rgba(179,38,30,0.08);border-radius:4px;">`;
        out += `<b>🚗 3. Leave Now Alert:</b> Triggered when remaining wait is <b>≤ travel time + 8 min</b>. Depart immediately to reach the office right before your token is called!`;
        out += `</div>`;
        out += `<div style="padding:6px 8px;border-left:4px solid var(--ok);background:rgba(19,136,8,0.08);border-radius:4px;">`;
        out += `<b>🟢 4. Proceed to Counter:</b> Sent the moment your token is called by the officer.`;
        out += `</div>`;
        out += `</div>`;

        if (t && t.status === 'ISSUED') {
          const waitMins = t.etaSeconds ? Math.ceil(t.etaSeconds / 60) : 0;
          const leaveIn = Math.max(0, waitMins - trMins - 8);
          out += `<div style="margin-top:10px;padding:8px;background:var(--card);border:1px solid var(--bd);border-radius:6px;font-size:0.85rem;">`;
          out += `<b>📍 For your active token (${t.tokenNumber}):</b><br>`;
          out += `Remaining wait: <b>${waitMins} min</b> | Travel: <b>${trMins} min</b><br>`;
          if (leaveIn === 0) {
            out += `<span style="color:var(--bad);font-weight:700;">🚨 YOU SHOULD LEAVE NOW!</span>`;
          } else {
            out += `👉 Plan to step out of home in approximately <b>~${leaveIn} minutes</b>.`;
          }
          out += `</div>`;
        }

        out += `<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;">`;
        out += `<button class="btn s g" onclick="QueueLessBot.ask('Check my token status')">📈 Check Live Token</button>`;
        out += `<button class="btn s g" onclick="QueueLessBot.ask('Which documents do I need for a driving licence?')">📋 Document Checklist</button>`;
        out += `</div>`;
        return out;
      }

      // -------------------------------------------------------------
      // HOW QUEUELESS WORKS & QUEUE MATH
      // -------------------------------------------------------------
      case 'HOW_IT_WORKS': {
        let out = `<b>🧠 How QueueLess Prediction Works (Explainable Queue Math)</b><br>`;
        out += `<p style="font-size:0.85rem;margin:6px 0 8px 0;line-height:1.4;">QueueLess explicitly avoids black-box AI guessing. Instead, it relies on transparent, verifiable queuing mathematics:</p>`;

        out += `<div style="padding:8px 10px;background:var(--bg);border-radius:6px;border:1px solid var(--bd);font-family:monospace;font-size:0.85rem;margin-bottom:8px;">`;
        out += `<b>ETA (seconds) = ceil( (Tokens Ahead / Active Counters) × Avg Service Seconds )</b>`;
        out += `</div>`;

        out += `<ul style="margin:0;padding-left:18px;font-size:0.84rem;display:flex;flex-direction:column;gap:5px;">`;
        out += `<li><b>Simulated Counters:</b> When multiple counters are active, queue load distributes automatically across all open counters.</li>`;
        out += `<li><b>Live Learning Factor:</b> Uses an exponential moving average (EMA) comparing actual vs expected service times, auto-adjusting if counter officers are moving faster or slower today.</li>`;
        out += `<li><b>Priority Jump:</b> Senior citizens and persons with disabilities are placed ahead of general tokens without disrupting already-called citizens.</li>`;
        out += `<li><b>Demo Reminder Thresholds:</b> For quick hackathon judging, reminder A sends at <b>≤ 60 seconds</b> and reminder B sends at <b>≤ 30 seconds</b> via WhatsApp/SMS.</li>`;
        out += `</ul>`;

        out += `<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;">`;
        out += `<button class="btn s" onclick="QueueLessBot.action('how')">ℹ️ Read System Documentation</button>`;
        out += `<button class="btn s g" onclick="QueueLessBot.ask('Which office is fastest for me?')">⚡ Compare Live Offices</button>`;
        out += `</div>`;
        return out;
      }

      // -------------------------------------------------------------
      // OFFICE TIMINGS & WORKING HOURS
      // -------------------------------------------------------------
      case 'OFFICE_TIMINGS': {
        let out = `<b>🕒 Government Office Timings & Working Hours (Rajkot)</b><br><br>`;
        out += `<div style="display:flex;flex-direction:column;gap:8px;">`;

        OFFICES_INFO.forEach(o => {
          out += `<div style="padding:8px;border:1px solid var(--bd);border-radius:8px;background:var(--bg);font-size:0.83rem;">`;
          out += `<div style="font-weight:700;color:var(--pri);font-size:0.9rem;">🏢 ${o.name}</div>`;
          out += `<div>🕒 <b>Timings:</b> ${o.timings}</div>`;
          out += `<div style="color:var(--bad);">📅 <b>Holidays:</b> ${o.holidays}</div>`;
          out += `<div style="color:var(--mut);font-size:0.78rem;">📍 ${o.address}</div>`;
          out += `</div>`;
        });
        out += `</div>`;

        out += `<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;">`;
        out += `<button class="btn s" onclick="QueueLessBot.action('join')">🎫 Book Virtual Token</button>`;
        out += `<button class="btn s g" onclick="QueueLessBot.action('map')">🗺️ View Map & Coordinates</button>`;
        out += `</div>`;
        return out;
      }

      // -------------------------------------------------------------
      // HOW TO JOIN / BOOK VIRTUAL TOKEN
      // -------------------------------------------------------------
      case 'HOW_TO_JOIN': {
        let out = `<b>🎫 How to Take a Virtual Token Remotely</b><br>`;
        out += `<p style="font-size:0.85rem;margin:6px 0 8px 0;">Follow these 4 simple steps to skip physical lines:</p>`;
        out += `<ol style="margin:0;padding-left:18px;font-size:0.84rem;display:flex;flex-direction:column;gap:5px;">`;
        out += `<li><b>Select Office:</b> Choose Collectorate, RTO, Passport Seva Kendra, or RMC Civic Centre.</li>`;
        out += `<li><b>Choose Service:</b> Pick the exact service (e.g., Learner Licence, Passport Renewal, Caste Certificate).</li>`;
        out += `<li><b>Enter Phone & Travel Time:</b> Put your mobile number and how many minutes it takes to drive to the office.</li>`;
        out += `<li><b>Enable Notifications:</b> Check WhatsApp and/or SMS and provide consent.</li>`;
        out += `<li><b>Submit Remotely:</b> Click <i>'Take Token Remotely'</i> to receive your live virtual token (e.g. TW-0004).</li>`;
        out += `</ol>`;

        out += `<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;">`;
        out += `<button class="btn s" onclick="QueueLessBot.action('join')">🎫 Join Queue Now</button>`;
        out += `<button class="btn s g" onclick="QueueLessBot.ask('Which documents do I need for a driving licence?')">📋 Check Documents First</button>`;
        out += `</div>`;
        return out;
      }

      // -------------------------------------------------------------
      // PRIORITY QUEUE (SENIOR CITIZEN & PwD)
      // -------------------------------------------------------------
      case 'PRIORITY_QUEUE': {
        let out = `<b>♿ Senior Citizen & Divyangjan (PwD) Priority Policy</b><br>`;
        out += `<p style="font-size:0.85rem;margin:6px 0 8px 0;line-height:1.4;">QueueLess provides dignified, accessible service for elderly citizens and persons with disabilities:</p>`;
        out += `<ul style="margin:0;padding-left:18px;font-size:0.84rem;display:flex;flex-direction:column;gap:5px;">`;
        out += `<li><b>Who qualifies?</b> Senior citizens aged 60 and above, and Persons with Disabilities (Divyangjan).</li>`;
        out += `<li><b>Priority Token Placement:</b> When checking the <i>'Senior citizen / Person with disability'</i> checkbox, your token jumps in front of all general tokens currently waiting.</li>`;
        out += `<li><b>Counter Allocation:</b> Automatically assigned to wheelchair-accessible ground floor counters.</li>`;
        out += `<li><b>Fairness Guarantee:</b> Citizens currently being served at the counter are never interrupted.</li>`;
        out += `</ul>`;

        out += `<div style="margin-top:10px;">`;
        out += `<button class="btn s" onclick="QueueLessBot.action('join'); if($('#pri')) $('#pri').checked=true;">🎫 Book Priority Token</button>`;
        out += `</div>`;
        return out;
      }

      // -------------------------------------------------------------
      // CANCELLATION & RECALL / NO-SHOW
      // -------------------------------------------------------------
      case 'CANCEL_RECALL': {
        let out = `<b>🔄 Token Cancellation & Missed Turn (Recall) Rules</b><br>`;
        out += `<ul style="margin:6px 0 8px 0;padding-left:18px;font-size:0.84rem;display:flex;flex-direction:column;gap:6px;">`;
        out += `<li><b>Can I cancel my token?</b> Yes! Open <i>'My Tokens'</i> and click <b>Cancel</b>. This immediately frees up the slot and shortens waiting times for other citizens.</li>`;
        out += `<li><b>What happens if I am late?</b> When your token is called, you have a <b>10-minute grace window</b> to arrive at the counter.</li>`;
        out += `<li><b>No-Show Policy:</b> If you do not arrive within the window, your token is marked as <b>NO_SHOW</b> so the queue keeps moving.</li>`;
        out += `<li><b>Single Recall Grace:</b> Counter officers can <b>recall your token once</b> if you arrive shortly afterward and counters have capacity.</li>`;
        out += `</ul>`;

        out += `<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;">`;
        out += `<button class="btn s g" onclick="QueueLessBot.ask('Check my token status')">📈 Check My Token</button>`;
        out += `<button class="btn s g" onclick="QueueLessBot.ask('When should I leave home?')">🚗 Departure Countdown</button>`;
        out += `</div>`;
        return out;
      }

      // -------------------------------------------------------------
      // NOTIFICATIONS / REMINDERS
      // -------------------------------------------------------------
      case 'REMINDERS_INFO': {
        let out = `<b>🔔 WhatsApp & SMS Reminders</b><br>`;
        out += `<p style="font-size:0.85rem;margin:6px 0 8px 0;line-height:1.4;">QueueLess keeps you informed every step of the way without requiring you to stare at a screen:</p>`;
        out += `<ul style="margin:0;padding-left:18px;font-size:0.84rem;display:flex;flex-direction:column;gap:5px;">`;
        out += `<li><b>WhatsApp Alerts:</b> Sent via official Twilio sandbox service directly to your WhatsApp app.</li>`;
        out += `<li><b>SMS Backup:</b> Dispatched to registered mobile phones for non-smartphone users.</li>`;
        out += `<li><b>Demo Thresholds:</b> In this hackathon demo, reminders trigger at <b>≤ 60 seconds</b> (Get Ready) and <b>≤ 30 seconds</b> (Leave Now/Proceed) for instant evaluation.</li>`;
        out += `<li><b>Privacy & Consent:</b> Reminders are only dispatched if you check the explicit consent checkbox during token booking.</li>`;
        out += `</ul>`;

        out += `<div style="margin-top:10px;">`;
        out += `<button class="btn s" onclick="QueueLessBot.action('join')">🎫 Book Token with Alerts</button>`;
        out += `</div>`;
        return out;
      }

      // -------------------------------------------------------------
      // GREETING
      // -------------------------------------------------------------
      case 'GREETING': {
        if (isHi) {
          return `🙏 <b>नमस्ते! QueueLess सहायक में आपका स्वागत है।</b><br>
मैं आपकी सरकारी सेवाओं, दस्तावेज़ चेकलिस्ट, प्रतीक्षा समय और टोकन ट्रैकिंग में मदद कर सकता हूँ।<br><br>
आप क्या जानना चाहते हैं?
<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;">
  <button class="btn s g" onclick="QueueLessBot.ask('ड्राइविंग लाइसेंस के लिए कौन से दस्तावेज चाहिए?')">🚗 ड्राइविंग लाइसेंस दस्तावेज़</button>
  <button class="btn s g" onclick="QueueLessBot.ask('सबसे तेज़ कार्यालय कौन सा है?')">⚡ सबसे तेज़ कार्यालय</button>
  <button class="btn s g" onclick="QueueLessBot.ask('मुझे घर से कब निकलना चाहिए?')">🕒 घर से कब निकलें</button>
</div>`;
        }
        if (isGu) {
          return `🙏 <b>નમસ્તે! QueueLess સહાયકમાં આપનું સ્વાગત છે.</b><br>
હું સરકારી સેવાઓ, જરૂરી દસ્તાવેજો, લાઇવ પ્રતીક્ષા સમય અને વર્ચ્યુઅલ ટોકન માટે આપને મદદ કરી શકું છું.<br><br>
આપ શું જાણવા માંગો છો?
<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;">
  <button class="btn s g" onclick="QueueLessBot.ask('ડ્રાઇવિંગ લાયસન્સ માટે કયા દસ્તાવેજો જોઈએ?')">🚗 લાયસન્સ દસ્તાવેજો</button>
  <button class="btn s g" onclick="QueueLessBot.ask('સૌથી ઝડપી કચેરી કઈ છે?')">⚡ સૌથી ઝડપી કચેરી</button>
  <button class="btn s g" onclick="QueueLessBot.ask('મારે ઘરેથી ક્યારે નીકળવું જોઈએ?')">🕒 ક્યારે નીકળવું</button>
</div>`;
        }

        return `🙏 <b>Namaste! Welcome to QueueLess Assistant.</b><br>
I am here to guide you with accurate document checklists, live waiting times, fastest office recommendations, and token tracking.<br><br>
How can I assist you today?
<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;">
  <button class="btn s g" onclick="QueueLessBot.ask('Which documents do I need for a driving licence?')">🚗 Driving Licence Docs</button>
  <button class="btn s g" onclick="QueueLessBot.ask('Which office is fastest for me?')">⚡ Fastest Office</button>
  <button class="btn s g" onclick="QueueLessBot.ask('When should I leave home?')">🕒 When to Leave</button>
  <button class="btn s g" onclick="QueueLessBot.ask('Check my token status')">📈 Token Status</button>
</div>`;
      }

      // -------------------------------------------------------------
      // GRATITUDE
      // -------------------------------------------------------------
      case 'GRATITUDE': {
        if (isHi) {
          return `🙏 <b>आपका बहुत-बहुत धन्यवाद!</b><br>यदि आपको किसी अन्य सेवा या टोकन के बारे में सहायता चाहिए, तो कभी भी पूछें। आपका दिन शुभ हो!`;
        }
        if (isGu) {
          return `🙏 <b>આપનો ખૂબ ખૂબ આભાર!</b><br>જો અન્ય કોઈ સરકારી સેવા અથવા ટોકન વિશે સહાય જોઈએ, તો મને જણાવો. આપનો દિવસ શુભ રહે!`;
        }
        return `🙏 <b>You're very welcome!</b><br>Feel free to ask whenever you need help with documents, wait times, or token updates. Have a wonderful day!`;
      }

      // -------------------------------------------------------------
      // HELP / FEATURE DIRECTORY
      // -------------------------------------------------------------
      case 'HELP':
      case 'GENERAL_ASSISTANCE':
      default: {
        return formatGeneralHelp(userRaw, lang);
      }
    }
  }

  function formatGeneralDocsResponse(lang) {
    let out = `<b>📚 Government Service Document Guides</b><br>`;
    out += `<p style="font-size:0.85rem;margin:6px 0 8px 0;">Select any service to view its complete official document checklist:</p>`;
    out += `<div style="display:grid;grid-template-columns:1fr;gap:6px;font-size:0.83rem;">`;
    out += `<button class="btn s g" style="text-align:left;justify-content:flex-start;" onclick="QueueLessBot.ask('Which documents do I need for a driving licence?')">🚗 <b>Driving Licence:</b> Learner's, Permanent DL & Test</button>`;
    out += `<button class="btn s g" style="text-align:left;justify-content:flex-start;" onclick="QueueLessBot.ask('What documents are needed for vehicle registration?')">🚙 <b>Vehicle Registration:</b> New RC & Ownership Transfer</button>`;
    out += `<button class="btn s g" style="text-align:left;justify-content:flex-start;" onclick="QueueLessBot.ask('What documents are required for fresh passport?')">🛂 <b>Passport Seva:</b> Fresh Adult/Minor & Renewal</button>`;
    out += `<button class="btn s g" style="text-align:left;justify-content:flex-start;" onclick="QueueLessBot.ask('Documents for income and caste certificate')">📜 <b>Collectorate:</b> Income, Caste & 7/12 Land Records</button>`;
    out += `<button class="btn s g" style="text-align:left;justify-content:flex-start;" onclick="QueueLessBot.ask('Documents for birth and death certificate')">🏛️ <b>Civic Centre:</b> Birth, Death, Tax & Trade Licence</button>`;
    out += `</div>`;
    return out;
  }

  function formatGeneralHelp(q, lang) {
    const isHi = lang === 'hi' || lang === 'hinglish';
    const isGu = lang === 'gu' || lang === 'gujlish';

    let out = `<b>🤖 QueueLess Assistant Help & Capabilities</b><br>`;
    out += `<p style="font-size:0.85rem;margin:6px 0 8px 0;line-height:1.4;">I can answer questions regarding any of the following topics with accurate, zero-default answers:</p>`;

    out += `<div style="display:flex;flex-direction:column;gap:5px;font-size:0.83rem;">`;
    out += `<div>📋 <b>Document Checklists:</b> Driving Licence, Passport, RC, Income/Caste Certificates, 7/12, Birth/Death.</div>`;
    out += `<div>📈 <b>Live Token Status:</b> Check tokens ahead and exact waiting minutes.</div>`;
    out += `<div>⚡ <b>Fastest Office:</b> Live travel time + queue wait comparison.</div>`;
    out += `<div>🕒 <b>Smart Alerts:</b> Exact time to gather documents and leave home.</div>`;
    out += `<div>🏢 <b>Office Info:</b> Timings, locations, and lunch hours.</div>`;
    out += `<div>🧠 <b>Queue Math:</b> Explainable formula and priority rules.</div>`;
    out += `</div>`;

    out += `<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;">`;
    out += `<button class="btn s g" onclick="QueueLessBot.ask('Which documents do I need for a driving licence?')">🚗 Driving Licence</button>`;
    out += `<button class="btn s g" onclick="QueueLessBot.ask('Which office is fastest for me?')">⚡ Fastest Office</button>`;
    out += `<button class="btn s g" onclick="QueueLessBot.ask('When should I leave home?')">🕒 When to Leave</button>`;
    out += `<button class="btn s" onclick="QueueLessBot.action('join')">🎫 Join Queue</button>`;
    out += `</div>`;
    return out;
  }

  /* ================================================================
     6. CHATBOT UI MANAGEMENT
  ================================================================ */
  function addMessage(sender, content, isHtml = true) {
    const msgs = document.getElementById('msgs');
    if (!msgs) return null;

    const div = document.createElement('div');
    div.className = 'm ' + sender;

    if (isHtml && sender === 'b') {
      div.innerHTML = content;
    } else {
      div.textContent = content;
    }

    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  async function askQuestion(raw) {
    const input = document.getElementById('ci');
    let q = (raw || (input ? input.value : '')).trim();
    if (!q) return;

    if (input) input.value = '';

    // Render User message safely
    addMessage('u', q, false);

    // Typing / Thinking indicator
    const thinking = addMessage('b', '<span style="color:var(--mut);">Thinking…</span>', true);
    HIST.push({ role: 'user', content: q });

    // Detect language and intent
    const lang = detectLanguage(q);
    const intentObj = classifyIntent(q);

    // Simulate natural sub-second response
    setTimeout(() => {
      const responseHtml = formatResponse(intentObj, q, lang);
      thinking.innerHTML = responseHtml;
      HIST.push({ role: 'assistant', content: responseHtml });
      
      const msgs = document.getElementById('msgs');
      if (msgs) msgs.scrollTop = msgs.scrollHeight;
      updateChips(intentObj.intent);
    }, 280);
  }

  function updateChips(currentIntent) {
    const chipsDiv = document.getElementById('chips');
    if (!chipsDiv) return;

    let chipItems = [];
    if (currentIntent === 'DOC_CHECKLIST') {
      chipItems = [
        ['When should I leave home?', '🕒 When to Leave'],
        ['Which office is fastest for me?', '⚡ Fastest Office'],
        ['Check my token status', '📈 My Token'],
        ['Office timings', '🏢 Timings']
      ];
    } else if (currentIntent === 'TOKEN_STATUS' || currentIntent === 'WHEN_TO_LEAVE') {
      chipItems = [
        ['Which documents do I need for a driving licence?', '🚗 Driving Licence'],
        ['Which documents do I need for fresh passport?', '🛂 Passport'],
        ['Which office is fastest for me?', '⚡ Fastest Office']
      ];
    } else {
      chipItems = [
        ['Which documents do I need for a driving licence?', '🚗 Driving Licence'],
        ['When should I leave home?', '🕒 When to Leave'],
        ['Which office is fastest for me?', '⚡ Fastest Office'],
        ['Check my token status', '📈 My Token']
      ];
    }

    chipsDiv.innerHTML = chipItems.map(([prompt, label]) => 
      `<button class="btn s g" onclick="QueueLessBot.ask('${prompt.replace(/'/g, "\\'")}')">${label}</button>`
    ).join('');
  }

  function triggerAction(actionName) {
    if (actionName === 'join') {
      if (typeof window.show === 'function') window.show('home');
      const ofSelect = document.getElementById('of');
      if (ofSelect) {
        ofSelect.focus();
        ofSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else if (actionName === 'map') {
      if (typeof window.show === 'function') window.show('join');
      if (typeof window.drawMap === 'function') window.drawMap();
    } else if (actionName === 'admin') {
      if (typeof window.show === 'function') window.show('adm');
    } else if (actionName === 'how') {
      if (typeof window.show === 'function') window.show('how');
    }
  }

  function resetChat() {
    const msgs = document.getElementById('msgs');
    if (!msgs) return;
    msgs.innerHTML = '';
    HIST.length = 0;
    addMessage('b', `🙏 <b>Namaste! QueueLess Assistant is online & ready.</b><br>
Ask me about required documents, live queue wait times, or when to leave home!`, true);
    updateChips();
  }

  function updateStatusIndicator() {
    const aist = document.getElementById('aist');
    const ben = document.getElementById('ben');
    if (aist) {
      aist.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#4ade80;margin-right:4px;box-shadow:0 0 6px #4ade80;"></span><span style="color:#fff;font-weight:600;">Online</span>`;
    }
    if (ben) {
      ben.textContent = "Reset Chat";
      ben.title = "Clear chat history";
      ben.onclick = resetChat;
      ben.style.display = "";
    }
  }

  /* ================================================================
     7. INITIALIZATION & EXPORT
  ================================================================ */
  function init() {
    updateStatusIndicator();
    updateChips();

    // Ensure input handles Enter key
    const ci = document.getElementById('ci');
    if (ci) {
      ci.onkeydown = function(e) {
        if (e.key === 'Enter') askQuestion();
      };
    }
  }

  // Export to window
  window.QueueLessBot = {
    ask: askQuestion,
    addMsg: addMessage,
    action: triggerAction,
    resetChat: resetChat,
    init: init,
    DOCS: DOCS,
    OFFICES_INFO: OFFICES_INFO
  };

  window.ask = askQuestion;
  window.addMsg = addMessage;

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 50);
  }

})();
