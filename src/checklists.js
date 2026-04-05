// Atlas Ally — Travel Checklist Templates
// Each template has categories with items
// Items have: id, text, priority (high/med/low), optional note

const CHECKLISTS = {

  predeparture: {
    id: 'predeparture',
    name: 'Pre-Departure',
    icon: '✈️',
    desc: 'Everything to sort before you leave home',
    color: '#2563eb',
    categories: [
      {
        name: 'Documents & Identity',
        items: [
          { id: 'pd1', text: 'Passport valid for 6+ months beyond travel dates', priority: 'high' },
          { id: 'pd2', text: 'Visa obtained (check if required for destination)', priority: 'high' },
          { id: 'pd3', text: 'Make 2 paper copies of passport + visa', priority: 'high' },
          { id: 'pd4', text: 'Photo of passport saved to phone + cloud', priority: 'med' },
          { id: 'pd5', text: 'Travel insurance purchased and policy printed', priority: 'high' },
          { id: 'pd6', text: 'International driving permit (if renting a car)', priority: 'med' },
        ]
      },
      {
        name: 'Health & Vaccinations',
        items: [
          { id: 'ph1', text: 'Required vaccinations completed (check destination)', priority: 'high' },
          { id: 'ph2', text: 'Doctor visit for travel health advice', priority: 'med' },
          { id: 'ph3', text: 'Malaria prophylaxis prescribed if needed', priority: 'high' },
          { id: 'ph4', text: 'Prescription medications packed with extra supply', priority: 'high' },
          { id: 'ph5', text: 'Travel first aid kit packed', priority: 'med' },
          { id: 'ph6', text: 'Confirm health insurance covers international care', priority: 'high' },
        ]
      },
      {
        name: 'Money & Communication',
        items: [
          { id: 'pm1', text: 'Local currency obtained or ATM plan confirmed', priority: 'high' },
          { id: 'pm2', text: 'Notify bank of travel dates and destinations', priority: 'high' },
          { id: 'pm3', text: 'International SIM or roaming plan activated', priority: 'high' },
          { id: 'pm4', text: 'Backup credit card in separate location', priority: 'med' },
          { id: 'pm5', text: 'Emergency cash hidden separately from main wallet', priority: 'med' },
          { id: 'pm6', text: 'Atlas Ally app set up with destination country', priority: 'med' },
        ]
      },
      {
        name: 'Research & Registration',
        items: [
          { id: 'pr1', text: 'Register trip with your country\'s embassy (STEP/FCDO)', priority: 'high' },
          { id: 'pr2', text: 'Save embassy phone number offline', priority: 'high' },
          { id: 'pr3', text: 'Research local laws and customs', priority: 'med' },
          { id: 'pr4', text: 'Check travel advisory level for destination', priority: 'high' },
          { id: 'pr5', text: 'Research safest areas vs areas to avoid', priority: 'med' },
          { id: 'pr6', text: 'Emergency contact updated and aware of itinerary', priority: 'high' },
        ]
      }
    ]
  },

  solo: {
    id: 'solo',
    name: 'Solo Traveler',
    icon: '🎒',
    desc: 'Safety protocols for traveling alone',
    color: '#7c3aed',
    categories: [
      {
        name: 'Before You Go Out',
        items: [
          { id: 'sl1', text: 'Share daily itinerary with emergency contact', priority: 'high' },
          { id: 'sl2', text: 'Agree on a daily check-in time with contact', priority: 'high' },
          { id: 'sl3', text: 'Research neighborhood safety before going out', priority: 'high' },
          { id: 'sl4', text: 'Download offline maps for the area', priority: 'med' },
          { id: 'sl5', text: 'Note nearest hospital and police station address', priority: 'med' },
        ]
      },
      {
        name: 'What to Carry',
        items: [
          { id: 'sc1', text: 'Phone fully charged with portable battery', priority: 'high' },
          { id: 'sc2', text: 'Copy of passport — not original — when exploring', priority: 'high' },
          { id: 'sc3', text: 'Local emergency numbers saved in phone', priority: 'high' },
          { id: 'sc4', text: 'Small amount of cash only — leave valuables in safe', priority: 'med' },
          { id: 'sc5', text: 'Atlas Ally app active with GPS tracking enabled', priority: 'med' },
          { id: 'sc6', text: 'Whistle or personal alarm device', priority: 'low' },
        ]
      },
      {
        name: 'Accommodation Safety',
        items: [
          { id: 'sa1', text: 'Verified accommodation reputation before booking', priority: 'high' },
          { id: 'sa2', text: 'Room on 3rd–6th floor (above break-in, below fire escape height)', priority: 'low' },
          { id: 'sa3', text: 'Door wedge or portable door lock packed', priority: 'med' },
          { id: 'sa4', text: 'Identify emergency exits on arrival', priority: 'med' },
          { id: 'sa5', text: 'Valuables in hotel safe, not in room', priority: 'high' },
        ]
      },
      {
        name: 'Digital Safety',
        items: [
          { id: 'sd1', text: 'VPN installed on phone and laptop', priority: 'med' },
          { id: 'sd2', text: 'Avoid public WiFi for banking / sensitive apps', priority: 'high' },
          { id: 'sd3', text: 'Phone PIN enabled, biometrics set up', priority: 'high' },
          { id: 'sd4', text: 'Cloud backup of all important photos and documents', priority: 'med' },
          { id: 'sd5', text: 'Emergency contacts saved offline (no internet needed)', priority: 'high' },
        ]
      }
    ]
  },

  family: {
    id: 'family',
    name: 'Family Travel',
    icon: '👨‍👩‍👧‍👦',
    desc: 'Safety planning for traveling with children',
    color: '#0891b2',
    categories: [
      {
        name: 'Children\'s Documents',
        items: [
          { id: 'fd1', text: 'Passport for each child valid 6+ months', priority: 'high' },
          { id: 'fd2', text: 'Children\'s visas if required', priority: 'high' },
          { id: 'fd3', text: 'Notarized letter if traveling with one parent', priority: 'high' },
          { id: 'fd4', text: 'Photo ID card for each child (separate from passport)', priority: 'med' },
          { id: 'fd5', text: 'Medical consent form for children (if applicable)', priority: 'med' },
        ]
      },
      {
        name: 'Medical & Health',
        items: [
          { id: 'fm1', text: 'Children\'s vaccinations up to date for destination', priority: 'high' },
          { id: 'fm2', text: 'Pediatric travel medications packed (fever, diarrhea)', priority: 'high' },
          { id: 'fm3', text: 'Child-specific allergy medications and EpiPen if needed', priority: 'high' },
          { id: 'fm4', text: 'Sun protection and insect repellent (child-safe formulas)', priority: 'med' },
          { id: 'fm5', text: 'Local pediatric hospital identified at destination', priority: 'high' },
        ]
      },
      {
        name: 'Safety Protocols',
        items: [
          { id: 'fs1', text: 'Each child knows family meeting point if separated', priority: 'high' },
          { id: 'fs2', text: 'Each child has a card with parent phone number', priority: 'high' },
          { id: 'fs3', text: 'Code word agreed for family emergencies', priority: 'med' },
          { id: 'fs4', text: 'Children briefed: who to ask for help if lost', priority: 'high' },
          { id: 'fs5', text: 'Wristbands with contact info for young children', priority: 'high' },
          { id: 'fs6', text: 'Recent photo of each child saved on phone', priority: 'high' },
        ]
      },
      {
        name: 'Accommodation & Transport',
        items: [
          { id: 'fa1', text: 'Family-friendly accommodation verified', priority: 'med' },
          { id: 'fa2', text: 'Child car seat arranged if needed', priority: 'high' },
          { id: 'fa3', text: 'Pool / balcony safety assessed at accommodation', priority: 'high' },
          { id: 'fa4', text: 'Activity areas checked for age-appropriate safety', priority: 'med' },
        ]
      }
    ]
  },

  business: {
    id: 'business',
    name: 'Business Travel',
    icon: '💼',
    desc: 'Corporate security and professional protocols',
    color: '#1d4ed8',
    categories: [
      {
        name: 'Corporate Security',
        items: [
          { id: 'bc1', text: 'Inform company security team of travel itinerary', priority: 'high' },
          { id: 'bc2', text: 'Obtain company emergency contact protocol', priority: 'high' },
          { id: 'bc3', text: 'Travel insurance through employer confirmed', priority: 'high' },
          { id: 'bc4', text: 'K&R (Kidnap & Ransom) policy confirmed if high-risk destination', priority: 'med' },
          { id: 'bc5', text: 'Company laptop encrypted, VPN configured', priority: 'high' },
        ]
      },
      {
        name: 'Legal & Compliance',
        items: [
          { id: 'bl1', text: 'Research local business laws and restrictions', priority: 'high' },
          { id: 'bl2', text: 'Check export controls for equipment you\'re carrying', priority: 'high' },
          { id: 'bl3', text: 'Understand local dress code for meetings', priority: 'med' },
          { id: 'bl4', text: 'Research gift-giving customs (bribery laws vary)', priority: 'med' },
          { id: 'bl5', text: 'Photography restrictions understood', priority: 'med' },
        ]
      },
      {
        name: 'Digital & Data Security',
        items: [
          { id: 'bd1', text: 'Sensitive data removed from laptop before travel', priority: 'high' },
          { id: 'bd2', text: 'Use burner/travel phone in high-risk countries', priority: 'med' },
          { id: 'bd3', text: 'Do not connect to hotel business center computers', priority: 'high' },
          { id: 'bd4', text: 'Beware "evil maid" attacks — lock screen immediately', priority: 'med' },
          { id: 'bd5', text: 'Change passwords after returning from high-risk trip', priority: 'med' },
        ]
      },
      {
        name: 'Meeting & Transport Safety',
        items: [
          { id: 'bm1', text: 'Pre-booked reputable transport only — no unmarked taxis', priority: 'high' },
          { id: 'bm2', text: 'Meeting location vetted — public, accessible, known', priority: 'med' },
          { id: 'bm3', text: 'Itinerary shared with colleague who is not traveling', priority: 'high' },
          { id: 'bm4', text: 'Profile on social media temporarily limited during trip', priority: 'low' },
        ]
      }
    ]
  },

  gobag: {
    id: 'gobag',
    name: 'Emergency Go-Bag',
    icon: '🎒',
    desc: 'Pack this if you need to evacuate fast',
    color: '#dc2626',
    categories: [
      {
        name: 'Critical Documents (waterproof bag)',
        items: [
          { id: 'gb1', text: 'Passport (original)', priority: 'high' },
          { id: 'gb2', text: 'Cash in local currency + USD/EUR', priority: 'high' },
          { id: 'gb3', text: 'Copies of all key documents', priority: 'high' },
          { id: 'gb4', text: 'Credit/debit cards', priority: 'high' },
          { id: 'gb5', text: 'Emergency contact list — printed, not just on phone', priority: 'high' },
          { id: 'gb6', text: 'Travel insurance policy number and emergency phone', priority: 'high' },
        ]
      },
      {
        name: 'Communication',
        items: [
          { id: 'gc1', text: 'Phone + charger + power bank (fully charged)', priority: 'high' },
          { id: 'gc2', text: 'Battery-powered or hand-crank radio', priority: 'med' },
          { id: 'gc3', text: 'Backup phone with local SIM if available', priority: 'med' },
          { id: 'gc4', text: 'Offline maps downloaded to phone', priority: 'high' },
          { id: 'gc5', text: 'Atlas Ally country brief downloaded offline', priority: 'high' },
        ]
      },
      {
        name: 'Survival Essentials',
        items: [
          { id: 'gs1', text: 'Water (1 litre minimum) + purification tablets', priority: 'high' },
          { id: 'gs2', text: '3-day supply non-perishable food', priority: 'high' },
          { id: 'gs3', text: 'First aid kit with any personal medications', priority: 'high' },
          { id: 'gs4', text: 'Torch/flashlight + spare batteries', priority: 'high' },
          { id: 'gs5', text: 'Multi-tool or Swiss Army knife', priority: 'med' },
          { id: 'gs6', text: 'Emergency whistle', priority: 'med' },
          { id: 'gs7', text: 'Dust/particle mask (N95)', priority: 'med' },
          { id: 'gs8', text: 'Emergency thermal blanket', priority: 'med' },
        ]
      },
      {
        name: 'Clothing & Personal',
        items: [
          { id: 'gp1', text: 'Change of clothes + sturdy closed-toe shoes', priority: 'high' },
          { id: 'gp2', text: '3-day supply of any prescription medications', priority: 'high' },
          { id: 'gp3', text: 'Glasses + spare pair if worn', priority: 'med' },
          { id: 'gp4', text: 'Small amount of toiletries', priority: 'low' },
          { id: 'gp5', text: 'Rain poncho or waterproof jacket', priority: 'med' },
        ]
      }
    ]
  }
};

module.exports = { CHECKLISTS };
